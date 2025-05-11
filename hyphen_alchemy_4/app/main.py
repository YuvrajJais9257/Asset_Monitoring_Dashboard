"""
This module is the main entry point for the application. This file contains functions to run different APIs and starts them in separate processes.
"""
import multiprocessing
import subprocess
import uvicorn
import psutil
import os
import atexit
import time
from ScheduleTask import ScheduledTask
# pylint: disable=E0401
from utilities.config import config
from utilities.auth import AuthManager
# from service.DaskService import create_dask_service
 
auth = AuthManager()
auth.rotate_secret_key()
PID_FILE = 'my_script.pid'
LOCK_FILE = 'schedule_task.lock'

def remove_pid_file():
    """Remove the PID file if it exists."""
    try:
        os.remove(PID_FILE)
    except FileNotFoundError:
        pass

def run_api_db():
    """Run the database API."""
    uvicorn.run("middlware.db_management_middleware:db_app", host="0.0.0.0", port=8000 ,ssl_keyfile="/app/ssl/certificates/reissue/hyphenview.in_key.txt" ,ssl_certfile="/app/ssl/certificates/reissue/hyphenview.in.crt")

def run_api_main():
    """Run the main API."""
    uvicorn.run("middlware.middleware:create_app", host="0.0.0.0", port=3001,ssl_keyfile="/app/ssl/certificates/reissue/hyphenview.in_key.txt" ,ssl_certfile="/app/ssl/certificates/reissue/hyphenview.in.crt")

# for windows machine
# def run_api_report():
#    """Run the report API."""
#    uvicorn.run("middlware.report_management_middleware:report_app", host="0.0.0.0", port=3002, workers=1)

#for linux machine
def run_api_report():
    """Run the report API using Gunicorn for production."""
    num_workers = multiprocessing.cpu_count()  # Recommended: 2x CPUs for optimal performance
    port = 3002
    host = "0.0.0.0"
 
    print(f"Starting API on {host}:{port} with {num_workers} Gunicorn workers...")
 
    # Command to run Gunicorn with Uvicorn workers
    command = [

         "gunicorn",

         "-w", str(num_workers),  # Number of workers

         "-k", "uvicorn.workers.UvicornWorker",  # Use Uvicorn worker class

         "middlware.report_management_middleware:report_app",  # Module:App format

         "--bind", f"{host}:{port}",

         "--certfile", "/app/ssl/certificates/reissue/hyphenview.in.crt",  # Path to your SSL certificate

         "--keyfile", "/app/ssl/certificates/reissue/hyphenview.in_key.txt"       # Path to your private key

     ]

     # Run the command
    # Command to run Gunicorn with Uvicorn workers
    subprocess.run(command)

def acquire_lock():
    """Try to acquire a lock using a lock file."""
    try:
        if os.path.exists(LOCK_FILE):
            # Check if the process holding the lock is still running
            with open(LOCK_FILE, 'r') as f:
                pid = int(f.read().strip())
            if psutil.pid_exists(pid):
                return False
            else:
                # The process is not running, we can remove the stale lock
                os.remove(LOCK_FILE)
        
        with open(LOCK_FILE, 'w') as f:
            f.write(str(os.getpid()))
        return True
    except:
        return False

def release_lock():
    """Release the lock by removing the lock file."""
    try:
        os.remove(LOCK_FILE)
    except FileNotFoundError:
        pass

def run_api_schedule():
    """Run the scheduled tasks."""
    if not acquire_lock():
        print("Another instance of ScheduleTask is already running.")
        return

    # If we got here, we have the lock
    with open(PID_FILE, 'w') as f:
        f.write(str(os.getpid()))
    
    try:
        ScheduledTask(config).run()
    finally:
        release_lock()
        remove_pid_file()

def run_api_chatbot():
    """Run the chatbot API."""
    uvicorn.run("middlware.chatbot_management_middleware:chatbot_management_app", host="0.0.0.0",port=9001,ssl_keyfile="/app/ssl/certificates/reissue/hyphenview.in_key.txt" ,ssl_certfile="/app/ssl/certificates/reissue/hyphenview.in.crt")

def is_port_in_use(port):
    """Check if a port is in use."""
    for conn in psutil.net_connections():
        if conn.status == 'LISTEN' and conn.laddr.port == port:
            return True
    return False

def start_api(target, port):
    """Start an API if it's not already running."""
    if port is None or not is_port_in_use(port):
        process = multiprocessing.Process(target=target)
        process.start()

if __name__ == "__main__":
    """Start all APIs and keep the main process running."""
    # create_dask_service().start_cluster()
    start_api(run_api_db, 8000)
    start_api(run_api_main, 3001)
    start_api(run_api_report, 3002)
    start_api(run_api_schedule, None)
    start_api(run_api_chatbot, 9001)

    # Keep the main process running
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Shutting down...")

