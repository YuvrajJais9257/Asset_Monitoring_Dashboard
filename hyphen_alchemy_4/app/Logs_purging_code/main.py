"""
Python purging code :- purging logs from given directory
"""
# Author :- Yash Sharma
# Date :- 06th-January-2025
# Code :- Logs Purging Code

import os
import time
import pathlib
from datetime import datetime, timedelta
from lib import common_utility as common


base_dir = os.getcwd()
cursor_logger = common.CustomLogger()
logger = cursor_logger.setup_logger()
config = common.ConfigFileHandler(base_dir,logger)
details = config.read_config()
#print(details)
cursor_logger.cleanup_old_logs(details['code_logs_retention_time']['retention_days'])

class LogsPurging:
    """
    This class handles logs purging tasks, Delete All The logs file that is older 
    than specified time from the given directories in config file
    """
    def __init__(self):
        """Initializes the LogsPurging class"""

    def purge_files(self,directory):
        """
        Purge all logs files in the specified directory that were generated more than a 
        specified time ago,
        """
        logger.info("Purging for files started...")
        # Calculate the cutoff timestamp for one week ago
        retention_time = details['retention_time']['retention_week']
        # Change according to need.
        cutoff_date = datetime.now() - timedelta(weeks=int(retention_time))
        cutoff_timestamp = time.mktime(cutoff_date.timetuple())

        # Get all files in the specified directory
        logger.info("Deleting files older than %s week (%s)...",retention_time,cutoff_date)
        count = 0

        # Iterate through given directory to get files in that dir
        for filename in os.listdir(directory):
            file_path = os.path.join(directory, filename)
            file_extension = pathlib.Path(file_path).suffix
            # Check if the current item is a file and should be of log type
            if os.path.isfile(file_path) and file_extension == '.log':
                # Get the last modified time of the file
                file_modified_time = os.path.getmtime(file_path)
                if file_modified_time < cutoff_timestamp:
                    count+=1
                    logger.info("Deleting file: %s",file_path)
                    #print(f"Deleting file: {file_path}")
                    os.remove(file_path)
        logger.info("Purging Successfull !!! Deleted %s files.",count)

if __name__ == "__main__":
    try:
        logs_purging = LogsPurging()

        for path_name,path in details.get('purging_directory_paths').items():
            logs_purging.purge_files(path)

    except Exception as err:
        logger.error(err)