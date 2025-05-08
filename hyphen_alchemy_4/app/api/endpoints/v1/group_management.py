"""
Module for managing group-related endpoints.
"""
from fastapi import APIRouter, HTTPException,Request
from service.GroupManagement import GroupManagement
from utilities.config import config as conf
from utilities import loggings as LOGGINGS
from utilities.auth import AuthManager
from pydantic_models.group_models import updateGroupName_input,checkMember_input,deleteGroup_input

router = APIRouter()
auth_manager = AuthManager()
cursor_logger = LOGGINGS.CustomLogger()
logging = cursor_logger.setup_logger()

@router.post("/updateGroupName")
async def edit_group_name(details: updateGroupName_input, request: Request):
    """
    Endpoint to update the name of a user group.
    """
    await auth_manager.check_token(request)
    logging.info("Received request to update group name: %s", details.model_dump(by_alias=True))
    try:
        group_management = GroupManagement(conf)
        response = group_management.update_group_name(details.model_dump(by_alias=True))
        logging.info("Group Name Updated successfully")
        return response
    except Exception as e:
        logging.error("Error updating group name: %s", e)
        raise HTTPException(status_code=500, detail={"statusCode":conf['codes']['internal error'],"error":str(e)}) from e

@router.post("/checkMember")
async def check_member(details: checkMember_input, request: Request):
    """
    Endpoint to check if a user is a member of a group.
    """
    await auth_manager.check_token(request)
    logging.info("Received request to check group member: %s", details.model_dump(by_alias=True))
    try:
        group_management = GroupManagement(conf)
        response = group_management.check_group_members(details.model_dump(by_alias=True))
        return response
    except Exception as e:
        logging.error("Error checking group member: %s", e)
        raise HTTPException(status_code=500, detail={"statusCode":conf['codes']['internal error'],"error":str(e)}) from e

@router.post("/deleteGroup")
async def delete_group(details: deleteGroup_input, request: Request):
    """
    Endpoint to delete a user group
    """
    await auth_manager.check_token(request)
    logging.info("Received request to delete group: %s", details.model_dump(by_alias=True))
    try:
        group_management = GroupManagement(conf)
        response = group_management.delete_group(details.model_dump(by_alias=True))
        return response
    except Exception as e:
        logging.error("Error deleting group: %s", e)
        raise HTTPException(status_code=500, detail={"statusCode":conf['codes']['internal error'],"error":str(e)}) from e
