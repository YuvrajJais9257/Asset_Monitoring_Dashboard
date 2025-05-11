"""
Module for handling scheduled tasks such as database connections, report generation, and email notifications
"""
import json
import os
import time
from datetime import datetime,timedelta
from functools import wraps
import mysql.connector
import psycopg2
import vertica_python
import pandas as pd
from bs4 import BeautifulSoup
from service.SendEmailOffice365 import SendEmailOffice365
from service.GeneratePDFandExcel import generate_pdf_report, generate_excel_report
from utilities.purging_reports import delete_old_files
from utilities.config import config
import utilities.loggings as LOGGINGS
from service.MphasisPassword import MphasisScheduler
from psycopg2 import extras

path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "local_reports")
 
if not os.path.exists(path):
    os.makedirs(path)
# Purge old files
delete_old_files(os.path.join(os.path.dirname(os.path.abspath(__file__)), "local_reports"))

cursor_logger = LOGGINGS.CustomLogger()
logger = cursor_logger.setup_logger()
from  psycopg2.extras import RealDictCursor

def log_function_call(func):
    """Decorator to log the entry and exit of a function."""
    @wraps(func)
    def wrapper(*args, **kwargs):
        cursor_logger = LOGGINGS.CustomLogger()
        logger = cursor_logger.setup_logger()
        logger.info(f"Entering {func.__name__}")
        result = func(*args, **kwargs)
        logger.info(f"Exiting {func.__name__}")
        return result
    return wrapper

class ScheduledTask:
    """
    Handles scheduled tasks such as database connections, report generation, and\
    sending emails.
    """

    def __init__(self, conf):
        """Initializes the ScheduledTask object with configuration."""
        logger.info("scheduled task initialized")
        self.conn = None
        self.cursor = None
        self.res_flag = True
        self.dash_query_flag = False
        self.conf = conf
        self.database_type = conf['primary_database']['database_type']
        self.from_email = conf['schedulertask']['email']
        self.password = conf['schedulertask']['password']
        self.smtp = conf['schedulertask']['smtp']
        self.port = conf['schedulertask']['port']
        

    @log_function_call
    def connect_to_mysql(self):
        """Connects to a MySQL database."""
        logger.info("connecting to mysql db")
        self.conn = mysql.connector.connect(
            host=self.conf['mysql_email']['mysql_host'],
            port=self.conf['mysql_email']['mysql_port'],
            user=self.conf['mysql_email']['mysql_username'],
            password=self.conf['mysql_email']['mysql_password'],
            database=self.conf['mysql_email']['mysql_new_schema'],
        )
        self.cursor = self.conn.cursor(dictionary=True, buffered=True)
        logger.info("connected to mysql db")

    @log_function_call
    def connect_to_postgres(self):
        try:
            """Connects to a PostgreSQL database."""
            #print("connecting")
            logger.info("connecting to postgres db")
            postgres_config = {
                "host": self.conf['postgresql_email']['postgres_host'],
                "port": self.conf['postgresql_email']['postgres_port'],
                "user": self.conf['postgresql_email']['postgres_username'],
                "password": self.conf['postgresql_email']['postgres_password'],
                "database": self.conf['postgresql_email']['postgres_schema'],
            }
            self.conn = psycopg2.connect(**postgres_config)
            self.cursor = self.conn.cursor(cursor_factory=RealDictCursor)
            #print("connected")
            logger.info("connected to postgres db")
        except Exception as e:
            #print("failed to connect to db: ",e)
            logger.error("failed to connect to db: %s",e)

    @log_function_call
    def close_database_connection(self):
        """Closes the active database connection and cursor."""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()

    @log_function_call
    def run(self):
        """Main loop for the scheduled task."""
        
        try:
            while True:
                try:
                    #mphasis = MphasisScheduler()
                    #mphasis.process_password()
                    # self.connect_to_mysql()
                    

                    if self.database_type == "mysql":
                        self.connect_to_mysql()
                    elif self.database_type == "postgres":
                        self.connect_to_postgres()
                    
                    
                    now = datetime.now()
                    cursor_logger = LOGGINGS.CustomLogger()
                    logger = cursor_logger.setup_logger()
                    logger.info(f"Start Time is: {now}")

                    dashboard_query = f"SELECT * FROM \
                        {config['database_tables']['dashboard_schedulerinfo']}"

                    if self.res_flag:
                        logger.info("Executing dashboard query dataset")
                        self.dash_query_flag = True
                        self.cursor.execute(dashboard_query)

                        self.initiate_scheduler()

                    logger.info(f"End Time is: {now}")
                    self.close_database_connection()

                except Exception as error:
                    logger.error("Exception occurred: %s",error)
                    # print(error)
                    pass
                time.sleep(60)
        except Exception as e:
            logger.error(f"Exception occurred: {e}")
            
    @log_function_call
    def initiate_scheduler(self):
        """Processes scheduler to trigger email reports."""
        try:
            rows = self.cursor.fetchall()

            for res in rows:
                scheduled_time = res["scheduled_time"]
                interval = res["scheduler_period"]
                email_id = json.loads(res["emailid"])
                email_cc = json.loads(res["emailcc"])
                report_title = res["report_title"]
                email_body_content = res["email_body_content"]
                report_attachment = json.loads(res["reportattachment"])

                actual_time = datetime.now()

                if actual_time >= scheduled_time:
                    end_date = actual_time.strftime("%Y-%m-%d %H:%M:%S")
                    if (interval.lower() in ["daily", "dailymtd"]) and self._check_daily_time(scheduled_time,\
                                                                            actual_time):
                        self._trigger_email_report(report_attachment, email_id, email_cc,\
                                                    email_body_content, report_title,actual_time,\
                                                        end_date)

                    elif interval.lower() == "weekly" and self._check_weekly_time(scheduled_time,\
                                                                                actual_time):
                        self._trigger_email_report(report_attachment, email_id, email_cc, \
                                                email_body_content, report_title,actual_time,\
                                    end_date)

                    elif interval.lower() == "monthly" and self._check_monthly_time(scheduled_time,\
                                                                                    actual_time):
                        self._trigger_email_report(report_attachment, email_id,\
                                                email_cc, email_body_content, report_title,actual_time,\
                                end_date)
            
            logger.info("Initiated all schedulars")
        except Exception as e:
            logger.error("Error in initiate_scheduler: %s",e)

    def _check_daily_time(self, scheduled_time, actual_time):
        """Checks if the task should run on a daily schedule."""
        return actual_time.hour == scheduled_time.hour and actual_time.minute == \
            scheduled_time.minute

    def _check_weekly_time(self, scheduled_time, actual_time):
        """Checks if the task should run on a weekly schedule."""
        return (actual_time.weekday() == scheduled_time.weekday() and
                actual_time.hour == scheduled_time.hour and
                actual_time.minute == scheduled_time.minute)

    def _check_monthly_time(self, scheduled_time, actual_time):
        """Checks if the task should run on a monthly schedule."""
        return (actual_time.day == scheduled_time.day and
                actual_time.hour == scheduled_time.hour and
                actual_time.minute == scheduled_time.minute)

    def _trigger_email_report(self, report_attachment, email_id, email_cc, \
                              email_body_content, report_title,actual_time,\
                                end_date):
        """
        This method logs the email triggering process, calculates the start date based 
        on the provided actual time, and calls the fetch_and_send_email method to send 
        the email with the specified details.
        """
        cursor_logger = LOGGINGS.CustomLogger()
        logger = cursor_logger.setup_logger()
        logger.info("Triggering email report")
        start_date = (actual_time - timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S")
        self.fetch_and_send_email(self.cursor, report_attachment, email_id, email_cc,\
                                   email_body_content, report_title,start_date,end_date)

    @log_function_call
    def fetch_and_send_email(self, cursor, report_attachment, email_id, email_cc,\
                              email_body_content, report_title,start_date,end_date):
        """Fetches report data and sends reports via email."""
        data, report_query, db_config, db_type = self.fetch_data_from_database(cursor, \
                                                                               report_attachment)
        local_folder = "local_reports/"
        delete_old_files(local_folder)
        attachments = self._generate_reports(data, local_folder,start_date,end_date,db_type)

        emailer = SendEmailOffice365(self.from_email, self.password, self.smtp, self.port,logger)

        emailer.send_email_with_attachments(
            email_id,
            email_cc,
            f"{report_title} - {datetime.now().strftime('%Y-%m-%d')}",
            email_body_content,
            attachments,
        )

    def _generate_reports(self, data, local_folder,start_date,end_date,db_type):
        """Generates PDF or Excel reports and returns the file paths."""
        try:
            logger.info("inside generate report")
            attachments = []
            for format_type, report_data in data.items():
                logger.info(f"Format type in data.items() is: {format_type}")
                logger.info(f"Report_data in data.items() is: {report_data}")
                for report_id, df in report_data.items():
                    logger.info(f"Report ID in report_data is: {report_id}")
                    logger.info(f"DF in report_data.items is:{df}")
                    # filename = f"{local_folder}{report_id}-{datetime.now().strftime('%Y-%m-%d')}.{format_type}"
                    filename = f"{local_folder}{report_id}.{format_type}"
                    if format_type == "pdf":
                        logger.info("create pdf")
                        generate_pdf_report(df["report_query"], filename, df["db_config"],\
                                            report_id, df["db_type"])
                        logger.info("created pdf")
                    elif format_type == "xlsx":
                        logger.info("excel generation started")
                        generate_excel_report(df, filename, report_id, start_date,end_date)
                        logger.info("excel generated")
                    attachments.append(filename)
            logger.info("attach: %s ",attachments)
            return attachments
        except Exception as e:
            logger.error("Error in _generate_reports: %s",e)

    @log_function_call
    def fetch_data_from_database(self, cursor, report_ids):
        try:
            data = {}
            cursor_logger = LOGGINGS.CustomLogger()
            logger = cursor_logger.setup_logger()
            logger.info("INSIDE FETCH DATA FROM DB FUNCTION")
            for format_type, ids in report_ids.items():
                logger.info(f"format type is: {format_type}")
                logger.info(f"ids are: {ids}")
                data[format_type] = {}
                for report_id in ids:
                    query = f"SELECT * FROM {config['database_tables']['report_template']} \
                        WHERE report_id = %s"
                    cursor.execute(query, (report_id,))
                    rows = cursor.fetchall()
                    # df = pd.DataFrame(rows, columns=cursor.column_names)
                    df = pd.DataFrame(rows)
                    if not df.empty:
                        db_details_id = df.at[0, "db_details_id"]
                        customer_id = df.at[0, "customer_id"]
                        report_query = df.at[0, "defined_query"]
                        report_name = df.at[0, "report_template_name"]
                        db_query = f"SELECT * FROM {config['database_tables']['database_details']} \
                            WHERE db_details_id= %s AND customer_id= %s"
                        cursor.execute(db_query, (str(db_details_id), str(customer_id),))
                        db_rows = cursor.fetchall()
                        # db_df = pd.DataFrame(db_rows, columns=cursor.column_names)
                        db_df = pd.DataFrame(db_rows)
                        if not db_df.empty:
                            db_detail = dict(zip(db_df.columns, db_df.values[0]))
                            logger.info(f"DB DETAIL:{db_detail}")
                            db_config = {
                                'host': db_detail['domain_name'],
                                'user': db_detail['db_user_name'],
                                'password': db_detail['db_password'],
                                'database': db_detail['db_schema_name'],
                                'port': db_detail['db_port']
                            }
                            db_type = db_detail["rdbms_name"]
                            if format_type == 'xlsx':
                                if str(db_detail["rdbms_name"]).lower() == "mysql":
                                    db_conn = mysql.connector.connect(
                                        host=db_detail['domain_name'],
                                        user=db_detail['db_user_name'],
                                        password=db_detail['db_password'],
                                        database=db_detail['db_schema_name']
                                    )
                                    db_cursor = db_conn.cursor(dictionary=True, buffered=True)
                                    db_cursor.execute(report_query)
                                    report_data = db_cursor.fetchall()
                                    df = pd.DataFrame(report_data)
                                    df = df.where(pd.notnull(df), None)
                                    df = df.replace('', None)
                                    df = self.remove_html_tags_from_dataframe(df)
                                    data[format_type][report_name] = df
                                    db_cursor.close()
                                    db_conn.close()

                                elif str(db_detail["rdbms_name"]).lower() == "postgres":
                                    postgres_config = {
                                        'host': db_detail['domain_name'],
                                        'port': db_detail['db_port'],
                                        'user': db_detail['db_user_name'],
                                        'password': db_detail['db_password'],
                                        'database': db_detail['db_schema_name']
                                    }
                                    db_conn = psycopg2.connect(**postgres_config)
                                    db_cursor = db_conn.cursor(cursor_factory=extras.RealDictCursor)
                                    db_cursor.execute(report_query)
                                    report_data = db_cursor.fetchall()
                                    # logger.info(f"REPORT DATA IN FETCH DB:{report_data}")
                                    logger.info(f"REPORT DATA IN FETCH DB SUCCESS")
                                    column_names = [desc[0] for desc in db_cursor.description]
                                    # logger.info(f"COLUMN NAMES IN FETCH DB: {column_names}")
                                    # result = [dict(zip(column_names, row)) for row in report_data]
                                    result = [dict(row) for row in report_data]
                                    # logger.info(f"RESULT IN FETCH DB:{result}")
                                    logger.info(f"RESULT IN FETCH DB SUCCESS")
                                    df = pd.DataFrame(result)
                                    # logger.info(f"DATAFRAME IN FETCH DB:{df}")
                                    logger.info(f"DATAFRAME IN FETCH DB CREATION SUCCESS")

                                    df = self.remove_html_tags_from_dataframe(df)
                                    df = df.where(pd.notnull(df), None)
                                    df = df.replace('', None)
                                    data[format_type][report_name] = df
                                    # logger.info(f"FINAL DATA IN FETCH DB:{data}")
                                    logger.info(f"FINAL DATA IN FETCH DB CREATION SUCCESS")
                                    db_cursor.close()
                                    db_conn.close()
                                elif str(db_detail["rdbms_name"]).lower() == "vertica":
                                    vertica_config = {
                                        'host': db_detail['domain_name'],
                                        'port': db_detail['db_port'],
                                        'user': db_detail['db_user_name'],
                                        'password': db_detail['db_password'],
                                        'database': db_detail['db_schema_name']
                                    }
                                    try:
                                        db_conn = vertica_python.connect(
                                            **vertica_config)
                                    except vertica_python.Error as e:
                                        logger.error(f"Connection Error: {e}")
                                    db_cursor = db_conn.cursor()
                                    db_cursor.execute(report_query)
                                    
                                    report_data = db_cursor.fetchall()
                                    column_names = [desc[0] for desc in db_cursor.description]
                                    result = [dict(zip(column_names, row)) for row in report_data]
                                    df = pd.DataFrame(result)
                                    df = self.remove_html_tags_from_dataframe(df)
                                    df = df.where(pd.notnull(df), None)
                                    df = df.replace('', None)
                                    data[format_type][report_name] = df
                                    db_cursor.close()
                                    db_conn.close()
                                else:
                                    logger.error("Unsupported database type.")
                            elif format_type == 'pdf':
                                data[format_type][report_name] = {
                                    "report_id":report_id,
                                    "db_config":db_config,
                                    "report_query":report_query,
                                    "db_type":db_type
                                } 
                        else:
                            logger.error(f"No database details found for report_id {report_id}.")
                    else:
                        logger.error(f"No report template found for report_id {report_id}.")

            return data,report_query,db_config,db_type
        except Exception as e:
            logger.error("Failed to fetch data from db: %s",e)

    def remove_html_tags_from_dataframe(self, dataframe):
        """Removes HTML tags from all values in a DataFrame."""
        def remove_html_tags(value):
            if isinstance(value, str):
                return BeautifulSoup(value, 'html.parser').get_text()
            return value  # Return non-string values as is
        return dataframe.applymap(remove_html_tags)




#############



# """
# Module for handling scheduled tasks such as database connections, report generation, and email notifications
# """
# import json
# import os
# import time
# from datetime import datetime,timedelta
# from functools import wraps
# import mysql.connector
# import psycopg2
# import vertica_python
# import pandas as pd
# from bs4 import BeautifulSoup
# from service.SendEmailOffice365 import SendEmailOffice365
# from service.GeneratePDFandExcel import generate_pdf_report, generate_excel_report
# from utilities.purging_reports import delete_old_files
# from utilities.config import config
# import utilities.loggings as LOGGINGS
# from service.MphasisPassword import MphasisScheduler
# from psycopg2 import extras


# # Purge old files
# delete_old_files(os.path.join(os.path.dirname(os.path.abspath(__file__)), "local_reports"))

# cursor_logger = LOGGINGS.CustomLogger()
# logger = cursor_logger.setup_logger()
# from  psycopg2.extras import RealDictCursor

# def log_function_call(func):
#     """Decorator to log the entry and exit of a function."""
#     @wraps(func)
#     def wrapper(*args, **kwargs):
#         cursor_logger = LOGGINGS.CustomLogger()
#         logger = cursor_logger.setup_logger()
#         logger.info(f"Entering {func.__name__}")
#         result = func(*args, **kwargs)
#         logger.info(f"Exiting {func.__name__}")
#         return result
#     return wrapper

# class ScheduledTask:
#     """
#     Handles scheduled tasks such as database connections, report generation, and\
#     sending emails.
#     """

#     def __init__(self, conf):
#         """Initializes the ScheduledTask object with configuration."""
#         logger.info("scheduled task initialized")
#         self.conn = None
#         self.cursor = None
#         self.res_flag = True
#         self.dash_query_flag = False
#         self.conf = conf
#         self.database_type = conf['primary_database']['database_type']
#         self.from_email = conf['schedulertask']['email']
#         self.password = conf['schedulertask']['password']
#         self.smtp = conf['schedulertask']['smtp']
#         self.port = conf['schedulertask']['port']

#     @log_function_call
#     def connect_to_mysql(self):
#         """Connects to a MySQL database."""
#         logger.info("connecting to mysql db")
#         self.conn = mysql.connector.connect(
#             host=self.conf['mysql_email']['mysql_host'],
#             port=self.conf['mysql_email']['mysql_port'],
#             user=self.conf['mysql_email']['mysql_username'],
#             password=self.conf['mysql_email']['mysql_password'],
#             database=self.conf['mysql_email']['mysql_new_schema'],
#         )
#         self.cursor = self.conn.cursor(dictionary=True, buffered=True)
#         logger.info("connected to mysql db")

#     @log_function_call
#     def connect_to_postgres(self):
#         try:
#             """Connects to a PostgreSQL database."""
#             logger.info("connecting to postgres db")
#             postgres_config = {
#                 "host": self.conf['postgresql_email']['postgres_host'],
#                 "port": self.conf['postgresql_email']['postgres_port'],
#                 "user": self.conf['postgresql_email']['postgres_username'],
#                 "password": self.conf['postgresql_email']['postgres_password'],
#                 "database": self.conf['postgresql_email']['postgres_schema'],
#             }
#             self.conn = psycopg2.connect(**postgres_config)
#             self.cursor = self.conn.cursor(cursor_factory=RealDictCursor)
#             logger.info("connected to postgres db")
#         except Exception as e:
#             # print("failed to connect to db: ",e)
#             logger.error("failed to connect to db: %s",e)

#     @log_function_call
#     def close_database_connection(self):
#         """Closes the active database connection and cursor."""
#         if self.cursor:
#             self.cursor.close()
#         if self.conn:
#             self.conn.close()

#     @log_function_call
#     def run(self):
#         """Main loop for the scheduled task."""
#         while True:
#             try:
#                 mphasis = MphasisScheduler()
#                 mphasis.process_password()
#                 # self.connect_to_mysql()

#                 if self.database_type == "mysql":
#                     self.connect_to_mysql()
#                 elif self.database_type == "postgres":
#                     self.connect_to_postgres()
                
#                 now = datetime.now()
#                 cursor_logger = LOGGINGS.CustomLogger()
#                 logger = cursor_logger.setup_logger()
#                 logger.info(f"Start Time is: {now}")

#                 dashboard_query = f"SELECT * FROM \
#                     {config['database_tables']['dashboard_schedulerinfo']}"

#                 if self.res_flag:
#                     logger.info("Executing dashboard query dataset")
#                     self.dash_query_flag = True
#                     self.cursor.execute(dashboard_query)

#                     self.initiate_scheduler()

#                 logger.info(f"End Time is: {now}")
#                 self.close_database_connection()

#             except Exception as error:
#                 # logger.error(f"Exception occurred: {error}")
#                 # print(error)
#                 pass
#             time.sleep(60)

#     @log_function_call
#     def initiate_scheduler(self):
#         """Processes scheduler to trigger email reports."""
#         try:
#             rows = self.cursor.fetchall()

#             for res in rows:
#                 scheduled_time = res["scheduled_time"]
#                 interval = res["scheduler_period"]
#                 email_id = json.loads(res["emailid"])
#                 email_cc = json.loads(res["emailcc"])
#                 report_title = res["report_title"]
#                 email_body_content = res["email_body_content"]
#                 report_attachment = json.loads(res["reportattachment"])

#                 actual_time = datetime.now()

#                 if actual_time >= scheduled_time:
#                     end_date = actual_time.strftime("%Y-%m-%d %H:%M:%S")
#                     if (interval.lower() in ["daily", "dailymtd"]) and self._check_daily_time(scheduled_time,\
#                                                                             actual_time):
#                         self._trigger_email_report(report_attachment, email_id, email_cc,\
#                                                     email_body_content, report_title,actual_time,\
#                                                         end_date)

#                     elif interval.lower() == "weekly" and self._check_weekly_time(scheduled_time,\
#                                                                                 actual_time):
#                         self._trigger_email_report(report_attachment, email_id, email_cc, \
#                                                 email_body_content, report_title,actual_time,\
#                                     end_date)

#                     elif interval.lower() == "monthly" and self._check_monthly_time(scheduled_time,\
#                                                                                     actual_time):
#                         self._trigger_email_report(report_attachment, email_id,\
#                                                 email_cc, email_body_content, report_title,actual_time,\
#                                 end_date)
            
#             logger.info("Initiated all schedulars")
#         except Exception as e:
#             logger.error("Error in initiate_scheduler: %s",e)

#     def _check_daily_time(self, scheduled_time, actual_time):
#         """Checks if the task should run on a daily schedule."""
#         return actual_time.hour == scheduled_time.hour and actual_time.minute == \
#             scheduled_time.minute

#     def _check_weekly_time(self, scheduled_time, actual_time):
#         """Checks if the task should run on a weekly schedule."""
#         return (actual_time.weekday() == scheduled_time.weekday() and
#                 actual_time.hour == scheduled_time.hour and
#                 actual_time.minute == scheduled_time.minute)

#     def _check_monthly_time(self, scheduled_time, actual_time):
#         """Checks if the task should run on a monthly schedule."""
#         return (actual_time.day == scheduled_time.day and
#                 actual_time.hour == scheduled_time.hour and
#                 actual_time.minute == scheduled_time.minute)

#     def _trigger_email_report(self, report_attachment, email_id, email_cc, \
#                               email_body_content, report_title,actual_time,\
#                                 end_date):
#         """
#         This method logs the email triggering process, calculates the start date based 
#         on the provided actual time, and calls the fetch_and_send_email method to send 
#         the email with the specified details.
#         """
#         cursor_logger = LOGGINGS.CustomLogger()
#         logger = cursor_logger.setup_logger()
#         logger.info("Triggering email report")
#         start_date = (actual_time - timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S")
#         self.fetch_and_send_email(self.cursor, report_attachment, email_id, email_cc,\
#                                    email_body_content, report_title,start_date,end_date)

#     @log_function_call
#     def fetch_and_send_email(self, cursor, report_attachment, email_id, email_cc,\
#                               email_body_content, report_title,start_date,end_date):
#         """Fetches report data and sends reports via email."""
#         data, report_query, db_config, db_type = self.fetch_data_from_database(cursor, \
#                                                                                report_attachment)
#         local_folder = "local_reports/"
#         delete_old_files(local_folder)
#         attachments = self._generate_reports(data, local_folder,start_date,end_date)

#         emailer = SendEmailOffice365(self.from_email, self.password, self.smtp, self.port,logger)

#         emailer.send_email_with_attachments(
#             email_id,
#             email_cc,
#             f"{report_title} - {datetime.now().strftime('%Y-%m-%d')}",
#             email_body_content,
#             attachments,
#         )

#     def _generate_reports(self, data, local_folder,start_date,end_date):
#         """Generates PDF or Excel reports and returns the file paths."""
#         logger.info("inside generate report")
#         attachments = []
#         for format_type, report_data in data.items():
#             logger.info(f"Format type in data.items() is: {format_type}")
#             logger.info(f"Report_data in data.items() is: {report_data}")
#             for report_id, df in report_data.items():
#                 logger.info(f"Report ID in report_data is: {report_id}")
#                 logger.info(f"DF in report_data.items is:{df}")
#                 # filename = f"{local_folder}{report_id}-{datetime.now().strftime('%Y-%m-%d')}.{format_type}"
#                 filename = f"{local_folder}{report_id}.{format_type}"
#                 if format_type == "pdf":

#                     generate_pdf_report(df["report_query"], filename, df["db_config"],\
#                                          report_id, df["db_type"])
#                 elif format_type == "xlsx":
#                     generate_excel_report(df, filename, report_id, start_date,end_date)
#                 attachments.append(filename)
#         return attachments

#     @log_function_call
#     def fetch_data_from_database(self, cursor, report_ids):
#         try:
#             data = {}
#             cursor_logger = LOGGINGS.CustomLogger()
#             logger = cursor_logger.setup_logger()
#             logger.info("INSIDE FETCH DATA FROM DB FUNCTION")
#             for format_type, ids in report_ids.items():
#                 logger.info(f"format type is: {format_type}")
#                 logger.info(f"ids are: {ids}")
#                 data[format_type] = {}
#                 for report_id in ids:
#                     query = f"SELECT * FROM {config['database_tables']['report_template']} \
#                         WHERE report_id = %s"
#                     cursor.execute(query, (report_id,))
#                     rows = cursor.fetchall()
#                     # df = pd.DataFrame(rows, columns=cursor.column_names)
#                     df = pd.DataFrame(rows)
#                     if not df.empty:
#                         db_details_id = df.at[0, "db_details_id"]
#                         customer_id = df.at[0, "customer_id"]
#                         report_query = df.at[0, "defined_query"]
#                         report_name = df.at[0, "report_template_name"]
#                         db_query = f"SELECT * FROM {config['database_tables']['database_details']} \
#                             WHERE db_details_id= %s AND customer_id= %s"
#                         cursor.execute(db_query, (str(db_details_id), str(customer_id),))
#                         db_rows = cursor.fetchall()
#                         # db_df = pd.DataFrame(db_rows, columns=cursor.column_names)
#                         db_df = pd.DataFrame(db_rows)
#                         if not db_df.empty:
#                             db_detail = dict(zip(db_df.columns, db_df.values[0]))
#                             logger.info(f"DB DETAIL:{db_detail}")
#                             db_config = {
#                                 'host': db_detail['domain_name'],
#                                 'user': db_detail['db_user_name'],
#                                 'password': db_detail['db_password'],
#                                 'database': db_detail['db_schema_name'],
#                                 'port': db_detail['db_port']
#                             }
#                             db_type = db_detail["rdbms_name"]
#                             if format_type == 'xlsx':
#                                 if str(db_detail["rdbms_name"]).lower() == "mysql":
#                                     db_conn = mysql.connector.connect(
#                                         host=db_detail['domain_name'],
#                                         user=db_detail['db_user_name'],
#                                         password=db_detail['db_password'],
#                                         database=db_detail['db_schema_name']
#                                     )
#                                     db_cursor = db_conn.cursor(dictionary=True, buffered=True)
#                                     db_cursor.execute(report_query)
#                                     report_data = db_cursor.fetchall()
#                                     df = pd.DataFrame(report_data)
#                                     df = df.where(pd.notnull(df), None)
#                                     df = df.replace('', None)
#                                     df = self.remove_html_tags_from_dataframe(df)
#                                     data[format_type][report_name] = df
#                                     db_cursor.close()
#                                     db_conn.close()

#                                 elif str(db_detail["rdbms_name"]).lower() == "postgres":
#                                     postgres_config = {
#                                         'host': db_detail['domain_name'],
#                                         'port': db_detail['db_port'],
#                                         'user': db_detail['db_user_name'],
#                                         'password': db_detail['db_password'],
#                                         'database': db_detail['db_schema_name']
#                                     }
#                                     db_conn = psycopg2.connect(**postgres_config)
#                                     db_cursor = db_conn.cursor(cursor_factory=extras.RealDictCursor)
#                                     db_cursor.execute(report_query)
#                                     report_data = db_cursor.fetchall()
#                                     # logger.info(f"REPORT DATA IN FETCH DB:{report_data}")
#                                     logger.info(f"REPORT DATA IN FETCH DB SUCCESS")
#                                     column_names = [desc[0] for desc in db_cursor.description]
#                                     # logger.info(f"COLUMN NAMES IN FETCH DB: {column_names}")
#                                     # result = [dict(zip(column_names, row)) for row in report_data]
#                                     result = [dict(row) for row in report_data]
#                                     # logger.info(f"RESULT IN FETCH DB:{result}")
#                                     logger.info(f"RESULT IN FETCH DB SUCCESS")
#                                     df = pd.DataFrame(result)
#                                     # logger.info(f"DATAFRAME IN FETCH DB:{df}")
#                                     logger.info(f"DATAFRAME IN FETCH DB CREATION SUCCESS")

#                                     df = self.remove_html_tags_from_dataframe(df)
#                                     df = df.where(pd.notnull(df), None)
#                                     df = df.replace('', None)
#                                     data[format_type][report_name] = df
#                                     # logger.info(f"FINAL DATA IN FETCH DB:{data}")
#                                     logger.info(f"FINAL DATA IN FETCH DB CREATION SUCCESS")
#                                     db_cursor.close()
#                                     db_conn.close()
#                                 elif str(db_detail["rdbms_name"]).lower() == "vertica":
#                                     vertica_config = {
#                                         'host': db_detail['domain_name'],
#                                         'port': db_detail['db_port'],
#                                         'user': db_detail['db_user_name'],
#                                         'password': db_detail['db_password'],
#                                         'database': db_detail['db_schema_name']
#                                     }
#                                     try:
#                                         db_conn = vertica_python.connect(
#                                             **vertica_config)
#                                     except vertica_python.Error as e:
#                                         logger.error(f"Connection Error: {e}")
#                                     db_cursor = db_conn.cursor()
#                                     db_cursor.execute(report_query)
                                    
#                                     report_data = db_cursor.fetchall()
#                                     column_names = [desc[0] for desc in db_cursor.description]
#                                     result = [dict(zip(column_names, row)) for row in report_data]
#                                     df = pd.DataFrame(result)
#                                     df = self.remove_html_tags_from_dataframe(df)
#                                     df = df.where(pd.notnull(df), None)
#                                     df = df.replace('', None)
#                                     data[format_type][report_name] = df
#                                     db_cursor.close()
#                                     db_conn.close()
#                                 else:
#                                     logger.error("Unsupported database type.")
#                             elif format_type == 'pdf':
#                                 data[format_type][report_name] = {
#                                     "report_id":report_id,
#                                     "db_config":db_config,
#                                     "report_query":report_query,
#                                     "db_type":db_type
#                                 } 
#                         else:
#                             logger.error(f"No database details found for report_id {report_id}.")
#                     else:
#                         logger.error(f"No report template found for report_id {report_id}.")

#             return data,report_query,db_config,db_type
#         except Exception as e:
#             logger.error("Failed to fetch data from db: %s",e)

#     def remove_html_tags_from_dataframe(self, dataframe):
#         """Removes HTML tags from all values in a DataFrame."""
#         def remove_html_tags(value):
#             if isinstance(value, str):
#                 return BeautifulSoup(value, 'html.parser').get_text()
#             return value  # Return non-string values as is
#         return dataframe.applymap(remove_html_tags)
