from pprint import pprint
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
import os
from datetime import datetime, timedelta, timezone


class DOSpacesUploader:
    def __init__(self, space_endpoint, space_name, access_key, secret_key, retention_days):
        self.access_key = access_key
        self.secret_key = secret_key
       
        if not self.access_key or not self.secret_key:
            raise ValueError("DigitalOcean Spaces credentials are required. Set ACCESS_KEY and SECRET_KEY environment variables.")
       
        self.space_endpoint = space_endpoint
        self.bucket_name = space_name
        self.retention_days = retention_days

        self._init_client()
        self.cleanup_old_files()
 
    def _init_client(self):
        """Initialize the S3 client"""
        session = boto3.session.Session()
        self.client = session.client('s3',
            endpoint_url=f'https://{self.space_endpoint}',
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key
        )
 
    def cleanup_old_files(self):
        """Delete files older than retention_days"""
        try:
            current_time = datetime.now(timezone.utc)
            cutoff_time = current_time - timedelta(days=self.retention_days)
            paginator = self.client.get_paginator('list_objects_v2')
           
            deleted_count = 0
            for page in paginator.paginate(Bucket=self.bucket_name):
                if 'Contents' not in page:
                    continue
                   
                for obj in page['Contents']:
                    if obj['LastModified'] < cutoff_time:
                        self.client.delete_object(
                            Bucket=self.bucket_name,
                            Key=obj['Key']
                        )
                        deleted_count += 1
           
            return deleted_count
           
        except ClientError as e:
            print(f"Error during cleanup: {e}")
            return 0
 
    def upload_file(self, file_path, object_name=None):
        """
        Upload a file to DigitalOcean Spaces and return its URL
       
        Args:
            file_path (str): Path to the file to upload
            object_name (str, optional): Name to give the file in the space
           
        Returns:
            dict: Contains URL and object details, or None if upload fails
        """
        self.cleanup_old_files()
       
        # If full path is not provided, use current directory
        if not os.path.isabs(file_path):
            file_path = os.path.join(os.getcwd(), file_path)

        # Check if file exists
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"The file {file_path} does not exist")
       
        # If object_name not specified, use file_path
        if object_name is None:
            object_name = os.path.basename(file_path)
        
        object_name = object_name.replace(" ", "_")
       
        try:
            self.client.upload_file(
                Filename=file_path,
                Bucket=self.bucket_name,
                Key=object_name,
                ExtraArgs={'ACL': 'public-read'}
            )
           
            # Generate URL for the uploaded file
            url = f"https://{self.bucket_name}.{self.space_endpoint}/{object_name}"
           
            # Get object details
            response = self.client.head_object(
                Bucket=self.bucket_name,
                Key=object_name
            )
           
            return {
                'url': url,
                'object_name': object_name,
                'last_modified': response['LastModified'],
                'size': response['ContentLength'],
                'expiry_date': datetime.now(timezone.utc) + timedelta(days=self.retention_days)
            }
        except NoCredentialsError:
            print("Credentials not available")
            return None
        except ClientError as e:
            print(f"Upload error: {e}")
            return None
        except Exception as e:
            print(f"Unexpected error: {e}")
            return None

    def get_file_url(self, object_name):
        """
        Get the URL for an existing file in the space
       
        Args:
            object_name (str): Name of the file in the space
           
        Returns:
            str: URL of the file, or None if file doesn't exist
        """
        try:
            # Check if file exists
            self.client.head_object(
                Bucket=self.bucket_name,
                Key=object_name
            )
            return f"https://{self.bucket_name}.{self.space_endpoint}/{object_name}" 
        except ClientError:
            return None
 
    def list_files(self):
        """
        List all files in the space with their details
       
        Returns:
            list: List of dictionaries containing file details
        """
        try:
            files = []
            paginator = self.client.get_paginator('list_objects_v2')
           
            for page in paginator.paginate(Bucket=self.bucket_name):
                if 'Contents' not in page:
                    continue
                   
                for obj in page['Contents']:
                    files.append({
                        'name': obj['Key'],
                        'last_modified': obj['LastModified'],
                        'size': obj['Size'],
                        'url': f"https://{self.bucket_name}.{self.space_endpoint}/{obj['Key']}"
                    })
           
            return files   
        except ClientError as e:
            print(f"Error listing files: {e}")
            return []
