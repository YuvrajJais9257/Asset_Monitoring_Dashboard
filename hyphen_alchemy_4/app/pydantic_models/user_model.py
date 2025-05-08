"""This module contains pydantic model related to user operations"""
from pydantic import EmailStr, validator
from .basic_validation import BaseModelWithHTMLValidation
from typing import Optional
from typing import Dict, List,Any
from datetime import datetime

def validate_database_type(database_type: str):
    """This method verify the database type."""
    supported_types = ['mysql', 'postgres', 'vertica']
    if database_type.lower() not in supported_types:
        raise ValueError(f"Unsupported database type. Supported types are {supported_types}")
    return database_type.lower()

class saveUser_input(BaseModelWithHTMLValidation):
    """Pydantic model for saving user."""
    database_type: str
    new_user_email: str
    password: str
    email: EmailStr
    group_id: int
    _validate_database_type = validator('database_type', allow_reuse=True)(validate_database_type)

class authorization_input(BaseModelWithHTMLValidation):
    """Pydantic model for authorization."""
    username: EmailStr
    database_type: str
    
class validate_login_input(BaseModelWithHTMLValidation):
    """Pydantic model to validate user."""
    username: EmailStr
    password: str
    database_type: str

class expireToken_input(BaseModelWithHTMLValidation):
    """Pydantic model to expireToken."""
    token: str
    database_type: str

class getGroup_input(BaseModelWithHTMLValidation):
    """Pydantic model to get group."""
    email: EmailStr
    database_type: str
    _validate_database_type = validator('database_type', allow_reuse=True)(validate_database_type)

class resetPassword_input(BaseModelWithHTMLValidation):
    """Pydantic model to reset passoword."""
    email: EmailStr
    database_type: str
    new_password:str
    _validate_database_type = validator('database_type', allow_reuse=True)(validate_database_type)

class deleteUser_input(BaseModelWithHTMLValidation):
    """Pydantic model to delete user."""
    email: EmailStr
    database_type: str
    _validate_database_type = validator('database_type', allow_reuse=True)(validate_database_type)

class UserDetails(BaseModelWithHTMLValidation):
    """Pydantic model to get user details."""
    group_id: List
    user_email: str

class AssignGroupDetails(BaseModelWithHTMLValidation):
    """Pydantic model to assign group."""
    customer_id: int
    user_details: List[UserDetails]
    database_type: str

class UserDetails(BaseModelWithHTMLValidation):
    """Pydantic model to get user details."""
    group_id: List
    user_email: str

class FormData(BaseModelWithHTMLValidation):
    """Pydantic model for formdata."""
    customer_id: int
    database_type: str
    user_details: List[UserDetails]

class assignGroup_input(BaseModelWithHTMLValidation):
    """Pydantic model to assign group."""
    formData: FormData

class UserDetails_nested(BaseModelWithHTMLValidation):
    """Pydantic model to get user details."""
    db_details_id: int
    group_id: List[int]
 
class FormData_nested(BaseModelWithHTMLValidation):
    """Pydantic model for formData."""
    customer_id: int
    database_type: str
    user_details: List[UserDetails_nested]
 
class dbsourcegroupmap_input(BaseModelWithHTMLValidation):
    """Pydantic model to get db source group map."""
    formData: FormData_nested
 
class getDBdetails_input(BaseModelWithHTMLValidation):
    """Pydantic model to get db details."""
    customer_id: int
    database_type: str

class GetSchemaNameDetails(BaseModelWithHTMLValidation):
    """Pydantic model to get schema Name Details."""
    customer_id: int
    group_id: int
    connection_type: str
    database_type: str

class requestOTP_input(BaseModelWithHTMLValidation):
    """Pydantic model to requestOTP otp."""
    email: str
    database_type: str
 
class resendOTP_input(BaseModelWithHTMLValidation):
    """Pydantic model to resend otp."""
    email: str
    database_type: str
 
class verifytOTP_input(BaseModelWithHTMLValidation):
    """Pydantic model to verify otp."""
    email: str
    otp:int
    database_type: str
 