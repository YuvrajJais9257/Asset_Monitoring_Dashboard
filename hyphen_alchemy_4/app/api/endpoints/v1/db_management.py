"""
Module for managing database-management-related endpoints.
"""

from typing import Optional
from service.DBAPI import DatabaseManager
from utilities.auth import AuthManager
from fastapi import UploadFile, Form, Request
from fastapi import APIRouter
from pydantic import BaseModel
from pydantic_models.db_model import save_connection_input, get_schema_input,\
      get_schema_metadata_input, check_query_input, add_group_input, LoginData


auth_manager = AuthManager()
db_manager = DatabaseManager()
router = APIRouter()


# left
@router.post("/save_connection")
async def save_connection(request: Request, details: save_connection_input):
    """Endpoint to Save database connection."""
    await auth_manager.check_token(request)
    return db_manager.save_connection(details.model_dump(by_alias=True))

@router.post("/get_schema")
async def get_schema(request: Request, user_details: get_schema_input):
    """Endpoint to Get database schema."""
    await auth_manager.check_token(request)
    return db_manager.get_schema(user_details.model_dump(by_alias=True))

@router.post("/get_schema_metadata")
async def access_schema_metadata(request: Request, schema: get_schema_metadata_input):
    """Endpoint to Get schema metadata."""
    await auth_manager.check_token(request)
    return await db_manager.access_schema_metadata(schema.model_dump(by_alias=True))

@router.post("/save_report_template")
async def save_report_template(
    request: Request,
    report_template_name: str = Form(...),
    file: Optional[UploadFile] = None,
    ):
    """Endpoint to Save report template."""
    await auth_manager.check_token(request)
    return await db_manager.save_report_template(report_template_name, file)

@router.post("/check_query")
async def check_query(request: Request, query_details: check_query_input):
    """Endpoint to Check query validity."""
    await auth_manager.check_token(request)
    return await db_manager.check_query(query_details.model_dump(by_alias=True))

@router.post("/addGroup")
async def add_group(request: Request, details: add_group_input):
    """Endpoint to Add a new group."""
    await auth_manager.check_token(request)
    return await db_manager.add_group(details.model_dump(by_alias=True))
