"""This module contains the pydantic models for the chatbot API."""
from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from typing import Dict, List
from fastapi import UploadFile
from .basic_validation import BaseModelWithHTMLValidation

def validate_database_type(database_type: str):
    """Validate the database type."""
    supported_types = ['mysql', 'postgres', 'vertica']
    if database_type.lower() not in supported_types:
        raise ValueError(f"Unsupported database type. Supported types are {supported_types}")
    return database_type.lower()

class query_input(BaseModelWithHTMLValidation):
    """Schema for the query request body."""
    question: str
    mode: str
    email: Optional[EmailStr]
    database_type: str
    connection_type: str
    schema: str
    _validate_database_type = validator('database_type', allow_reuse=True)(validate_database_type)