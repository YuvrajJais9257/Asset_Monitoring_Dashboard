"""
This module contains the DaskService class, which provides methods to interact with Dask for processing data chunks."""
from distributed import Client, LocalCluster
import utilities.loggings as LOGGINGS
from fastapi.responses import Response
from dask.distributed import Client, LocalCluster
import asyncio
from utilities.config import config
import json
import zlib
import multiprocessing
from database_services.mysql_service import mysql_data_chunk, mysql_total_records, mysql_column_types
from database_services.postgres_service import postgres_data_chunk, postgres_total_records, postgres_column_types    


class DaskService:
    """
    This class provides methods to interact with Dask for processing data chunks.
    """
    _instance = None
    _client = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DaskService, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if not hasattr(self, "_initialized"):
            self._initialized = True

    def _get_logger(self):
        """Create and return a logger specific to a method."""
        cursor_logger = LOGGINGS.CustomLogger()
        return cursor_logger.setup_logger()

    def start_cluster(self):
        """
        Starts a local Dask cluster with configurations from `config`.
        """
        logger = self._get_logger()
        try:
            if self._client is None:
                cluster = LocalCluster(
                    n_workers=int(config["dask_cluster"]["num_workers"]),
                    memory_limit=config["dask_cluster"]["memory_limit"],
                    processes=True,
                    threads_per_worker=int(config["dask_cluster"]["threads_per_worker"]),
                    dashboard_address=":0",
                )
                self._client = Client(cluster)
                logger.info(f"Dask LocalCluster started with {config['dask_cluster']['num_workers']} workers")
            return self._client
        except Exception as e:
            logger.error(f"Error starting Dask LocalCluster: {str(e)}")
            raise

    @property
    def client(self):
        """
        Returns the Dask client instance.
        """
        logger = self._get_logger()
        try:
            if self._client is None:
                self._client = self.start_cluster()
            return self._client
        except Exception as e:
            logger.error("Error initializing Dask client.")
            raise

    async def process_chunks(self, db_type, query, hostname, port, db_name, db_user, password, page_size, page_no):
        """
        Process data chunks for MySQL and PostgreSQL databases using Dask.
 
        Inputs:
        - db_type: Type of the database (MySQL/PostgreSQL)
        - query: SQL query to fetch data
        - hostname: Database server hostname
        - port: Database server port
        - db_name: Database name
        - db_user: Database user
        - password: Database password
 
        Outputs:
        - Response object containing compressed JSON data
        """
        logger = self._get_logger()
        query = query.replace(";", "")
        try:
            if db_type == "mysql":
                total_records = await mysql_total_records(query, hostname, port, db_name, db_user, password)
                column_types = await mysql_column_types(query, hostname, port, db_name, db_user, password)
 
            elif db_type == "postgres":
                total_records = await postgres_total_records(query, hostname, port, db_name, db_user, password)
                column_types = await postgres_column_types(query, hostname, port, db_name, db_user, password)
            else:
                logger.error(f"Unsupported database type: {db_type}")
                raise ValueError(f"Unsupported database type: {db_type}")
 
            if total_records == 0:
                return {"status":200,"message": "No records found in database"}
 
            if self._client is None:
                self._client = self.start_cluster()
 
            if page_size and page_no:
                start = (page_no - 1) * page_size
                end = start + page_size
                chunks = [(i, page_size) for i in range(start, min(end, total_records), page_size)]
                total_pages = (total_records + page_size - 1) // page_size
            else:
                total_pages = None
                chunks = [
                    (i, int(config["dask_cluster"]["chunk_size"]))
                    for i in range(0, total_records, int(config["dask_cluster"]["chunk_size"]))
                ]
 
            futures = [
                self.client.submit(
                    self.fetch_data_chunk,
                    db_type,
                    query,
                    hostname,
                    port,
                    db_name,
                    db_user,
                    password,
                    start,
                    size,
                )
                for start, size in chunks
            ]
            results = self.client.gather(futures)
 
            all_data = [record for df in results for record in df.to_dict(orient="records")]
            if total_pages:
                response_data = {"data": all_data,
                                  "column_names":list(all_data[0].keys()),
                                    "total_pages": total_pages,
                                      "total_records": total_records,
                                      "column_types": column_types}
            else:
                response_data = {"data": all_data,
                                  "column_names":list(all_data[0].keys()),
                                    "total_records": total_records,
                                    "column_types": column_types}
 
            logger.info(f"Processed {total_records} records from {db_type} database.")
            return response_data
 
        except Exception as e:
            logger.error(f"Error in process_chunks: {str(e)}")
            raise
 
    @staticmethod
    async def fetch_data_chunk(db_type, query, hostname, port, db_name, db_user, password, offset, limit):
        """
        Fetch a chunk of data from the specified database asynchronously.

        Inputs:
        - db_type: Type of the database (e.g., MySQL, PostgreSQL)
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
        logger = LOGGINGS.CustomLogger().setup_logger()
        try:
            if db_type == "mysql":
                result = await mysql_data_chunk(query, hostname, port, db_name, db_user, password, offset, limit)
            elif db_type == "postgres":
                result = await postgres_data_chunk(query, hostname, port, db_name, db_user, password, offset, limit)
            else:
                logger.error(f"Unsupported database type: {db_type}")
                raise ValueError(f"Unsupported database type: {db_type}")
            return result
        except Exception as e:
            logger.error(f"Error fetching data chunk from {db_type} database: {str(e)}")
            raise

def create_dask_service():
    if __name__ == "__main__":
        multiprocessing.freeze_support()
        return DaskService()
    return DaskService()
