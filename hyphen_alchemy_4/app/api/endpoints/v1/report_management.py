"""
Module for managing report management related endpoints.
"""
from typing import Optional, Dict
from fastapi import UploadFile, File, Form, Request
from fastapi import APIRouter
from service.ReportAPI import ReportManager
from utilities.auth import AuthManager
from pydantic_models.report_model import filter_input, insert_data_input, chart_input,\
    getReportTemplates_input,getReportTemplatealldetail_input,getReportAccesses_input,\
        getReportDetail_input, getGroupwiseReports_input,getReportData_input,reportPreview_input,\
            getAssignedReports_input,getUsers_input,deleteReport_input,checkReport_input,\
                getReportDataId_input,getReportDataId2_input,getFeatures_input,assignReports_input,\
                    assignFeatures_input,getaccessaccordingtogroupid_input,getTags_input,\
                        checkDrillDown_input,saveDrillDownReport_input,getDrillDownData_input,\
                            updateDrillDownReport_input,getUpdateDrillDown_input,getschemanamedetail_input,\
                            getbulkchart_input,fetchUniques_input,generateReports_input

auth_manager = AuthManager()
report_manager = ReportManager()
router = APIRouter()


async def verify_token(request: Request):
    """Verify authentication token."""
    await auth_manager.check_token(request)

@router.post("/getReportTemplates")
async def get_report_templates(user_details: getReportTemplates_input, request: Request):
    """
    Endpoint to Get list of report templates based on provided details.
    """
    await verify_token(request)
    return await report_manager.get_report(user_details.model_dump(by_alias=True))

@router.post("/getReportTemplatealldetail")
async def get_report_template_all_details(user_details: getReportTemplatealldetail_input, request: Request):
    """
    Endpoint to Get report template all details with the provided details.
    """
    await verify_token(request)
    return await report_manager.get_reportTemplate(user_details.model_dump(by_alias=True))

@router.post("/getReportAccesses")
async def get_report_accesses(user_details: getReportAccesses_input, request: Request):
    """
    Endpoint to Get report access details for a specific user group with the provided details.
    """
    await verify_token(request)
    return await report_manager.get_access(user_details.model_dump(by_alias=True))

@router.post("/getReportDetail")
async def get_report_detail(user_details: getReportDetail_input, request: Request):
    """
    Endpoint to Get particular report details with the provided details.
    """
    await verify_token(request)
    return await report_manager.get_report_detail(user_details.model_dump(by_alias=True))

@router.post("/getGroupwiseReports")
async def get_groupwise_reports(user_details: getGroupwiseReports_input, request: Request):
    """
    Endpoint to Get group-wise reports with the provided details.
    """
    await verify_token(request)
    return await report_manager.getGroupwiseReports(user_details.model_dump(by_alias=True))

@router.post("/getReportData")
async def get_report_data(report_details: getReportData_input, request: Request):
    """
    Endpoint to Get particular report data with the provided details.
    """
    await verify_token(request)
    return await report_manager.get_report_data(report_details.model_dump(by_alias=True))

@router.post("/reportPreview")
async def report_preview(report_details: reportPreview_input, request: Request):
    """
    Endpoint to Get preview of particular report with the provided details.
    """
    await verify_token(request)
    return await report_manager.getPreview(report_details.model_dump(by_alias=True))

@router.post("/getAssignedReports")
async def get_assigned_reports(report_details: getAssignedReports_input, request: Request):
    """
    Endpoint to Get assigned reports of a particular customer with the provided details.
    """
    await verify_token(request)
    return await report_manager.getAssignedReports(report_details.model_dump(by_alias=True))

@router.post("/getUsers")
async def get_users(user_details: getUsers_input, request: Request):
    """
    Endpoint to Get list of Users with the provided details.
    """
    await verify_token(request)
    return await report_manager.getUsers(user_details.model_dump(by_alias=True))

@router.post("/deleteReport")
async def delete_report(report_details: deleteReport_input, request: Request):
    """
    Endpoint to Delete report with the provided details.
    """
    await verify_token(request)
    return await report_manager.delete(report_details.model_dump(by_alias=True))

@router.post("/checkReport")
async def check_report(report_details: checkReport_input, request: Request):
    """
    Endpoint to Check the status or validity of a report with the provided details.
    """
    await verify_token(request)
    return await report_manager.checkReport(report_details.model_dump(by_alias=True))

@router.post("/getReportDataId")
async def get_report_data_id(report_details: getReportDataId_input, request: Request):
    """
    Endpoint to Get report data with the provided report id.
    """
    await verify_token(request)
    return await report_manager.get_report_data_id(report_details.model_dump(by_alias=True))

@router.post("/getReportDataId2")
async def get_report_data_id2(report_details: getReportDataId2_input, request: Request):
    """
    Endpoint to Get report data with the provided report id.
    """
    await verify_token(request)
    return await report_manager.get_report_data_id2(report_details.model_dump(by_alias=True))

@router.post("/updateReport")
async def update_report(details: str = Form(...), file: Optional[UploadFile] = None, request: Request = None):
    """
    Endpoint to Update report with the provided report id.
    """
    try:
        await verify_token(request)
        return await report_manager.updateReport(details,file)
    except Exception as e:
        return {"error": str(e)}

@router.post("/getFeatures")
async def get_features(details: getFeatures_input, request: Request):
    """
    Endpoint to Retrieve a list of features(user management,dashboard management etc.) assigned to particular customer.
    """
    await verify_token(request)
    return await report_manager.getFeatures(details.model_dump(by_alias=True))

@router.post("/addFeature")
async def add_feature(file: UploadFile = File(...), feature_name: str = Form(...), customer_id: str = Form(...), database_type: str = Form(...), request: Request = None):
    """
    Endpoint to assigned feature to particular customer.
    """
    await verify_token(request)
    return await report_manager.upload_image(file,feature_name,customer_id, database_type)

@router.post("/assignReports")
async def assign_reports(details: assignReports_input, request: Request):
    """
    Endpoint to Assign reports to a user or group.
    """
    await verify_token(request)
    return await report_manager.assignReports(details.model_dump(by_alias=True))

@router.post("/assignFeatures")
async def assign_features(details: assignFeatures_input, request: Request):
    """
    Endpoint to Assign features to a user or group
    """
    await verify_token(request)
    return await report_manager.assignFeatures(details.model_dump(by_alias=True))

@router.post('/getaccessaccordingtogroupid')
async def get_access_according_to_group_id(details: getaccessaccordingtogroupid_input, request: Request):
    """
    Endpoint to Get access(featurename, accessmask etc.) details according to group ID.
    """
    await verify_token(request)
    return await report_manager.accessmask(details.model_dump(by_alias=True))

@router.post("/getTags")
async def get_tags(details: getTags_input, request: Request):
    """
    Endpoint to Retrieve a list of tags(columns name and data types) of a particular report.
    """
    await verify_token(request)
    return await report_manager.gettags(details.model_dump(by_alias=True))

@router.post("/checkDrillDown")
async def check_drill_down(details: checkDrillDown_input, request: Request):
    """
    Endpoint to Check drill-down capabilities of a report
    """
    await verify_token(request)
    return await report_manager.check(details.model_dump(by_alias=True))

@router.post("/saveDrillDownReport")
async def save_drill_down_report(details: saveDrillDownReport_input, request: Request):
    """
    Endpoint to Save a drill-down report
    """
    await verify_token(request)
    return await report_manager.save_drill(details.model_dump(by_alias=True))

@router.post("/getDrillDownData")
async def get_drill_down_data(details: getDrillDownData_input, request: Request):
    """Endpoint to Get drill down data. of particular report."""
    await verify_token(request)
    return await report_manager.getdata(details.model_dump(by_alias=True))

@router.post("/updateDrillDownReport")
async def update_drill_down_report(details: updateDrillDownReport_input, request: Request):
    """Endpoint to Update particular drill down report."""
    await verify_token(request)
    return await report_manager.save_update_drill(details.model_dump(by_alias=True))

@router.post("/getUpdateDrillDown")
async def get_update_drill_down(details: getUpdateDrillDown_input, request: Request):
    """Endpoint to Get updated drill-down information of particular report."""
    await verify_token(request)
    return await report_manager.save_get_drill(details.model_dump(by_alias=True))

@router.post("/getschemanamedetail")
async def get_schema_name(details: getschemanamedetail_input, request: Request):
    """Endpoint to Get schema details of a particular report."""
    await verify_token(request)
    return await report_manager.get_schema_name(details.model_dump(by_alias=True)) 

@router.post("/getbulkchart")
async def getbulkchart(details: getbulkchart_input, request: Request):
    """Endpoint to Get bulk chart of a particular report."""
    await verify_token(request)
    return await report_manager.get_bulk_chart(details.model_dump(by_alias=True))

@router.post("/fetchUniques")
async def getbulkchart(details: fetchUniques_input, request: Request):
    """Endpoint to Get _____ particular report."""
    await verify_token(request)
    return await report_manager.fetch_unique(details.model_dump(by_alias=True))

@router.post("/generateReports")
async def generatereports(details: generateReports_input, request: Request):
    """Endpoint to Generate reports."""
    await verify_token(request)
    return await report_manager.generate_reports(details.model_dump(by_alias=True))
