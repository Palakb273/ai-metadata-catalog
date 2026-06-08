"""
MongoDB Atlas client and helper functions for catalog operations.
"""

import os
from datetime import datetime, timezone
from uuid import uuid4
from pymongo import MongoClient, DESCENDING
from dotenv import load_dotenv

try:
    import certifi
    ca = certifi.where()
except ImportError:
    ca = None

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")

_client: MongoClient | None = None


def get_db():
    """Returns the MongoDB database instance, lazily connecting on first call."""
    global _client
    if _client is None:
        kwargs={
            "tls":True,
            "tlsAllowInvalidCertificates": True,
        }
        if ca:
            kwargs["tlsCAFile"]=ca
        _client = MongoClient(MONGODB_URI, **kwargs)
    return _client["metadata_catalog"]


def get_catalog_collection():
    """Returns the catalog_entries collection."""
    return get_db()["catalog_entries"]


def save_catalog_entry(user_id: str, schema_name: str, raw_schema: list, metadata: list) -> dict:
    """
    Save a catalog entry to MongoDB.
    Returns the inserted document (without the internal _id).
    """
    collection = get_catalog_collection()
    doc = {
        "id": str(uuid4()),
        "user_id": user_id,
        "schema_name": schema_name,
        "raw_schema": raw_schema,
        "metadata": metadata,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    collection.insert_one(doc)
    doc.pop("_id", None)
    return doc


def get_user_history(user_id: str) -> list:
    """
    Retrieve all catalog entries for a specific user, ordered by creation date descending.
    """
    collection = get_catalog_collection()
    cursor = (
        collection.find({"user_id": user_id}, {"_id": 0})
        .sort("created_at", DESCENDING)
    )
    return list(cursor)
