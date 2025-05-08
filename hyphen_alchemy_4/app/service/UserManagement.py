'''
module for user management
'''
import os
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
# pylint: disable=E0401
# pylint: disable=raise-missing-from
# pylint: disable=broad-exception-caught
from utilities import loggings as common
from database_services.common import CommonDatabaseServices , MySQLServices , PostgreSQLServices , OracleServices
from psycopg2.extras import RealDictCursor

db_manager = CommonDatabaseServices()


class UserManagement:
    '''
    Class for user management
    '''
    def __init__(self, conf):
        """Initialize the UserManagement class with the configuration details"""
        self.conf = conf
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.base_dir = os.getcwd()
        self.logfilepath = os.path.join(self.base_dir, 'logs')
        self.configfilepath = os.path.join(os.getcwd(), 'config/config.ini')
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
        self.user_group = conf['database_tables']['user_group']
        self.user_group_map= conf['database_tables']['user_group_map']
        self.group_report_map = conf['database_tables']['group_report_map']
        self.report_template = conf['database_tables']['report_template']
        self.user_account = conf['database_tables']['user_account']
        self.db_group_map = conf["database_tables"]['db_group_map']
        self.database_details = conf["database_tables"]['database_details']
        self.view_db_group = conf["database_tables"]['view_db_group']

    def setup_middleware(self):
        '''
        method to setup middleware
        '''
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
    
    def get_password_hash(self, password: str) -> str:
        """Generate password hash"""
        return self.pwd_context.hash(password)

    def save_user(self, details: dict):  
        """
        This Method retrieves the customer ID associated with the given email,  
        hashes the password, and inserts a new user record into the user account  
        and user group mapping tables. It also logs the process and handles  
        exceptions related to database operations.  
        """
        try:
            cursor_logger = common.CustomLogger()
            logging = cursor_logger.setup_logger()
            logging.info("Attempting to save user with details: %s", details)
            database_type = details.get("database_type")
            new_user_email = details.get("new_user_email")
            password = details.get("password")
            email = details.get("email")
            group_id = details.get("group_id")
            date = datetime.now()

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

            # Fetch customer_id
            cursor.execute(f"SELECT customer_id FROM {self.user_account} WHERE \
                            user_email_id = %s", (email,))
            customer_result = cursor.fetchone()
            if customer_result:
                customer_id = customer_result["customer_id"]
            else:
                logging.warning("No customer found for email: %s", email)
                # Handle case where no customer found for the given email
                return {"statusCode":self.conf['codes']['no records'],"message":"No customer \
                        found for email: {}".format(email)}

            hashed_password = self.get_password_hash(password)

            # Insert into user_account
            cursor.execute(f"INSERT INTO {self.user_account} \
                            VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (new_user_email, hashed_password, customer_id, group_id, \
                    'Active', 'N', date))

            cursor.execute(f"INSERT INTO {self.user_group_map} \
                            (user_email_id,group_id,created_at) \
                            VALUES (%s, %s, %s)",(new_user_email, group_id, date))
            # Commit the transaction
            database_conn.commit()
            logging.info("User %s added successfully", new_user_email)
            
            return {"statusCode":self.conf['codes']['success'],"status": "success", "message": "User Added Successfully!"}
        except HTTPException as unexpected_exception:
            logging.error("Unexpected HTTP error: %s", unexpected_exception)
            raise HTTPException(
                status_code=500,
                detail={"statusCode":self.conf['codes']['internal error'],"error":f"internal error {str(unexpected_exception)}"}
            )
        except Exception as exception:
            logging.error("Error saving user: %s", exception)
            return {"statusCode":self.conf['codes']['already exists'],"status":"Failed","message":"User Already Exist !"}
        finally:
            if "cursor" in locals() and cursor:
                cursor.close()
            if "database_conn" in locals() and database_conn:
                database_conn.close()

    def fetch_details(self, details: dict):
        """
        Fetches user details, including associated groups and reports, from the database based on the provided email. Supports MySQL database connections.
        """
        try:
            # Configure logging
            cursor_logger = common.CustomLogger()
            logging = cursor_logger.setup_logger()
            logging.info("Fetching details for: %s", details)
            email = details["email"]
            database_type = details.get("database_type")

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


            cursor.execute(f"SELECT customer_id FROM {self.user_account} \
                            WHERE user_email_id = %s", (email,))
            customer_result = cursor.fetchone()
            if customer_result:
                customer_id = customer_result["customer_id"]
            else:
                logging.warning("No customer found for email: %s", email)
                # Handle case where no customer found for the given email
                return {"statusCode":self.conf['codes']['no records'],"message":"No customer \
                        found for email: {}".format(email)}

            cursor.execute(f"SELECT group_id, groupname,customer_id \
                        FROM {self.user_group} WHERE customer_id=%s", (customer_id,))
            group_result = cursor.fetchall() 
            
            
            cursor.execute(f"SELECT group_id FROM {self.user_group_map} WHERE user_email_id=%s", (email,))
            user_group = cursor.fetchall()
            
            user_group_ids = set(row['group_id'] for row in user_group)

            # Split group_result into matched and unmatched groups
            matched_groups = [row for row in group_result if row['group_id'] in user_group_ids]
            unmatched_groups = [row for row in group_result if row['group_id'] not in user_group_ids]
            
            print("user_group_ids", user_group_ids)
            print("matched_groups", matched_groups)
            print("unmatched_groups", unmatched_groups)
            
            # Combine matched groups (in order of user_group_ids) and unmatched groups
            group_result = (
                [row for id in user_group_ids for row in matched_groups if row['group_id'] == id] 
                + unmatched_groups
            )
            
            #Report Associated with this group
            reports = {}
            if group_result:
                for group in group_result:
                    cursor.execute(f"SELECT report_id \
                                    FROM {self.group_report_map} WHERE group_id=%s",
                                (group['group_id'],))
                    reports_id = cursor.fetchall()
                    if len(reports_id)>0:
                        for report_id in reports_id:
                            cursor.execute(f"SELECT report_id,report_template_name, \
                                        defined_query FROM {self.report_template} \
                                            WHERE report_id=%s",
                                        (report_id['report_id'],))
                            report = cursor.fetchall()
                            reports[group['groupname']] = report
                    else:
                        reports[group['groupname']] = []
            logging.info("Fetched details for email: %s", email)
            return {"statusCode":self.conf['codes']['success'],"status": "success", "group_names": group_result,"assigned_reports":reports}
    
        except Exception as e:
            logging.error("Error fetching details: %s", e)
            raise HTTPException(status_code=500, detail={"statusCode":self.conf['codes']['internal error'],"error":str(e)}) from e
        finally:
            if "cursor" in locals() and cursor:
                cursor.close()
            if "database_conn" in locals() and database_conn:
                database_conn.close()
    
    def delete_user(self,details: dict):
        """
        Deletes a user from the database based on the provided email. Supports MySQL as the database type. If the user exists, it removes the user's records from both the user group mapping and user account tables. Returns a success or failure message accordingly.
        """
        try:
            database_type = details.get("database_type")
            # new_user_email = details.get("new_user_email")
            email = details.get("email")
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
                f"SELECT user_email_id, password, group_id  \
                    FROM {self.user_account} WHERE user_email_id = %s",
                (email,))
            customer_result = cursor.fetchone()
            if customer_result:
                cursor.execute(f"DELETE FROM {self.user_group_map} WHERE user_email_id = %s", (email,))
                cursor.execute(f"DELETE FROM {self.user_account} WHERE user_email_id = %s",
                (email,))
            else:
                return {"statusCode":self.conf['codes']['no records'],"message":f"No customer found for email: {email}"}
            database_conn.commit()
            return {"statusCode":self.conf['codes']['success'],"status": "success", "message": "User Removed Successfully!"}
        except Exception as unexpected_exception:
            raise HTTPException(
                status_code=500,
                detail={"statusCode":self.conf['codes']['internal error'],"error":f"internal error {str(unexpected_exception)}"}
            )
        finally:
            if "cursor" in locals() and cursor:
                cursor.close()
            if "database_conn" in locals() and database_conn:
                database_conn.close()

    def edit_user(self,details: dict):
        """
        The Method fetches the user details based on the provided email and updates the password with a newly hashed one.
        """
        try:
            # Configure logging
            cursor_logger = common.CustomLogger()
            logging = cursor_logger.setup_logger()
            logging.info("Editing user with details: %s", details)
            # current_password = details.get("current_password")
            new_password = details.get("new_password")
            database_type = details.get("database_type")
            email = details.get("email")

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

            # Fetch customer_id
            cursor.execute(f"SELECT user_email_id, password, group_id FROM \
                            {self.user_account} WHERE user_email_id = %s", (email,))
            customer_result = cursor.fetchone()
            if customer_result:
                # match_password = self.verify_password(current_password,customer_result['password'])
                # if match_password:
                hashed_password = self.get_password_hash(new_password)
                cursor.execute(f"UPDATE {self.user_account} SET password=%s WHERE \
                                user_email_id = %s",(hashed_password,email,))
                database_conn.commit()
                logging.info("Password reset successfully for email: %s", email)
                return {"statusCode":self.conf['codes']['success'],"status": "success", "message": "Password Reset Successfully!"}

            logging.warning("No customer found for email: %s", email)
            return {"statusCode":self.conf['codes']['no records'],"message":f"No customer found for email: {email}"}

        except Exception as unexpected_exception:
            logging.error("Error editing user: %s", unexpected_exception)
            raise HTTPException(
                status_code=500,
                detail={"statusCode":self.conf['codes']['internal error'],"error":f"internal error {str(unexpected_exception)}"}
            )
        finally:
            if "cursor" in locals() and cursor:
                cursor.close()
            if "database_conn" in locals() and database_conn:
                database_conn.close()

    def assign_group(self, details: dict):
        """
        Assigns user groups based on the provided details by updating the database. First, it removes existing group mappings for each user, then inserts new group mappings.
        """
        try:
            cursor_logger = common.CustomLogger()
            logging = cursor_logger.setup_logger()
            logging.info("Assigning group with details: %s", details)
            customer_id = details["customer_id"]          
            user_details = details["user_details"]
            database_type = details.get("database_type")


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
            
            # fetch user_group details

            # for user in user_details:
            #     group_ids = user["group_id"]
            #     user_email = user["user_email"]
            #     cursor.execute("SELECT group_id FROM user_account WHERE user_email = %s", (user_email,))
            #     result = cursor.fetchone()
            #     current_group_id = result["group_id"] if result else None
            #     new_group_ids = [gid for gid in group_ids if str(gid) != str(current_group_id)]

            #     assigned_group_id = new_group_ids[0]
            #     cursor.execute(
            #         "UPDATE user_account SET group_id = %s WHERE user_email = %s",
            #         (assigned_group_id, user_email)
            #     )
            #     database_conn.commit()

            #     if len(group_ids) > 0:
            #         cursor.execute(f"DELETE from {self.user_group_map} WHERE user_email_id=%s",(user_email,))
            #         database_conn.commit()
            #         for group_id in group_ids:
            #             date = datetime.now()
            #             cursor.execute(f"INSERT INTO {self.user_group_map} \
            #                     (user_email_id,group_id,created_at) \
            #                     VALUES (%s, %s, %s)",(user_email, group_id, date))
            #             database_conn.commit()

            for user in user_details:
                group_ids = user["group_id"]
                user_email = user["user_email"]

                # Get current group
                cursor.execute("SELECT group_id FROM user_account WHERE user_email_id = %s", (user_email,))
                result = cursor.fetchone()
                current_group_id = str(result["group_id"])

                # Get new group_ids excluding current
                new_group_ids = [str(gid) for gid in group_ids if str(gid) != current_group_id]

                # Assign one new group to user_account if needed
                if new_group_ids:
                    assigned_group_id = new_group_ids[0]
                    cursor.execute(
                        "UPDATE user_account SET group_id = %s WHERE user_email_id = %s",
                        (assigned_group_id, user_email)
                    )

                cursor.execute("SELECT group_id FROM user_group WHERE group_id IN %s", (tuple(group_ids),))
                valid_group_ids = {str(row["group_id"]) for row in cursor.fetchall()}

                valid_group_ids_to_insert = [gid for gid in group_ids if str(gid) in valid_group_ids]

                cursor.execute(f"DELETE FROM {self.user_group_map} WHERE user_email_id = %s", (user_email,))
                
                if valid_group_ids_to_insert:
                    values_to_insert = [(user_email, gid, datetime.now()) for gid in valid_group_ids_to_insert]
                    cursor.executemany(
                        f"INSERT INTO {self.user_group_map} (user_email_id, group_id, created_at) VALUES (%s, %s, %s)",
                        values_to_insert
                    )

            database_conn.commit()

            logging.info("Group updated successfully for customer_id: %s", customer_id)
            return {"statusCode":self.conf['codes']['success'],"status": "success", "message":"Group Updated Successfully."}
        except Exception as exception:
            logging.error("Error assigning group: %s", exception)
            return {"statusCode":self.conf['codes']['internal error'],"status": "failed", "message":f"Failed to update group due to {exception}"}   
        finally:
            if "cursor" in locals() and cursor:
                cursor.close()
            if "database_conn" in locals() and database_conn:
                database_conn.close() 
        
    def db_source_group_map(self, details: dict):
        """
        The method retrieves user details from the provided dictionary, removes existing group mappings for each user's database entry, and inserts new group assignments.
        """
        try:
            cursor_logger = common.CustomLogger()
            logging = cursor_logger.setup_logger()
            logging.info("Assigning group with details: %s", details)
            customer_id = details["customer_id"]          
            user_details = details["user_details"]
            database_type = details.get("database_type")

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

            for user in user_details:
                group_ids = user["group_id"]
                db_details_id = user["db_details_id"]
                if len(group_ids) > 0:
                    cursor.execute(f"DELETE from {self.db_group_map} WHERE db_details_id=%s",(db_details_id,))
                    database_conn.commit()
                    for group_id in group_ids:
                        date = datetime.now()
                        cursor.execute(f"INSERT INTO {self.db_group_map} \
                                (db_details_id,group_id,created_at) \
                                VALUES (%s, %s, %s)",(db_details_id, group_id, date))
                        database_conn.commit()

            logging.info("Group updated successfully for customer_id: %s", customer_id)
            return {"statusCode":self.conf['codes']['success'],"status": "success", "message":"Group Updated Successfully."}
        except Exception as exception:
            logging.error("Error assigning group: %s", exception)
            return {"statusCode":self.conf['codes']['internal error'],"status": "failed", "message":f"Failed to update group due to {exception}"} 
        finally:
            if "cursor" in locals() and cursor:
                cursor.close()
            if "database_conn" in locals() and database_conn:
                database_conn.close()

    def get_schema_data(self, details:dict):
        """
        Retrieves database details, including `db_details_id`, `rdbms_name`, and `db_schema_name`,  
        for the specified customer. If database entries exist, it also fetches related group  
        information and maps database IDs to their respective groups.
        """
        try:
            cursor_logger = common.CustomLogger()
            logging = cursor_logger.setup_logger()
            logging.info("Get Schema details with : %s", details)
            customer_id = details["customer_id"]
            database_type = details.get("database_type")
            
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

            cursor.execute(f"SELECT db_details_id, rdbms_name"
                            f", db_schema_name FROM {self.database_details} WHERE customer_id = %s", (customer_id,))
            db_results = cursor.fetchall()
            if len(db_results) > 0:
                cursor.execute(f"SELECT db_details_id, group_id, rdbms_name"
                            f", db_schema_name FROM {self.view_db_group} WHERE customer_id = %s", (customer_id,))
                group_info = cursor.fetchall()
                group_map = {}
                for record in group_info:
                    db_id = record['db_details_id']
                    group_id = record['group_id']
                    if db_id not in group_map:
                        group_map[db_id] = []
                    group_map[db_id].append(group_id)

                output = []
                for record in db_results:
                    db_id = record['db_details_id']
                    output.append({
                        'db_details_id': db_id,
                        'rdbms_name': record['rdbms_name'],
                        'db_schema_name': record['db_schema_name'],
                        'group_id': group_map.get(db_id, [])
                    })
                # output = list(result.values())
                logging.info("DB details fetched successfully for customer_id: %s", customer_id)
                return {"statusCode":self.conf['codes']['success'],"status": "success", "message": "DB details fetched Successfully.","result":output}
            
            return {"statusCode":self.conf['codes']['no records'],"status": "success", "message": f"No Database found for customer_id: {customer_id}"}
    
        except Exception as exception:
            logging.error("Error assigning group: %s", exception)
            return {"statusCode":self.conf['codes']['internal error'],"status": "failed", "message": f"Failed to fetch database details due to {exception}"}
        finally:
            if "cursor" in locals() and cursor:
                cursor.close()
            if "database_conn" in locals() and database_conn:
                database_conn.close()
