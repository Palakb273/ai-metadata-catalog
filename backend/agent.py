"""
LangChain agent setup for metadata generation and conversational chat.
Uses Groq API with Llama3-70b model.
"""

import os
import json
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

load_dotenv()

# ── LLM Setup ──────────────────────────────────────────────────────────────────

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    api_key=os.getenv("GROQ_API_KEY"),
    temperature=0.1,
    max_tokens=1024,
)

# ── Metadata Generation ───────────────────────────────────────────────────────

METADATA_PROMPT_TEMPLATE = """You are a data catalog AI assistant. Analyze the following database column and generate metadata.

Column Name: {column_name}
Data Type (inferred): {inferred_type}
Sample Values: {sample_values}

Return ONLY a valid JSON object with this exact structure:
{{
  "description": "1-2 sentence human-readable description of what this column represents",
  "data_type_tag": "one of: Numeric, Categorical, DateTime, Boolean, Text, ID",
  "sensitivity_tag": "one of: PII, Financial, Health, Internal, Public",
  "sensitivity_level": "one of: High, Medium, Low"
}}
Do not include any explanation or markdown. Return only the JSON."""


def _parse_llm_json(text: str) -> dict:
    """
    Parse JSON from LLM response, handling common formatting issues.
    """
    text = text.strip()

    # Remove markdown code blocks if present
    if text.startswith("```"):
        lines = text.split("\n")
        # Remove first and last lines (the ``` markers)
        lines = [l for l in lines if not l.strip().startswith("```")]
        text = "\n".join(lines).strip()

    # Try to extract JSON object from the text
    start = text.find("{")
    end = text.rfind("}") + 1
    if start != -1 and end > start:
        text = text[start:end]

    return json.loads(text)


async def generate_column_metadata(columns: list) -> list:
    """
    Generate metadata for each column using the LLM.
    Includes retry logic for malformed JSON responses.

    Args:
        columns: List of dicts with column_name, inferred_type, sample_values

    Returns:
        List of dicts with original column info plus generated metadata
    """
    metadata_prompt = ChatPromptTemplate.from_template(METADATA_PROMPT_TEMPLATE)
    chain = metadata_prompt | llm | StrOutputParser()

    results = []

    for col in columns:
        sample_str = ", ".join(str(v) for v in col.get("sample_values", []))
        if not sample_str:
            sample_str = "No samples available"

        input_data = {
            "column_name": col["column_name"],
            "inferred_type": col["inferred_type"],
            "sample_values": sample_str,
        }

        # Retry logic — up to 3 attempts (1 initial + 2 retries)
        metadata = None
        last_error = None

        for attempt in range(3):
            try:
                response = await chain.ainvoke(input_data)
                metadata = _parse_llm_json(response)

                # Validate required keys
                required_keys = {"description", "data_type_tag", "sensitivity_tag", "sensitivity_level"}
                if not required_keys.issubset(metadata.keys()):
                    missing = required_keys - set(metadata.keys())
                    raise ValueError(f"Missing keys in response: {missing}")

                # Validate enum values
                valid_type_tags = {"Numeric", "Categorical", "DateTime", "Boolean", "Text", "ID"}
                valid_sens_tags = {"PII", "Financial", "Health", "Internal", "Public"}
                valid_sens_levels = {"High", "Medium", "Low"}

                if metadata["data_type_tag"] not in valid_type_tags:
                    metadata["data_type_tag"] = "Text"  # Default fallback
                if metadata["sensitivity_tag"] not in valid_sens_tags:
                    metadata["sensitivity_tag"] = "Internal"
                if metadata["sensitivity_level"] not in valid_sens_levels:
                    metadata["sensitivity_level"] = "Medium"

                break  # Success
            except (json.JSONDecodeError, ValueError, KeyError) as e:
                last_error = e
                metadata = None

        if metadata is None:
            # Fallback metadata if all retries fail
            metadata = {
                "description": f"Column '{col['column_name']}' with type {col['inferred_type']}. (Auto-generated fallback — LLM parsing failed: {str(last_error)})",
                "data_type_tag": "Text",
                "sensitivity_tag": "Internal",
                "sensitivity_level": "Medium",
            }

        results.append({
            "column_name": col["column_name"],
            "inferred_type": col["inferred_type"],
            "sample_values": col.get("sample_values", []),
            **metadata,
        })

    return results


from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

# ── Chat Agent ─────────────────────────────────────────────────────────────────

# Store conversation memories by session ID
_chat_memories: dict[str, list] = {}

CHAT_SYSTEM_PROMPT = """You are a helpful data catalog assistant. You have access to the metadata of a dataset that the user has uploaded. Use this metadata to answer their questions accurately and concisely.

Here is the dataset metadata:
{metadata}

Guidelines:
- Answer questions about the dataset columns, their descriptions, data types, sensitivity tags, and sensitivity levels
- If asked about PII or sensitive data, identify columns with relevant sensitivity tags
- If asked whether data is safe to share, evaluate based on sensitivity levels
- Be concise but thorough in your answers
- If the metadata doesn't contain enough information to answer, say so
- Format your responses clearly, using bullet points or lists when appropriate"""


def get_or_create_memory(session_id: str) -> list:
    """Get or create a conversation memory for a session."""
    if session_id not in _chat_memories:
        _chat_memories[session_id] = []
    return _chat_memories[session_id]


async def chat_with_metadata(
    message: str,
    metadata: list,
    session_id: str = "default",
) -> str:
    """
    Chat with the AI about the dataset metadata.
    Uses an in-memory list for multi-turn conversations.

    Args:
        message: User's question
        metadata: List of column metadata dicts
        session_id: Unique session identifier for memory persistence

    Returns:
        AI response as plain text
    """
    history = get_or_create_memory(session_id)

    # Format metadata as readable context
    metadata_str = json.dumps(metadata, indent=2)
    system_msg = SystemMessage(content=CHAT_SYSTEM_PROMPT.format(metadata=metadata_str))

    messages = [system_msg] + history + [HumanMessage(content=message)]

    response = await llm.ainvoke(messages)

    history.append(HumanMessage(content=message))
    history.append(AIMessage(content=response.content))

    return str(response.content)


def clear_chat_memory(session_id: str) -> None:
    """Clear the chat memory for a specific session."""
    if session_id in _chat_memories:
        del _chat_memories[session_id]
