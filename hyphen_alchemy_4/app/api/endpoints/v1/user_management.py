'''
Module to define the endpoints for user management.
'''
import logging
from fastapi import APIRouter, HTTPException, Request
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
from service.UserManagement import UserManagement
from service.LoginValidator import AuthenticationManager
from utilities import loggings as LOGGINGS
from utilities.config import config as conf
from utilities.auth import AuthManager
from whitelisting import ImageService
from pydantic_models.user_model import saveUser_input,authorization_input,\
    validate_login_input,expireToken_input,getGroup_input,resetPassword_input,\
        deleteUser_input, assignGroup_input,dbsourcegroupmap_input,getDBdetails_input, requestOTP_input,verifytOTP_input,resendOTP_input


router = APIRouter()
cursor_logger = LOGGINGS.CustomLogger()
logging = cursor_logger.setup_logger()
auth_manager = AuthManager()


@router.post("/saveUser")
async def save_user_endpoint(details: saveUser_input, request: Request):
    '''
    Endpoint to save a user with the provided details.
    '''
    await auth_manager.check_token(request)
    logging.info("Received request to save user: %s", details.model_dump(by_alias=True))
    try:
        user_management = UserManagement(conf)
        response = user_management.save_user(details.model_dump(by_alias=True))
        logging.info("User saved successfully")
        return response
    except Exception as e:
        logging.error("Error saving user: %s", e)
        raise HTTPException(status_code=500, detail={"statusCode":conf['codes']['internal error'],"error":str(e)}) from e

@router.post('/authorization', response_model=dict)
async def authorization_api(details: authorization_input,request: Request):
    '''
    Endpoint to authorize a user based on their email and database type.
    '''
    await auth_manager.check_token(request)
    logging.info("Received request for authorization")
    try:
        data = details.model_dump(by_alias=True)
        email = data.get('username')
        if email:
            auth = AuthenticationManager()
            response = auth.authorization(email, data.get('database_type'))
            logging.info("Authorization successful for email: %s", email)
            return response
        logging.warning("Invalid request format for authorization")
        return {"statusCode":conf['codes']['bad request'],'validate': False, 'message': 'Invalid request format'}
    except Exception as e:
        logging.error("Error in authorization: %s", e)
        raise HTTPException(status_code=500, detail={"statusCode":conf['codes']['internal error'],"error":str(e)}) from e

@router.post('/validate-login', response_model=dict)
async def validate_login_api(details: validate_login_input):
    '''
    Endpoint to validate a user's login.
    '''
    logging.info("Received request to validate login")
    try:
        auth = AuthenticationManager()
        data = details.model_dump(by_alias=True)
        email = data.get('username')
        password = data.get('password')
        db_type = data.get('database_type')
        response = auth.validate_login(email, password,db_type)
        if response.get("validate") == True:
            access_token = auth_manager.generate_token(email)
            response['access_token'] = access_token
            response['exp'] = f"{conf['authentication']['expiration']} min" 
        logging.info("Login validation successful for email: %s", email)
        return response
    except Exception as e:
        logging.error("Error in login validation: %s", e)
        raise HTTPException(status_code=500, detail={"statusCode":conf['codes']['internal error'],"error":str(e)}) from e

@router.post("/expireToken")
async def expireToken(details:expireToken_input):
    """Endpoint to expire a token."""
    try:
        message = auth_manager.expire_token(details.model_dump(by_alias=True).get("token"))
        logging.info("Terminated token: %s", details.model_dump(by_alias=True).get("token"))
        return message
    except Exception as e:
        logging.error("Error terminating token: %s", e)
        raise HTTPException(status_code=500, detail={"statusCode":conf['codes']['internal error'],"error":str(e)}) from e

@router.post("/getGroup")
async def get_group_names(details: getGroup_input, request: Request):
    '''
    Endpoint to Retrieve group information(report assigned to group).
    '''
    await auth_manager.check_token(request)
    logging.info("Received request to get group names: %s", details.model_dump(by_alias=True))
    try:
        user_management = UserManagement(conf)
        response = user_management.fetch_details(details.model_dump(by_alias=True))
        logging.info("Group names fetched successfully")
        return response
    except Exception as e:
        logging.error("Error fetching group names: %s", e)
        raise HTTPException(status_code=500, detail={"statusCode":conf['codes']['internal error'],"error":str(e)}) from e

@router.post("/resetPassword")
async def reset_password_endpoint(details: resetPassword_input, request: Request):
    '''
    Endpoint to reset a user's password.
    '''
    # await auth_manager.check_token(request)
    # logging.info("Received request to reset password:")
    logging.info("Received request to reset password: %s", details.model_dump(by_alias=True))
    try:
        user_management = UserManagement(conf)
        response = user_management.edit_user(details.model_dump(by_alias=True))
        logging.info("Password reset successfully")
        return response
    except Exception as e:
        logging.error("Error resetting password: %s", e)
        raise HTTPException(status_code=500, detail={"statusCode":conf['codes']['internal error'],"error":str(e)}) from e

@router.post("/deleteUser")
async def delete_user_endpoint(details: deleteUser_input, request: Request):
    '''
    Endpoint to delete a user.
    '''
    await auth_manager.check_token(request)
    logging.info("Received request to delete user: %s", deleteUser_input)
    try:
        user_management = UserManagement(conf)
        response = user_management.delete_user(details.model_dump(by_alias=True))
        logging.info("User deleted successfully")
        return response
    except Exception as e:
        logging.error("Error deleting user: %s", e)
        raise HTTPException(status_code=500, detail={"statusCode":conf['codes']['internal error'],"error":str(e)}) from e

@router.put("/assignGroup")
async def assign_group(details: assignGroup_input, request: Request):
    '''
    Endpoint to assign a group to a user.
    '''
    await auth_manager.check_token(request)
    logging.info("Received request to assign group: %s", details.model_dump(by_alias=True))
    try:
        user_management = UserManagement(conf)
        response = user_management.assign_group(details.model_dump(by_alias=True)["formData"])
        logging.info("Group assigned successfully")
        return response
    except Exception as e:
        logging.error("Error assigning group: %s", e)
        raise HTTPException(status_code=500, detail={"statusCode":conf['codes']['internal error'],"error":str(e)}) from e
    
@router.put("/dbsourcegroupmap")
async def db_source_group_map(details: dbsourcegroupmap_input, request: Request):
    '''
    Endpoint to map database group with usergroup.
    '''
    await auth_manager.check_token(request)
    logging.info("Received request to assign group: %s", details.model_dump(by_alias=True))
    try:
        user_management = UserManagement(conf)
        response = user_management.db_source_group_map(details.model_dump(by_alias=True)["formData"])
        logging.info("Group assigned successfully")
        return response
    except Exception as e:
        logging.error("Error assigning group: %s", e)
        raise HTTPException(status_code=500, detail={"statusCode":conf['codes']['internal error'],"error":str(e)}) from e

@router.post("/getDBdetails")
async def get_schema_data(details: getDBdetails_input, request: Request):
    '''
    Endpoint to fetch database schema details.
    '''
    await auth_manager.check_token(request)
    logging.info("Received request to assign group: %s", details.model_dump(by_alias=True))
    try:
        user_management = UserManagement(conf)
        response = user_management.get_schema_data(details.model_dump(by_alias=True))
        logging.info("DB Details fetched successfully")
        return response
    except Exception as e:
        logging.error("Error assigning group: %s", e)
        raise HTTPException(status_code=500, detail={"statusCode":conf['codes']['internal error'],"error":str(e)}) from e

# testing left
@router.post("/requestOTP")
async def request_otp_endpoint(details: requestOTP_input, request: Request):
    '''
    Endpoint to request otp to reset a user's password.
    '''
    # await auth_manager.check_token(request)
    logging.info("Received request to reset password: %s", details.model_dump(by_alias=True))
    try:
        auth = AuthenticationManager()
        response = auth.request_otp_for_password_reset(details.model_dump(by_alias=True))
        logging.info("OTP requested successfully")
        return response
    except Exception as e:
        logging.error("Error requesting OTP: %s", e)
        raise HTTPException(status_code=500, detail={"statusCode":conf['codes']['internal error'],"error":str(e)}) from e
   
@router.post("/resendOTP")
async def resend_otp_endpoint(details: resendOTP_input, request: Request):
    '''
    Endpoint to resent otp to reset a user's password.
    '''
    # await auth_manager.check_token(request)
    logging.info("Received request to reset password: %s", details.model_dump(by_alias=True))
    try:
        auth = AuthenticationManager()
        response = auth.resend_otp(details.model_dump(by_alias=True))
        logging.info("OTP resented successfully")
        return response
    except Exception as e:
        logging.error("Error resenting OTP: %s", e)
        raise HTTPException(status_code=500, detail={"statusCode":conf['codes']['internal error'],"error":str(e)}) from e
 
@router.post("/verifyOTP")
async def verify_otp_endpoint(details: verifytOTP_input, request: Request):
    '''
    Endpoint to verify otp to reset a user's password.
    '''
    # await auth_manager.check_token(request)
    logging.info("Received request to reset password: %s", details.model_dump(by_alias=True))
    try:
        auth = AuthenticationManager()
        response = auth.verify_OTP(details.model_dump(by_alias=True))
        logging.info("OTP verified successfully")
        return response
    except Exception as e:
        logging.error("Error verifying OTP: %s", e)
        raise HTTPException(status_code=500, detail={"statusCode":conf['codes']['internal error'],"error":str(e)}) from e
 
# last three left whitelisting
@router.post("/upload_images")
async def upload_images(request: Request, customer_id: int = Form(...), login_logo: UploadFile = File(None), nav_icon: UploadFile = File(None), pdf_logo: UploadFile = File(None),database_type: str = Form(...)):
    """Endpoint to upload logo."""
    await auth_manager.check_token(request)
    image=ImageService()
    return await image.upload_images(customer_id, login_logo, nav_icon, pdf_logo,database_type)


@router.get("/img/nav_icon/{customer_id}")
async def get_nav_icon(customer_id: int):
    """Endpoint to retrieve nav_icon."""
    image=ImageService()
    return await image.get_file(customer_id, "nav_icon",database_type = "postgres")

@router.get("/img/login_logo/{customer_id}")
async def get_login_logo(customer_id: int):
    """Endpoint to retrieve login_logo."""

    image=ImageService()
    return await image.get_file(customer_id, "login_logo",database_type = "postgres")

@router.get("/img/pdf_logo/{customer_id}")
async def get_pdf_logo(customer_id: int):
    """Endpoint to retrieve pdf_logo."""
    image=ImageService()
    return await image.get_file(customer_id, "pdf_logo",database_type = "postgres")
