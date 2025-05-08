"""
Python purging code :- purging data from database
"""
# Author :- Yash Sharma
# Date :- 13th-December-2024
# Code :- Data Purging Code

import os
from datetime import datetime , timedelta
from dateutil.relativedelta import relativedelta
from lib import common_utility as common


base_dir = os.getcwd()
# cursor_logger = common.CustomLogger()
cursor_logger = common.CustomLogger()
logger = cursor_logger.setup_logger()
config = common.ConfigFileHandler(base_dir,logger)
details = config.read_config()
cursor_logger.cleanup_old_logs(details['logging']['retention'])


class DatabasePurging:
    """
        This class handles database purging tasks, Delete All The data that is older 
        than specified time from the given database and table
    """
    def __init__(self):
        """Initializes the DatabasePurging class"""

    def extract_period_and_unit(self, retention):
        """
            Extracts the period and the unit from a retention string (e.g., '10d', '3w').
            Args:
                retention (str): The retention string (e.g., '10d', '5months', '2w').
            Returns:
                tuple[int, str]: A tuple where the first element is the period (integer) and 
                                the second element is the unit (str).
        """
        try:
            numeric_part = ''
            unit_part = ''
            for char in retention:
                if char.isdigit():
                    numeric_part += char
                else:
                    unit_part += char
            period = int(numeric_part) if numeric_part else 0
            retention_unit = ""
            if unit_part.startswith('m') or unit_part.startswith('M'):
                retention_unit = "months"
            elif unit_part.startswith('w') or unit_part.startswith('W'):
                retention_unit = "weeks"
            elif unit_part.startswith('d') or unit_part.startswith('D'):
                retention_unit = "days"
            elif unit_part.startswith('h') or unit_part.startswith('H'):
                retention_unit = "hours"
            elif unit_part.startswith('mi') or unit_part.startswith('Mi'):
                retention_unit = "minutes"
            elif unit_part.startswith('s') or unit_part.startswith('S'):
                retention_unit = "seconds"
            return period, retention_unit
        except Exception as e:
            logger.error("Error extracting period and unit from retention: %s",e)
            raise

    def create_mapping(self, purging_details):
        """
            Creates a mapping based on the provided details dictionary, which includes 
            information about tables, columns, and retention times.
            Args:
                details (dict): A dictionary containing the necessary details for mapping, 
                                including keys like 'tablename', 'columnname', 'retentiondays', etc.
            Returns:
                list[dict]: A list of dictionaries containing the database and table , column , 
                retention_time  mappings.
        """
        try:
            """
            Creating dictionary Like This
            {
                datbasetype:val,
                databaseName:val, 
                tableDetails:{
                    tableName1 : { columnName:val,retentionTime:val,retentionUnit:val} , 
                    tableName2 :{ columnName:val,retentionTime:val,retentionUnit:val}
                },
            },{
                
            }
            """
            result = []
            for db, dbname, tables, columns, retention_days in zip(
                purging_details['db_type'].split('|'),
                purging_details['databasename'].split('|'),
                purging_details['tablename'].split('|'),
                purging_details['columnname'].split('|'),
                purging_details['retentiondays'].split('|')
            ):
                table_col_dict = {}
                for table, col, retention in zip(tables.split(','),
                                                 columns.split(','),
                                                 retention_days.split(',')):
                    period, retention_unit = self.extract_period_and_unit(retention)
                    table_col_dict[table] = {
                        "column_name": col,
                        "period": period,
                        "retention_time": retention_unit
                    }
                result.append({
                    "db_type": db,
                    "dbname": dbname,
                    "tables_details": table_col_dict
                })
            return result
        except KeyError as e:
            logger.error("Missing expected key in details: %s", e)
            raise
        except Exception as e:
            logger.error("Error creating mapping: %s", e)
            raise

    def calculate_time_diff(self, time_key, time_duration):
        """
            Calculates the time difference from the current date based on the provided 
            time key (e.g., 'days', 'months') and time duration.
            Args:
                time_key (str): The unit of time (e.g., 'months', 'days', 'hours', etc.).
                time_duration (int): The duration to subtract from the current time (e.g., 5, 10).
            Returns:
                datetime: A datetime object representing the calculated time difference.
        """
        try:
            time_diff = None
            if time_key == 'months':
                time_diff = datetime.now() - relativedelta(months=time_duration)
            elif time_key == 'weeks':
                time_diff = datetime.now() - timedelta(weeks=time_duration)
            elif time_key == 'hours':
                time_diff = datetime.now() - timedelta(hours=time_duration)
            elif time_key == 'days':
                time_diff = datetime.now() - timedelta(days=time_duration)
            elif time_key == 'minutes':
                time_diff = datetime.now() - timedelta(minutes=time_duration)
            elif time_key == 'seconds':
                time_diff = datetime.now() - timedelta(seconds=time_duration)
            else:
                raise ValueError(f"Please check your config file Unknown \
                                retention time unit: {time_key}")
            return time_diff
        except ValueError as e:
            logger.error("Invalid time unit in retention: %s ",e)
            raise
        except Exception as e:
            logger.error("Error calculating time difference: %s",e)
            raise

    def delete_data_from_tables(self,conn,cursor,data,db_name):
        """
            Iterates over all the tables in the given database and performs purging (deletes data).

            Args:
                conn (psycopg2.extensions.connection): The database connection object.
                cursor (psycopg2.extensions.cursor): The database cursor object.
                data (dict): A dictionary containing table details, including retention information.
                db_name (str): The name of the database.

            Returns:
                int: The number of rows affected by the DELETE operation.
        """
        for table_name, table_info in data['tables_details'].items():
            time_diff = self.calculate_time_diff(table_info.get('retention_time'),
                                                 table_info.get('period'))
            formatted_date = time_diff.strftime('%Y-%m-%d %H:%M:%S')
            logger.info("Deleting data older than %s %s from %s.%s", table_info.get('period'),
                        table_info.get('retention_time'), db_name, table_name)
            query = f"delete from {table_name} where {table_info.get('column_name')} < %s"
            cursor.execute(query, (formatted_date,))
            conn.commit()
            return cursor.rowcount

    def purging_code(self):
        """
        Function used to remove data that is older than x period of time
        -> find x-period-ago date to filiter data that is older than that date
        -> compare with that date to delete data
        """
        try:
            logger.info("Main Program Started")
            if len(details) != 0:
                result = self.create_mapping(details['purging_databases'])

                for data in result:
                    conn, status = common.connect_to_db(logger,data.get('db_type'),
                                                        details,data.get('dbname'))
                    if status == 200:
                        logger.info("%s %s database connected successfully",data.get('db_type') ,
                                    data.get('dbname'))
                        cursor = conn.cursor()
                        row_count = self.delete_data_from_tables(conn,cursor,
                                                                data,data.get('dbname'))
                        if row_count == 0:
                            logger.info("No older data found")
                        else:
                            logger.info("Data deleted successfully")
                        cursor.close()
                        conn.close()
                    if status != 200:
                        logger.error("Encountered Some Error while \
                                     connecting to %s DB",data.get('db_type'))
            if len(details) == 0:
                logger.error("No data Found in Config File")
            logger.info("Main Program Ended")
        except Exception as e:
            logger.error("Unexpected error during purging: %s",e)

if __name__ == "__main__":
    database_purging = DatabasePurging()
    database_purging.purging_code()
