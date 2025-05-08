"""
This module is responsible for handling report-related operations such as fetching report templates, getting report details, and accessing reports etc.
"""
import json
import base64
from typing import Optional
import os
import ast
from datetime import datetime
from mimetypes import guess_extension
from pathlib import Path
from fastapi import HTTPException, UploadFile, File, Form, status
from fastapi.responses import JSONResponse
from fastapi.responses import StreamingResponse
from psycopg2.extras import RealDictCursor
import psycopg2
import requests
from database_services.common import CommonDatabaseServices
from utilities.config import config
import utilities.loggings as LOGGINGS
from pydantic_models.report_model import Condition,updateReport_input,\
      UploadImageRequest, upload_csv_input
# from database_services.postgres_service import PostgreSQLServices
import zlib
import io
from database_services.common import DatabaseChunkProcessor
# from database_services.mysql_service import MySQLServices, generate_where_clause_mysql
from database_services.common import MySQLServices, generate_where_clause_mysql
# from database_services.postgres_service import PostgreSQLServices, generate_where_clause_postgres
from database_services.common import PostgreSQLServices, generate_where_clause_postgres, generate_where_clause_vertica
from database_services.common import OracleServices
from fastapi.responses import StreamingResponse

# pylint: disable=E0401
# pylint: disable=logging-fstring-interpolation
# pylint: disable=raise-missing-from
# pylint: disable=unspecified-encoding
# pylint: disable=invalid-name
# pylint: disable=broad-exception-caught

db_services = CommonDatabaseServices()


class ReportManager:
    """
    ReportManager class is responsible for handling different operations related to\
          report retrieval and access
    for users. It includes functions to fetch reports, access templates, and get\
          details based on user and group details.
    """

    def __init__(self):
        """
        Initialize the ReportManager class with necessary services like \
            database service (db_services) and logging.
        Also, defines allowed file extensions for reports.
        """

        try:
            cursor_logger = LOGGINGS.CustomLogger()
            logging = cursor_logger.setup_logger()
            self.db_services = db_services
            # self.dask_service = dask_service
            self.database_chunk_processor = DatabaseChunkProcessor()
            self.conf = config
            self.ALLOWED_EXTENSIONS = set(
                [
                    "png",
                    "jpg",
                    "jpeg",
                    "gif",
                    "pdf",
                    "txt",
                    "xlsx",
                    "docx",
                    "pptx",
                    "pptm",
                    "ppt",
                    "xlsm",
                ]
            )
        except Exception as e:
            logging.error(f"Error initializing ReportManager: {e}")
            raise

        try:

            self.mysql_database_url = {
                "host": self.conf['mysql']['mysql_host'],
                "port": self.conf['mysql']['mysql_port'],
                "username": self.conf['mysql']['mysql_username'],
                "password": self.conf['mysql']['mysql_password'],
                "database": self.conf['mysql']['mysql_new_schema'],
            }

            self.oracle_database_url = {
                
            }
            self.postgres_database_url = {
                "host": self.conf["postgres"]["postgres_host"],
                "port": self.conf["postgres"]["postgres_port"],
                "username": self.conf["postgres"]["postgres_username"],
                "password": self.conf["postgres"]["postgres_password"],
                "database": self.conf["postgres"]["postgres_schema"],
            }
        except Exception as e:
            logging.error(f"Error initializing database URLs: {e}")
            return{
                "StatusCode":int(config['codes']['database error']),
                "error":f"Database URL error: {e}",
            }


        try:
            self.CHART_PATH = os.path.join(
                os.path.dirname(os.path.abspath(__file__)),
                "..",
                "config",
                "sample_chart.json",
            )
        except Exception as e:
            logging.error(f"Error initializing chart path: {e}")
            return{
                "StatusCode":int(config['codes']['configuration file missing']),
                "error":f"Chart path error: {e}",
            }

    # async def get_report(self, user_details: dict):
    #     """
    #     This function fetches a list of report templates based on user details such \
    #         as customer_id, group_id,
    #     and email. It queries the MySQL database for reports that the user has access to.

    #     - If the reports are found, they are returned in JSON format.
    #     - If no reports are found, an appropriate message is returned.
    #     - In case of an error, it logs the error and returns an internal server error response.
    #     """
    #     try:
    #         # Extract user details from the input dictionary
    #         cursor_logger = LOGGINGS.CustomLogger()
    #         logging = cursor_logger.setup_logger()
    #         customer_id = user_details.get("customer_id")
    #         email = user_details.get("email")
    #         database_type = user_details.get("database_type")
    #         group_id = user_details.get("group_id")

    #         # Log the received request
    #         logging.info(
    #             f"Request received: customer_id={customer_id}, email={email}, \
    #                 database_type={database_type}, group_id={group_id}"
    #         )

    #         if database_type == "mysql":
    #             # Prepare MySQL database connection details
    #             mysql_database_url = {
    #                 "host": config["mysql"]["mysql_host"],
    #                 "port": config["mysql"]["mysql_port"],
    #                 "username": config["mysql"]["mysql_username"],
    #                 "password": config["mysql"]["mysql_password"],
    #                 "schema": config["mysql"]["mysql_new_schema"],
    #             }

    #             # Establish a connection to MySQL database
    #             database_mysql = db_services.get_mysql_connection(mysql_database_url)

    #             # Query to fetch report templates the user has access to
    #             with database_mysql.cursor(dictionary=True) as cursor:
    #                 report_templates = []
    #                 cursor.execute(
    #                     f"select * from {config['database_tables']['view_report_access_group']}\
    #                           where customer_id = %s and group_id = %s and access_mask != 'null'\
    #                               and user_email_id = %s ORDER BY report_id DESC",
    #                     (customer_id, group_id, email),
    #                 )
    #                 result = cursor.fetchall()

    #                 for item in result:
    #                     db_details_id = item["db_details_id"]
    #                     cursor.execute(
    #                         f"select rdbms_name, db_schema_name from {config['database_tables']['database_details']} "
    #                         f"where db_details_id = %s",
    #                         (db_details_id,)
    #                     )
    #                     db_details = cursor.fetchone()
                        
    #                     report_templates.append(
    #                         {
    #                             "report_id": item["report_id"],
    #                             "report_name": item["report_template_name"],
    #                             "report_type": item["report_type"],
    #                             "chart_type": item["chart_type"],
    #                             "drilldown": item["enable_drilldown"],
    #                             "rdbms_name": db_details["rdbms_name"] if db_details else None,
    #                             "db_schema_name": db_details["db_schema_name"] if db_details else None,
    #                             "access_mask": item["access_mask"],
    #                         }
    #                     )
    #                 database_mysql.close()

    #                 # Return the fetched report templates
    #                 if len(report_templates) > 0:
    #                     return JSONResponse(
    #                         status_code=status.HTTP_200_OK, content=report_templates
    #                     )
    #                 else:
    #                     # Log and return message if no templates found
    #                     logging.info(
    #                         f"No templates found for customer_id={customer_id}, group_id={group_id}"
    #                     )
    #                     return JSONResponse(
    #                         status_code=status.HTTP_204_NO_CONTENT,
    #                         content="No Templates Found",
    #                     )

    #     except Exception as unexpected_exception:
    #         # Log any unexpected exception and return an error response
    #         logging.error(
    #             f"Unexpected error: {unexpected_exception}", exc_info=True
    #         )
    #         return JSONResponse(
    #             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    #             content=f"Internal server error: {unexpected_exception}",
    #         )

    async def get_report(self, user_details: dict):
        """
        This function fetches a list of report templates based on user details such \
            as customer_id, group_id,
        and email. It queries the MySQL database for reports that the user has access to.

        - If the reports are found, they are returned in JSON format.
        - If no reports are found, an appropriate message is returned.
        - In case of an error, it logs the error and returns an internal server error response.
        """
        try:
            # Extract user details from the input dictionary
            cursor_logger = LOGGINGS.CustomLogger()
            logging = cursor_logger.setup_logger()
            customer_id = user_details.get("customer_id")
            email = user_details.get("email")
            database_type = user_details.get("database_type")
            group_id = user_details.get("group_id")

            # Log the received request
            logging.info(
                f"Request received: customer_id={customer_id}, email={email}, \
                    database_type={database_type}, group_id={group_id}"
            )
            try:
                if database_type == "mysql":
                    database_url = self.mysql_database_url
                    database_service = MySQLServices(**database_url)
                    database_service.connect()
                    logging.info("Using MySQL database service.")
                elif database_type == "oracle":
                    database_url = self.oracle_database_url
                    database_service = OracleServices(**database_url)
                    database_service.connect()
                    logging.info("Using Oracle database service.")
                elif database_type == "postgres":
                    database_url = self.postgres_database_url
                    database_service = PostgreSQLServices(**database_url)
                    database_service.connect()
            except Exception as e:
                logging.error(f"Error connecting to database: {e}")
                return {
                    "StatusCode":int(config['codes']['database error']),
                    "error":f"Database connection error: {e}",
                }
            report_templates = []
            try:
                query = f"""
                    SELECT * FROM {config['database_tables']['view_report_access_group']}
                    WHERE customer_id = %s 
                    AND group_id = %s 
                    AND access_mask != 'null' 
                    AND user_email_id = %s 
                    ORDER BY report_id DESC
                """
                params = [customer_id, group_id, email]
                result = database_service.execute_query(query=query, params=params)
            except Exception as e:
                logging.error(f"Error executing query: {e}")
                return {
                    "StatusCode":int(config['codes']['database error']),
                    "error":f"Query execution error: {e}",
                }
            # result = cursor.fetchall()
            for item in result:
                db_details_id = item["db_details_id"]
                # cursor.execute(
                #     f"select rdbms_name, db_schema_name from {config['database_tables']['database_details']} "
                #     f"where db_details_id = %s",
                #     (db_details_id,)
                # )
                try:

                    db_details = database_service.read_records(
                        table=config['database_tables']['database_details'],
                        columns=["rdbms_name", "db_schema_name"],
                        where_conditions={"db_details_id": db_details_id}
                    )
                except Exception as e:
                    logging.error(f"Error fetching database details: {e}")
                    return {
                        "StatusCode":int(config['codes']['database error']),
                        "error":f"Database details error: {e}",
                    }
                # db_details = cursor.fetchone()
                report_templates.append(
                    {
                        "report_id": item["report_id"],
                        "report_name": item["report_template_name"],
                        "report_type": item["report_type"],
                        "chart_type": item["chart_type"],
                        "drilldown": item["enable_drilldown"],
                        "rdbms_name": db_details[0]["rdbms_name"] if db_details[0] else None,
                        "db_schema_name": db_details[0]["db_schema_name"] if db_details[0] else None,
                        "access_mask": item["access_mask"],
                    }
                )
            # database_mysql.close()

            # Return the fetched report templates
            if len(report_templates) > 0:
                # database_service.close_connection()
                return{
                    "StatusCode":int(config['codes']['success']),
                    "content":report_templates,
                }
            else:
                # Log and return message if no templates found
                logging.info(
                    f"No templates found for customer_id={customer_id}, group_id={group_id}"
                )
                # database_service.close_connection()
                return{
                    "StatusCode":int(config['codes']['no records']),
                    "error":f"No Templates Found",
                }
            
                # return JSONResponse(
                #     status_code=status.HTTP_204_NO_CONTENT,
                #     content="No Templates Found",
                # )

        except Exception as unexpected_exception:
            # Log any unexpected exception and return an error response
            logging.error(
                f"Unexpected error: {unexpected_exception}", exc_info=True
            )
            # database_service.close_connection()
            return{
                "StatusCode":int(config['codes']['internal error']),
                "error":f"Internal server error: {unexpected_exception}",
            }
        finally:
            database_service.close_connection()

    # async def get_reportTemplate(self, user_details: dict):
    #     """
    #     This function fetches all the report templates available for a given user based on \
    #         their role.
    #     If the user belongs to an 'Admin' group, it returns all report templates for that \
    #         customer.
    #     For other groups, it fetches templates mapped to their group.
    #     """
    #     try:
    #         cursor_logger = LOGGINGS.CustomLogger()
    #         logging = cursor_logger.setup_logger()
    #         # Log the received request
    #         logging.info("Received request with user details: %s", user_details)
    #         email = user_details.get("email")
    #         # group_id = user_details.get("group_id")
    #         database_type = user_details.get("database_type")

    #         if database_type == "mysql":
    #             # Prepare MySQL database connection details
    #             mysql_database_url = {
    #                 "host": config["mysql"]["mysql_host"],
    #                 "port": config["mysql"]["mysql_port"],
    #                 "username": config["mysql"]["mysql_username"],
    #                 "password": config["mysql"]["mysql_password"],
    #                 "schema": config["mysql"]["mysql_new_schema"],
    #             }

    #             # Establish a connection to MySQL database
    #             database_mysql = db_services.get_mysql_connection(mysql_database_url)
    #             logging.info("Connected to MySQL database")

    #             # Query to fetch the user’s customer_id and group_id using their email
    #             with database_mysql.cursor(dictionary=True) as cursor:
    #                 cursor.execute(
    #                     f"select customer_id, group_id from\
    #                           {config['database_tables']['user_account']}\
    #                               where user_email_id = %s",
    #                     (email,),
    #                 )
    #                 result = cursor.fetchall()

    #                 # Handle case where no user is found
    #                 if not result:
    #                     logging.warning("No user found with email: %s", email)
    #                     raise HTTPException(status_code=404, detail="User not found")

    #                 # Extract customer_id and group_id from the result
    #                 customer_id = result[0]["customer_id"]
    #                 group_id = result[0]["group_id"]

    #                 # Fetch group name to determine the user’s role
    #                 logging.info("Fetching group name for group_id: %s", group_id)
    #                 cursor.execute(
    #                     f"select groupname from {config['database_tables']['user_group']} \
    #                         where group_id = %s",
    #                     (group_id,),
    #                 )
    #                 result = cursor.fetchall()
    #                 groupname = result[0]["groupname"]

    #                 if groupname in ["SuperAdmin"]:
    #                     # If the user is an Admin, fetch all report templates
    #                     logging.info(
    #                         "User is an Admin. Fetching all report templates for customer_id: %s",
    #                         customer_id,
    #                     )
    #                     cursor.execute(
    #                         f"select * from {config['database_tables']['report_template']} \
    #                             where customer_id = %s ORDER BY report_id DESC",
    #                         (customer_id,),
    #                     )
    #                     result = cursor.fetchall()

    #                     # Prepare the report templates response
    #                     report_templates = [
    #                         {
    #                             "report_id": item["report_id"],
    #                             "report_name": item["report_template_name"],
    #                             "report_type": item["report_type"],
    #                             "chart_type": item["chart_type"],
    #                             "drilldown": item["enable_drilldown"],
    #                             "query": item["defined_query"],
    #                             "start_date": item["start_date"],
    #                             "end_date": item["end_date"],
    #                             "enable_drilldown": item["enable_drilldown"],
    #                             "auto_update_interval": item["auto_update_interval"],
    #                             "time_period": item["time_period"],
    #                             "show_in_dashboard": item["show_in_dashboard"],
    #                         }
    #                         for item in result
    #                     ]

    #                     # Close MySQL connection
    #                     database_mysql.close()

    #                     # Return the report templates
    #                     logging.info(
    #                         "Successfully fetched and returned report templates for Admin user"
    #                     )
    #                     return JSONResponse(
    #                         status_code=status.HTTP_200_OK, content=report_templates
    #                     )
    #                 elif groupname:
    #                     # If the user is in another group, fetch group-specific report templates
    #                     report_templates = []
    #                     logging.info(
    #                         "User is in group: %s. Fetching report templates", groupname
    #                     )

    #                     # Query to fetch report templates mapped to the group
    #                     cursor.execute(
    #                         f"select * from {config['database_tables']['group_report_map']}\
    #                               where group_id = %s",
    #                         (group_id,),
    #                     )
    #                     result = cursor.fetchall()
    #                     report_template_ids = [data["report_id"] for data in result]

    #                     for i in report_template_ids:
    #                         cursor.execute(
    #                             f"select report_id, report_template_name, report_type,\
    #                                   chart_type, enable_drilldown from\
    #                                       {config['database_tables']['report_template']}\
    #                                           where customer_id = %s and report_id = %s\
    #                                               ORDER BY report_id DESC",
    #                             (customer_id, i),
    #                         )
    #                         result = cursor.fetchall()
    #                         report_templates.append(
    #                             {
    #                                 "report_id": result[0]["report_id"],
    #                                 "report_name": result[0]["report_template_name"],
    #                                 "report_type": result[0]["report_type"],
    #                                 "chart_type": result[0]["chart_type"],
    #                                 "drilldown": result[0]["enable_drilldown"],
    #                             }
    #                         )

    #                     # Close MySQL connection
    #                     database_mysql.close()

    #                     # Return the group-specific report templates
    #                     logging.info(
    #                         "Successfully fetched and returned report templates for user group"
    #                     )
    #                     return JSONResponse(
    #                         status_code=status.HTTP_200_OK, content=report_templates
    #                     )
    #                 else:
    #                     # No templates found case
    #                     database_mysql.close()
    #                     logging.warning("No templates found for user")
    #                     return JSONResponse(
    #                         status_code=status.HTTP_200_OK,
    #                         content="No Templates Found",
    #                     )

    #     except Exception as unexpected_exception:
    #         # Log any unexpected exception and return an error response
    #         logging.error("Unexpected error: %s", unexpected_exception)
    #         raise HTTPException(
    #             status_code=500, detail=f"Internal server error: {unexpected_exception}"
    #         )

    async def get_reportTemplate(self, user_details: dict):
        """
        This function fetches all the report templates available for a given user based on \
            their role.
        If the user belongs to an 'Admin' group, it returns all report templates for that \
            customer.
        For other groups, it fetches templates mapped to their group.
        """
        try:
            cursor_logger = LOGGINGS.CustomLogger()
            logging = cursor_logger.setup_logger()
            # Log the received request
            logging.info("Received request with user details: %s", user_details)
            email = user_details.get("email")
            group_id = user_details.get("group_id")
            database_type = user_details.get("database_type")

            try:

                if database_type == "mysql":
                    database_url = self.mysql_database_url
                    database_service = MySQLServices(**database_url)
                    cursor = database_service.connect().cursor(dictionary=True)
                    logging.info("Using MySQL database service.")
                elif database_type == "oracle":
                    database_url = self.oracle_database_url
                    database_service = OracleServices(**database_url)
                    cursor = database_service.connect().cursor(dictionary=True)
                    logging.info("Using Oracle database service.")
                elif database_type == "postgres":
                    database_url = self.postgres_database_url
                    database_service = PostgreSQLServices(**database_url)
                    cursor = database_service.connect().cursor(cursor_factory=RealDictCursor)
                    logging.info("Using Postgres database service.")
                else:
                    logging.error(f"Unsupported database type: {database_type}")
                    return{
                        "StatusCode":int(config['codes']['incorrect parameters']),
                        "error":f"Unsupported database type: {database_type}",
                    }
            except Exception as e:
                logging.error(f"Error connecting to database: {e}")
                return {
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Database connection error: {e}",
                }

            
            logging.info(f"Connected to {database_type} database")

            # Query to fetch the user’s customer_id and group_id using their email
        # with database_mysql.cursor(dictionary=True) as cursor:
        #     cursor.execute(
        #         f"select customer_id, group_id from\
        #               {config['database_tables']['user_account']}\
        #                   where user_email_id = %s",
        #         (email,),
        #     )
        #     result = cursor.fetchall()
    
            columns = ["customer_id", "group_id"]
            try:
                result = database_service.read_records(
                    table=config['database_tables']['user_account'],
                    columns=columns,
                    where_conditions={"user_email_id": email}
                )
            except Exception as e:
                logging.error(f"Error fetching user details: {e}")
                return {
                        "StatusCode":int(config['codes']['database error']),
                        "Error":f"User details error: {e}",
                    }

            # Handle case where no user is found
            if not result:
                logging.warning("No user found with email: %s", email)
                raise HTTPException(status_code=404, detail="User not found")

            # Extract customer_id and group_id from the result
            customer_id = result[0]["customer_id"]
            group_id = result[0]["group_id"]

            # Fetch group name to determine the user’s role
            logging.info("Fetching group name for group_id: %s", group_id)
            # cursor.execute(
            #     f"select groupname from {config['database_tables']['user_group']} \
            #         where group_id = %s",
            #     (group_id,),
            # )
            # result = cursor.fetchall()
            columns = ["groupname"]
            try:
                result = database_service.read_records(
                    table=config['database_tables']['user_group'],
                    columns=columns,
                    where_conditions={"group_id": group_id}
                )
            except Exception as e:
                logging.error(f"Error fetching group name: {e}")
                return {
                        "StatusCode":int(config['codes']['database error']),
                        "Error":f"Group name error: {e}",
                    }

                
            groupname = result[0]["groupname"]

            if groupname in ["SuperAdmin"]:
                # If the user is an Admin, fetch all report templates
                logging.info(
                    "User is an Admin. Fetching all report templates for customer_id: %s",
                    customer_id,
                )
                try:
                    cursor.execute(
                        f"select * from {config['database_tables']['report_template']} \
                            where customer_id = %s ORDER BY report_id DESC",
                        (customer_id,),
                    )
                    result = cursor.fetchall()
                except Exception as e:
                    logging.error(f"Error fetching report templates: {e}")
                    return {
                        "StatusCode":int(config['codes']['database error']),
                        "Error":f"Report templates error: {e}",
                    }


                # Prepare the report templates response
                report_templates = [
                    {
                        "report_id": item["report_id"],
                        "report_name": item["report_template_name"],
                        "report_type": item["report_type"],
                        "chart_type": item["chart_type"],
                        "drilldown": item["enable_drilldown"],
                        "query": item["defined_query"],
                        "start_date": item["start_date"],
                        "end_date": item["end_date"],
                        "enable_drilldown": item["enable_drilldown"],
                        "auto_update_interval": item["auto_update_interval"],
                        "time_period": item["time_period"],
                        "show_in_dashboard": item["show_in_dashboard"],
                    }
                    for item in result
                ]

                # Return the report templates
                logging.info(
                    "Successfully fetched and returned report templates for Admin user"
                )
                return{
                    "StatusCode":int(config['codes']['success']),
                    "content":report_templates,
                }
            elif groupname:
                # If the user is in another group, fetch group-specific report templates
                report_templates = []
                logging.info(
                    "User is in group: %s. Fetching report templates", groupname
                )

                # Query to fetch report templates mapped to the group
                # cursor.execute(
                #     f"select * from {config['database_tables']['group_report_map']}\
                #           where group_id = %s",
                #     (group_id,),
                # )
                # result = cursor.fetchall()
                try:
                    columns = ["*"]
                    result = database_service.read_records(
                        table=config['database_tables']['group_report_map'],
                        columns=columns,
                        where_conditions={"group_id": group_id}
                    )
                except Exception as e:
                    logging.error(f"Error fetching group report map: {e}")
                    return {
                        "StatusCode":int(config['codes']['database error']),
                        "Error":f"Group report map error: {e}",
                    }

                report_template_ids = [data["report_id"] for data in result]

                for i in report_template_ids:
                    try:
                            
                        cursor.execute(
                            f"select report_id, report_template_name, report_type,\
                                    chart_type, enable_drilldown from\
                                        {config['database_tables']['report_template']}\
                                            where customer_id = %s and report_id = %s\
                                                ORDER BY report_id DESC",
                            (customer_id, i),
                        )
                        result = cursor.fetchall()
                    except Exception as e:
                        logging.error(f"Error fetching report template: {e}")
                        return {
                            "StatusCode":int(config['codes']['database error']),
                            "Error":f"Report template error: {e}",
                        }
   
                    report_templates.append(
                        {
                            "report_id": result[0]["report_id"],
                            "report_name": result[0]["report_template_name"],
                            "report_type": result[0]["report_type"],
                            "chart_type": result[0]["chart_type"],
                            "drilldown": result[0]["enable_drilldown"],
                        }
                    )


                # Return the group-specific report templates
                logging.info(
                    "Successfully fetched and returned report templates for user group"
                )
                return{
                    "StatusCode":int(config['codes']['success']),
                    "content":report_templates,
                }
            else:
                # No templates found case
 
                logging.warning("No templates found for user")
                return{
                    "StatusCode":int(config['codes']['no records']),
                    "Error":f"No Templates Found",
                }

        except Exception as unexpected_exception:
            # Log any unexpected exception and return an error response
            logging.error("Unexpected error: %s", unexpected_exception)
            return{
                "StatusCode":int(config['codes']['internal error']),
                "Error":f"Internal server error: {unexpected_exception}",
            }

        finally:
            database_service.close_connection()

    # async def get_access(self, user_details: dict):
    #     """
    #     This function retrieves report access details for a specific user group based on the\
    #           group_id and customer_id.
    #     It fetches the list of reports that the group has access to from the MySQL database.
    #     """
    #     try:
    #         cursor_logger = LOGGINGS.CustomLogger()
    #         logging = cursor_logger.setup_logger()
    #         # Log the received request
    #         logging.info("Received request with user details: %s", user_details)
    #         group_id = user_details.get("group_id")
    #         customer_id = user_details.get("customer_id")
    #         database_type = user_details.get("database_type")

    #         if database_type == "mysql":
    #             # Prepare MySQL database connection details
    #             mysql_database_url = {
    #                 "host": config["mysql"]["mysql_host"],
    #                 "port": config["mysql"]["mysql_port"],
    #                 "username": config["mysql"]["mysql_username"],
    #                 "password": config["mysql"]["mysql_password"],
    #                 "schema": config["mysql"]["mysql_new_schema"],
    #             }

    #             # Establish a connection to MySQL database
    #             database_mysql = db_services.get_mysql_connection(mysql_database_url)
    #             logging.info("Connected to MySQL database")

    #             # Query to fetch report access for the group
    #             with database_mysql.cursor(dictionary=True) as cursor:
    #                 logging.info(
    #                     "Fetching report access for group_id: %s and customer_id: %s",
    #                     group_id,
    #                     customer_id,
    #                 )
    #                 cursor.execute(
    #                     f"select * from {config['database_tables']['view_report_access_group']} \
    #                         where group_id = %s and customer_id = %s",
    #                     (group_id, customer_id),
    #                 )
    #                 result = cursor.fetchall()

    #                 # Close MySQL connection
    #                 database_mysql.close()

    #                 # Return the fetched report access details
    #                 logging.info(
    #                     "Successfully fetched and returned report accesses"
    #                 )
    #                 return JSONResponse(status_code=status.HTTP_200_OK, content=result)

    #     except Exception as unexpected_exception:
    #         # Log any unexpected exception and return an error response
    #         logging.error("Unexpected error: %s", unexpected_exception)
    #         raise HTTPException(
    #             status_code=500, detail=f"Internal server error: {unexpected_exception}"
    #         )

    async def get_access(self, user_details: dict):
        """
        This function retrieves report access details for a specific user group based on the\
              group_id and customer_id.
        It fetches the list of reports that the group has access to from the MySQL database.
        """
        try:
            cursor_logger = LOGGINGS.CustomLogger()
            logging = cursor_logger.setup_logger()
            # Log the received request
            logging.info("Received request with user details: %s", user_details)
            group_id = user_details.get("group_id")
            customer_id = user_details.get("customer_id")
            database_type = user_details.get("database_type")
            try: 
                    
                if database_type == "mysql":
                    database_url = self.mysql_database_url
                    database_service = MySQLServices(**database_url)
                    database_service.connect().cursor(dictionary=True)
                    logging.info("Using MySQL database service.")
                elif database_type == "oracle":
                    database_url = self.oracle_database_url
                    database_service = OracleServices(**database_url)
                    database_service.connect().cursor(dictionary=True)
                    logging.info("Using Oracle database service.")
                elif database_type == "postgres":
                    database_url = self.postgres_database_url
                    database_service = PostgreSQLServices(**database_url)
                    database_service.connect().cursor(cursor_factory=RealDictCursor)
                    logging.info("Using Postgres database service.")
                else:
                    logging.error(f"Unsupported database type: {database_type}")
                    return{
                        "StatusCode":int(config['codes']['incorrect parameters']),
                        "error":f"Unsupported database type: {database_type}",
                    }
            except Exception as e:
                logging.error(f"Error connecting to database: {e}")
                return {
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Database connection error: {e}",
                }

            
            logging.info(f"Connected to {database_type} database")

            logging.info(
                "Fetching report access for group_id: %s and customer_id: %s",
                group_id,
                customer_id,
            )
            try:
                    
                columns = ["*"]
                result = database_service.read_records(
                    table=config['database_tables']['view_report_access_group'],
                    columns=columns,
                    where_conditions={"group_id": group_id, "customer_id": customer_id}
                )
            except Exception as e:
                logging.error(f"Error fetching report access: {e}")
                return {
                        "StatusCode":int(config['codes']['database error']),
                        "Error":f"Report access error: {e}",
                    }

            # Return the fetched report access details
            logging.info(
                "Successfully fetched and returned report accesses"
            )
            return{
                "StatusCode":int(config['codes']['success']),
                "content":result,
            }

        except Exception as unexpected_exception:
            # Log any unexpected exception and return an error response
            logging.error("Unexpected error: %s", unexpected_exception)
            return{
                "StatusCode":int(config['codes']['internal error']),
                "Error":f"Internal server error: {unexpected_exception}",
            }
        finally:
            database_service.close_connection()

    async def get_report_detail(self, user_details: dict):
        try:
            cursor_logger = LOGGINGS.CustomLogger()
            logging = cursor_logger.setup_logger()
            logging.info("Received request with user details: %s", user_details)
            report_id = user_details.get("report_id")
            database_type = user_details.get("database_type")
            try:
                    
                if database_type == "mysql":
                    database_url = self.mysql_database_url
                    database_service = MySQLServices(**database_url)
                    database_service.connect().cursor(dictionary=True)
                    logging.info("Using MySQL database service.")
                elif database_type == "oracle":
                    database_url = self.oracle_database_url
                    database_service = OracleServices(**database_url)
                    database_service.connect().cursor(dictionary=True)
                    logging.info("Using Oracle database service.")
                elif database_type == "postgres":
                    database_url = self.postgres_database_url
                    database_service = PostgreSQLServices(**database_url)
                    database_service.connect().cursor(cursor_factory=RealDictCursor)
                    logging.info("Using Postgres database service.")
                else:
                    logging.error(f"Unsupported database type: {database_type}")
                    return{
                        "StatusCode":int(config['codes']['incorrect parameters']),
                        "Error":f"Unsupported database type: {database_type}",
                    }
            except Exception as e:
                logging.error(f"Error connecting to database: {e}")
                return {
                        "StatusCode":int(config['codes']['database error']),
                        "Error":f"Database connection error: {e}",
                    }
            logging.info(f"Connected to {database_type} database")
 
   
            logging.info("Fetching report details for report_id: %s", report_id)
            try:
                    
                columns = ["*"]
                result = database_service.read_records(
                    table="report_template",
                    columns=columns,
                    where_conditions={"report_id": report_id}
                )
            except Exception as e:
                logging.error(f"Error fetching report details: {e}")
                return {
                        "StatusCode":int(config['codes']['database error']),
                        "Error":f"Report details error: {e}",
                    }
 
            if not result:
                logging.warning("No report found with report_id: %s", report_id)
                return {
                    "StatusCode": 404,
                    "Error": "Report not found"
                }
                #raise HTTPException(status_code=404, detail="Report not found")
 
            db_details_id = result[0]["db_details_id"]
            logging.info(
                "Fetching database details for db_details_id: %s", db_details_id
            )
            try:
                    
                columns = ["rdbms_name", "db_schema_name"]
                res = database_service.read_records(
                    table="database_details",
                    columns=columns,
                    where_conditions={"db_details_id": db_details_id}
                )
            except Exception as e:
                logging.error(f"Error fetching database details: {e}")
                return {
                        "StatusCode":int(config['codes']['database error']),
                        "Error":f"Database details error: {e}",
                    }
            
            if not res:
                logging.warning(
                    "No database details found for db_details_id: %s",
                    db_details_id,
                )
                return{
                    "StatusCode":int(config['codes']['no records']),
                    "Error":f"Database details not found: {db_details_id}",
                }
 
            rdbms_name = res[0]["rdbms_name"]
            schema_name = res[0]["db_schema_name"]
            logging.info("Successfully fetched report details and database details")
            result[0]["rdbms_name"] = rdbms_name
            result[0]["schema_name"] = schema_name
            if not result[0]['chart_customizations_options'] or (result[0]['chart_customizations_options']==json.dumps({})):
                result[0]['chart_customizations_options'] = json.dumps({"chart_colours":json.dumps({}),"chart_subtitle":""})
            chart_customizations_options = json.loads(result[0]['chart_customizations_options'])
 
            if ((chart_customizations_options['chart_colours'] == json.dumps({})) or (chart_customizations_options['chart_colours'] == {})) and user_details.get("chart_colours"):
                try:
                    chart_customizations_options['chart_colours'] = user_details.get("chart_colours")
                except Exception as e:
                    logging.error("Unexpected error: %s", e)
                    return{
                        "StatusCode":int(config['codes']['internal error']),
                        "Error":f"Chart colours error: {e}",
                    }
            else:
                if type(chart_customizations_options['chart_colours']) == str:
                    chart_customizations_options['chart_colours'] = json.loads(chart_customizations_options['chart_colours'])
            result[0]['chart_colours'] = chart_customizations_options['chart_colours']
            result[0]['chart_subtitle'] = chart_customizations_options['chart_subtitle']
            result[0].pop("chart_customizations_options")
            
            if database_type == "mysql":
                result[0]['upload_logo'] = str(result[0]["upload_logo"])
            else:
                logo_path = result[0]["upload_logo"]
                if isinstance(logo_path, memoryview):
                    result[0]['upload_logo'] = logo_path.tobytes()

            return{
                "StatusCode":int(config['codes']['success']),
                "data":result[0]
            }
 
        except Exception as unexpected_exception:
            logging.error("Unexpected error: %s", unexpected_exception)
            return{
                "StatusCode":int(config['codes']['internal error']),
                "Error":f"Internal server error: {unexpected_exception}",
            }
        finally:
            database_service.close_connection()

    # async def getGroupwiseReports(self, user_details: dict):
    #     """
    #     This function retrieves all reports associated with a particular group based on \
    #         the group_id.
    #     It queries the MySQL database and returns the list of reports accessible by that group.
    #     """
    #     cursor_logger = LOGGINGS.CustomLogger()
    #     logging = cursor_logger.setup_logger()
    #     # Log the received request
    #     logging.info("Received request with details: %s", user_details)
    #     group_id = user_details.get("group_id")
    #     logging.info("Received request with group_id: %s", group_id)

    #     database_type = user_details.get("database_type")

    #     if database_type == "mysql":
    #         # Prepare MySQL database connection details
    #         mysql_database_url = {
    #             "host": config["mysql"]["mysql_host"],
    #             "port": config["mysql"]["mysql_port"],
    #             "username": config["mysql"]["mysql_username"],
    #             "password": config["mysql"]["mysql_password"],
    #             "schema": config["mysql"]["mysql_new_schema"],
    #         }

    #         # Establish a connection to MySQL database
    #         database_mysql = db_services.get_mysql_connection(mysql_database_url)
    #         logging.info("Connected to MySQL database")

    #         try:
    #             # Query to fetch reports for the group
    #             with database_mysql.cursor(dictionary=True) as cursor:
    #                 logging.info(
    #                     "Executing query to get groupwise reports for group_id: %s",
    #                     group_id,
    #                 )
    #                 cursor.execute(
    #                     f"SELECT * FROM {config['database_tables']['view_report_access_group']}\
    #                           WHERE group_id = %s",
    #                     (group_id,),
    #                 )
    #                 result = cursor.fetchall()

    #                 # Log the number of fetched records
    #                 logging.info(
    #                     "Query executed successfully, fetched %d records", len(result)
    #                 )

    #                 # Return the groupwise reports
    #                 return JSONResponse(status_code=status.HTTP_200_OK, content=result)

    #         except Exception as e:
    #             # Log any query execution error
    #             logging.error("Error executing database query: %s", e)

    #         finally:
    #             # Close MySQL connection
    #             database_mysql.close()
    #             logging.info("Closed MySQL database connection")

    #     else:
    #         # If the database type is unsupported, raise an HTTP 400 error
    #         logging.warning("Unsupported database type: %s", database_type)
    #         raise HTTPException(status_code=400, detail="Unsupported database type")

    async def getGroupwiseReports(self, user_details: dict):
        """
        This function retrieves all reports associated with a particular group based on \
            the group_id.
        It queries the MySQL database and returns the list of reports accessible by that group.
        """
        cursor_logger = LOGGINGS.CustomLogger()
        logging = cursor_logger.setup_logger()
        # Log the received request
        logging.info("Received request with details: %s", user_details)
        group_id = user_details.get("group_id")
        logging.info("Received request with group_id: %s", group_id)
        database_type = user_details.get("database_type")
        try:
                
            if database_type == "mysql":
                database_url = self.mysql_database_url
                database_service = MySQLServices(**database_url)
                database_service.connect().cursor(dictionary=True)
                logging.info("Using MySQL database service.")
            elif database_type == "oracle":
                database_url = self.oracle_database_url
                database_service = OracleServices(**database_url)
                database_service.connect().cursor(dictionary=True)
                logging.info("Using Oracle database service.")
            elif database_type == "postgres":
                database_url = self.postgres_database_url
                database_service = PostgreSQLServices(**database_url)
                database_service.connect().cursor(cursor_factory=RealDictCursor)
                logging.info("Using Postgres database service.")
            else:
                logging.error(f"Unsupported database type: {database_type}")
                return{
                    "StatusCode":int(config['codes']['incorrect parameters']),
                    "Error":f"Unsupported database type: {database_type}",
                }
        except Exception as e:
            logging.error(f"Error connecting to database: {e}")
            return{
                "StatusCode":int(config['codes']['database error']),
                "Error":f"Database connection error: {e}",
            }


        logging.info(f"Connected to {database_type} database")

        try:
        # Query to fetch reports for the group
            logging.info(
                "Executing query to get groupwise reports for group_id: %s",
                group_id,
            )

            columns = ["*"]
            result = database_service.read_records(
                table=config['database_tables']['view_report_access_group'],
                columns=columns,
                where_conditions={"group_id": group_id}
            )

            # Log the number of fetched records
            logging.info(
                "Query executed successfully, fetched %d records", len(result)
            )

            # Return the groupwise reports
            return{
                "StatusCode":int(config['codes']['success']),
                "content":result,
            }

        except Exception as e:
            # Log any query execution error
            logging.error("Error executing database query: %s", e)
            return {
                "StatusCode":int(config['codes']['database error']),
                "Error":f"Database query error: {e}",
            }

        finally:
            # Close MySQL connection
            database_service.close_connection()
            logging.info(f"Closed {user_details['database_type']} database connection")

    async def get_report_data(self, report_details: dict):
        """Get report data based on the report details provided."""
        cursor_logger = LOGGINGS.CustomLogger()
        logging = cursor_logger.setup_logger()
        logging.info("Received request with details: %s", report_details)
        try:
            report_title = report_details.get("report_title")
            email = report_details.get("email")
            database_type = report_details.get("database_type")

            logging.info(
                "Received request with report_title: %s, email: %s, database_type: %s",
                report_title,
                email,
                database_type,
            )
            try:
                    
                if database_type == "mysql":
                    database_url = self.mysql_database_url
                    database_service = MySQLServices(**database_url)
                    database_service.connect().cursor(dictionary=True)
                    logging.info("Using MySQL database service.")
                elif database_type == "oracle":
                    database_url = self.oracle_database_url
                    database_service = OracleServices(**database_url)
                    database_service.connect().cursor(dictionary=True)
                    logging.info("Using Oracle database service.")
                elif database_type == "postgres":
                    database_url = self.postgres_database_url
                    database_service = PostgreSQLServices(**database_url)
                    database_service.connect().cursor(cursor_factory=RealDictCursor)
                    logging.info("Using Postgres database service.")
                else:
                    logging.error(f"Unsupported database type: {database_type}")
                    return{
                        "StatusCode":int(config['codes']['incorrect parameters']),
                        "Error":f"Unsupported database type: {database_type}",
                    }
            except Exception as e:
                logging.error(f"Error connecting to database: {e}")
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Database connection error: {e}",
                }
            
            logging.info(f"Connected to {database_type} database")
            try:
                    
                columns = ["customer_id"]
                result = database_service.read_records(
                    table="user_account",
                    columns=columns,
                    where_conditions={"user_email_id": email}
                )
                customer_id = result[0]["customer_id"]
            except Exception as e:
                logging.error(f"Error fetching customer_id: {e}")
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Customer ID error: {e}",
                }


            try:
                    
                columns = ["*"]
                result = database_service.read_records(
                    table="report_template",
                    columns=columns,
                    where_conditions={"report_template_name": report_title, "customer_id": customer_id})
            except Exception as e:
                logging.error(f"Error fetching report template: {e}")
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Report template error: {e}",
                }
            logging.info("Fetched report template: %s", result)
            report_type = result[0]["report_type"]
            query = result[0]["defined_query"]
            chart_type = result[0]["chart_type"]
            enable_drilldowm = result[0]["enable_drilldown"]
            enable_labels = result[0]["enable_labels"]
            auto_update_interval = result[0]["auto_update_interval"]
            db_details_id = result[0]["db_details_id"]
            if database_type == "mysql":
                logo_path = str(result[0]["upload_logo"])
            else:
                logo_path = result[0]["upload_logo"]
                if isinstance(logo_path, memoryview):
                    logo_path = logo_path.tobytes()
                    
            background_color = result[0]["background_colour"]
            chart_react_color = result[0]["chart_react_colour"]
            font_size_title = result[0]["font_size_title"]
            font_size_value = result[0]["font_size_value"]
            enable_labels = result[0]["enable_labels"]

            if not enable_labels: enable_labels = "no"
            if report_type.lower() == "box":
                box_customization_options = result[0]["box_customization_options"]
            if report_type.lower() == "chart":
                chart_customizations_options = json.loads(result[0]["chart_customizations_options"]) if (result[0]["chart_customizations_options"] and result[0]["chart_customizations_options"]!=json.dumps({})) else {"chart_colours":json.dumps({}),"chart_subtitle":""}
            if not chart_type: chart_type = ""
            if not enable_drilldowm: enable_drilldowm = "no"
            if not enable_labels: enable_labels = "no"

            try:
                    
                columns = ["*"]
                result = database_service.read_records(
                    table="database_details",
                    columns=columns,
                    where_conditions={"db_details_id": db_details_id}
                )
            except Exception as e:
                logging.error(f"Error fetching database details: {e}")
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Database details error: {e}",
                }
            logging.info("Fetched database details: %s", result)
            db_type = result[0]["rdbms_name"]
            if result[0]["rdbms_name"] == "mysql":
                logging.info("Connected to secondary MySQL database")
                try:
                        
                    secondary_data = await self.database_chunk_processor.process_chunks(
                        db_type=result[0]["rdbms_name"],
                        query=query,
                        hostname=result[0]["domain_name"],
                        port=result[0]["db_port"],
                        db_name=result[0]["db_schema_name"],
                        db_user=result[0]["db_user_name"],
                        password=result[0]["db_password"],
                        page_size=report_details["page_size"],
                        page_no=report_details["page_no"])
                except Exception as e:
                    logging.error(f"Error processing chunks: {e}")
                    return{
                        "StatusCode":int(config['codes']['internal error']),
                        "Error":f"Chunk processing error: {e}",
                    }
                if secondary_data == None:
                    logging.info("No Data Found")

                    return {"StatusCode":int(config['codes']['no records']),"message": "No Data Found","data":{}}
                result = secondary_data["data"]
                total_records = secondary_data["total_records"]

                if (result==None) or (len(result) == 0):
                    logging.info("No Data Found")
                    return {"StatusCode":int(config['codes']['no records']),"message": "No Data Found","data":{}}
                if len(result[0]) == 3:
                    if report_type.lower() == "chart":
                        if chart_type.lower() in ["3darea"]:
                            columns = list(result[0].keys())
                            temp = {}
                            for col in columns:
                                temp[col] = []
                                for i in result:
                                    if i[col] in temp[col]:
                                        continue
                                    else:
                                        temp[col].append(i[col])

                            series = []
                            for item in temp[columns[1]]:
                                ele = {"data": [], "name": item}
                                for element in result:
                                    if element[columns[1]] == item:
                                        ele["data"].append(
                                            [
                                                element[columns[0]],
                                                element[columns[2]],
                                            ]
                                        )
                                series.append(ele)

                            with open(self.CHART_PATH, "r") as f:
                                data = f.read()
                                json_data = json.loads(data)
                                json_data["series"] = series
                                json_data["title"] = report_title
                                json_data["chart_type"] = chart_type.lower()
                                json_data["report_type"] = report_type.lower()
                                json_data["xAxis"][0]["categories"] = temp[
                                    columns[0]
                                ]
                                json_data["enable_labels"] = enable_labels
                                json_data["drilldown"] = (
                                    enable_drilldowm.lower()
                                )

                                json_data["labels"] = (
                                    enable_labels.lower()
                                )
                                json_data["auto_update_interval"] = (
                                    auto_update_interval
                                )
                                if type(chart_customizations_options["chart_colours"])=="str":
                                    json_data["chart_colours"] = json.loads(chart_customizations_options["chart_colours"])
                                else:
                                    json_data["chart_colours"] = chart_customizations_options["chart_colours"]
                                json_data["chart_subtitle"] = chart_customizations_options["chart_subtitle"]

                            logging.info("Returning chart data")
                            json_data["len_col"] = int(len(columns))
                            return {
                                "StatusCode":int(config['codes']['success']),
                                "data": json_data
                            }
                            # return json_data
                        else:
                            columns = list(result[0].keys())
                            temp = {}
                            for col in columns:
                                temp[col] = []
                                for i in result:
                                    if i[col] in temp[col]:
                                        continue
                                    else:
                                        temp[col].append(i[col])
                                    # names = list(result[''].keys())
                            series = []
                            for item in temp[columns[1]]:
                                ele = {"data": [], "name": item}
                                for element in result:
                                    if element[columns[1]] == item:
                                        ele["data"].append(element[columns[2]])
                                series.append(ele)

                            with open(self.CHART_PATH, "r") as f:
                                data = f.read()
                                json_data = json.loads(data)
                                json_data["series"] = series
                                json_data["title"] = report_title
                                json_data["chart_type"] = chart_type.lower()
                                json_data["report_type"] = report_type.lower()
                                json_data["xAxis"][0]["categories"] = temp[
                                    columns[0]
                                ]
                                json_data["enable_labels"] = enable_labels
                                json_data["drilldown"] = (
                                    enable_drilldowm.lower()
                                )
                                json_data["labels"] = (
                                    enable_labels.lower()
                                )                                        
                                json_data["auto_update_interval"] = (
                                    auto_update_interval
                                )
                                if type(chart_customizations_options["chart_colours"])=="str":
                                    json_data["chart_colours"] = json.loads(chart_customizations_options["chart_colours"])
                                else:
                                    json_data["chart_colours"] = chart_customizations_options["chart_colours"]
                                json_data["chart_subtitle"] = chart_customizations_options["chart_subtitle"]


                            logging.info("Returning chart data")
                            json_data["len_col"] = int(len(columns))
                            return {
                                "StatusCode":int(config['codes']['success']),
                                "data": json_data
                            }
                            # return json_data

            elif result[0]["rdbms_name"] in ['postgres','vertica']:
                if result[0]['rdbms_name'] == 'postgres':
                    try:
                            
                        secondary_data = await self.database_chunk_processor.process_chunks(
                            db_type=result[0]["rdbms_name"],
                            query=query,
                            hostname=result[0]["domain_name"],
                            port=result[0]["db_port"],
                            db_name=result[0]["db_schema_name"],
                            db_user=result[0]["db_user_name"],
                            password=result[0]["db_password"],
                            page_size=report_details["page_size"],
                            page_no=report_details["page_no"])
                    except Exception as e:
                        logging.error(f"Error processing chunks: {e}")
                        return{
                            "StatusCode":int(config['codes']['internal error']),
                            "Error":f"Chunk processing error: {e}",
                        }
                    if secondary_data == None:
                        logging.info("No Data Found")
                        return {
                            "StatusCode":int(config['codes']['no records']),
                            "message": "No Data Found",

                        }
                        # return {"status":204,"message": "No Data Found","data":{}}
                    result = secondary_data["data"]
                    if (result==None) or (len(result) == 0):
                        logging.info("No Data Found")
                        return{
                            "StatusCode":int(config['codes']['no records']),
                            "message": "No Data Found",
                        }
                    total_records = secondary_data["total_records"]
                    logging.info(
                            "Fetched report data from secondary Postgres database"
                        )
                elif result[0]['rdbms_name'] == 'vertica':
                    try:
                            
                        secondary_data = await self.database_chunk_processor.process_chunks(
                            db_type=result[0]["rdbms_name"],
                            query=query,
                            hostname=result[0]["domain_name"],
                            port=result[0]["db_port"],
                            db_name=result[0]["db_schema_name"],
                            db_user=result[0]["db_user_name"],
                            password=result[0]["db_password"],
                            page_size=report_details["page_size"],
                            page_no=report_details["page_no"])
                    except Exception as e:
                        logging.error(f"Error processing chunks: {e}")
                        return{
                            "StatusCode":int(config['codes']['internal error']),
                            "Error":f"Chunk processing error: {e}",
                        }
                    if secondary_data == None:
                        logging.info("No Data Found")
                        return {
                            "StatusCode":int(config['codes']['no records']),
                            "message": "No Data Found",
                        }
                        
                    result = secondary_data["data"]
                    total_records = secondary_data["total_records"]
                    logging.info("Fetched report data from secondary Vertica database")

                    if (result==None) or (len(result) == 0):
                        logging.info("No Data Found")
                        return{
                            "StatusCode":int(config['codes']['no records']),
                            "message": "No Data Found",
                        }
                        # return {"status":204,"message": "No Data Found","data":{}}

                if len(result[0]) == 3:
                    if report_type.lower() == "chart":
                        if chart_type.lower() in [
                            "3darea"
                        ]:  # in ['line','bar','column','gause','area','radial']:
                            columns = list(result[0].keys())
                            temp = {}
                            for col in columns:
                                temp[col] = []
                                for i in result:
                                    if i[col] in temp[col]:
                                        continue
                                    else:
                                        temp[col].append(i[col])
                                    # names = list(result[''].keys())
                            series = []
                            for item in temp[columns[1]]:
                                ele = {"data": [], "name": item}
                                for element in result:
                                    if element[columns[1]] == item:
                                        ele["data"].append(
                                            [
                                                element[columns[0]],
                                                element[columns[2]],
                                            ]
                                        )
                                series.append(ele)

                            with open(self.CHART_PATH, "r") as f:
                                data = f.read()
                                json_data = json.loads(data)
                                json_data["series"] = series
                                json_data["title"] = report_title
                                json_data["chart_type"] = chart_type.lower()
                                json_data["report_type"] = report_type.lower()
                                json_data["xAxis"][0]["categories"] = temp[
                                    columns[0]
                                ]
                                json_data["enable_labels"] = enable_labels
                                json_data["drilldown"] = (
                                    enable_drilldowm.lower()
                                )
                                json_data["auto_update_interval"] = (
                                    auto_update_interval
                                )
                                json_data["labels"] = (
                                    enable_labels.lower()
                                )                                        
                                if type(chart_customizations_options["chart_colours"])=="str":
                                    json_data["chart_colours"] = json.loads(chart_customizations_options["chart_colours"])
                                else:
                                    json_data["chart_colours"] = chart_customizations_options["chart_colours"]
                                json_data["chart_subtitle"] = chart_customizations_options["chart_subtitle"]

                            logging.info("Returning chart data")
                            json_data["len_col"] = int(len(columns))
                            return{
                                "StatusCode":int(config['codes']['success']),
                                "data": json_data
                            }
                        else:
                            columns = list(result[0].keys())
                            temp = {}
                            for col in columns:
                                temp[col] = []
                                for i in result:
                                    if i[col] in temp[col]:
                                        continue
                                    else:
                                        temp[col].append(i[col])

                            series = []
                            for item in temp[columns[1]]:
                                ele = {"data": [], "name": item}
                                for element in result:
                                    if element[columns[1]] == item:
                                        ele["data"].append(element[columns[2]])
                                series.append(ele)

                            with open(self.CHART_PATH, "r") as f:
                                data = f.read()
                                json_data = json.loads(data)
                                json_data["series"] = series
                                json_data["title"] = report_title
                                json_data["chart_type"] = chart_type.lower()
                                json_data["report_type"] = report_type.lower()
                                json_data["xAxis"][0]["categories"] = temp[
                                    columns[0]
                                ]
                                json_data["enable_labels"] = enable_labels
                                json_data["drilldown"] = (
                                    enable_drilldowm.lower()
                                )
                                json_data["labels"] = (
                                    enable_labels.lower()
                                )                                        
                                json_data["auto_update_interval"] = (
                                    auto_update_interval
                                )
                                if type(chart_customizations_options["chart_colours"])=="str":
                                    json_data["chart_colours"] = json.loads(chart_customizations_options["chart_colours"])
                                else:
                                    json_data["chart_colours"] =chart_customizations_options["chart_colours"]
                                json_data["chart_subtitle"] = chart_customizations_options["chart_subtitle"]


                            logging.info("Returning chart data")
                            json_data["len_col"] = int(len(columns))
                            return {
                                "StatusCode":int(config['codes']['success']),
                                "data": json_data
                            }
                            # return json_data

            if report_type.lower() == "chart":
                if (
                    chart_type.lower()
                ):  # in ['line','bar','column','gause','area','radial']:
                    names = list(result[0].keys())
                    columns = list(result[0].keys())
                    transposed_data = list(zip(*[item.values() for item in result]))
                    series = [
                        {"data": metric_data, "name": name}
                        for name, metric_data in zip(names, transposed_data)
                    ]
                    with open(self.CHART_PATH, "r") as f:
                        data = f.read()
                        json_data = json.loads(data)
                        json_data["series"] = series
                        json_data["title"] = report_title
                        json_data["chart_type"] = chart_type.lower()
                        json_data["report_type"] = report_type.lower()
                        json_data["xAxis"][0]["categories"] = series[0]["data"]
                        json_data["drilldown"] = enable_drilldowm.lower()
                        json_data["labels"] = enable_labels.lower()                          
                        json_data["auto_update_interval"] = auto_update_interval
                        json_data["enable_labels"] = enable_labels
                        # here changed
                        if type(chart_customizations_options["chart_colours"])=="str":
                            json_data["chart_colours"] = json.loads(chart_customizations_options["chart_colours"])
                        else:
                            json_data["chart_colours"] = chart_customizations_options["chart_colours"]
                        json_data["chart_subtitle"] = chart_customizations_options["chart_subtitle"]

                    logging.info("Returning chart data")
                    json_data["len_col"] = int(len(columns))
                    return {
                        "StatusCode":int(config['codes']['success']),
                        "data": json_data
                    }
                    # return json_data
            elif report_type.lower() == "box":
                report_key = next(iter(result[0]))
                report_value = result[0][report_key]
                box_value = {
                    "box_value": report_value,
                    "backgroung_color": background_color,
                    "chart_react_color": chart_react_color,
                    "font_size_title": font_size_title,
                    "font_size_value": font_size_value,
                    "report_type": report_type.lower(),
                    "report_title": report_title,
                    "logo_path": logo_path,
                    "drilldown": enable_drilldowm.lower(),
                    "labels": enable_labels.lower(),
                    "auto_update_interval": auto_update_interval,
                    "box_customization_options":box_customization_options
                }
                logging.info("Returning box data")
                return{
                    "StatusCode":int(config['codes']['success']),
                    "data": box_value
                }
                # return box_value

            elif report_type.lower() == "table":
                final_result = {}
                if db_type == "mysql":
                    column_names = list(result[0].keys())
                    final_result["column_names"] = column_names
                    final_result["data"] = result
                    final_result["report_type"] = report_type.lower()
                    final_result["title"] = report_title
                    final_result["auto_update_interval"] = auto_update_interval
                    logging.info("Returning box data")
                    final_result["total_records"] = total_records
                    return{
                        "StatusCode":int(config['codes']['success']),
                        "data": final_result
                    }
                    # return final_result
                elif db_type in ['postgres','vertica']:
                    column_names = list(result[0].keys())
                    final_result["column_names"] = column_names
                    final_result["data"] = result
                    final_result["report_type"] = report_type.lower()
                    final_result["title"] = report_title
                    final_result["auto_update_interval"] = auto_update_interval
                    logging.info("Returning box data")
                    final_result["total_records"] = total_records
                    return{
                        "StatusCode":int(config['codes']['success']),
                        "data": final_result
                    }
                    # return final_result

        except Exception as unexpected_exception:
            logging.error("Unexpected error: %s", unexpected_exception)
            return{
                "StatusCode":int(config['codes']['internal error']),
                "Error":f"Internal server error: {unexpected_exception}",
            }
        finally:
            database_service.close_connection()
            logging.info(f"Closed {database_type} database connection")

    async def getPreview(self, report_details: dict):
        """
        Generates a preview of a report based on the provided report details.
        
        This function connects to the appropriate database based on the provided details, 
        retrieves the necessary data, and processes it to generate a chart preview if required.
        """
        cursor_logger = LOGGINGS.CustomLogger()
        logging = cursor_logger.setup_logger()

        logging.info("Received request with details: %s", report_details)
        try:
            report_name = report_details.get("report_name")
            report_type = report_details.get("report_type")
            chart_type = report_details.get("chart_type")
            defined_query = report_details.get("query")
            email = report_details.get("email")
            connection_type = report_details.get("connection_type")
            schema_name = report_details.get("schema")
            try:
                    
                if report_details['database_type']=="mysql":
                    database_url = self.mysql_database_url
                    database_service = MySQLServices(**database_url)
                    database_service.connect().cursor(dictionary=True)
                elif report_details['database_type']=='oracle':
                    database_url = self.oracle_database_url
                    database_service = OracleServices(**database_url)
                    database_service.connect()
                elif report_details['database_type']=='postgres':
                    database_url = self.postgres_database_url
                    database_service = PostgreSQLServices(**database_url)
                    database_service.connect().cursor(cursor_factory=RealDictCursor)
            except Exception as e:
                logging.error(f"Error connecting to database: {e}")
                return{
                    "StatusCode":int(config['codes']['incorrect parameters']),
                    "Error":f"Database connection error: {e}",
                }
            
            logging.info(f"Connected to {report_details['database_type']} database")
            try:

                columns = ["customer_id"]
                result = database_service.read_records(
                    table=config['database_tables']['user_account'],
                    columns=columns,
                    where_conditions={"user_email_id": email}
                )
                customer_id = result[0]["customer_id"]

                columns = ["domain_name", "db_port", "db_user_name", "db_password"]
                result = database_service.read_records(
                    table=config['database_tables']['database_details'],
                    columns=columns,
                    where_conditions={"customer_id": customer_id, "db_schema_name": schema_name, "rdbms_name": connection_type}
                )
            except Exception as e:
                logging.error(f"Error fetching customer_id: {e}")
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Customer ID error: {e}",
                }
            
            if connection_type == "mysql":
                try:
                        
                    secondary_data = await self.database_chunk_processor.process_chunks(
                        db_type=connection_type,
                        query=defined_query,
                        hostname=result[0]["domain_name"],
                        port=result[0]["db_port"],
                        db_name=schema_name,
                        db_user=result[0]["db_user_name"],
                        password=result[0]["db_password"],
                        page_size=report_details["page_size"],
                        page_no=report_details["page_no"])
                except Exception as e:
                    logging.error(f"Error processing chunks: {e}")
                    return{
                        "StatusCode":int(config['codes']['internal error']),
                        "Error":f"Chunk processing error: {e}",
                    }
                if secondary_data == None:
                    logging.info("No Data Found")
                    return{
                        "StatusCode":int(config['codes']['no records']),
                        "message": "No Data Found",
                    }
                    # return {"status":204,"message": "No Data Found","data":{}}
                
                result = secondary_data["data"]
                total_records = secondary_data["total_records"]
                    
                logging.info(
                    "Fetched data from secondary MySQL database: %s", result
                )
                if (result==None) or (len(result) == 0):
                    logging.info("No Data Found")
                    return{
                        "StatusCode":int(config['codes']['no records']),
                        "message": "No Data Found",
                    }
                    # return {"status":204,"message": "No Data Found","data":{}}

                # no need to make changes
                if len(result[0]) == 3:
                    if report_type.lower() == "chart":
                        if chart_type.lower() in ["3darea"]:
                            columns = list(result[0].keys())
                            temp = {}
                            for col in columns:
                                temp[col] = []
                                for i in result:
                                    if i[col] in temp[col]:
                                        continue
                                    else:
                                        temp[col].append(i[col])
                                    # names = list(result[''].keys())
                            series = []
                            for item in temp[columns[1]]:
                                ele = {"data": [], "name": item}
                                for element in result:
                                    if element[columns[1]] == item:
                                        ele["data"].append(
                                            [
                                                element[columns[0]],
                                                element[columns[2]],
                                            ]
                                        )
                                series.append(ele)

                            with open(self.CHART_PATH, "r") as f:
                                data = f.read()
                                json_data = json.loads(data)
                                json_data["series"] = series
                                json_data["title"] = report_name
                                json_data["chart_type"] = chart_type.lower()
                                json_data["report_type"] = report_type.lower()
                                json_data["xAxis"][0]["categories"] = temp[
                                    columns[0]
                                ]

                            logging.info("Returning chart data")
                            json_data["len_col"] = int(len(columns))
                            return{
                                "StatusCode":int(config['codes']['success']),
                                "data": json_data
                            }
                            # return json_data
                        else:
                            columns = list(result[0].keys())
                            temp = {}
                            for col in columns:
                                temp[col] = []
                                for i in result:
                                    if i[col] in temp[col]:
                                        continue
                                    else:
                                        temp[col].append(i[col])

                            series = []
                            for item in temp[columns[1]]:
                                ele = {"data": [], "name": item}
                                for element in result:
                                    if element[columns[1]] == item:
                                        ele["data"].append(element[columns[2]])
                                series.append(ele)

                            with open(self.CHART_PATH, "r") as f:
                                data = f.read()
                                json_data = json.loads(data)
                                json_data["series"] = series
                                json_data["title"] = report_name
                                json_data["chart_type"] = chart_type.lower()
                                json_data["report_type"] = report_type.lower()
                                json_data["xAxis"][0]["categories"] = temp[
                                    columns[0]
                                ]

                            logging.info("Returning chart data")
                            json_data["len_col"] = int(len(columns))
                            return{
                                "StatusCode":int(config['codes']['success']),
                                "data": json_data
                            }
                            # return json_data

            elif connection_type in ["postgres","vertica"]:
                if connection_type == 'postgres':
                    try:
                            
                        secondary_data = await self.database_chunk_processor.process_chunks(
                            db_type=connection_type,
                            query=defined_query,
                            hostname=result[0]["domain_name"],
                            port=result[0]["db_port"],
                            db_name=schema_name,
                            db_user=result[0]["db_user_name"],
                            password=result[0]["db_password"],
                            page_size=report_details["page_size"],
                            page_no=report_details["page_no"])
                    except Exception as e:
                        logging.error(f"Error processing chunks: {e}")

                        return{
                            "StatusCode":int(config['codes']['internal error']),
                            "Error":f"Chunk processing error: {e}",
                        }
                    
                    if secondary_data == None:
                        logging.info("No Data Found")
                        return {
                            "StatusCode":int(config['codes']['no records']),
                            "message": "No Data Found",
                        }
                        # return {"status":204,"message": "No Data Found","data":{}}
                    result = secondary_data["data"]
                    total_records = secondary_data["total_records"]
                    logging.info(
                        "Fetched data from secondary Postgres database: %s",
                        result,
                    )
                elif connection_type == 'vertica':
                    try:
                            
                        secondary_data = await self.database_chunk_processor.process_chunks(
                            db_type=connection_type,
                            query=defined_query,
                            hostname=result[0]["domain_name"],
                            port=result[0]["db_port"],
                            db_name=schema_name,
                            db_user=result[0]["db_user_name"],
                            password=result[0]["db_password"],
                            page_size=report_details["page_size"],
                            page_no=report_details["page_no"])
                    except Exception as e:
                        logging.error(f"Error processing chunks: {e}")
                        return{
                            "StatusCode":int(config['codes']['internal error']),
                            "Error":f"Chunk processing error: {e}",
                        }
                    if secondary_data == None:
                        logging.info("No Data Found")
                        return{
                            "StatusCode":int(config['codes']['no records']),
                            "message": "No Data Found",
                        }
                        # return {"status":204,"message": "No Data Found","data":{}}
                    result = secondary_data["result"]
                    total_records = secondary_data["total_records"]
                    logging.info("Fetched data from secondary Vertica database")

                if (result==None) or (len(result) == 0):
                    logging.info("No Data Found")
                    return{
                        "StatusCode":int(config['codes']['no records']),
                        "message": "No Data Found",
                    }
                    # return {"status":204,"message": "No Data Found","data":{}}
                if len(result[0]) == 3:
                    if report_type.lower() == "chart":
                        if chart_type.lower() in ["3darea"]:
                            columns = list(result[0].keys())
                            temp = {}
                            for col in columns:
                                temp[col] = []
                                for i in result:
                                    if i[col] in temp[col]:
                                        continue
                                    else:
                                        temp[col].append(i[col])
                                    # names = list(result[''].keys())
                            series = []
                            for item in temp[columns[1]]:
                                ele = {"data": [], "name": item}
                                for element in result:
                                    if element[columns[1]] == item:
                                        ele["data"].append(
                                            [
                                                element[columns[0]],
                                                element[columns[2]],
                                            ]
                                        )
                                series.append(ele)

                            with open(self.CHART_PATH, "r") as f:
                                data = f.read()
                                json_data = json.loads(data)
                                json_data["series"] = series
                                json_data["title"] = report_name
                                json_data["chart_type"] = chart_type.lower()
                                json_data["report_type"] = report_type.lower()
                                json_data["xAxis"][0]["categories"] = temp[
                                    columns[0]
                                ]

                            logging.info("Returning chart data")
                            json_data["len_col"] = int(len(columns))
                            return{
                                "StatusCode":int(config['codes']['success']),
                                "data": json_data
                            }
                            # return json_data
                        else:
                            columns = list(result[0].keys())
                            temp = {}
                            for col in columns:
                                temp[col] = []
                                for i in result:
                                    if i[col] in temp[col]:
                                        continue
                                    else:
                                        temp[col].append(i[col])

                            series = []
                            for item in temp[columns[1]]:
                                ele = {"data": [], "name": item}
                                for element in result:
                                    if element[columns[1]] == item:
                                        ele["data"].append(element[columns[2]])
                                series.append(ele)

                            with open(self.CHART_PATH, "r") as f:
                                data = f.read()
                                json_data = json.loads(data)
                                json_data["series"] = series
                                json_data["title"] = report_name
                                json_data["chart_type"] = chart_type.lower()
                                json_data["report_type"] = report_type.lower()
                                json_data["xAxis"][0]["categories"] = temp[
                                    columns[0]
                                ]

                            logging.info("Returning chart data")
                            json_data["len_col"] = int(len(columns))
                            return{
                                "StatusCode":int(config['codes']['success']),
                                "data": json_data
                            }
                            # return json_data

            if report_type.lower() == "chart":
                if chart_type.lower():
                    columns = list(result[0].keys())
                    names = list(result[0].keys())
                    transposed_data = list(zip(*[item.values() for item in result]))
                    series = [
                        {"data": list(metric_data), "name": name}
                        for name, metric_data in zip(names, transposed_data)
                    ]
                    with open(self.CHART_PATH, "r") as f:
                        data = f.read()
                        json_data = json.loads(data)
                        json_data["series"] = series
                        json_data["title"] = report_name
                        json_data["xAxis"][0]["categories"] = series[0]["data"]

                    logging.info("Returning chart data")
                    json_data["len_col"] = int(len(columns))
                    return{
                        "StatusCode":int(config['codes']['success']),
                        "data": json_data
                    }
                    # return json_data
            elif report_type.lower() == "box":
                report_key = next(iter(result[0]))
                if type(result[0]) == dict or type(result[0]) == psycopg2.extras.RealDictRow:
                    report_value = result[0][report_key]
                else:
                    report_value = result[0][0]
                logging.info("Returning chart data")
                return{
                    "StatusCode":int(config['codes']['success']),
                    "box_value": report_value
                }
            elif report_type.lower() == "table":
                final_result = {}
                if connection_type == "mysql":
                    column_names = list(result[0].keys())
                    final_result["column_names"] = column_names
                    final_result["data"] = result
                    final_result["report_type"] = report_type.lower()
                    final_result["total_records"] = total_records
                    logging.info("Returning chart data")
                    return{
                        "StatusCode":int(config['codes']['success']),
                        "data": final_result
                    }
                    # return final_result

                elif connection_type in ['postgres','vertica']:
                    column_names = list(result[0].keys())
                    final_result["column_names"] = column_names
                    final_result["data"] = result
                    final_result["report_type"] = report_type.lower()
                    final_result["total_records"] = total_records
                    logging.info("Returning chart data")
                    return{
                        "StatusCode":int(config['codes']['success']),
                        "data": final_result
                    }
                    # return final_result
        except Exception as unexpected_exception:
            logging.error("Unexpected error: %s", unexpected_exception)
            raise HTTPException(
                status_code=500,
                detail="Internal server error: {}".format(unexpected_exception),
            )
        finally:
            database_service.close_connection()
            logging.info(f"Closed {report_details['database_type']} database connection")
        
    # async def getAssignedReports(self, report_details: dict):
    #     """
    #     Retrieves the assigned reports for a customer from the MySQL database\
    #           based on the provided customer ID.

    #     Parameters:
    #     report_details (dict): Contains information like database type and customer ID.

    #     Returns:
    #     JSON response or data: A list of assigned reports and their details.
    #     """
    #     cursor_logger = LOGGINGS.CustomLogger()
    #     logging = cursor_logger.setup_logger()
    #     logging.info("Received request with details: %s", report_details)

    #     try:
    #         database_type = report_details.get("database_type")
    #         customer_id = report_details.get("customer_id")

    #         logging.info(
    #             "Received request for assigned reports with database_type: %s, customer_id: %s",
    #             database_type,
    #             customer_id,
    #         )

    #         if database_type == "mysql":
    #             mysql_database_url = {
    #                 "host": config["mysql"]["mysql_host"],
    #                 "port": config["mysql"]["mysql_port"],
    #                 "username": config["mysql"]["mysql_username"],
    #                 "password": config["mysql"]["mysql_password"],
    #                 "schema": config["mysql"]["mysql_new_schema"],
    #             }
    #             database_mysql = db_services.get_mysql_connection(mysql_database_url)
    #             logging.info("Connected to MySQL database")

    #             with database_mysql.cursor(dictionary=True) as cursor:
    #                 cursor.execute(
    #                     f"SELECT grm.group_id, grm.report_id, rt.report_template_name,\
    #                           grm.access_mask FROM\
    #                               {config['database_tables']['group_report_map']}\
    #                                   AS grm INNER JOIN \
    #                                     {config['database_tables']['report_template']}\
    #                                           AS rt ON grm.report_id = rt.report_id \
    #                                             WHERE grm.access_mask != 'null'\
    #                                                   AND rt.customer_id = %s",
    #                     (customer_id,),
    #                 )
    #                 result = cursor.fetchall()
    #                 logging.info("Fetched assigned reports")

    #             database_mysql.close()
    #             logging.info("Closed MySQL database connection")
    #             return JSONResponse(status_code=status.HTTP_200_OK, content=result)

    #         logging.error("Unsupported database type: %s", database_type)
    #         raise HTTPException(status_code=400, detail="Unsupported database type")

    #     except Exception as e:
    #         logging.error("Unexpected error: %s", e)
    #         raise HTTPException(status_code=500, detail=f"Internal server error: {e}")

    async def getAssignedReports(self, report_details: dict):
        """
        Retrieves the assigned reports for a customer from the MySQL database\
              based on the provided customer ID.

        Parameters:
        report_details (dict): Contains information like database type and customer ID.

        Returns:
        JSON response or data: A list of assigned reports and their details.
        """
        cursor_logger = LOGGINGS.CustomLogger()
        logging = cursor_logger.setup_logger()
        logging.info("Received request with details: %s", report_details)

        try:
            database_type = report_details.get("database_type")
            customer_id = report_details.get("customer_id")

            logging.info(
                "Received request for assigned reports with database_type: %s, customer_id: %s",
                database_type,
                customer_id,
            )
            try:
                    
                if database_type == "mysql":
                    database_url = self.mysql_database_url
                    database_service = MySQLServices(**database_url)
                    cursor = database_service.connect().cursor(dictionary=True)
                    logging.info("Using MySQL database service.")
                elif database_type == "oracle":
                    database_url = self.oracle_database_url
                    database_service = OracleServices(**database_url)
                    database_service.connect()
                    logging.info("Using Oracle database service.")
                elif database_type == "postgres":
                    database_url = self.postgres_database_url
                    database_service = PostgreSQLServices(**database_url)
                    cursor = database_service.connect().cursor(cursor_factory=RealDictCursor)
                    logging.info("Using Postgres database service.")
                else:
                    logging.error(f"Unsupported database type: {database_type}")
                    return{
                        "StatusCode":int(config['codes']['incorrect parameters']),  
                        "Error":f"Unsupported database type: {database_type}",
                    }
            except Exception as e:
                logging.error(f"Error connecting to database: {e}")
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Database connection error: {e}",
                }

            # mysql_database_url = {
            #     "host": config["mysql"]["mysql_host"],
            #     "port": config["mysql"]["mysql_port"],
            #     "username": config["mysql"]["mysql_username"],
            #     "password": config["mysql"]["mysql_password"],
            #     "schema": config["mysql"]["mysql_new_schema"],
            # }
            # database_mysql = db_services.get_mysql_connection(mysql_database_url)
            logging.info(f"Connected to {report_details['database_type']} database")

        # with database_mysql.cursor(dictionary=True) as cursor:
            try:
                    
                cursor.execute(
                    f"SELECT grm.group_id, grm.report_id, rt.report_template_name,\
                            grm.access_mask FROM\
                                {config['database_tables']['group_report_map']}\
                                    AS grm INNER JOIN \
                                    {config['database_tables']['report_template']}\
                                            AS rt ON grm.report_id = rt.report_id \
                                            WHERE grm.access_mask != 'null'\
                                                    AND rt.customer_id = %s",
                    (customer_id,),
                )
                result = cursor.fetchall()
            except Exception as e:
                logging.error(f"Error fetching assigned reports: {e}")
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Assigned reports error: {e}",
                }
            logging.info("Fetched assigned reports: %s", result)

            # database_mysql.close()
            logging.info(f"Closed {report_details['database_type']} database connection")
            return{
                "StatusCode":int(config['codes']['success']),
                "data": result
            }

        except Exception as e:
            logging.error("Unexpected error: %s", e)
            return{
                "StatusCode":int(config['codes']['internal error']),
                "Error":f"Internal server error: {e}"
            }
        finally:
            database_service.close_connection()
            logging.info(f"Closed {report_details['database_type']} database connection")
                
    # async def getUsers(self, user_details: dict):
    #     """
    #     Fetches user details from the database based on the provided email and database type.
    #     Retrieves user account information, associated groups, and other relevant details.
    #     """
    #     cursor_logger = LOGGINGS.CustomLogger()
    #     logging = cursor_logger.setup_logger()
    #     logging.info("Received request with details: %s", user_details)
 
    #     email = user_details.get("email")
    #     database_type = user_details.get("database_type")
    #     logging.info(
    #         "Received request for users with email: %s, database_type: %s",
    #         email,
    #         database_type,
    #     )
 
    #     try:
    #         if database_type == "mysql":
    #             mysql_database_url = {
    #                 "host": config["mysql"]["mysql_host"],
    #                 "port": config["mysql"]["mysql_port"],
    #                 "username": config["mysql"]["mysql_username"],
    #                 "password": config["mysql"]["mysql_password"],
    #                 "schema": config["mysql"]["mysql_new_schema"],
    #             }
    #             database_mysql = db_services.get_mysql_connection(mysql_database_url)
    #             logging.info("Connected to MySQL database")
 
    #             with database_mysql.cursor(dictionary=True) as cursor:
    #                 cursor.execute(
    #                     f"SELECT customer_id, group_id FROM \
    #                         {config['database_tables']['user_account']} \
    #                             WHERE user_email_id = %s",
    #                     (email,),
    #                 )
    #                 result = cursor.fetchall()
    #                 logging.info("Fetched user account details: %s", result)
 
    #                 if not result:
    #                     return []
 
    #                 group_id = result[0]["group_id"]
 
    #                 cursor.execute(
    #                     f"SELECT groupname FROM {config['database_tables']['user_group']} \
    #                         WHERE group_id = %s",
    #                     (group_id,),
    #                 )
    #                 group_result = cursor.fetchall()
    #                 logging.info("Fetched user group details: %s", group_result)
 
    #                 if not group_result:
    #                     return []
 
    #                 groupname = group_result[0]["groupname"]

    #                 cursor.execute(
    #                         f"SELECT user_email_id, group_id, user_status, user_creation_date FROM {config['database_tables']['user_account']} ORDER BY user_creation_date DESC"
    #                     )
 
    #                 result = cursor.fetchall()
    #                 logging.info("Fetched user details: %s", result)
                   
    #                 results = []
    #                 for item in result:
    #                     cursor.execute(
    #                         f"SELECT groupname FROM {config['database_tables']['user_group']}\
    #                               WHERE group_id = %s",
    #                         (item["group_id"],),
    #                     )
    #                     group_result = cursor.fetchall()
    #                     if group_result:
    #                         item["groupname"] = group_result[0]["groupname"]
 
    #                     cursor.execute(
    #                         f"SELECT user_email_id, group_id FROM {config['database_tables']['user_group_map']} WHERE user_email_id = %s",(item['user_email_id'],)
    #                     )
    #                     group_names = cursor.fetchall()
    #                     if group_names:
    #                         item["asscoiated_groups"] = [group['group_id'] for group in group_names]
    #                         results.append(item)
 
    #                 logging.info("Returned user details: %s", result)
    #                 # print(results)
    #                 return results
    #     except Exception as unexpected_exception:
    #         logging.error("Unexpected error: %s", unexpected_exception)
    #         raise HTTPException(
    #             status_code=500, detail=f"Internal server error: {unexpected_exception}"
    #         )

    async def getUsers(self, user_details: dict):

        cursor_logger = LOGGINGS.CustomLogger()
        logging = cursor_logger.setup_logger()
        logging.info("Received request with details: %s", user_details)
 
        email = user_details.get("email")
        database_type = user_details.get("database_type")
        logging.info(
            "Received request for users with email: %s, database_type: %s",
            email,
            database_type,
        )
        try:
                
            if database_type == "mysql":
                database_url = self.mysql_database_url
                database_service = MySQLServices(**database_url)
                cursor = database_service.connect().cursor(dictionary=True)
                logging.info("Using MySQL database service.")
            elif database_type == "oracle":
                database_url = self.oracle_database_url
                database_service = OracleServices(**database_url)
                database_service.connect()
                logging.info("Using Oracle database service.")
            elif database_type == "postgres":
                database_url = self.postgres_database_url
                database_service = PostgreSQLServices(**database_url)
                cursor = database_service.connect().cursor(cursor_factory=RealDictCursor)
                logging.info("Using Postgres database service.")
            else:
                logging.error(f"Unsupported database type: {database_type}")
                return{
                    "StatusCode":int(config['codes']['incorrect parameters']),
                    "Error":f"Unsupported database type: {database_type}",
                }
        except Exception as e:
            logging.error(f"Error connecting to database: {e}")
            return{
                "StatusCode":int(config['codes']['database error']),
                "Error":f"Database connection error: {e}",
            }

 
        try:

            columns = ["customer_id", "group_id"]
            try:
                    
                result = database_service.read_records(
                    table=config['database_tables']['user_account'],
                    columns=columns,
                    where_conditions={"user_email_id": email}
                )
            except Exception as e:
                logging.error(f"Error fetching user account details: {e}")
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"User account error: {e}",
                }
            logging.info("Fetched user account details: %s", result)

            if not result:
                return{
                    "StatusCode":int(config['codes']['no records']),
                    "Error":"No records found",
                }
                # return []

            group_id = result[0]["group_id"]

            # cursor.execute(
            #     f"SELECT groupname FROM {config['database_tables']['user_group']} \
            #         WHERE group_id = %s",
            #     (group_id,),
            # )
            # group_result = cursor.fetchall()
            try:
                    
                columns = ["groupname"]
                group_result = database_service.read_records(
                    table=config['database_tables']['user_group'],
                    columns=columns,
                    where_conditions={"group_id": group_id}
                )
            except Exception as e:
                logging.error(f"Error fetching user group details: {e}")
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"User group error: {e}",
                }
            logging.info("Fetched user group details: %s", group_result)

            if not group_result:
                return{
                    "StatusCode":int(config['codes']['no records']),
                    "Error":"No records found",
                }
                # return []

            try:
                    
                cursor.execute(
                        f"SELECT user_email_id, group_id, user_status, user_creation_date FROM {config['database_tables']['user_account']} ORDER BY user_creation_date DESC"
                    )

                result = [dict(record) for record in cursor.fetchall()]
            except Exception as e:
                logging.error(f"Error fetching user details: {e}")
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"User details error: {e}",
                }
            logging.info("Fetched user details: %s", result)
            
            results = []
            for item in result:
                # cursor.execute(
                #     f"SELECT groupname FROM {config['database_tables']['user_group']}\
                #           WHERE group_id = %s",
                #     (item["group_id"],),
                # )
                # group_result = cursor.fetchall()
                try:
                        
                    columns = ["groupname"]
                    group_result = database_service.read_records(
                        table=config['database_tables']['user_group'],
                        columns=columns,
                        where_conditions={"group_id": item["group_id"]}
                    )
                except Exception as e:
                    logging.error(f"Error fetching user group details: {e}")
                    return{
                        "StatusCode":int(config['codes']['database error']),
                        "Error":f"User group error: {e}",
                    }
                if group_result:
                    item["groupname"] = group_result[0]["groupname"]

                # cursor.execute(
                #     f"SELECT user_email_id, group_id FROM {config['database_tables']['user_group_map']} WHERE user_email_id = %s",(item['user_email_id'],)
                # )
                # group_names = cursor.fetchall()
                try:
                        
                    columns = ["user_email_id", "group_id"]
                    group_names = database_service.read_records(
                        table=config['database_tables']['user_group_map'],
                        columns=columns,
                        where_conditions={"user_email_id": item['user_email_id']}
                    )
                except Exception as e:
                    logging.error(f"Error fetching user group map details: {e}")
                    return{
                        "StatusCode":int(config['codes']['database error']),
                        "Error":f"User group map error: {e}",
                    }
                if group_names:
                    item["asscoiated_groups"] = [group['group_id'] for group in group_names]
                    results.append(item)

            logging.info("Returned user details: %s", result)
            return{
                "StatusCode":int(config['codes']['success']),
                "data": results
            }
            # return results
        except Exception as unexpected_exception:
            logging.error("Unexpected error: %s", unexpected_exception)

            return{
                "StatusCode":int(config['codes']['internal error']),
                "Error":f"Internal server error: {unexpected_exception}",
            }
        finally:
            database_service.close_connection()
            logging.info(f"Closed {user_details['database_type']} database connection")

    # async def delete(self, report_details):
    #     """
    #     Deletes a report and its associated data from the database based on the provided report details.
    #     """
    #     cursor_logger = LOGGINGS.CustomLogger()
    #     logging = cursor_logger.setup_logger()
    #     logging.info("Received request with details: %s", report_details)

    #     report_id = report_details.get("report_id")
    #     database_type = report_details.get("database_type")
    #     customer_id = report_details.get("customer_id")
    #     logging.info(
    #         "Received request to delete report with report_id: %s, database_type: %s,\
    #               customer_id: %s",
    #         report_id,
    #         database_type,
    #         customer_id,
    #     )

    #     try:
    #         if database_type == "mysql":
    #             mysql_database_url = {
    #                 "host": config["mysql"]["mysql_host"],
    #                 "port": config["mysql"]["mysql_port"],
    #                 "username": config["mysql"]["mysql_username"],
    #                 "password": config["mysql"]["mysql_password"],
    #                 "schema": config["mysql"]["mysql_new_schema"],
    #             }
    #             database_mysql = db_services.get_mysql_connection(mysql_database_url)
    #             logging.info("Connected to MySQL database")

    #             with database_mysql.cursor(dictionary=True) as cursor:
    #                 cursor.execute(
    #                     f"SELECT * FROM {config['database_tables']['report_template']} \
    #                         WHERE report_id = %s",
    #                     (report_id,),
    #                 )
    #                 result = cursor.fetchall()
    #                 logging.info("Fetched report details: %s", result)

    #                 if not result:
    #                     return JSONResponse(
    #                         status_code=status.HTTP_404_NOT_FOUND,
    #                         content="Report not found",
    #                     )

    #                 report_name = result[0]["report_template_name"]
    #                 report_type = result[0]["report_type"]

    #                 drilldown_name_query = f"SELECT detailed_report_id, master_report,\
    #                       drilldown_report FROM {config['database_tables']['detailed_report']} "

    #                 if report_type.strip().lower() == "table":
    #                     drilldown_query = (
    #                         drilldown_name_query
    #                         + "WHERE drilldown_report = %s AND customer_id = %s"
    #                     )
    #                     cursor.execute(drilldown_query, (report_name, customer_id))
    #                     drilldown_reports = cursor.fetchall()

    #                     for data in drilldown_reports:
    #                         cursor.execute(
    #                             f"DELETE FROM {config['database_tables']['detailed_report']} \
    #                                 WHERE detailed_report_id = %s",
    #                             (data["detailed_report_id"],),
    #                         )
    #                         cursor.execute(
    #                             f"UPDATE {config['database_tables']['report_template']}\
    #                                   SET enable_drilldown = 'no' WHERE report_template_name \
    #                                     = %s",
    #                             (data["master_report"],),
    #                         )
    #                         database_mysql.commit()

    #                 elif report_type.strip().lower() == "chart":
    #                     drilldown_query = (
    #                         drilldown_name_query
    #                         + "WHERE master_report = %s AND customer_id = %s"
    #                     )
    #                     cursor.execute(drilldown_query, (report_name, customer_id))
    #                     drilldown_reports = cursor.fetchall()

    #                     for data in drilldown_reports:
    #                         cursor.execute(
    #                             f"DELETE FROM {config['database_tables']['detailed_report']} \
    #                                 WHERE detailed_report_id = %s",
    #                             (data["detailed_report_id"],),
    #                         )

    #                 cursor.execute(
    #                     f"DELETE FROM {config['database_tables']['group_report_map']}\
    #                           WHERE report_id = %s",
    #                     (report_id,),
    #                 )
    #                 logging.info(
    #                     "Deleted from group_report_map for report_id: %s", report_id
    #                 )

    #                 cursor.execute(
    #                     f"DELETE FROM {config['database_tables']['report_template']} \
    #                         WHERE report_id = %s",
    #                     (report_id,),
    #                 )
    #                 logging.info(
    #                     "Deleted from report_template for report_id: %s", report_id
    #                 )

    #                 database_mysql.commit()

    #                 cursor.execute(
    #                     f"SELECT * FROM {config['database_tables']['dashboard_report_frame']} \
    #                         WHERE customer_id = %s",
    #                     (customer_id,),
    #                 )
    #                 dashboards = cursor.fetchall()
    #                 logging.info(
    #                     "Fetched dashboard report frames for customer_id: %s",
    #                     customer_id,
    #                 )

    #                 for dashboard in dashboards:
    #                     dashboard_json_frame_data_list = json.loads(
    #                         dashboard["dashboard_json_frame_data"]
    #                     )
    #                     dashboard_name = dashboard["dashboard_report_name"]
    #                     updated_data = [
    #                         chart
    #                         for chart in dashboard_json_frame_data_list
    #                         if chart["chartType"] != report_name
    #                     ]
    #                     cursor.execute(
    #                         f"UPDATE {config['database_tables']['dashboard_report_frame']}\
    #                               SET dashboard_json_frame_data = %s WHERE customer_id = %s\
    #                                   AND dashboard_report_name = %s",
    #                         (json.dumps(updated_data), customer_id, dashboard_name),
    #                     )
    #                     database_mysql.commit()
    #                     logging.info(
    #                         "Updated dashboard_report_frame for customer_id: %s,\
    #                               dashboard_report_name: %s",
    #                         customer_id,
    #                         dashboard_name,
    #                     )

    #             database_mysql.close()
    #             logging.info("Closed MySQL database connection")
    #             return JSONResponse(status_code=status.HTTP_200_OK, content="Deleted")
    #     except Exception as unexpected_exception:
    #         logging.error("Unexpected error: %s", unexpected_exception)
    #         raise HTTPException(
    #             status_code=500, detail=f"Internal server error: {unexpected_exception}"
    #         )
   
    async def delete(self, report_details):
        cursor_logger = LOGGINGS.CustomLogger()
        logging = cursor_logger.setup_logger()
        logging.info("Received request with details: %s", report_details)

        report_id = report_details.get("report_id")
        database_type = report_details.get("database_type")
        customer_id = report_details.get("customer_id")
        logging.info(
            "Received request to delete report with report_id: %s, database_type: %s,\
                  customer_id: %s",
            report_id,
            database_type,
            customer_id,
        )
        try:
                
            if database_type == "mysql":
                database_url = self.mysql_database_url
                database_service = MySQLServices(**database_url)
                connection = database_service.connect()
                cursor = connection.cursor(dictionary=True)
                logging.info("Using MySQL database service.")
            elif database_type == "oracle":
                database_url = self.oracle_database_url
                database_service = OracleServices(**database_url)
                database_service.connect()
                logging.info("Using Oracle database service.")
            elif database_type == "postgres":
                database_url = self.postgres_database_url
                database_service = PostgreSQLServices(**database_url)
                connection = database_service.connect()
                cursor = connection.cursor(cursor_factory=RealDictCursor)
                logging.info("Using Postgres database service.")
            else:
                logging.error(f"Unsupported database type: {database_type}")
                return{
                    "StatusCode":int(config['codes']['incorrect parameters']),
                    "Error":f"Unsupported database type: {database_type}",
                }
        except Exception as e:
            logging.error(f"Error connecting to database: {e}")
            return{
                "StatusCode":int(config['codes']['database error']),
                "Error":f"Database connection error: {e}",
            }
        try:

            logging.info(f"Connected to {report_details['database_type']} database")

        # with database_mysql.cursor(dictionary=True) as cursor:
            try:
                    
                cursor.execute(
                    f"SELECT * FROM {config['database_tables']['report_template']} \
                        WHERE report_id = %s",
                    (report_id,),
                )
                result = cursor.fetchall()
            except Exception as e:
                logging.error(f"Error fetching report details: {e}")
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Report details error: {e}",
                }
            logging.info("Fetched report details: %s", result)

            if not result:
                return{
                    "StatusCode":int(config['codes']['no records']),
                    "Error":"No records found",
                }

            report_name = result[0]["report_template_name"]
            report_type = result[0]["report_type"]

            drilldown_name_query = f"SELECT detailed_report_id, master_report,\
                    drilldown_report FROM {config['database_tables']['detailed_report']} "

            if report_type.strip().lower() == "table":
                drilldown_query = (
                    drilldown_name_query
                    + "WHERE drilldown_report = %s AND customer_id = %s"
                )
                try:
                        
                    cursor.execute(drilldown_query, (report_name, customer_id))
                    drilldown_reports = cursor.fetchall()
                except Exception as e:
                    logging.error(f"Error fetching drilldown reports: {e}")
                    return{
                        "StatusCode":int(config['codes']['database error']),
                        "Error":f"Drilldown reports error: {e}",
                    }
                    # return JSONResponse(
                    #     status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    #     content=f"Drilldown reports error: {e}",
                    # )

                for data in drilldown_reports:
                    try:
                            
                        cursor.execute(
                            f"DELETE FROM {config['database_tables']['detailed_report']} \
                                WHERE detailed_report_id = %s",
                            (data["detailed_report_id"],),
                        )
                        cursor.execute(
                            f"UPDATE {config['database_tables']['report_template']}\
                                    SET enable_drilldown = 'no' WHERE report_template_name \
                                    = %s",
                            (data["master_report"],),
                        )
                        connection.commit()
                    except Exception as e:
                        logging.error(f"Error deleting detailed report: {e}")
                        return{
                            "StatusCode":int(config['codes']['database error']),
                            "Error":f"Delete detailed report error: {e}",
                        }

            elif report_type.strip().lower() == "chart":
                drilldown_query = (
                    drilldown_name_query
                    + "WHERE master_report = %s AND customer_id = %s"
                )
                try:
                        
                    cursor.execute(drilldown_query, (report_name, customer_id))
                    drilldown_reports = cursor.fetchall()
                except Exception as e:
                    logging.error(f"Error fetching drilldown reports: {e}")
                    return{
                        "StatusCode":int(config['codes']['database error']),
                        "Error":f"Drilldown reports error: {e}",
                    }

                for data in drilldown_reports:
                    try:
                            
                        cursor.execute(
                            f"DELETE FROM {config['database_tables']['detailed_report']} \
                                WHERE detailed_report_id = %s",
                            (data["detailed_report_id"],),
                        )
                    except Exception as e:
                        logging.error(f"Error deleting detailed report: {e}")

                        return{
                            "StatusCode":int(config['codes']['database error']),
                            "Error":f"Delete detailed report error: {e}",
                        }
            try:
                    
                cursor.execute(
                    f"DELETE FROM {config['database_tables']['group_report_map']}\
                            WHERE report_id = %s",
                    (report_id,),                    
                    )
            except Exception as e:
                logging.error(f"Error deleting from group_report_map: {e}")
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Delete group report map error: {e}",
                }
            logging.info(
                "Deleted from group_report_map for report_id: %s", report_id
            )
            try:
                    
                cursor.execute(
                    f"DELETE FROM {config['database_tables']['report_template']} \
                        WHERE report_id = %s",
                    (report_id,),
                )
            except Exception as e:
                logging.error(f"Error deleting from report_template: {e}")
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Delete report template error: {e}",
                }
            logging.info(
                "Deleted from report_template for report_id: %s", report_id
            )

            connection.commit()
            try:
                    
                cursor.execute(
                    f"SELECT * FROM {config['database_tables']['dashboard_report_frame']} \
                        WHERE customer_id = %s",
                    (customer_id,),
                )
                dashboards = cursor.fetchall()
            except Exception as e:
                logging.error(f"Error fetching dashboard report frames: {e}")
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Dashboard report frames error: {e}",
                }
            logging.info(
                "Fetched dashboard report frames for customer_id: %s",
                customer_id,
            )

            for dashboard in dashboards:
                if type(dashboard["dashboard_json_frame_data"]) != list:
                    dashboard_json_frame_data_list = json.loads(
                        dashboard["dashboard_json_frame_data"]
                    )
                else:
                    dashboard_json_frame_data_list = dashboard["dashboard_json_frame_data"]            
                #dashboard_json_frame_data_list = json.loads(
                #   dashboard["dashboard_json_frame_data"]
                #)
                dashboard_name = dashboard["dashboard_report_name"]
                updated_data = [
                    chart
                    for chart in dashboard_json_frame_data_list
                    if chart["chartType"] != report_name
                ]
                try:
                        
                    cursor.execute(
                        f"UPDATE {config['database_tables']['dashboard_report_frame']}\
                                SET dashboard_json_frame_data = %s WHERE customer_id = %s\
                                    AND dashboard_report_name = %s",
                        (json.dumps(updated_data), customer_id, dashboard_name),
                    )
                    connection.commit()
                except Exception as e:
                    logging.error(f"Error updating dashboard report frame: {e}")
                    return{
                        "StatusCode":int(config['codes']['database error']),
                        "Error":f"Update dashboard report frame error: {e}",
                    }
                logging.info(
                    "Updated dashboard_report_frame for customer_id: %s,\
                            dashboard_report_name: %s",
                    customer_id,
                    dashboard_name,
                )
            logging.info(f"Closed {report_details['database_type']} database connection")
            return{
                "StatusCode":int(config['codes']['success']),
                "data":"Deleted"
            }
            # return JSONResponse(status_code=status.HTTP_200_OK, content="Deleted")
        except Exception as unexpected_exception:
            logging.error("Unexpected error: %s", unexpected_exception)
            return{
                "StatusCode":int(config['codes']['internal error']),
                "Error":f"Internal server error: {unexpected_exception}",
            }
            
        finally:
            database_service.close_connection()
            logging.info(f"Closed {report_details['database_type']} database connection")

    # async def checkReport(self, report_details):
    #     """
    #     Checks the details of a report based on the provided report ID and database type.
    #     Retrieves report information from the database and determines whether it is attached to other reports.
    #     """
    #     cursor_logger = LOGGINGS.CustomLogger()
    #     logging = cursor_logger.setup_logger()
    #     logging.info("Received request with details: %s", report_details)

    #     report_id = report_details.get("report_id")
    #     database_type = report_details.get("database_type")
    #     customer_id = report_details.get("customer_id")
    #     logging.info(
    #         "Received request to check report with report_id: %s, database_type: %s,\
    #               customer_id: %s",
    #         report_id,
    #         database_type,
    #         customer_id,
    #     )
    #     try:
    #         if database_type == "mysql":
    #             mysql_database_url = {
    #                 "host": config["mysql"]["mysql_host"],
    #                 "port": config["mysql"]["mysql_port"],
    #                 "username": config["mysql"]["mysql_username"],
    #                 "password": config["mysql"]["mysql_password"],
    #                 "schema": config["mysql"]["mysql_new_schema"],
    #             }
    #             database_mysql = db_services.get_mysql_connection(mysql_database_url)
    #             logging.info("Connected to MySQL database")

    #             with database_mysql.cursor(dictionary=True) as cursor:
    #                 cursor.execute(
    #                     f"SELECT * FROM {config['database_tables']['report_template']}\
    #                           WHERE report_id = %s",
    #                     (report_id,),
    #                 )
    #                 result = cursor.fetchall()
    #                 logging.info("Fetched report details: %s", result)

    #                 if not result:
    #                     return JSONResponse(
    #                         status_code=status.HTTP_404_NOT_FOUND,
    #                         content="Report not found",
    #                     )

    #                 report_name = result[0]["report_template_name"]
    #                 report_type = result[0]["report_type"]
    #                 reports = []

    #                 drilldown_name_query = f"SELECT detailed_report_id, master_report,\
    #                       drilldown_report FROM {config['database_tables']['detailed_report']} "

    #                 if report_type.strip().lower() == "table":
    #                     drilldown_query = (
    #                         drilldown_name_query
    #                         + "WHERE drilldown_report = %s AND customer_id = %s"
    #                     )
    #                     cursor.execute(drilldown_query, (report_name, customer_id))
    #                     drilldown_reports = cursor.fetchall()

    #                     if drilldown_reports:
    #                         reports = [
    #                             report["master_report"] for report in drilldown_reports
    #                         ]

    #                     content = {
    #                         "message": "This report is attached to the following reports.",
    #                         "Reports": reports,
    #                     }
    #                 elif report_type.strip().lower() in ["chart", "box"]:
    #                     content = {
    #                         "message": "Not attached to any reports.",
    #                         "Reports": reports,
    #                     }

    #             logging.info("Returned report check results")
    #             return JSONResponse(status_code=status.HTTP_200_OK, content=content)
    #     except Exception as unexpected_exception:
    #         logging.error("Unexpected error: %s", unexpected_exception)
    #         raise HTTPException(
    #             status_code=500, detail=f"Internal server error: {unexpected_exception}"
    #         )

    async def checkReport(self, report_details):
        cursor_logger = LOGGINGS.CustomLogger()
        logging = cursor_logger.setup_logger()
        logging.info("Received request with details: %s", report_details)

        report_id = report_details.get("report_id")
        database_type = report_details.get("database_type")
        customer_id = report_details.get("customer_id")
        logging.info(
            "Received request to check report with report_id: %s, database_type: %s,\
                  customer_id: %s",
            report_id,
            database_type,
            customer_id,
        )
        try:
                
            if database_type == "mysql":
                database_url = self.mysql_database_url
                database_service = MySQLServices(**database_url)
                cursor = database_service.connect().cursor(dictionary=True)
                logging.info("Using MySQL database service.")
            elif database_type == "oracle":
                database_url = self.oracle_database_url
                database_service = OracleServices(**database_url)
                database_service.connect()
                logging.info("Using Oracle database service.")
            elif database_type == "postgres":
                database_url = self.postgres_database_url
                database_service = PostgreSQLServices(**database_url)
                cursor = database_service.connect().cursor(cursor_factory=RealDictCursor)
                logging.info("Using Postgres database service.")
            else:
                logging.error(f"Unsupported database type: {database_type}")
                return{
                    "StatusCode":int(config['codes']['incorrect parameters']),
                    "Error":f"Unsupported database type: {database_type}",
                }
                # return JSONResponse(
                #     status_code=status.HTTP_400_BAD_REQUEST,
                #     content=f"Unsupported database type: {database_type}",
                # )
        except Exception as e:
            logging.error(f"Error connecting to database: {e}")
            return{
                "StatusCode":int(config['codes']['database error']),
                "Error":f"Database connection error: {e}",
            }


        try:
            # if database_type == "mysql":
            #     logging.info("Connected to MySQL database")

            # with database_mysql.cursor(dictionary=True) as cursor:
            try:
                    
                cursor.execute(
                    f"SELECT * FROM {config['database_tables']['report_template']}\
                            WHERE report_id = %s",
                    (report_id,),
                )
                result = cursor.fetchall()
            except Exception as e:
                logging.error(f"Error fetching report details: {e}")
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Report details error: {e}",
                }
            logging.info("Fetched report details: %s", result)

            if not result:
                return{
                    "StatusCode":int(config['codes']['no records']),
                    "Error":"No records found",
                }

            report_name = result[0]["report_template_name"]
            report_type = result[0]["report_type"]
            reports = []

            drilldown_name_query = f"SELECT detailed_report_id, master_report,\
                    drilldown_report FROM {config['database_tables']['detailed_report']} "

            if report_type.strip().lower() == "table":
                drilldown_query = (
                    drilldown_name_query
                    + "WHERE drilldown_report = %s AND customer_id = %s"
                )
                try:                        
                    cursor.execute(drilldown_query, (report_name, customer_id))
                    drilldown_reports = cursor.fetchall()
                except Exception as e:
                    logging.error(f"Error fetching drilldown reports: {e}")
                    return{
                        "StatusCode":int(config['codes']['database error']),
                        "Error":f"Drilldown reports error: {e}",
                    }
 
                if drilldown_reports:
                    reports = [
                        report["master_report"] for report in drilldown_reports
                    ]

                content = {
                    "message": "This report is attached to the following reports.",
                    "Reports": reports,
                }
            elif report_type.strip().lower() in ["chart", "box"]:
                content = {
                    "message": "Not attached to any reports.",
                    "Reports": reports,
                }

            logging.info("Returned report check results: %s", content)
            return{
                "StatusCode":int(config['codes']['success']),
                "data":content
            }
            # return JSONResponse(status_code=status.HTTP_200_OK, content=content)
        except Exception as unexpected_exception:
            logging.error("Unexpected error: %s", unexpected_exception)
            return{
                "StatusCode":int(config['codes']['internal error']),
                "Error":f"Internal server error: {unexpected_exception}",
            }
        finally:
            database_service.close_connection()
            logging.info(f"Closed {report_details['database_type']} database connection")
        
    async def get_report_data_id(self, report_details: dict):
        cursor_logger = LOGGINGS.CustomLogger()
        logging = cursor_logger.setup_logger()
        logging.info("Received request with details: %s", report_details)

        try:
            report_id = report_details.get("report_id")
            email = report_details.get("email")
            database_type = report_details.get("database_type")
            logging.info(
                "Received request to get report data with report_id: %s, email: %s, database_type: %s",
                report_id,
                email,
                database_type,
            )
            try:
                    
                if database_type == "mysql":
                    database_url = self.mysql_database_url
                    database_service = MySQLServices(**database_url)
                    database_service.connect().cursor(dictionary=True)
                    logging.info("Using MySQL database service.")
                elif database_type == "oracle":
                    database_url = self.oracle_database_url
                    database_service = OracleServices(**database_url)
                    database_service.connect()
                    logging.info("Using Oracle database service.")
                elif database_type == "postgres":
                    database_url = self.postgres_database_url
                    database_service = PostgreSQLServices(**database_url)
                    database_service.connect().cursor(cursor_factory=RealDictCursor)
                    logging.info("Using Postgres database service.")
                else:
                    logging.error(f"Unsupported database type: {database_type}")
                    return{
                        "StatusCode":int(config['codes']['incorrect parameters']),
                        "Error":f"Unsupported database type: {database_type}",
                    }
            except Exception as e:
                logging.error(f"Error connecting to database: {e}")
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Database connection error: {e}",
                }
            logging.info(f"Connected to {report_details['database_type']} database")
        
            try:
                    
                columns = ["customer_id"]
                result = database_service.read_records(
                    table="user_account",
                    columns=columns,
                    where_conditions={"user_email_id": email}
                )
            except Exception as e:
                logging.error(f"Error fetching customer ID: {e}")
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Customer ID error: {e}",
                }
            logging.info(
                "Fetched customer_id for email: %s - %s", email, result
            )
            customer_id = result[0]["customer_id"]
            try:
                    
                columns = ["*"]
                result = database_service.read_records(
                    table="report_template",
                    columns=columns,
                    where_conditions={"report_id": report_id, "customer_id": customer_id}
                )
            except Exception as e:
                logging.error(f"Error fetching report template details: {e}")
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Report template details error: {e}",
                }
            logging.info(
                "Fetched report template details for report_id: %s - %s",
                report_id,
                result,
            )
            report_type = result[0]["report_type"]
            query = result[0]["defined_query"]
            chart_type = result[0]["chart_type"]
            enable_drilldowm = result[0]["enable_drilldown"]
            auto_update_interval = result[0]["auto_update_interval"]
            report_template_name = result[0]["report_template_name"]
            db_details_id = result[0]["db_details_id"]
            # logo_path = result[0]["upload_logo"]
            if database_type == "mysql":
                logo_path = str(result[0]["upload_logo"])
            else:
                logo_path = result[0]["upload_logo"]
                if isinstance(logo_path, memoryview):
                    logo_path = logo_path.tobytes()

            background_colour = result[0]["background_colour"]
            chart_react_colour = result[0]["chart_react_colour"]
            font_size_title = result[0]["font_size_title"]
            font_size_value = result[0]["font_size_value"]
            report_title = result[0]["report_template_name"]
            enable_labels = result[0]["enable_labels"]
            if not enable_labels: enable_labels = "no"
            if report_type.lower()=="box":
                box_customization_options = result[0]["box_customization_options"]
            # here changed
            if report_type.lower()=="chart":
                chart_customizations_options = json.loads(result[0]["chart_customizations_options"]) if (result[0]["chart_customizations_options"] and result[0]["chart_customizations_options"]!=json.dumps({})) else {"chart_colours":json.dumps({}),"chart_subtitle":""}
                #if result[0]["chart_customizations_options"]:
                 #   chart_customizations_options = json.loads(result[0]["chart_customizations_options"])
                #else:
                 #   chart_customizations_options = {"chart_colours":json.dumps({}),"chart_subtitle":""}
                 

            # cursor.execute(
            #     "SELECT * FROM database_details WHERE db_details_id = %s",
            #     (db_details_id,),
            # )
            # result = cursor.fetchall()
            try:
                    
                columns = ["*"]
                result = database_service.read_records(table="database_details",
                                                columns=columns,
                                                where_conditions={
                                                    "db_details_id": db_details_id
                                                })
            except Exception as e:
                logging.error(f"Error fetching database details: {e}")
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Database details error: {e}",
                }
            logging.info(
                "Fetched database details for db_details_id: %s - %s",
                db_details_id,
                result,
            )
            db_type = result[0]["rdbms_name"]
            if result[0]["rdbms_name"] == "mysql":
                logging.info("Connected to secondary MySQL database")
                try:
                        
                    secondary_data = await self.database_chunk_processor.process_chunks(
                        db_type=result[0]["rdbms_name"],
                        query=query,
                        hostname=result[0]["domain_name"],
                        port=result[0]["db_port"],
                        db_name=result[0]["db_schema_name"],
                        db_user=result[0]["db_user_name"],
                        password=result[0]["db_password"],
                        page_size=report_details["page_size"],
                        page_no=report_details["page_no"])
                except Exception as e:
                    logging.error(f"Error processing chunks: {e}")
                    return{
                        "StatusCode":int(config['codes']['internal error']),
                        "Error":f"Chunk processing error: {e}",
                    }
                
                if secondary_data == None:
                    logging.info("No Data Found")
                    return{
                        "StatusCode":int(config['codes']['no records']),"message": "No Data Found","data":{}
                    }
                
                result = secondary_data["data"]
                column_types = secondary_data["column_types"]
                total_records = secondary_data["total_records"]
                if (result==None) or (len(result) == 0):
                    logging.info("No Data Found")
                    return{
                        "StatusCode":int(config['codes']['no records']),"message": "No Data Found","data":{}
                    }
                    # return {"status":204,"message": "No Data Found","data":{}}
                if len(result[0]) == 3:
                    if report_type.lower() == "chart":
                        if chart_type.lower() in [
                            "3darea"
                        ]:  # in ['line','bar','column','gause','area','radial']:
                            columns = list(result[0].keys())
                            temp = {}
                            for col in columns:
                                temp[col] = []
                                for i in result:
                                    if i[col] in temp[col]:
                                        continue
                                    else:
                                        temp[col].append(i[col])
                                    # names = list(result[''].keys())
                            series = []
                            for item in temp[columns[1]]:
                                ele = {"data": [], "name": item}
                                for element in result:
                                    if element[columns[1]] == item:
                                        ele["data"].append(
                                            [
                                                element[columns[0]],
                                                element[columns[2]],
                                            ]
                                        )
                                series.append(ele)

                            with open(self.CHART_PATH, "r") as f:
                                data = f.read()
                                json_data = json.loads(data)
                                json_data["series"] = series
                                json_data["title"] = report_title
                                json_data["chart_type"] = chart_type.lower()
                                json_data["report_type"] = report_type.lower()
                                json_data["xAxis"][0]["categories"] = temp[
                                    columns[0]
                                ]
                                json_data["enable_labels"] = enable_labels
                                if type(chart_customizations_options["chart_colours"])=="str":
                                    json_data["chart_colours"] = json.loads(chart_customizations_options["chart_colours"])
                                else:
                                    json_data["chart_colours"] = chart_customizations_options["chart_colours"]
                                json_data["chart_subtitle"] = chart_customizations_options["chart_subtitle"]


                            logging.info("Returning chart data: %s", json_data)
                            json_data["len_col"] = int(len(columns))
                            json_data["column_types"] = column_types
                            return{
                                "StatusCode":int(config['codes']['success']),
                                "data":json_data
                            }
                            # return json_data
                        else:
                            columns = list(result[0].keys())
                            temp = {}
                            for col in columns:
                                temp[col] = []
                                for i in result:
                                    if i[col] in temp[col]:
                                        continue
                                    else:
                                        temp[col].append(i[col])

                            series = []
                            for item in temp[columns[1]]:
                                ele = {"data": [], "name": item}
                                for element in result:
                                    if element[columns[1]] == item:
                                        ele["data"].append(element[columns[2]])
                                series.append(ele)

                            with open(self.CHART_PATH, "r") as f:
                                data = f.read()
                                json_data = json.loads(data)
                                json_data["series"] = series
                                json_data["title"] = report_title
                                json_data["chart_type"] = chart_type.lower()
                                json_data["report_type"] = report_type.lower()
                                json_data["xAxis"][0]["categories"] = temp[
                                    columns[0]
                                ]
                                json_data["enable_labels"] = enable_labels
                                # here changed
                                if type(chart_customizations_options["chart_colours"])=="str":
                                    json_data["chart_colours"] = json.loads(chart_customizations_options["chart_colours"])
                                else:
                                    json_data["chart_colours"] = chart_customizations_options["chart_colours"]
                                json_data["chart_subtitle"] = chart_customizations_options["chart_subtitle"]

                            logging.info("Returning chart data: %s", json_data)
                            json_data["len_col"] = int(len(columns))
                            json_data["column_types"] = column_types
                            return{
                                "StatusCode":int(config['codes']['success']),
                                "data":json_data
                            }
                            # return json_data

            elif result[0]["rdbms_name"] in ['postgres','vertica']:
                if result[0]['rdbms_name'] == 'postgres':
                    try:
                            
                        secondary_data = await self.database_chunk_processor.process_chunks(
                            db_type=result[0]["rdbms_name"],
                            query=query,
                            hostname=result[0]["domain_name"],
                            port=result[0]["db_port"],
                            db_name=result[0]["db_schema_name"],
                            db_user=result[0]["db_user_name"],
                            password=result[0]["db_password"],
                            page_size=report_details["page_size"],
                            page_no=report_details["page_no"])
                    except Exception as e:
                        logging.error(f"Error processing chunks: {e}")
                        return{
                            "StatusCode":int(config['codes']['internal error']),
                            "Error":f"Chunk processing error: {e}",
                        }
                    if secondary_data == None:
                        logging.info("No Data Found")
                        return{
                            "StatusCode":int(config['codes']['no records']),"message": "No Data Found","data":{}
                        }
                        # return {"status":204,"message": "No Data Found","data":{}}
                    result = secondary_data["data"]
                    column_types = secondary_data["column_types"]
                    total_records = secondary_data["total_records"]
                elif result[0]['rdbms_name'] == 'vertica':
                    try:
                            
                        secondary_data = await self.database_chunk_processor.process_chunks(
                            db_type=result[0]["rdbms_name"],
                            query=query,
                            hostname=result[0]["domain_name"],
                            port=result[0]["db_port"],
                            db_name=result[0]["db_schema_name"],
                            db_user=result[0]["db_user_name"],
                            password=result[0]["db_password"],
                            page_size=report_details["page_size"],
                            page_no=report_details["page_no"])
                    except Exception as e:
                        logging.error(f"Error processing chunks: {e}")
                        return{
                            "StatusCode":int(config['codes']['internal error']),
                            "Error":f"Chunk processing error: {e}",
                        }
                    if secondary_data == None:
                        logging.info("No Data Found")
                        return{
                            "StatusCode":int(config['codes']['no records']),"message": "No Data Found","data":{}
                        }
                        # return {"status":204,"message": "No Data Found","data":{}}
                    result = secondary_data["data"]
                    column_types = secondary_data["column_types"]
                    total_records = secondary_data["total_records"]
                if (result==None) or (len(result) == 0):
                    logging.info("No Data Found")
                    return{
                        "StatusCode":int(config['codes']['no records']),"message": "No Data Found","data":{}
                    }
                    # return {"status":204,"message": "No Data Found","data":{}}
                if len(result[0]) == 3:
                    if report_type.lower() == "chart":
                        if chart_type.lower() in [
                            "3darea"
                        ]:  # in ['line','bar','column','gause','area','radial']:
                            columns = list(result[0].keys())
                            temp = {}
                            for col in columns:
                                temp[col] = []
                                for i in result:
                                    if i[col] in temp[col]:
                                        continue
                                    else:
                                        temp[col].append(i[col])

                            series = []
                            for item in temp[columns[1]]:
                                ele = {"data": [], "name": item}
                                for element in result:
                                    if element[columns[1]] == item:
                                        ele["data"].append(
                                            [
                                                element[columns[0]],
                                                element[columns[2]],
                                            ]
                                        )
                                series.append(ele)

                            with open(self.CHART_PATH, "r") as f:
                                data = f.read()
                                json_data = json.loads(data)
                                json_data["series"] = series
                                json_data["title"] = report_title
                                json_data["chart_type"] = chart_type.lower()
                                json_data["report_type"] = report_type.lower()
                                json_data["xAxis"][0]["categories"] = temp[
                                    columns[0]
                                ]
                                json_data["enable_labels"] = enable_labels
                                if type(chart_customizations_options["chart_colours"])=="str":
                                    json_data["chart_colours"] = json.loads(chart_customizations_options["chart_colours"])
                                else:
                                    json_data["chart_colours"] = chart_customizations_options["chart_colours"]
                                json_data["chart_subtitle"] = chart_customizations_options["chart_subtitle"]

                            logging.info("Returning chart data: %s", json_data)
                            json_data["len_col"] = int(len(columns))
                            json_data["column_types"] = column_types
                            return{
                                "StatusCode":int(config['codes']['success']),
                                "data":json_data
                            }
                            # return json_data
                        else:
                            columns = list(result[0].keys())
                            temp = {}
                            for col in columns:
                                temp[col] = []
                                for i in result:
                                    if i[col] in temp[col]:
                                        continue
                                    else:
                                        temp[col].append(i[col])

                            series = []
                            for item in temp[columns[1]]:
                                ele = {"data": [], "name": item}
                                for element in result:
                                    if element[columns[1]] == item:
                                        ele["data"].append(element[columns[2]])
                                series.append(ele)

                            with open(self.CHART_PATH, "r") as f:
                                data = f.read()
                                json_data = json.loads(data)
                                json_data["series"] = series
                                json_data["title"] = report_title
                                json_data["chart_type"] = chart_type.lower()
                                json_data["report_type"] = report_type.lower()
                                json_data["xAxis"][0]["categories"] = temp[
                                    columns[0]
                                ]
                                json_data["enable_labels"] = enable_labels
                                if type(chart_customizations_options["chart_colours"])=="str":
                                    json_data["chart_colours"] = json.loads(chart_customizations_options["chart_colours"])
                                else:
                                    json_data["chart_colours"] = chart_customizations_options["chart_colours"]
                                json_data["chart_subtitle"] = chart_customizations_options["chart_subtitle"]

                            logging.info("Returning chart data: %s", json_data)
                            json_data["len_col"] = int(len(columns))
                            json_data["column_types"] = column_types
                            return{
                                "StatusCode":int(config['codes']['success']),
                                "data":json_data
                            }
                            # return json_data

            if report_type.lower() == "chart":
                if chart_type.lower():
                    columns = list(result[0].keys())
                    names = list(result[0].keys())
                    transposed_data = list(zip(*[item.values() for item in result]))
                    series = [
                        {"data": metric_data, "name": name}
                        for name, metric_data in zip(names, transposed_data)
                    ]
                    with open(self.CHART_PATH, "r") as f:
                        data = f.read()
                        json_data = json.loads(data)
                        json_data["series"] = series
                        json_data["title"] = report_template_name
                        json_data["chart_type"] = chart_type.lower()
                        json_data["xAxis"][0]["categories"] = series[0]["data"]
                        json_data["enable_labels"] = enable_labels
                        if type(chart_customizations_options["chart_colours"])=="str":
                            json_data["chart_colours"] = json.loads(chart_customizations_options["chart_colours"])
                        else:
                            json_data["chart_colours"] = chart_customizations_options["chart_colours"]
                        json_data["chart_subtitle"] = chart_customizations_options["chart_subtitle"]

                    logging.info("Returning chart data: %s", json_data)
                    json_data["len_col"] = int(len(columns))
                    json_data["column_types"] = column_types
                    return{
                        "StatusCode":int(config['codes']['success']),
                        "data":json_data
                    }
                    # return json_data

            elif report_type.lower() == "box":
                report_key = next(iter(result[0]))
                
                if type(result[0]) == dict or type(result[0]) == RealDictCursor or type(result[0]) == RealDictCursor:
                    report_value = result[0][report_key]
                else:
                    report_value = result[0][0]

                box_value_id = {
                    "box_value_id": report_value,
                    "backgroung_color": background_colour,
                    "chart_react_color": chart_react_colour,
                    "font_size_title": font_size_title,
                    "font_size_value": font_size_value,
                    "report_type": report_type.lower(),
                    "report_title": report_title,
                    "logo_path": logo_path,
                    "box_customization_options": box_customization_options
                }
                logging.info("Returning box data: %s", box_value_id)

                return{
                    "StatusCode":config['codes']['success'],
                    "data":box_value_id
                }
                
            elif report_type.lower() == "table":
                final_result = {}
                if db_type == "mysql":
                    column_names = list(result[0].keys())
                    final_result["column_names"] = column_names
                    final_result["data"] = result
                    final_result["report_type"] = report_type.lower()
                    final_result["report_title"] = report_title
                    logging.info("Returning mysql table data: %s", final_result)
                    final_result["total_records"] = total_records
                    final_result["column_types"] = column_types
                    return{
                        "StatusCode":int(config['codes']['success']),
                        "data":final_result
                    }
                    # return final_result
                elif db_type in ['postgres','vertica']:
                    column_names = list(result[0].keys())
                    final_result["column_names"] = column_names
                    final_result["data"] = result
                    final_result["report_type"] = report_type.lower()
                    final_result["report_title"] = report_title
                    logging.info("Returning table data: %s", final_result)
                    final_result["total_records"] = total_records
                    final_result["column_types"] = column_types
                    return{
                        "StatusCode":int(config['codes']['success']),
                        "data":final_result
                    }
                    # return final_result
        except Exception as unexpected_exception:
            logging.error("Unexpected error: %s", unexpected_exception)
            return{
                "StatusCode":int(config['codes']['internal error']),
                "Error":f"Internal server error: {unexpected_exception}",
            }

        finally:
            database_service.close_connection()
            logging.info(f"Closed {report_details['database_type']} database connection")

    async def updateReport(self, details: str = Form(...), file: Optional[UploadFile] = None):
        """
        Updates the report details in the database based on the provided input. 

        The function processes the request data, connects to the appropriate database 
        (MySQL or Oracle), fetches the existing report details, and updates any changed fields. 
        It also handles file uploads, encoding them in base64, and updating the report logo if necessary. Additionally, it calls stored procedures for specific updates 
        """
        cursor_logger = LOGGINGS.CustomLogger()
        logging = cursor_logger.setup_logger()
        logging.info("Received request with details: %s", details)
        user_details = updateReport_input.parse_obj(json.loads(details)).model_dump(by_alias=True)
        try:
            report_id = user_details.get("report_id")
            if user_details.get("chart_colours"):
                user_details["chart_colours"] = json.dumps(user_details.get("chart_colours"))
            try:
                    
                if user_details['database_type'] == "mysql":
                    database_url = self.mysql_database_url
                    database_service = MySQLServices(**database_url)
                    connection = database_service.connect()
                    cursor = connection.cursor(dictionary=True)
                    logging.info("Using MySQL database service.")
                elif user_details['database_type'] == "oracle":
                    database_url = self.oracle_database_url
                    database_service = OracleServices(**database_url)
                    database_service.connect()
                    logging.info("Using Oracle database service.")
                elif user_details['database_type'] == "postgres":
                    database_url = self.postgres_database_url
                    database_service = PostgreSQLServices(**database_url)
                    connection = database_service.connect()
                    cursor = connection.cursor(cursor_factory=RealDictCursor)
                    logging.info("Using Postgres database service.")
                else:
                    logging.error(f"Unsupported database type: {user_details['database_type']}")
                    return{
                        "StatusCode":int(config['codes']['incorrect parameters']),
                        "Error":f"Unsupported database type: {user_details['database_type']}",
                    }
                    
            except Exception as e:
                logging.error(f"Error connecting to database: {e}")
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Database connection error: {e}",
                }            
           
            if user_details.get("box_customization_options"):
                user_details["box_customization_options"] = json.dumps(user_details.get("box_customization_options"))
 
            if user_details.get("chart_customizations_options"):
                user_details["chart_customizations_options"] = json.dumps(user_details.get("chart_customizations_options"))
               
            if not all([report_id, user_details['database_type']]):
                logging.error(
                    "Invalid request payload: Missing report_id or database_type"
                )
                return{
                    "StatusCode":int(config['codes']['invalid request']),
                    "Error":"Invalid request payload: Missing report_id or database_type",
                }
 
            icon_path = None
            if file is not None:
                file_content = await file.read()
                base64_data = base64.b64encode(file_content)
                base64_data_str = base64_data.decode("utf-8")
                icon_path = base64_data_str
                logging.info("File uploaded and encoded to base64")
 
 
            logging.info("Connected to database")
            try:
                    
                query = f"SELECT * FROM {config['database_tables']['report_template']}\
                    where report_id = %s"
                cursor.execute(query, (report_id,))
                db_values = cursor.fetchone()
            except Exception as e:
                logging.error(f"Error fetching report template: {e}")
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Report template error: {e}",
                }
 
            logging.info(
                "Fetched report template from database"
            )
            if db_values is not None:
                for key, value in user_details.items():
                    if (
                        key in db_values.keys()
                        and db_values[key] != value
                        and key not in ["report_id"] and value
                    ):
                        try:
                                
                            update_query = f"UPDATE {config['database_tables']['report_template']} SET {key} = %s WHERE report_id = {report_id}"
                            cursor.execute(update_query, (value,))
                        except Exception as e:
                            logging.error(f"Error updating {key}: {e}")
                            return{
                                "StatusCode":int(config['codes']['database error']),
                                "Error":f"Update error: {e}",
                            }
                        logging.info(
                            "Updated %s to %s in database", key, value
                        )
                        try:
                                
                            if key == "report_template_name":
                                if user_details['database_type'] == "postgres":
                                    # print(f"HERE one: {db_values[key]} {value}")
                                    # cursor.callproc(
                                    #     "update_report_name",
                                    #     (db_values[key], value, "", ""),
                                    # )
                                    # cursor.execute("CALL update_report_name(%s, %s, %s, %s)", ( db_values[key], value,"",""))
                                    cursor.execute(
                                        """
                                        CALL update_report_name(
                                            %s::varchar,
                                            %s::varchar,
                                            %s::varchar,
                                            %s::varchar
                                        )
                                        """,
                                        (db_values[key], value, "", "")
                                    )
                                else:
                                    cursor.callproc(
                                        "UpdateReportName",
                                        (db_values[key], value, "", ""),
                                    )
                            elif key == "report_type":
                                if user_details['database_type'] == "postgres":
                                    # print(f"HERE: {db_values[key]} {value}")
                                    # cursor.callproc(
                                    #     "update_report_name",
                                    #     ("", "", db_values[key], value),
                                    # )
                                    cursor.execute(
                                        """
                                        CALL update_report_name(
                                            %s::varchar,
                                            %s::varchar,
                                            %s::varchar,
                                            %s::varchar
                                        )
                                        """,
                                        ("", "", db_values[key], value)
                                    )

                                else:
                                    cursor.callproc(
                                        "UpdateReportName",
                                        (db_values[key], value, "", ""),
                                    )
                            logging.info(
                                "Called stored procedure UpdateReportName with \
                                    parameters %s and %s",
                                db_values[key],
                                value,
                            )
    
                            connection.commit()
                        except Exception as e:
                            logging.error(f"Error calling stored procedure: {e}")
                            return{
                                "StatusCode":int(config['codes']['database error']),
                                "Error":f"Stored procedure error: {e}"
                            }
    
                if icon_path is not None:
                    try:                            
                        update_query = f"UPDATE\
                            {config['database_tables']['report_template']} \
                                SET upload_logo = %s WHERE report_id = {report_id}"
                        cursor.execute(update_query, (icon_path,))
                        connection.commit()
                    except Exception as e:
                        logging.error(f"Error updating upload_logo: {e}")
                        return{
                            "StatusCode":int(config['codes']['database error']),
                            "Error":f"Upload logo error: {e}"
                        }
                    logging.info("Updated upload_logo in database")
                return{
                    "StatusCode":int(config['codes']['success']),
                    "message": "Database updated successfully!",
                }
            else:
                logging.error(
                    "Report not found with the given report_id: %s", report_id
                )
                return{
                    "StatusCode":int(config['codes']['no records']),
                    "message": "Report not found with the given report_id",
                }
 
        except Exception as unexpected_exception:
            logging.error("Unexpected error: %s", unexpected_exception)
            return{
                "StatusCode":int(config['codes']['internal error']),
                "Error":f"Internal server error: {unexpected_exception}",
            }
        finally:
            if "cursor" and "connection" in locals():
                cursor.close()
                database_service.close_connection()
                logging.info("Database connection closed")

    # async def getFeatures(self, details: dict):
    #     """
    #     This function connects to a MySQL database, fetches the customer ID using the given email,
    #     and retrieves the features associated with that customer. 
    #     """
    #     cursor_logger = LOGGINGS.CustomLogger()
    #     logging = cursor_logger.setup_logger()
    #     logging.info("Received request with details: %s", details)
    #     try:
    #         database_type = details.get("database_type")
    #         email = details.get("email")
    #         if not all([database_type, email]):
    #             logging.error(
    #                 "Invalid request payload: Missing database_type or email"
    #             )
    #             raise HTTPException(status_code=400, detail="Invalid request payload")

    #         if database_type == "mysql":
    #             mysql_database_url = {
    #                 "host": config["mysql"]["mysql_host"],
    #                 "port": config["mysql"]["mysql_port"],
    #                 "username": config["mysql"]["mysql_username"],
    #                 "password": config["mysql"]["mysql_password"],
    #                 "schema": config["mysql"]["mysql_new_schema"],
    #             }
    #             database_mysql = db_services.get_mysql_connection(mysql_database_url)
    #             logging.info("Connected to MySQL database")
    #             with database_mysql.cursor(dictionary=True) as cursor:
    #                 cursor.execute(
    #                     f"select customer_id from {config['database_tables']['user_account']} \
    #                         where user_email_id = %s",
    #                     (email,),
    #                 )
    #                 result = cursor.fetchall()
    #                 if not result:
    #                     logging.error("No customer found with email: %s", email)
    #                     raise HTTPException(
    #                         status_code=404, detail="Customer not found"
    #                     )

    #                 customer_id = result[0]["customer_id"]
    #                 logging.info(
    #                     "Found customer_id: %s for email: %s", customer_id, email
    #                 )

    #                 cursor.execute(
    #                     f"select feature_id, featurename from \
    #                         {config['database_tables']['features']} where customer_id = %s",
    #                     (customer_id,),
    #                 )
    #                 result = cursor.fetchall()
    #                 logging.info(
    #                     "Fetched features: %s for customer_id: %s", result, customer_id
    #                 )

    #             database_mysql.close()
    #             logging.info("Database connection closed")
    #             return result

    #     except Exception as unexpected_exception:
    #         logging.error("Unexpected error: %s", unexpected_exception)

    #         raise HTTPException(
    #             status_code=500,
    #             detail="Internal server error: {}".format(unexpected_exception),
    #         )

    async def getFeatures(self, details: dict):
        cursor_logger = LOGGINGS.CustomLogger()
        logging = cursor_logger.setup_logger()
        logging.info("Received request with details: %s", details)
        database_type = details.get("database_type")
        try:
                
            if database_type == "mysql":
                database_url = self.mysql_database_url
                database_service = MySQLServices(**database_url)
                database_service.connect()
                logging.info("Using MySQL database service.")
            elif database_type == "oracle":
                database_url = self.oracle_database_url
                database_service = OracleServices(**database_url)
                database_service.connect()
                logging.info("Using Oracle database service.")
            elif database_type == "postgres":
                database_url = self.postgres_database_url
                database_service = PostgreSQLServices(**database_url)
                database_service.connect()
                logging.info("Using Postgres database service.")
            else:
                logging.error(f"Unsupported database type: {database_type}")
                return{
                    "StatusCode":int(config['codes']['incorrect parameters']),
                    "Error":f"Unsupported database type: {database_type}",
                }
        except Exception as e:
            logging.error(f"Error connecting to database: {e}")
            return{
                "StatusCode":int(config['codes']['database error']),
                "Error":f"Database connection error: {e}",
            }


        try:
            
            email = details.get("email")
            if not all([database_type, email]):
                logging.error(
                    "Invalid request payload: Missing database_type or email"
                )
                return{
                    "StatusCode":int(config['codes']['invalid request']),
                }

        # if database_type == "mysql":
        # with database_mysql.cursor(dictionary=True) as cursor:
            # cursor.execute(
            #     f"select customer_id from {config['database_tables']['user_account']} \
            #         where user_email_id = %s",
            #     (email,),
            # )
            # result = cursor.fetchall()
            try:

                columns = ["customer_id"]
                result = database_service.read_records(
                    table=config['database_tables']['user_account'],
                    columns=columns,
                    where_conditions={"user_email_id": email}
                )
            except Exception as e:
                logging.error(f"Error fetching customer ID: {e}")
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Customer ID error: {e}",
                }

            if not result:
                logging.error("No customer found with email: %s", email)
                return{
                    "StatusCode":int(config['codes']['no records']),
                    "Error":"Customer not found",
                }

            customer_id = result[0]["customer_id"]
            logging.info(
                "Found customer_id: %s for email: %s", customer_id, email
            )

            # cursor.execute(
            #     f"select feature_id, featurename from \
            #         {config['database_tables']['features']} where customer_id = %s",
            #     (customer_id,),
            # )
            # result = cursor.fetchall()
            try:
                    
                columns = ["feature_id", "featurename"]
                result = database_service.read_records(
                    table=config['database_tables']['features'],
                    columns=columns,
                    where_conditions={"customer_id": customer_id}
                )
            except Exception as e:
                logging.error(f"Error fetching features: {e}")
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Features error: {e}",
                }

            logging.info(
                "Fetched features: %s for customer_id: %s", result, customer_id
            )
            return{
                "StatusCode":int(config['codes']['success']),
                "data":result
            }
            # return result

        except Exception as unexpected_exception:
            logging.error("Unexpected error: %s", unexpected_exception)
            return{
                "StatusCode":int(config['codes']['internal error']),
                "Error":f"Internal server error: {unexpected_exception}"
            }
        finally:
            database_service.close_connection()
            logging.info(f"Closed {details['database_type']} database connection")

    def allowed_file(self, filename):
        """Method to check if the file extension is allowed."""
        cursor_logger = LOGGINGS.CustomLogger()
        logging = cursor_logger.setup_logger()
        logging.info("Checking if file is allowed: %s", filename)
        is_allowed = (
            "." in filename
            and filename.rsplit(".", 1)[1].lower() in self.ALLOWED_EXTENSIONS
        )
        if is_allowed:
            logging.info("File is allowed: %s", filename)
        else:
            logging.warning("File is not allowed: %s", filename)
        return{
            "StatusCode":int(config['codes']['success']),
            "data": is_allowed
        }
        # return is_allowed

    # async def upload_image(
    #     self,
    #     file: UploadFile = File(...),
    #     feature_name: str = Form(...),
    #     customer_id: str = Form(...),
    #     database_type: str = Form(...),
    # ):
    #     """Method to upload an image file."""
    #     upload_request = UploadImageRequest(
    #         file=file,
    #         feature_name=feature_name,
    #         customer_id=customer_id,
    #         database_type=database_type
    #         )
    #     cursor_logger = LOGGINGS.CustomLogger()
    #     logging = cursor_logger.setup_logger()
    #     logging.info(
    #         "Received request to add feature: %s for customer ID: %s",
    #         feature_name,
    #         customer_id,
    #     )

    #     try:
    #         base_dir = os.getcwd()
    #         original_path = Path(base_dir)
    #         parent_path = original_path.parent

    #         icon_path = "/featureIcon"
    #         full_path = os.path.join(parent_path, "hyphenview", icon_path)
    #         uploads_directory = Path(full_path)
    #         uploads_directory.mkdir(parents=True, exist_ok=True)
    #         file_extension = guess_extension(file.content_type)
    #         file_name = f"{customer_id}_{feature_name}{file_extension}"
    #         icon_path += "/{}".format(file_name)
    #         file_path = uploads_directory / file_name
    #         with file_path.open("wb") as buffer:
    #             buffer.write(await file.read())
    #         logging.info("File uploaded to: %s", file_path)

    #         if database_type == "mysql":
    #             mysql_database_url = {
    #                 "host": config["mysql"]["mysql_host"],
    #                 "port": config["mysql"]["mysql_port"],
    #                 "username": config["mysql"]["mysql_username"],
    #                 "password": config["mysql"]["mysql_password"],
    #                 "schema": config["mysql"]["mysql_new_schema"],
    #             }
    #             database_mysql = db_services.get_mysql_connection(mysql_database_url)
    #             logging.info("Connected to MySQL database")

    #             with database_mysql.cursor(dictionary=True) as cursor:
    #                 cursor.execute(
    #                     f"INSERT INTO {config['database_tables']['features']} \
    #                         (featurename, customer_id, created_at, feature_logo) \
    #                             VALUES (%s, %s, %s, %s)",
    #                     (feature_name, customer_id, datetime.now(), icon_path),
    #                 )
    #                 database_mysql.commit()
    #                 logging.info(
    #                     "Feature '%s' added to the database for customer ID: %s",
    #                     feature_name,
    #                     customer_id,
    #                 )

    #         return JSONResponse(
    #             status_code=status.HTTP_201_CREATED,
    #             content=f"Feature '{feature_name}' added for customer ID {customer_id}.",
    #         )
    #     except Exception as e:
    #         logging.error("An error occurred: %s", e)
    #         # return {"error": f"An error occurred: {str(e)}"}
    #         return JSONResponse(
    #             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    #             content="Internal server error: {}".format(e),
    #         )

    async def upload_image(
        self,
        file: UploadFile = File(...),
        feature_name: str = Form(...),
        customer_id: str = Form(...),
        database_type: str = Form(...),
    ):
        
        # print(database_type)
        upload_request = UploadImageRequest(
            file=file,
            feature_name=feature_name,
            customer_id=customer_id,
            database_type=database_type
            )
        cursor_logger = LOGGINGS.CustomLogger()
        logging = cursor_logger.setup_logger()
        logging.info(
            "Received request to add feature: %s for customer ID: %s",
            feature_name,
            customer_id,
        )

        try:
            base_dir = os.getcwd()
            original_path = Path(base_dir)
            parent_path = original_path.parent
            icon_path = "/featureIcon"
            full_path = os.path.join(parent_path, "hyphenview", icon_path)
            uploads_directory = Path(full_path)
            uploads_directory.mkdir(parents=True, exist_ok=True)
            file_extension = guess_extension(file.content_type)
            file_name = f"{customer_id}_{feature_name}{file_extension}"
            icon_path += "/{}".format(file_name)
            file_path = uploads_directory / file_name
            with file_path.open("wb") as buffer:
                buffer.write(await file.read())
            logging.info("File uploaded to: %s", file_path)
            try:
                    
                if database_type == "mysql":
                    database_url = self.mysql_database_url
                    database_service = MySQLServices(**database_url)
                    database_service.connect().cursor(dictionary=True)
                    logging.info("Using MySQL database service.")
                elif database_type == "oracle":
                    database_url = self.oracle_database_url
                    database_service = OracleServices(**database_url)
                    database_service.connect()
                    logging.info("Using Oracle database service.")
                elif database_type == "postgres":
                    database_url = self.postgres_database_url
                    database_service = PostgreSQLServices(**database_url)
                    database_service.connect().cursor(cursor_factory=RealDictCursor)
                    logging.info("Using Postgres database service.")
                else:
                    logging.error(f"Unsupported database type: {database_type}")
                    return{
                        "StatusCode":int(config['codes']['incorrect parameters']),
                        "Error":f"Unsupported database type: {database_type}",
                    }
                    
            except Exception as e:
                logging.error(f"Error connecting to database: {e}")
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Database connection error: {e}",
                }


        # if database_type == "mysql":
            # mysql_database_url = {
            #     "host": config["mysql"]["mysql_host"],
            #     "port": config["mysql"]["mysql_port"],
            #     "username": config["mysql"]["mysql_username"],
            #     "password": config["mysql"]["mysql_password"],
            #     "schema": config["mysql"]["mysql_new_schema"],
            # }
            # database_mysql = db_services.get_mysql_connection(mysql_database_url)
            logging.info(f"Connected to {database_type} database")

        # with database_mysql.cursor(dictionary=True) as cursor:
            # cursor.execute(
            #     f"INSERT INTO {config['database_tables']['features']} \
            #         (featurename, customer_id, created_at, feature_logo) \
            #             VALUES (%s, %s, %s, %s)",
            #     (feature_name, customer_id, datetime.now(), icon_path),
            # )
            # database_mysql.commit()
            data = {
                "featurename": feature_name,
                "customer_id": customer_id,
                "created_at": datetime.now(),
                "feature_logo": icon_path
            }
            try:
                    
                database_service.create_record(
                    table=config['database_tables']['features'],
                    data=data
                )
            except Exception as e:
                logging.error(f"Error inserting feature: {e}")
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Insert error: {e}",
                }
            logging.info(
                "Feature '%s' added to the database for customer ID: %s",
                feature_name,
                customer_id,
            )
            return{
                "StatusCode":int(config['codes']['success']),
                "data":f"Feature '{feature_name}' added for customer ID {customer_id}."
            }
        except Exception as e:
            logging.error("An error occurred: %s", e)
            # return {"error": f"An error occurred: {str(e)}"}
            return{
                "StatusCode":int(config['codes']['internal error']),
                "Error":f"Internal server error: {e}"
            }
        finally:
            database_service.close_connection()
            logging.info(f"Closed {database_type} database connection")

    # async def assignReports(self, details: dict):
    #     """
    #     Assigns reports to a specific group in the database. If an entry for the given group ID 
    #     and report ID already exists, it updates the access mask and timestamp. Otherwise, it 
    #     inserts a new entry. Supports MySQL database.
    #     """
    #     cursor_logger = LOGGINGS.CustomLogger()
    #     logging = cursor_logger.setup_logger()
    #     logging.info("Received request to assign reports: %s", details)
    #     try:
    #         database_type = details.get("database_type")
    #         group_id = details.get("group_id")
    #         report_ids = details.get("report_ids")
    #         access_masks = details.get("access_masks")
    #         date = datetime.now()
    #         if database_type == "mysql":
    #             mysql_database_url = {
    #                 "host": config["mysql"]["mysql_host"],
    #                 "port": config["mysql"]["mysql_port"],
    #                 "username": config["mysql"]["mysql_username"],
    #                 "password": config["mysql"]["mysql_password"],
    #                 "schema": config["mysql"]["mysql_new_schema"],
    #             }
    #             database_mysql = db_services.get_mysql_connection(mysql_database_url)
    #             logging.info("Connected to MySQL database")
    #             with database_mysql.cursor(dictionary=True) as cursor:
    #                 for report_id in report_ids:
    #                     access_mask = access_masks[report_ids.index(report_id)]
    #                     logging.info(
    #                         "Assigning report ID: %s with access mask: %s to group ID: %s",
    #                         report_id,
    #                         access_mask,
    #                         group_id,
    #                     )

    #                     select_query = f"SELECT * FROM\
    #                           {config['database_tables']['group_report_map']} \
    #                             WHERE group_id = %s AND report_id = %s"
    #                     cursor.execute(select_query, (group_id, report_id))
    #                     existing_entry = cursor.fetchone()

    #                     if existing_entry:

    #                         update_query = f"UPDATE {config['database_tables']['group_report_map']}\
    #                               SET created_at = %s, access_mask = %s WHERE group_id = %s AND\
    #                                   report_id = %s"
    #                         cursor.execute(
    #                             update_query, (date, access_mask, group_id, report_id)
    #                         )
    #                         logging.info(
    #                             "Updated existing entry for report ID: %s and group ID: %s",
    #                             report_id,
    #                             group_id,
    #                         )
    #                     else:
    #                         insert_query = f"INSERT INTO\
    #                               {config['database_tables']['group_report_map']}\
    #                                   (group_id, report_id, created_at, access_mask)\
    #                                       VALUES (%s, %s, %s, %s)"
    #                         cursor.execute(
    #                             insert_query, (group_id, report_id, date, access_mask)
    #                         )
    #                         logging.info(
    #                             "Inserted new entry for report ID: %s and group ID: %s",
    #                             report_id,
    #                             group_id,
    #                         )
    #             database_mysql.commit()
    #             database_mysql.close()
    #             logging.info("Database connection closed")

    #             return JSONResponse(
    #                 status_code=status.HTTP_200_OK,
    #                 content="Report Assigned Successfully!",
    #             )

    #     except Exception as unexpected_exception:
    #         logging.error("Unexpected error: %s", unexpected_exception)

    #         return JSONResponse(
    #             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    #             content="Internal server error: {}".format(unexpected_exception),
    #         )

    async def assignReports(self, details: dict):
        cursor_logger = LOGGINGS.CustomLogger()
        logging = cursor_logger.setup_logger()
        logging.info("Received request to assign reports: %s", details)
        try:
            group_id = details.get("group_id")
            report_ids = details.get("report_ids")
            access_masks = details.get("access_masks")
            date = datetime.now()
            database_type = details['database_type']

            try:
                    
                if database_type == "mysql":
                    database_url = self.mysql_database_url
                    database_service = MySQLServices(**database_url)
                    database_service.connect().cursor(dictionary=True)
                    logging.info("Using MySQL database service.")
                elif database_type == "oracle":
                    database_url = self.oracle_database_url
                    database_service = OracleServices(**database_url)
                    database_service.connect()
                    logging.info("Using Oracle database service.")
                elif database_type == "postgres":
                    database_url = self.postgres_database_url
                    database_service = PostgreSQLServices(**database_url)
                    database_service.connect().cursor(cursor_factory=RealDictCursor)
                    logging.info("Using Postgres database service.")
                else:
                    logging.error(f"Unsupported database type: {database_type}")
                    return{
                        "StatusCode":int(config['codes']['incorrect parameters']),
                        "Error":f"Unsupported database type: {database_type}",
                    }
            except Exception as e:
                logging.error(f"Error connecting to database: {e}")
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Database connection error: {e}",
                }

            
        # if database_type == "mysql":
            # mysql_database_url = {
            #     "host": config["mysql"]["mysql_host"],
            #     "port": config["mysql"]["mysql_port"],
            #     "username": config["mysql"]["mysql_username"],
            #     "password": config["mysql"]["mysql_password"],
            #     "schema": config["mysql"]["mysql_new_schema"],
            # }
            # database_mysql = db_services.get_mysql_connection(mysql_database_url)
            # logging.info("Connected to MySQL database")
        # with database_mysql.cursor(dictionary=True) as cursor:
            for report_id in report_ids:
                access_mask = access_masks[report_ids.index(report_id)]
                logging.info(
                    "Assigning report ID: %s with access mask: %s to group ID: %s",
                    report_id,
                    access_mask,
                    group_id,
                )

                # select_query = f"SELECT * FROM\
                #       {config['database_tables']['group_report_map']} \
                #         WHERE group_id = %s AND report_id = %s"
                # cursor.execute(select_query, (group_id, report_id))
                # existing_entry = cursor.fetchone()
                try:
                        
                    columns = ["*"]
                    existing_entry = database_service.read_records(
                        table=config['database_tables']['group_report_map'],
                        columns=columns,
                        where_conditions={"group_id": group_id, "report_id": report_id}
                    )
                except Exception as e:
                    logging.error(f"Error fetching existing entry: {e}")
                    return{
                        "StatusCode":int(config['codes']['database error']),
                        "Error":f"Fetch error: {e}"
                    }
                existing_entry = existing_entry[0] if existing_entry else None

                if existing_entry:
                    # update_query = f"UPDATE {config['database_tables']['group_report_map']}\
                    #       SET created_at = %s, access_mask = %s WHERE group_id = %s AND\
                    #           report_id = %s"
                    # cursor.execute(
                    #     update_query, (date, access_mask, group_id, report_id)
                    # )
                    try:
                            
                        database_service.update_record(
                            table=config['database_tables']['group_report_map'],
                            data={"created_at": date, "access_mask": access_mask},
                            where_conditions={"group_id": group_id, "report_id": report_id}
                        )
                    except Exception as e:
                        logging.error(f"Error updating existing entry: {e}")
                        return{
                            "StatusCode":int(config['codes']['database error']),
                            "Error":f"Update error: {e}"
                        }

                    logging.info(
                        "Updated existing entry for report ID: %s and group ID: %s",
                        report_id,
                        group_id,
                    )

                else:
                    # insert_query = f"INSERT INTO\
                    #       {config['database_tables']['group_report_map']}\
                    #           (group_id, report_id, created_at, access_mask)\
                    #               VALUES (%s, %s, %s, %s)"
                    # cursor.execute(
                    #     insert_query, (group_id, report_id, date, access_mask)
                    # )
                    try:
                            
                        database_service.create_record(
                            table=config['database_tables']['group_report_map'],
                            data={
                                "group_id": group_id,
                                "report_id": report_id,
                                "created_at": date,
                                "access_mask": access_mask
                            }
                        )
                    except Exception as e:
                        logging.error(f"Error inserting new entry: {e}")
                        return{
                            "StatusCode":int(config['codes']['database error']),
                            "Error":f"Insert error: {e}"
                        }
                    logging.info(
                        "Inserted new entry for report ID: %s and group ID: %s",
                        report_id,
                        group_id,
                    )

            # database_mysql.commit()
            # database_mysql.close()
            return{
                "StatusCode":int(config['codes']['success']),
                "data":"Report Assigned Successfully!"
            }

        except Exception as unexpected_exception:
            logging.error("Unexpected error: %s", unexpected_exception)
            return{
                "StatusCode":int(config['codes']['internal error']),
                "Error":f"Internal server error: {unexpected_exception}"
            }
        finally:
            database_service.close_connection()
            logging.info(f"Closed {details['database_type']} database connection")

    # async def assignFeatures(self, details: dict):
    #     """
    #     Assigns features to a specific group in the database.

    #     This Method retrieves customer information based on the provided email, 
    #     fetches feature IDs corresponding to the given feature names, and assigns 
    #     them to a group with specified access masks. If an assignment already 
    #     exists, it updates the access mask; otherwise, it inserts a new entry.
    #     """
    #     cursor_logger = LOGGINGS.CustomLogger()
    #     logging = cursor_logger.setup_logger()
    #     logging.info("Received request to assign features: %s", details)

    #     try:
    #         database_type = details.get("database_type")
    #         feature_names = details.get("feature_names")
    #         group_id = details.get("group_id")
    #         access_masks = details.get("access_masks")
    #         date = datetime.now()
    #         email = details.get("email")
    #         if database_type == "mysql":
    #             mysql_database_url = {
    #                 "host": config["mysql"]["mysql_host"],
    #                 "port": config["mysql"]["mysql_port"],
    #                 "username": config["mysql"]["mysql_username"],
    #                 "password": config["mysql"]["mysql_password"],
    #                 "schema": config["mysql"]["mysql_new_schema"],
    #             }
    #             database_mysql = db_services.get_mysql_connection(mysql_database_url)
    #             logging.info("Connected to MySQL database")
    #             with database_mysql.cursor(dictionary=True) as cursor:
    #                 cursor.execute(
    #                     f"select customer_id from \
    #                         {config['database_tables']['user_account']}\
    #                               where user_email_id = %s",
    #                     (email,),
    #                 )
    #                 result = cursor.fetchall()
    #                 customer_id = result[0]["customer_id"]
    #                 logging.info(
    #                     "Found customer_id: %s for email: %s", customer_id, email
    #                 )

    #                 for feature_name in feature_names:
    #                     access_mask = access_masks[feature_names.index(feature_name)]
    #                     cursor.execute(
    #                         f"select feature_id from\
    #                               {config['database_tables']['features']} \
    #                                 where featurename = %s and customer_id = %s ",
    #                         (feature_name, customer_id),
    #                     )
    #                     result = cursor.fetchone()
    #                     feature_id = result["feature_id"]
    #                     logging.info(
    #                         "Assigning feature ID: %s with access mask: %s to group ID: %s",
    #                         feature_id,
    #                         access_mask,
    #                         group_id,
    #                     )

    #                     select_query = f"SELECT * FROM\
    #                           {config['database_tables']['group_accessrights']} \
    #                             WHERE group_id = %s AND feature_id = %s"
    #                     cursor.execute(select_query, (group_id, feature_id))
    #                     existing_entry = cursor.fetchone()

    #                     if existing_entry:

    #                         update_query = f"UPDATE\
    #                               {config['database_tables']['group_accessrights']}\
    #                                   SET created_at = %s, accessmask = %s WHERE group_id = %s \
    #                                     AND feature_id = %s"
    #                         cursor.execute(
    #                             update_query, (date, access_mask, group_id, feature_id)
    #                         )
    #                         logging.info(
    #                             "Updated existing entry for feature ID: %s and group ID: %s",
    #                             feature_id,
    #                             group_id,
    #                         )
    #                     else:

    #                         insert_query = f"INSERT INTO\
    #                               {config['database_tables']['group_accessrights']}\
    #                                   (group_id, feature_id, created_at, accessmask) \
    #                                     VALUES (%s, %s, %s, %s)"
    #                         cursor.execute(
    #                             insert_query, (group_id, feature_id, date, access_mask)
    #                         )
    #                         logging.info(
    #                             "Inserted new entry for feature ID: %s and group ID: %s",
    #                             feature_id,
    #                             group_id,
    #                         )

    #             database_mysql.commit()
    #             database_mysql.close()
    #             logging.info("Database connection closed")

    #             return JSONResponse(
    #                 status_code=status.HTTP_200_OK,
    #                 content="Features Updated Successfully!",
    #             )

    #     except Exception as unexpected_exception:
    #         logging.error("Unexpected error: %s", unexpected_exception)
    #         return JSONResponse(
    #             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    #             content="Internal server error: {}".format(unexpected_exception),
    #         )

    async def assignFeatures(self, details: dict):
        cursor_logger = LOGGINGS.CustomLogger()
        logging = cursor_logger.setup_logger()
        logging.info("Received request to assign features: %s", details)

        try:
            database_type = details.get("database_type")
            feature_names = details.get("feature_names")
            group_id = details.get("group_id")
            access_masks = details.get("access_masks")
            date = datetime.now()
            email = details.get("email")
            try:
                    
                if database_type == "mysql":
                    database_url = self.mysql_database_url
                    database_service = MySQLServices(**database_url)
                    database_conn = database_service.connect()
                    cursor = database_conn.cursor(dictionary=True)
                    logging.info("Using MySQL database service.")
                elif database_type == "oracle":
                    database_url = self.oracle_database_url
                    database_service = OracleServices(**database_url)
                    database_service.connect()
                    logging.info("Using Oracle database service.")
                elif database_type == "postgres":
                    database_url = self.postgres_database_url
                    database_service = PostgreSQLServices(**database_url)
                    database_conn = database_service.connect()
                    cursor = database_conn.cursor(cursor_factory=RealDictCursor)
                    logging.info("Using Postgres database service.")
                else:
                    logging.error(f"Unsupported database type: {database_type}")
                    return{
                        "StatusCode":int(config['codes']['incorrect parameters']),
                        "Error":f"Unsupported database type: {database_type}"
                    }
                    # return JSONResponse(
                    #     status_code=status.HTTP_400_BAD_REQUEST,
                    #     content=f"Unsupported database type: {database_type}",
                    # )
            except Exception as e:
                logging.error(f"Error connecting to database: {e}")
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Database connection error: {e}",
                }

            # mysql_database_url = {
            #     "host": config["mysql"]["mysql_host"],
            #     "port": config["mysql"]["mysql_port"],
            #     "username": config["mysql"]["mysql_username"],
            #     "password": config["mysql"]["mysql_password"],
            #     "schema": config["mysql"]["mysql_new_schema"],
            # }
            # database_mysql = db_services.get_mysql_connection(mysql_database_url)
            # with database_mysql.cursor(dictionary=True) as cursor:
            try:
                    
                cursor.execute(
                    f"select customer_id from \
                        {config['database_tables']['user_account']}\
                                where user_email_id = %s",
                    (email,),
                )
                result = cursor.fetchall()
            except Exception as e: 
                logging.error(f"Error fetching customer ID: {e}")
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Fetch error: {e}",
                }
            customer_id = result[0]["customer_id"]
            logging.info(
                "Found customer_id: %s for email: %s", customer_id, email
            )

            for feature_name in feature_names:
                access_mask = access_masks[feature_names.index(feature_name)]
                try:
                        
                    cursor.execute(
                        f"select feature_id from\
                                {config['database_tables']['features']} \
                                where featurename = %s and customer_id = %s ",
                        (feature_name, customer_id),
                    )
                    result = cursor.fetchone()
                    # print(result)
                    feature_id = result["feature_id"]
                    logging.info(
                        "Assigning feature ID: %s with access mask: %s to group ID: %s",
                        feature_id,
                        access_mask,
                        group_id,
                    )

                    select_query = f"SELECT * FROM\
                            {config['database_tables']['group_accessrights']} \
                            WHERE group_id = %s AND feature_id = %s"
                    cursor.execute(select_query, (group_id, feature_id))
                    existing_entry = cursor.fetchone()
                except Exception as e:
                    logging.error(f"Error fetching feature ID: {e}")
                    return{
                        "StatusCode":int(config['codes']['database error']),
                        "Error":f"Fetch error: {e}",
                    }

                if existing_entry:
                    try:
                            
                        update_query = f"UPDATE\
                                {config['database_tables']['group_accessrights']}\
                                    SET created_at = %s, accessmask = %s WHERE group_id = %s \
                                    AND feature_id = %s"
                        cursor.execute(
                            update_query, (date, access_mask, group_id, feature_id)
                        )
                    except Exception as e:
                        logging.error(f"Error updating existing entry: {e}")
                        return{
                            "StatusCode":int(config['codes']['database error']),
                            "Error":f"Update error: {e}",
                        }
                    logging.info(
                        "Updated existing entry for feature ID: %s and group ID: %s",
                        feature_id,
                        group_id,
                    )
                else:
                    try:
                            
                        insert_query = f"INSERT INTO\
                                {config['database_tables']['group_accessrights']}\
                                    (group_id, feature_id, created_at, accessmask) \
                                    VALUES (%s, %s, %s, %s)"
                        cursor.execute(
                            insert_query, (group_id, feature_id, date, access_mask)
                        )
                    except Exception as e:
                        logging.error(f"Error inserting new entry: {e}")
                        return{
                            "StatusCode":int(config['codes']['database error']),
                            "Error":f"Insert error: {e}",
                        }
                    logging.info(
                        "Inserted new entry for feature ID: %s and group ID: %s",
                        feature_id,
                        group_id,
                    )

            database_conn.commit()
            logging.info("Database connection closed")

            return{
                "StatusCode":int(config['codes']['success']),
                "data":"Features Updated Successfully!"
            }
        except Exception as unexpected_exception:
            logging.error("Unexpected error: %s", unexpected_exception)
            return{
                "StatusCode":int(config['codes']['internal error']),
                "Error":f"Internal server error: {unexpected_exception}"
            }
        finally:
            database_service.close_connection()
            logging.info(f"Closed {details['database_type']} database connection")

    # async def accessmask(self, details: dict):
    #     """
    #     Retrieves access mask details for a given group ID from the MySQL database.
    #     It checks if the group ID exists in the user group mapping and fetches 
    #     feature access details from the respective database table.
    #     """
    #     cursor_logger = LOGGINGS.CustomLogger()
    #     logging = cursor_logger.setup_logger()
    #     logging.info("Received request to assign features: %s", details)

    #     try:
    #         group_id = details.get("group_id")

    #         mysql_database_url = {
    #             "host": config["mysql"]["mysql_host"],
    #             "port": config["mysql"]["mysql_port"],
    #             "username": config["mysql"]["mysql_username"],
    #             "password": config["mysql"]["mysql_password"],
    #             "schema": config["mysql"]["mysql_new_schema"],
    #         }
    #         database_mysql = db_services.get_mysql_connection(mysql_database_url)
    #         logging.info("Connected to MySQL database")
    #         with database_mysql.cursor(dictionary=True) as cursor:
    #             cursor.execute("select distinct group_id from user_group_map")
    #             res = cursor.fetchall()
    #             group_ids = [i["group_id"] for i in res]
    #             if group_id in group_ids:
    #                 cursor.execute(
    #                     f"select featurename, accessmask from\
    #                           {config['database_tables']['view_user_access_group']} \
    #                             where group_id=%s and accessmask != 'null'",
    #                     (group_id,),
    #                 )
    #                 result = cursor.fetchall()
    #             else:
    #                 cursor.execute(
    #                     f"SELECT featurename, accessmask FROM \
    #                         {config['database_tables']['group_accessrights']} join\
    #                               {config['database_tables']['features']} on \
    #                                 {config['database_tables']['group_accessrights']}.feature_id \
    #                                     = {config['database_tables']['features']}.feature_id where\
    #                                           group_id=%s and accessmask != 'null'",
    #                     (group_id,),
    #                 )
    #                 result = cursor.fetchall()
    #             logging.info("Query executed successfully")
    #         database_mysql.close()
    #         logging.info("Database connection closed")

    #         return JSONResponse(status_code=status.HTTP_200_OK, content=result)

    #     except Exception as unexpected_exception:
    #         logging.error("Unexpected error: %s", unexpected_exception)

    #         return JSONResponse(
    #             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    #             content="Internal server error: {}".format(unexpected_exception),
    #         )

    async def accessmask(self, details: dict):
        cursor_logger = LOGGINGS.CustomLogger()
        logging = cursor_logger.setup_logger()
        logging.info("Received request to assign features: %s", details)

        try:            
            database_type = details['database_type']
            try:                    
                if database_type == "mysql":
                    database_url = self.mysql_database_url
                    database_service = MySQLServices(**database_url)
                    cursor = database_service.connect().cursor(dictionary=True)
                    logging.info("Using MySQL database service.")
                elif database_type == "oracle":
                    database_url = self.oracle_database_url
                    database_service = OracleServices(**database_url)
                    database_service.connect()
                    logging.info("Using Oracle database service.")
                elif database_type == "postgres":
                    database_url = self.postgres_database_url
                    database_service = PostgreSQLServices(**database_url)
                    cursor = database_service.connect().cursor(cursor_factory=RealDictCursor)
                    logging.info("Using Postgres database service.")
                else:
                    logging.error(f"Unsupported database type: {database_type}")
                    return{
                        "StatusCode":int(config['codes']['incorrect parameters']),
                        "Error":f"Unsupported database type: {database_type}"
                    }
            except Exception as e:
                logging.error(f"Error connecting to database: {e}")
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Database connection error: {e}",
                }

            group_id = details.get("group_id")
            # database_mysql = db_services.get_mysql_connection(mysql_database_url)
            logging.info(f"Connected to {details['database_type']} database")
            # with database_mysql.cursor(dictionary=True) as cursor:
            try:                    
                cursor.execute("select distinct group_id from user_group_map")
                res = cursor.fetchall()
            except Exception as e:
                logging.error(f"Error fetching group IDs: {e}")
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Fetch error: {e}",
                }
            group_ids = [i["group_id"] for i in res]
            if group_id in group_ids:
                try:   
                    cursor.execute(
                        f"select featurename, accessmask from\
                                {config['database_tables']['view_user_access_group']} \
                                where group_id=%s and accessmask != 'null'",
                        (group_id,),
                    )
                    result = cursor.fetchall()
                except Exception as e:
                    logging.error(f"Error fetching access mask: {e}")
                    return{
                        "StatusCode":int(config['codes']['database error']),
                        "Error":f"Fetch error: {e}",
                    }
            else:
                try:
                        
                    cursor.execute(
                        f"SELECT featurename, accessmask FROM \
                            {config['database_tables']['group_accessrights']} join\
                                    {config['database_tables']['features']} on \
                                    {config['database_tables']['group_accessrights']}.feature_id \
                                        = {config['database_tables']['features']}.feature_id where\
                                                group_id=%s and accessmask != 'null'",
                        (group_id,),
                    )
                    result = cursor.fetchall()
                except Exception as e:
                    logging.error(f"Error fetching access mask: {e}")
                    return{
                        "StatusCode":int(config['codes']['database error']),
                        "Error":f"Fetch error: {e}",
                    }
            logging.info("Query executed: %s", result)
            database_service.close_connection()
            logging.info("Database connection closed")
            return{
                "StatusCode":int(config['codes']['success']),
                "data":result
            }

        except Exception as unexpected_exception:
            logging.error("Unexpected error: %s", unexpected_exception)
            return{
                "StatusCode":int(config['codes']['internal error']),
                "Error":f"Internal server error: {unexpected_exception}"
            }
        finally:
            database_service.close_connection()
            logging.info(f"Closed {details['database_type']} database connection")

    # async def gettags(self, details: dict):
    #     """
    #     Retrieves database column names based on the provided details and connection type.

    #     This function establishes a connection with a MySQL database to fetch connection 
    #     details for a secondary database (MySQL or PostgreSQL). It then executes a given 
    #     query on the secondary database and retrieves the column names from the result set. 
    #     The function handles two cases: 
    #     1. Direct query execution for a master report.
    #     2. Query execution based on a predefined report template.
    #     """
    #     cursor_logger = LOGGINGS.CustomLogger()
    #     logging = cursor_logger.setup_logger()
    #     logging.info("Received request to assign features: %s", details)
    #     try:
    #         customer_id = details.get("customer_id")
    #         connection_type = details.get("connection_type")
    #         schema_name = details.get("schema")
    #         mysql_database_url = {
    #             "host": config["mysql"]["mysql_host"],
    #             "port": config["mysql"]["mysql_port"],
    #             "username": config["mysql"]["mysql_username"],
    #             "password": config["mysql"]["mysql_password"],
    #             "schema": config["mysql"]["mysql_new_schema"],
    #         }
    #         database_mysql = db_services.get_mysql_connection(mysql_database_url)
    #         logging.info("Connected to MySQL database")
    #         for_master_report = details.get("for_master_report")
    #         if for_master_report == "yes":
    #             query = details.get("query")
    #             with database_mysql.cursor(dictionary=True) as cursor:
    #                 cursor.execute(
    #                     f"select rdbms_name,domain_name,db_port,db_user_name,\
    #                         db_password,db_schema_name from \
    #                             {config['database_tables']['database_details']} \
    #                                 where customer_id = %s and db_schema_name = %s and\
    #                                       rdbms_name = %s",
    #                     (customer_id, schema_name, connection_type),
    #                 )
                    
    #                 result = cursor.fetchall()
    #                 secondary_host = result[0]["domain_name"]
    #                 secondary_port = result[0]["db_port"]
    #                 secondary_username = result[0]["db_user_name"]
    #                 secondary_password = result[0]["db_password"]
    #                 schema_name = result[0]["db_schema_name"]
    #                 connection_type = result[0]["rdbms_name"]
    #                 secondary_database_url = {
    #                     "host": secondary_host,
    #                     "port": secondary_port,
    #                     "username": secondary_username,
    #                     "password": secondary_password,
    #                     "schema": schema_name,
    #                 }
    #                 logging.info("Secondary database connection details retrieved")
    #                 if connection_type == "mysql":
    #                     secondary_database = db_services.get_mysql_connection(
    #                         secondary_database_url
    #                     )
    #                     with secondary_database.cursor(dictionary=True) as cursor:
    #                         cursor.execute(query)
    #                         result = cursor.description
    #                         column_names = [column[0] for column in result]
    #                         logging.info(
    #                             "Query executed on secondary MySQL database: %s",
    #                             column_names,
    #                         )
    #                         secondary_database.close()
    #                 elif connection_type == "postgres":
    #                     secondary_database = db_services.get_postgres_connection(
    #                         secondary_database_url
    #                     )
    #                     with secondary_database.cursor() as cursor:
    #                         cursor.execute(query)
    #                         result = cursor.description
    #                         column_names = [column.name for column in result]
    #                         logging.info(
    #                             "Query executed on secondary Postgres database: %s",
    #                             column_names,
    #                         )
    #                         secondary_database.close()

    #             filtered_columns = [column_names[0], column_names[1]]
    #         elif for_master_report == "no":
    #             report_title = details.get("report_title")
    #             with database_mysql.cursor(dictionary=True) as cursor:
    #                 cursor.execute(
    #                     f"select defined_query,db_details_id from\
    #                           {config['database_tables']['report_template']} \
    #                             where report_template_name = %s and customer_id = %s",
    #                     (report_title, customer_id),
    #                 )
    #                 result = cursor.fetchone()
    #                 query = result["defined_query"]
    #                 db_details_id = result["db_details_id"]
    #                 cursor.execute(
    #                     f"select rdbms_name,domain_name,db_port,db_user_name,db_password,\
    #                         db_schema_name from {config['database_tables']['database_details']}\
    #                               where customer_id = %s and db_details_id = %s",
    #                     (customer_id, db_details_id),
    #                 )
    #                 result = cursor.fetchall()
    #                 secondary_host = result[0]["domain_name"]
    #                 secondary_port = result[0]["db_port"]
    #                 secondary_username = result[0]["db_user_name"]
    #                 secondary_password = result[0]["db_password"]
    #                 schema_name = result[0]["db_schema_name"]
    #                 connection_type = result[0]["rdbms_name"]
    #                 secondary_database_url = {
    #                     "host": secondary_host,
    #                     "port": secondary_port,
    #                     "username": secondary_username,
    #                     "password": secondary_password,
    #                     "schema": schema_name,
    #                 }
    #                 logging.info("Secondary database connection details retrieved")
    #                 if connection_type == "mysql":
    #                     secondary_database = db_services.get_mysql_connection(
    #                         secondary_database_url
    #                     )
    #                     with secondary_database.cursor(dictionary=True) as cursor:
    #                         cursor.execute(query)
    #                         result = cursor.description
    #                         column_names = [column[0] for column in result]
    #                         logging.info(
    #                             "Query executed on secondary MySQL database: %s",
    #                             column_names,
    #                         )
    #                         secondary_database.close()
    #                 elif connection_type == "postgres":
    #                     secondary_database = db_services.get_postgres_connection(
    #                         secondary_database_url
    #                     )
    #                     with secondary_database.cursor() as cursor:
    #                         cursor.execute(query)
    #                         result = cursor.description
    #                         column_names = [column.name for column in result]
    #                         logging.info(
    #                             "Query executed on secondary Postgres database: %s",
    #                             column_names,
    #                         )
    #                         secondary_database.close()
    #             filtered_columns = column_names
    #             logging.info(
    #                 "Filtered columns for report title '%s': %s",
    #                 report_title,
    #                 filtered_columns,
    #             )

    #         database_mysql.close()
    #         logging.info("Database connection closed")

    #         return JSONResponse(
    #             status_code=status.HTTP_200_OK, content=filtered_columns
    #         )

    #     except Exception as unexpected_exception:
    #         logging.error("Unexpected error: %s", unexpected_exception)
    #         return JSONResponse(
    #             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    #             content="Internal server error: {}".format(unexpected_exception),
    #         )

    async def gettags(self, details: dict):
        cursor_logger = LOGGINGS.CustomLogger()
        logging = cursor_logger.setup_logger()
        logging.info("Received request to assign features: %s", details)
        try:
            customer_id = details.get("customer_id")
            schema_name = details.get("schema")
            database_type = details.get("database_type")
            connection_type = details.get("connection_type")
            report_title = details.get("report_title")
            try:
                    
                if database_type == "mysql":
                    database_url = self.mysql_database_url
                    database_service = MySQLServices(**database_url)
                    cursor = database_service.connect().cursor(dictionary=True)
                    logging.info("Using MySQL database service.")
                elif database_type == "oracle":
                    database_url = self.oracle_database_url
                    database_service = OracleServices(**database_url)
                    database_service.connect()
                    logging.info("Using Oracle database service.")
                elif database_type == "postgres":
                    database_url = self.postgres_database_url
                    database_service = PostgreSQLServices(**database_url)
                    cursor = database_service.connect().cursor(cursor_factory=RealDictCursor)
            except Exception as e:
                logging.error(f"Error connecting to database: {e}")
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Database connection error: {e}",
                }

            # mysql_database_url = {
            #     "host": config["mysql"]["mysql_host"],
            #     "port": config["mysql"]["mysql_port"],
            #     "username": config["mysql"]["mysql_username"],
            #     "password": config["mysql"]["mysql_password"],
            #     "schema": config["mysql"]["mysql_new_schema"],
            # # }
            # database_mysql = db_services.get_mysql_connection(mysql_database_url)
            # logging.info("Connected to MySQL database")
            for_master_report = details.get("for_master_report")
            if for_master_report == "yes":
                query = details.get("query")
                # with database_mysql.cursor(dictionary=True) as cursor:
                # cursor.execute(
                #     f"select rdbms_name,domain_name,db_port,db_user_name,\
                #         db_password,db_schema_name from \
                #             {config['database_tables']['database_details']} \
                #                 where customer_id = %s and db_schema_name = %s and\
                #                       rdbms_name = %s",
                #     (customer_id, schema_name, connection_type),
                # )
                try:
                        
                    columns = ["rdbms_name", "domain_name", "db_port", "db_user_name", "db_password", "db_schema_name"]
                    result = database_service.read_records(
                        table=config['database_tables']['database_details'],
                        columns=columns,
                        where_conditions={"customer_id": customer_id, "db_schema_name": schema_name, "rdbms_name": connection_type}
                    )
                except Exception as e:
                    logging.error(f"Error fetching database details: {e}")
                    return{
                        "StatusCode":int(config['codes']['database error']),
                        "Error":f"Fetch error: {e}",
                    }
                # result = cursor.fetchall()
                secondary_host = result[0]["domain_name"]
                secondary_port = result[0]["db_port"]
                secondary_username = result[0]["db_user_name"]
                secondary_password = result[0]["db_password"]
                schema_name = result[0]["db_schema_name"]
                connection_type = result[0]["rdbms_name"]
                secondary_database_url = {
                    "host": secondary_host,
                    "port": secondary_port,
                    "username": secondary_username,
                    "password": secondary_password,
                    "database": schema_name,
                }
                logging.info("Secondary database connection details retrieved")
                # if connection_type == "mysql":
                #     secondary_database = db_services.get_mysql_connection(
                #         secondary_database_url
                #     )
                #     with secondary_database.cursor(dictionary=True) as cursor:
                #         cursor.execute(query)
                #         result = cursor.description
                #         column_names = [column[0] for column in result]
                #         logging.info(
                #             "Query executed on secondary MySQL database: %s",
                #             column_names,
                #         )
                #         secondary_database.close()
                # elif connection_type == "postgres":
                #     secondary_database = db_services.get_postgres_connection(
                #         secondary_database_url
                #     )
                #     with secondary_database.cursor() as cursor:
                #         cursor.execute(query)
                #         result = cursor.description
                #         column_names = [column.name for column in result]
                #         logging.info(
                #             "Query executed on secondary Postgres database: %s",
                #             column_names,
                #         )
                #         secondary_database.close()
                try:
                    if connection_type == "mysql":
                        secondary_database_service = MySQLServices(**secondary_database_url)
                        cursor = secondary_database_service.connect().cursor(dictionary=True)
                        cursor.execute(query)
                        column_names = [column[0] for column in cursor.description]
                        # cursor.close()
                        
                    elif connection_type == "postgres":
                        secondary_database_service = PostgreSQLServices(**secondary_database_url)
                        cursor = secondary_database_service.connect().cursor(cursor_factory=RealDictCursor)
                        cursor.execute(query)
                        column_names = [column.name for column in cursor.description]
                        # cursor.close()

                    logging.info(f"Query executed on {connection_type} database.")

                except Exception as e:
                    logging.error(f"Failed to fetch column names: {e}")
                    return{
                        "StatusCode":int(config['codes']['database error']),
                        "Error":f"Fetch error: {e}"
                    }
                finally:
                    secondary_database_service.close_connection()
                filtered_columns = [column_names[0], column_names[1]]
            elif for_master_report == "no":
                report_title = details.get("report_title")
                # with database_mysql.cursor(dictionary=True) as cursor:
                #     # cursor.execute(
                #     #     f"select defined_query,db_details_id from\
                #     #           {config['database_tables']['report_template']} \
                #     #             where report_template_name = %s and customer_id = %s",
                #     #     (report_title, customer_id),
                #     # )
                try:
                        
                    columns = ["defined_query", "db_details_id"]
                    result = database_service.read_records(
                        table=config['database_tables']['report_template'],
                        columns=columns,
                        where_conditions={"report_template_name": report_title, "customer_id": customer_id}
                    )
                except Exception as e:
                    logging.error(f"Error fetching report template: {e}")
                    return{
                        "StatusCode":int(config['codes']['database error']),
                        "Error":f"Fetch error: {e}",
                    }

                #     # result = cursor.fetchone()
                query = result[0]["defined_query"]
                db_details_id = result[0]["db_details_id"]
                #     # cursor.execute(
                #     #     f"select rdbms_name,domain_name,db_port,db_user_name,db_password,\
                #     #         db_schema_name from {config['database_tables']['database_details']}\
                #     #               where customer_id = %s and db_details_id = %s",
                #     #     (customer_id, db_details_id),
                #     # )
                try:
                        
                    columns = ["rdbms_name", "domain_name", "db_port", "db_user_name", "db_password", "db_schema_name"]
                    result = database_service.read_records(
                        table=config['database_tables']['database_details'],
                        columns=columns,
                        where_conditions={"customer_id": customer_id, "db_details_id": db_details_id}
                    )
                except Exception as e:
                    logging.error(f"Error fetching database details: {e}")
                    return{
                        "StatusCode":int(config['codes']['database error']),
                        "Error":f"Fetch error: {e}",
                    }
                # result = cursor.fetchall()
                secondary_host = result[0]["domain_name"]
                secondary_port = result[0]["db_port"]
                secondary_username = result[0]["db_user_name"]
                secondary_password = result[0]["db_password"]
                schema_name = result[0]["db_schema_name"]
                connection_type = result[0]["rdbms_name"]
                secondary_database_url = {
                    "host": secondary_host,
                    "port": secondary_port,
                    "username": secondary_username,
                    "password": secondary_password,
                    "database": schema_name,
                }
                logging.info("Secondary database connection details retrieved")


                # if connection_type == "mysql":
                #     secondary_database = db_services.get_mysql_connection(
                #         secondary_database_url
                #     )
                #     with secondary_database.cursor(dictionary=True) as cursor:
                #         cursor.execute(query)
                #         result = cursor.description
                #         column_names = [column[0] for column in result]
                #         logging.info(
                #             "Query executed on secondary MySQL database: %s",
                #             column_names,
                #         )
                #         secondary_database.close()
                # elif connection_type == "postgres":
                #     secondary_database = db_services.get_postgres_connection(
                #         secondary_database_url
                #     )
                #     with secondary_database.cursor() as cursor:
                #         cursor.execute(query)
                #         result = cursor.description
                #         column_names = [column.name for column in result]
                #         logging.info(
                #             "Query executed on secondary Postgres database: %s",
                #             column_names,
                #         )
                #         secondary_database.close()
                try:
                    if connection_type == "mysql":
                        secondary_database_service = MySQLServices(**secondary_database_url)
                        cursor = secondary_database_service.connect().cursor(dictionary=True)
                        cursor.execute(query)
                        column_names = [column[0] for column in cursor.description]
                        cursor.close()
                        
                    elif connection_type == "postgres":
                        secondary_database_service = PostgreSQLServices(**secondary_database_url)
                        cursor = secondary_database_service.connect().cursor(cursor_factory=RealDictCursor)
                        cursor.execute(query)
                        column_names = [column.name for column in cursor.description]
                        cursor.close()

                    logging.info(f"Query executed on {connection_type} database.")

                except Exception as e:
                    logging.error(f"Failed to fetch column names: {e}")
                    return{
                        "StatusCode":int(config['codes']['database error']),
                        "Error":f"Fetch error: {e}"
                    }
                finally:
                    secondary_database_service.close_connection()
            filtered_columns = column_names
            logging.info(
                "Filtered columns for report title '%s': %s",
                report_title,
                filtered_columns,
            )

            # database_mysql.close()
            logging.info("Database connection closed")
            return{
                "StatusCode":int(config['codes']['success']),
                "data":filtered_columns
            }

        except Exception as unexpected_exception:
            logging.error("Unexpected error: %s", unexpected_exception)
            return{
                "StatusCode":int(config['codes']['internal error']),
                "Error":f"Internal server error: {unexpected_exception}"
            }
        finally:
            database_service.close_connection()
            logging.info(f"Closed {details['database_type']} database connection")

    async def check(self, details: dict):
        """
        Processes a request to determine drilldown feasibility based on the provided query details.
        Evaluates the chart type and checks if the query contains a 'GROUP BY' clause with up to two columns.
        """
        cursor_logger = LOGGINGS.CustomLogger()
        logging = cursor_logger.setup_logger()
        logging.info("Received request to assign features: %s", details)
        try:
            query = details.get("query")
            chart_type = details.get("type")
            db_type = details.get("database_type")
            schema_name = details.get("schema_name")
            customer_id = details.get("customer_id")
            logging.info("Processing query for chart type: %s", chart_type)

            if chart_type.lower() == "box":
                response = {"drilldown": "yes", "column_mapping": 1}
                logging.info(
                    "Box chart type detected. Drilldown response: %s", response
                )
            elif "group by" in query or "GROUP BY" in query:
                res = db_services.count_group_by_columns(
                    query, db_type, schema_name, customer_id
                )
                if res != 0:
                    count_of_group_by_columns = int(res["length"])
                    if count_of_group_by_columns < 3:
                        response = {
                            "drilldown": "yes",
                            "column_mapping": count_of_group_by_columns,
                        }
                        logging.info(
                            "Valid group by query with count: %d. Drilldown response: %s",
                            count_of_group_by_columns,
                            response,
                        )
                    else:
                        response = {
                            "drilldown": "no",
                            "message": "Invalid Query for DrillDown : Count of \
                                columns in 'GROUP BY' clause should not be more \
                                    than 2 for drilldown.",
                        }
                        logging.warning(
                            "Invalid group by query. Drilldown response: %s", response
                        )
                else:
                    response = {"drilldown": "no", "message": "Invalid Query"}
                    logging.warning(
                        "Invalid query detected. Drilldown response: %s", response
                    )
            else:
                response = {
                    "drilldown": "no",
                    "message": "Invalid Query for DrillDown : 'GROUP BY' clause \
                        having upto 2 columns is required for drilldown.",
                }
                logging.warning(
                    "No group by clause. Drilldown response: %s", response
                )
            # return response
            return{
                "StatusCode":int(config['codes']['success']),
                "data":response
            }
            # return JSONResponse(status_code=status.HTTP_200_OK, content=response)

        except Exception as unexpected_exception:
            logging.error("Unexpected error: %s", unexpected_exception)
            return{
                "StatusCode":int(config['codes']['internal error']),
                "Error":f"Internal server error: {unexpected_exception}"
            }
        

    # async def save_drill(self, details: dict):
    #     """
    #     Saves drill-down report details into the MySQL database if the combination 
    #     of master report, drilldown report, master column, drilldown column, and 
    #     customer ID does not already exist. If the combination exists, it returns 
    #     a response indicating duplication.
    #     """
    #     cursor_logger = LOGGINGS.CustomLogger()
    #     logging = cursor_logger.setup_logger()
    #     logging.info("Received request to assign features: %s", details)
    #     try:
    #         customer_id = details.get("customer_id")
    #         master_report = details.get("master_report")
    #         drilldown_report = details.get("drilldown_report")
    #         master_column = str(details.get("Master_Column"))
    #         drilldown_column = str(details.get("DrillDown_Column"))
    #         logging.info(
    #             "Saving drill down report for master report: %s and drilldown report: %s",
    #             master_report,
    #             drilldown_report,
    #         )

    #         mysql_database_url = {
    #             "host": config["mysql"]["mysql_host"],
    #             "port": config["mysql"]["mysql_port"],
    #             "username": config["mysql"]["mysql_username"],
    #             "password": config["mysql"]["mysql_password"],
    #             "schema": config["mysql"]["mysql_new_schema"],
    #         }
    #         database_mysql = db_services.get_mysql_connection(mysql_database_url)
    #         logging.info("Connected to MySQL database")
    #         with database_mysql.cursor(dictionary=True) as cursor:

    #             cursor.execute(
    #                 f"SELECT COUNT(*) as count FROM \
    #                     {config['database_tables']['detailed_report']} \
    #                         WHERE master_report = %s AND drilldown_report = %s\
    #                               AND master_column = %s AND drilldown_column = %s \
    #                                 AND customer_id = %s",
    #                 (
    #                     master_report,
    #                     drilldown_report,
    #                     master_column,
    #                     drilldown_column,
    #                     customer_id,
    #                 ),
    #             )
    #             result = cursor.fetchone()
    #             logging.info(
    #                 "Checked existing records in detailed_report table: %s", result
    #             )

    #             if result["count"] == 0:
    #                 cursor.execute(
    #                     f"INSERT INTO {config['database_tables']['detailed_report']}\
    #                         (master_report, drilldown_report, master_column,\
    #                               drilldown_column, customer_id) VALUES (%s, %s, %s, %s, %s)",
    #                     (
    #                         master_report,
    #                         drilldown_report,
    #                         master_column,
    #                         drilldown_column,
    #                         customer_id,
    #                     ),
    #                 )
    #                 database_mysql.commit()
    #                 logging.info("Drill down report saved successfully")
    #                 return JSONResponse(
    #                     status_code=status.HTTP_201_CREATED,
    #                     content="Saved successfully",
    #                 )

    #             else:
    #                 logging.info("Combination already exists")
    #                 return JSONResponse(
    #                     status_code=status.HTTP_208_ALREADY_REPORTED,
    #                     content="Combination already exists",
    #                 )

    #     except Exception as unexpected_exception:
    #         logging.error("Unexpected error: %s", unexpected_exception)
    #         raise HTTPException(
    #             status_code=500,
    #             detail="Internal server error: {}".format(unexpected_exception),
    #         )

    #     finally:
    #         if "cursor" in locals() and cursor:
    #             cursor.close()
    #         if "database_mysql" in locals() and database_mysql:
    #             database_mysql.close()
    #         logging.info("Database connection closed")

    async def save_drill(self, details: dict):
        cursor_logger = LOGGINGS.CustomLogger()
        logging = cursor_logger.setup_logger()
        logging.info("Received request to assign features: %s", details)
        try:
            customer_id = details.get("customer_id")
            master_report = details.get("master_report")
            drilldown_report = details.get("drilldown_report")
            master_column = str(details.get("Master_Column"))
            drilldown_column = str(details.get("DrillDown_Column"))
            database_type = details.get("database_type")
            try:
                    
                if database_type == "mysql":
                    database_url = self.mysql_database_url
                    database_service = MySQLServices(**database_url)
                    cursor = database_service.connect().cursor(dictionary=True)
                    logging.info("Using MySQL database service.")
                elif database_type == "oracle":
                    database_url = self.oracle_database_url
                    database_service = OracleServices(**database_url)
                    database_service.connect()
                    logging.info("Using Oracle database service.")
                elif database_type == "postgres":
                    database_url = self.postgres_database_url
                    database_service = PostgreSQLServices(**database_url)
                    cursor = database_service.connect().cursor(cursor_factory=RealDictCursor)
            except Exception as e:
                logging.error(f"Error connecting to database: {e}")
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Database connection error: {e}",
                }
            logging.info(
                "Saving drill down report for master report: %s and drilldown report: %s",
                master_report,
                drilldown_report,
            )

            # with database_mysql.cursor(dictionary=True) as cursor:

            # cursor.execute(
            #     f"SELECT COUNT(*) as count FROM \
            #         {config['database_tables']['detailed_report']} \
            #             WHERE master_report = %s AND drilldown_report = %s\
            #                   AND master_column = %s AND drilldown_column = %s \
            #                     AND customer_id = %s",
            #     (
            #         master_report,
            #         drilldown_report,
            #         master_column,
            #         drilldown_column,
            #         customer_id,
            #     ),
            # )
            try:
                    
                columns = ["COUNT(*) as count"]
                result = database_service.read_records(
                    table=config['database_tables']['detailed_report'],
                    columns=columns,
                    where_conditions={
                        "master_report": master_report,
                        "drilldown_report": drilldown_report,
                        "master_column": master_column,
                        "drilldown_column": drilldown_column,
                        "customer_id": customer_id
                    }
                )
            except Exception as e:
                logging.error(f"Error fetching existing records: {e}")
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Fetch error: {e}"
                }
            result = result[0]
            logging.info(
                "Checked existing records in detailed_report table: %s", result
            )

            if result["count"] == 0:
                # cursor.execute(
                #     f"INSERT INTO {config['database_tables']['detailed_report']}\
                #         (master_report, drilldown_report, master_column,\
                #               drilldown_column, customer_id) VALUES (%s, %s, %s, %s, %s)",
                #     (
                #         master_report,
                #         drilldown_report,
                #         master_column,
                #         drilldown_column,
                #         customer_id,
                #     ),
                # )
                data = {
                    "master_report": master_report,
                    "drilldown_report": drilldown_report,
                    "master_column": master_column,
                    "drilldown_column": drilldown_column,
                    "customer_id": customer_id
                }
                try:
                        
                    database_service.create_record(
                        table=config['database_tables']['detailed_report'],
                        data=data
                    )
                    logging.info("Drill down report saved successfully")
                    return{
                        "StatusCode":int(config['codes']['success']),
                        "data":"Saved successfully"
                    }
                except Exception as e:
                    logging.error(f"Error saving drill down report: {e}")
                    return{
                        "StatusCode":int(config['codes']['database error']),
                        "Error":f"Save error: {e}"
                    }
            else:
                logging.info("Combination already exists")
                return{
                    "StatusCode":int(config['codes']['already exists']),
                    "Error":"Combination already exists"
                }
        except Exception as unexpected_exception:
            logging.error("Unexpected error: %s", unexpected_exception)
            return{
                "StatusCode":int(config['codes']['internal error']),
                "Error":f"Internal server error: {unexpected_exception}"
            }
        finally:
            database_service.close_connection()
            logging.info("Database connection closed")

    async def getdata(self, details: dict):
        """
        Fetches data from the database based on provided details.

        The function connects to a specified database (MySQL, Oracle, or PostgreSQL), retrieves relevant reports, 
        constructs queries, executes them, and returns the processed results in the required format.
        """
        cursor_logger = LOGGINGS.CustomLogger()
        logging = cursor_logger.setup_logger()
        logging.info("Received request with details: %s", details)
        try:
            customer_id = details.get("customer_id")
            master_report = details.get("master_report")
            filter_value = details.get("filter_value")
            selectedSeriesName = details.get("selectedSeriesName")
            database_type = details.get("database_type")
            try:
                    
                if database_type == "mysql":
                    database_url = self.mysql_database_url
                    database_service = MySQLServices(**database_url)
                    cursor = database_service.connect().cursor(dictionary=True)
                    logging.info("Using MySQL database service.")
                elif database_type == "oracle":
                    database_url = self.oracle_database_url
                    database_service = OracleServices(**database_url)
                    database_service.connect()
                    logging.info("Using Oracle database service.")
                elif database_type == "postgres":
                    database_url = self.postgres_database_url
                    database_service = PostgreSQLServices(**database_url)
                    cursor = database_service.connect().cursor(cursor_factory=RealDictCursor)
            except Exception as e:
                logging.error(f"Error connecting to database: {e}")
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Database connection error: {e}",
                }
            logging.info(f"Connected to {details['database_type']} database")

            logging.info(
                "Fetching detailed report for master_report: %s and customer_id: %s",
                master_report,
                customer_id,
            )
            try:
                    
                columns = ["*"]
                result = database_service.read_records(
                    table=config['database_tables']['detailed_report'],
                    columns=columns,
                    where_conditions={"master_report": master_report, "customer_id": customer_id}
                )
            except Exception as e:
                logging.error(f"Error fetching detailed report: {e}")
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Fetch error: {e}",
                }
            result = result[0] if result else None
            if not result:
                logging.warning(
                    "No detailed report found for master_report: %s and customer_id: %s",
                    master_report,
                    customer_id,
                )
                return{
                    "StatusCode":int(config['codes']['no records']),
                    "Error":"Detailed report not found"
                }

            drilldown_report = result["drilldown_report"]
            logging.info("drilldown_column",result["drilldown_column"])
            drilldown_column = ast.literal_eval(result["drilldown_column"])
            logging.info(
                "Fetching report template for drilldown_report: %s and customer_id: %s",
                drilldown_report,
                customer_id,
            )
            try:
                    
                columns = ["*"]
                result = database_service.read_records(
                    table=config['database_tables']['report_template'],
                    columns=columns,
                    where_conditions={"report_template_name": drilldown_report, "customer_id": customer_id}
                )
            except Exception as e:
                logging.error(f"Error fetching report template: {e}")
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Fetch error: {e}",
                }
            if not result:
                logging.warning(
                    "No report template found for drilldown_report: %s and customer_id: %s",
                    drilldown_report,
                    customer_id,
                )
                return{
                    "StatusCode":int(config['codes']['no records']),
                    "Error":"Report template not found"
                }

            report_type = result[0]["report_type"]
            query = result[0]["defined_query"]
            chart_type = result[0]["chart_type"]
            db_details_id = result[0]["db_details_id"]
            # logo_path = result[0]["upload_logo"]
            if database_type == "mysql":
                logo_path = str(result[0]["upload_logo"])
            else:
                logo_path = result[0]["upload_logo"]
                if isinstance(logo_path, memoryview):
                    logo_path = logo_path.tobytes()
            
            backgroung_color = result[0]["background_colour"]
            chart_react_color = result[0]["chart_react_colour"]
            logging.info(
                "Fetching database details for db_details_id: %s", db_details_id
            )

            try:
                    
                columns = ["*"]
                result = database_service.read_records(
                    table=config['database_tables']['database_details'],
                    columns=columns,
                    where_conditions={"db_details_id": db_details_id}
                )
            except Exception as e:
                logging.error(f"Error fetching database details: {e}")
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Fetch error: {e}",
                }
            columns = ["*"]
            if not result:
                logging.warning(
                    "No database details found for db_details_id: %s", db_details_id
                )
                return{
                    "StatusCode":int(config['codes']['no records']),
                    "Error":"Database details not found"
                }

            db_type = result[0]["rdbms_name"]
            if db_type == "mysql":
                if filter_value == "":
                    query = query
                else:
                    if len(drilldown_column) == 1:
                        condition = (
                            f" WHERE `{drilldown_column[0]}` = '{filter_value}'"
                        )
                    elif len(drilldown_column) == 2:
                        condition = f" WHERE `{drilldown_column[0]}` = '{filter_value}'\
                                AND `{drilldown_column[1]}` = '{selectedSeriesName}'"
                    query = f"Select * from ({query}) main" + condition

                logging.info("Executing query: %s", query)
                try:
                        
                    secondary_data = await self.database_chunk_processor.process_chunks(
                        db_type=result[0]["rdbms_name"],
                        query=query,
                        hostname=result[0]["domain_name"],
                        port=result[0]["db_port"],
                        db_name=result[0]["db_schema_name"],
                        db_user=result[0]["db_user_name"],
                        password=result[0]["db_password"],
                        page_size=details["page_size"],
                        page_no=details["page_no"])
                except Exception as e:
                    logging.error(f"Error executing query: {e}")
                    return{
                        "StatusCode":int(config['codes']['internal error']),
                        "Error":f"Query execution error: {e}"
                    }
                if secondary_data == None:
                    logging.info("No Data Found")
                    return{
                        "StatusCode": int(config['codes']['no records']), "message": "No Data Found","data":{}
                    }
                result = secondary_data["data"]
                column_types = secondary_data["column_types"]
                total_records = secondary_data["total_records"]
                if (result==None) or (len(result) == 0):
                    logging.info("No Data Found")
                    return{
                        "StatusCode": int(config['codes']['no records']), "message": "No Data Found","data":{}
                    }                    
                logging.info("Closed connection to secondary MySQL database")
                if len(result[0]) == 3:
                    if report_type.lower() == "chart":
                        # in ['line','bar','column','gause','area','radial']:
                        if chart_type.lower():
                            columns = list(result[0].keys())
                            temp = {}
                            for col in columns:
                                temp[col] = []
                                for i in result:
                                    if i[col] in temp[col]:
                                        continue
                                    else:
                                        temp[col].append(i[col])
                            series = []
                            for item in temp[columns[1]]:
                                ele = {"data": [], "name": item}
                                for element in result:
                                    if element[columns[1]] == item:
                                        ele["data"].append(element[columns[2]])
                                series.append(ele)
                            with open(self.CHART_PATH, "r") as f:
                                data = f.read()
                                json_data = json.loads(data)
                                json_data["series"] = series
                                json_data["title"] = drilldown_report
                                json_data["chart_type"] = chart_type.lower()
                                json_data["report_type"] = report_type.lower()
                                json_data["xAxis"][0]["categories"] = temp[
                                    columns[0]
                                ]
                            database_service.close_connection()
                            logging.info("Returning JSON data for chart")
                            json_data["column_types"] = column_types
                            json_data["len_col"] = int(len(columns))
                            return{
                                "StatusCode": int(config['codes']['success']), "data": json_data
                            }
                            
            elif db_type in ['postgres','vertica']:

                if db_type == 'postgres':
                    if filter_value == "":
                        query = query
                    else:
                        filter_value = filter_value.replace("'","''")
                        selectedSeriesName = selectedSeriesName.replace("'","''")
                        if len(drilldown_column) == 1:
                            condition = f" WHERE \"{drilldown_column[0]}\" = '{filter_value}'"
                        elif len(drilldown_column) == 2:
                            condition = f" WHERE \"{drilldown_column[0]}\" = '{filter_value}'\
                                AND \"{drilldown_column[1]}\" = '{selectedSeriesName}'"
                        query = f"Select * from ({query}) main" + condition

                    logging.info("Executing query: %s", query)
                    try:
                            
                        secondary_data = await self.database_chunk_processor.process_chunks(
                            db_type=result[0]["rdbms_name"],
                            query=query,
                            hostname=result[0]["domain_name"],
                            port=result[0]["db_port"],
                            db_name=result[0]["db_schema_name"],
                            db_user=result[0]["db_user_name"],
                            password=result[0]["db_password"],
                            page_size=details["page_size"],
                            page_no=details["page_no"])
                    except Exception as e:
                        logging.error(f"Error executing query: {e}")
                        return{
                            "StatusCode":int(config['codes']['internal error']),
                            "Error":f"Query execution error: {e}"   
                        }
                    if secondary_data == None:
                        logging.info("No Data Found")
                        return{
                            "StatusCode": int(config['codes']['no records']), "message": "No Data Found","data":{}  
                        }
                        
                    result = secondary_data["data"]
                    column_types = secondary_data["column_types"]
                    total_records = secondary_data["total_records"]
                    logging.info(
                        "Closed connection to secondary PostgreSQL database"
                    )
                elif db_type == 'vertica':
                    if filter_value == '':
                        query = query
                    else:
                        if len(drilldown_column) == 1:
                            condition = f" WHERE \"{drilldown_column[0]}\" = '{filter_value}'"
                        elif len(drilldown_column) == 2:
                            condition = f" WHERE \"{drilldown_column[0]}\" = '{filter_value}' AND \"{drilldown_column[1]}\" = '{selectedSeriesName}'"
                        query = f"Select * from ({query}) main" + condition
                
                    logging.info("Executing query: %s", query)
                    try:
                            
                        secondary_data = await self.database_chunk_processor.process_chunks(
                            db_type=result[0]["rdbms_name"],
                            query=query,
                            hostname=result[0]["domain_name"],
                            port=result[0]["db_port"],
                            db_name=result[0]["db_schema_name"],
                            db_user=result[0]["db_user_name"],
                            password=result[0]["db_password"],
                            page_size=details["page_size"],
                            page_no=details["page_no"])
                    except Exception as e:
                        logging.error(f"Error executing query: {e}")
                        return{
                            "StatusCode":int(config['codes']['internal error']),
                            "Error":f"Query execution error: {e}"
                        }
                    if secondary_data == None:
                        logging.info("No Data Found")
                        return{
                            "StatusCode": int(config['codes']['no records']), "message": "No Data Found","data":{}  
                        }
                        # return {"status":204,"message": "No Data Found","data":{}}
                    result = secondary_data["data"]
                    column_types = secondary_data["column_types"]
                    total_records = secondary_data["total_records"]                            
                logging.info("Closed connection to secondary database")
                if (result==None) or (len(result) == 0):
                    logging.info("No Data Found")
                    return{
                        "StatusCode": int(config['codes']['no records']), "message": "No Data Found","data":{}
                    }
                    # return {"status_code": 404, "message": "No Data Found","data":{}}
                if len(result[0]) == 3:
                    if report_type.lower() == "chart":
                        # in ['line','bar','column','gause','area','radial']:
                        if chart_type.lower():
                            columns = list(result[0].keys())
                            temp = {}
                            for col in columns:
                                temp[col] = []
                                for i in result:
                                    if i[col] in temp[col]:
                                        continue
                                    else:
                                        temp[col].append(i[col])
                                    # names = list(result[''].keys())
                            series = []
                            for item in temp[columns[1]]:
                                ele = {"data": [], "name": item}
                                for element in result:
                                    if element[columns[1]] == item:
                                        ele["data"].append(element[columns[2]])
                                series.append(ele)
                            with open(self.CHART_PATH, "r") as f:
                                data = f.read()
                                json_data = json.loads(data)
                                json_data["series"] = series
                                json_data["title"] = drilldown_report
                                json_data["chart_type"] = chart_type.lower()
                                json_data["report_type"] = report_type.lower()
                                json_data["xAxis"][0]["categories"] = temp[
                                    columns[0]
                                ]
                            logging.info("Returning JSON data for chart")
                            json_data["column_types"] = column_types
                            json_data["len_col"] = int(len(columns))
                            return{
                                "StatusCode": int(config['codes']['success']), "data": json_data
                            }
                            # return json_data
            if report_type.lower() == "chart":
                if chart_type.lower():
                    names = list(result[0].keys())
                    transposed_data = list(zip(*[item.values() for item in result]))
                    series = [
                        {"data": metric_data, "name": name}
                        for name, metric_data in zip(names, transposed_data)
                    ]
                    with open(self.CHART_PATH, "r") as f:
                        data = f.read()
                        json_data = json.loads(data)
                        json_data["series"] = series
                        json_data["title"] = drilldown_report
                        json_data["chart_type"] = chart_type.lower()
                        json_data["xAxis"][0]["categories"] = series[0]["data"]
                    logging.info("Returning JSON data for chart")
                    json_data["column_types"] = column_types
                    json_data["len_col"] = int(len(columns))
                    return{
                        "StatusCode": int(config['codes']['success']), "data": json_data
                    }
                    # return json_data
            elif report_type.lower() == "box":
                report_key = next(iter(result[0]))
                # report_value = result[0][report_key]
                box_value = {
                    "box_value": report_key,
                    "backgroung_color": backgroung_color,
                    "chart_react_color": chart_react_color,
                    "report_type": report_type.lower(),
                    "report_title": drilldown_report,
                    "logo_path": logo_path,
                }
                logging.info("Returning box data")
                return{
                    "StatusCode": int(config['codes']['success']), "data": box_value
                }
                # return box_value
            elif report_type.lower() == "table":
                final_result = {}
                if db_type == "mysql":
                    column_names = list(result[0].keys())
                    final_result["column_names"] = column_names
                    final_result["data"] = result
                    final_result["report_type"] = report_type.lower()
                    final_result["total_records"] = total_records
                    final_result["column_types"] = column_types
                    final_result["drilldown_report"] = drilldown_report
                    logging.info("Returning mysql table data")
                    return{
                        "StatusCode": int(config['codes']['success']), "data": final_result
                    }
                    # return final_result
                elif db_type in ['postgres','vertica']:
                    column_names = list(result[0].keys())
                    final_result["column_names"] = column_names
                    final_result["data"] = result
                    final_result["report_type"] = report_type.lower()
                    final_result["total_records"] = total_records
                    final_result["drilldown_report"] = drilldown_report
                    logging.info("Returning postgres table data")
                    final_result["column_types"] = column_types
                    return{
                        "StatusCode": int(config['codes']['success']), "data": final_result
                    }
                    # return final_result
        except Exception as unexpected_exception:
            logging.error("Unexpected error: %s", unexpected_exception)
            return{
                "StatusCode":int(config['codes']['internal error']),
                "Error":f"Internal server error: {unexpected_exception}"
            }
        finally:
            database_service.close_connection()
            logging.info("Closed database connection")

    # async def save_update_drill(self, details: dict):
    #     """
    #     Saves or updates the drill-down report details in the database.

    #     This function checks whether a record for the given master report and customer ID 
    #     already exists in the `detailed_report` table. If it exists, the drill-down report 
    #     details are updated; otherwise, a new record is inserted.
    #     """
    #     cursor_logger = LOGGINGS.CustomLogger()
    #     logging = cursor_logger.setup_logger()
    #     logging.info("Received request to assign features: %s", details)
    #     try:
    #         customer_id = details.get("customer_id")
    #         master_report = details.get("master_report")
    #         drilldown_report = details.get("drilldown_report")
    #         master_column = str(details.get("Master_Column"))
    #         drilldown_column = str(details.get("DrillDown_Column"))
    #         logging.info(
    #             "Updating drill down report for master report: %s and drilldown report: %s",
    #             master_report,
    #             drilldown_report,
    #         )

    #         mysql_database_url = {
    #             "host": config["mysql"]["mysql_host"],
    #             "port": config["mysql"]["mysql_port"],
    #             "username": config["mysql"]["mysql_username"],
    #             "password": config["mysql"]["mysql_password"],
    #             "schema": config["mysql"]["mysql_new_schema"],
    #         }
    #         database_mysql = db_services.get_mysql_connection(mysql_database_url)
    #         logging.info("Connected to MySQL database")
    #         with database_mysql.cursor(dictionary=True) as cursor:

    #             cursor.execute(
    #                 f"SELECT COUNT(*) as count FROM {config['database_tables']['detailed_report']}\
    #                       WHERE master_report = %s AND customer_id = %s",
    #                 (master_report, customer_id),
    #             )
    #             result = cursor.fetchone()
    #             logging.info(
    #                 "Checked existing records in detailed_report table: %s", result
    #             )

    #             if result["count"] != 0:
    #                 cursor.execute(
    #                     f"UPDATE {config['database_tables']['detailed_report']} SET\
    #                           drilldown_report = %s, master_column = %s, drilldown_column = \
    #                             %s WHERE master_report = %s AND customer_id = %s",
    #                     (
    #                         drilldown_report,
    #                         master_column,
    #                         drilldown_column,
    #                         master_report,
    #                         customer_id,
    #                     ),
    #                 )
    #                 database_mysql.commit()
    #                 logging.info("Drill down report updated successfully")

    #                 return JSONResponse(
    #                     status_code=status.HTTP_201_CREATED,
    #                     content="Saved successfully",
    #                 )

    #             else:
    #                 cursor.execute(
    #                     f"INSERT INTO {config['database_tables']['detailed_report']} \
    #                         (master_report, drilldown_report, master_column, \
    #                             drilldown_column, customer_id) VALUES (%s, %s, %s, %s, %s)",
    #                     (
    #                         master_report,
    #                         drilldown_report,
    #                         master_column,
    #                         drilldown_column,
    #                         customer_id,
    #                     ),
    #                 )
    #                 database_mysql.commit()
    #                 logging.info("Drildown Saved Successfully.")
    #                 return JSONResponse(
    #                     status_code=status.HTTP_201_CREATED,
    #                     content="Drildown Saved Successfully.",
    #                 )

    #     except Exception as unexpected_exception:
    #         logging.error("Unexpected error: %s", unexpected_exception)
    #         raise HTTPException(
    #             status_code=500,
    #             detail="Internal server error: {}".format(unexpected_exception),
    #         )

    #     finally:
    #         if "cursor" in locals() and cursor:
    #             cursor.close()
    #         if "database_mysql" in locals() and database_mysql:
    #             database_mysql.close()
    #         logging.info("Database connection closed")

    async def save_update_drill(self, details: dict):
        cursor_logger = LOGGINGS.CustomLogger()
        logging = cursor_logger.setup_logger()
        logging.info("Received request to assign features: %s", details)
        try:
            customer_id = details.get("customer_id")
            master_report = details.get("master_report")
            drilldown_report = details.get("drilldown_report")
            master_column = str(details.get("Master_Column"))
            drilldown_column = str(details.get("DrillDown_Column"))
            database_type = details.get("database_type")
            try:
                    
                if database_type == "mysql":
                    database_url = self.mysql_database_url
                    database_service = MySQLServices(**database_url)
                    cursor = database_service.connect().cursor(dictionary=True)
                    logging.info("Using MySQL database service.")
                elif database_type == "oracle":
                    database_url = self.oracle_database_url
                    database_service = OracleServices(**database_url)
                    database_service.connect()
                    logging.info("Using Oracle database service.")
                elif database_type == "postgres":
                    database_url = self.postgres_database_url
                    database_service = PostgreSQLServices(**database_url)
                    cursor = database_service.connect().cursor(cursor_factory=RealDictCursor)
            except Exception as e:
                logging.error(f"Error connecting to database: {e}")
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Database connection error: {e}",
                }

            logging.info(
                "Updating drill down report for master report: %s and drilldown report: %s",
                master_report,
                drilldown_report,
            )

        # with database_mysql.cursor(dictionary=True) as cursor:

            # cursor.execute(
            #     f"SELECT COUNT(*) as count FROM {config['database_tables']['detailed_report']}\
            #           WHERE master_report = %s AND customer_id = %s",
            #     (master_report, customer_id),
            # )
            try:
                    
                columns = ["COUNT(*) as count"]
                result = database_service.read_records(
                    table=config['database_tables']['detailed_report'],
                    columns=columns,
                    where_conditions={"master_report": master_report, "customer_id": customer_id}
                )
            except Exception as e:
                logging.error(f"Error fetching existing records: {e}")
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Fetch error: {e}",
                }
            result = result[0]
            logging.info(
                "Checked existing records in detailed_report table: %s", result
            )

            if result["count"] != 0:
                # cursor.execute(
                #     f"UPDATE {config['database_tables']['detailed_report']} SET\
                #           drilldown_report = %s, master_column = %s, drilldown_column = \
                #             %s WHERE master_report = %s AND customer_id = %s",
                #     (
                #         drilldown_report,
                #         master_column,
                #         drilldown_column,
                #         master_report,
                #         customer_id,
                #     ),
                # )
                try:
                        
                    database_service.update_record(
                        table=config['database_tables']['detailed_report'],
                        data={
                            "drilldown_report": drilldown_report,
                            "master_column": master_column,
                            "drilldown_column": drilldown_column
                        },
                        where_conditions={"master_report": master_report, "customer_id": customer_id}
                    )
                except Exception as e:
                    logging.error(f"Error updating drill down report: {e}")
                    return{
                        "StatusCode":int(config['codes']['database error']),
                        "Error":f"Update error: {e}"
                    }
                # database_mysql.commit()
                logging.info("Drill down report updated successfully")
                return{
                    "StatusCode": int(config['codes']['success']), "message": "Saved successfully"
                }
                # return JSONResponse(
                #     status_code=status.HTTP_201_CREATED,
                #     content="Saved successfully",
                # )

            else:
                # cursor.execute(
                #     f"INSERT INTO {config['database_tables']['detailed_report']} \
                #         (master_report, drilldown_report, master_column, \
                #             drilldown_column, customer_id) VALUES (%s, %s, %s, %s, %s)",
                #     (
                #         master_report,
                #         drilldown_report,
                #         master_column,
                #         drilldown_column,
                #         customer_id,
                #     ),
                # )
                data = {
                    "master_report": master_report,
                    "drilldown_report": drilldown_report,
                    "master_column": master_column,
                    "drilldown_column": drilldown_column,
                    "customer_id": customer_id
                }
                database_service.create_record(
                    table=config['database_tables']['detailed_report'],
                    data=data
                )
                logging.info("Drildown Saved Successfully.")
                return{
                    "StatusCode": int(config['codes']['success']), "message": "Drildown Saved Successfully."
                }

        except Exception as unexpected_exception:
            logging.error("Unexpected error: %s", unexpected_exception)
            return{
                "StatusCode":int(config['codes']['internal error']),
                "Error":f"Internal server error: {unexpected_exception}"
            }

        finally:
            # if "cursor" in locals() and cursor:
            #     cursor.close()
            # if "database_mysql" in locals() and database_mysql:
            #     database_mysql.close()
            database_service.close_connection()
            logging.info("Database connection closed")

    # async def save_get_drill(self, details: dict):
    #     """
    #     Processes a request to determine if drilldown functionality can be applied 
    #     to a given query based on the chart type and the presence of a 'GROUP BY' clause.
    #     It also checks and retrieves existing drilldown details from the database or saves new details.
    #     """
    #     cursor_logger = LOGGINGS.CustomLogger()
    #     logging = cursor_logger.setup_logger()
    #     logging.info("Received request to assign features: %s", details)

    #     try:
    #         query = details.get("query")
    #         chart_type = details.get("type")
    #         db_type = details.get("db_type")
    #         schema_name = details.get("schema_name")
    #         customer_id = details.get("customer_id")
    #         logging.info("Processing query for chart type: %s", chart_type)

    #         if chart_type.lower() == "box":
    #             response = {"drilldown": "yes", "column_mapping": 1}
    #             logging.info(
    #                 "Box chart type detected. Drilldown response: %s", response
    #             )
    #         elif "group by" in query or "GROUP BY" in query:
    #             res = db_services.count_group_by_columns(
    #                 query, db_type, schema_name, customer_id
    #             )
    #             if res != 0:
    #                 count_of_group_by_columns = int(res["length"])
    #                 if count_of_group_by_columns < 3:
    #                     response = {
    #                         "drilldown": "yes",
    #                         "column_mapping": count_of_group_by_columns,
    #                     }
    #                     logging.info(
    #                         "Valid group by query with count: %d. Drilldown response: %s",
    #                         count_of_group_by_columns,
    #                         response,
    #                     )
    #                 else:
    #                     response = {
    #                         "drilldown": "no",
    #                         "message": "Invalid Query for DrillDown : Count of columns in \
    #                             'GROUP BY' clause should not be more than 2 for drilldown.",
    #                     }
    #                     logging.warning(
    #                         "Invalid group by query. Drilldown response: %s", response
    #                     )
    #             else:
    #                 response = {"drilldown": "no", "message": "Invalid Query"}
    #                 logging.warning(
    #                     "Invalid query detected. Drilldown response: %s", response
    #                 )
    #         else:
    #             response = {
    #                 "drilldown": "no",
    #                 "message": "Invalid Query for DrillDown : 'GROUP BY' clause having upto \
    #                     2 columns is required for drilldown.",
    #             }
    #             logging.warning(
    #                 "No group by clause. Drilldown response: %s", response
    #             )

    #         customer_id = details.get("customer_id")
    #         master_report = details.get("master_report")
    #         mysql_database_url = {
    #             "host": config["mysql"]["mysql_host"],
    #             "port": config["mysql"]["mysql_port"],
    #             "username": config["mysql"]["mysql_username"],
    #             "password": config["mysql"]["mysql_password"],
    #             "schema": config["mysql"]["mysql_new_schema"],
    #         }
    #         database_mysql = db_services.get_mysql_connection(mysql_database_url)
    #         logging.info("Connected to MySQL database")
    #         with database_mysql.cursor(dictionary=True) as cursor:
    #             # Check if the combination already exists
    #             cursor.execute(
    #                 f"SELECT COUNT(*) as count FROM \
    #                     {config['database_tables']['detailed_report']}\
    #                           WHERE master_report = %s AND customer_id = %s",
    #                 (master_report, customer_id),
    #             )
    #             result = cursor.fetchone()
    #             logging.info(
    #                 "Checked existing records in detailed_report table: %s", result
    #             )

    #             if result["count"] != 0:
    #                 cursor.execute(
    #                     f"SELECT master_report,drilldown_report, master_column,\
    #                           drilldown_column from \
    #                             {config['database_tables']['detailed_report']}\
    #                                   where master_report = %s and customer_id = %s",
    #                     (master_report, customer_id),
    #                 )
    #                 data = cursor.fetchone()
    #                 logging.info("Drill down report updated successfully")
    #                 response["drilldown_data"] = data

    #                 return JSONResponse(
    #                     status_code=status.HTTP_200_OK, content=response
    #                 )

    #             else:
    #                 logging.info("Drildown Saved Successfully.")
    #                 return JSONResponse(
    #                     status_code=status.HTTP_204_NO_CONTENT,
    #                     content="Drildown Details Not Available.",
    #                 )
    #     except Exception as unexpected_exception:
    #         logging.error("Unexpected error: %s", unexpected_exception)
    #         raise HTTPException(
    #             status_code=500,
    #             detail="Internal server error: {}".format(unexpected_exception),
    #         )
    #     finally:
    #         if "cursor" in locals() and cursor:
    #             cursor.close()
    #         if "database_mysql" in locals() and database_mysql:
    #             database_mysql.close()
    #         logging.info("Database connection closed")

    async def save_get_drill(self, details: dict):
        cursor_logger = LOGGINGS.CustomLogger()
        logging = cursor_logger.setup_logger()
        logging.info("Received request to assign features: %s", details)

        try:
            query = details.get("query")
            chart_type = details.get("type")
            database_type = details.get("database_type")
            schema_name = details.get("schema_name")
            customer_id = details.get("customer_id")
            logging.info("Processing query for chart type: %s", chart_type)

            try:                        
                if database_type == "mysql":
                    database_url = self.mysql_database_url
                    database_service = MySQLServices(**database_url)
                    cursor = database_service.connect().cursor(dictionary=True)
                    logging.info("Using MySQL database service.")
                elif database_type == "oracle":
                    database_url = self.oracle_database_url
                    database_service = OracleServices(**database_url)
                    database_service.connect()
                    logging.info("Using Oracle database service.")
                elif database_type == "postgres":
                    database_url = self.postgres_database_url
                    database_service = PostgreSQLServices(**database_url)
                    cursor = database_service.connect().cursor(cursor_factory=RealDictCursor)
            except Exception as e:
                logging.error(f"Error connecting to database: {e}")
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Database connection error: {e}",
                }

            if chart_type.lower() == "box":
                response = {"drilldown": "yes", "column_mapping": 1}
                logging.info(
                    "Box chart type detected. Drilldown response: %s", response
                )
            elif "group by" in query or "GROUP BY" in query:
                logging.info("checking count_group_by_columns")
                res = db_services.count_group_by_columns(
                    query, database_type, schema_name, customer_id
                )
                logging.info("response from count_group_by_columns",res)
                if res != 0:
                    count_of_group_by_columns = int(res["length"])
                    if count_of_group_by_columns < 3:
                        response = {
                            "drilldown": "yes",
                            "column_mapping": count_of_group_by_columns,
                        }
                        logging.info(
                            "Valid group by query with count: %d. Drilldown response: %s",
                            count_of_group_by_columns,
                            response,
                        )
                    else:
                        response = {
                            "drilldown": "no",
                            "message": "Invalid Query for DrillDown : Count of columns in \
                                'GROUP BY' clause should not be more than 2 for drilldown.",
                        }
                        logging.warning(
                            "Invalid group by query. Drilldown response: %s", response
                        )
                else:
                    response = {"drilldown": "no", "message": "Invalid Query"}
                    logging.warning(
                        "Invalid query detected. Drilldown response: %s", response
                    )
            else:
                response = {
                    "drilldown": "no",
                    "message": "Invalid Query for DrillDown : 'GROUP BY' clause having upto \
                        2 columns is required for drilldown.",
                }
                logging.warning(
                    "No group by clause. Drilldown response: %s", response
                )

            customer_id = details.get("customer_id")
            master_report = details.get("master_report")
            # mysql_database_url = {
            #     "host": config["mysql"]["mysql_host"],
            #     "port": config["mysql"]["mysql_port"],
            #     "username": config["mysql"]["mysql_username"],
            #     "password": config["mysql"]["mysql_password"],
            #     "schema": config["mysql"]["mysql_new_schema"],
            # }
            # database_mysql = db_services.get_mysql_connection(mysql_database_url)
            # logging.info("Connected to MySQL database")
        # with database_mysql.cursor(dictionary=True) as cursor:
            # Check if the combination already exists
            # cursor.execute(
            #     f"SELECT COUNT(*) as count FROM \
            #         {config['database_tables']['detailed_report']}\
            #               WHERE master_report = %s AND customer_id = %s",
            #     (master_report, customer_id),
            # )
            # result = cursor.fetchone()
            try:
                    
                columns = ["COUNT(*) as count"]
                result = database_service.read_records(
                    table=config['database_tables']['detailed_report'],
                    columns=columns,
                    where_conditions={"master_report": master_report, "customer_id": customer_id}
                )
            except Exception as e:
                logging.error(f"Error fetching existing records: {e}")
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Fetch error: {e}",
                }
            result = result[0] if result else None
            logging.info(
                "Checked existing records in detailed_report table: %s", result
            )

            if result["count"] != 0:
                # cursor.execute(
                #     f"SELECT master_report,drilldown_report, master_column,\
                #           drilldown_column from \
                #             {config['database_tables']['detailed_report']}\
                #                   where master_report = %s and customer_id = %s",
                #     (master_report, customer_id),
                # )
                # data = cursor.fetchone()
                columns = ["master_report", "drilldown_report", "master_column", "drilldown_column"]
                data = database_service.read_records(
                    table=config['database_tables']['detailed_report'],
                    columns=columns,
                    where_conditions={"master_report": master_report, "customer_id": customer_id}
                )
                data = data[0] if data else None
                logging.info("Drill down report updated successfully")
                response["drilldown_data"] = data
                
                return{
                    "StatusCode": int(config['codes']['success']), "message": "Drilldown data fetched successfully",
                    "content":response
                }

            else:
                logging.info("Drildown Saved Successfully.")
                return{
                    "StatusCode": int(config['codes']['success']), "message": "Drildown Details Not Available.",
                }
        except Exception as unexpected_exception:
            logging.error("Unexpected error: %s", unexpected_exception)
            return{
                "StatusCode":int(config['codes']['internal error']),
                "Error":f"Internal server error: {unexpected_exception}"
            }
        finally:
            database_service.close_connection()
            logging.info("Database connection closed")

    # async def get_schema_name(self, details:dict):
    #     """
    #     Retrieves schema details for a given customer ID, group ID, and connection type.

    #     This function connects to a MySQL database, executes a query to fetch database schema 
    #     details based on the provided customer and group information, and returns the results. 
    #     If no matching records are found, it returns an appropriate message.
    #     """
    #     try:
    #         cursor_logger = LOGGINGS.CustomLogger()
    #         logging = cursor_logger.setup_logger()
    #         logging.info("Get Schema details with : %s", details)
    #         customer_id = details["customer_id"]
    #         group_id = details["group_id"] 
    #         connection_type = details["connection_type"]
    #         mysql_database_url = {
    #                 "host": config["mysql"]["mysql_host"],
    #                 "port": config["mysql"]["mysql_port"],
    #                 "username": config["mysql"]["mysql_username"],
    #                 "password": config["mysql"]["mysql_password"],
    #                 "schema": config["mysql"]["mysql_new_schema"],
    #             }
    #         database_mysql = db_services.get_mysql_connection(mysql_database_url)
    #         with database_mysql.cursor(dictionary=True, buffered=True) as cursor:
    #             cursor.execute(f"SELECT db_details_id, group_id, rdbms_name"
    #                             f", db_schema_name FROM {config['database_tables']['view_db_group']} WHERE customer_id = %s and group_id = %s and rdbms_name = %s", (customer_id,group_id,connection_type))
    #             db_results = cursor.fetchall()
    #             if len(db_results) > 0:
    #                 # result = {}
    #                 # for record in db_results:
    #                 #     db_id = record['db_details_id']
    #                 #     group_id = record['group_id']
    #                 #     if db_id not in result:
    #                 #         result[db_id] = {**record, 'group_id': [group_id]}
    #                 #     else:
    #                 #         result[db_id]['group_id'].append(group_id)
    #                 # output = list(result.values())
    #                 logging.info("DB Names fetched successfully for customer_id: %s", customer_id)
    #                 return {"status": "success", "message": "DB Names fetched Successfully.","result":db_results}
    #             return {"status": "success", "message": f"No Database found for customer_id: {customer_id}"}
    #     except Exception as exception:
    #         logging.error("Error assigning group: %s", exception)
    #         return {"status": "failed", "message": f"Failed to fetch database details due to {exception}"}

    async def get_schema_name(self, details:dict):
        '''
                method to get schema details
                '''
        try:
            cursor_logger = LOGGINGS.CustomLogger()
            logging = cursor_logger.setup_logger()
            logging.info("Get Schema details with : %s", details)
            customer_id = details["customer_id"]
            group_id = details["group_id"] 
            connection_type = details["connection_type"]
            database_type = details['database_type']
            try:
                    
                if database_type == "mysql":
                    database_url = self.mysql_database_url
                    database_service = MySQLServices(**database_url)
                    cursor = database_service.connect().cursor(dictionary=True)
                    logging.info("Using MySQL database service.")
                elif database_type == "oracle":
                    database_url = self.oracle_database_url
                    database_service = OracleServices(**database_url)
                    database_service.connect()
                    logging.info("Using Oracle database service.")
                elif database_type == "postgres":
                    database_url = self.postgres_database_url
                    database_service = PostgreSQLServices(**database_url)
                    cursor = database_service.connect().cursor(cursor_factory=RealDictCursor)
            except Exception as e:
                logging.error(f"Error connecting to database: {e}")
                return{
                    "statusCode":int(config['codes']['database error']),
                    "Error":f"Database connection error: {e}",
                }

            try:
                    
                columns = ["db_details_id", "group_id", "rdbms_name", "db_schema_name"]
                db_results = database_service.read_records(
                    table=config['database_tables']['view_db_group'],
                    columns=columns,
                    where_conditions={"customer_id": customer_id, "group_id": group_id, "rdbms_name": connection_type}
                )
            except Exception as e:
                logging.error(f"Error fetching existing records: {e}")
                return{
                    "statusCode":int(config['codes']['database error']),
                    "Error":f"Fetch error: {e}",
                }
            if len(db_results) > 0:
                # result = {}
                # for record in db_results:
                #     db_id = record['db_details_id']
                #     group_id = record['group_id']
                #     if db_id not in result:
                #         result[db_id] = {**record, 'group_id': [group_id]}
                #     else:
                #         result[db_id]['group_id'].append(group_id)
                # output = list(result.values())
                logging.info("DB Names fetched successfully for customer_id: %s", customer_id)
                return {"status": "success","statusCode":int(config['codes']['success']), "message": "DB Names fetched Successfully.","result":db_results}
            return {"status": "success","statusCode":int(config['codes']['success']), "message": f"No Database found for customer_id: {customer_id}"}
        except Exception as exception:
            logging.error("Error assigning group: %s", exception)
            return{
                "statusCode":int(config['codes']['internal error']),
                "Error":f"Failed to fetch database details due to {exception}"
            }
        finally:
            database_service.close_connection()
            logging.info("Database connection closed")
        
    async def get_bulk_chart(self, user_details: dict):
        """
        This function fetches a list of report templates based on user details such as customer_id,
        group_id, and email. It queries the database for reports that the user has access to.
 
        - If the reports are found, they are returned in JSON format.
        - If no reports are found, an appropriate message is returned.
        - In case of an error, it logs the error and returns an internal server error response.
        """
        try:
            # Initialize logger
            cursor_logger = LOGGINGS.CustomLogger()
            logging = cursor_logger.setup_logger()
            logging.info("Starting get_bulk_chart process.")
 
            # Extract and log user details
            customer_id = user_details.get("customer_id")
            database_type = user_details.get("database_type")
            report_id = user_details.get("report_id")
            report_name = user_details.get("report_name")
            filter_options = user_details.get("filter_options")
            filter_operations = user_details.get("filter_operations")
            filter_value = user_details.get("filter_value")
            selectedSeriesName = user_details.get("selectedSeriesName")
            flag = user_details.get("flag")
            page_size = user_details.get("page_size")
            page_no = user_details.get("page_no")
            sorting_options = user_details.get("sorting_options")
 
            logging.info(f"Received request with user_details: {user_details}")
 
            if not customer_id or not database_type:
                logging.error("Missing mandatory user details: customer_id or database_type.")
                return{
                    "StatusCode":int(config['codes']['bad request']),
                    "Error":"Missing required parameters: customer_id or database_type.",
                }
            try:
                    
                if database_type == "mysql":
                    database_url = self.mysql_database_url
                    database_service = MySQLServices(**database_url)
                    cursor = database_service.connect().cursor(dictionary=True)
                    logging.info("Using MySQL database service.")
                elif database_type == "oracle":
                    database_url = self.oracle_database_url
                    database_service = OracleServices(**database_url)
                    database_service.connect()
                    logging.info("Using Oracle database service.")
                elif database_type == "postgres":
                    database_url = self.postgres_database_url
                    database_service = PostgreSQLServices(**database_url)
                    cursor = database_service.connect().cursor(cursor_factory=RealDictCursor)
            except Exception as e:
                logging.error(f"Error connecting to database: {e}")
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Database connection error: {e}",
                }
            # Fetch master report details
            if flag == "drilldownpage":
                try:
                    if report_id:
                        where_conditions = {
                            "customer_id": customer_id,
                            "detailed_report_id": report_id
                        }
                    else:
                        where_conditions = {
                            "customer_id": customer_id,
                            "master_report": report_name
                        }
                    columns = ["*"]
                    try: 
                        
                        result = database_service.read_records(
                            table="detailed_report", columns=columns, where_conditions=where_conditions
                        )
                    except Exception as e:
                        logging.error(f"Error fetching existing records: {e}")
                        return{
                            "StatusCode":int(config['codes']['database error']),
                            "Error":f"Fetch error: {e}",
                        }
                    if not result:
                        logging.warning("No master_report found with the provided details.")
                        return{
                            "StatusCode":int(config['codes']['no records']),
                            "Error":"No master_report found with the provided details.",
                        }
 
                    report_name = result[0]["drilldown_report"]
                    drilldown_column = ast.literal_eval(result[0]["drilldown_column"])
                    logging.info(f"Fetched detailed report")
                except Exception as fetch_template_error:
                    logging.error(
                        f"Error fetching master report: {fetch_template_error}", exc_info=True
                    )
                    return{
                        "StatusCode":int(config['codes']['database error']),
                        "Error":f"Error fetching master report: {fetch_template_error}",
                    }
               
 
            # Fetch report template details
            try:
                if report_name:
                    where_conditions = {
                        "customer_id": customer_id,
                        "report_template_name": report_name
                    }
                else:
                    where_conditions = {
                        "customer_id": customer_id,
                        "report_id": report_id
                    }
                try:
                        
                    columns = ["report_template_name", "report_type", "defined_query", "db_details_id"]
                    result = database_service.read_records(
                        table="report_template", columns=columns, where_conditions=where_conditions
                    )
                except Exception as e:
                    logging.error(f"Error fetching existing records: {e}")
                    return{
                        "StatusCode":int(config['codes']['database error']),
                        "Error":f"Fetch error: {e}",
                    }
                if not result:
                    logging.warning("No report template found with the provided details.")
                    return{
                        "StatusCode":int(config['codes']['no records']),
                        "Error":"No report template found with the provided details.",
                    }
 
                db_details_id = result[0]["db_details_id"]
                query = result[0]["defined_query"]
                report_template_name = result[0]["report_template_name"]
                report_type = result[0]["report_type"]
                logging.info(f"Fetched report template: db_details_id={db_details_id}, query={query}")
            except Exception as fetch_template_error:
                logging.error(
                    f"Error fetching report template: {fetch_template_error}", exc_info=True
                )
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Error fetching report template: {fetch_template_error}",
                }
 
            # Fetch secondary database details
            try:
                db_table = config["database_tables"]["database_details"]
                columns = [
                    "rdbms_name",
                    "domain_name",
                    "db_port",
                    "db_user_name",
                    "db_password",
                    "db_schema_name",
                ]
                try:
                        
                    db_details = database_service.read_records(
                        table=db_table, columns=columns, where_conditions={"db_details_id": db_details_id}
                    )
                except Exception as e:
                    logging.error(f"Error fetching existing records: {e}")
                    return{
                        "StatusCode":int(config['codes']['database error']),
                        "Error":f"Fetch error: {e}",
                    }
                if not db_details:
                    logging.warning("No database details found for the given db_details_id.")
                    return{
                        "StatusCode":int(config['codes']['database error']),
                        "Error":f"No database details found for the given db_details_id.",
                    }
                    
                db_config = db_details[0]
                logging.info(f"Fetched database details: {db_config}")
            except Exception as fetch_db_error:

                logging.error(
                    f"Error fetching database details: {fetch_db_error}", exc_info=True
                )
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Error fetching database details: {fetch_db_error}",
                }
            finally:
                database_service.close_connection()
                logging.info("Closed primary database connection.")
 
            # Construct WHERE clause based on filter options
            try:    
                query = query.replace(";","")
                if flag == "drilldownpage":
                    if db_config["rdbms_name"] == "mysql":
                        if filter_value == "":
                            query = query
                        else:
                            if len(drilldown_column) == 1:
                                condition = (
                                    f" WHERE `{drilldown_column[0]}` = '{filter_value}'"
                                )
                            elif len(drilldown_column) == 2:
                                condition = f" WHERE `{drilldown_column[0]}` = '{filter_value}'\
                                        AND `{drilldown_column[1]}` = '{selectedSeriesName}'"
                            query = f"Select * from ({query}) mains" + condition
                    elif db_config["rdbms_name"] == "oracle":
                        if filter_value == "":
                            query = query
                        else:
                            if len(drilldown_column) == 1:
                                # Single column filter
                                condition = f' WHERE "{drilldown_column[0]}" = \'{filter_value}\''
                            elif len(drilldown_column) == 2:
                                # Two-column filter
                                condition = f' WHERE "{drilldown_column[0]}" = \'{filter_value}\' \
                                            AND "{drilldown_column[1]}" = \'{selectedSeriesName}\''
                           
                            # Add the condition to the query
                            query = f'SELECT * FROM ({query}) mains' + condition
 
                    elif db_config["rdbms_name"] == 'postgres':
                        if filter_value == "":
                            query = query
                        else:
                            filter_value = filter_value.replace("'","''")
                            selectedSeriesName = selectedSeriesName.replace("'","''")
                            if len(drilldown_column) == 1:
                                condition = f" WHERE \"{drilldown_column[0]}\" = '{filter_value}'"
                            elif len(drilldown_column) == 2:
                                condition = f" WHERE \"{drilldown_column[0]}\" = '{filter_value}'\
                                    AND \"{drilldown_column[1]}\" = '{selectedSeriesName}'"
                            query = f"Select * from ({query}) mains" + condition
 
 
                if filter_operations and filter_options:
                    if db_config["rdbms_name"] == 'mysql':
                        where_clause = generate_where_clause_mysql(filter_options, filter_operations)
                        query = f"SELECT * FROM ({query}) AS MAIN WHERE {where_clause}"
                    elif db_config["rdbms_name"] == 'postgres':
                        where_clause = generate_where_clause_postgres(filter_options, filter_operations)
                        query = f"SELECT * FROM ({query}) AS MAIN WHERE {where_clause}"
                    elif db_config['rbdms_name'] == 'oracle':
                        where_clause = generate_where_clause_oracle(filter_options, filter_operations)
                        query = f"SELECT * FROM ({query}) MAIN WHERE {where_clause}"
                    elif db_config['rbdms_name'] == 'vertica':
                        where_clause = generate_where_clause_vertica(filter_options, filter_operations)
                        query = f"SELECT * FROM ({query}) MAIN WHERE {where_clause}"
                   
                logging.info(f"Constructed query: {query}")
                # Construct ORDER BY clause based on sorting options
                if sorting_options:
                    if db_config["rdbms_name"] == 'mysql':
                        order_by_clause = " ORDER BY " + ", ".join(
                            [f"`{sort['id']}` {'DESC' if sort['desc'] else 'ASC'}" for sort in sorting_options]
                        )
                    elif db_config["rdbms_name"] == 'postgres':
                        order_by_clause = " ORDER BY " + ", ".join(
                            [f'"{sort["id"]}" {"DESC" if sort["desc"] else "ASC"}' for sort in sorting_options]
                        )
                    elif db_config["rdbms_name"] == 'oracle':
                        order_by_clause = " ORDER BY " + ", ".join(
                            [f'"{sort["id"]}" {"DESC" if sort["desc"] else "ASC"}' for sort in sorting_options]
                        )
                    query += order_by_clause
                    logging.info(f"Constructed ORDER BY clause: {order_by_clause}")
                # Construct ORDER BY clause based on sorting options
                # if sorting_options:
                #     if db_config["rdbms_name"] == 'oracle':
                #         order_by_clause = " ORDER BY " + ", ".join(
                #             [f'"{sort["id"]}" {"DESC" if sort["desc"] else "ASC"}' for sort in sorting_options])
                #     else:
                #         order_by_clause = " ORDER BY " + ", ".join(
                #             [f"`{sort['id']}` {'DESC' if sort['desc'] else 'ASC'}" for sort in sorting_options]
                #         )
                #     query += order_by_clause
                #     logging.info(f"Constructed ORDER BY clause: {order_by_clause}")
               
            except Exception as construct_query_error:
                logging.error(
                    f"Error constructing query with filter options: {construct_query_error}", exc_info=True
                )
                return{
                    "StatusCode":int(config['codes']['internal error']),
                    "Error":f"Error constructing query: {construct_query_error}",
                }
 
            # Fetch data using secondary database
            try:
                data = await self.database_chunk_processor.process_chunks(
                    db_type=db_config["rdbms_name"],
                    query=query,
                    hostname=db_config["domain_name"],
                    port=db_config["db_port"],
                    db_name=db_config["db_schema_name"],
                    db_user=db_config["db_user_name"],
                    password=db_config["db_password"],
                    page_size=page_size,
                    page_no=page_no,
                )
                if not data:
                    logging.info("No data found for the provided query.")
                    return{
                        "StatusCode":int(config['codes']['no records']),
                        "Error":"No data found for the provided query.",
                    }
 
                logging.info(f"Fetched data successfully:")
 
                data["report_title"] = report_template_name
                data["report_type"] = report_type
                return{
                    "StatusCode":int(config['codes']['success']),
                    "message":"Data fetched successfully.",
                    "data":data,
                }
                # return data
            except Exception as fetch_data_error:
                logging.error(
                    f"Error fetching data from secondary database: {fetch_data_error}", exc_info=True
                )
                return{
                    "StatusCode":int(config['codes']['internal error']),
                    "Error":f"Error fetching data: {fetch_data_error}",
                }
                
 
        except Exception as unexpected_exception:
            logging.error(f"Unexpected error in get_bulk_chart: {unexpected_exception}", exc_info=True)
            return{
                "StatusCode":int(config['codes']['internal error']),
                "Error":f"Internal server error: {unexpected_exception}"
            }
        finally:
            if database_service:
                database_service.close_connection()
                logging.info("Closed secondary database connection.")
 
    async def fetch_unique(self, user_details: dict):
        """
        This function fetches a list of report templates based on user details such as customer_id,
        group_id, and email. It queries the database for reports that the user has access to.
 
        - If the reports are found, they are returned in JSON format.
        - If no reports are found, an appropriate message is returned.
        - In case of an error, it logs the error and returns an internal server error response.
        """
        try:
            # Initialize logger
            cursor_logger = LOGGINGS.CustomLogger()
            logging = cursor_logger.setup_logger()
            logging.info("Starting get_bulk_chart process.")
 
            # Extract and log user details
            customer_id = user_details.get("customer_id")
            database_type = user_details.get("database_type")
            report_id = user_details.get("report_id")
            report_name = user_details.get("report_name")
            column_name = user_details.get("column_name")
            filter_value = user_details.get("filter_value")
            selectedSeriesName = user_details.get("selectedSeriesName")
            flag = user_details.get("flag")
            logging.info(f"Received request with user_details: {user_details}")
 
            if not customer_id or not database_type:
                logging.error("Missing mandatory user details: customer_id or database_type.")
                return{
                    "StatusCode":int(config['codes']['bad request']),
                    "content":"Missing required parameters: customer_id or database_type.",
                }
            try:
                    
                # Select database service
                if database_type == "mysql":
                    database_url = self.mysql_database_url
                    database_service = MySQLServices(**database_url)
                    cursor = database_service.connect().cursor(dictionary=True)
                    logging.info("Using MySQL database service.")
                elif database_type == "oracle":
                    database_url = self.oracle_database_url
                    database_service = OracleServices(**database_url)
                    database_service.connect()
                    logging.info("Using Oracle database service.")
                elif database_type == "postgres":
                    database_url = self.postgres_database_url
                    database_service = PostgreSQLServices(**database_url)
                    cursor = database_service.connect().cursor(cursor_factory=RealDictCursor)
            except Exception as e:
                logging.error(f"Error connecting to database: {e}")

                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Database connection error: {e}"
                }

           
            # Fetch master report details
            if flag == "drilldownpage":
                try:
                    if report_id:
                        where_conditions = {
                            "customer_id": customer_id,
                            "detailed_report_id": report_id
                        }
                    else:
                        where_conditions = {
                            "customer_id": customer_id,
                            "master_report": report_name
                        }
                    columns = ["*"]
                    try:
                            
                        result = database_service.read_records(
                            table="detailed_report", columns=columns, where_conditions=where_conditions
                        )
                    except Exception as e:
                        logging.error(f"Error fetching existing records: {e}")
                        return{
                            "StatusCode":int(config['codes']['database error']),
                            "Error":f"Fetch error: {e}",
                        }
 
                    # print("master_report",result)
 
                    if not result:
                        logging.warning("No master_report found with the provided details.")
                        return{
                            "StatusCode":int(config['codes']['no records']),
                            "Error":"No master_report found with the provided details.",
                        }
 
                    report_name = result[0]["drilldown_report"]
                    drilldown_column = ast.literal_eval(result[0]["drilldown_column"])
                    logging.info(f"Fetched detailed report")
                except Exception as fetch_template_error:
                    logging.error(
                        f"Error fetching master report: {fetch_template_error}", exc_info=True
                    )

                    return{
                        "StatusCode":int(config['codes']['database error']),
                        "Error":f"Error fetching master report: {fetch_template_error}",
                    }
                    
               
 
            # Fetch report template details
            try:
                if report_name:
                    where_conditions = {
                        "customer_id": customer_id,
                        "report_template_name": report_name
                    }
                else:
                    where_conditions = {
                        "customer_id": customer_id,
                        "report_id": report_id
                    }
                try:
                        
                    columns = ["report_type", "defined_query", "db_details_id"]
                    result = database_service.read_records(
                        table="report_template", columns=columns, where_conditions=where_conditions
                    )
                except Exception as e:
                    logging.error(f"Error fetching existing records: {e}")
                    return{
                        "StatusCode":int(config['codes']['database error']),
                        "Error":f"Fetch error: {e}",
                    }
                # print("Result:", result)
                if not result:
                    logging.warning("No report template found with the provided details.")
                    return{
                        "StatusCode":int(config['codes']['no records']),
                        "Error":"No report template found with the provided details.",
                    }
 
                db_details_id = result[0]["db_details_id"]
                query = result[0]["defined_query"]
 
                logging.info(f"Fetched report template: db_details_id={db_details_id}, query={query}")
            except Exception as fetch_template_error:
                logging.error(
                    f"Error fetching report template: {fetch_template_error}", exc_info=True
                )
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Error fetching report template: {fetch_template_error}",
                }
 
            # Fetch secondary database details
            try:
                db_table = config["database_tables"]["database_details"]
                columns = [
                    "rdbms_name",
                    "domain_name",
                    "db_port",
                    "db_user_name",
                    "db_password",
                    "db_schema_name",
                ]
                try:
                        
                    db_details = database_service.read_records(
                        table=db_table, columns=columns, where_conditions={"db_details_id": db_details_id}
                    )
                except Exception as e:
                    logging.error(f"Error fetching existing records: {e}")
                    return{
                        "StatusCode":int(config['codes']['database error']),
                        "Error":f"Fetch error: {e}",
                    }
 
                # print(db_details)
                if not db_details:
                    logging.warning("No database details found for the given db_details_id.")
                    return{
                        "StatusCode":int(config['codes']['no records']),
                        "Error":"No database details found for the given db_details_id.",
                    }
                   
                db_config = db_details[0]
                logging.info(f"Fetched database details: {db_config}")
            except Exception as fetch_db_error:
                logging.error(
                    f"Error fetching database details: {fetch_db_error}", exc_info=True
                )
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Error fetching database details: {fetch_db_error}",
                }
            finally:
                database_service.close_connection()
                logging.info("Closed primary database connection.")
 
            # Construct WHERE clause based on filter options
            # oracle changes
            try:
                if flag == "drilldownpage":
                    filter_value = filter_value.replace("'", "''") if filter_value else ""
                    selectedSeriesName = selectedSeriesName.replace("'", "''") if selectedSeriesName else ""
 
                    if db_config["rdbms_name"] == "mysql":
                        if filter_value:
                            if len(drilldown_column) == 1:
                                condition = f" WHERE `{drilldown_column[0]}` = '{filter_value}'"
                            elif len(drilldown_column) == 2:
                                condition = f" WHERE `{drilldown_column[0]}` = '{filter_value}' AND `{drilldown_column[1]}` = '{selectedSeriesName}'"
                            query = f"SELECT * FROM ({query}) AS mains" + condition
 
                    elif db_config["rdbms_name"] == "postgres":
                        if filter_value:
                            if len(drilldown_column) == 1:
                                condition = f' WHERE "{drilldown_column[0]}" = \'{filter_value}\''
                            elif len(drilldown_column) == 2:
                                condition = f' WHERE "{drilldown_column[0]}" = \'{filter_value}\' AND "{drilldown_column[1]}" = \'{selectedSeriesName}\''
                            query = f'SELECT * FROM ({query}) AS mains' + condition
 
                    elif db_config["rdbms_name"] == "oracle":
                        if filter_value:
                            if len(drilldown_column) == 1:
                                condition = f' WHERE "{drilldown_column[0]}" = \'{filter_value}\''
                            elif len(drilldown_column) == 2:
                                condition = f' WHERE "{drilldown_column[0]}" = \'{filter_value}\' AND "{drilldown_column[1]}" = \'{selectedSeriesName}\''
                            query = f'SELECT * FROM ({query}) mains' + condition
 
                # print(column_name)
                if db_config["rdbms_name"].lower() in ["postgres","oracle"]:
                    quoted_column = f'"{column_name}"'
                elif db_config["rdbms_name"].lower() == 'mysql':
                    quoted_column = f"`{column_name}`"
 
                query = query.replace(";", "")
 
                if db_config["rdbms_name"] == "oracle":
                    query = f"SELECT DISTINCT {column_name} FROM ({query}) MAIN"
                    # query = "SELECT DISTINCT id FROM (SELECT * FROM username) MAIN"
                else:
                    query = f"SELECT DISTINCT {quoted_column} FROM ({query}) AS MAIN"
 
                logging.info(f"Constructed query: {query}")
 
            except Exception as construct_query_error:
                logging.error(f"Error constructing query: {construct_query_error}", exc_info=True)
                return{
                    "StatusCode":int(config['codes']['internal error']),
                    "Error":f"Error constructing query: {construct_query_error}",
                }

 
            # Fetch data using secondary database
            try:
                secondary_database_url = {
                    "host": db_config["domain_name"],
                    "port": db_config["db_port"],
                    "username": db_config["db_user_name"],
                    "password": db_config["db_password"],
                    "database": db_config["db_schema_name"],
                }
 
                if db_config["rdbms_name"].lower() == "mysql":
                    database_url = self.mysql_database_url
                    secondary_database_service = MySQLServices(**secondary_database_url)
                    logging.info("Using MySQL database service.")
               
                # oracle changes
                elif db_config["rdbms_name"].lower() == "oracle":
                    database_url = self.oracle_database_url
                    secondary_database_service = OracleDBServices(
                        host= db_config["domain_name"],
                        port= db_config["db_port"],
                        username= db_config["db_user_name"],
                        password= db_config["db_password"],
                        schema = db_config["db_schema_name"],
                    )
                    logging.info("Using Oracle database service.")
                elif db_config["rdbms_name"].lower() == "postgres":
                    database_url = self.postgres_database_url
                    secondary_database_service = PostgreSQLServices(host=db_config["domain_name"],
                                                                username=db_config["db_user_name"],
                                                                port=db_config["db_port"],
                                                                password=db_config["db_password"],
                                                                database=db_config["db_schema_name"])
                    logging.info("Using Postgres database service.")
                else:
                    logging.error(f"Unsupported database type: {database_type}")
                    return{
                        "StatusCode":int(config['codes']['bad request']),
                        "Error":f"Unsupported database type: {database_type}",
                    }
               
                secondary_database_service.connect()
                # print(query)
                data = secondary_database_service.execute_query(query=query)
                # print(data)
 
                if not data:
                    logging.info("No data found for the provided query.")
                    return{
                        "StatusCode":int(config['codes']['no records']),
                        "Error":"No data found for the provided query."
                    }
                
                   
                if len(data)>300:
                    data = data[:199]
                   
                logging.info(f"Fetched data successfully:")
                if db_config["rdbms_name"].lower() == "postgres":
                    return{
                        "StatusCode":int(config['codes']['success']),
                        "message":"Data fetched successfully.",
                        "data":[row[0] for row in data],
                    }
                    # return [row[0] for row in data]
                # oracle changes
                elif db_config["rdbms_name"].lower() == "oracle":
                    if data and isinstance(data[0], tuple):
                        return{
                            "StatusCode":int(config['codes']['success']),
                            "message":"Data fetched successfully.",
                            "data":[row[0] for row in data]
                        }
                        # return [row[0] for row in data]
                    else:
                        logging.warning(f"Unexpected data format for Oracle: {data}")
                        return{
                            "StatusCode":int(config['codes']['success']),
                            "message":"Data fetched successfully.",
                            "data":[row for row in data] if isinstance(data, list) else []
                        }
                        # return [row for row in data] if isinstance(data, list) else []
                elif db_config["rdbms_name"].lower() == "mysql":
                    values = []
                    # print(data,"data")
                    for dictionary in data:
                        for value in dictionary.values():
                            values.append(value)
                    return{
                        "StatusCode":int(config['codes']['success']),
                        "message":"Data fetched successfully.",
                        "data":values
                    }
                    # return values
           
            except Exception as fetch_data_error:
                logging.error(
                    f"Error fetching data from secondary database: {fetch_data_error}", exc_info=True
                )
                return{
                    "StatusCode":int(config['codes']['internal error']),
                    "Error":f"Error fetching data: {fetch_data_error}",
                }
 
        except Exception as unexpected_exception:
            logging.error(f"Unexpected error in fetch_unique: {unexpected_exception}", exc_info=True)
            return{
                "StatusCode":int(config['codes']['internal error']),
                "Error":f"Internal server error: {unexpected_exception}"
            }
        finally:
            if database_service:
                database_service.close_connection()
                logging.info("Closed secondary database connection.")
 
    async def generate_reports(self, user_details: dict):
        """
        This function fetches a list of report templates based on user details such as customer_id, 
        group_id, and email. It queries the database for reports that the user has access to.

        - If the reports are found, they are returned in JSON format.
        - If no reports are found, an appropriate message is returned.
        - In case of an error, it logs the error and returns an internal server error response.
        """
        try:
            # Initialize logger
            cursor_logger = LOGGINGS.CustomLogger()
            logging = cursor_logger.setup_logger()
            logging.info("Starting get_bulk_chart process.")
            # Extract and log user details
            # user_details = user_details["params"]
            customer_id = user_details.get("customer_id")
            database_type = user_details.get("database_type")
            detailed_report_id = user_details.get("report_id")
            master_report_name = user_details.get("report_name")
            filter_options = user_details.get("filter_options")
            filter_operations = user_details.get("filter_operations")
            file_format = user_details.get("file_format")
            column_names = user_details.get("column_names")
            filter_value = user_details.get("filter_value")
            selectedSeriesName = user_details.get("selectedSeriesName")
            flag = user_details.get("flag")
            sorting_options = user_details.get("sorting_options")

            logging.info(f"Received request with user_details: {user_details}")

            if not customer_id or not database_type:
                logging.error("Missing mandatory user details: customer_id or database_type.")
                return{
                    "StatusCode":int(config['codes']['bad request']),
                    "Error":"Missing required parameters: customer_id or database_type.",
                }
            try:
                    
                if database_type == "mysql":
                    database_url = self.mysql_database_url
                    database_service = MySQLServices(**database_url)
                    cursor = database_service.connect().cursor(dictionary=True)
                    logging.info("Using MySQL database service.")
                elif database_type == "oracle":
                    database_url = self.oracle_database_url
                    database_service = OracleServices(**database_url)
                    database_service.connect()
                    logging.info("Using Oracle database service.")
                elif database_type == "postgres":
                    database_url = self.postgres_database_url
                    database_service = PostgreSQLServices(**database_url)
                    cursor = database_service.connect().cursor(cursor_factory=RealDictCursor)
            except Exception as e:
                logging.error(f"Error connecting to database: {e}")
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Database connection error: {e}"
                }
            # Fetch master report details
            try:
                if detailed_report_id:
                    where_conditions = {
                        "customer_id": customer_id,
                        "detailed_report_id": detailed_report_id
                    }
                else:
                    where_conditions = {
                        "customer_id": customer_id,
                        "master_report": master_report_name
                    }
                columns = ["*"]
                try:
                        
                    result = database_service.read_records(
                        table="detailed_report", columns=columns, where_conditions=where_conditions
                    )
                except Exception as e:
                    logging.error(f"Error fetching existing records: {e}")
                    return{
                        "StatusCode":int(config['codes']['database error']),
                        "Error":f"Fetch error: {e}",
                    }
                if not result:
                    logging.warning("No master_report found with the provided details.")
                    return{
                        "StatusCode":int(config['codes']['no records']),
                        "Error":"No master_report found with the provided details.",
                    }

                report_name = result[0]["drilldown_report"]
                drilldown_column = ast.literal_eval(result[0]["drilldown_column"])
                logging.info(f"Fetched detailed report")
            except Exception as fetch_template_error:
                logging.error(
                    f"Error fetching master report: {fetch_template_error}", exc_info=True
                )
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Error fetching master report: {fetch_template_error}",
                }

            # Fetch report template details
            try:

                where_conditions = {
                    "customer_id": customer_id,
                    "report_template_name": report_name
                }
                columns = ["report_type", "defined_query", "db_details_id"]
                try:
                        
                    result = database_service.read_records(
                        table="report_template", columns=columns, where_conditions=where_conditions
                    )
                except Exception as e:
                    logging.error(f"Error fetching existing records: {e}")
                    return{
                        "StatusCode":int(config['codes']['database error']),
                        "Error":f"Fetch error: {e}",
                    }
                if not result:
                    logging.warning("No report template found with the provided details.")
                    return{
                        "StatusCode":int(config['codes']['no records']),
                        "Error":"No report template found with the provided details.",
                    }

                db_details_id = result[0]["db_details_id"]
                query = result[0]["defined_query"]
                logging.info(f"Fetched report template:")
            except Exception as fetch_template_error:
                logging.error(
                    f"Error fetching report template: {fetch_template_error}", exc_info=True
                )
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Error fetching report template: {fetch_template_error}",
                }

            # Fetch secondary database details
            try:
                db_table = config["database_tables"]["database_details"]
                columns = [
                    "rdbms_name",
                    "domain_name",
                    "db_port",
                    "db_user_name",
                    "db_password",
                    "db_schema_name",
                ]
                db_details = database_service.read_records(
                    table=db_table, columns=columns, where_conditions={"db_details_id": db_details_id}
                )
                if not db_details:
                    logging.warning("No database details found for the given db_details_id.")
                    return{
                        "StatusCode":int(config['codes']['no records']),
                        "Error":"No database details found for the given report.",
                    }

                db_config = db_details[0]
                logging.info(f"Fetched database details: {db_config}")
            except Exception as fetch_db_error:
                logging.error(
                    f"Error fetching database details: {fetch_db_error}", exc_info=True
                )
                return{
                    "StatusCode":int(config['codes']['database error']),
                    "Error":f"Error fetching database details: {fetch_db_error}",
                }
            finally:
                database_service.close_connection()
                logging.info("Closed primary database connection.")

            # Construct WHERE clause based on filter options
            try:    
                query = query.replace(";","")
                if flag == "drilldownpage":
                    if db_config["rdbms_name"] == "mysql":
                        if filter_value == "":
                            query = query
                        else:
                            if len(drilldown_column) == 1:
                                condition = (
                                    f" WHERE `{drilldown_column[0]}` = '{filter_value}'"
                                )
                            elif len(drilldown_column) == 2:
                                condition = f" WHERE `{drilldown_column[0]}` = '{filter_value}'\
                                        AND `{drilldown_column[1]}` = '{selectedSeriesName}'"
                            query = f"Select * from ({query}) mains" + condition

                    elif db_config["rdbms_name"] == 'postgres':
                        if filter_value == "":
                            query = query
                        else:
                            filter_value = filter_value.replace("'","''")
                            selectedSeriesName = selectedSeriesName.replace("'","''")
                            if len(drilldown_column) == 1:
                                condition = f" WHERE \"{drilldown_column[0]}\" = '{filter_value}'"
                            elif len(drilldown_column) == 2:
                                condition = f" WHERE \"{drilldown_column[0]}\" = '{filter_value}'\
                                    AND \"{drilldown_column[1]}\" = '{selectedSeriesName}'"
                            query = f"Select * from ({query}) mains" + condition
                    elif db_config["rdbms_name"] == "vertica":
                        if filter_value == "":
                            query = query
                        else:
                            filter_value = filter_value.replace("'","''")
                            selectedSeriesName = selectedSeriesName.replace("'","''")
                            if len(drilldown_column) == 1:
                                condition = f" WHERE \"{drilldown_column[0]}\" = '{filter_value}'"
                            elif len(drilldown_column) == 2:
                                condition = f" WHERE \"{drilldown_column[0]}\" = '{filter_value}'\
                                    AND \"{drilldown_column[1]}\" = '{selectedSeriesName}'"
                            query = f"Select * from ({query}) mains" + condition

                if filter_operations and filter_options:
                    if db_config["rdbms_name"] == 'mysql':
                        where_clause = generate_where_clause_mysql(filter_options, filter_operations)
                        if column_names and len(column_names) > 0:
                            joined_column_names = ", ".join([f"`{col}`" for col in column_names])
                            query = f'SELECT {joined_column_names} FROM ({query}) AS MAIN WHERE {where_clause}'
                        else:
                            query = f'SELECT * FROM ({query}) AS MAIN WHERE {where_clause}'
                        # print(query)
                    elif db_config["rdbms_name"] == 'postgres':
                        where_clause = generate_where_clause_postgres(filter_options, filter_operations)
                        if column_names and len(column_names) > 0:
                            joined_column_names = ", ".join([f'"{col}"' for col in column_names])
                            query = f'SELECT {joined_column_names} FROM ({query}) AS MAIN WHERE {where_clause}'
                        else:
                            query = f'SELECT * FROM ({query}) AS MAIN WHERE {where_clause}'
                    elif db_config["rdbms_name"] == 'vertica':
                        where_clause = generate_where_clause_vertica(filter_options, filter_operations)
                        if column_names and len(column_names) > 0:
                            joined_column_names = ", ".join([f'"{col}"' for col in column_names])
                            query = f'SELECT {joined_column_names} FROM ({query}) AS MAIN WHERE {where_clause}'   
                        else:
                            query = f'SELECT * FROM ({query}) AS MAIN WHERE {where_clause}'
                                                   
                elif column_names and len(column_names) > 0:
                    if db_config["rdbms_name"] in ['postgres', 'vertica']:
                        joined_column_names = ", ".join([f'"{col}"' for col in column_names])
                    else:
                        joined_column_names = ", ".join([f"`{col}`" for col in column_names])
                    query = f'SELECT {joined_column_names} FROM ({query}) AS MAIN'
                else:
                    query = f'SELECT * FROM ({query}) AS MAIN'
                logging.info(f"Constructed query: {query}")

                # Construct ORDER BY clause based on sorting options
                if sorting_options:
                    if db_config["rdbms_name"] == 'mysql':
                        order_by_clause = " ORDER BY " + ", ".join(
                            [f"`{sort['id']}` {'DESC' if sort['desc'] else 'ASC'}" for sort in sorting_options]
                        )
                    elif db_config["rdbms_name"] == 'postgres':
                        order_by_clause = " ORDER BY " + ", ".join(
                            [f'"{sort["id"]}" {"DESC" if sort["desc"] else "ASC"}' for sort in sorting_options]
                        )
                    elif db_config["rdbms_name"] == 'oracle':
                        order_by_clause = " ORDER BY " + ", ".join(
                            [f'"{sort["id"]}" {"DESC" if sort["desc"] else "ASC"}' for sort in sorting_options]
                        )
                    elif db_config["rdbms_name"] == 'vertica':
                        order_by_clause = " ORDER BY " + ", ".join([f'"{sort["id"]}" {"DESC" if sort["desc"] else "ASC"}' for sort in sorting_options])                        
                    query += order_by_clause
                    logging.info(f"Constructed ORDER BY clause: {order_by_clause}")


            except Exception as construct_query_error:
                logging.error(
                    f"Error constructing query with filter options: {construct_query_error}", exc_info=True
                )
                return{
                    "StatusCode":int(config['codes']['internal error']),
                    "Error":f"Error constructing query: {construct_query_error}",
                }
            # return query
            # # Fetch data using secondary database
            # try:
            #     data = await self.database_chunk_processor.process_chunks(
            #         db_type=db_config["rdbms_name"],
            #         query=query,
            #         hostname=db_config["domain_name"],
            #         port=db_config["db_port"],
            #         db_name=db_config["db_schema_name"],
            #         db_user=db_config["db_user_name"],
            #         password=db_config["db_password"],
            #         page_no=None,
            #         page_size=None
            #     )

            #     if not data:
            #         logging.info("No data found for the provided query.")
            #         return JSONResponse(
            #             status_code=status.HTTP_404_NOT_FOUND,
            #             content="No data found for the query.",
            #         )
                
            #     logging.info(f"Fetched data successfully:")

            #     data = data["data"]
            # except Exception as fetch_data_error:
            #     logging.error(
            #         f"Error fetching data from secondary database: {fetch_data_error}", exc_info=True
            #     )
            #     return JSONResponse(
            #         status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            #         content=f"Error fetching data: {fetch_data_error}",
            #     )
            try:
                
                if file_format == "pdf":
                    url = "http://10.83.100.238:9004/generate_report_pdf"
                    payload = {'query':query,
                                'db_type': db_config['rdbms_name'],
                                'host': db_config['domain_name'],
                                'username': db_config['db_user_name'],
                                'password': db_config['db_password'],
                                'database': db_config['db_schema_name'],
                                'report_name': master_report_name,
                                'report_title': master_report_name}
                    headers = {}
                    logging.info(f"Fetched data successfully....................:{payload}")
                    response = requests.request("POST", url, headers=headers, data=payload)
                    new_data = response.json()
                    logging.info(f"Response from the api............... {response}")
                    # Extract filename dynamically from Content-Disposition header
                    if response.status_code != 200:
                        return{
                            "StatusCode":int(config['codes']['internal error']),
                            "Error":"Failed to fetch file from external API",

                        }
                        # return {"error": "Failed to fetch file from external API"}
                    valid_filename = new_data['file']
                    # print(valid_filename)
                    logging.info(f"Fetched data successfully:{valid_filename}")
                    with open(valid_filename, 'rb') as file:
                        file_data = file.read()

                    # Compress the file data
                    compressed_data = zlib.compress(file_data, level=zlib.Z_BEST_COMPRESSION)

                    # Create a BytesIO stream from the compressed data
                    compressed_stream = io.BytesIO(compressed_data)

                    # Define a generator to stream the data
                    def iterfile():
                        yield from compressed_stream
                    # Return the streaming response
                    logging.info('Returning.......................................')
                    return StreamingResponse(iterfile(), media_type='application/octet-stream', headers={
                        'Content-Disposition': f'attachment; filename={valid_filename}.zip',
                        "X-Filename": valid_filename,
                        "Access-Control-Expose-Headers": "Content-Disposition, X-Filename",
                    })
                    
                elif file_format == "excel":
                    url = "http://10.83.100.238:9004/generate_report_excel"
                    payload = {'query':query,
                                'db_type': db_config['rdbms_name'],
                                'host': db_config['domain_name'],
                                'username': db_config['db_user_name'],
                                'password': db_config['db_password'],
                                'database': db_config['db_schema_name'],
                                'report_name': master_report_name,
                                'report_title': master_report_name}
                    
                    response = requests.request("POST", url, headers=headers, data=payload)
                    return{
                        "StatusCode":int(config['codes']['success']),
                        "message":"Data fetched successfully.",
                        "data":response
                    }
                    # return response

                elif file_format == "csv":
                    url = "http://10.83.100.238:9004/generate_report_csv"
                    payload = {'query':query,
                                'db_type': db_config['rdbms_name'],
                                'host': db_config['domain_name'],
                                'username': db_config['db_user_name'],
                                'password': db_config['db_password'],
                                'database': db_config['db_schema_name'],
                                'report_name': master_report_name,
                                'report_title': master_report_name}
                    headers = {}

                    response = requests.request("POST", url, headers=headers, data=payload)
                    return{
                        "StatusCode":int(config['codes']['success']),
                        "message":"Data fetched successfully.",
                        "data":response
                    }
                    # return response
                else:
                    raise ValueError("Unsupported file format")
                
            except Exception as e:
                logging.error(
                    f"Error creating report: {e}", exc_info=True
                )
                return{
                    "StatusCode":int(config['codes']['internal error']),
                    "Error":f"Error creating report: {e}",
                }

        except Exception as unexpected_exception:
            logging.error(f"Unexpected error in get_bulk_chart: {unexpected_exception}", exc_info=True)
            return{
                "StatusCode":int(config['codes']['internal error']),
                "Error":f"Internal server error: {unexpected_exception}"
            }
        finally:
            if database_service:
                database_service.close_connection()
                logging.info("Closed secondary database connection.")

