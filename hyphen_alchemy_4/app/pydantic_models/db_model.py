"""This module contains pyadntic models for database related operations"""
from pydantic import EmailStr, validator
from typing import Optional
from .basic_validation import BaseModelWithHTMLValidation
from typing import Dict, List,Type,Any
from fastapi import UploadFile
import re
from pydantic import EmailStr, validator, BaseModel


def validate_database_type(database_type: str):
    """method Validate database types"""
    supported_types = ['mysql', 'postgres', 'vertica']
    if database_type.lower() not in supported_types:
        raise ValueError(f"Unsupported database type. Supported types are {supported_types}")
    return database_type.lower()


class save_connection_input(BaseModelWithHTMLValidation):
    """Pydantic model for saving connection."""
    active_user: str
    connection_type: str
    database_type: str
    host: str
    password: str
    port: str
    schema: str
    username: str
    group_id : int
    save: str
    _validate_database_type = validator('database_type', allow_reuse=True)(validate_database_type)


class get_schema_input(BaseModelWithHTMLValidation):
    """Pydantic model for getting schema."""
    database_type: str
    email: Optional[EmailStr]
    connection_type: str
    _validate_database_type = validator('database_type', allow_reuse=True)(validate_database_type)


class get_schema_metadata_input(BaseModelWithHTMLValidation):
    """Pydantic model for getting schema metadata."""
    database_type: str
    email: Optional[EmailStr]
    schema_name: str
    _validate_database_type = validator('database_type', allow_reuse=True)(validate_database_type)


class check_query_input(BaseModel):
    """Pydantic model for checking query."""
    database_type: str
    email: Optional[EmailStr]
    schema: str
    query: str
    connection_type: str
    _validate_database_type = validator('database_type', allow_reuse=True)(validate_database_type)


class add_group_input(BaseModelWithHTMLValidation):
    """Pydantic model for adding group"""
    database_type: str
    group_name: str
    customer_id: int
    _validate_database_type = validator('database_type', allow_reuse=True)(validate_database_type)


class LoginData(BaseModelWithHTMLValidation):
    """Login data model."""
    username: str
    password: str


class save_report_template_input(BaseModelWithHTMLValidation):
    """Pydantic model to save report template"""
    report_template_name: str
    chart_colours: Optional[dict] = {}
    report_type: str
    chart_type: Optional[str] = ''
    defined_query: str
    enable_drilldown: Optional[str] = 'no'
    enable_labels: Optional[str] = 'no'
    enable_analytics: Optional[str] = 'no'
    auto_update_interval: int
    time_period: str
    start_date: str
    end_date: str
    email: str
    database_type: str
    connection_type: str
    schema: str
    display_order: int
    background_colour: Optional[str] = ''
    chart_react_colour: Optional[str] = ''
    font_size_title: Optional[str] = ''
    font_size_value: Optional[str] = ''
    subtitle_size: Optional[str] = ''
    subtitle: Optional[bool] = False
    subtitle_text: Optional[str] = ''
    layout: Optional[bool] = False
    layout_value: Optional[str] = ''
    gradient_mode: Optional[str] = ''
    text_alignment: Optional[str] = ''
    chart_subtitle: Optional[str] = ''
