"""
This file manages database connections (MySQL and PostgreSQL), handles saving and retrieving 
connection details, and accesses schema metadata. It provides methods to check, insert, 
and validate connection information.
"""
import json
import base64
from typing import Optional
from datetime import datetime
from psycopg2.extras import RealDictCursor
from fastapi import HTTPException, UploadFile, Form
from mysql.connector.errors import Error as MySQLError
from psycopg2 import Error as PostgresError
#from utilities.database_services import DatabaseServices
from database_services.common import CommonDatabaseServices , MySQLServices , PostgreSQLServices , OracleServices , VerticaServices
from utilities.config import config
import utilities.loggings as LOGGINGS
from pydantic_models.db_model import save_report_template_input


db_services = CommonDatabaseServices()


class DatabaseManager:
    """
    This class manages database connections (MySQL and PostgreSQL), handles saving and retrieving
    connection details, and accesses schema metadata. It provides methods to check, insert,
    and validate connection information.
    """

    def __init__(self):
        """
        Initializes the DatabaseManager class with db_services and logging objects for database
        operations and error logging.
        """
        self.db_services = db_services
        self.conf = config
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

        self.vertica_database_url = {
            "host": config["vertica"]["vertica_host"],
            "port": config["vertica"]["vertica_port"],
            "username": config["vertica"]["vertica_username"],
            "password": config["vertica"]["vertica_password"],
            "database": config["vertica"]["vertica_schema"]
        }

    def save_connection_details(self, database, connection_type, details, customer_id):
        """
        Checks if connection details for the specified database already exist in the database.
        If found, returns the existing details.
        """
        with database.cursor() as cursor:
            cursor.execute(
                f"SELECT * FROM {config['database_tables']['database_details']} WHERE rdbms_name =\
                      %s\
                      AND domain_name = %s AND db_port = %s AND db_user_name = %s AND db_password = \
                        %s\
                          AND db_schema_name = %s AND customer_id = %s",
                (
                    connection_type,
                    details["host"],
                    details["port"],
                    details["username"],
                    details["password"],
                    details["schema"],
                    customer_id,
                ),
            )
            existing_details = cursor.fetchone()

        return existing_details

    def insert_connection_details(
    self, database, connection_type, details, customer_id, group_id):
        """
        Inserts new connection details into the database for a specific customer and database type.
        Commits the transaction after successful insertion.
        """
        try:
            with database.cursor() as cursor:
                cursor.execute(
                    f"""
                    INSERT INTO {config['database_tables']['database_details']} 
                    (rdbms_name, domain_name, db_port, db_user_name, db_password, db_schema_name, customer_id) 
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        connection_type,
                        details["host"],
                        details["port"],
                        details["username"],
                        details["password"],
                        details["schema"],
                        customer_id,
                    ),
                )

                # Fetch the inserted or existing db_details_id
                cursor.execute(
                    f"""
                    SELECT db_details_id 
                    FROM {config['database_tables']['database_details']} 
                    WHERE rdbms_name = %s
                    AND domain_name = %s 
                    AND db_port = %s 
                    AND db_user_name = %s 
                    AND db_password = %s
                    AND db_schema_name = %s 
                    AND customer_id = %s
                    """,
                    (
                        connection_type,
                        details["host"],
                        details["port"],
                        details["username"],
                        details["password"],
                        details["schema"],
                        customer_id,
                    ),
                )
                existing_details = cursor.fetchone()

                if existing_details:
                    db_details_id = existing_details[0]
                    # Insert into db_group_map
                    cursor.execute(
                        f"""
                        INSERT INTO {config['database_tables']['db_group_map']} 
                        (db_details_id, group_id,created_at) 
                        VALUES (%s, %s,%s)
                        """,
                        (db_details_id, group_id,datetime.now()),
                    )

            # Commit the transaction
            database.commit()

        except Exception as e:
            # Rollback in case of error
            database.rollback()
            raise ValueError(f"Error inserting connection details: {e}")

    def save_connection(self, details: dict):
        """
        Saves the database connection details if they do not already exist in the system.\
              It validates
        the connection and either inserts new details or returns an appropriate message.
        Raises an HTTP exception if the connection is invalid or there are errors.
        """
        connection_type = details.get("connection_type")
        database_type = details.get("database_type")
        active_user = details.get("active_user")
        save = details.get("save")
        group_id = details.get("group_id")

        try:
            cursor_logger = LOGGINGS.CustomLogger()
            logging = cursor_logger.setup_logger()

            if details['database_type']=="mysql":
                database_url = self.mysql_database_url
                database_service = MySQLServices(**database_url)
                database_conn = database_service.connect()
            elif details['database_type'] == 'oracle':
                database_url = self.oracle_database_url
                database_service = OracleServices(**database_url)
                database_conn = database_service.connect()
            elif details['database_type'] == 'postgres':
                database_url = self.postgres_database_url
                database_service = PostgreSQLServices(**database_url)
                database_conn = database_service.connect()
            elif details['database_type'] == 'vertica':
                database_url = self.vertica_database_url
                database_service = VerticaServices(**database_url)  
                database_conn = database_service.connect()
            else:
                raise HTTPException(
                    status_code=500,
                    detail={"statusCode":self.conf['codes']['database error'],"error":"Invalid Datatbase type"}
                )

            if self.db_services.check_connection(details, connection_type):
                customer_id = self.db_services.get_customerId(database_conn, (active_user,))
                existing_details = self.save_connection_details(
                    database_conn, connection_type, details, customer_id
                )

                logging.debug(f"Connected to {database_type} database with customer ID: {customer_id}")

                if existing_details:
                    return {"statusCode":self.conf['codes']['already exists'],"message": "Database details already exist."}
                elif save == "yes":
                    self.insert_connection_details(
                        database_conn, connection_type, details, customer_id,group_id
                    )
                    return {"status_code":self.conf['codes']['success'],"message": "Connection details saved successfully.",}
                else:
                    return {"statusCode":self.conf['codes']['success'], "message": "Valid Connection"}
            else:
                
                database_conn.close()
                return {"statusCode":self.conf['codes']['database error'], "message": "Invalid Connection"}
                
        except Exception as unexpected_exception:
            logging.error(f"Unexpected error: {unexpected_exception}")
            return {"statusCode":self.conf['codes']['database error'], "message": "Invalid Connection: " + str(unexpected_exception)}
        finally:
            if "database_conn" in locals() and database_conn:
                database_conn.close()

    def get_schema(self, user_details: dict):
        """
        Retrieves the schema names associated with a user based on the email and database type. 
        If no schema is found, returns "No Schema Found". Handles both MySQL and PostgreSQL\
              databases.
        """
        try:
            cursor_logger = LOGGINGS.CustomLogger()
            logging = cursor_logger.setup_logger()
            email = user_details.get("email")
            database_type = user_details.get("database_type")
            connection_type = user_details.get("connection_type")

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
                f"SELECT customer_id, group_id FROM \
                    {config['database_tables']['user_account']} \
                    WHERE user_email_id = %s",
                (email,),
            )
            result = cursor.fetchall()

            customer_id = result[0]["customer_id"]
            group_id = result[0]["group_id"]

            cursor.execute(
                f"SELECT groupname FROM {config['database_tables']['user_group']} \
                    WHERE group_id = %s",
                (group_id,),
            )
            result = cursor.fetchall()
            groupname = result[0]["groupname"]

            if len(groupname) > 0:
                cursor.execute(
                    f"SELECT db_schema_name,rdbms_name FROM\
                            {config['database_tables']['database_details']} \
                        WHERE customer_id = %s AND rdbms_name = %s",
                    (customer_id, connection_type),
                )
                result = cursor.fetchall()
                # schema_names = {"result": [{"db_schema_name": item["db_schema_name"], "rdbms_name": item["rdbms_name"]} for item in result]}

                return {"statusCode":self.conf['codes']['success'], "result": [{"db_schema_name": item["db_schema_name"], "rdbms_name": item["rdbms_name"]} for item in result]}
            else:
                return {"statusCode":self.conf['codes']['no records'],"message":"no records found"}

        except Exception as unexpected_exception:
            logging.error(f"Unexpected error: {unexpected_exception}")
            raise HTTPException(
                status_code=500,
                detail={"statusCode":self.conf['codes']['internal error'],"error":f"internal error {str(unexpected_exception)}"}
            )
        finally:
            if "cursor" in locals() and cursor:
                cursor.close()
            if "database_conn" in locals() and database_conn:
                database_conn.close()

    async def access_schema_metadata(self, schema: dict):
        """
        Accesses and returns schema metadata (columns and their data types) for a specified \
            database schema.
        It works with both MySQL and PostgreSQL databases and uses the information schema \
            to retrieve details.
        """
        try:
            schema_name = schema.get("schema_name")
            database_type = schema.get("database_type")
            email = schema.get("email")
            cursor_logger = LOGGINGS.CustomLogger()
            logging = cursor_logger.setup_logger()

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
                f"SELECT customer_id FROM {config['database_tables']['user_account']} \
                    WHERE user_email_id = %s",
                (email,),
            )
            result = cursor.fetchall()

            customer_id = result[0]["customer_id"]
            cursor.execute(
                f"SELECT domain_name, db_port, db_user_name, db_password, rdbms_name \
                    FROM {config['database_tables']['database_details']}\
                            WHERE db_schema_name\
                            = %s AND customer_id = %s",
                (schema_name, customer_id),
            )
            result = cursor.fetchall()

            # Establish a secondary database connection based on the retrieved details
            secondary_database_url = {
                "username": result[0]["db_user_name"],
                "password": result[0]["db_password"],
                "host": result[0]["domain_name"],
                "port": result[0]["db_port"],
                "database": schema_name,
            }

            # Fetch column details from MySQL schema
            if result[0]["rdbms_name"] == "mysql":
                secondary_database_service = MySQLServices(**secondary_database_url)
                secondary_conn = secondary_database_service.connect()
                
                with secondary_conn.cursor(dictionary=True) as cursor:
                    cursor.execute(
                        "SELECT * FROM INFORMATION_SCHEMA.COLUMNS \
                            WHERE TABLE_SCHEMA = %s",
                        (schema_name,),
                    )
                    result = cursor.fetchall()
            # Fetch column details from PostgreSQL schema
            elif result[0]["rdbms_name"] == "postgres":
                secondary_database_service = PostgreSQLServices(**secondary_database_url)
                secondary_conn = secondary_database_service.connect()

                with secondary_conn.cursor(
                    cursor_factory=RealDictCursor
                ) as cursor:
                    cursor.execute(
                        """SELECT
                        table_schema AS "TABLE_SCHEMA",
                        table_name AS "TABLE_NAME",
                        column_name AS "COLUMN_NAME",
                        data_type AS "DATA_TYPE"
                    FROM
                        information_schema.columns
                    WHERE
                        table_schema NOT IN ('pg_catalog', 'information_schema')
                    ORDER BY
                        table_schema, table_name, ordinal_position;"""
                    )
                    result = cursor.fetchall()
            elif result[0]["rdbms_name"] == 'vertica':
                secondary_database_service = VerticaServices(**self.vertica_database_url)
                secondary_conn = secondary_database_service.connect()

                with secondary_conn.cursor('dict') as cursor:
                    cursor.execute('''SELECT
                                        table_schema AS "TABLE_SCHEMA",
                                        table_name AS "TABLE_NAME",
                                        column_name AS "COLUMN_NAME",
                                        data_type AS "DATA_TYPE"
                                    FROM
                                        columns
                                    WHERE
                                        table_schema NOT IN ('v_catalog', 'v_monitor', 'v_internal')
                                    ORDER BY
                                        table_schema, table_name, ordinal_position;''')
                    result = cursor.fetchall()
            secondary_conn.close()
            
            return {"statusCode":self.conf['codes']['success'],"data":result}
        except Exception as unexpected_exception:
            logging.error(f"Unexpected error: {unexpected_exception}")
            raise HTTPException(
                status_code=500,
                detail={"statusCode":self.conf['codes']['internal error'],"error":f"internal error {str(unexpected_exception)}"}
            )
        finally:
            if "cursor" in locals() and cursor:
                cursor.close()
            if "database_conn" in locals() and database_conn:
                database_conn.close()

    async def save_report_template(
        self, report_template_name: str = Form(...), file: Optional[UploadFile] = None
    ):
        """ Saves a report template to the database."""
        cursor_logger = LOGGINGS.CustomLogger()
        logging = cursor_logger.setup_logger()
        logging.info(
            f"Received request to save report template with name: {report_template_name}"
        )
        try:
            report_template_details = save_report_template_input.parse_raw(report_template_name).model_dump(by_alias=True)
            report_template_name = report_template_details.get("report_template_name")
            font_size_title = report_template_details.get("font_size_title")
            font_size_value = report_template_details.get("font_size_value")
            icon_path = None

            if file is not None:
                file_content = await file.read()
                base64_data = base64.b64encode(file_content)
                base64_data_str = base64_data.decode("utf-8")
                icon_path = base64_data_str

            report_type = report_template_details.get("report_type")
            chart_type = report_template_details.get("chart_type")
            defined_query = report_template_details.get("defined_query")
            enable_drilldown = report_template_details.get("enable_drilldown")
            auto_update_interval = report_template_details.get("auto_update_interval")
            time_period = report_template_details.get("time_period")
            start_date = report_template_details.get("start_date")
            end_date = report_template_details.get("end_date")
            email = report_template_details.get("email")
            schema_name = report_template_details.get("schema")
            display_order = report_template_details.get("display_order")
            chart_colours = report_template_details.get("chart_colours")
            connection_type = report_template_details.get("connection_type")
            database_type = report_template_details.get("database_type")
            database_conn = None

            
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
                "select customer_id,group_id from user_account where user_email_id = %s",
                (email,),
            )
            result = cursor.fetchall()
            customer_id = result[0]["customer_id"]
            group_id = result[0]["group_id"]
            cursor.execute(
                "select db_details_id from database_details where customer_id = %s \
                    and db_schema_name = %s and rdbms_name = %s",
                (customer_id, schema_name,connection_type,),
            )
            result = cursor.fetchall()
            db_details_id = result[0]["db_details_id"]
            cursor.execute(
                "select * from report_template where customer_id = %s",
                (customer_id,),
            )
            result2 = cursor.fetchall()
            report_template_names = [i["report_template_name"] for i in result2]
            if report_template_name in report_template_names:
                database_conn.close()
                return {
                    "statusCode":self.conf['codes']['already exists'],
                    "status": "fail",
                    "message": "Report Template name already exists, try with another one.",
                }
            else:
                if report_type.lower() == "box":
                    background_colour = report_template_details.get(
                        "background_colour"
                    )
                    chart_react_colour = report_template_details.get(
                        "chart_react_colour"
                    )
                    subtitle_size = report_template_details.get("subtitle_size")
                    subtitle =  report_template_details.get("subtitle")
                    layout = report_template_details.get("layout")
                    subtitle_text =  report_template_details.get("subtitle_text")
                    text_alignment = report_template_details.get("text_alignment")
                    layout_value = report_template_details.get("layout_value")
                    gradient_mode = report_template_details.get("gradient_mode")

                    box_customization_options = json.dumps({
                            "background_colour": background_colour,
                            "chart_react_colour": chart_react_colour,
                            "font_size_title": font_size_title,
                            "font_size_value": font_size_value,
                            "subtitle_size": subtitle_size,
                            "subtitle": subtitle,
                            "layout": layout,
                            "subtitle_text": subtitle_text,
                            "text_alignment": text_alignment,
                            "layout_value": layout_value,
                            "gradient_mode": gradient_mode
                    })

                    cursor.execute(
                        "INSERT INTO report_template (report_template_name, report_type, chart_type,\
                                defined_query, enable_drilldown, auto_update_interval, time_period,\
                                    start_date, end_date, customer_id, db_details_id, display_order,\
                                    upload_logo,background_colour,chart_react_colour,font_size_title,\
                                        font_size_value,box_customization_options) VALUES (%s, %s, %s, %s, %s, %s, %s, %s,%s,\
                                                %s, %s, %s,%s,%s,%s,%s,%s,%s)",
                        (
                            report_template_name,
                            report_type,
                            chart_type,
                            defined_query,
                            enable_drilldown,
                            auto_update_interval,
                            time_period,
                            start_date,
                            end_date,
                            customer_id,
                            db_details_id,
                            display_order,
                            icon_path,
                            background_colour,
                            chart_react_colour,
                            font_size_title,
                            font_size_value,
                            box_customization_options
                        ),
                    )
                elif report_type.lower() == "chart":
                    chart_colours = json.dumps(report_template_details.get("chart_colours"))
                    chart_subtitle = report_template_details.get("chart_subtitle")
                    chart_customization_options = json.dumps({
                        "chart_subtitle": chart_subtitle,
                        "chart_colours": chart_colours
                    })

                    chart_colours = json.dumps(report_template_details.get("chart_colours"))
                    cursor.execute(
                        "INSERT INTO report_template (report_template_name, report_type, chart_type,\
                                defined_query, enable_drilldown, auto_update_interval, time_period,\
                                    start_date, end_date, customer_id, db_details_id, display_order,\
                                        chart_customizations_options) VALUES (%s, %s, %s, %s, %s, %s, %s, %s,%s, %s, %s, %s, %s)",
                        (
                            report_template_name,
                            report_type,
                            chart_type,
                            defined_query,
                            enable_drilldown,
                            auto_update_interval,
                            time_period,
                            start_date,
                            end_date,
                            customer_id,
                            db_details_id,
                            display_order,
                            chart_customization_options,
                        ),
                    )
                else:
                    cursor.execute(
                        "INSERT INTO report_template (report_template_name, report_type,\
                                chart_type, defined_query, enable_drilldown, auto_update_interval,\
                                    time_period, start_date, end_date, customer_id, db_details_id,\
                                        display_order) VALUES (%s, %s, %s, %s, %s, %s, %s, %s,%s, %s, %s, %s)",
                        (
                            report_template_name,
                            report_type,
                            chart_type,
                            defined_query,
                            enable_drilldown,
                            auto_update_interval,
                            time_period,
                            start_date,
                            end_date,
                            customer_id,
                            db_details_id,
                            display_order,
                        ),
                    )
                database_conn.commit()
                cursor.execute(
                    "select groupname,group_id from user_group where customer_id = %s \
                        and groupname = %s",
                    (customer_id, "SuperAdmin"),
                )
                result = cursor.fetchall()

                admin_group_id = result[0]["group_id"]
                cursor.execute(
                    "select report_id from report_template where customer_id \
                        = %s and report_template_name = %s",
                    (customer_id, report_template_name),
                )
                result = cursor.fetchall()
                report_id = result[0]["report_id"]
                if admin_group_id != group_id:
                    cursor.execute(
                        "insert into group_report_map (group_id,report_id,created_at,\
                            access_mask) values(%s,%s,%s,%s)",
                        (group_id, report_id, datetime.now(), "pedv"),
                    )
                cursor.execute(
                    "insert into group_report_map (group_id,report_id,created_at,\
                        access_mask) values(%s,%s,%s,%s)",
                    (admin_group_id, report_id, datetime.now(), "pedv"),
                )
                database_conn.commit()
            # database_conn.close()
            logging.info("Report Template saved successfully.")
            return {
                "statusCode":self.conf['codes']['success'],
                "status": "success",
                "message": "Report Template saved successfully.",
            }
    
        except Exception as unexpected_exception:
            logging.error(f"Unexpected error: {unexpected_exception}")
            raise HTTPException(
                status_code=500,
                detail={"statusCode":self.conf['codes']['internal error'],"error":f"internal error {str(unexpected_exception)}"}
            )
        finally:
            if "cursor" in locals() and cursor:
                cursor.close()
            if "database_conn" in locals() and database_conn:
                database_conn.close()
 
    async def check_query(self, query_details: dict):
        """Validates and executes a SQL query on a specified database."""
        try:
            defined_query = query_details.get("query")
            database_type = query_details.get("database_type")
            schema_name = query_details.get("schema")
            email = query_details.get("email")
            connection_type = query_details.get("connection_type")
            cursor_logger = LOGGINGS.CustomLogger()
            logging = cursor_logger.setup_logger()
            logging.info(f"Received request to check query: {defined_query}")
            database_conn = None

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
                f"SELECT customer_id FROM {config['database_tables']['user_account']} \
                    WHERE user_email_id = %s",
                (email,),
            )
            result = cursor.fetchall()
            customer_id = result[0]["customer_id"]
            cursor.execute(
                f"SELECT domain_name, db_port, db_user_name, db_password FROM \
                            {config['database_tables']['database_details']} \
                            WHERE customer_id\
                                = %s AND db_schema_name = %s AND rdbms_name = %s",
                (customer_id, schema_name, connection_type),
            )
            result = cursor.fetchall()

            try:
                secondary_database_url = {
                    "username": result[0]["db_user_name"],
                    "password": result[0]["db_password"],
                    "host": result[0]["domain_name"],
                    "port": result[0]["db_port"],
                    "database": schema_name,
                }
                if connection_type == "mysql":
                    secondary_database_service = MySQLServices(**secondary_database_url)
                    secondary_conn = secondary_database_service.connect()
                elif connection_type == "postgres":
                    secondary_database_service = PostgreSQLServices(**secondary_database_url)
                    secondary_conn = secondary_database_service.connect()
                elif connection_type == "vertica":
                    secondary_database_service = VerticaServices(**secondary_database_url)
                    secondary_conn = secondary_database_service.connect()

                with secondary_conn.cursor() as cursor:
                    cursor.execute(defined_query)
                    result = cursor.fetchall()
                    column_count = len(cursor.description)
                    col_name = [
                        i for i, desc in enumerate(cursor.description, start=1)
                    ]
                    col_type = []
                    if connection_type == "mysql":

                        col_type = [
                            config["mysql_data_types"].get(str(desc[1]))
                            for desc in cursor.description
                        ]
                    elif connection_type == "postgres" or connection_type == 'vertica':
                        col_type = [
                            config["postgresql_data_types"].get(str(desc[1]))
                            for desc in cursor.description
                        ]
                    col_datatype = dict(zip(col_name, col_type))
                    if column_count == 1:
                        if len(result) == 1 and isinstance(
                            result[0][0], (int, float, str)
                        ):
                            logging.info(
                                "Query compiled successfully. Suitable for BOX and Gauge Chart \
                                    Report Type."
                            )
                            return {
                                "statusCode":self.conf['codes']['success'],
                                "detail": "The query is compiled \
                                    successfully and it is suitable only for BOX and Gauge\
                                    Chart Report Type.",
                                "column_count": column_count,
                                "column_type": col_datatype,
                            }
                        else:
                            logging.warning(
                                f"The query output is not structured properly. Current type \
                                    Column1 Datatype: ({type(result[0][0])})"
                            )
                            return {
                                "statusCode":self.conf['codes']['success'],
                                "detail": f"The query output is not \
                                    structured properly and the column should be a number,\
                                    current type Column1 Datatype :({type(result[0][0])})",
                                "column_count": column_count,
                                "column_type": col_datatype,
                            }
                    elif column_count > 1:
                        logging.info("Valid Query.")
                        return {
                            "statusCode":self.conf['codes']['success'],
                            "detail": "Valid Query",
                            "column_count": column_count,
                            "column_type": col_datatype,
                        }
                    else:
                        logging.info("Invalid Query.")
                        return {
                            "statusCode":self.conf['codes']['bad request'],
                            "detail": "Invalid Query",
                            "column_count": column_count,
                            "column_type": col_datatype,
                        }

                secondary_conn.close()
            except (MySQLError, PostgresError,) as e:
                logging.error(f"Error executing query: {str(e)}")
                return {
                    "statusCode":self.conf['codes']['bad request'],
                    "detail":"Query is not valid",
                }

            except Exception as e:
                if connection_type == "vertica":
                    return {
                        "statusCode":self.conf['codes']['bad request'],
                        "detail":"Query is not valid",
                    }

        except Exception as unexpected_exception:
            logging.error(f"Unexpected error: {unexpected_exception}")
            raise HTTPException(
                status_code=500,
                detail={"statusCode":self.conf['codes']['internal error'],"error":f"internal error {str(unexpected_exception)}"}
            )
        finally:
            if "cursor" in locals() and cursor:
                cursor.close()
            if "database_conn" in locals() and database_conn:
                database_conn.close()

    async def add_group(self, details: dict):
        """Adds a new group to the database for a specified customer."""
        try:
            database_type = details.get("database_type")
            group_name = details.get("group_name")
            date = datetime.now()
            customer_id = details.get("customer_id")
            # Configure logging
            cursor_logger = LOGGINGS.CustomLogger()
            logging = cursor_logger.setup_logger()
            logging.info(
                f"Received request to add group: {group_name} for customer ID: {customer_id}"
            )
            database_conn = None

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
                f"SELECT * FROM {config['database_tables']['user_group']} \
                    WHERE groupname = %s\
                        AND customer_id = %s",
                (group_name, customer_id),
            )
            existing_group = cursor.fetchone()

            if existing_group:
                logging.warning(
                    f"Groupname {group_name} already exists for customer ID {customer_id}."
                )
                return {
                    "statusCode":self.conf['codes']['already exists'],
                    "status": "failed",
                    "message": f"Groupname '{group_name}' \
                        already exists for customer ID {customer_id}.",
                }
            else:
                cursor.execute(
                    f"INSERT INTO {config['database_tables']['user_group']} (groupname, \
                        customer_id, created_at) VALUES (%s, %s, %s)",
                    (group_name, customer_id, date),
                )
                database_conn.commit()
                cursor.execute(
                    f"SELECT group_id, groupname, customer_id FROM \
                        {config['database_tables']['user_group']} WHERE groupname = %s AND\
                                customer_id = %s",
                    (group_name, customer_id),
                )
                new_group = cursor.fetchone()

                logging.info(
                    f"Groupname {group_name} added for customer ID {customer_id}."
                )
                return {
                    "statusCode":self.conf['codes']['success'],
                    "status": "success",
                    "message": f"Groupname '{group_name}' \
                        added for \
                        customer ID {customer_id}.",
                    "groupDetail": new_group,
                }

        except Exception as unexpected_exception:
            logging.error(f"Unexpected error: {unexpected_exception}")
            raise HTTPException(
                status_code=500,
                detail={"statusCode":self.conf['codes']['internal error'],"error":f"internal error {str(unexpected_exception)}"}
            )
        finally:
            if "cursor" in locals() and cursor:
                cursor.close()
            if "database_conn" in locals() and database_conn:
                database_conn.close()
