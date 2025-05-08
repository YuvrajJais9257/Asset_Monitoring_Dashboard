""" 
This module provides a suite of database-related services, including connection management, query execution, and schema retrieval. It supports multiple database management systems, including MySQL, PostgreSQL, and SQLite.
"""
import os
import sqlite3
import mysql.connector
from mysql.connector import Error
import psycopg2
from psycopg2 import Error
from psycopg2.extras import DictCursor
from fastapi import HTTPException
from fastapi.responses import Response
import vertica_python
import openai
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
import cx_Oracle
from cx_Oracle import DatabaseError
from typing import List, Dict, Union, Optional, Any
from utilities import loggings as LOGGINGS
from utilities.config import config
import asyncio
from sqlalchemy import text, create_engine
import pandas as pd
import zlib
import json
from redis.asyncio import Redis, ConnectionPool
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from urllib.parse import quote_plus
import redis
from datetime import datetime, date, time
from decimal import Decimal
import base64
import uuid

# pylint: disable=E0401
# pylint: disable=W0212
# pylint: disable=raise-missing-from
import utilities.loggings as LOGGINGS
from utilities.config import config
from psycopg2.extras import RealDictCursor
# from .mysql_service import MySQLDatabaseServices
# from .postgres_service import PostgreSQLDatabaseServices
# from .vertica_service import VerticaDatabaseServices
# from .oracle_service import OracleDatabaseServices

# mysql_service = MySQLDatabaseServices()
# postgres_service = PostgreSQLDatabaseServices
# vertica_servie = VerticaDatabaseServices()
# oracle_service = OracleDatabaseServices()

class CommonDatabaseServices:
    """ 
    This module provides a suite of database-related services, including connection management,query execution, and schema retrieval. It supports multiple database management systems,including MySQL, PostgreSQL, and SQLite.
    """
    def __init__(self):
        """
        Initializes the ReportManager class by loading configuration settings
        and setting up logging for the application.
        """
        self.conf = config

        # Configure logging
        cursor_logger = LOGGINGS.CustomLogger()
        logging = cursor_logger.setup_logger()
        self.logging = logging

        # Load environment variables
        load_dotenv()
        os.environ["OPENAI_API_KEY"] = config["chatbot"]["key"]
        openai.api_key = os.getenv("OPENAI_API_KEY")
        self.llm = ChatOpenAI(model=config["chatbot"]["model"])
        self.client = openai.OpenAI(api_key=openai.api_key)

    # def get_mysql_connection(self, database_url):
    #     """
    #     Establishes and returns a MySQL database connection using the provided database URL.
    #     Logs the attempt and connection details (host and port).

    #     :param database_url: Dictionary containing connection details such as host,\
    #           port, username, password, and schema.
    #     :return: MySQL connection object
    #     """
    #     self.logging.info(
    #         "Establishing MySQL connection to %s:%s",
    #         database_url["host"],
    #         database_url["port"],
    #     )
    #     return mysql.connector.connect(
    #         host=database_url["host"],
    #         user=database_url["username"],
    #         password=database_url["password"],
    #         port=database_url["port"],
    #         database=database_url["schema"],
    #     )

    # def get_postgres_connection(self, database_url):
    #     """
    #     Establishes and returns a PostgreSQL database connection using the provided database URL.
    #     Logs the attempt and connection details (host and port).

    #     :param database_url: Dictionary containing connection details such as host, port,\
    #           username, password, and schema.
    #     :return: PostgreSQL connection object
    #     """
    #     self.logging.info(
    #         "Establishing Postgres connection to %s:%s",
    #         database_url["host"],
    #         database_url["port"],
    #     )
    #     return psycopg2.connect(
    #         host=database_url["host"],
    #         user=database_url["username"],
    #         password=database_url["password"],
    #         port=database_url["port"],
    #         database=database_url["schema"],
    #     )
    
    # def get_vertica_connection(self,database_url):
    #     """
    #     Establishes and returns a Vertica database connection using the provided database URL.
    #     Logs the attempt and connection details (host and port).

    #     :param database_url: Dictionary containing connection details such as host, port,\
    #           username, password, and schema.
    #     :return: Vertica connection object
    #     """
    #     self.logging.info("Establishing Vertica connection to %s:%s", \
    #                       database_url["host"], database_url["port"])
    #     conn_info = {
    #             'host': database_url["host"],
    #             'port': database_url["port"],
    #             'user': database_url["username"],
    #             'password': database_url["password"],
    #             'schema': database_url["schema"]
    #             }
    #     return vertica_python.connect(**conn_info)

    def check_and_create_table(self, connection, create_query):
        """
        Checks if a table exists in the given database, and creates it if it doesn't.
        Executes the provided SQL query to create the table if necessary.

        :param connection: Database connection object (either MySQL or PostgreSQL).
        :param create_query: SQL query to create the table if it does not exist.
        """
        self.logging.info("Checking and creating table if not exists")
        with connection.cursor() as cursor:
            cursor.execute(create_query)
            connection.commit()
        self.logging.info("Table checked/created successfully")

    def get_customerId(self, connection, active_user):
        """
        Retrieves the customer ID for a given active user based on their email address.

        :param connection: Database connection object (either MySQL or PostgreSQL).
        :param active_user: Tuple containing user information, with the email as the first element.
        :return: Customer ID of the user.
        """

        user = active_user[0]

        self.logging.info("Retrieving customer_id for user: %s", user)
        table_name = config["database_tables"]["user_account"]
        sql_query = f"""
            SELECT customer_id 
            FROM {table_name} WHERE user_email_id = %s"""

        with connection.cursor() as cursor:
            cursor.execute(sql_query, (user,))
            result = cursor.fetchall()
        self.logging.info("Retrieved customer_id: %s", result[0][0])
        return result[0][0]

    def check_connection(self, details, typpe):
        """
        Verifies the database connection for either MySQL or PostgreSQL. If the connection is \
            invalid,
        it raises an HTTPException. Logs the status of the connection.

        :param details: Dictionary containing database connection details (host, username,\
              password, port, schema).
        :param type: Type of the database, either 'mysql' or 'postgres'.
        :return: True if the connection is valid, raises an HTTPException otherwise.
        """
        self.logging.info("Checking %s database connection", typpe)
        if typpe == "mysql":
            try:
                connection = mysql.connector.connect(
                    host=details.get("host"),
                    user=details.get("username"),
                    password=details.get("password"),
                    port=details.get("port"),
                    database=details.get("schema"),
                )
                connection.close()
                self.logging.info("MySQL database connection is valid")
                return True
            except mysql.connector.Error as e:
                self.logging.error("MySQL database connection is not valid: %s", e)
                raise HTTPException(
                    status_code=500, detail="MySQL database connection is not valid."
                )

        elif typpe == "postgres":
            try:
                connection = psycopg2.connect(
                    host=details.get("host"),
                    user=details.get("username"),
                    password=details.get("password"),
                    port=details.get("port"),
                    database=details.get("schema"),
                )
                connection.close()
                self.logging.info("Postgres database connection is valid")
                return True
            except psycopg2.Error as e:
                self.logging.error("Postgres database connection is not valid: %s", e)
                raise HTTPException(
                    status_code=500, detail="Postgres database connection is not valid."
                )
        elif typpe == 'vertica':
            try:
                conn_info = {
                'host': details.get("host"),
                'port': details.get("port"),
                'user': details.get("username"),
                'password': details.get("password"),
                'schema': details.get("schema")
                }
                connection = vertica_python.connect(**conn_info)
                connection.close()
                self.logging.debug("Vertica connection is valid.")
                return True
            except vertica_python.Error as e:
                self.logging.error(f"Vertica database connection error: {e}")
                raise HTTPException(status_code=500, detail="Vertica database connection is not valid.")

    def count_group_by_columns(self, sql_query, db_type, db_schema_name, customer_id):
        """
        Executes a SQL query and returns the number of columns used in the GROUP BY clause.
        The function handles both MySQL and PostgreSQL connections using MySQLServices and
        PostgreSQLServices classes for both primary (config) and client database connections.
       
        :param sql_query: SQL query to execute.
        :param db_type: Type of the database (e.g., 'mysql' or 'postgres').
        :param db_schema_name: Name of the schema in which the query is executed.
        :param customer_id: Customer ID used to retrieve specific database connection details.
        :return: Dictionary containing the number of columns and a list of column names used
            in the GROUP BY clause.
        """
        self.logging.info("Counting columns in GROUP BY clause of the query")
 
        # Define database details for the primary (configuration) connection
        if db_type.lower() == "mysql":
 
            # Initialize and connect to MySQL primary database
            primary_db = MySQLServices(
                username=self.conf["mysql"]["mysql_username"],
                password=self.conf["mysql"]["mysql_password"],
                host=self.conf["mysql"]["mysql_host"],
                port=self.conf["mysql"]["mysql_port"],
                database=self.conf["mysql"]["mysql_new_schema"]
            )
        elif db_type.lower() == "postgres":
 
            # Initialize and connect to PostgreSQL primary database
            primary_db = PostgreSQLServices(
                username=self.conf["postgres"]["postgres_username"], 
                password=self.conf["postgres"]["postgres_password"],
                host=self.conf["postgres"]["postgres_host"],
                port=self.conf["postgres"]["postgres_port"],
                database=self.conf["postgres"]["postgres_schema"]
            )
        else:
            self.logging.error(f"Unsupported primary database type: {db_type}")
            return {"length": 0, "columns": []}
 
        # Connect to the primary database
        primary_db.connect()
 
        # Query to retrieve client database details
        db_query = f"SELECT * FROM {config['database_tables']['database_details']} " \
                f"WHERE rdbms_name='{db_type}' AND db_schema_name='{db_schema_name}' AND " \
                f"customer_id='{customer_id}'"
        # print(db_query)
 
        # Execute query using the primary database service
        results = primary_db.execute_query(db_query)
        primary_db.close_connection()
 
        if results and len(results) > 0:
            result = results[0]  # Get the first result as a dictionary
            # print(result)
 
            client_db_details = {
                "host": result["domain_name"],
                "port": result["db_port"],
                "username": result["db_user_name"],
                "password": result["db_password"],
                "schema": result["db_schema_name"],
            }
 
            # Establish client database connection based on database type
            if str(result["rdbms_name"]).lower() == "mysql":
                # Initialize MySQL client connection
                client_db = MySQLServices(
                    username=client_db_details["username"],
                    password=client_db_details["password"],
                    host=client_db_details["host"],
                    port=client_db_details["port"],
                    database=client_db_details["schema"]
                )
                client_db.connect()
                # Execute the query and get results
                query_results = client_db.execute_query(sql_query)
                client_db.close_connection()
 
            elif str(result["rdbms_name"]).lower() == "postgres":
                # Initialize PostgreSQL client connection
                client_db = PostgreSQLServices(
                    username=client_db_details["username"],
                    password=client_db_details["password"],
                    host=client_db_details["host"],
                    port=client_db_details["port"],
                    database=client_db_details["schema"]
                )
                client_db.connect()
                # Execute the query and get results
                query_results = client_db.execute_query(sql_query)
                client_db.close_connection()
 
            else:
                self.logging.error(f"Unsupported client database type: {result['rdbms_name']}")
                return {"length": 0, "columns": []}
 
            # Process query results
            if query_results and len(query_results) > 0:
                result = query_results[0]  # Get first row
                if hasattr(result, 'keys'):
                    columns = list(result.keys())  # Handles dict and DictRow
                else:
                    columns = list(result._fields)  # Fallback for named tuples (if applicable)
                                                  
                #columns = list(result.keys()) if isinstance(result, dict) else list(result._fields)
                columns.pop()  # Remove the last column (typically a count or aggregate column)
                return {"length": len(columns), "columns": columns}
 
        return {"length": 0, "columns": []}
    
    def get_sqlite_table_columns(self, database_file):
        """Retrieves column information for SQLite tables."""
        self.logging.info("Getting SQLite table columns")
        conn = sqlite3.connect(database_file)
        cursor = conn.cursor()

        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()

        table_columns = {}

        for table in tables:
            table_name = table[0]
            cursor.execute(f"PRAGMA table_info({table_name});")
            columns = cursor.fetchall()
            column_details = [f"{col[1]}({col[2]})" for col in columns]
            table_columns[table_name] = column_details

        conn.close()

        return table_columns

    def get_schema(self, db_details):
        """Retrieves database schema information."""
        self.logging.info("Getting schema")
        db_type = db_details["db_type"]
        host = db_details["host"]
        user = db_details["user"]
        password = db_details["password"]
        port = db_details["port"]
        database = db_details["database"]
        
        if db_type == "mysql":
            table_columns = self.get_mysql_table_columns(
                host, user, password, port, database
            )
        elif db_type == "postgres":
            table_columns = self.get_postgres_table_columns(
                host, user, password, port, database
            )
        return table_columns

    def run_query(self, details):
        """Executes a SQL query on a specified database."""
        self.logging.info("Running query")
        db_details = details["db_details"]
        query = details["query"]
        db_type = db_details["db_type"]
        host = db_details["host"]
        user = db_details["user"]
        password = db_details["password"]
        port = db_details["port"]
        database = db_details["database"]
        if db_type == "mysql":
            conn = mysql.connector.connect(
                host=host, port=port, database=database, user=user, password=password
            )
            cursor = conn.cursor()

            cursor.execute(query)
            data = cursor.fetchall()
            conn.close()
            return data
        elif db_type == "postgres":
            conn = psycopg2.connect(
                host=host, port=port, database=database, user=user, password=password
            )
            cursor = conn.cursor()

            cursor.execute(query)
            data = cursor.fetchall()
            conn.close()
            return data

    def get_query(self, varss):
        """Generates a SQL query based on input schema and question using OpenAI's chat /
        completion API."""
        schema = varss["schema"]
        question = varss["question"]
        chat_completion = self.client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a DB expert and give only precise query without \
                        any extra text or formatting and do not use * in the generated query",
                },
                {
                    "role": "user",
                    "content": schema,
                },
                {
                    "role": "user",
                    "content": question,
                },
            ],
            model="gpt-3.5-turbo",
        )

        gen_query = chat_completion.choices[0].message.content
        self.logging.info(f"Generated query: {gen_query}")
        input_tokens1 = int(chat_completion.usage.prompt_tokens)
        output_tokens1 = int(chat_completion.usage.completion_tokens)
        self.logging.info(f"Input Tokens for Query Generation: {input_tokens1}")
        self.logging.info(f"Output Tokens for Query Generation: {output_tokens1}")
        return gen_query

    def get_mysql_table_columns(self, host, user, password, port, database):
        """Retrieves column information for MySQL tables."""
        self.logging.info("Getting MySQL table columns")
        conn = mysql.connector.connect(
            host=host, port=port, database=database, user=user, password=password
        )
        cursor = conn.cursor()
        cursor.execute("SHOW TABLES;")
        tables = cursor.fetchall()
        table_columns = {}
        for table in tables:
            table_name = table[0]
            cursor.execute(f"SHOW COLUMNS FROM {database}.{table_name};")
            columns = cursor.fetchall()
            column_details = [f"{col[0]}({col[1]})" for col in columns]
            table_columns[table_name] = column_details
        conn.close()
        return table_columns

    def get_postgres_table_columns(self, host, user, password, port, database):
        """Retrieves column information for PostgreSQL tables."""
        self.logging.info("Getting PostgreSQL table columns")
        conn = psycopg2.connect(
            host=host, port=port, database=database, user=user, password=password
        )
        cursor = conn.cursor()

        cursor.execute(
            "SELECT table_name FROM information_schema.tables WHERE table_schema='public';"
        )
        tables = cursor.fetchall()

        table_columns = {}

        for table in tables:
            table_name = table[0]
            cursor.execute(
                f"SELECT column_name, data_type FROM information_schema.columns WHERE \
                    table_name='{table_name}';"
            )
            columns = cursor.fetchall()
            column_details = [f"{col[0]}({col[1]})" for col in columns]
            table_columns[table_name] = column_details

        conn.close()

        return table_columns

    async def mysql_data_chunk(query, hostname, port, db_name, db_user, password, offset, limit):
        """
        Fetch a chunk of data from the specified database asynchronously.

        Inputs:
        - query: SQL query to fetch data
        - hostname: Database server hostname
        - port: Database server port
        - db_name: Database name
        - db_user: Database user
        - password: Database password
        - offset: Offset for pagination
        - limit: Limit for pagination

        Outputs:
        - DataFrame containing the fetched data
        """
        try:
            cursor_logger = LOGGINGS.CustomLogger()
            logger = cursor_logger.setup_logger()
            # Get the database URL with async mode enabled
            params = f"?charset=utf8mb4&connect_timeout=300"
            db_url = f"mysql+aiomysql://{db_user}:{password}@{hostname}:{port}/{db_name}{params}"
            # Create an asynchronous engine and connect to the database
            async with create_async_engine(db_url).connect() as conn:
                # Prepare the paginated query
                paginated_query = text(f"{query} LIMIT :limit OFFSET :offset")
                # Execute the query with the provided limit and offset
                result = await conn.execute(paginated_query, {"limit": limit, "offset": offset})
                # Convert the result to a DataFrame
                df = await asyncio.to_thread(pd.DataFrame, result.fetchall(), columns=result.keys())
            logger.info(f"Successfully fetched chunk of {len(df)} rows")
            return df
        except Exception as e:
            logger.info(f"Error fetching data chunk from MySQL database: {str(e)}")

    async def mysql_total_records(query, hostname, port, db_name, db_user, password):
        """
        Get the total number of records for the specified query from the database asynchronously.

        Inputs:
        - query: SQL query to count records
        - hostname: Database server hostname
        - port: Database server port
        - db_name: Database name
        - db_user: Database user
        - password: Database password

        Outputs:
        - Total number of records as an integer
        """
        try:
            cursor_logger = LOGGINGS.CustomLogger()
            logger = cursor_logger.setup_logger()
            # Get the database URL with async mode enabled
            params = f"?charset=utf8mb4&connect_timeout=300"
            db_url = f"mysql+aiomysql://{db_user}:{password}@{hostname}:{port}/{db_name}{params}"
            
            # Create an asynchronous engine and connect to the database
            async with create_async_engine(db_url).connect() as conn:
                # Prepare the count query
                count_query = text(f"SELECT COUNT(*) FROM ({query}) AS subquery")
                # Execute the count query
                result = await conn.execute(count_query)
                # Get the total number of records
                total_records = result.scalar()
            logger.info(f"Total records in the database: {total_records}")
            return total_records
        except Exception as e:
            logger.error(f"Error fetching total records from MySQL database: {str(e)}")

    async def mysql_column_types(query, hostname, port, db_name, db_user, password):
        """
        Get the column types for the specified query from a MySQL database asynchronously.

        Inputs:
        - query: SQL query to get column types
        - hostname: Database server hostname
        - port: Database server port
        - db_name: Database name
        - db_user: Database user
        - password: Database password

        Outputs:
        - Dictionary mapping column names to their MySQL data types
        """
        try:
            # Set up logging
            cursor_logger = LOGGINGS.CustomLogger()
            logger = cursor_logger.setup_logger()

            logger.info("Starting mysql_column_types function")

            # Build the database connection string
            params = "?charset=utf8mb4&connect_timeout=300"
            db_url = f"mysql+aiomysql://{db_user}:{password}@{hostname}:{port}/{db_name}{params}"
            
            # Create an asynchronous engine
            engine = create_async_engine(db_url)

            # Connect and execute the query
            async with engine.connect() as conn:
                logger.info("Connected to the MySQL database")

                # Add LIMIT 0 to the query to fetch only metadata
                limited_query = f"SELECT * FROM ({query}) AS subquery LIMIT 0"
                result = await conn.execute(text(limited_query))
                mysql_data_types = config.get('mysql_data_types', {})
                mysql_type_mapping = {int(key): value for key, value in mysql_data_types.items()}

                # Extract column names and types
                column_types = {}
                for col in result.cursor.description:
                    column_name = col[0]  # Column name
                    mysql_type_code = col[1]  # MySQL type code
                    column_type = mysql_type_mapping.get(mysql_type_code, f"UNKNOWN({mysql_type_code})")
                    column_types[column_name] = column_type
                return column_types

        except Exception as e:
            logger.error(f"Error fetching column types from MySQL database: {str(e)}")
            raise

    def generate_where_clause_mysql(filter_options, filter_operations):
        """
        Generate a WHERE clause for a MySQL query based on the provided filter options and operations.
        """
        where_clauses = []
        # Set up logging
        cursor_logger = LOGGINGS.CustomLogger()
        logger = cursor_logger.setup_logger()
        logger.info("Creating where condition for query")

        for filter_option, filter_operation in zip(filter_options, filter_operations):
            for column, values in filter_option.items():
                operation = filter_operation.get(column)
                
                if values == []:
                    continue              

                if operation == "equals":
                    clause = f"`{column}` IN ({', '.join([f"'{value}'" for value in values])})"
                    
                elif operation == "notEquals":
                    clause = f"`{column}` NOT IN ({', '.join([f"'{value}'" for value in values])})"
                elif operation in ("contains", "fuzzy"):
                    clause = " OR ".join([f"`{column}` LIKE '%{value}%'" for value in values])
                elif operation == "startsWith":
                    clause = " OR ".join([f"`{column}` LIKE '{value}%'" for value in values])
                elif operation == "endsWith":
                    clause = " OR ".join([f"`{column}` LIKE '%{value}'" for value in values])
                elif operation == "between":
                    if len(values) == 2:
                        clause = f"`{column}` BETWEEN '{values[0]}' AND '{values[1]}'"
                    else:
                        raise ValueError("Between inclusive operation requires exactly 2 values.")
                elif operation == "greaterThan":
                    clause = f"`{column}` > '{values[0]}'"
                elif operation == "greaterThanOrEqualTo":
                    clause = f"`{column}` >= '{values[0]}'"
                elif operation == "lessThan":
                    clause = f"`{column}` < '{values[0]}'"
                elif operation == "lessThanOrEqualTo":
                    clause = f"`{column}` <= '{values[0]}'"
                else:
                    raise ValueError(f"Unsupported operation: {operation}")

                where_clauses.append(f"({clause})")

        return " AND ".join(where_clauses)

async def postgres_data_chunk(query, hostname, port, db_name, db_user, password, offset, limit):
    """
    Fetch a chunk of data from the specified database asynchronously.

    Inputs:
    - query: SQL query to fetch data
    - hostname: Database server hostname
    - port: Database server port
    - db_name: Database name
    - db_user: Database user
    - password: Database password
    - offset: Offset for pagination
    - limit: Limit for pagination

    Outputs:
    - DataFrame containing the fetched data
    """
    try:
        cursor_logger = LOGGINGS.CustomLogger()
        logger = cursor_logger.setup_logger()
        # Get the database URL with async mode enabled
        postgres_db_url = f"postgresql+asyncpg://{db_user}:{password}@{hostname}:{port}/{db_name}"
        # Create an asynchronous engine and connect to the database
        async with create_async_engine(postgres_db_url).connect() as conn:
            # Prepare the paginated query
            paginated_query = text(f"{query} LIMIT :limit OFFSET :offset")
            # Execute the query with the provided limit and offset
            result = await conn.execute(paginated_query, {"limit": limit, "offset": offset})
            # Convert the result to a DataFrame
            df = await asyncio.to_thread(pd.DataFrame, result.fetchall(), columns=result.keys())
        logger.info(f"Successfully fetched chunk of {len(df)} rows")
        return df
    except Exception as e:
        logger.info(f"Error fetching data chunk from PostgreSQL database: {str(e)}")

async def postgres_total_records(query, hostname, port, db_name, db_user, password):
    """
    Get the total number of records for the specified query from the database asynchronously.
    Inputs:
    - query: SQL query to count records
    - hostname: Database server hostname
    - port: Database server port
    - db_name: Database name
    - db_user: Database user
    - password: Database password

    Outputs:
    - Total number of records as an integer
    """
    try:
        cursor_logger = LOGGINGS.CustomLogger()
        logger = cursor_logger.setup_logger()
        
        postgres_db_url = f"postgresql+asyncpg://{db_user}:{password}@{hostname}:{port}/{db_name}"
        
        # Create an asynchronous engine and connect to the database
        async with create_async_engine(postgres_db_url).connect() as conn:
            # Prepare the count query
            count_query = text(f"SELECT COUNT(*) FROM ({query}) AS subquery")
            # Execute the count query
            result = await conn.execute(count_query)
            # Get the total number of records
            total_records = result.scalar()
        logger.info(f"Total records in the database: {total_records}")
        return total_records
    except Exception as e:
        logger.error(f"Error fetching total records from MySQL database: {str(e)}")

async def postgres_column_types(query, hostname, port, db_name, db_user, password):
    """
    Get the column types for the specified query from the PostgreSQL database asynchronously.

    Inputs:
    - query: SQL query to get column types
    - hostname: Database server hostname
    - port: Database server port
    - db_name: Database name'] 
    - db_user: Database user
    - password: Database password

    Outputs:
    - Dictionary mapping column names to their PostgreSQL data types
    """
    try:
        cursor_logger = LOGGINGS.CustomLogger()
        logger = cursor_logger.setup_logger()

        # Build the database connection string
        db_url = f"postgresql+asyncpg://{db_user}:{password}@{hostname}:{port}/{db_name}"

        # Create an asynchronous engine
        engine = create_async_engine(db_url)

        # Connect and execute the query
        async with engine.connect() as conn:
            # Add LIMIT 0 to the query to fetch only metadata
            limited_query = f"SELECT * FROM ({query}) AS subquery LIMIT 0"
            result = await conn.execute(text(limited_query))

            # Extract column names and types
            column_types = {}
            postgres_data_types = config.get('postgresql_data_types', {})
            postgres_type_mapping = {int(key): value for key, value in postgres_data_types.items()}
            for index, col in enumerate(result.keys()):
                # Get PostgreSQL-specific type OID
                column_oid = result.cursor.description[index][1]
                column_types[col] = postgres_type_mapping.get(column_oid, f"UNKNOWN({column_oid})")

        logger.info(f"Successfully fetched column types: {column_types}")
        return column_types
    except Exception as e:
        logger.error(f"Error fetching column types: {e}")
        raise

async def redis_data_chunk(host, port, password,table_name, page, page_size, cols, where_conds, limit):
    """This function fetches a chunk of data from Redis."""
    redis_service = RedisService(host, port, password)
    result = await redis_service.fast_fetch_data(table_name, page, page_size, cols, where_conds, limit)
    return result

def generate_where_clause_mysql(filter_options, filter_operations):
    """
    Generate a WHERE clause for a MySQL query based on the provided filter options and operations.
    """
    where_clauses = []
    # Set up logging
    cursor_logger = LOGGINGS.CustomLogger()
    logger = cursor_logger.setup_logger()
    logger.info("Creating where condition for query")

    for filter_option, filter_operation in zip(filter_options, filter_operations):
        for column, values in filter_option.items():
            operation = filter_operation.get(column)
            
            if values == []:
                continue              

            if operation == "equals":
                clause = f"`{column}` IN ({', '.join([f"'{value}'" for value in values])})"
            elif operation == "notEquals":
                clause = f"`{column}` NOT IN ({', '.join([f"'{value}'" for value in values])})"
            elif operation in ("contains", "fuzzy"):
                clause = " OR ".join([f"`{column}` LIKE '%{value}%'" for value in values])
            elif operation == "startsWith":
                clause = " OR ".join([f"`{column}` LIKE '{value}%'" for value in values])
            elif operation == "endsWith":
                clause = " OR ".join([f"`{column}` LIKE '%{value}'" for value in values])
            elif operation == "between":
                if len(values) == 2:
                    clause = f"`{column}` BETWEEN '{values[0]}' AND '{values[1]}'"
                else:
                    raise ValueError("Between inclusive operation requires exactly 2 values.")
            elif operation == "greaterThan":
                clause = f"`{column}` > '{values[0]}'"
            elif operation == "greaterThanOrEqualTo":
                clause = f"`{column}` >= '{values[0]}'"
            elif operation == "lessThan":
                clause = f"`{column}` < '{values[0]}'"
            elif operation == "lessThanOrEqualTo":
                clause = f"`{column}` <= '{values[0]}'"
            else:
                raise ValueError(f"Unsupported operation: {operation}")

            where_clauses.append(f"({clause})")

    return " AND ".join(where_clauses)

def generate_where_clause_postgres(filter_options, filter_operations):
    """
    This function generates a WHERE clause for a PostgreSQL query based on the provided filter options and operations.
    """
    where_clauses = []

    for filter_option, filter_operation in zip(filter_options, filter_operations):
        for column, values in filter_option.items():
            quoted_column = f'"{column}"'
            operation = filter_operation.get(column)
            if values == []:
                continue  
            if operation == "equals":
                formatted_values = [f"'{str(v)}'" for v in values]
                clause = f"{quoted_column} IN ({', '.join(formatted_values)})"
            elif operation == "notEquals":
                formatted_values = [f"'{str(v)}'" for v in values]
                clause = f"{quoted_column} NOT IN ({', '.join(formatted_values)})"
            elif operation in ("contains", "fuzzy"):
                conditions = [f"{quoted_column} ILIKE '%{str(v)}%'" for v in values]
                clause = " OR ".join(conditions)
            elif operation == "startsWith":
                conditions = [f"{quoted_column} ILIKE '{str(v)}%'" for v in values]
                clause = " OR ".join(conditions)
            elif operation == "endsWith":
                conditions = [f"{quoted_column} ILIKE '%{str(v)}'" for v in values]
                clause = " OR ".join(conditions)
            elif operation == "between":
                if len(values) == 2:
                    clause = f"{quoted_column} BETWEEN '{str(values[0])}' AND '{str(values[1])}'"
                else:
                    raise ValueError("Between inclusive operation requires exactly 2 values.")
            elif operation == "greaterThan":
                clause = f"{quoted_column} > '{str(values[0])}'"
            elif operation == "greaterThanOrEqualTo":
                clause = f"{quoted_column} >= '{str(values[0])}'"
            elif operation == "lessThan":
                clause = f"{quoted_column} < '{str(values[0])}'"
            elif operation == "lessThanOrEqualTo":
                clause = f"{quoted_column} <= '{str(values[0])}'"
            else:
                raise ValueError(f"Unsupported operation: {operation}")

            where_clauses.append(f"({clause})")

    return " AND ".join(where_clauses)

def generate_where_clause_vertica(filter_options, filter_operations):
    """
    Generate a WHERE clause for a Vertica database query based on the provided filter options and operations.
    
    Args:
        filter_options (list of dict): List of dictionaries containing column names and their filter values
        filter_operations (list of dict): List of dictionaries containing column names and their operations
        
    Returns:
        str: A WHERE clause string for Vertica SQL
    """
    where_clauses = []

    for filter_option, filter_operation in zip(filter_options, filter_operations):
        for column, values in filter_option.items():
            # Vertica uses double quotes for identifiers similar to PostgreSQL
            quoted_column = f'"{column}"'
            operation = filter_operation.get(column)
            
            if values == []:
                continue  
                
            if operation == "equals":
                formatted_values = [f"'{str(v)}'" for v in values]
                clause = f"{quoted_column} IN ({', '.join(formatted_values)})"
            elif operation == "notEquals":
                formatted_values = [f"'{str(v)}'" for v in values]
                clause = f"{quoted_column} NOT IN ({', '.join(formatted_values)})"
            elif operation in ("contains", "fuzzy"):
                # Vertica uses ILIKE for case-insensitive pattern matching like PostgreSQL
                conditions = [f"{quoted_column} ILIKE '%{str(v)}%'" for v in values]
                clause = " OR ".join(conditions)
            elif operation == "startsWith":
                conditions = [f"{quoted_column} ILIKE '{str(v)}%'" for v in values]
                clause = " OR ".join(conditions)
            elif operation == "endsWith":
                conditions = [f"{quoted_column} ILIKE '%{str(v)}'" for v in values]
                clause = " OR ".join(conditions)
            elif operation == "between":
                if len(values) == 2:
                    clause = f"{quoted_column} BETWEEN '{str(values[0])}' AND '{str(values[1])}'"
                else:
                    raise ValueError("Between inclusive operation requires exactly 2 values.")
            elif operation == "greaterThan":
                clause = f"{quoted_column} > '{str(values[0])}'"
            elif operation == "greaterThanOrEqualTo":
                clause = f"{quoted_column} >= '{str(values[0])}'"
            elif operation == "lessThan":
                clause = f"{quoted_column} < '{str(values[0])}'"
            elif operation == "lessThanOrEqualTo":
                clause = f"{quoted_column} <= '{str(values[0])}'"
            else:
                raise ValueError(f"Unsupported operation: {operation}")

            where_clauses.append(f"({clause})")

    return " AND ".join(where_clauses)

class MySQLServices:
    """
    Manages connections and operations on a MySQL database.

    Provides methods for connecting, disconnecting, creating, reading, updating, and deleting records.

    Attributes:
        host (str): MySQL server hostname.
        user (str): Database username.
        password (str): Database password.
        database (str): Database name.
        port (int): Database port.
        connection (mysql.connector.Connection): Active database connection.
        logger: Logger instance for logging database operations.

    Methods:
        connect: Establishes a connection to the MySQL database.
        close_connection: Closes the active database connection.
        create_record: Inserts a single or multiple records into a table.
        read_records: Retrieves records from a table with optional filtering.
        update_record: Updates a record in a table with multiple WHERE conditions.
        delete_record: Deletes a record from a table with a WHERE clause.
    """

    def __init__(self, username: str, password: str, host: str, port: int, database: str):
        """Initialize the MySQLServices with connection parameters."""
        self.host = host
        self.user = username
        self.password = password
        self.database = database
        self.port = port
        self.connection = None

    def connect(self):
        """Establishes a connection to the MySQL database."""
        # Configure logging
        cursor_logger = LOGGINGS.CustomLogger()
        logger = cursor_logger.setup_logger()
        try:
            self.connection = mysql.connector.connect(
                host=self.host,
                user=self.user,
                password=self.password,
                database=self.database,
                port=self.port
            )
            logger.info("Connected to the MySQL database.")
            return self.connection
        except Error as e:
            logger.error(f"Error connecting to the database: {e}")
            self.connection = None

    def close_connection(self):
        """Closes the connection to the MySQL database."""
        # Configure logging
        cursor_logger = LOGGINGS.CustomLogger()
        logger = cursor_logger.setup_logger()
        if self.connection:
            self.connection.close()
            logger.info("MySQL database connection closed.")

    def create_record(self, table: str, data: Union[Dict, List[Dict]]):
        """
        Insert a single record or multiple records into the specified table.

        Args:
            table (str): The name of the table.
            data (dict or list of dict): A dictionary for a single record or a list of dictionaries for multiple records.
        """
        # Configure logging
        cursor_logger = LOGGINGS.CustomLogger()
        logger = cursor_logger.setup_logger()
        if not self.connection:
            logger.error("No active database connection.")
            return

        # Convert single dictionary to list for consistent handling
        if isinstance(data, dict):
            data = [data]

        # Get columns from the first dictionary
        columns = list(data[0].keys())
        columns_str = ", ".join(columns)
        placeholders = ", ".join(["%s"] * len(columns))

        query = f"INSERT INTO {table} ({columns_str}) VALUES ({placeholders})"

        # Extract values maintaining column order
        values = [[record[column] for column in columns] for record in data]

        try:
            cursor = self.connection.cursor()

            if len(values) > 1:
                cursor.executemany(query, values)
            else:
                cursor.execute(query, values[0])

            self.connection.commit()
            logger.info(f"{len(values)} record(s) inserted into {table}.")
        except Exception as e:
            logger.error(f"Failed to insert record(s): {e}")
            self.connection.rollback()

    def read_records(
            self,
            table: str,
            columns: Optional[List] = None,
            where_conditions: Optional[Dict] = None
        ):
        """
        Reads records from the specified table with optional column filtering and WHERE conditions.

        Args:
            table (str): Name of the table.
            columns (list, optional): List of column names to retrieve. If None, selects all columns.
            where_conditions (dict, optional): Dictionary of column-value pairs for WHERE clause.

        Returns:
            list: List of dictionaries containing the retrieved records.
        """
        # Configure logging
        cursor_logger = LOGGINGS.CustomLogger()
        logger = cursor_logger.setup_logger()
        if not self.connection:
            logger.error("No active database connection.")
            return 
        # Select all columns if none are specified
        select_clause = ", ".join(columns) if columns else "*"
        query = f"SELECT {select_clause} FROM {table}"
        params = []

        # Add WHERE conditions if specified
        if where_conditions:
            conditions = []
            for key, value in where_conditions.items():
                conditions.append(f"{key} = %s")
                params.append(value)
            query += " WHERE " + " AND ".join(conditions)

        try:
            # Use dictionary cursor to retrieve records as dictionaries
            cursor = self.connection.cursor(dictionary=True)
            cursor.execute(query, params)
            records = cursor.fetchall()
            logger.info(f"Retrieved {len(records)} record(s) from {table}.")
            return records

        except Error as e:
            logger.error(f"Failed to read records: {e}")
            return 

    def update_record(self, table: str, data: Dict, where_conditions: Dict):
        """
        Update records in the specified table with multiple WHERE conditions.

        Args:
            table (str): Name of the table.
            data (dict): Dictionary of column-value pairs to update.
            where_conditions (dict): Dictionary of column-value pairs for WHERE clause.
        """
        # Configure logging
        cursor_logger = LOGGINGS.CustomLogger()
        logger = cursor_logger.setup_logger()
        if not self.connection:
            logger.error("No active database connection.")
            return

        set_clause = ", ".join([f"{key} = %s" for key in data.keys()])
        where_clause = " AND ".join([f"{key} = %s" for key in where_conditions.keys()])

        query = f"UPDATE {table} SET {set_clause} WHERE {where_clause}"
        params = list(data.values()) + list(where_conditions.values())

        try:
            cursor = self.connection.cursor()
            cursor.execute(query, params)
            self.connection.commit()
            logger.info(f"Record(s) updated in {table}.")

        except Error as e:
            logger.error(f"Failed to update record: {e}")
            self.connection.rollback()

    def delete_record(self, table: str, where_conditions: Dict):
        """
        Delete records from the specified table with WHERE conditions.

        Args:
            table (str): Name of the table.
            where_conditions (dict): Dictionary of column-value pairs for WHERE clause.
        """
        # Configure logging
        cursor_logger = LOGGINGS.CustomLogger()
        logger = cursor_logger.setup_logger()
        if not self.connection:
            logger.error("No active database connection.")
            return

        where_clause = " AND ".join([f"{key} = %s" for key in where_conditions.keys()])
        query = f"DELETE FROM {table} WHERE {where_clause}"
        params = list(where_conditions.values())

        try:
            cursor = self.connection.cursor()
            cursor.execute(query, params)
            self.connection.commit()
            logger.info(f"Record(s) deleted from {table}.")

        except Error as e:
            logger.error(f"Failed to delete record: {e}")
            self.connection.rollback()


    # def execute_query(self, query: str, params: Optional[List] = None):
    #     """
    #     Executes a given SQL query with optional parameters.

    #     Args:
    #         query (str): The SQL query to execute.
    #         params (list, optional): List of parameters to pass to the query.

    #     Returns:
    #         list: List of dictionaries containing the retrieved records if it's a SELECT query.
    #     """
    #     # Configure logging
    #     cursor_logger = LOGGINGS.CustomLogger()
    #     logger = cursor_logger.setup_logger()
    #     if not self.connection:
    #         logger.error("No active database connection.")
    #         return

    #     try:
    #         # Use dictionary cursor to retrieve records as dictionaries
    #         cursor = self.connection.cursor(dictionary=True)
    #         cursor.execute(query, params)
    #         if query.strip().upper().startswith("SELECT"):
    #             records = cursor.fetchall()
    #             logger.info(f"Retrieved {len(records)} record(s).")
    #             return records
    #         else:
    #             self.connection.commit()
    #             logger.info("Query executed successfully.")
    #     except Error as e:
    #         logger.error(f"Failed to execute query: {e}")
    #         self.connection.rollback()
    
    
    
    def execute_query(self, query: str, params: Optional[List] = None):
        """
        Executes a given SQL query with optional parameters.

        Args:
            query (str): The SQL query to execute.
            params (list, optional): List of parameters to pass to the query.

        Returns:
            list: List of dictionaries containing the retrieved records if it's a SELECT query.
        """
        # Configure logging
        cursor_logger = LOGGINGS.CustomLogger()
        logger = cursor_logger.setup_logger()
        if not self.connection:
            logger.error("No active database connection.")
            return

        try:
            # Use dictionary cursor to retrieve records as dictionaries
            cursor = self.connection.cursor(dictionary=True)
            cursor.execute(query, params)
            query_upper = query.strip().upper()
            if query_upper.startswith(("SELECT", "WITH")):
                if cursor.description:
                    records = cursor.fetchall()
                    logger.info(f"Retrieved {len(records)} record(s).")
                    return records
                else:
                    self.connection.commit()
                    logger.info("Query executed successfully, no results returned.")
            else:
                self.connection.commit()
                logger.info("Query executed successfully.")
        except Error as e:
            logger.error(f"Failed to execute query: {e}")
            self.connection.rollback()
            
            


class OracleServices:
    """
    Manages connections and operations on an Oracle database.

    Provides methods for connecting, disconnecting, creating,\
          reading, updating, and deleting records.

    Attributes:
        connection_string (str): Oracle database connection string.
        user (str): Database username.
        password (str): Database password.
        connection (cx_Oracle.Connection): Active database connection.
        logger (Logger): Logger instance for logging database operations.
        database (str): Database name.

    Methods:
        connect: Establishes a connection to the Oracle database.
        close_connection: Closes the active database connection.
        create_record: Inserts a single or multiple records into a table.
        read_records: Retrieves records from a table with optional filtering.
        update_record: Updates a record in a table with multiple WHERE conditions.
        delete_record: Deletes a record from a table with a WHERE clause.
    """
    
    def __init__(self, user: str, password: str, host, port, database):
        """Initialize the OracleDatabaseManager with connection parameters."""
        self.connection_string = f"{user}/{password}@{host}:{port}"
        self.user = user
        self.password = password
        self.connection = None

        # Configure logging
        cursor_logger = LOGGINGS.CustomLogger()
        logger = cursor_logger.setup_logger()

        self.logger = logger
        self.database = database
    
    def connect(self):
        """Establishes a connection to the Oracle database."""
        try:
            self.connection = cx_Oracle.connect(self.connection_string)
            self.logger.info("Connected to the Oracle database.")
            # print("Connected to the Oracle database.")
            return self.connection
        except DatabaseError as e:
            self.logger.error(f"Error connecting to the database: {e}")
            self.connection = None

    def close_connection(self):
        """Closes the connection to the Oracle database."""
        if self.connection:
            self.connection.close()
            self.logger.info("Oracle database connection closed.")

    def create_record(self, table: str, data):
        """Insert a single record or multiple records into the specified table.

        Args:
            table (str): The name of the table.
            data (dict or list of dict): A dictionary for a \
                single record or a list of dictionaries for multiple records.
        """
        # Check for active connection
        if not self.connection:
            self.logger.error("No active database connection.")
            return

        # If data is a dictionary, convert it to a list of one dictionary for consistent handling
        if isinstance(data, dict):
            data = [data]

        # Get columns based on the first dictionary in data
        columns = ", ".join(data[0].keys())

        # Construct query with named placeholders
        placeholders = ", ".join([f":{i+1}" for i in range(len(data[0]))])

        query = f"INSERT INTO {table} ({columns}) VALUES ({placeholders})"

        # Extract values as list of lists for executemany
        values = [list(record.values()) for record in data]
        try:
            cursor = self.connection.cursor()

            # Use executemany for multiple records, execute for a single record
            if len(values) > 1:
                cursor.executemany(query, values)
            else:
                cursor.execute(query, values[0])

            # Commit transaction
            self.connection.commit()
            self.logger.info(f"{len(values)} record(s) inserted into {table}.")

        except DatabaseError as e:
            self.logger.error(f"Failed to insert record(s): {e}")

    def read_records(
        self, table: str, columns: list = None, where_conditions: dict = None
    ):
        """
        Reads records from the specified table with optional column\
              filtering and multiple WHERE conditions.

        :param table: Name of the table.
        :param columns: List of column names to retrieve. If None, selects all columns.
        :param where_conditions: Dictionary of column-value pairs for WHERE clause.
        :return: List of retrieved records.
        """
        if not self.connection:
            self.logger.error("No active database connection.")
            return

        # Prepare SELECT clause
        select_clause = ", ".join(columns) if columns else "*"

        # Prepare WHERE clause if conditions are provided
        if where_conditions:
            where_clause = " AND ".join(
                [f"{key} = :{key}" for key in where_conditions.keys()]
            )
            where_values = where_conditions
            query = f"SELECT {select_clause} FROM {table} WHERE {where_clause}"
        else:
            query = f"SELECT {select_clause} FROM {table}"
            where_values = {}

        try:
            cursor = self.connection.cursor()
            cursor.execute(query, where_values)
            records = []
            for row in cursor.fetchall():
                records.append(dict(zip([d[0] for d in cursor.description], row)))
            self.logger.info(f"Retrieved {len(records)} record(s) from {table}.")
            return records
        except DatabaseError as e:
            self.logger.error(f"Failed to read records: {e}")

    def update_record(self, table: str, data: dict, where_conditions: dict):
        """
        Update a record in the specified table with multiple WHERE conditions.

        :param table: Name of the table.
        :param data: Dictionary of column-value pairs to update.
        :param where_conditions: Dictionary of column-value pairs for WHERE clause.
        """
        if not self.connection:
            self.logger.error("No active database connection.")
            return

        # Prepare SET clause
        set_clause = ", ".join([f"{key} = :{key}" for key in data.keys()])
        set_values = data

        # Prepare WHERE clause with multiple conditions
        where_clause = " AND ".join(
            [f"{key} = :{key}" for key in where_conditions.keys()]
        )
        where_values = where_conditions

        # Combine values for SET and WHERE clauses
        query = f"UPDATE {table} SET {set_clause} WHERE {where_clause}"
        values = {**set_values, **where_values}

        try:
            cursor = self.connection.cursor()
            cursor.execute(query, values)
            self.connection.commit()
            self.logger.info(f"Record updated in {table}.")
        except cx_Oracle.DatabaseError as e:
            self.logger.error(f"Failed to update record: {e}")

    def delete_record(self, table: str, where_clause: str):
        """Delete a record from the specified table with a WHERE clause."""
        if not self.connection:
            self.logger.error("No active database connection.")
            return

        query = f"DELETE FROM {table} WHERE {where_clause}"

        try:
            cursor = self.connection.cursor()
            cursor.execute(query)
            self.connection.commit()
            self.logger.info(f"Record deleted from {table}.")
        except DatabaseError as e:
            self.logger.error(f"Failed to delete record: {e}")

    def execute_query(self, query: str, params = None):
        """
        Executes a given SQL query with optional parameters.

        Args:
            query (str): The SQL query to execute.
            params (dict, optional): Dictionary of parameters to pass to the query.

        Returns:
            list: List of dictionaries containing the retrieved records if it's a SELECT query.
        """
        if not self.connection:
            self.logger.error("No active database connection.")
            return

        try:
            cursor = self.connection.cursor()
            cursor.execute(query, params or {})
            if query.strip().upper().startswith("SELECT"):
                records = []
                for row in cursor.fetchall():
                    records.append(dict(zip([d[0] for d in cursor.description], row)))
                self.logger.info(f"Retrieved {len(records)} record(s).")
                return records
            else:
                self.connection.commit()
                self.logger.info("Query executed successfully.")
        except DatabaseError as e:
            self.logger.error(f"Failed to execute query: {e}")
            self.connection.rollback()

class PostgreSQLServices:
    """
    This class provides methods to interact with a PostgreSQL database. It supports creating, reading, updating, and deleting records in the database.
    """
    def __init__(self, username: str, password: str, host: str, port: int, database: str):
        """It initializes the database connection parameters."""
        self.host = host
        self.user = username
        self.password = password
        self.database = database
        self.port = port
        self.connection = None

        cursor_logger = LOGGINGS.CustomLogger()
        logger = cursor_logger.setup_logger()
        self.logger = logger

    def connect(self):
        """It establishes a connection to the PostgreSQL database."""
        try:
            self.connection = psycopg2.connect(
                host=self.host,
                user=self.user,
                password=self.password,
                dbname=self.database,
                port=self.port
            )
            self.logger.info("Connected to the PostgreSQL database.")
            return self.connection
        except Error as e:
            self.logger.error(f"Error connecting to the database: {e}")
            self.connection = None
            return None

    def close_connection(self):
        """It closes the connection to the PostgreSQL database."""
        if self.connection:
            self.connection.close()
            self.logger.info("PostgreSQL database connection closed.")

    def create_record(self, table: str, data: Union[Dict, List[Dict]]):
        """This method inserts a record or a list of records into the specified table."""
        if not self.connection:
            self.logger.error("No active database connection.")
            return

        if isinstance(data, dict):
            data = [data]

        columns = list(data[0].keys())
        columns_str = ", ".join(columns)
        values_str = ", ".join(["%s"] * len(columns))  # Changed from $1 to %s

        query = f"INSERT INTO {table} ({columns_str}) VALUES ({values_str})"

        try:
            cursor = self.connection.cursor()
            for record in data:
                values = [record[column] for column in columns]
                cursor.execute(query, values)
            
            self.connection.commit()
            self.logger.info(f"{len(data)} record(s) inserted into {table}.")

        except Error as e:
            self.logger.error(f"Failed to insert record(s): {e}")
            self.connection.rollback()

    def read_records(self, table: str, columns: Optional[List[str]] = None, where_conditions: Optional[Dict] = None) -> List[Dict]:
        """
        This method reads records from the specified table based on the provided columns and conditions.
        """
        if not self.connection:
            self.logger.error("No active database connection.")
            return []

        select_clause = ", ".join(columns) if columns else "*"
        query = f"SELECT {select_clause} FROM {table}"
        params = []

        if where_conditions:
            conditions = []
            for key, value in where_conditions.items():
                conditions.append(f"{key} = %s")  # Changed from $1 to %s
                params.append(value)
            query += " WHERE " + " AND ".join(conditions)

        try:
            cursor = self.connection.cursor(cursor_factory=DictCursor)
            cursor.execute(query, params)
            records = [dict(record) for record in cursor.fetchall()]
            self.logger.info(f"Retrieved {len(records)} record(s) from {table}.")
            return records

        except Error as e:
            self.logger.error(f"Failed to read records: {e}")
            return []

    def update_record(self, table: str, data: Dict, where_conditions: Dict):
        """
        This method updates records in the specified table based on the provided data and conditions."""
        if not self.connection:
            self.logger.error("No active database connection.")
            return

        set_items = []
        params = []
        
        # Build SET clause
        for key, value in data.items():
            set_items.append(f"{key} = %s")  # Changed from $1 to %s
            params.append(value)

        # Build WHERE clause
        where_items = []
        for key, value in where_conditions.items():
            where_items.append(f"{key} = %s")  # Changed from $1 to %s
            params.append(value)

        query = f"UPDATE {table} SET {', '.join(set_items)} WHERE {' AND '.join(where_items)}"

        try:
            cursor = self.connection.cursor()
            cursor.execute(query, params)
            self.connection.commit()
            self.logger.info(f"Record(s) updated in {table}.")

        except Error as e:
            self.logger.error(f"Failed to update record: {e}")
            self.connection.rollback()

    def delete_record(self, table: str, where_conditions: Dict):
        """This method deletes records from the specified table based on the provided conditions."""
        if not self.connection:
            self.logger.error("No active database connection.")
            return

        where_items = []
        params = []
        for key, value in where_conditions.items():
            where_items.append(f"{key} = %s")  # Changed from $1 to %s
            params.append(value)

        query = f"DELETE FROM {table} WHERE {' AND '.join(where_items)}"

        try:
            cursor = self.connection.cursor()
            cursor.execute(query, params)
            self.connection.commit()
            self.logger.info(f"Record(s) deleted from {table}.")

        except Error as e:
            self.logger.error(f"Failed to delete record: {e}")
            self.connection.rollback()


    # def execute_query(self, query: str, params: Optional[List] = None):
    #     """
    #     Executes a given SQL query with optional parameters.

    #     Args:
    #         query (str): The SQL query to execute.
    #         params (list, optional): List of parameters to pass to the query.

    #     Returns:
    #         list: List of dictionaries containing the retrieved records if it's a SELECT query.
    #     """
    #     # Configure logging
    #     cursor_logger = LOGGINGS.CustomLogger()
    #     logger = cursor_logger.setup_logger()
    #     if not self.connection:
    #         logger.error("No active database connection.")
    #         return

    #     try:
    #         # Use dictionary cursor to retrieve records as dictionaries
    #         cursor = self.connection.cursor(cursor_factory=DictCursor)
    #         cursor.execute(query, params)
    #         if query.strip().upper().startswith("SELECT"):
    #             records = cursor.fetchall()
    #             # records = [dict(record) for record in cursor.fetchall()]
    #             logger.info(f"Retrieved {len(records)} record(s).")
    #             return records
    #         else:
    #             self.connection.commit()
    #             logger.info("Query executed successfully.")
    #     except Error as e:
    #         logger.error(f"Failed to execute query: {e}")
    #         self.connection.rollback()


    def execute_query(self, query: str, params: Optional[List] = None):
        """
        Executes a given SQL query with optional parameters.

        Args:
            query (str): The SQL query to execute.
            params (list, optional): List of parameters to pass to the query.

        Returns:
            list: List of dictionaries containing the retrieved records if it's a SELECT query.
        """
        # Configure logging
        cursor_logger = LOGGINGS.CustomLogger()
        logger = cursor_logger.setup_logger()
        if not self.connection:
            logger.error("No active database connection.")
            return

        try:
            # Use dictionary cursor to retrieve records as dictionaries
            cursor = self.connection.cursor(cursor_factory=DictCursor)
            cursor.execute(query, params)
            query_upper = query.strip().upper()
            # if query.strip().upper().startswith("SELECT"):
            if query_upper.startswith("SELECT") or query_upper.startswith("WITH"):
                if cursor.description:  # cursor.description is None if no result set
                    records = cursor.fetchall()
                    logger.info(f"Retrieved {len(records)} record(s).")
                    return records
                else:
                    self.connection.commit()
                    logger.info("Query executed successfully, no results returned.")
            else:
                self.connection.commit()
                logger.info("Query executed successfully.")
        except Error as e:
            logger.error(f"Failed to execute query: {e}")
            self.connection.rollback()









class RedisService:
    """
    This class provides methods for interacting with Redis. It provides methods for creating a Redis connection, inserting data into Redis, and fetching data from Redis with pagination and optional filtering.
    """
    def __init__(self):
        """Initialize the RedisService class."""
        self.redis: Optional[Redis] = None
        self.pool: Optional[ConnectionPool] = None
        self.lock = asyncio.Lock()
        cursor_logger = LOGGINGS.CustomLogger()
        self.logger = cursor_logger.setup_logger()

    async def create_redis_connection(self, host: str, port: int, password: Optional[str] = None):
        """
        Create a Redis connection.

        Inputs:
        - host: Redis server hostname
        - port: Redis server port
        - password: Redis server password (optional)

        Outputs:
        - Redis connection object
        """

        if self.redis is None:
            self.logger.info("Creating new Redis connection")
            self.pool = ConnectionPool(
                host=host,
                port=port,
                password=password,
                decode_responses=True,
                max_connections=50  
            )
            self.redis = Redis(connection_pool=self.pool)
        return self.redis

    async def bulk_insert(self, table_name: str, df: pd.DataFrame):
        """
        This method converts a Pandas DataFrame into a list of dictionaries and stores each row as a 
        JSON string in Redis with a unique key. It uses Redis transactions to ensure atomicity and 
        increments a counter to track inserted records.
        """

        pipeline = self.redis.pipeline(transaction=True)  # Enable transactions
        counter_key = f'{table_name}:counter'

        rows = df.to_dict(orient='records')

        # Use Redis WATCH command to monitor the counter
        await self.redis.watch(counter_key)

        try:
            current_counter = await self.redis.get(counter_key)
            current_counter = int(current_counter or 0)

            pipeline.multi()  # Start transaction

            for i, row in enumerate(rows, start=1):

                counter = current_counter + i
                unique_key = f"{table_name}:{counter}"
                row_data = json.dumps(row)
                pipeline.set(unique_key, row_data)

            pipeline.incrby(counter_key, len(rows))  # Atomic increment

            await pipeline.execute()
            self.logger.info(f"Inserted {len(rows)} rows into {table_name}. New counter value: {current_counter + len(rows)}")
        except redis.WatchError:
            # If the counter was modified, retry the operation
            await pipeline.reset()
            return await self.bulk_insert(table_name, df)
        finally:
            await self.redis.unwatch()

    async def fast_fetch_data(self, table_name, page, page_size, cols, where_conds, limit):
        """
        Fetch data from Redis with pagination and optional filtering.

        Inputs:
        - table_name: Redis table name for fetching data
        - page: Page number for pagination
        - page_size: Number of records per page
        - cols: List of columns to fetch
        - where_conds: Dictionary of conditions for filtering data
        - limit: Limit on the number of records to fetch

        Outputs:
        - Compressed response containing the fetched data
        """
        self.logger.info(f"Fetching data from table: {table_name}")
        try:
            if not self.redis:
                self.logger.error("Redis connection not established")
                raise ValueError("Redis connection not established")
            if limit:
                total_records = limit
            else:
                total_records = await self.redis.get(f'{table_name}:counter')
                total_records = int(total_records or 0)
            
            self.logger.info(f"Total records in table {table_name}: {total_records}")

            if page is None or page_size is None:
                start_index = 1
                end_index = total_records
            else:
                start_index = (page - 1) * page_size + 1
                end_index = min(page * page_size, total_records)

            keys = [f"{table_name}:{i}" for i in range(start_index, end_index + 1)]
            self.logger.info(f"Keys generated for table {table_name}")

            chunk_size = int(config["dask_cluster"]["chunk_size"])
            tasks = []

            for i in range(0, len(keys), chunk_size):
                chunk_keys = keys[i:i+chunk_size]
                tasks.append(self._fetch_chunk(chunk_keys, cols, where_conds))

            self.logger.info(f"Fetching data in chunks for table {table_name}")
            data = await asyncio.gather(*tasks)

            self.logger.info(f"Compressing large dataset with {len(data)} records")
            compressed_data = zlib.compress(json.dumps(data, default=str).encode('utf-8'), level=zlib.Z_BEST_COMPRESSION)
            self.logger.info("Successfully compressed data")
            return Response(
                content=compressed_data,
                media_type='application/octet-stream',
                headers={
                    'Content-Encoding': 'zlib',
                    'X-Original-Content-Type': 'application/json'
                }
            )
        except Exception as e:
            self.logger.error(f"Error fetching data from Redis: {str(e)}")
            raise

    async def _fetch_chunk(self, keys, cols, where_conds):
        """
        Fetch a chunk of data from Redis.

        Inputs:
        - keys: List of Redis keys to fetch
        - cols: List of columns to fetch
        - where_conds: Dictionary of conditions for filtering data

        Outputs:
        - List of dictionaries containing the fetched data
        """
        self.logger.info(f"Fetching chunk of size {len(keys)}")
        pipeline = self.redis.pipeline()
        for key in keys:
            pipeline.mget(key)
        results = await pipeline.execute()
        selected_data = []
        data_list = results

        for key, row in zip(keys, data_list):
            if row[0]:
                row_data = json.loads(row[0])
                if all(row_data.get(field) == value for field, value in where_conds.items()):
                    if cols:
                        row_data = {col: row_data.get(col) for col in cols}
                    selected_data.append(row_data)
        
        self.logger.info(f"Fetched chunk of size {len(keys)}")
        return selected_data

    async def close(self):
        """
        Close the Redis connection and pool.
        """
        if self.redis:
            await self.redis.close()
            self.logger.info("Redis connection Closed")
        if self.pool:
            await self.pool.disconnect()
            self.logger.info("Redis pool disconected")

class VerticaServices:
    """
    Manages connections and operations on a Vertica database.

    Provides methods for connecting, disconnecting, creating, reading, updating, and deleting records.

    Attributes:
        host (str): Vertica server hostname.
        user (str): Database username.
        password (str): Database password.
        database (str): Database name.
        port (int): Database port.
        connection (vertica_python.Connection): Active database connection.
        logger: Logger instance for logging database operations.

    Methods:
        connect: Establishes a connection to the Vertica database.
        close_connection: Closes the active database connection.
        create_record: Inserts a single or multiple records into a table.
        read_records: Retrieves records from a table with optional filtering.
        update_record: Updates a record in a table with multiple WHERE conditions.
        delete_record: Deletes a record from a table with a WHERE clause.
    """

    def __init__(self, user: str, password: str, host: str, port: int, database: str):
        """Initialize the VerticaServices with connection parameters."""
        self.connection_info = {
            'host': host,
            'port': port,
            'user': user,
            'password': password,
            'database': database,
            'autocommit': False,  # For explicit transaction control
            'read_timeout': 600,  # 10 minutes
            'unicode_error': 'strict'
        }
        self.connection = None
        cursor_logger = LOGGINGS.CustomLogger()
        logger = cursor_logger.setup_logger()
        self.logger = logger

    def connect(self):
        """Establishes a connection to the Vertica database."""
        try:
            self.connection = vertica_python.connect(**self.connection_info)
            self.logger.info("Connected to the Vertica database.")
            return self.connection
        except Exception as e:
            self.logger.error(f"Error connecting to the database: {e}")
            self.connection = None

    def close_connection(self):
        """Closes the connection to the Vertica database."""
        if self.connection:
            self.connection.close()
            self.logger.info("Vertica database connection closed.")

    def create_record(self, table: str, data: Union[Dict, List[Dict]]):
        """
        Insert a single record or multiple records into the specified table.

        Args:
            table (str): The name of the table.
            data (dict or list of dict): A dictionary for a single record or a list of dictionaries for multiple records.
        """
        if not self.connection:
            self.logger.error("No active database connection.")
            return

        # Convert single dictionary to list for consistent handling
        if isinstance(data, dict):
            data = [data]

        # Get columns from the first dictionary
        columns = list(data[0].keys())
        columns_str = ", ".join(columns)
        
        # Vertica uses named parameters with :name style
        placeholders = ", ".join([f":{col}" for col in columns])

        query = f"INSERT INTO {table} ({columns_str}) VALUES ({placeholders})"

        try:
            cursor = self.connection.cursor()

            if len(data) > 1:
                # For bulk inserts in Vertica, we'll use executemany
                cursor.executemany(query, data)
            else:
                cursor.execute(query, data[0])

            self.connection.commit()
            self.logger.info(f"{len(data)} record(s) inserted into {table}.")

        except Exception as e:
            self.logger.error(f"Failed to insert record(s): {e}")
            self.connection.rollback()

        finally:
            if cursor:
                cursor.close()

    def read_records(
        self,
        table: str,
        columns: Optional[List[str]] = None,
        where_conditions: Optional[Dict] = None
    ) -> List[Dict]:
        """
        Reads records from the specified table with optional column filtering and WHERE conditions.

        Args:
            table (str): Name of the table.
            columns (list, optional): List of column names to retrieve. If None, selects all columns.
            where_conditions (dict, optional): Dictionary of column-value pairs for WHERE clause.

        Returns:
            list: List of dictionaries containing the retrieved records.
        """
        if not self.connection:
            self.logger.error("No active database connection.")
            return []

        select_clause = ", ".join(columns) if columns else "*"

        query = f"SELECT {select_clause} FROM {table}"
        params = {}

        if where_conditions:
            conditions = []
            for key, value in where_conditions.items():
                conditions.append(f"{key} = :{key}")
                params[key] = value
            query += " WHERE " + " AND ".join(conditions)

        try:
            cursor = self.connection.cursor('dict')  # Use dictionary cursor
            cursor.execute(query, params)
            records = cursor.fetchall()
            self.logger.info(f"Retrieved {len(records)} record(s) from {table}.")
            return records

        except Exception as e:
            self.logger.error(f"Failed to read records: {e}")
            return []

        finally:
            if cursor:
                cursor.close()

    def update_record(self, table: str, data: Dict, where_conditions: Dict):
        """
        Update records in the specified table with multiple WHERE conditions.

        Args:
            table (str): Name of the table.
            data (dict): Dictionary of column-value pairs to update.
            where_conditions (dict): Dictionary of column-value pairs for WHERE clause.
        """
        if not self.connection:
            self.logger.error("No active database connection.")
            return

        # Create SET clause with named parameters
        set_items = [f"{key} = :set_{key}" for key in data.keys()]
        where_items = [f"{key} = :where_{key}" for key in where_conditions.keys()]

        query = f"UPDATE {table} SET {', '.join(set_items)} WHERE {' AND '.join(where_items)}"

        # Prepare parameters with distinct names for SET and WHERE clauses
        params = {}
        for key, value in data.items():
            params[f"set_{key}"] = value
        for key, value in where_conditions.items():
            params[f"where_{key}"] = value

        try:
            cursor = self.connection.cursor()
            cursor.execute(query, params)
            self.connection.commit()
            self.logger.info(f"Record(s) updated in {table}.")

        except Exception as e:
            self.logger.error(f"Failed to update record: {e}")
            self.connection.rollback()

        finally:
            if cursor:
                cursor.close()

    def delete_record(self, table: str, where_conditions: Dict):
        """
        Delete records from the specified table with WHERE conditions.

        Args:
            table (str): Name of the table.
            where_conditions (dict): Dictionary of column-value pairs for WHERE clause.
        """
        if not self.connection:
            self.logger.error("No active database connection.")
            return

        where_items = [f"{key} = :{key}" for key in where_conditions.keys()]
        query = f"DELETE FROM {table} WHERE {' AND '.join(where_items)}"

        try:
            cursor = self.connection.cursor()
            cursor.execute(query, where_conditions)
            self.connection.commit()
            self.logger.info(f"Record(s) deleted from {table}.")

        except Exception as e:
            self.logger.error(f"Failed to delete record: {e}")
            self.connection.rollback()

        finally:
            if cursor:
                cursor.close()

    def bulk_load(self, table: str, data: List[Dict], batch_size: int = 1000):
        """
        Efficiently load large amounts of data using Vertica's bulk loading capabilities.

        Args:
            table (str): Name of the table.
            data (list of dict): List of dictionaries containing the data to load.
            batch_size (int): Number of records to insert in each batch.
        """
        if not self.connection:
            self.logger.error("No active database connection.")
            return

        if not data:
            self.logger.warning("No data provided for bulk load.")
            return

        try:
            cursor = self.connection.cursor()
            
            # Process data in batches
            for i in range(0, len(data), batch_size):
                batch = data[i:i + batch_size]
                
                # Get columns from the first record
                columns = list(batch[0].keys())
                columns_str = ", ".join(columns)
                placeholders = ", ".join([f":{col}" for col in columns])
                
                query = f"INSERT INTO {table} ({columns_str}) VALUES ({placeholders})"
                
                cursor.executemany(query, batch)
                self.connection.commit()
                
                self.logger.info(f"Loaded batch of {len(batch)} records into {table}.")

            total_records = len(data)
            self.logger.info(f"Bulk load completed. Total {total_records} records loaded into {table}.")

        except Exception as e:
            self.logger.error(f"Failed during bulk load: {e}")
            self.connection.rollback()

        finally:
            if cursor:
                cursor.close()

class DatabaseChunkProcessor:
    _redis_pool = redis.ConnectionPool(
        host=config.get("redis", {}).get("host"),
        port=int(config.get("redis", {}).get("port")),
        db=int(config.get("redis", {}).get("db")),
        password=config.get("redis", {}).get("password"),
        decode_responses=True,
        max_connections=500
    )

    def __init__(self):
        self._cache_ttl = int(config.get("redis", {}).get("cache_recycle"))


    def _get_connection_string(self, db_type, hostname, port, db_name, db_user, password):
        """Generate connection string based on database type."""
        cursor_logger = LOGGINGS.CustomLogger()
        logger = cursor_logger.setup_logger()
        password = quote_plus(password)
 
        logger.debug(f"Generating connection string for {db_type} database")
        try:
            if db_type == "mysql":
                return f"mysql+aiomysql://{db_user}:{password}@{hostname}:{port}/{db_name}"
            elif db_type == "postgres":
                return f"postgresql+asyncpg://{db_user}:{password}@{hostname}:{port}/{db_name}"
            elif db_type == "vertica":
                return f"vertica+vertica_python://{db_user}:{password}@{hostname}:{port}/{db_name}?tlsmode=disable"
            else:
                raise ValueError(f"Unsupported database type: {db_type}")
        except Exception as e:
            logger.error(f"Error generating connection string: {str(e)}")
            raise

    def _serialize_value(self, value: Any) -> Any:
        """Serialize Python objects for Redis storage."""
        try:
            cursor_logger = LOGGINGS.CustomLogger()
            logger = cursor_logger.setup_logger()
            if isinstance(value, (datetime, date)):
                return {"__type__": "datetime", "value": value.isoformat()}
            elif isinstance(value, time):
                return {"__type__": "time", "value": value.strftime('%H:%M:%S')}
            elif isinstance(value, Decimal):
                return {"__type__": "decimal", "value": str(value)}
            elif isinstance(value, bytes):
                return {"__type__": "bytes", "value": base64.b64encode(value).decode('utf-8')}
            elif isinstance(value, (list, tuple)):
                return [self._serialize_value(item) for item in value]
            elif isinstance(value, dict):
                return {key: self._serialize_value(val) for key, val in value.items()}
            elif isinstance(value, uuid.UUID):  # Explicitly check for UUID type
                return {"__type__": "uuid", "value": str(value)}             
            return value
        except Exception as e:
            logger.error(f"Error serializing value-{value}: {str(e)}")
            raise

    def _deserialize_value(self, value: Any) -> Any:
        """Deserialize stored Redis values back to Python objects."""
        try:
            cursor_logger = LOGGINGS.CustomLogger()
            logger = cursor_logger.setup_logger()
            if isinstance(value, dict) and "__type__" in value:
                if value["__type__"] == "datetime":
                    return datetime.fromisoformat(value["value"])
                elif value["__type__"] == "time":
                    return datetime.strptime(value["value"], '%H:%M:%S').time()
                elif value["__type__"] == "decimal":
                    return Decimal(value["value"])
                elif value["__type__"] == "bytes":
                    return base64.b64decode(value["value"])
                elif value["__type__"] == "uuid":
                    return uuid.UUID(value["value"])                    
            return value
        except Exception as e:
            logger.error(f"Error deserializing value: {str(e)}")
            raise

    def _serialize_row(self, row: dict) -> dict:
        return {key: self._serialize_value(value) for key, value in row.items()}

    def _deserialize_row(self, row: dict) -> dict:
        return {key: self._deserialize_value(value) for key, value in row.items()}

    async def _get_or_create_engine(self, db_type, hostname, port, db_name, db_user, password):
        """Get existing engine or create a new one, with engine caching."""
        cache_key = (db_type, hostname, port, db_name, db_user)
        cursor_logger = LOGGINGS.CustomLogger()
        logger = cursor_logger.setup_logger()
        logger.debug(f"Checking engine cache for key: {cache_key}")

        try:
            logger.info(f"Creating new engine for {cache_key}")
            connection_string = self._get_connection_string(db_type, hostname, port, db_name, db_user, password)
            if db_type == "vertica":
                # Synchronous engine for Vertica
                engine = create_engine(
                    connection_string)
                    # pool_pre_ping=True,
                    # pool_recycle=10,  
                    # pool_size=10,
                    # max_overflow=10 ) 
            else:                
                engine = create_async_engine(
                    connection_string,
                    pool_pre_ping=True,
                    pool_recycle=int(config["database_pool"]["pool_recycle"]),
                    pool_size=int(config["database_pool"]["pool_size"]),
                    max_overflow=int(config["database_pool"]["max_overflow"])
                )

            return engine
        except Exception as e:
            logger.error(f"Error getting or creating engine: {str(e)}")
            raise


    async def _fetch_data_from_db(self, db_type, query, hostname, port, db_name, db_user, password, page_size=None, page_no=None):
        """Fetch data from database and prepare response."""
        cursor_logger = LOGGINGS.CustomLogger()
        logger = cursor_logger.setup_logger()
        logger.debug(f"Fetching data from database for query: {query}")
        try:
            engine = await self._get_or_create_engine(db_type, hostname, port, db_name, db_user, password)
            session = None
            if db_type == "vertica":
                def run_in_thread():
                    try:
                        with Session(engine) as session:
                            with session.begin():
                                logger.info(f"Connected to vertica database")
                                # Get total records
                                total_records_query = f"SELECT COUNT(*) as total FROM ({query}) as subquery"
                                total_result = session.execute(text(total_records_query))
                                total_records = total_result.scalar()
                                logger.debug(f"Total records: {total_records}")

                                # Execute limited query to get column names and types
                                limited_query = f"SELECT * FROM ({query}) AS subquery LIMIT 1"
                                result = session.execute(text(limited_query))
                                column_names = result.keys()
                                logger.debug(f"Column names: {list(column_names)}")

                                # Define Vertica type mapping
                                vertica_type_mapping = config.get('vertica_data_types', {})

                                # Fetch column types using raw connection cursor
                                column_types = {}
                                raw_conn = session.connection().engine.raw_connection()
                                cursor = raw_conn.cursor()
                                cursor.execute(limited_query)
                                for desc in cursor.description:
                                    col_name = desc[0]
                                    col_type_code = desc[1]
                                    column_types[col_name] = vertica_type_mapping.get(col_type_code, f"UNKNOWN({col_type_code})")
                                cursor.close()
                                raw_conn.close()

                                # Fetch actual data
                                data = []
                                chunk_size = int(config["database_pool"]["chunk_size"])
                                if page_size and page_no:
                                    start = (page_no - 1) * page_size
                                    paginated_query = f"SELECT * FROM ({query}) AS subquery_with_original_limits LIMIT {page_size} OFFSET {start}"
                                    result = session.execute(text(paginated_query))
                                    data = [dict(zip(column_names, row)) for row in result.fetchall()]
                                elif total_records > chunk_size:
                                    for offset in range(0, total_records, chunk_size):
                                        chunk_query = f"SELECT * FROM ({query}) AS subquery_with_original_limits LIMIT {chunk_size} OFFSET {offset}"
                                        chunk_result = session.execute(text(chunk_query))
                                        data.extend([dict(zip(column_names, row)) for row in chunk_result.fetchall()])
                                else:
                                    result = session.execute(text(query))
                                    data = [dict(zip(column_names, row)) for row in result.fetchall()]

                                # Prepare response
                                response_data = {
                                    "data": data,
                                    "column_names": list(column_names),
                                    "total_records": total_records,
                                    "column_types": column_types
                                }
                                if page_size and page_no:
                                    response_data["total_pages"] = (total_records + page_size - 1) // page_size
                                logger.info(f"Data fetched successfully -")
                                return response_data
                    except Exception as e:
                        logger.error(f"Error in Vertica data fetch: {str(e)}")
                        raise

                return await asyncio.to_thread(run_in_thread)
                if result is None:
                    logger.error("Vertica fetch returned None unexpectedly")
                    raise ValueError("Vertica data fetch returned None")
                logger.info("Data fetched successfully")
                return result
            else:
                async with AsyncSession(engine) as session:
                    async with session.begin():
                        total_records_query = f"SELECT COUNT(*) as total FROM ({query}) as subquery"
                        total_result = await session.execute(text(total_records_query))
                        total_records = total_result.scalar()

                        limited_query = f"SELECT * FROM ({query}) AS subquery LIMIT 1"
                        result = await session.execute(text(limited_query))
                        column_names = result.keys()

                        column_types = {}
                        if db_type == "mysql":
                            mysql_data_types = config.get('mysql_data_types', {})
                            mysql_type_mapping = {int(key): value for key, value in mysql_data_types.items()}
                            for col in result.cursor.description:
                                column_types[col[0]] = mysql_type_mapping.get(col[1], f"UNKNOWN({col[1]})")
                        elif db_type == "postgres":
                            postgres_data_types = config.get('postgresql_data_types', {})
                            postgres_type_mapping = {int(key): value for key, value in postgres_data_types.items()}
                            for index, col in enumerate(result.keys()):
                                column_oid = result.cursor.description[index][1]
                                column_types[col] = postgres_type_mapping.get(column_oid, f"UNKNOWN({column_oid})")
                        chunk_size = int(config["database_pool"]["chunk_size"])
                        data = []
                        if page_size and page_no:
                            start = (page_no - 1) * page_size
                            paginated_query = f"SELECT * FROM ({query}) AS subquery_with_original_limits LIMIT {page_size} OFFSET {start}"
                            result = await session.execute(text(paginated_query))
                            data = [dict(zip(column_names, row)) for row in result.fetchall()]                        
                        elif total_records > chunk_size:
                            for offset in range(0, total_records, chunk_size):
                                chunk_query = f"SELECT * FROM ({query}) AS subquery_with_original_limits LIMIT {chunk_size} OFFSET {offset}"
                                chunk_result = await session.execute(text(chunk_query))
                                data.extend([dict(zip(column_names, row)) for row in chunk_result.fetchall()])                        
                        else:
                            result = await session.execute(text(query))
                            data = [dict(zip(column_names, row)) for row in result.fetchall()]

                        response_data = {
                            "data": data,
                            "column_names": list(column_names),
                            "total_records": total_records,
                            "column_types": column_types
                        }
                        logger.info(f"Fetched data successfully")

                        if page_size and page_no:
                            response_data["total_pages"] = (total_records + page_size - 1) // page_size

                        return response_data
        except Exception as e:
            logger.error(f"Error fetching data from database: {str(e)}")
            raise
        finally:
          if session and db_type != "vertica":  # Only close async sessions
              await session.close()
          if engine and db_type != "vertica":  # Only dispose async engines
              await engine.dispose()

    async def _fetch_and_cache_data(self, db_type, query, hostname, port, db_name, db_user, password, page_size, page_no, redis_conn, cache_key):
        """Fetch fresh data from DB and update the cache."""
        try:
            cursor_logger = LOGGINGS.CustomLogger()
            logger = cursor_logger.setup_logger()
            if db_type == "vertica":
                db_data = await self._fetch_data_from_db(db_type, query, hostname, port, db_name, db_user, password, page_size, page_no)
            else:
                db_data = await self._fetch_data_from_db(db_type, query, hostname, port, db_name, db_user, password, page_size, page_no)
                
            cache_data = db_data.copy()
            if len(db_data["data"]) <= int(config['redis']['cache_size_limit']):
                cache_data["data"] = [self._serialize_row(row) for row in db_data["data"]]
                redis_conn.setex(cache_key, self._cache_ttl, json.dumps(cache_data))
                logger.info("Cache updated successfully in the background")
            return db_data
        except Exception as e:
            logger.error(f"Error updating cache: {str(e)}")
            raise

    async def process_chunks(self, db_type, query, hostname, port, db_name, db_user, password, page_size=None, page_no=None):
        """Process data chunks with caching support."""
        cursor_logger = LOGGINGS.CustomLogger()
        logger = cursor_logger.setup_logger()
        logger.info(f"Processing data from {db_type} database")
        redis_conn = redis.Redis(connection_pool=self._redis_pool)
        try:
            query = query.replace(";", "")
            cache_key = json.dumps({
                "db_type": db_type, "query": query, "hostname": hostname, "port": port,
                "db_name": db_name, "db_user": db_user, "page_size": page_size, "page_no": page_no
            }, sort_keys=True)

            cached_data = redis_conn.get(cache_key)
            if cached_data:
                logger.info("Cache hit! Returning cached data immediately.")
                cached_data = json.loads(cached_data)
                cached_data["data"] = [self._deserialize_row(row) for row in cached_data["data"]]
                asyncio.create_task(
                    self._fetch_and_cache_data(
                        db_type, query, hostname, port, db_name, db_user, password,
                        page_size, page_no, redis_conn, cache_key
                    )
                )
                return cached_data

            logger.info("Cache miss. Fetching from database")
            return await self._fetch_and_cache_data(db_type, query, hostname, port, db_name, db_user, password, page_size, page_no, redis_conn, cache_key)
        except Exception as e:
            logger.error(f"Error in process_chunks: {str(e)}")
            raise
        finally:
            redis_conn.close()
            