"""
This module is responsible for handling the password reset for Mphasis users.
It generates a new password for Mphasis users every 15 days and sends an email with the new password."""
import smtplib
import json
from datetime import datetime, timedelta
from email import encoders
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from utilities.config import config
import random
import string
import os
from .UserManagement import UserManagement
from utilities import loggings as LOGGINGS
#from utilities.database_services import DatabaseServices
# from database_services.common import CommonDatabaseServices
from database_services.common import CommonDatabaseServices , MySQLServices , PostgreSQLServices , OracleServices
from psycopg2.extras import RealDictCursor

 
class MphasisScheduler:
    """
    This class is responsible for handling the password reset for Mphasis users.
    It generates a new password for Mphasis users every 15 days and sends an email with the new password.
    """
    
    def __init__(self):
        """
        Initializes the AuthenticationManager with necessary configurations and setups.
        """
        self.otp_file_path = os.path.join(os.getcwd(), "service/otp_data.json")
        self.expiry_file_path = os.path.join(os.getcwd(), "service/mphasis_expiry.json")
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
        # self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.SMTP_SERVER = self.conf["schedulertask"]["smtp"]
        self.SMTP_PORT = int(self.conf["schedulertask"]["port"])
        self.SMTP_USERNAME = self.conf["schedulertask"]["email"]
        self.SMTP_PASSWORD = self.conf["schedulertask"]["password"]
        self.EMAIL_FROM = self.conf["schedulertask"]["email"]
 
    def send_email(self, receiver_email: str, password: str):
        """
        Sends an email to the user with the new password.
        :param receiver_email: Email address of the user
        :param password: New password generated for the user
        """
        html_content = """
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset Notification</title>
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
                .new-password {
                    font-size: 24px;
                    font-weight: bold;
                    color: #007bff;
                    margin-bottom: 10px;
                    letter-spacing: 5px;
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
                <h1>Password Reset Notification</h1>
                <p>Your password has been reset as part of Hyphenview security policy to reset passwords every 15 days.</p>
                <p class="new-password">%s</p>
                <p class="instructions">Please use the above password to log in to your account. Do not share this password with others.</p>
            </div>
        </body>
        </html>
        """ % (password)
        message = MIMEMultipart()
        message['Subject'] = 'Password Reset OTP'
        message['From'] = self.EMAIL_FROM
        message['To'] = receiver_email
        message.attach(MIMEText(html_content, 'html'))
        err = ''
        try:
            cursor_logger = LOGGINGS.CustomLogger()
            logging = cursor_logger.setup_logger()
            with smtplib.SMTP(self.SMTP_SERVER, self.SMTP_PORT) as server:
                server.starttls()
                server.login(self.SMTP_USERNAME, self.SMTP_PASSWORD)
                server.sendmail(self.EMAIL_FROM, [receiver_email], message.as_string())
            logging.info(f"Email sent successfully to {receiver_email}")
        except Exception as err:
            err = "Exception while sending the email: " + str(err)
            logging.error(f"Exception while sending the email to {receiver_email}: {err}")
    
    def generate_password(self,length=12):
        """
        Generates a random password with the specified length.
        """
        # Define the character sets
        upper = string.ascii_uppercase
        lower = string.ascii_lowercase
        digits = string.digits
        special = string.punctuation
 
        # Combine all character sets
        all_characters = upper + lower + digits + special
 
        # Ensure the password has at least one character from each set
        password = [
            random.choice(upper),
            random.choice(lower),
            random.choice(digits),
            random.choice(special)
        ]
 
        # Fill the rest of the password length with random characters
        password += random.choices(all_characters, k=length-4)
 
        # Shuffle the password list to ensure randomness
        random.shuffle(password)
 
        # Convert the list to a string and return
        return ''.join(password)
    
    def process_password(self):
        """
        This method processes the password reset for Mphasis users. It generates a new password for Mphasis users every 15 days and sends an email with the new password.
        """
        try:
            user_management = UserManagement(conf=config)
            # db_manager = CommonDatabaseServices()
            cursor_logger = LOGGINGS.CustomLogger()
            logging = cursor_logger.setup_logger()
            logging.info("Starting password processing for Mphasis users.")
            # database_mysql = db_manager.get_mysql_connection(self.mysql_database_url)
            database_type = "mysql"

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
            
            cursor.execute(f"SELECT user_email_id FROM {self.conf['database_tables']['user_account']} WHERE group_id IN (28)")
            mphasis_users = cursor.fetchall()
            logging.info(f"Fetched {len(mphasis_users)} Mphasis users from the database.")
 
            with open(self.expiry_file_path, 'r') as file:
                expiry_data = json.load(file)
                logging.info("Loaded expiry data from JSON file.")
 
            for user in mphasis_users:
                email = user['user_email_id']
                last_execution_time = expiry_data.get(email)
 
                if last_execution_time:
                    last_execution_time = datetime.strptime(last_execution_time, '%Y-%m-%d')
                else:
                    # If user is not present in the JSON file, add them with the current datetime
                    last_execution_time = datetime.now()
                    expiry_data[email] = last_execution_time.strftime('%Y-%m-%d')
                    logging.info(f"Added new user {email} to expiry data with current datetime.")
 
                # Check if the execution time is less than 15 days
                if datetime.now() - last_execution_time < timedelta(days=14):
                    logging.info(f"Skipping password reset for {email} as it was updated less than 14 days ago.")
                    continue
 
                # Generate a new password
                new_password = self.generate_password()
                logging.info(f"Generated new password for {email}.")
 
                # Update the password
                details = {
                    "new_password": new_password,
                    "database_type": "mysql",
                    "email": email
                }
                # print(new_password)
                result = user_management.edit_user(details)
 
                if result["status"] == "success":
                    # Send email with the new password
                    self.send_email(email, new_password)
                    logging.info(f"Password reset successfully for {email} and email sent.")
 
                    # Update the execution time in the JSON file
                    expiry_data[email] = datetime.now().strftime('%Y-%m-%d')
                else:
                    logging.error(f"Failed to reset password for {email}. Error: {result['message']}")
 
            # Save the updated JSON file
            with open(self.expiry_file_path, 'w') as file:
                json.dump(expiry_data, file)
                logging.info("Saved updated expiry data to JSON file.")
 
        except Exception as e:
            logging.error("Error processing passwords: %s", e)
            raise
