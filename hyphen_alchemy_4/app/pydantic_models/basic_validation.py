"""
This module contains a Pydantic model with a custom validator to prevent HTML tags in input strings.
"""
from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from typing import Dict, List, Type, Any
from fastapi import UploadFile
import re

def validate_no_html_tags(value: str) -> str:
    """
    Validate that the input does not contain HTML tags.
    
    Args:
        value (str): The input string to validate
    
    Raises:
        ValueError: If HTML tags are detected in the input
    
    Returns:
        str: The original input if no HTML tags are found
    """
    # Regular expression to detect HTML tags
    html_tag_pattern = re.compile(r'<[^>]+>')
    
    # If the value is a string and contains HTML tags
    if isinstance(value, str) and html_tag_pattern.search(value):
        raise ValueError("Input cannot contain HTML tags")
    
    return value

class BaseModelWithHTMLValidation(BaseModel):
    """
    Pydantic model with a custom validator to prevent HTML tags in input strings.
    """
    @validator('*', pre=True, always=True)
    def validate_no_html_in_strings(cls, value):
        if isinstance(value, str):
            return validate_no_html_tags(value)
        elif isinstance(value, (list, tuple, set, dict)):  # Check if value is a collection
            return value
        return value
