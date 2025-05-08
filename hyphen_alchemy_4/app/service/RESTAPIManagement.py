import json
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
# pylint: disable=E0401
# pylint: disable=logging-fstring-interpolation
# pylint: disable=raise-missing-from
# pylint: disable=unspecified-encoding
# pylint: disable=invalid-name
# pylint: disable=broad-exception-caught
from passlib.context import CryptContext
from utilities import loggings as common
from database_services.common import CommonDatabaseServices , MySQLServices , PostgreSQLServices , OracleServices
from psycopg2.extras import RealDictCursor
# from utilities.database_services import DatabaseServices

db_manager = CommonDatabaseServices()


class RESTAPIManagement:
    """
    RESTAPIManagement class handles the management of REST API details,
    including inserting API details into the database and setting up middleware.
    """
    def __init__(self, conf):
        """
        Initialize the RESTAPIManagement class with configuration details.
        
        :param conf: Configuration dictionary containing database and other settings.
        """
        self.conf = conf
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.base_dir = os.getcwd()
        self.logfilepath = os.path.join(self.base_dir, 'logs')
        self.configfilepath = os.path.join(os.getcwd(), 'Cfg/config.ini')
        self.app = FastAPI()
        self.setup_middleware()
        self.mysql_database_url = {
            "username": conf["mysql"]["mysql_username"],
            "password": conf["mysql"]["mysql_password"],
            "host": conf["mysql"]["mysql_host"],
            "port": conf["mysql"]["mysql_port"],
            "database": conf["mysql"]["mysql_new_schema"],
        }

        self.postgres_database_url = {
            "username": conf['postgres']['postgres_username'],
            "password": conf['postgres']['postgres_password'],
            "host": conf['postgres']['postgres_host'],
            "port": conf['postgres']['postgres_port'],
            "database": conf['postgres']['postgres_schema'],
        }

    def setup_middleware(self):
        """
        Setup CORS middleware for the FastAPI application.
        """
        # Configure logging
        cursor_logger = common.CustomLogger()
        logging = cursor_logger.setup_logger()
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        logging.info("Middleware setup completed")

    def insert_in_db(self, detail):
        """
        Insert API details into the database.
        
        :param detail: Dictionary containing API details to be inserted.
        :return: Dictionary with the status and message of the operation.
        """
        # Configure logging
        cursor_logger = common.CustomLogger()
        logging = cursor_logger.setup_logger()
        logging.info("Inserting API details into the database with detail: %s", detail)
        # database_mysql = db_manager.get_mysql_connection(self.mysql_database_url)
        # Extract necessary details from the input dictionary
        data_source = detail["api_details"]["DataSource"]
        request_type = detail["api_details"]["RequestType"]
        api_url = detail["api_details"]["ApiURL"]
        customer_id = detail["api_details"]["customer_id"]
        # Remove extracted details from the dictionary
        del detail["api_details"]["DataSource"]
        del detail["api_details"]["customer_id"]
        del detail["api_details"]["RequestType"]
        del detail["api_details"]["ApiURL"]
        # Prepare JSON data for insertion
        auth_details = detail["api_details"]
        database_type = detail['database_type']
        json_data = json.dumps(auth_details)
        logging.debug("Prepared JSON data for insertion: %s", json_data)

        
        try:
            if database_type =="mysql":
                database_url = self.mysql_database_url
                database_service = MySQLServices(**database_url)
                database_conn = database_service.connect()
                cursor = database_conn.cursor(dictionary=True,buffered=True)
            elif database_type == 'oracle':
                database_url = self.oracle_database_url
                database_service = OracleServices(**database_url)
                database_conn = database_service.connect()     
            elif database_type == 'postgres':
                database_url = self.postgres_database_url
                database_service = PostgreSQLServices(**database_url)
                database_conn = database_service.connect()
                cursor = database_conn.cursor(cursor_factory=RealDictCursor)

            # Insert the API details into the database
            insert_query = "INSERT INTO rest_api_details (api_url, api_method, auth_type,\
                    data_source, customer_id) VALUES (%s, %s, %s, %s, %s)"
            cursor.execute(insert_query, (api_url, request_type, json_data, data_source,\
                                            customer_id))
            # Commit the transaction
            database_conn.commit()
            logging.info("API details inserted successfully for customer_id: %s", customer_id)
            return {"statusCode":self.conf['codes']['success'],"status": "success", "message": "API Details Added Successfully!"}
        except HTTPException as unexpected_exception:
            logging.error("Unexpected HTTP error: %s", unexpected_exception)
            raise HTTPException(
                status_code=500,
                detail={"statusCode":self.conf['codes']['internal error'],"error":f"internal error {str(unexpected_exception)}"}
            )    
        except Exception as exception:
            logging.error("Unexpected error: %s", exception)
            return {"statusCode":self.conf['codes']['internal error'],"status": "Failed", "message":f"Unable to add the API Details due to {exception}"}
