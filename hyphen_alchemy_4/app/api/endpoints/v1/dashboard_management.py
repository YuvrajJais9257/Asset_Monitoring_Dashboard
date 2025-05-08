"""
Module for managing dashboard-related endpoints.
"""
import logging
from fastapi import APIRouter, HTTPException, Request
from service.DashboardManagement import DashboardManagement
from utilities import loggings as LOGGINGS
from utilities.config import config as conf
from utilities.auth import AuthManager
from pydantic_models.dashboard_model import saveFrame_input, getFrame_input, \
    updateFrame_input, deleteFrame_input, getMultiFrame_input, findFrame_input,\
          listAccess_input, listDashboard_input,listDashboardname_input,\
            updateAccess_input,editFrame_input

auth_manager = AuthManager()
router = APIRouter()
cursor_logger = LOGGINGS.CustomLogger()
logging = cursor_logger.setup_logger()

@router.post("/saveFrame")
async def save_frame(details: saveFrame_input, request: Request):
    """
    Endpoint to save a frame with the provided details.
    """
    await auth_manager.check_token(request)
    logging.info("Received request to save frame: %s", details.model_dump(by_alias=True))
    try:
        dashboard_management = DashboardManagement(conf)
        response = dashboard_management.insert_in_db(details.model_dump(by_alias=True))
        logging.info("Frame saved successfully")
        return response
    except Exception as e:
        logging.error("Error saving frame: %s", e)
        raise HTTPException(status_code=500, detail={"statusCode":conf['codes']['internal error'],"error":str(e)}) from e

@router.post("/getFrame")
async def get_frame(details: getFrame_input, request: Request):
    """
    Endpoint to get a frame with the provided details.
    """
    await auth_manager.check_token(request)
    logging.info("Received request to get frame: %s", details.model_dump(by_alias=True))
    try:
        dashboard_management = DashboardManagement(conf)
        response = dashboard_management.list_frame(details.model_dump(by_alias=True))
        logging.info("Frame fetched successfully")
        return response
    except Exception as e:
        logging.error("Error fetching frame: %s", e)
        raise HTTPException(status_code=500, detail={"statusCode":conf['codes']['internal error'],"error":str(e)}) from e

@router.post("/updateFrame")
async def update_frame(details: updateFrame_input, request: Request):
    """
    Endpoint to update a frame with the provided details.
    """
    await auth_manager.check_token(request)
    logging.info("Received request to update frame: %s", details.model_dump(by_alias=True))
    try:
        dashboard_management = DashboardManagement(conf)
        response = dashboard_management.update_in_db(details.model_dump(by_alias=True))
        logging.info("Frame updated successfully")
        return response
    except Exception as e:
        logging.error("Error updating frame: %s", e)
        raise HTTPException(status_code=500, detail={"statusCode":conf['codes']['internal error'],"error":str(e)}) from e

@router.post("/deleteFrame")
async def delete_frame_endpoint(details: deleteFrame_input, request: Request):
    """
    Endpoint to delete a frame with the provided details
    """
    await auth_manager.check_token(request)
    logging.info("Received request to delete frame: %s", details.model_dump(by_alias=True))
    try:
        dashboard_management = DashboardManagement(conf)
        response = dashboard_management.delete_frame(details.model_dump(by_alias=True))
        logging.info("Frame deleted successfully")
        return response
    except Exception as e:
        logging.error("Error deleting frame: %s", e)
        raise HTTPException(status_code=500, detail={"statusCode":conf['codes']['internal error'],"error":str(e)}) from e

@router.post("/getMultiFrame")
async def get_multi_frame(details: getMultiFrame_input, request: Request):
    """
    Endpoint to get multiple frames with the provided details.
    """
    await auth_manager.check_token(request)
    logging.info("Received request to get multiple frames: %s", details.model_dump(by_alias=True))
    try:
        dashboard_management = DashboardManagement(conf)
        response = dashboard_management.multi_list_frame(details.model_dump(by_alias=True))
        logging.info("Multiple frames fetched successfully")
        return response
    except Exception as e:
        logging.error("Error fetching multiple frames: %s", e)
        raise HTTPException(status_code=500, detail={"statusCode":conf['codes']['internal error'],"error":str(e)}) from e

@router.post("/findFrame")
async def find_frame(details: findFrame_input, request: Request):
    """
    Endpoint to find a frame with the provided details.
    """
    await auth_manager.check_token(request)
    logging.info("Received request to find frame: %s", details.model_dump(by_alias=True))
    try:
        dashboard_management = DashboardManagement(conf)
        response = dashboard_management.check_frame(details.model_dump(by_alias=True))
        logging.info("Frame found successfully")
        return response
    except Exception as e:
        logging.error("Error finding frame: %s", e)
        raise HTTPException(status_code=500, detail={"statusCode":conf['codes']['internal error'],"error":str(e)}) from e

@router.post("/listAccess")
async def list_access(details: listAccess_input, request: Request):
    """
    Endpoint to list access with the provided details.
    """
    await auth_manager.check_token(request)
    logging.info("Received request to list access: %s", details.model_dump(by_alias=True))
    try:
        dashboard_management = DashboardManagement(conf)
        response = dashboard_management.list_access(details.model_dump(by_alias=True))
        logging.info("Access listed successfully")
        return response
    except Exception as e:
        logging.error("Error listing access: %s", e)
        raise HTTPException(status_code=500, detail={"statusCode":conf['codes']['internal error'],"error":str(e)}) from e

@router.post("/listDashboard")
async def list_dashboard(details: listDashboard_input, request: Request):
    """
    Endpoint to list dashboards with the provided details.
    """
    await auth_manager.check_token(request)
    logging.info("Received request to list dashboard: %s", details.model_dump(by_alias=True))
    try:
        dashboard_management = DashboardManagement(conf)
        response = dashboard_management.get_list_dashboards(details.model_dump(by_alias=True))
        logging.info("Dashboard listed successfully")
        return response
    except Exception as e:
        logging.error("Error listing dashboard: %s", e)
        raise HTTPException(status_code=500, detail={"statusCode":conf['codes']['internal error'],"error":str(e)}) from e


@router.post("/listDashboardname")
async def list_dashboard_name(details: listDashboardname_input, request: Request):
    """
    Endpoint to list dashboard names with the provided details.
    """
    await auth_manager.check_token(request)
    logging.info("Received request to list dashboard names: %s", details.model_dump(by_alias=True))
    try:
        dashboard_management = DashboardManagement(conf)
        response = dashboard_management.get_list_dashboards_name(details.model_dump(by_alias=True))
        logging.info("Dashboard names listed successfully")
        return response
    except Exception as e:
        logging.error("Error listing dashboard names: %s", e)
        raise HTTPException(status_code=500, detail={"statusCode":conf['codes']['internal error'],"error":str(e)}) from e

@router.post("/updateAccess")
async def update_access(details: updateAccess_input, request: Request):
    """
    Endpoint to update access with the provided details.
    """
    await auth_manager.check_token(request)
    logging.info("Received request to update access: %s", details.model_dump(by_alias=True))
    try:
        dashboard_management = DashboardManagement(conf)
        response = dashboard_management.update_access(details.model_dump(by_alias=True))
        logging.info("Access updated successfully")
        return response
    except Exception as e:
        logging.error("Error updating access: %s", e)
        raise HTTPException(status_code=500, detail={"statusCode":conf['codes']['internal error'],"error":str(e)}) from e


@router.post("/editFrame")
async def edit_frame(details: editFrame_input, request: Request):
    """
    Endpoint to edit a frame with the provided details.
    """
    await auth_manager.check_token(request)
    logging.info("Received request to edit frame: %s", details.model_dump(by_alias=True))
    try:
        dashboard_management = DashboardManagement(conf)
        response = dashboard_management.edit_frame(details.model_dump(by_alias=True))
        logging.info("Frame edited successfully")
        return response
    except Exception as e:
        logging.error("Error editing frame: %s", e)
        raise HTTPException(status_code=500, detail={"statusCode":conf['codes']['internal error'],"error":str(e)}) from e
