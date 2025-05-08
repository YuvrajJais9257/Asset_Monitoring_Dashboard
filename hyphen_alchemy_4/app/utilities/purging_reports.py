import os
import datetime

def delete_old_files(directory, days=10):
    """
    Deletes files older than the specified number of days.

    Args:
        directory (str): Path to the directory containing files.
        days (int): Number of days. Files older than this will be deleted.

    Returns:
        None
    """
    # Calculate the cutoff date
    cutoff_date = datetime.datetime.now() - datetime.timedelta(days=days)

    # Iterate through files in the directory
    for filename in os.listdir(directory):
        file_path = os.path.join(directory, filename)

        # Check if it's a file (not a directory)
        if os.path.isfile(file_path):
            # Get the file's creation date
            file_date = datetime.datetime.fromtimestamp(os.path.getctime(file_path))
            print(file_date,cutoff_date)
            # Delete the file if it's older than the cutoff date
            if file_date < cutoff_date:
                print(f"Deleting file: {filename}")
                os.remove(file_path)
