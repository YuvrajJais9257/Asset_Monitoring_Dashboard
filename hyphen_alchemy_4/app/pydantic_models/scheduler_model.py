"""This module contains pydantic model related to schedular operations"""
from pydantic import EmailStr, validator
from typing import Optional
from typing import Dict, List,Any
from datetime import datetime
from .basic_validation import BaseModelWithHTMLValidation

def validate_database_type(database_type: str):
    supported_types = ['mysql', 'postgres', 'vertica']
    if database_type.lower() not in supported_types:
        raise ValueError(f"Unsupported database type. Supported types are {supported_types}")
    return database_type.lower()


class saveScheduler_input(BaseModelWithHTMLValidation):
    reportTitle: str
    reportattachment: Dict
    selectedreport: Optional[str] = None
    scheduledTime: datetime
    emailTo: List[str]
    emailCC: Optional[List[str]] = []
    emailBody: Optional[str] = None
    interval: str 
    startDate: Optional[datetime] = None
    customer_id: int
    group_id : int
    database_type: str

class getEmails_input(BaseModelWithHTMLValidation):
    username: str
    database_type: str


class listScheduler_input(BaseModelWithHTMLValidation):
    customer_id: int
    group_id : int
    database_type: str

class updateScheduler_input(BaseModelWithHTMLValidation):
    scheduleid: str
    scheduledTime: str
    interval: str
    customer_id: int
    emailTo: List[str]
    emailCC: Optional[List[str]] = []
    startDate: Optional[str] = None
    reportTitle: str
    selectedreport: Optional[str] = None
    emailBody: Optional[str] = None
    reportattachment: Dict
    database_type: str

class deleteScheduler_input(BaseModelWithHTMLValidation):
    scheduleid: int
    customer_id: int
    database_type: str


class getSchedulerbyId_input(BaseModelWithHTMLValidation):
    scheduleid: int
    customer_id: int
    database_type: str
    
