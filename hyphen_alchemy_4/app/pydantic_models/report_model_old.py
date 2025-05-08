"""This module contains pydantic models for report related operations"""
from pydantic import EmailStr, validator
from typing import Optional
from typing import Dict, List, Type, Any
from fastapi import UploadFile
from .basic_validation import BaseModelWithHTMLValidation

def validate_database_type(database_type: str):
    """This method validated the databases type"""
    supported_types = ['mysql', 'postgres', 'vertica']
    if database_type.lower() not in supported_types:
        raise ValueError(f"Unsupported database type. Supported types are {supported_types}")
    return database_type.lower()

class getReportTemplates_input(BaseModelWithHTMLValidation):
    """Pydantic model for getting report template."""
    customer_id: int
    email: Optional[EmailStr]
    database_type: str
    group_id: int
    _validate_database_type = validator('database_type', allow_reuse=True)(validate_database_type)

class getReportTemplatealldetail_input(BaseModelWithHTMLValidation):
    """Pydantic model for getting report template detail."""
    email: Optional[EmailStr]
    database_type: str
    _validate_database_type = validator('database_type', allow_reuse=True)(validate_database_type)

class getReportAccesses_input(BaseModelWithHTMLValidation):
    """Pydantic model for getting report Access."""
    group_id: str
    customer_id: str
    database_type: str
    _validate_database_type = validator('database_type', allow_reuse=True)(validate_database_type)

class getReportDetail_input(BaseModelWithHTMLValidation):
    """Pydantic model for getting report Detail."""
    report_id: int
    database_type: str
    chart_colours: Optional[Dict] = {}
    _validate_database_type = validator('database_type', allow_reuse=True)(validate_database_type)

class getGroupwiseReports_input(BaseModelWithHTMLValidation):
    """Pydantic model for getting groupwise report."""
    group_id: str
    database_type: str
    _validate_database_type = validator('database_type', allow_reuse=True)(validate_database_type)

class getReportData_input(BaseModelWithHTMLValidation):
    """Pydantic model for getting report data."""
    report_title: str
    email: Optional[EmailStr]
    page_size : Optional[int] = None
    page_no : Optional[int] = None
    database_type: str
    _validate_database_type = validator('database_type', allow_reuse=True)(validate_database_type)

class reportPreview_input(BaseModelWithHTMLValidation):
    """Pydantic model for getting report preview."""
    report_name: str
    report_type: str
    chart_type: str
    page_size : Optional[int] = None
    page_no : Optional[int] = None
    query: str
    email: Optional[EmailStr]
    database_type: str
    connection_type: str
    schema: str
    _validate_database_type = validator('database_type', allow_reuse=True)(validate_database_type)

class getAssignedReports_input(BaseModelWithHTMLValidation):
    """Pydantic model for getting assigned reports."""
    database_type: str
    customer_id: int
    _validate_database_type = validator('database_type', allow_reuse=True)(validate_database_type)

class getUsers_input(BaseModelWithHTMLValidation):
    """Pydantic model for getting users."""
    email: Optional[EmailStr]
    database_type: str
    _validate_database_type = validator('database_type', allow_reuse=True)(validate_database_type)

class deleteReport_input(BaseModelWithHTMLValidation):
    """Pydantic model for deleting report."""
    report_id: int
    database_type: str
    customer_id: int
    _validate_database_type = validator('database_type', allow_reuse=True)(validate_database_type)

class checkReport_input(BaseModelWithHTMLValidation):
    """Pydantic model for checking report."""
    report_id: int
    database_type: str
    customer_id: int
    _validate_database_type = validator('database_type', allow_reuse=True)(validate_database_type)

class getReportDataId_input(BaseModelWithHTMLValidation):
    """Pydantic model for getting report Data by id."""
    report_id: int
    database_type: str
    email: Optional[EmailStr]
    page_size : Optional[int] = None
    page_no : Optional[int] = None
    _validate_database_type = validator('database_type', allow_reuse=True)(validate_database_type)

class getReportDataId2_input(BaseModelWithHTMLValidation):
    report_id: int
    database_type: str
    email: Optional[EmailStr]
    _validate_database_type = validator('database_type', allow_reuse=True)(validate_database_type)

class getFeatures_input(BaseModelWithHTMLValidation):
    """Pydantic model for getting assigned Features."""
    database_type: str
    email: Optional[EmailStr]
    _validate_database_type = validator('database_type', allow_reuse=True)(validate_database_type)

class assignReports_input(BaseModelWithHTMLValidation):
    """Pydantic model for getting assigned reports."""
    database_type: str
    group_id: int
    report_ids: List[int]
    access_masks: List[str]
    _validate_database_type = validator('database_type', allow_reuse=True)(validate_database_type)

class assignFeatures_input(BaseModelWithHTMLValidation):
    """Pydantic model for assigning Features."""
    database_type: str
    feature_names: List[str]
    group_id: int
    access_masks: List[str]
    email: Optional[EmailStr]
    _validate_database_type = validator('database_type', allow_reuse=True)(validate_database_type)

class getaccessaccordingtogroupid_input(BaseModelWithHTMLValidation):
    """Pydantic model for getting access according to groupid."""
    group_id: int

class getTags_input(BaseModelWithHTMLValidation):
  """Pydantic model for getting report tags."""
  customer_id: int
  connection_type: str
  schema: str
  for_master_report: str
  query: Optional[str] = None
  report_title: Optional[str] = None
  _validate_database_type = validator('connection_type', allow_reuse=True)(validate_database_type)


class checkDrillDown_input(BaseModelWithHTMLValidation):
  """Pydantic model for checking report drilldown."""
  query: str
  type: str
  db_type: Optional[str] = None
  schema_name: Optional[str] = None
  customer_id: Optional[int] = None
  _validate_database_type = validator('db_type', allow_reuse=True)(validate_database_type)

class saveDrillDownReport_input(BaseModelWithHTMLValidation):
  """Pydantic model for saving drilldown report."""
  Master_Column: List[str]
  DrillDown_Column: List[str]
  master_report: str
  drilldown_report: str
  customer_id: int

class getDrillDownData_input(BaseModelWithHTMLValidation):
  """Pydantic model for getting drilldown data."""
  customer_id: int
  filter_value: str
  master_report: str
  page_size : Optional[int] = None
  page_no : Optional[int] = None
  selectedSeriesName: Optional[str] = ''
  database_type: Optional[str] = 'mysql'

class updateDrillDownReport_input(BaseModelWithHTMLValidation):
  """Pydantic model for updating drilldown report."""
  DrillDown_Column: List[str]
  Master_Column: List[str]
  master_report: str
  drilldown_report: str
  customer_id: int

class getUpdateDrillDown_input(BaseModelWithHTMLValidation):
  """Pydantic model for getting updated drilldown report."""
  type: str
  schema_name: str
  master_report: str
  query: str
  customer_id: int
  db_type: str
  _validate_database_type = validator('db_type', allow_reuse=True)(validate_database_type)

class insert_data_input(BaseModelWithHTMLValidation):
    """Pydantic model for inserting data."""
    title: str
    file_path: str
    selected_columns: List[str]
 
class chart_input(BaseModelWithHTMLValidation):
    """Pydantic model for chart."""
    chart_type: str
    selected_columns: List[str]
    column_types: Dict[str, str]
    table_name: str
    report_title: str

class Condition(BaseModelWithHTMLValidation):
    """Pydantic model for conditions"""
    selected_column: str
    selected_condition: str
    value: Optional[str] = None
 
class filter_input(BaseModelWithHTMLValidation):
    """Pydantic model for filtering."""
    chart_type: str
    selected_columns: List[str]
    column_types: Dict[str, str]
    table_name: str
    report_title: str
    conditions: List[Condition]

class updateReport_input(BaseModelWithHTMLValidation):
    """Pydantic model to update report."""
    report_template_name: Optional[str] = None
    report_id: int = None
    database_type: str = None
    chart_colours: Optional[Dict] = None
    report_type: Optional[str] = None
    chart_type: Optional[str] = None
    enable_labels: Optional[str] = None
    defined_query: Optional[str] = None
    enable_drilldown: Optional[str] = None
    auto_update_interval: int = None
    time_period: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    email: Optional[EmailStr] = None
    connection_type: Optional[str] = None
    schema: Optional[str] = None
    display_order: int = None
    background_colour: Optional[str] = None
    chart_react_colour: Optional[str] = None
    font_size_title: Optional[str] = None
    font_size_value: Optional[str] = None
    subtitle_size: Optional[str] = None
    subtitle: Optional[str] = None
    subtitle_text: Optional[str] = None
    layout: Optional[str] = None
    layout_value: Optional[str] = None
    gradient_mode: Optional[str] = None
    text_alignment: Optional[str] = None
    box_customization_options: Optional[Dict] = {}
    chart_customizations_options: Optional[dict] = None

class UploadImageRequest(BaseModelWithHTMLValidation):
    """Pydantic model for uploading image."""
    feature_name: str
    customer_id: str
    database_type: str

class upload_csv_input(BaseModelWithHTMLValidation):
    """Pydantic model for uploading csv."""
    file_location: str

class getschemanamedetail_input(BaseModelWithHTMLValidation):
    """Pydantic model to get schema details."""
    customer_id: int
    group_id: int
    connection_type: str
    database_type : str

class fetchUniques_input(BaseModelWithHTMLValidation):
    """Pydantic model for fetching Uniques input."""
    customer_id: int
    report_id: Optional[int] = None
    report_name: Optional[str] = None
    column_name: str
    database_type : str
    _validate_database_type = validator('database_type', allow_reuse=True)(validate_database_type)
    selectedSeriesName : Optional[str] = None
    flag : Optional[str] = None
    filter_value : Optional[str] = None    

class getbulkchart_input(BaseModelWithHTMLValidation):
    """Pydantic model for getting bulk chart data."""
    customer_id: int
    report_id: Optional[int] = None
    report_name: Optional[str] = None
    filter_options: Optional[list] = None
    filter_operations: Optional[list] = None
    database_type : str
    page_size: Optional[int] = None
    page_no: Optional[int] = None
    _validate_database_type = validator('database_type', allow_reuse=True)(validate_database_type)
    selectedSeriesName : Optional[str] = None
    flag : Optional[str] = None
    filter_value : Optional[str] = None 
    sorting_options: Optional[list] = None

class generateReports_input(BaseModelWithHTMLValidation):
    """Pydantic model for generating reports."""
    customer_id: int
    report_id: Optional[int] = None
    report_name: Optional[str] = None
    filter_options: Optional[list] = None
    filter_operations: Optional[list] = None
    database_type : str
    file_format: str
    column_names: Optional[List[str]] = None
    _validate_database_type = validator('database_type', allow_reuse=True)(validate_database_type)
    selectedSeriesName : Optional[str] = None
    flag : Optional[str] = None
    filter_value : Optional[str] = None
    sorting_options: Optional[list] = None
