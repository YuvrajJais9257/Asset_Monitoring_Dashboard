"""Module for managing dashboard-related operations."""
import os
import json
#from utilities.database_services import DatabaseServices
from database_services.common import CommonDatabaseServices , MySQLServices , PostgreSQLServices , OracleServices
from utilities.config import config
from utilities import loggings as common
from passlib.context import CryptContext
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pymysql
from  psycopg2.extras import DictCursor,RealDictCursor
from mysql.connector.errors import Error as MySQLError
from psycopg2.errors import Error as PostgresError


db_manager = CommonDatabaseServices()



class DashboardManagement:
    """
    Manages dashboard-related operations, including list_frame,multi_list_frame,edit_frame,update_in_db etc.
    """
    def __init__(self, conf):
        """
        Initializes the application with configuration settings, database connections, and middleware.
        """
        self.conf = conf
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.base_dir = os.getcwd()
        self.logfilepath = os.path.join(self.base_dir, "logs")
        self.configfilepath = os.path.join(os.getcwd(), "config/config.ini")
        self.app = FastAPI()
        self.setup_middleware()
        self.mysql_database_url = {
            "username": self.conf["mysql"]["mysql_username"],
            "password": self.conf["mysql"]["mysql_password"],
            "host": self.conf["mysql"]["mysql_host"],
            "port": self.conf["mysql"]["mysql_port"],
            "database": self.conf["mysql"]["mysql_new_schema"],
        }

        self.postgres_database_url = {
            "username": conf['postgres']['postgres_username'],
            "password": conf['postgres']['postgres_password'],
            "host": conf['postgres']['postgres_host'],
            "port": conf['postgres']['postgres_port'],
            "database": conf['postgres']['postgres_schema'],
        }

        self.oracle_database_url = {}

        self.dashboard_report_frame = self.conf["database_tables"][
            "dashboard_report_frame"
        ]
        self.view_report_access_group = self.conf["database_tables"][
            "view_report_access_group"
        ]
        self.combined_dashboard_view = self.conf["database_tables"][
            "combined_dashboard_view"
        ]
        self.dashboard_access_right = self.conf["database_tables"][
            "dashboard_access_right"
        ]

    def setup_middleware(self):
        """Configure CORS middleware for the application."""
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=[
                "*"
            ],  # Allow all origins (consider restricting in production)
            allow_credentials=True,
            allow_methods=["GET", "POST", "PUT", "DELETE"],  # Specify allowed methods
            allow_headers=["Content-Type", "Authorization"],  # Specify allowed headers
            expose_headers=[
                "Content-Range",
                "X-Total-Count",
            ],  # Expose additional headers
            max_age=86400,  # Cache CORS configuration for 1 day (optional)
        )

    def list_frame(self, detail: dict) -> dict:
        """
        Retrieves dashboard frame data and excluded report templates for a given customer and group.

        Args:
        detail (dict): Dictionary containing customer ID and group ID.

        Returns:
        dict: Dictionary containing frame data, excluded reports, and status.
        """
        cursor_logger = common.CustomLogger()
        logging = cursor_logger.setup_logger()
        logging.debug("list_frame called with detail: %s", detail)
        customer_id = detail["customer_id"]
        group_id = int(detail["group_id"])

        try:
            if detail['database_type']=="mysql":
                database_url = self.mysql_database_url
                database_service = MySQLServices(**database_url)
                database_conn = database_service.connect()
                cursor = database_conn.cursor(dictionary=True)
            elif detail['database_type'] == 'oracle':
                database_url = self.oracle_database_url
                database_service = OracleServices(**database_url)
                database_conn = database_service.connect()
                
            elif detail['database_type'] == 'postgres':
                database_url = self.postgres_database_url
                database_service = PostgreSQLServices(**database_url)
                database_conn = database_service.connect()
                cursor = database_conn.cursor(cursor_factory=RealDictCursor)

            
            select_query = """
                SELECT dashboard_report_id, dashboard_json_frame_data, dashboard_report_name, customer_id,group_id
                FROM dashboard_report_frame
                WHERE customer_id = %s and group_id = %s
            """
            
            cursor.execute(
                select_query,
                (
                    customer_id,
                    group_id
                ),
            )
            frame_result = cursor.fetchone()
            logging.debug("Frame result: ")
            if frame_result is None:
                return {"statusCode":self.conf['codes']['no records'], "frame": [], "report_excluded": []}

            report_included = tuple(
                report["chartType"]
                for report in json.loads(frame_result["dashboard_json_frame_data"])
            )

            # Handle single-element tuple
            if len(report_included) == 1:
                report_included = (report_included[0],)

            # Parameterized query to prevent SQL injection
            report_select_query = """
                SELECT report_template_name 
                FROM %s 
                WHERE customer_id = %s AND group_id = %s AND report_template_name NOT IN %s
            """
            if len(report_included) == 0:
                report_select_query = """
                    SELECT report_template_name 
                    FROM %s 
                    WHERE customer_id = %s AND group_id = %s
                """
            cursor.execute(
                report_select_query,
                (
                    self.view_report_access_group,
                    customer_id,
                    group_id,
                    report_included,
                ),
            )
            result = cursor.fetchall()
            logging.debug("Excluded reports ")
            report_excluded = [report["report_template_name"] for report in result]
            database_conn.commit()

            return {
                "statusCode":self.conf['codes']['success'],
                "frame": json.loads(frame_result["dashboard_json_frame_data"]),
                "report_excluded": report_excluded,
            }

        except Exception as exception:
            logging.error("Error occurred in list_frame: %s", exception)
            return {
                "statusCode":self.conf['codes']['internal error'],
                "status": "Failed",
                "message": f"Internal error: {exception}",
            }
        finally:
            # Ensure database connections are closed
            if "cursor" in locals() and cursor:
                cursor.close()
            if "database_conn" in locals() and database_conn:
                database_conn.close()

    def multi_list_frame(self, detail):
        """
        Retrieve and process multiple dashboard frames for a given customer and group.
        This function fetches dashboard report details from the database based on the provided 
        customer and group IDs. It processes the JSON frame data, filters excluded reports, 
        and retrieves access information. The function returns the dashboard frames along 
        with excluded reports if any
        """

        cursor_logger = common.CustomLogger()
        logging = cursor_logger.setup_logger()
        logging.debug("multi_list_frame called with detail: %s", detail)
        customer_id = detail["customer_id"]
        group_id = detail["group_id"]
        database_type = detail['database_type']
        database_conn = None

        # database_mysql = db_manager.get_mysql_connection(self.mysql_database_url)
        try:
            if detail['database_type']=="mysql":
                database_url = self.mysql_database_url
                database_service = MySQLServices(**database_url)
                database_conn = database_service.connect()
                cursor = database_conn.cursor(dictionary=True,buffered=True)
            elif detail['database_type'] == 'oracle':
                database_url = self.oracle_database_url
                database_service = OracleServices(**database_url)
                database_conn = database_service.connect()
                
            elif detail['database_type'] == 'postgres':
                database_url = self.postgres_database_url
                database_service = PostgreSQLServices(**database_url)
                database_conn = database_service.connect()
                cursor = database_conn.cursor(cursor_factory=RealDictCursor)


            # select_query = f"SELECT dashboard_report_name,dashboard_json_frame_data,\
            #     customer_id FROM {config['database_tables']['combined_dashboard_view']} \
            #         WHERE customer_id=%s and group_id=%s and access != 'null' Order By\
            #                 CASE WHEN `default_dashboard` IS NULL OR `default_dashboard` \
            #                 = '' THEN 1 ELSE 0 END, `default_dashboard` ASC;"
            select_query = f"""
            SELECT dashboard_report_name, dashboard_json_frame_data, customer_id
            FROM {config['database_tables']['combined_dashboard_view']}
            WHERE customer_id = %s AND group_id = %s AND access != 'null'
            ORDER BY
                CASE WHEN default_dashboard IS NULL OR default_dashboard = '' THEN 1 ELSE 0 END,
                default_dashboard ASC;
            """

            cursor.execute(select_query, (customer_id, group_id))

            frame_result = cursor.fetchall()
            logging.info("Frame results: %s",len(frame_result))
            if frame_result is None:
                return {"statusCode":self.conf['codes']['success'], "frame": [], "report_excluded": []}
            frames = []

            for frame in frame_result:
                # report_included = tuple(
                #     report["chartType"]
                #     for report in json.loads(frame["dashboard_json_frame_data"])
                # )
                frame_data = frame["dashboard_json_frame_data"]
                if isinstance(frame_data, (list, dict)):
                    frame_data = json.dumps(frame_data)

                try:
                    frame_data = json.loads(frame_data)
                except json.JSONDecodeError as e:
                    logging.error(f"Invalid JSON in dashboard_json_frame_data: {e}")
                    continue

                # report_included = tuple(report["chartType"] for report in frame_data)

                
                report_excluded = []
                access_query = (
                    f"SELECT access from combined_dashboard_view WHERE\
                            customer_id='{customer_id}' "
                    f"and group_id='{group_id}' and dashboard_report_name \
                        ='{frame['dashboard_report_name']}'"
                )
                cursor.execute(access_query)
                access_result = cursor.fetchone()

                dashboard_frame = {
                    "frame": frame_data,
                    "dashboard_name": frame["dashboard_report_name"],
                    "dashboard_access": access_result["access"],
                    "report_excluded": report_excluded,
                }
                frames.append(dashboard_frame)
            database_conn.commit()
        
            return {"statusCode":self.conf['codes']['success'], "frames": frames}
        except HTTPException as unexpected_exception:
            logging.error("Unexpected error: %s", unexpected_exception)
            raise HTTPException(
                status_code=500,
                detail={"statusCode":self.conf['codes']['internal error'],"error":unexpected_exception.detail}
            ) from unexpected_exception
        except Exception as exception:
            logging.error("Error occurred in multi_list_frame: %s", exception)
            return {
                "statusCode":self.conf['codes']['internal error'],
                "message": f"Unable to get the JSON frame due to {exception}",
            }
        finally:
            # Ensure database connections are closed
            if "cursor" in locals() and cursor:
                cursor.close()
            if "database_conn" in locals() and database_conn:
                database_conn.close()


    def edit_frame(self, detail):
        """
        Modifies and retrieves the JSON frame data for a specific dashboard from the database.
        
        This method queries the database for the JSON frame data associated with a customer's 
        dashboard, processes the included and excluded reports based on user access, and returns 
        the updated frame information along with access details.
        """
        cursor_logger = common.CustomLogger()
        logging = cursor_logger.setup_logger()
        logging.debug(f"edit_frame called with detail: {detail}")
        customer_id = detail["customer_id"]
        group_id = detail["group_id"]
        email = detail["email"]
        dashboard_name = detail["dashboard_name"]

        try:
            if detail['database_type']=="mysql":
                database_url = self.mysql_database_url
                database_service = MySQLServices(**database_url)
                database_conn = database_service.connect()
                cursor = database_conn.cursor(dictionary=True,buffered=True)
            elif detail['database_type'] == 'oracle':
                database_url = self.oracle_database_url
                database_service = OracleServices(**database_url)
                database_conn = database_service.connect()
                
            elif detail['database_type'] == 'postgres':
                database_url = self.postgres_database_url
                database_service = PostgreSQLServices(**database_url)
                database_conn = database_service.connect()
                cursor = database_conn.cursor(cursor_factory=RealDictCursor)
        except Exception as e:
            logging.error(f"Error connecting to database: {e}")
            return{
                "StatusCode":int(config['codes']['database error']),
                "Error":f"Database connection error: {e}",
            }
        

        try:

            select_query = f"SELECT dashboard_report_name,dashboard_json_frame_data,customer_id FROM {self.combined_dashboard_view} WHERE customer_id=%s and group_id=%s and dashboard_report_name=%s"
            cursor.execute(select_query, (customer_id, group_id, dashboard_name))
            frame_result = cursor.fetchall()
            logging.debug(f"Frame results: ")
            if len(frame_result) == 0:
                return {"statusCode":self.conf['codes']['no records'],"status": "success", "frame": []}
            
            frames = []

            for frame in frame_result:
                dashboard_data = frame["dashboard_json_frame_data"]

                if isinstance(dashboard_data, str):
                    parsed_dashboard_data = json.loads(dashboard_data)
                else:
                    parsed_dashboard_data = dashboard_data  # Already a list/dict (Postgres)

                report_included = tuple(
                    report["chartType"] for report in parsed_dashboard_data
                )

                if len(report_included) == 1:
                    report_included = str(report_included).replace(",", "")
                report_select_query = f"SELECT report_template_name,report_type,chart_type FROM {self.view_report_access_group} WHERE customer_id='{customer_id}' and group_id='{group_id}' and user_email_id='{email}' and access_mask != 'null' and report_template_name not in {report_included}"
                if len(report_included) == 0:
                    report_select_query = f"SELECT report_template_name,report_type,chart_type FROM {self.view_report_access_group} WHERE customer_id='{customer_id}' and group_id='{group_id}' and user_email_id='{email}' and access_mask != 'null'"
                cursor.execute(report_select_query)
                
                result = cursor.fetchall()
                logging.debug(f"Excluded reports for {frame['dashboard_report_name']}")
                report_excluded = []
                if len(result) > 0:
                    report_excluded = [
                        {
                            "report_name": report["report_template_name"],
                            "report_type": report["report_type"],
                            "chart_type": report["chart_type"],
                        }
                        for report in result
                    ]

                # Get Access
                access_query = (
                    f"SELECT access from {self.combined_dashboard_view} WHERE customer_id='{customer_id}' "
                    f"and group_id='{group_id}' and dashboard_report_name ='{frame['dashboard_report_name']}'"
                )
                cursor.execute(access_query)
                # Commit the transaction
                access_result = cursor.fetchone()
                dashboard_frame = {
                    "frame": parsed_dashboard_data,
                    "dashboard_name": frame["dashboard_report_name"],
                    "dashboard_access": access_result["access"],
                    "report_excluded": report_excluded,
                }
                frames.append(dashboard_frame)
            database_conn.commit()
        
            return {"statusCode":self.conf['codes']['success'],"status": "success", "frames": frames}
        except HTTPException as unexpected_exception:
            logging.error(f"Unexpected error: {unexpected_exception}")
            raise HTTPException(
                status_code=500,
                detail={"statusCode":self.conf['codes']['internal error'],"error":str(unexpected_exception)}
            )
        except Exception as exception:
            logging.error(f"Error occurred in edit_frame: {exception}")
            return {
                "statusCode":self.conf['codes']['internal error'],
                "status": "Failed",
                "message": f"Unable to get the JSON frame due to {exception}",
            }
        finally:
            # Ensure database connections are closed
            if "cursor" in locals() and cursor:
                cursor.close()
            if "database_conn" in locals() and database_conn:
                database_conn.close()

    
    def update_in_db(self, detail):
        """
        This function retrieves a JSON frame associated with a given dashboard report name and customer ID, updates its details(including name, JSON data, and description), and commits the 
        changes to the database. It also updates the access rights table with the new dashboard report name.
        """
        
        cursor_logger = common.CustomLogger()
        logging = cursor_logger.setup_logger()
        logging.debug("list_frame called with detail: %s", detail)
        # database_mysql = db_manager.get_mysql_connection(self.mysql_database_url)
        dashboard_json_frame_data = detail["dashboard_json_frame_data"]
        json_data = json.dumps(dashboard_json_frame_data)
        customer_id = detail["customer_id"]
        old_dashboard_report_name = detail["old_dashboard_report_name"]
        new_dashboard_report_name = detail["new_dashboard_report_name"]
        dashboard_description = detail["dashboard_description"]

        try:
            if detail['database_type']=="mysql":
                database_url = self.mysql_database_url
                database_service = MySQLServices(**database_url)
                database_conn = database_service.connect()
                cursor = database_conn.cursor(dictionary=True)
            elif detail['database_type'] == 'oracle':
                database_url = self.oracle_database_url
                database_service = OracleServices(**database_url)
                database_conn = database_service.connect()
                
            elif detail['database_type'] == 'postgres':
                database_url = self.postgres_database_url
                database_service = PostgreSQLServices(**database_url)
                database_conn = database_service.connect()
                cursor = database_conn.cursor(cursor_factory=RealDictCursor)


            select_query = f"SELECT dashboard_report_id, dashboard_report_name FROM \
                {self.dashboard_report_frame} WHERE dashboard_report_name=%s and\
                        customer_id=%s"
            cursor.execute(select_query, (old_dashboard_report_name, customer_id))
            result = cursor.fetchone()
            if result is None:
                return {
                    "statusCode":self.conf['codes']['no records'],
                    "status": "failed",
                    "message": f"No JsonFrame exist with name {old_dashboard_report_name}",
                }
            update_query = f"UPDATE {self.dashboard_report_frame} SET dashboard_report_name=%s\
                ,dashboard_json_frame_data=%s, dashboard_description=%s \
                    WHERE dashboard_report_id=%s and customer_id=%s"
            logging.debug("Update query: %s", update_query)
            cursor.execute(
                update_query,
                (
                    new_dashboard_report_name,
                    json_data,
                    dashboard_description,
                    result["dashboard_report_id"],
                    customer_id,
                ),
            )

            # Commit the transactio
            database_conn.commit()
            access_update_query = f"UPDATE {self.dashboard_access_right} SET \
                dashboard_report_name=%s WHERE dashboard_report_name = %s and customer_id=%s"
            logging.debug("access Update query: %s", access_update_query)
            cursor.execute(
                access_update_query,
                (new_dashboard_report_name, old_dashboard_report_name, customer_id),
            )

            # Commit the transactio
            database_conn.commit()
            return {"statusCode":self.conf['codes']['success'],"status": "success", "message": "JsonFrame Updated Successfully!"}
        except HTTPException as unexpected_exception:
            raise HTTPException(
                status_code=500,
                detail={"statusCode":self.conf['codes']['internal error'],"error":str(unexpected_exception)}
            )
        except Exception as exception:
            return {
                "statusCode":self.conf['codes']['internal error'],
                "status": "Failed",
                "message": f"Unable to updated the JSON frame due to {exception}",
            }
        finally:
            if "cursor" in locals() and cursor:
                cursor.close()
            if "database_conn" in locals() and database_conn:
                database_conn.close()

    def delete_frame(self, detail):
        """
        This function removes a specified dashboard report frame from the database for a given customer. It also deletes the corresponding access rights associated with the frame.
        """
        cursor_logger = common.CustomLogger()
        logging = cursor_logger.setup_logger()
        logging.debug("delete_frame called with detail: %s", detail)
        customer_id = detail["customer_id"]
        frame_name = detail["frame_name"]
        group_id = detail["group_id"]

        try:
            if detail['database_type']=="mysql":
                database_url = self.mysql_database_url
                database_service = MySQLServices(**database_url)
                database_conn = database_service.connect()
                cursor = database_conn.cursor(dictionary=True)
            elif detail['database_type'] == 'oracle':
                database_url = self.oracle_database_url
                database_service = OracleServices(**database_url)
                database_conn = database_service.connect()
            elif detail['database_type'] == 'postgres':
                database_url = self.postgres_database_url
                database_service = PostgreSQLServices(**database_url)
                database_conn = database_service.connect()
                cursor = database_conn.cursor(cursor_factory=RealDictCursor)

            delete_query = f"DELETE FROM {self.dashboard_report_frame}\
                    WHERE customer_id=%s and dashboard_report_name=%s"
            
            cursor.execute(delete_query, (customer_id, frame_name))
            database_conn.commit()

            access_delete_query = f"DELETE FROM {self.dashboard_access_right} \
                WHERE customer_id=%s and dashboard_report_name=%s"

            cursor.execute(access_delete_query, (customer_id, frame_name))
            database_conn.commit()
            logging.info("Removed frame for customer_id %s", customer_id)
            return {
                "statusCode":self.conf['codes']['success'],
                "status": "success",
                "message": "Removed frame for customer_id {}".format(customer_id),
            }
        except HTTPException as unexpected_exception:
            logging.error("Unexpected error: %s", unexpected_exception)
            raise HTTPException(
                status_code=500,
                detail={"statusCode":self.conf['codes']['internal error'],"error":str(unexpected_exception)}
            )
        except Exception as exception:
            logging.error(f"Error occurred in delete_frame: {exception}")
            return {
                "statusCode":self.conf['codes']['internal error'],
                "status": "Failed",
                "message": f"Unable to delete the JSON frame due to {exception}",
            }
        finally:
            if "cursor" in locals() and cursor:
                cursor.close()
            if "database_conn" in locals() and database_conn:
                database_conn.close()

    def check_frame(self, details):
        """
        This function queries the database to verify if a specific dashboard report frame exists for the provided customer ID.
        """
        cursor_logger = common.CustomLogger()
        logging = cursor_logger.setup_logger()
        logging.debug("check_frame called with details: %s", details)
        dataframe_name = details["dashboard_report_name"]
        customer_id = details["customer_id"]

        try:
            if details['database_type']=="mysql":
                database_url = self.mysql_database_url
                database_service = MySQLServices(**database_url)
                database_conn = database_service.connect()
                cursor = database_conn.cursor(dictionary=True)
            elif details['database_type'] == 'oracle':
                database_url = self.oracle_database_url
                database_service = OracleServices(**database_url)
                database_conn = database_service.connect()
            elif details['database_type'] == 'postgres':
                database_url = self.postgres_database_url
                database_service = PostgreSQLServices(**database_url)
                database_conn = database_service.connect()
                cursor = database_conn.cursor(cursor_factory=RealDictCursor)

            
            select_query = f"SELECT dashboard_report_name FROM {self.dashboard_report_frame} \
                WHERE dashboard_report_name=%s and customer_id=%s "
            cursor.execute(
                select_query,
                (
                    dataframe_name,
                    customer_id,
                ),
            )
            frame_result = cursor.fetchone()
            logging.debug("Frame result: %s", frame_result)
            if frame_result is None:
                logging.info("No frame exist with name :{dataframe_name}")
                return {
                    "statusCode":self.conf['codes']['no records'],
                    "message": "{} frame verified Successfully".format(
                        dataframe_name
                    ),
                    "verify": 0,
                }
            logging.info("Frame exist with name :{dataframe_name}")
            return {
                "statusCode":self.conf['codes']['success'],
                "message": "Frame exist with name {}".format(dataframe_name),
                "verify": 1,
            }
    
        except HTTPException as unexpected_exception:
            logging.error("Unexpected error: %s", unexpected_exception)
            raise HTTPException(
                status_code=500,
                detail={"statusCode":self.conf['codes']['internal error'],"error":str(unexpected_exception)}
            )
        except Exception as exception:
            logging.error("Unable to find the JSON frame due to %s", exception)
            return {
                "statusCode":self.conf['codes']['internal error'],
                "status": "Failed",
                "message": f"Unable to find the JSON frame due to {exception}",
            }
        finally:
            if "cursor" in locals() and cursor:
                cursor.close()
            if "database_conn" in locals() and database_conn:
                database_conn.close()

    def insert_in_db(self, detail):
        """
        Inserts a dashboard JSON frame into the database.It also assigns default access rights 
        to the specified group and ensures the SuperAdmin group has the same access if applicable.
        """
        
        dashboard_json_frame_data = detail["dashboard_json_frame_data"]
        json_data = json.dumps(dashboard_json_frame_data)
        customer_id = detail["customer_id"]
        dashboard_report_name = detail["dashboard_report_name"]
        dashboard_description = detail["dashboard_description"]
        default_access = "rw"
        group_id = detail["group_id"]

        try:
            cursor_logger = common.CustomLogger()
            logging = cursor_logger.setup_logger()
            logging.info("JsonFrame to be inserted into db.")

            if detail['database_type']=="mysql":
                database_url = self.mysql_database_url
                database_service = MySQLServices(**database_url)
                database_conn = database_service.connect()
                cursor = database_conn.cursor(dictionary=True)
            elif detail['database_type'] == 'oracle':
                database_url = self.oracle_database_url
                database_service = OracleServices(**database_url)
                database_conn = database_service.connect()
                
            elif detail['database_type'] == 'postgres':
                database_url = self.postgres_database_url
                database_service = PostgreSQLServices(**database_url)
                database_conn = database_service.connect()
                cursor = database_conn.cursor(cursor_factory=RealDictCursor)
            

            logging.info("fetching frame from db.")
            check_query = f"SELECT dashboard_report_name FROM {self.dashboard_report_frame} \
                WHERE dashboard_report_name=%s and customer_id=%s"
            
            cursor.execute(
                check_query,
                (
                    dashboard_report_name,
                    customer_id,
                )
            )
            frame_result = cursor.fetchone()

            if frame_result is not None:
                logging.info("Frame already exist with name :{dashboard_report_name}")
                return {
                    "statusCode":self.conf['codes']['already exists'],
                    "message": "{} already exist".format(
                        dashboard_report_name
                    ),
                }

            
            insert_query = f"INSERT INTO {self.dashboard_report_frame} \
                (dashboard_json_frame_data, customer_id, dashboard_report_name,\
                    dashboard_description) VALUES (%s, %s, %s, %s)"
            cursor.execute(
                insert_query,
                (
                    json_data,
                    customer_id,
                    dashboard_report_name,
                    dashboard_description,
                ),
            )
            # Commit the transaction
            database_conn.commit()
            access_insert_query = f"INSERT INTO {self.dashboard_access_right} \
                (group_id, dashboard_report_name,access,customer_id) VALUES (%s, %s, %s,%s)"
            cursor.execute(
                access_insert_query,
                (group_id, dashboard_report_name, default_access, customer_id),
            )
            database_conn.commit()
            select_query = f"SELECT group_id, groupname FROM {config['database_tables']['user_group']} \
                            WHERE customer_id=%s and groupname=%s"
            cursor.execute(select_query, (customer_id, "SuperAdmin"))
            frame_result = cursor.fetchall()

            super_admin_group_id = frame_result[0]["group_id"]
        
            if super_admin_group_id != group_id:
                access_insert_query = f"INSERT INTO {self.dashboard_access_right} \
                (group_id, dashboard_report_name,access,customer_id) VALUES (%s, %s, %s,%s)"
                cursor.execute(
                    access_insert_query,
                    (super_admin_group_id, dashboard_report_name, default_access, customer_id),
                )
                database_conn.commit()
            logging.info("JsonFrame Added Successfully!")

            return {"statusCode":self.conf['codes']['success'], "message": "JsonFrame Added Successfully!"}
        except HTTPException as unexpected_exception:
            logging.error("Unexpected error: %s", unexpected_exception)
            raise HTTPException(
                status_code=500,
                detail={"statusCode":self.conf['codes']['internal error'],"error":str(unexpected_exception)}
            )
        except Exception as exception:
            logging.error(f"Unable to add the JSON frame due to {exception}")
            return {
                "statusCode":self.conf['codes']['internal error'],
                "message": f"Unable to add the JSON frame due to {exception}",
            }
        finally:
            # Ensure database connections are closed
            if "cursor" in locals() and cursor:
                cursor.close()
            if "database_conn" in locals() and database_conn:
                database_conn.close()

    def list_access(self, detail):
        """
        Retrieves dashboard access details for a given customer and group ID.

        This function queries the database to fetch access rights associated with 
        the specified customer and group.
        """
        cursor_logger = common.CustomLogger()
        logging = cursor_logger.setup_logger()
        logging.info("list Access details:%s", detail)
        # database_mysql = db_manager.get_mysql_connection(self.mysql_database_url)
        customer_id = detail["customer_id"]
        group_id = detail["group_id"]

        try:
            if detail['database_type']=="mysql":
                database_url = self.mysql_database_url
                database_service = MySQLServices(**database_url)
                database_conn = database_service.connect()
                cursor = database_conn.cursor(dictionary=True)
            elif detail['database_type'] == 'oracle':
                database_url = self.oracle_database_url
                database_service = OracleServices(**database_url)
                database_conn = database_service.connect()
                
            elif detail['database_type'] == 'postgres':
                database_url = self.postgres_database_url
                database_service = PostgreSQLServices(**database_url)
                database_conn = database_service.connect()
                cursor = database_conn.cursor(cursor_factory=RealDictCursor)

            
            select_query = f"SELECT group_id,dashboard_report_name,access,customer_id,\
                default_dashboard  FROM {config['database_tables']['dashboard_access_right']} \
                    WHERE customer_id=%s and group_id=%s"
            cursor.execute(select_query, (customer_id, group_id))
            frame_result = cursor.fetchall()
            database_conn.commit()
            logging.info("Frame result:%s", frame_result)
            return {"statusCode":self.conf['codes']['success'],"status": "success", "frame": frame_result}
        except HTTPException as unexpected_exception:
            logging.error("Internal server error: %s", unexpected_exception)
            raise HTTPException(
                status_code=500,
                detail={"statusCode":self.conf['codes']['internal error'],"error":str(unexpected_exception)}
            )
        except Exception as exception:
            logging.error("Unable to get the JSON frame due to %s", exception)
            return {
                "statusCode":self.conf['codes']['internal error'],
                "status": "Failed",
                "message": f"Unable to get the JSON frame due to {exception}",
            }
        finally:
            # Ensure database connections are closed
            if "cursor" in locals() and cursor:
                cursor.close()
            if "database_conn" in locals() and database_conn:
                database_conn.close()

    def get_list_dashboards(self, detail):
        """
        Retrieves a list of dashboards for a given customer and group from the database.
        """
        cursor_logger = common.CustomLogger()
        logging = cursor_logger.setup_logger()
        logging.info(f"dashboard list {detail}")
        # database_mysql = db_manager.get_mysql_connection(self.mysql_database_url)
        customer_id = detail["customer_id"]
        group_id = detail["group_id"]

        try:
            if detail['database_type']=="mysql":
                database_url = self.mysql_database_url
                database_service = MySQLServices(**database_url)
                database_conn = database_service.connect()
                cursor = database_conn.cursor(dictionary=True)
            elif detail['database_type'] == 'oracle':
                database_url = self.oracle_database_url
                database_service = OracleServices(**database_url)
                database_conn = database_service.connect()
                
            elif detail['database_type'] == 'postgres':
                database_url = self.postgres_database_url
                database_service = PostgreSQLServices(**database_url)
                database_conn = database_service.connect()
                cursor = database_conn.cursor(cursor_factory=RealDictCursor)

            select_query = f"SELECT dashboard_report_name,customer_id,group_id,\
                access,dashboard_description,groupname FROM {self.combined_dashboard_view} \
                    WHERE customer_id=%s and group_id=%s and access!= 'null'"
            cursor.execute(select_query, (customer_id, group_id))
            frame_result = cursor.fetchall()
            database_conn.commit()
            logging.info(f"Dashboard list:{frame_result}")
            return {"statusCode":self.conf['codes']['success'],"status": "success", "dashboards": frame_result}
        except HTTPException as unexpected_exception:
            logging.error(f"Internal server error: {unexpected_exception}")
            raise HTTPException(
                status_code=500,
                detail={"statusCode":self.conf['codes']['internal error'],"error":str(unexpected_exception)}
            )
        except Exception as exception:
            logging.error(f"Unable to get the dashboard list due to {exception}")
            return {
                "statusCode":self.conf['codes']['internal error'],
                "status": "Failed",
                "message": f"Unable to get the dashboard list due to {exception}",
            }
        finally:
            if "cursor" in locals() and cursor:
                cursor.close()
            if "database_conn" in locals() and database_conn:
                database_conn.close()

    def get_list_dashboards_name(self, detail):
        """
        Retrieves a list of distinct dashboard names along with their descriptions for a given customer ID.
        """
        cursor_logger = common.CustomLogger()
        logging = cursor_logger.setup_logger()
        logging.info(f"dashboard list name {detail}")
        # database_mysql = db_manager.get_mysql_connection(self.mysql_database_url)
        customer_id = detail["customer_id"]

        try:
            if detail['database_type']=="mysql":
                database_url = self.mysql_database_url
                database_service = MySQLServices(**database_url)
                database_conn = database_service.connect()
                cursor = database_conn.cursor(dictionary=True)
            elif detail['database_type'] == 'oracle':
                database_url = self.oracle_database_url
                database_service = OracleServices(**database_url)
                database_conn = database_service.connect()
                
            elif detail['database_type'] == 'postgres':
                database_url = self.postgres_database_url
                database_service = PostgreSQLServices(**database_url)
                database_conn = database_service.connect()
                cursor = database_conn.cursor(cursor_factory=RealDictCursor)

            select_query = f"SELECT DISTINCT dashboard_report_name,customer_id,\
                dashboard_description FROM {self.combined_dashboard_view} WHERE\
                        customer_id=%s"
            cursor.execute(select_query, (customer_id,))
            frame_result = cursor.fetchall()
            
            database_conn.commit()
            logging.info(f"Dashboard list Name:{frame_result}")
            return {"statusCode":self.conf['codes']['success'],"status": "success", "dashboards": frame_result}
        except HTTPException as unexpected_exception:
            logging.error(f"Internal server error: {unexpected_exception}")
            raise HTTPException(
                status_code=500,
                detail={"statusCode":self.conf['codes']['internal error'],"error":str(unexpected_exception)}
            )
        except Exception as exception:
            logging.error(f"Unable to get the dashboard list due to {exception}")
            return {
                "statusCode":self.conf['codes']['internal error'],
                "status": "Failed",
                "message": f"Unable to get the dashboard list due to {exception}",
            }
        finally:
            if "cursor" in locals() and cursor:
                cursor.close()
            if "database_conn" in locals() and database_conn:
                database_conn.close()

    def update_access(self, detail):
        """
        Updates the dashboard access rights for a specific customer and group.
        """
        cursor_logger = common.CustomLogger()
        logging = cursor_logger.setup_logger()
        logging.info(f"dashboard access {detail}")
        # database_mysql = db_manager.get_mysql_connection(self.mysql_database_url)
        customer_id = detail["customer_id"]
        group_id = detail["group_id"]
        default_dashboard_list = detail["default_dashboard"]
        database_type = detail['database_type']
        database_conn = None
        
        try:
            if detail['database_type']=="mysql":
                database_url = self.mysql_database_url
                database_service = MySQLServices(**database_url)
                database_conn = database_service.connect()
                cursor = database_conn.cursor(dictionary=True, buffered=True)
            elif detail['database_type'] == 'oracle':
                database_url = self.oracle_database_url
                database_service = OracleServices(**database_url)
                database_conn = database_service.connect()
                
            elif detail['database_type'] == 'postgres':
                database_url = self.postgres_database_url
                database_service = PostgreSQLServices(**database_url)
                database_conn = database_service.connect()
                cursor = database_conn.cursor(cursor_factory=RealDictCursor)

            for dashboard, access in dict(detail["dashboard_access"]).items():
                select_query = f"SELECT dashboard_report_name FROM \
                    {config['database_tables']['dashboard_access_right']} \
                        WHERE dashboard_report_name=%s and customer_id=%s and group_id=%s"
                cursor.execute(select_query, (dashboard, customer_id, group_id))
                result = cursor.fetchone()
                if access == "":
                    access = "null"
                if result is None:
                    insert_query = "INSERT INTO dashboard_access_right \
                        (group_id, dashboard_report_name,access,customer_id)\
                            VALUES (%s, %s, %s, %s)"
                    cursor.execute(
                        insert_query, (group_id, dashboard, access, customer_id)
                    )
                    database_conn.commit()
                update_query = "UPDATE dashboard_access_right SET access=%s WHERE \
                    dashboard_report_name=%s and customer_id=%s and group_id=%s"
                cursor.execute(
                    update_query, (access, dashboard, customer_id, group_id)
                )
                database_conn.commit()
            
            # Clear the default_dashboard column
            update_query_clear = f"UPDATE {config['database_tables']['dashboard_access_right']} SET default_dashboard=NULL \
                WHERE customer_id=%s and group_id=%s"
            cursor.execute(update_query_clear, (customer_id, group_id))
            database_conn.commit()

            # Update the default_dashboard with the corresponding index values
            for item in default_dashboard_list:
                dashboard_name = item["dashboard_name"]
                index_value = item["index"]
                if index_value is not None:  # Only update if index is provided
                    update_query_default = f"UPDATE {config['database_tables']['dashboard_access_right']} SET default_dashboard=%s \
                        WHERE dashboard_report_name=%s and customer_id=%s and group_id=%s"
                    cursor.execute(
                        update_query_default,
                        (index_value, dashboard_name, customer_id, group_id),
                    )
                    database_conn.commit()

            logging.info("Dashboard access updated successfully.")
        
            return {"statusCode":self.conf['codes']['success'],"status": "success", "message": "Access updated successfully."}
        except HTTPException as unexpected_exception:
            logging.error(f"Internal server error: {unexpected_exception}")
            raise HTTPException(
                status_code=500,
                detail={"statusCode":self.conf['codes']['internal error'],"error":str(unexpected_exception)}
            )
        except Exception as exception:
            logging.error(f"Unable to update dashboard access due to {exception}")
            return {
                "statusCode":self.conf['codes']['internal error'],
                "status": "Failed",
                "message": f"Unable to update dashboard access due to {exception}",
            }
        finally:
            if "cursor" in locals() and cursor:
                cursor.close()
            if "database_conn" in locals() and database_conn:
                database_conn.close()
