"""
FastAPI application — AI Metadata Catalog Assistant backend.
All routes for upload, metadata generation, chat, and history.
Uses MongoDB Atlas for storage and a simple UUID-based user identification.
"""

import os
import uuid
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from parser import parse_csv, parse_sql
from agent import generate_column_metadata, chat_with_metadata, clear_chat_memory
from mongo_client import save_catalog_entry, get_user_history

# ── App Setup ──────────────────────────────────────────────────────────────────

app = FastAPI(
    title="AI Metadata Catalog Assistant",
    description="Analyze datasets and generate AI-powered metadata catalogs",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://ai-metadata-catalog.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── User ID Extraction ────────────────────────────────────────────────────────

def get_user_id(request: Request) -> str:
    """
    Extract the user_id from the X-User-Id header.
    The frontend generates a random UUID on first visit and stores it in localStorage.
    """
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        raise HTTPException(status_code=400, detail="Missing X-User-Id header")
    return user_id


# ── Request / Response Models ──────────────────────────────────────────────────

class SQLSchemaRequest(BaseModel):
    sql_text: str
    schema_name: Optional[str] = None


class GenerateMetadataRequest(BaseModel):
    schema_name: str
    columns: list


class ChatRequest(BaseModel):
    message: str
    metadata: list
    session_id: Optional[str] = None


# ── Routes ─────────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"message": "AI Metadata Catalog Assistant API", "status": "running"}


@app.post("/upload/csv")
async def upload_csv(
    request: Request,
    file: UploadFile = File(...),
    schema_name: Optional[str] = Form(None),
):
    """
    Upload a CSV file and parse column information.
    Returns structured JSON with column names, inferred types, and sample values.
    """
    get_user_id(request)  # Validate user_id is present

    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    try:
        content = await file.read()
        result = parse_csv(content, file.filename)

        if schema_name:
            result["schema_name"] = schema_name

        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process CSV: {str(e)}")


@app.post("/upload/sql")
async def upload_sql(
    request: Request,
    body: SQLSchemaRequest,
):
    """
    Parse a raw SQL CREATE TABLE statement.
    Returns structured JSON with column names and declared types.
    """
    get_user_id(request)  # Validate user_id is present

    try:
        result = parse_sql(body.sql_text)

        if body.schema_name:
            result["schema_name"] = body.schema_name

        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse SQL: {str(e)}")


@app.post("/generate-metadata")
async def generate_metadata(
    request: Request,
    body: GenerateMetadataRequest,
):
    """
    Generate AI-powered metadata for parsed schema columns.
    Saves the result to MongoDB under the user's UUID.
    """
    user_id = get_user_id(request)

    if not body.columns:
        raise HTTPException(status_code=400, detail="No columns provided")

    try:
        # Generate metadata using the LLM agent
        metadata = await generate_column_metadata(body.columns)

        # Save to MongoDB
        try:
            saved = save_catalog_entry(
                user_id=user_id,
                schema_name=body.schema_name,
                raw_schema=body.columns,
                metadata=metadata,
            )
        except Exception as db_error:
            # Log but don't fail — metadata was still generated
            print(f"Warning: Failed to save to MongoDB: {db_error}")
            saved = None

        return {
            "schema_name": body.schema_name,
            "metadata": metadata,
            "saved": saved is not None,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Metadata generation failed: {str(e)}")


@app.post("/chat")
async def chat(
    request: Request,
    body: ChatRequest,
):
    """
    Chat with the AI about the dataset metadata.
    Uses conversation memory for multi-turn interactions.
    """
    get_user_id(request)  # Validate user_id is present

    if not body.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    session_id = body.session_id or str(uuid.uuid4())

    try:
        response = await chat_with_metadata(
            message=body.message,
            metadata=body.metadata,
            session_id=session_id,
        )

        return {
            "response": response,
            "session_id": session_id,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")


@app.delete("/chat/{session_id}")
async def clear_chat(
    session_id: str,
    request: Request,
):
    """Clear chat memory for a specific session."""
    get_user_id(request)
    clear_chat_memory(session_id)
    return {"message": "Chat memory cleared"}


@app.get("/history")
async def history(request: Request):
    """
    Retrieve all previously analyzed schemas for the user identified by X-User-Id.
    """
    user_id = get_user_id(request)

    try:
        entries = get_user_history(user_id)
        return {"entries": entries}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch history: {str(e)}")


# ── Error Handlers ─────────────────────────────────────────────────────────────

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail},
    )
