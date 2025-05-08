"""
module for login validation and authorization
"""
import os
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
from utilities import loggings
from utilities import config
import json
import configparser
from email.mime.text import MIMEText
import smtplib
import random
import string
from email.mime.multipart import MIMEMultipart
from datetime import timedelta, datetime
from fastapi.responses import JSONResponse
cursor_logger = loggings.CustomLogger()
logging = cursor_logger.setup_logger()
from database_services.common import CommonDatabaseServices , MySQLServices , PostgreSQLServices , OracleServices
from psycopg2.extras import RealDictCursor
 
 
class AuthenticationManager:
    """
    Manages authentication-related tasks such as login validation and authorization.
    """
    def __init__(self):
        """
        Initializes the AuthenticationManager with necessary configurations and setups.
        """
        self.otp_file_path = os.path.join(os.getcwd(), "service/otp_data.json")
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.base_dir = os.getcwd()
        self.logfilepath = os.path.join(self.base_dir, "logs")
        
        self.configfilepath = os.path.join(os.getcwd(), "config/config.ini")
        self.login_configfilepath = os.path.join(os.getcwd(), "config/login_attempts.ini")
        self.conf = config.read_config(self.configfilepath)
        self.login_conf = configparser.ConfigParser()
        self.login_conf.read(self.login_configfilepath)
        self.expire_minute = 10

        self.mysql_database_url = {
            "username": self.conf["mysql"]["mysql_username"],
            "password": self.conf["mysql"]["mysql_password"],
            "host": self.conf["mysql"]["mysql_host"],
            "port": self.conf["mysql"]["mysql_port"],
            "database": self.conf["mysql"]["mysql_new_schema"]
        }

        self.postgres_database_url = {
            "username": self.conf['postgres']['postgres_username'],
            "password": self.conf['postgres']['postgres_password'],
            "host": self.conf['postgres']['postgres_host'],
            "port": self.conf['postgres']['postgres_port'],
            "database": self.conf['postgres']['postgres_schema']
        }

        self.SMTP_SERVER = self.conf["schedulertask"]["smtp"]
        self.SMTP_PORT = int(self.conf["schedulertask"]["port"])
        self.SMTP_USERNAME = self.conf["schedulertask"]["email"]
        self.SMTP_PASSWORD = self.conf["schedulertask"]["password"]
        self.EMAIL_FROM = self.conf["schedulertask"]["email_from"]

        self.MAX_LOGIN_ATTEMPTS = int(self.conf["login_attempts_values"]["max_login_attempts"])  # Number of failed attempts before blocking
        self.BLOCK_DURATION = int(self.conf["login_attempts_values"]["block_duration"])  # Block duration in minutes
        
        # Ensure login_attempts section exists
        if not self.login_conf.has_section("login_attempts"):
            self.login_conf.add_section("login_attempts")
            self.login_conf.write(open(self.login_configfilepath, "w"))

        self.app = FastAPI()
        self.load_otp_database()
        self.user_account = self.conf["database_tables"]["user_account"]


    def load_otp_database(self):
        """
        Loads the OTP database from a JSON file.
        """
        if os.path.exists(self.otp_file_path):
            with open(self.otp_file_path, "r") as file:
                self.otp_database = json.load(file)
        else:
            self.otp_database = {}

    def save_otp_database(self):
        """
        Saves the OTP database to a JSON file.
        """
        with open(self.otp_file_path, "w") as file:
            json.dump(self.otp_database, file)
 
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
 
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """
        Verifies a plain password against a hashed password.
 
        Args:
            plain_password (str): The plain text password.
            hashed_password (str): The hashed password.
 
        Returns:
            bool: True if the password matches, False otherwise.
        """
        return self.pwd_context.verify(plain_password, hashed_password)
        # return True
    
    def track_login_attempt(self, username: str, success: bool = False):
        """
        Track login attempts for a specific username.
        Manages login attempt count and blocking mechanism.
        
        Args:
            username (str): The username attempting to log in
            success (bool): Whether the login attempt was successful
        
        Raises:
            HTTPException: With details about login blocking or remaining attempts
        """
        # Reload config to ensure we have the latest data
        self.login_conf.read(self.login_configfilepath)
        
        # Get current timestamp
        current_time = datetime.now()
        
        # Check if user is currently blocked
        if self.login_conf.has_option("login_attempts", f"{username}_block_until"):
            block_until = datetime.fromisoformat(
                self.login_conf.get("login_attempts", f"{username}_block_until")
            )
            
            # If still blocked, raise exception
            if current_time < block_until:
                remaining_time = int((block_until - current_time).total_seconds() / 60)
                raise HTTPException(
                    status_code=403,  # Changed to 403 Forbidden for clarity
                    detail=f"Account is blocked. Try again in {remaining_time} minutes."
                )
            else:
                # Block time has passed, remove blocking-related entries
                self.login_conf.remove_option("login_attempts", f"{username}_block_until")
        
        # If login is successful and not blocked
        if success:
            # Clear any existing login attempt tracking
            if self.login_conf.has_option("login_attempts", username):
                self.login_conf.remove_option("login_attempts", username)
            
            # Write changes to config file
            with open(self.login_configfilepath, "w") as config_file:
                self.login_conf.write(config_file)
            
            return
        
        # Track login attempts
        attempts = 0
        if self.login_conf.has_option("login_attempts", username):
            attempts = self.login_conf.getint("login_attempts", username)
        
        attempts += 1
        
        # Block user if max attempts reached
        if attempts >= self.MAX_LOGIN_ATTEMPTS:
            block_until = current_time + timedelta(minutes=self.BLOCK_DURATION)
            
            # Ensure login_attempts section exists
            if not self.login_conf.has_section("login_attempts"):
                self.login_conf.add_section("login_attempts")
            
            # Set block until time
            self.login_conf.set("login_attempts", f"{username}_block_until", 
                                block_until.isoformat())
            
            # Remove the attempts counter
            if self.login_conf.has_option("login_attempts", username):
                self.login_conf.remove_option("login_attempts", username)
            
            # Write changes immediately
            with open(self.login_configfilepath, "w") as config_file:
                self.login_conf.write(config_file)
            
            # Raise exception with block details
            raise HTTPException(
                status_code=403,
                detail=f"Account blocked due to multiple failed attempts. Try again in {self.BLOCK_DURATION} minutes."
            )
        
        # Update attempts
        self.login_conf.set("login_attempts", username, str(attempts))
        
        # Write changes
        with open(self.login_configfilepath, "w") as config_file:
            self.login_conf.write(config_file)
        
        # Raise exception for failed login
        remaining_attempts = self.MAX_LOGIN_ATTEMPTS - attempts
        raise HTTPException(
            status_code=401,
            detail=f"Invalid login. {remaining_attempts} attempts remaining."
        )
    
    def validate_login(self, user_email: str, password: str,database_type) -> dict:
        """
        Validates the login credentials of a user.

        Args:
            user_email (str): The email of the user.
            password (str): The password of the user.

        Returns:
            dict: A dictionary containing the validation result and status code.
        """
        # Configure logging
        cursor_logger = loggings.CustomLogger()
        logging = cursor_logger.setup_logger()
        logging.info("Received login request for user: %s", user_email)
        
        try:
            try:
                if database_type =="mysql":
                    database_url = self.mysql_database_url
                    database_service = MySQLServices(**database_url)
                elif database_type  == 'oracle':
                    database_url = self.oracle_database_url
                    database_service = OracleServices(**database_url)
                elif database_type  == 'postgres':
                    database_url = self.postgres_database_url
                    database_service = PostgreSQLServices(**database_url)

                database_conn = database_service.connect()
                cursor = database_conn.cursor()
            except Exception as e:
                logging.error("Error connecting to database: %s", str(e))
                return {
                    "validate": False,
                    "statusCode":self.conf['codes']['database error'],
                    "message": f"Error connecting to database: {e}",
                }

            
            # cursor = connection.cursor()
            query = f"SELECT * FROM {self.user_account} WHERE user_email_id = %s"
            cursor.execute(query, (user_email,))
            user = cursor.fetchone()
            
            # Handle blocked or invalid login attempts
            try:
                if user and self.verify_password(password, user[1]):
                    logging.info("Login successful for user: %s", user_email)
                    self.track_login_attempt(user_email, success=True)
                    # return {
                    #     "validate": True,
                    #     "statusCode":self.conf['codes']['success'],
                    #     "message": "username is valid",
                    # }
                
                    auth_result = self.authorization(user_email, database_type)
                    if auth_result["statusCode"]==200:
                        logging.info("Authorization successfull for the user: %s", user_email)
                        auth_result["validate"]= True
                        auth_result["message"]= "User is Validated and Authorized"
                        auth_result["database_type"] = database_type
                        return auth_result
                    else:
                        logging.error("Authorization failed for the user: %s", user_email)
                        return {
                            "validate": True,
                            "authorized": False,
                            "statusCode": self.conf['codes']['invalid authentication'],  # Forbidden if authorization fails
                            "message": "Authorization failed"
                        }
                
                # Invalid credentials
                logging.warning("Invalid login attempt for user: %s", user_email)
                self.track_login_attempt(user_email)
            
            except HTTPException as http_err:
                # Handle blocking and invalid login attempts
                return {
                    "validate": False,
                    "statusCode":self.conf['codes']['invalid authentication'],  # As you requested
                    "message": http_err.detail
                }
            
            # If no exception was raised, return invalid credentials
            return {
                "validate": False,
                "statusCode":self.conf['codes']['invalid authentication'],
                "message": "Invalid username or password",
            }
        
        except Exception as e:
            logging.error(
                "Error during login validation for user %s: %s", user_email, e
            )
            return {
                "validate": False,
                "statusCode":self.conf['codes']['internal error'],
                "message": f"Internal server error: {e}"
            }
        finally:
            if cursor:
                cursor.close()
            if database_conn:
                database_conn.close()

    def authorization(self, email: str, database_type: str) -> dict:
        """
        Authorizes a user based on their email and database type.
 
        Args:
            email (str): The email of the user.
            database_type (str): The type of database (e.g., "mysql").
 
        Returns:
            dict: A dictionary containing the authorization result and status code.
        """
        logging.info(
            "Received authorization request for user: %s with\
                      database type: %s",
            email,
            database_type,
        )
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


            query = f"SELECT * FROM {self.user_account} WHERE user_email_id = %s"
            cursor.execute(query, (email,))
            user_details = cursor.fetchall()
            if not user_details:
                logging.warning("No user found with email: %s", email)
                return {"statusCode":self.conf['codes']['no records'], "message": "No User Found"}
            
            group_id = user_details[0]["group_id"]
            cursor.execute(
                "SELECT user_email_id, accessmask, customer_id, \
                            customer_name, group_id, groupname, feature_id, \
                            feature_logo, featurename FROM view_user_access_group WHERE \
                            user_email_id = %s AND accessmask != 'null'",
                (
                    email,
                ),
            )
            result = cursor.fetchall()
            
            if not result:
                logging.warning("No features assigned to user: %s", email)
                return {"statusCode":self.conf['codes']['no records'], "message": "Not Assigned any Features"}
            modified_data = {}

            for item in result:
                user_email_id = item["user_email_id"]
                customer_id = item["customer_id"]
                # database_type = database_type
                group_id = item["group_id"]
                groupname = item["groupname"]
                feature_id = item["feature_id"]
                featurename = item["featurename"]
                customer_name = item["customer_name"]
                accessmask = item["accessmask"]
                feature_logo = item["feature_logo"]
                if (customer_id, group_id, groupname) not in modified_data:
                    modified_data[(customer_id, group_id, groupname)] = {
                        "user_email_id": user_email_id,
                        "customer_id": customer_id,
                        "customer_name": customer_name,
                        "group_id": group_id,
                        "groupname": groupname,
                        "database_type":database_type,
                        "features": [],
                    }
                modified_data[(customer_id, group_id, groupname)][
                    "features"
                ].append(
                    {
                        "feature_id": feature_id,
                        "featurename": featurename,
                        "accessmask": accessmask,
                        "feature_logo": feature_logo,
                        "group_id": group_id,
                        "groupname": groupname,
                    }
                )
            modified_data_list = list(modified_data.values())
            user_data = modified_data_list[0]
            if len(modified_data_list) > 1:
                for item in range(1,len(modified_data_list)):
                    for feature in modified_data_list[item]["features"]:
                        user_data["features"].append(feature)
            return {
                "statusCode":self.conf['codes']['success'],
                "user_data": user_data,
                "message": "user is authorized",
            }
        except Exception as e:
            logging.error("Error during authorization for user %s: %s", email, e)
            return {"statusCode":self.conf['codes']['internal error'],"message": str(e)}
        finally:
            if cursor:
                cursor.close()
            if database_conn:
                database_conn.close()

    def send_email(self, receiver_email: str, otp: str):
        """
        Sends an email with the OTP to the specified email address.
        """
        cursor_logger = loggings.CustomLogger()
        logging = cursor_logger.setup_logger()
        html_content = """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>OTP for Password Reset</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-image: url('https://t4.ftcdn.net/jpg/02/10/45/95/360_F_210459536_XmLDEcKq2DpeNLVmheuWeu9NM9aGKnih.jpg');
                        background-size: cover;
                        background-repeat: no-repeat;
                        background-position: center;
                        padding: 5px;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 70vh;
                    }
                    .container {
                        max-width: 600px;
                        background-color: rgba(255, 255, 255, 0.9);
                        padding: 10px;
                        border-radius: 10px;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                        text-align: center;
                    }
                    .logo {
                        margin-bottom: 20px;
                    }
                    .otp-code {
                        font-size: 24px;
                        font-weight: bold;
                        color: #007bff;
                        margin-bottom: 10px;
                        letter-spacing: 25px;
                    }
                    .instructions {
                        margin-top: 20px;
                        color: #555;
                        line-height: 1.5;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Your OTP</h1>
                    <p>Use the following OTP to complete the procedure to change your password.</p>
                    <p class="otp-code">%s</p>
                    <p class="instructions">OTP is valid for <span style="font-weight: 600; color: #1f1f1f;">%s minutes</span>.</p>
                    <p class="instructions">Do not share this code with others.</p>
                </div>
            </body>
            </html>
        """%(otp,self.expire_minute)
        message = MIMEMultipart()
        message['Subject'] = 'Password Reset OTP'
        message['From'] = self.EMAIL_FROM
        message['To'] = receiver_email
        message.attach(MIMEText(html_content, 'html'))
        code = '200'
        err=''
        try:
            with smtplib.SMTP(self.SMTP_SERVER, self.SMTP_PORT) as server:
                server.starttls()
                server.login(self.SMTP_USERNAME, self.SMTP_PASSWORD)
                server.sendmail(self.EMAIL_FROM, [receiver_email], message.as_string())
        except Exception as err:
            code='500'
            err="Exception while sending the email"+str(err)
            logging.error("Exception while sending the email", str(err))
        return code,err

    def generate_otp(self, length=4):
        otp = ''.join(random.choices(string.digits, k=length))
        return otp

    def request_otp_for_password_reset(self, req:dict):
        try:
            cursor_logger = loggings.CustomLogger()
            logging = cursor_logger.setup_logger()
            email = req.get("email")
            logging.info(f"Request received for OTP generation for email: {email}")
            database_type = req.get("database_type")

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

            if email not in self.otp_database:
                logging.info(f"Email {email} not found in OTP database. Checking user existence in database.")

                cursor.execute(f"SELECT user_email_id FROM {self.user_account} WHERE user_email_id=%s",
                               (email,))
                res = cursor.fetchone()
                if res:
                    # Generate and store OTP with timestamp
                    logging.info(f"User found with email {email}. Generating OTP.")
                    otp = self.generate_otp()
                    timestamp = datetime.now()
                    self.otp_database[email] = {"otp": otp, "timestamp": timestamp.isoformat()}
                    self.save_otp_database()
                    # Send OTP via email
                    code,err=self.send_email(email, otp)

                    if code=='200':
                        return JSONResponse(
                            status_code=200,
                            content={"statusCode":self.conf['codes']['success'],"message": "OTP sent to your email"})
                    else:
                        raise HTTPException(
                            status_code=500,
                            detail={"statusCode":self.conf['codes']['internal error'],"error":f"internal error {err}"}
                        )
                else:
                    return JSONResponse(
                        status_code=404,
                        content={"statusCode":self.conf['codes']['no records'],"message": f"User is not exist with email {email}"})
            else:
                if email in self.otp_database:
                    otp_data = self.otp_database[email]
                    timestamp = datetime.fromisoformat(otp_data["timestamp"])
                    if datetime.now() - timestamp > timedelta(minutes=self.expire_minute):
                        del self.otp_database[email]
                        self.save_otp_database()
                        otp = self.generate_otp()
                        timestamp = datetime.now()
                        self.otp_database[email] = {"otp": otp, "timestamp": timestamp.isoformat()}
                        self.save_otp_database()
                        code,err=self.send_email(email, otp)
                        if code=='200':
                            return JSONResponse(
                                status_code=200,
                                content={"statusCode":self.conf['codes']['success'],"message": "OTP sent to your email"}
                            )
                        else:
                            raise HTTPException(
                                status_code=500,
                                detail={"statusCode":self.conf['codes']['internal error'],"error":f"internal error {err}"}
                            )
                    else:
                        return JSONResponse(
                            status_code=400,
                            content={"statusCode":self.conf['codes']['bad request'],"message":"An OTP has already been requested for this email. Please check your email or try again later."}
                        )
        except Exception as e:
            return HTTPException(
                status_code=500,
                detail={"statusCode":self.conf['codes']['internal error'],"error":f"internal error {err}"})
        finally:
            if "cursor" and "connection" in locals():
                if cursor:
                    cursor.close()
                if database_conn:
                    database_conn.close()

    def verify_OTP(self, req: dict):
        """
        Verifies the OTP provided by the user.
        """
        try:
            email = req.get("email")
            if email in self.otp_database:
                otp_data = self.otp_database[email]
                timestamp = datetime.fromisoformat(otp_data["timestamp"])
                if datetime.now() - timestamp > timedelta(minutes=self.expire_minute):
                    del self.otp_database[email]
                    self.save_otp_database()
                    return JSONResponse(
                        status_code=401,
                        content={"statusCode":self.conf['codes']['invalid authentication'],"message": "OTP has expired. Please request a new one."}
                    )
                elif otp_data["otp"] == str(req.get("otp")):
                    return JSONResponse(
                        status_code=200,
                        content={"statusCode":self.conf['codes']['success'],"message": "OTP Verfied"})
                else:
                    return JSONResponse(
                        status_code=401,
                        content={"statusCode":self.conf['codes']['invalid authentication'],"message": "Invalid OTP. Please try again."}
                    )
            else:
                return JSONResponse(
                    status_code=401,
                    content={"statusCode":self.conf['codes']['invalid authentication'],"message": "No OTP found for this email."}
                )
        except Exception as err:
            return HTTPException(
                status_code=500,
                detail={"statusCode":self.conf['codes']['internal error'],"message": err})

    def resend_otp(self, req: dict):
        """
        Resends the OTP to the user's email.
        """
        try:
            email = req.get("email")
            if email in self.otp_database:
                del self.otp_database[email]
            otp = self.generate_otp()
            timestamp = datetime.now()
            self.otp_database[email] = {"otp": otp, "timestamp": timestamp.isoformat()}
            self.save_otp_database()
            self.send_email(email, otp)
            return JSONResponse(
                status_code=200,
                content={"statusCode":self.conf['codes']['success'],"message": "OTP sent to your email"})
        except Exception as err:
            return HTTPException(
                status_code=500,
                detail={"statusCode":self.conf['codes']['internal error'],"message": err})

