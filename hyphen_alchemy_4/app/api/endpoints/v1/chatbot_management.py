"""
Module for managing chatbot-related endpoints.
"""

import re
from fastapi import status, APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from database_services.common import CommonDatabaseServices , MySQLServices , PostgreSQLServices , OracleServices
from utilities.config import config as conf
from utilities.auth import AuthManager
from pydantic_models.chatbot_model import query_input
from  psycopg2.extras import DictCursor

# Initialize services and router
auth_manager = AuthManager()
db_manager = CommonDatabaseServices()
router = APIRouter()

# Prompt template for the natural language response
TEMPLATE = """
Based on the question, sql query, and sql response, write a natural language response and do not use any context of sql in your response:

Question: {question}
SQL Query: {query}
SQL Response: {response}
"""

prompt_response = ChatPromptTemplate.from_template(TEMPLATE)

# Full chain for handling queries and generating responses
full_chain = (
    RunnablePassthrough.assign(query=db_manager.get_query).assign(
        response=lambda vars: db_manager.run_query(vars),
    )
    | prompt_response
    | db_manager.llm
)

@router.post("/query")
async def execute_query(request: query_input, requestt: Request):
    """
        Executes an SQL query based on the request data and selected mode.

        Modes:
        - 'query': Generates an SQL query based on the user's question and schema.
        - 'fetch': Executes the generated query and fetches the results.

        Parameters:
        - request (query_input): The input request containing user details, mode, and query details.
        - requestt (Request): The FastAPI request object, used for authentication.

        Returns:
        - JSONResponse: Contains either the generated SQL query or the query result, depending on the mode.
    """
    try:
        # Check token and log the request
        await auth_manager.check_token(requestt)
        db_manager.logging.info("Received query request")

        # Extract relevant data from the request
        user_question = request.question
        mode = request.mode
        email = request.email
        database_type = request.database_type
        connection_type = request.connection_type
        schema_name = request.schema
        database_conn = None


        # Handle MySQL database type
        if database_type == "mysql":
            mysql_database_url = {
                "username": conf["mysql"]["mysql_username"],
                "password": conf["mysql"]["mysql_password"],
                "host": conf["mysql"]["mysql_host"],
                "port": conf["mysql"]["mysql_port"],
                "database": conf["mysql"]["mysql_new_schema"],
            }
            database_service = MySQLServices(**mysql_database_url)
            database_conn = database_service.connect()
            cursor = database_conn.cursor(dictionary=True)
        # Handle postgres database type
        elif database_type == "postgres":
            postgres_database_url = {
                "username": conf['postgres']['postgres_username'],
                "password": conf['postgres']['postgres_password'],
                "host": conf['postgres']['postgres_host'],
                "port": conf['postgres']['postgres_port'],
                "database": conf['postgres']['postgres_schema'],
            }
            database_service = PostgreSQLServices(**postgres_database_url)
            database_conn = database_service.connect()
            cursor = database_conn.cursor(cursor_factory=DictCursor)
        
        
        
        # Fetch customer_id
        cursor.execute(
            "SELECT customer_id FROM user_account WHERE user_email_id = %s",
            (email,),
        )
        result = cursor.fetchall()
        customer_id = result[0]["customer_id"]

        # Fetch database details
        cursor.execute(
            """
            SELECT domain_name, db_port, db_user_name, db_password
            FROM database_details 
            WHERE customer_id = %s AND db_schema_name = %s AND rdbms_name = %s
            """,
            (customer_id, schema_name, connection_type),
        )
        result = cursor.fetchall()
        db_details = {
            "db_type": connection_type,
            "host": result[0]["domain_name"],
            "port": result[0]["db_port"],
            "user": result[0]["db_user_name"],
            "password": result[0]["db_password"],
            "database": schema_name,
        }

        # Prepare schema and input data
        schema = (
            """Based on the table schema below, write a SQL query that would answer the user's question using columns and tables provided in the schema only and don't include any columns or tables in the results that are not of regular data types and not part of provided schema:\n"""
            + str(db_manager.get_schema(db_details))
        )

        input_data = {
            "schema": schema,
            "question": user_question,
            "db_details": db_details,
        }

        # Handle mode logic
        if mode == "query":
            generated_query = db_manager.get_query(input_data)
            generated_query = re.sub(
                r"\s+", " ", generated_query.strip())
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content={"statusCode":conf['codes']['success'],"query": generated_query},
            )

        if mode == "fetch":
            final_result = full_chain.invoke(input_data)
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content={"statusCode":conf['codes']['success'],"answer": final_result.content},
            )

        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"statusCode":conf['codes']['invalid request'],"message": "Invalid mode. Use 'query' or 'fetch'."},
        )
    
    except Exception as e:
        db_manager.logging.error(f"Internal server error: {e}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"statusCode":conf['codes']['internal error'],"message": f"Internal server error: {e}"},
        )

    finally:
        # Ensure database connections are closed
        if "cursor" in locals() and cursor:
            cursor.close()
        if "database_mysql" in locals() and database_conn:
            database_conn.close()
