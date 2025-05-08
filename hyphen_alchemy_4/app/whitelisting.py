"""
This module provides an API service for handling image uploads and retrieval using FastAPI and a MySQL database.The service allows users to upload images (login logo, nav icon, pdf logo) and retrieve stored images in binary or Base64 format.
"""
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
from pydantic import BaseModel
from database_services.common import MySQLServices , PostgreSQLServices , OracleServices , VerticaServices

import uvicorn
from starlette.responses import StreamingResponse
import io
import base64
from utilities.config import config
import utilities.loggings as LOGGINGS
from psycopg2.extras import RealDictCursor
 
app = FastAPI()
 
class ImageService:
    """
    Service class for handling image upload and retrieval operations.
    """
    def __init__(self):
        """
        Initialize ImageService with MySQL database connection settings.
        """
        self.mysql_database_url = {
                    "host": config['mysql']['mysql_host'],
                    "port": config['mysql']['mysql_port'],
                    "username": config['mysql']['mysql_username'],
                    "password": config['mysql']['mysql_password'],
                    "database": config['mysql']['mysql_new_schema'],
                }
        
        self.postgres_database_url = {
            "username": config['postgres']['postgres_username'],
            "password": config['postgres']['postgres_password'],
            "host": config['postgres']['postgres_host'],
            "port": config['postgres']['postgres_port'],
            "database": config['postgres']['postgres_schema'],
        }
        self.oracle_database_url = {
            
        }
        self.conf = config
        # self.db = MySQLServices(**self.mysql_database_url)
 
    async def upload_images(self, customer_id: int, login_logo: UploadFile = None, nav_icon: UploadFile = None, pdf_logo: UploadFile = None,database_type: str = Form(...)):
        """
        Upload images to the database with optional file uploads.
        """
        try:
            cursor_logger = LOGGINGS.CustomLogger()
            logging = cursor_logger.setup_logger()
            logging.info("Received request to save images")
            

            if database_type == "mysql":
                database_url = self.mysql_database_url
                database_service = MySQLServices(**database_url)
            elif database_type == 'oracle':
                database_url = self.oracle_database_url
                database_service = OracleServices(**database_url)
                
            elif database_type == 'postgres':
                database_url = self.postgres_database_url
                database_service = PostgreSQLServices(**database_url)

            data = {"customer_id": customer_id}

            # Check and process each file if it exists
            if login_logo is not None:
                if not login_logo.filename.endswith((".jpg", ".png")):
                    logging.error("Login logo must be in .jpg or .png format")
                    raise HTTPException(status_code=401, detail={"statusCode":config['codes']['incorrect Parameters'],"error":str("Login logo must be in .jpg or .png format")})
                
                    # raise HTTPException(status_code=400, detail="Login logo must be in .jpg or .png format")
                data["login_logo"] = await login_logo.read()

            if nav_icon is not None:
                if not nav_icon.filename.endswith((".jpg", ".png")):
                    logging.error("Nav icon must be in .jpg or .png format")
                    raise HTTPException(status_code=401, detail={"statusCode":config['codes']['incorrect Parameters'],"error":str("Login logo must be in .jpg or .png format")})
                
                    # raise HTTPException(status_code=400, detail="Nav icon must be in .jpg or .png format")
                data["nav_icon"] = await nav_icon.read()

            if pdf_logo is not None:
                if not pdf_logo.filename.endswith((".jpg", ".png")):
                    logging.error("PDF logo must be in .jpg or .png format")
                    raise HTTPException(status_code=401, detail={"statusCode":config['codes']['incorrect Parameters'],"error":str("Login logo must be in .jpg or .png format")})
                
                    # raise HTTPException(status_code=400, detail="PDF logo must be in .jpg or .png format")
                data["pdf_logo"] = await pdf_logo.read()

            # If no files were uploaded, return an error
            if len(data) == 1:  # only contains customer_id
                logging.error("At least one image file must be uploaded")
                raise HTTPException(status_code=401, detail={"statusCode":config['codes']['bad request'],"error":str("At least one image file must be uploaded")})
                # raise HTTPException(status_code=400, detail="At least one image file must be uploaded")

            # self.db.connect()
            database_service.connect()
            existing_data = database_service.read_records(table="img", where_conditions={"customer_id": customer_id})
            
            if existing_data:
                logging.info("Data already exists")
                database_service.update_record(table="img",data=data, where_conditions={"customer_id": customer_id})
            else:
                logging.info("inserting data")
                database_service.create_record(table="img", data=data)

            database_service.close_connection()
            return {"statusCode":config['codes']['success'],"message": "Files uploaded successfully"}
        except Exception as e:
            raise HTTPException(status_code=400, detail={"statusCode":config['codes']['bad request'],"error":str(e)})
            # raise HTTPException(status_code=400, detail=str(e))
        finally:
            database_service.close_connection()

    def get_image(self, customer_id: int, image_type: str,database_type: str):
        """
        Retrieve an image from the database and save it as a file on the server.
        """
        try:
            if database_type =="mysql":
                database_url = self.mysql_database_url
                database_service = MySQLServices(**database_url)
            elif database_type == 'oracle':
                database_url = self.oracle_database_url
                database_service = OracleServices(**database_url)
                
            elif database_type == 'postgres':
                database_url = self.postgres_database_url
                database_service = PostgreSQLServices(**database_url)

            database_service.connect()
            data = database_service.read_records(table="img", where_conditions={"customer_id": customer_id})
            database_service.close_connection()

            if not data:
                return "no"
 
            image_data = data[0].get(image_type)

            if isinstance(image_data, memoryview):
                image_data = image_data.tobytes()

            if not image_data:
                # raise HTTPException(status_code=404, detail=f"{image_type} not found")
                return "no"
            file_path = f"{image_type}_{customer_id}.png"
            with open(file_path, "wb") as file:
                file.write(image_data)
 
            return  file_path
        except HTTPException as e:
            raise HTTPException(status_code=500, detail={"statusCode":config['codes']['internal error'],"error":str(e)})
        except Exception as e:
            raise HTTPException(status_code=500, detail={"statusCode":config['codes']['internal error'],"error":str(e)})
        finally:
            database_service.close_connection()
   
    async def get_file(self, customer_id: int, image_type: str,database_type: str):
        """
        Retrieve an image from the database and return it as a Base64 encoded string.
        """
        try:
            if database_type =="mysql":
                database_url = self.mysql_database_url
                database_service = MySQLServices(**database_url)
            elif database_type == 'oracle':
                database_url = self.oracle_database_url
                database_service = OracleServices(**database_url)
                
            elif database_type == 'postgres':
                database_url = self.postgres_database_url
                database_service = PostgreSQLServices(**database_url)

            database_service.connect()
            data = database_service.read_records(table="img", where_conditions={"customer_id": customer_id})
            database_service.close_connection()
 
            if not data or image_type not in data[0]:
                return {"statusCode":self.conf['codes']['no records'],"error": "No image found"}
 
            # Convert binary image data to Base64 string
            image_bytes = data[0][image_type]  # Fetch binary image data
            if isinstance(image_bytes, memoryview):
                image_bytes = image_bytes.tobytes()
            base64_string = base64.b64encode(image_bytes).decode("utf-8")
 
            return {"statusCode":config['codes']['success'],"message": "Image retrieved successfully","image": base64_string}  # Return as JSON response
        except Exception as e:
            raise HTTPException(status_code=500, detail={"statusCode":config['codes']['internal error'],"error":str(e)})
        finally:
            database_service.close_connection()
