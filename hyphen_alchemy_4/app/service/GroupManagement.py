import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
from utilities import loggings as common
# from utilities.database_services import DatabaseServices
from database_services.common import CommonDatabaseServices , MySQLServices , PostgreSQLServices , OracleServices
from psycopg2.extras import RealDictCursor

db_manager = CommonDatabaseServices()


class GroupManagement:
    """
    GroupManagement class handles operations related to user groups such as updating group names,
    checking group members, and deleting groups.
    """
    def __init__(self, conf):
        """
        Initializes the GroupManagement class with configuration details.

        Args:
            conf (dict): Configuration dictionary containing database and other settings.
        """
        self.conf = conf
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.base_dir = os.getcwd()
        self.logfilepath = os.path.join(self.base_dir, "logs")
        self.configfilepath = os.path.join(os.getcwd(), "config/config.ini")
        self.app = FastAPI()
        self.setup_middleware()
        self.mysql_database_url = {
            "username": self.conf['mysql']['mysql_username'],
            "password": self.conf['mysql']['mysql_password'],
            "host": self.conf['mysql']['mysql_host'],
            "port": self.conf['mysql']['mysql_port'],
            "database": self.conf['mysql']['mysql_new_schema'],
        }
        self.postgres_database_url = {
            "username": conf['postgres']['postgres_username'],
            "password": conf['postgres']['postgres_password'],
            "host": conf['postgres']['postgres_host'],
            "port": conf['postgres']['postgres_port'],
            "database": conf['postgres']['postgres_schema'],
        }

        self.user_group = conf['database_tables']['user_group']
        self.user_group_map = conf['database_tables']['user_group_map']
        self.group_report_map = conf['database_tables']['group_report_map']
        self.group_accessrights = conf['database_tables']['group_accessrights']
        self.dashboard_access_right = conf['database_tables']['dashboard_access_right']
        self.user_account = conf['database_tables']['user_account']
        self.db_group_map = conf['database_tables']['db_group_map']

    def setup_middleware(self):
        """
        Sets up CORS middleware for the FastAPI application.
        """
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    def update_group_name(self, detail):
        """
        Updates the name of a user group in the database.

        Args:
            detail (dict): Dictionary containing new group name, group ID, and customer ID.

        Returns:
            dict: Status and message indicating the result of the operation.
        """
        # Configure logging
        cursor_logger = common.CustomLogger()
        logging = cursor_logger.setup_logger()
        logging.debug(f"Update_Group_Name called with detail: {detail}")
        new_group_name = detail["new_group_name"]
        group_id = detail["group_id"]
        customer_id = detail["customer_id"]
        database_type = detail['database_type']

        try:
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

            
            select_query = f"SELECT group_id,groupname FROM {self.user_group} \
                WHERE group_id=%s and customer_id=%s"
            cursor.execute(select_query, (group_id, customer_id))
            result = cursor.fetchone()
            if result is None:
                return {
                    "statusCode":self.conf['codes']['no records'],
                    "status": "success",
                    "message": f"No Group exist with name {group_id}",
                }
            update_query = f"UPDATE {self.user_group} SET groupname=%s \
                WHERE group_id=%s and customer_id=%s"
            logging.debug(f"Update query: {update_query}")
            cursor.execute(
                update_query, (new_group_name, result["group_id"], customer_id)
            )
            database_conn.commit()

            return {"statusCode":self.conf['codes']['success'], "message": "GroupName Updated Successfully!"}
        except HTTPException as unexpected_exception:
            raise HTTPException(
                status_code=500,
                detail={"statusCode":self.conf['codes']['internal error'],"error":f"internal error {str(unexpected_exception)}"}
            )
        except Exception as exception:
            return {
                "statusCode":self.conf['codes']['bad request'],
                "message": f"Unable to update GroupName due to {exception}",
            }
        finally:
            if "cursor" in locals() and cursor:
                cursor.close()
            if "database_conn" in locals() and database_conn:
                database_conn.close()

    def check_group_members(self, detail):
        """
        Checks the members of a user group in the database.

        Args:
            detail (dict): Dictionary containing group name, group ID, and customer ID.

        Returns:
            dict: Status, message, and count of group members.
        """
        # Configure logging
        cursor_logger = common.CustomLogger()
        logging = cursor_logger.setup_logger()
        logging.debug(f"Check_group called with detail: {detail}")
        customer_id = str(detail["customer_id"])
        group_name = detail["groupname"]
        group_id = str(detail["group_id"])
        database_type = detail['database_type']

        try:
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

            select_query = f"SELECT group_id,groupname FROM {self.user_group} \
                WHERE group_id=%s and customer_id=%s"
            cursor.execute(select_query, (group_id, customer_id))
            result = cursor.fetchone()
            if result is None:
                return {
                    "statusCode":self.conf['codes']['no records'],
                    "status": "success",
                    "message": f"No Group exist with name {group_id}",
                }
            member_query = (
                f"SELECT user_email_id FROM {self.user_group_map} WHERE group_id=%s"
            )
            logging.debug(f"Associate Member query: {member_query}")
            cursor.execute(member_query, (result["group_id"],))
            members = cursor.fetchall()
            if members is None:
                return {
                    "statusCode":self.conf['codes']['no records'],
                    "message": f"No members found for group {group_name}",
                    "count": 0,
                }
            return {
                "statusCode":self.conf['codes']['success'],
                "message": f"Members found for group {group_name}",
                "count": len(members),
            }
    
        except HTTPException as unexpected_exception:
            raise HTTPException(
                status_code=500,
                detail={"statusCode":self.conf['codes']['internal error'],"error":f"internal error {str(unexpected_exception)}"}
            )
        except Exception as exception:
            return {
                "statusCode":self.conf['codes']['bad request'],
                "status": "Failed",
                "message": f"Unable to update GroupName due to {exception}",
            }
        finally:
            if "cursor" in locals() and cursor:
                cursor.close()
            if "database_conn" in locals() and database_conn:
                database_conn.close()

    def delete_group(self, detail):
        """
        Deletes a user group and its associated data from the database.

        Args:
            detail (dict): Dictionary containing group name, group ID, and customer ID.

        Returns:
            dict: Status and message indicating the result of the operation.
        """
        # Configure logging
        cursor_logger = common.CustomLogger()
        logging = cursor_logger.setup_logger()
        logging.debug(f"delete_group called with detail: {detail}")
        customer_id = str(detail["customer_id"])
        group_id = str(detail["group_id"])
        database_type = detail['database_type']
        try:
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

            delete_query = f"DELETE FROM {self.user_group_map} WHERE group_id = %s"
            cursor.execute(delete_query, (group_id,))
            database_conn.commit()

            delete_query = f"DELETE FROM {self.db_group_map} WHERE group_id = %s"
            cursor.execute(delete_query, (group_id,))
            database_conn.commit()

            group_report_delete_query = (
                f"DELETE FROM {self.group_report_map} WHERE group_id = %s"
            )
            cursor.execute(group_report_delete_query, (group_id,))
            database_conn.commit()

            group_accessrights_query = (
                f"DELETE FROM {self.group_accessrights} WHERE group_id = %s"
            )
            cursor.execute(group_accessrights_query, (group_id,))
            database_conn.commit()

            delete_dashboard_access_right = (
                f"DELETE FROM {self.dashboard_access_right} WHERE group_id = %s"
            )
            cursor.execute(delete_dashboard_access_right, (group_id,))
            database_conn.commit()

            delete_user_account = (
                f"DELETE FROM {self.user_account} WHERE group_id = %s"
            )
            cursor.execute(delete_user_account, (group_id,))
            database_conn.commit()

            delete_group = f"DELETE FROM {self.user_group} WHERE group_id = %s"
            cursor.execute(delete_group, (group_id,))
            database_conn.commit()

            logging.info(f"Removed Group for customer_id {customer_id}")
            return {
                "statusCode":self.conf['codes']['success'],
                "message": f"Removed frame for customer_id {customer_id}",
            }
        except HTTPException as unexpected_exception:
            logging.error(f"Unexpected error: {unexpected_exception}")
            raise HTTPException(
                status_code=500,
                detail={"statusCode":self.conf['codes']['internal error'],"error":f"internal error {str(unexpected_exception)}"}
            )
        except Exception as exception:
            logging.error(f"Error occurred in delete_frame: {exception}")
            return {
                "statusCode":self.conf['codes']['bad request'],
                "status": "Failed",
                "message": f"Unable to delete the Group due to {exception}",
            }
        finally:
            if "cursor" in locals() and cursor:
                cursor.close()
            if "database_conn" in locals() and database_conn:
                database_conn.close()
