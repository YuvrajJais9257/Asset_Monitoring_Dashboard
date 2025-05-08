"""This module contains the CustomLogger class which is used to create and manage loggers for different modules in the application. It also provides a method to cleanup old log files based on the retention period set in the configuration file."""

import os
import sys
import time
import inspect
import logging
from datetime import datetime
import threading
# pylint: disable=E0401
from utilities.config import config
import datetime

tms = time.time()
tms_format = datetime.datetime.fromtimestamp(tms).strftime("%Y-%m-%d")
base_dir = os.getcwd()
if not os.access(base_dir, os.W_OK):
    sys.exit("No Write Permission")


filename = inspect.getframeinfo(inspect.currentframe()).filename
executablepath = os.path.dirname(os.path.abspath(filename))
programname = os.path.splitext(os.path.basename(filename))[0]
path = executablepath.split("\\")
path.pop()
S = "\\"
LOG_DIR = S.join(path)


class NoRotationFileHandler(logging.FileHandler):
    """Custom FileHandler class to prevent automatic log rotation."""
    def __init__(self, filename, mode='a', encoding=None, delay=False):
        """Initialize the NoRotationFileHandler."""
        super().__init__(filename, mode, encoding, delay)
        self.baseFilename = filename

    def doRollover(self):
        """Override the doRollover method to prevent log rotation."""
        # Prevent automatic rotation
        pass


class CustomLogger:
    """CustomLogger class to create and manage loggers for different modules."""

    def __init__(self, log_folder=None, retention_days=int(config['logging']['retention'])):
        """Initialize the CustomLogger."""
        self.log_folder = log_folder or "logs"
        self.retention_days = retention_days
        self.current_date = None
        self.logger = None
        self.lock = threading.Lock()

    def get_logger(self):
        """Get the logger instance."""
        with self.lock:
            today = datetime.datetime.now().strftime("%Y_%m_%d")
            if today != self.current_date:
                self.cleanup_old_logs()
                self.setup_logger()
            return self.logger

    def setup_logger(self):
        """Setup the logger with a custom file handler."""
        try:
            # Create log directory if not exists
            if not os.path.exists(self.log_folder):
                os.makedirs(self.log_folder)
                
            self.cleanup_old_logs()

            # Get calling code's filename
            frame = inspect.stack()[1]
            calling_filename = inspect.getframeinfo(frame[0]).filename
            codename = os.path.splitext(os.path.basename(calling_filename))[0]

            # Set current date and log filename
            self.current_date = datetime.datetime.now().strftime("%Y_%m_%d")
            log_filename = os.path.join(
                self.log_folder, f"{codename}-{self.current_date}.log"
            )
            
            # Create logger
            self.logger = logging.getLogger(codename)
            self.logger.setLevel(logging.DEBUG)

            # Remove existing handlers
            self.logger.handlers.clear()

            # Create custom file handler
            handler = NoRotationFileHandler(log_filename, mode='a', encoding='utf-8')
            formatter = logging.Formatter(
                "%(levelname)s : %(asctime)s : %(name)s : %(funcName)s : %(lineno)d : %(message)s"
            )
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)

            return self.logger
        except Exception as e:
            print(f"Logger setup error: {str(e)}")
            return None

    def cleanup_old_logs(self):
        """Cleanup old log files based on the retention period."""
        try:
            cutoff_date = datetime.datetime.now() - datetime.timedelta(days=self.retention_days)
            
            for filename in os.listdir(self.log_folder):
                if filename.endswith(".log"):
                    try:
                        file_path = os.path.join(self.log_folder, filename)
                        file_date_str = filename.split("-")[1].split(".")[0]
                        file_date = datetime.datetime.strptime(file_date_str, "%Y_%m_%d")
                        
                        if file_date < cutoff_date:
                            os.remove(file_path)
                            print(f"Removed old log file: {filename}")
                    except (ValueError, IndexError):
                        continue
        except Exception as e:
            print(f"Log cleanup error: {str(e)}")
