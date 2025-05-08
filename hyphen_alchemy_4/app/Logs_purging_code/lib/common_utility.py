"""Common utility file include operations like read_config , create_log_handler """

import configparser
import os
import inspect
from datetime import datetime,timedelta
import logging
from venv import logger


class ConfigFileHandler:
    """
        ConfigFileHandler class used to create config file or folder and read config file
    """
    def __init__(self,base_dir,logger):
        """Initializes the ConfigFileHandler class"""
        self.base_dir = base_dir
        self.logger = logger
    def check_file_folder(self):
        """check if folder exists or not if not create one"""
        config_path = os.path.join(self.base_dir, 'config')
        try:
            if not os.path.exists(config_path):
                print("Dir Not Found")
                os.makedirs(config_path)
                self.logger.info("Created directory: %s",config_path)
            return True
        except OSError as e:
            self.logger.error("Error with file or directory creation: %s",str(e))
            return False

    def read_config(self):
        """read config file"""
        config = configparser.ConfigParser()
        config_path = os.path.join(self.base_dir,'config','config.ini')

        try:
            if not self.check_file_folder():
                pass
            if not os.path.exists(config_path):
                raise FileNotFoundError(f"Config file not found at {config_path}")
            config.read(config_path)
            if not config.read(config_path):
                raise configparser.Error(f"Error reading config file: {config_path}")
            filesections = config.sections()
            details = {}
            for section in filesections:
                details_dict = dict(config.items(section))
                details[section] = details_dict

            return details

        except FileNotFoundError as e:
            self.logger.error("Error: %s",str(e))
            return {}

        except configparser.Error as e:
            self.logger.error("Config file parsing error: %s",str(e))
            return {}

        except OSError as e:
            self.logger.error("Unexpected error while reading config: %s",str(e))
            return {}


class CustomLogger:
    """
    Logger for files that run once.
    """
    def __init__(self, log_folder=None):
        """
        Initializes the logger with an optional log folder path.
        """
        self.log_folder = log_folder or "logs"
        # self.retention_days = retention_days
        self.current_date = None
        self.logger = None

    def setup_logger(self):
        """
        Sets up a logger that writes to a log file in the specified log folder.
        Returns:
            logging.Logger or None: The logger instance if setup is successful, otherwise None.
        """
        try:
            # Create log directory if not exists
            if not os.path.exists(self.log_folder):
                os.makedirs(self.log_folder)

            # Get calling code's filename
            frame = inspect.stack()[1]
            calling_filename = inspect.getframeinfo(frame[0]).filename
            codename = os.path.splitext(os.path.basename(calling_filename))[0]

            # Set current date and log filename
            self.current_date = datetime.now().strftime("%Y-%m-%d")
            log_filename = os.path.join(
                self.log_folder, f"{codename}_{self.current_date}.log"
            )
            # Create logger
            self.logger = logging.getLogger(codename)
            self.logger.setLevel(logging.DEBUG)

            # Remove existing handlers
            self.logger.handlers.clear()

            # Create custom file handler
            handler = logging.FileHandler(log_filename)
            formatter = logging.Formatter(
                "%(levelname)s : %(asctime)s : %(name)s : %(funcName)s : %(lineno)d : %(message)s"
            )
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)

            return self.logger
        except Exception as e:
            print(f"Logger setup error: {str(e)}")
            return None

    def cleanup_old_logs(self,retention_days):
        """
        delete logs files that are older then specified Period
        """
        try:
            cutoff_date = datetime.now() - timedelta(days=int(retention_days))
            for filename in os.listdir(self.log_folder):
                if filename.endswith(".log"):
                    try:
                        file_path = os.path.join(self.log_folder, filename)
                        file_date_str = filename.split("_")[-1].split(".")[0]
                        file_date = datetime.strptime(file_date_str, "%Y-%m-%d")
                        if file_date < cutoff_date:
                            os.remove(file_path)
                            # print(f"Removed old log file: {filename}")
                            logger.info("Removed old log file: %s",filename)
                    except (ValueError, IndexError) as e:
                        # print(f"Error parsing date from filename '{filename}': {str(e)}")
                        logger.error("Error parsing date from filename '{%s}': {%s}",filename,e)
                        continue
        except Exception as e:
            logger.error("Log cleanup error: %s",e)
            # print(f"Log cleanup error: {str(e)}")
