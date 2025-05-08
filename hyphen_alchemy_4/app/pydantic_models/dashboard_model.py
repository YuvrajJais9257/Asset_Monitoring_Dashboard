"""This module contains the pydantic models for the dashboard API."""
from pydantic import EmailStr, validator
from typing import Optional
from typing import Dict, List,Any
from .basic_validation import BaseModelWithHTMLValidation

def validate_database_type(database_type: str):
    """Validate the database type."""
    supported_types = ['mysql', 'postgres', 'vertica']
    if database_type.lower() not in supported_types:
        raise ValueError(f"Unsupported database type. Supported types are {supported_types}")
    return database_type.lower()


class saveFrame_input(BaseModelWithHTMLValidation):
    """Pydantic model for saving a frame."""
    dashboard_json_frame_data: List[Any]
    customer_id: int
    dashboard_report_name: str
    group_id: int
    dashboard_description: Optional[str]
    database_type: str

class getFrame_input(BaseModelWithHTMLValidation):
    """Pydantic model for getting a frame."""
    customer_id: int
    group_id: int
    database_type: str

class updateFrame_input(BaseModelWithHTMLValidation):
    """Pydantic model for updating a frame."""
    dashboard_json_frame_data: List[Any]
    customer_id: int
    old_dashboard_report_name: str
    new_dashboard_report_name: str
    dashboard_description: Optional[str]
    database_type: str

class deleteFrame_input(BaseModelWithHTMLValidation):
    """Pydantic model for deleting a frame."""
    customer_id: int
    frame_name: str
    group_id: int
    database_type: str

class getMultiFrame_input(BaseModelWithHTMLValidation):
    """Pydantic model for getting multiple frames."""
    customer_id: int
    group_id: int
    database_type: str

class findFrame_input(BaseModelWithHTMLValidation):
    """Pydantic model for finding a frame."""
    dashboard_report_name: str
    customer_id: int
    database_type: str

class listAccess_input(BaseModelWithHTMLValidation):
    """Pydantic model for listing access."""
    group_id: int
    customer_id: int
    database_type: str

class listDashboard_input(BaseModelWithHTMLValidation):
    """Pydantic model for listing dashboards."""
    group_id: int
    customer_id: int
    database_type: str

class listDashboardname_input(BaseModelWithHTMLValidation):
    """Pydantic model for listing dashboard names."""
    customer_id: int
    database_type: str

class updateAccess_input(BaseModelWithHTMLValidation):
    """Pydantic model for updating access."""
    customer_id: int
    dashboard_access: Dict
    database_type: str
    group_id: int
    default_dashboard: List
    _validate_database_type = validator('database_type', allow_reuse=True)(validate_database_type)

class editFrame_input(BaseModelWithHTMLValidation):
    """Pydantic model for editing a frame."""
    customer_id: int
    email: EmailStr
    group_id: str
    dashboard_name: str
    database_type: str
