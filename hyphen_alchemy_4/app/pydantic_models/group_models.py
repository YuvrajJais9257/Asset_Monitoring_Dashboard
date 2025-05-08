"""This module contains pydantic model ralated to group operations"""
from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from typing import Dict, List,Any
from .basic_validation import BaseModelWithHTMLValidation


def validate_database_type(database_type: str):
    """Method validate the database type"""
    supported_types = ['mysql', 'postgres', 'vertica']
    if database_type.lower() not in supported_types:
        raise ValueError(f"Unsupported database type. Supported types are {supported_types}")
    return database_type.lower()

class updateGroupName_input(BaseModelWithHTMLValidation):
    """Pydantic model for updating group name"""
    new_group_name: str
    customer_id: int
    group_id: int
    database_type: str
    
class checkMember_input(BaseModelWithHTMLValidation):
    """Pydantic model for checking group member."""
    groupname: str
    customer_id: int
    group_id: int
    database_type: str

class deleteGroup_input(BaseModelWithHTMLValidation):
    """Pydantic model for deleting group"""
    customer_id: int
    group_id: int
    database_type: str