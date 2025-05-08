'''
This module contains the API endpoints for scheduler management.
'''
from fastapi import APIRouter, HTTPException, Request
from service.ReportScheduler import ReportScheduler
from utilities import loggings as LOGGINGS
from utilities.config import config as conf
from utilities.auth import AuthManager
from pydantic_models.scheduler_model import saveScheduler_input,listScheduler_input,updateScheduler_input,deleteScheduler_input,getSchedulerbyId_input
from pydantic_models.scheduler_model import saveScheduler_input,listScheduler_input,updateScheduler_input,deleteScheduler_input,getSchedulerbyId_input,getEmails_input

auth_manager = AuthManager()
router = APIRouter()
cursor_logger = LOGGINGS.CustomLogger()
logging = cursor_logger.setup_logger()


@router.post("/getEmails")
async def get_usernames(details: getEmails_input, request: Request):
    """
    Endpoint to get a scheduler by ID.
    """
    await auth_manager.check_token(request)
    logging.info("Received request to get scheduler by ID: %s", details.model_dump(by_alias=True))
    try:
        report_scheduler = ReportScheduler(conf)
        response = report_scheduler.fetch_usernames(details.model_dump(by_alias=True))
        return response
    except Exception as e:
        logging.error("Error fetching usernames: %s", e)
        raise HTTPException(status_code=500, detail={"statusCode":conf['codes']['internal error'],"error":str(e)}) from e

@router.post("/saveScheduler")
async def save_scheduler(details: saveScheduler_input, request: Request):
    '''
    Endpoint to save a scheduler with the provided details.
    '''
    await auth_manager.check_token(request)
    logging.info("Received request to save scheduler: %s", details.model_dump(by_alias=True))
    try:
        report_scheduler = ReportScheduler(conf)
        response = report_scheduler.insert_scheduler(details.model_dump(by_alias=True))
        logging.info("Scheduler saved successfully")
        return response
    except Exception as e:
        logging.error("Error saving scheduler: %s", e)
        raise HTTPException(status_code=500, detail={"statusCode":conf['codes']['internal error'],"error":str(e)}) from e

@router.post("/listScheduler")
async def list_scheduler(details: listScheduler_input, request: Request):
    '''
    Endpoint to list scheduler with the provided details.
    '''
    await auth_manager.check_token(request)
    logging.info("Received request to list scheduler: %s", details.model_dump(by_alias=True))
    try:
        report_scheduler = ReportScheduler(conf)
        response = report_scheduler.list_scheduler(details.model_dump(by_alias=True))
        logging.info("Scheduler listed successfully")
        return response
    except Exception as e:
        logging.error("Error listing scheduler: %s", e)
        raise HTTPException(status_code=500, detail={"statusCode":conf['codes']['internal error'],"error":str(e)}) from e

@router.post("/updateScheduler")
async def update_scheduler(details: updateScheduler_input, request: Request):
    '''
    Endpoint to update a scheduler with the provided details.
    '''
    await auth_manager.check_token(request)
    logging.info("Received request to update scheduler: %s", details.model_dump(by_alias=True))
    try:
        report_scheduler = ReportScheduler(conf)
        response = report_scheduler.update_scheduler(details.model_dump(by_alias=True))
        logging.info("Scheduler updated successfully")
        return response
    except Exception as e:
        logging.error("Error updating scheduler: %s", e)
        raise HTTPException(status_code=500, detail={"statusCode":conf['codes']['internal error'],"error":str(e)}) from e

@router.post("/deleteScheduler")
async def delete_scheduler(details: deleteScheduler_input, request: Request):
    '''
    Endpoint to delete a scheduler with the provided details.
    '''
    await auth_manager.check_token(request)
    logging.info("Received request to delete scheduler: %s", details.model_dump(by_alias=True))
    try:
        report_scheduler = ReportScheduler(conf)
        response = report_scheduler.delete_scheduler(details.model_dump(by_alias=True))
        logging.info("Scheduler deleted successfully")
        return response
    except Exception as e:
        logging.error("Error deleting scheduler: %s", e)
        raise HTTPException(status_code=500, detail={"statusCode":conf['codes']['internal error'],"error":str(e)}) from e

@router.post("/getSchedulerbyId")
async def get_scheduler_by_id(details: getSchedulerbyId_input, request: Request):
    '''
    Endpoint to get a scheduler by ID.
    '''
    await auth_manager.check_token(request)
    logging.info("Received request to get scheduler by ID: %s", details.model_dump(by_alias=True))
    try:
        report_scheduler = ReportScheduler(conf)
        response = report_scheduler.list_scheduler_by_id(details.model_dump(by_alias=True))
        logging.info("Scheduler fetched by ID successfully")
        return response
    except Exception as e:
        logging.error("Error fetching scheduler by ID: %s", e)
        raise HTTPException(status_code=500, detail={"statusCode":conf['codes']['internal error'],"error":str(e)}) from e
