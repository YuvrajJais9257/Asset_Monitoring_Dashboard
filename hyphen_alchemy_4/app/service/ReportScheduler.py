"""
This module contains the implementation of a FastAPI-based report scheduling system.
The ReportScheduler class handles the creation, retrieval, updating, and deletion
of report schedulers in a MySQL database. It includes functionality for managing
scheduler details such as report titles, attachments, email recipients, and intervals.
"""

import json
import os
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
# pylint: disable=E0401
# pylint: disable=logging-fstring-interpolation
# pylint: disable=raise-missing-from
# pylint: disable=unspecified-encoding
# pylint: disable=invalid-name
# pylint: disable=broad-exception-caught
# from database_services.mysql_service import MySQLServices
# from utilities.database_services import DatabaseServices
from database_services.common import CommonDatabaseServices , MySQLServices , PostgreSQLServices , OracleServices
from utilities import loggings as common
from utilities.config import config
from psycopg2.extras import RealDictCursor
from mysql.connector.errors import Error as MySQLError
 
db_manager = CommonDatabaseServices()


class ReportScheduler:
    """
        ReportScheduler is responsible for managing the scheduling of reports in a dashboard system.
        It supports creating, listing, updating, and deleting scheduler entries stored in a \
            MySQL database.
    """
    def __init__(self, conf):
        """Initialize the ReportScheduler class with configuration details."""
        self.conf = conf
        self.base_dir = os.getcwd()
        self.logfilepath = os.path.join(self.base_dir, "logs")
        self.configfilepath = os.path.join(os.getcwd(), "config/config.ini")
        self.app = FastAPI()
        self.setup_middleware()
        self.mysql_database_url = {
            "username": config["mysql"]["mysql_username"],
            "password": config["mysql"]["mysql_password"],
            "host": config["mysql"]["mysql_host"],
            "port": config["mysql"]["mysql_port"],
            "database": config["mysql"]["mysql_new_schema"],
        }

        self.postgres_database_url = {
            "username": config['postgres']['postgres_username'],
            "password": config['postgres']['postgres_password'],
            "host": config['postgres']['postgres_host'],
            "port": config['postgres']['postgres_port'],
            "database": config['postgres']['postgres_schema'],
        }
        self.dashboard_schedulerinfo = conf['database_tables']['dashboard_schedulerinfo']
        self.user_group = conf['database_tables']['user_group']
    # Configure logging
    cursor_logger = common.CustomLogger()
    logging = cursor_logger.setup_logger()
    logging.info("ReportScheduler initialized")

    def setup_middleware(self):
        """
        Sets up the CORS middleware for the FastAPI application.

        Enables cross-origin requests from any origin, supporting credentials,\
              all methods, and headers.
        """
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    logging.info("Middleware setup completed")

    def insert_scheduler(self, details: dict):
        """
        Inserts a new scheduler into the MySQL database based on the provided details.
        """
        # Configure logging
        cursor_logger = common.CustomLogger()
        logging = cursor_logger.setup_logger()
        logging.info("Inserting scheduler with details: %s", details)
        try:
            report_title, report_attachment = (
                details["reportTitle"],
                details["reportattachment"],
            )
            reportIDEB, scheduledtime = (
                details["selectedreport"],
                details["scheduledTime"],
            )
            emailid, emailcc = json.dumps(details["emailTo"]), json.dumps(
                details["emailCC"]
            )
            emailbody, SchedulerPeriod = details["emailBody"], details["interval"]
            startDate, customer_id = details["startDate"], details["customer_id"]
            group_id = details["group_id"]
            interval_days = {"daily": 1, "weekly": 7, "monthly": 30}
            json_data = json.dumps(report_attachment)
            database_type = details['database_type']

            logging.debug("Prepared JSON data for insertion: %s", json_data)

            if database_type =="mysql":
                database_url = self.mysql_database_url
                database_service = MySQLServices(**database_url)
                database_conn = database_service.connect()
                cursor = database_conn.cursor(dictionary=True)
            elif database_type == 'oracle':
                database_url = self.oracle_database_url
                database_service = OracleServices(**database_url)
                database_conn = database_service.connect()
                
            elif database_type == 'postgres':
                database_url = self.postgres_database_url
                database_service = PostgreSQLServices(**database_url)
                database_conn = database_service.connect()
                cursor = database_conn.cursor(cursor_factory=RealDictCursor)


            # Insert into {self.dashboard_schedulerinfo}
            cursor.execute(
                f"INSERT INTO {self.dashboard_schedulerinfo} (scheduled_time, \
                    scheduled_interval_days, scheduled_interval_time, status, emailid,\
                    scheduler_period, customer_id, emailcc, start_date, report_title,\
                    report_ideb, email_body_content, reportattachment, group_id) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                (
                    scheduledtime,
                    interval_days[str(SchedulerPeriod).lower()],
                    "1",
                    "1",
                    emailid,
                    SchedulerPeriod,
                    customer_id,
                    emailcc,
                    startDate,
                    report_title,
                    reportIDEB,
                    emailbody,
                    json_data,
                    group_id,
                ),
            )
            
            # Commit the transaction
            database_conn.commit()
            logging.info(
                "Scheduler inserted successfully for customer_id: %s", customer_id
            )
            return {"statusCode":self.conf['codes']['success'],"status": "success", "message": "Scheduler Added Successfully!"}
        except HTTPException as unexpected_exception:
            logging.error("Unexpected HTTP error: %s", unexpected_exception)
            raise HTTPException(
                status_code=500,
                detail={"statusCode":self.conf['codes']['internal error'],"error":f"internal error {str(unexpected_exception)}"}
            )
        except Exception as exception:
            logging.error("Error inserting scheduler: %s", exception)
            return {"statusCode":self.conf['codes']['internal error'],"status": "Failed", "message": "Unable to insert the scheduler!"}
        finally:
            if "cursor" in locals() and cursor:
                cursor.close()
            if "database_conn" in locals() and database_conn:
                database_conn.close()

    def list_scheduler(self, details: dict):
        # Configure logging
        cursor_logger = common.CustomLogger()
        logging = cursor_logger.setup_logger()
        logging.info("Listing schedulers for customer_id: %s", details["customer_id"])
        try:
            customer_id = details["customer_id"]
            group_id = details["group_id"]
            database_type = details['database_type']

            if database_type =="mysql":
                database_url = self.mysql_database_url
                database_service = MySQLServices(**database_url)
                database_conn = database_service.connect()
                cursor = database_conn.cursor(dictionary=True)
            elif database_type == 'oracle':
                database_url = self.oracle_database_url
                database_service = OracleServices(**database_url)
                database_conn = database_service.connect()
            elif database_type == 'postgres':
                database_url = self.postgres_database_url
                database_service = PostgreSQLServices(**database_url)
                database_conn = database_service.connect()
                cursor = database_conn.cursor(cursor_factory=RealDictCursor)

            cursor.execute(
                f"SELECT groupname FROM {self.user_group} WHERE group_id = %s",
                (group_id,)
            )
            groupname = cursor.fetchall()
            
            logging.info(
                "Schedulers listed successfully for groupname: %s", groupname
            )
            
            if groupname and groupname[0].get('groupname') == 'SuperAdmin':
                cursor.execute(
                    f"SELECT scheduled_id, scheduled_time, scheduled_interval_days, "
                    "scheduled_interval_time, status, emailid, scheduler_period, customer_id, "
                    "emailcc, start_date, report_title, report_ideb, email_body_content, reportattachment "
                    f"FROM {self.dashboard_schedulerinfo} WHERE customer_id = %s",
                    (customer_id,),
                )
            else:
                cursor.execute(
                    f"SELECT scheduled_id, scheduled_time, scheduled_interval_days, "
                    "scheduled_interval_time, status, emailid, scheduler_period, customer_id, "
                    "emailcc, start_date, report_title, report_ideb, email_body_content, reportattachment, group_id "
                    f"FROM {self.dashboard_schedulerinfo} WHERE customer_id = %s AND group_id = %s",
                    (customer_id, group_id),
                )
            Schedulers = cursor.fetchall()
            # Commit the transaction
            database_conn.commit()
            logging.info(
                "Schedulers listed successfully for customer_id: %s", customer_id
            )
            return {"statusCode":self.conf['codes']['success'],"status": "success", "Schedulers": Schedulers}
        except HTTPException as unexpected_exception:
            logging.error("Unexpected HTTP error: %s", unexpected_exception)
            raise HTTPException(
                status_code=500,
                detail={"statusCode":self.conf['codes']['internal error'],"error":f"internal error {str(unexpected_exception)}"}
            )
        except Exception as exception:
            logging.error("Error listing schedulers: %s", exception)
            return {"statusCode":self.conf['codes']['internal error'],"status": "Failed", "message": "Unable to list the scheduler!"}
        finally:
            if "cursor" in locals() and cursor:
                cursor.close()
            if "database_conn" in locals() and database_conn:
                database_conn.close()

    def update_scheduler(self, details: dict):
        # Configure logging
        cursor_logger = common.CustomLogger()
        logging = cursor_logger.setup_logger()
        logging.info("Updating scheduler with details: %s", details)
        database_type = details['database_type']

        try:
            interval_days = {"daily": 1, "weekly": 7, "monthly": 30}
            current_value = {
                "scheduled_id": details["scheduleid"],
                "scheduled_time": details["scheduledTime"],
                "scheduled_interval_days": interval_days[
                    str(details["interval"]).lower()
                ],
                "scheduled_interval_time": "1",
                "status": "1",
                "emailid": json.dumps(details["emailTo"]),
                "scheduler_period": details["interval"],
                "customer_id": details["customer_id"],
                "emailcc": json.dumps(details["emailCC"]),
                "start_date": details["startDate"],
                "report_title": details["reportTitle"],
                "report_ideb": details["selectedreport"],
                "email_body_content": details["emailBody"],
                "reportattachment": json.dumps(details["reportattachment"]),
            }
            logging.debug("Current value for update: %s", current_value)

            if database_type =="mysql":
                database_url = self.mysql_database_url
                database_service = MySQLServices(**database_url)
                database_conn = database_service.connect()
                cursor = database_conn.cursor(dictionary=True)
            elif database_type == 'oracle':
                database_url = self.oracle_database_url
                database_service = OracleServices(**database_url)
                database_conn = database_service.connect()
                
            elif database_type == 'postgres':
                database_url = self.postgres_database_url
                database_service = PostgreSQLServices(**database_url)
                database_conn = database_service.connect()
                cursor = database_conn.cursor(cursor_factory=RealDictCursor)

            
            cursor.execute(
                f"SELECT scheduled_id, scheduled_time, scheduled_interval_days, "
                "scheduled_interval_time, status, emailid, scheduler_period, customer_id, "
                "emailcc, start_date, report_title, report_ideb, email_body_content, reportattachment "
                f"FROM {self.dashboard_schedulerinfo} WHERE scheduled_id = %s AND customer_id = %s",
                (
                    current_value["scheduled_id"],
                    current_value["customer_id"],
                ),
            )

            result = cursor.fetchone()
            logging.debug("Database result for update: %s", result)
            if result:
                differences = self.compare_dictionaries(result, current_value)
                del differences["values_diff"]["scheduled_id"]
                
                update_query = self.generate_update_query(
                    f"{self.dashboard_schedulerinfo}",
                    differences["values_diff"],
                    "scheduled_id",
                    current_value["scheduled_id"],
                )
                update_query = (
                    update_query
                    + f" and customer_id={current_value['customer_id']}"
                )

                cursor.execute(update_query)
            database_conn.commit()
            logging.info(
                "Scheduler updated successfully for scheduleid: %s",
                current_value["scheduled_id"],
            )
            return {"statusCode":self.conf['codes']['success'],"status": "success", "message": "Scheduler Updated Successfully!"}
        except HTTPException as unexpected_exception:
            logging.error("Unexpected HTTP error: %s", unexpected_exception)
            raise HTTPException(
                status_code=500,
                detail={"statusCode":self.conf['codes']['internal error'],"error":f"internal error {str(unexpected_exception)}"}
            )
        except Exception as exception:
            logging.error("Error updating scheduler: %s", exception)
            return {"statusCode":self.conf['codes']['internal error'],"status": "Failed", "message": "Unable to update the scheduler!"}
        finally:
            if "cursor" in locals() and cursor:
                cursor.close()
            if "database_conn" in locals() and database_conn:
                database_conn.close()

    def delete_scheduler(self, details: dict):
        # Configure logging
        cursor_logger = common.CustomLogger()
        logging = cursor_logger.setup_logger()
        logging.info("Deleting scheduler with details: %s", details)
        try:
            customer_id = details["customer_id"]
            scheduled_id = details["scheduleid"]
            database_type = details['database_type']
            # database_mysql = db_manager.get_mysql_connection(self.mysql_database_url)
            if database_type =="mysql":
                database_url = self.mysql_database_url
                database_service = MySQLServices(**database_url)
                database_conn = database_service.connect()
                cursor = database_conn.cursor(dictionary=True)
            elif database_type == 'oracle':
                database_url = self.oracle_database_url
                database_service = OracleServices(**database_url)
                database_conn = database_service.connect()
                
            elif database_type == 'postgres':
                database_url = self.postgres_database_url
                database_service = PostgreSQLServices(**database_url)
                database_conn = database_service.connect()
                cursor = database_conn.cursor(cursor_factory=RealDictCursor)

            # cursor.execute(
            #     f"SELECT `scheduleid` FROM {self.dashboard_schedulerinfo} WHERE "
            #     "scheduleid=%s and customer_id=%s",
            #     (
            #         scheduleid,
            #         customer_id,
            #     ),
            # )
            cursor.execute(
                f"SELECT scheduled_id FROM {self.dashboard_schedulerinfo} WHERE "
                "scheduled_id = %s AND customer_id = %s",
                (
                    scheduled_id,
                    customer_id,
                ),
            )

            result = cursor.fetchone()
            logging.debug("Database result for delete: %s", result)
            if result:
                delete_query = (
                    f"DELETE FROM {self.dashboard_schedulerinfo} WHERE "
                    "scheduled_id=%s and customer_id=%s"
                )
                cursor.execute(delete_query, (scheduled_id, customer_id))
                database_conn.commit()
                logging.info(
                    "Scheduler deleted successfully for scheduleid: %s", scheduled_id
                )
                return {
                    "statusCode":self.conf['codes']['success'],
                    "status": "success",
                    "message": "Scheduler Deleted Successfully!",
                }
            else:
                logging.warning(
                    "Scheduler does not exist for scheduleid: %s", scheduled_id
                )
                database_conn.commit()
                return {"statusCode":self.conf['codes']['no records'],"status": "failed", "message": "Scheduler not exist."}
        except HTTPException as unexpected_exception:
            raise HTTPException(
                status_code=500,
                detail={"statusCode":self.conf['codes']['internal error'],"error":f"internal error {str(unexpected_exception)}"}
            )
        except Exception as exception:
            logging.error("Error deleting scheduler: %s", exception)
            return {"statusCode":self.conf['codes']['internal error'],"status": "Failed", "message": "Unable to delete the scheduler!"}
        finally:
            if "cursor" in locals() and cursor:
                cursor.close()
            if "database_conn" in locals() and database_conn:
                database_conn.close()

    def compare_dictionaries(self, dict_db, dict_current):
        try:
            # Configure logging
            cursor_logger = common.CustomLogger()
            logging = cursor_logger.setup_logger()
            differences = {}
            values_diff = {}
            db_value = None
            for key in dict_current.keys():
                if key in dict_db:

                    if dict_db[key] != dict_current[key]:
                        # Handle special case for datetime objects
                        if isinstance(dict_db[key], datetime):
                            db_value = dict_db[key].strftime("%Y-%m-%d %H:%M:%S")

                            logging.debug(
                                "Datetime value comparison - DB: %s, Current: %s",
                                db_value,
                                dict_current[key],
                            )
                            current_value = dict_current[key]
                            if current_value != db_value:
                                values_diff[key] = current_value
                        else:
                            values_diff[key] = dict_current[key]

            differences["values_diff"] = values_diff
            logging.debug(
                "Datetime value comparison - DB: %s, Current: %s",
                db_value,
                dict_current[key],
            )
            return differences
        except Exception as e:
            logging.error("Error: %s",e)
            return None

    def generate_update_query(
        self, table_name, values_diff, condition_column, condition_value
    ):
        # Configure logging
        cursor_logger = common.CustomLogger()
        logging = cursor_logger.setup_logger()
        update_query = f"UPDATE {table_name} SET "
        logging.debug("Generating update query for table: %s", table_name)

        for key, value in values_diff.items():

            if value is None:
                update_query += f"{key} = null, "
            else:
                update_query += f"{key} = '{value}', "

        update_query = update_query[:-2]  # Remove the trailing comma and space
        update_query += f" WHERE {condition_column} = '{condition_value}'"
        logging.debug("Generated update query: %s", update_query)
        return update_query

    def list_scheduler_by_id(self, details: dict):
        # Configure logging
        cursor_logger = common.CustomLogger()
        logging = cursor_logger.setup_logger()
        logging.info("Listing scheduler by ID with details: %s", details)
        database_type = details['database_type']

        try:
            customer_id = details["customer_id"]
            scheduled_id = details["scheduleid"]
            # database_mysql = db_manager.get_mysql_connection(self.mysql_database_url)
            if database_type =="mysql":
                database_url = self.mysql_database_url
                database_service = MySQLServices(**database_url)
                database_conn = database_service.connect()
                cursor = database_conn.cursor(dictionary=True)
            elif database_type == 'oracle':
                database_url = self.oracle_database_url
                database_service = OracleServices(**database_url)
                database_conn = database_service.connect()
                
            elif database_type == 'postgres':
                database_url = self.postgres_database_url
                database_service = PostgreSQLServices(**database_url)
                database_conn = database_service.connect()
                cursor = database_conn.cursor(cursor_factory=RealDictCursor)

            cursor.execute(
                f"SELECT scheduled_id, scheduled_time, scheduled_interval_days, "
                "scheduled_interval_time, status, emailid, scheduler_period, customer_id, "
                "emailcc, start_date, report_title, report_ideb, email_body_content, reportattachment "
                f"FROM {self.dashboard_schedulerinfo} WHERE scheduled_id = %s AND customer_id = %s",
                (scheduled_id, customer_id),
            )

            Schedulers = cursor.fetchone()
            database_conn.commit()
            logging.info("Scheduler listed successfully for scheduleid: %s", scheduled_id)
            return {"statusCode":self.conf['codes']['success'],"status": "success", "Schedulers": Schedulers}
        except HTTPException as unexpected_exception:
            logging.error("Unexpected HTTP error: %s", unexpected_exception)
            raise HTTPException(
                status_code=500,
                detail={"statusCode":self.conf['codes']['internal error'],"error":f"internal error {str(unexpected_exception)}"}
            )
        except Exception as exception:
            logging.error("Error listing scheduler by ID: %s", exception)
            return {"statusCode":self.conf['codes']['internal error'],"status": "Failed", "message": "Unable to list the scheduler!"}
        finally:
            if "cursor" in locals() and cursor:
                cursor.close()
            if "database_conn" in locals() and database_conn:
                database_conn.close()

    def fetch_usernames(self, details):
        """
        Fetch usernames that match the given name.
 
        Args:
            details (dict): A dictionary containing the name to search for and database type.
 
        Returns:
            dict: A dictionary containing the status and a list of usernames that match the given name.
        """
        # Configure logging
        cursor_logger = common.CustomLogger()
        logging = cursor_logger.setup_logger()
        logging.info("Listing usernames with details: %s", details)
 
        try:
            # Validate input
            if "username" not in details or "database_type" not in details:
                logging.error("Invalid input: name and database_type are required")
                return {"status": "error", "message": "Invalid input"}
 
            name = details['username']
            database_type = details['database_type']

            if database_type =="mysql":
                database_url = self.mysql_database_url
                database_service = MySQLServices(**database_url)
                database_conn = database_service.connect()
                cursor = database_conn.cursor(dictionary=True)
            elif database_type == 'oracle':
                database_url = self.oracle_database_url
                database_service = OracleServices(**database_url)
                database_conn = database_service.connect()     
            elif database_type == 'postgres':
                database_url = self.postgres_database_url
                database_service = PostgreSQLServices(**database_url)
                database_conn = database_service.connect()
                cursor = database_conn.cursor(cursor_factory=RealDictCursor)
            else:
                logging.error("Unsupported database type: %s", database_type)
                return {"statusCode":self.conf['codes']['database error'],"status": "error", "message": "Unsupported database type"}

 
            # Execute query
            table = config['database_tables']['user_account']
            query = "SELECT user_email_id FROM %s".format(table)
            
            try:
                cursor.execute(query)
            except MySQLError as e:
                logging.error("Failed to execute query: %s", e)
                return {"statusCode":self.conf['codes']['database error'],"status": "error", "message": "Failed to execute query"}
 
            # Fetch usernames
            usernames = [item for row in cursor.fetchall() for item in row]
            logging.info("Found %s usernames matching '%s'", len(usernames), name)
            return {"statusCode":self.conf['codes']['success'],"status": "success", "usernames": usernames}
        except Exception as e:
            logging.error("Unexpected error: %s", e)
            return {"statusCode":self.conf['codes']['internal error'],"status": "error", "message": "Unexpected error"}
