"""A module to handle sending emails via Office 365 SMTP server, including attachments."""

import os
import smtplib
from email import encoders
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
# pylint: disable=E0401
from utilities.config import config
from service.DigitalOceanService import DOSpacesUploader


class SendEmailOffice365:
    """
    A class to handle sending emails via Office 365 SMTP server, including attachments.
    """
    def __init__(self, email, password, smtp, port, logger):
        """Initializes the SendEmailOffice365 class."""
        logger.info("Send Email")
        self.email = email
        self.password = password
        self.smtp = smtp
        self.port = port
        self.config = config
        # self.start_tls = config['schedulertask']['use_tls']
        self.logger = logger
        self.uploader = DOSpacesUploader(
            space_endpoint = config["digitalocean_cred"]["space_endpoint"],
            space_name = config["digitalocean_cred"]["space_name"],
            access_key = config["digitalocean_cred"]["access_key"],
            secret_key = config["digitalocean_cred"]["dig_ocean_secret_key"],
            retention_days = int(config["digitalocean_cred"]["retention_days"])  # Files older than 7 days will be automatically deleted
        )
        # self.reportfile_size = config["schedulerTask"]["reportfile_size"]

    def send_email_with_attachments(
        self, recipient_email, cc_emails, subject, body, attachment_paths
    ):
        """
        Sends an email with attachments using the Office 365 SMTP server.
        """
        msg = MIMEMultipart()
        msg["From"] = self.email
        msg["To"] = ", ".join(recipient_email)
        msg["Cc"] = ", ".join(cc_emails) if cc_emails else ""
        msg["Subject"] = subject

        # print(msg)
       
        total_file_size = sum(os.path.getsize(file) for file in attachment_paths) / (1024 * 1024)

        self.logger.info(f"Total attachment size is: {total_file_size}")

        file_url = []

        if total_file_size > 20:
            self.logger.info("Total Attachment file size is greater than 20 mb")
            for attachment_path in attachment_paths:
                try:
                    upload_res= self.uploader.upload_file(attachment_path)
                    if upload_res:
                        # filename = os.path.basename(attachment_path)
                        filename, _ = os.path.splitext(os.path.basename(attachment_path))  # Remove file extension
                        file_url.append(f"{filename}: {upload_res['url']}")
                        self.logger.info(f"Uploaded file URL: {upload_res['url']}")
                except Exception as err:
                    self.logger.error(f"Error uploading file {attachment_path}: str{err}")
                    raise
        
        else:
            self.logger.info("Attachment file size is less than 20 mb")
            for attachment_path in attachment_paths:
                try:
                    file_size = os.path.getsize(attachment_path) / (1024 * 1024)
                    self.logger.info(f"Processing file: {attachment_path} ({file_size} MB)")
                    with open(attachment_path, "rb") as attachment:
                        part = MIMEBase("application", "octet-stream")
                        part.set_payload(attachment.read())
                    # Encode file in ASCII characters to send by email
                    encoders.encode_base64(part)
 
                    # Add header as key/value pair to attachment part
                    filename = attachment_path.split("/")[1]
                    part.add_header("Content-Disposition", f"attachment; filename= {filename}")
 
                    msg.attach(part)
                except Exception as err:
                    self.logger.error(f"Error processing attachment {attachment_path}: {err}")
                    raise       
       
        if file_url:
            file_url_text = "\n".join(file_url)
            body += f"\n\nAttachments exceeding 20MB have been uploaded. Please click on below link to download the same:\n{file_url_text}\n"
       
        body_signature = body + f"\n\n{config['schedulertask']['message_1']},\n{config['schedulertask']['message_2']}"
        msg.attach(MIMEText(body_signature, "plain"))

        text = msg.as_string()
        try:
            server = smtplib.SMTP(self.smtp, self.port)
           
            server.starttls()
            self.logger.info(self.email)
            server.login(self.email, self.password)
            to_cc_mail = recipient_email + cc_emails
            server.sendmail(self.email, to_cc_mail, text)
            self.logger.info("Email sent successfully!")
            # print("Email sent successfully!")
        except Exception as e:
            self.logger.error("Failed to send email: %s", e)
            # print(e)
        finally:
            if "server" in locals():
                server.quit()





#####
# """A module to handle sending emails via Office 365 SMTP server, including attachments."""

# import os
# import smtplib
# from email import encoders
# from email.mime.base import MIMEBase
# from email.mime.multipart import MIMEMultipart
# from email.mime.text import MIMEText
# # pylint: disable=E0401
# from utilities.config import config
# from service.DigitalOceanService import DOSpacesUploader


# class SendEmailOffice365:
#     """
#     A class to handle sending emails via Office 365 SMTP server, including attachments.
#     """
#     def __init__(self, email, password, smtp, port, logger):
#         """Initializes the SendEmailOffice365 class."""
#         self.email = email
#         self.password = password
#         self.smtp = smtp
#         self.port = port
#         self.config = config
#         # self.start_tls = config['schedulertask']['use_tls']
#         self.logger = logger
#         self.uploader = DOSpacesUploader(
#             space_endpoint = config["digitalocean_cred"]["space_endpoint"],
#             space_name = config["digitalocean_cred"]["space_name"],
#             access_key = config["digitalocean_cred"]["access_key"],
#             secret_key = config["digitalocean_cred"]["dig_ocean_secret_key"],
#             retention_days = int(config["digitalocean_cred"]["retention_days"])  # Files older than 7 days will be automatically deleted
#         )
#         # self.reportfile_size = config["schedulerTask"]["reportfile_size"]

#     def send_email_with_attachments(
#         self, recipient_email, cc_emails, subject, body, attachment_paths
#     ):
#         """
#         Sends an email with attachments using the Office 365 SMTP server.
#         """
#         msg = MIMEMultipart()
#         msg["From"] = self.email
#         msg["To"] = ", ".join(recipient_email)
#         msg["Cc"] = ", ".join(cc_emails) if cc_emails else ""
#         msg["Subject"] = subject
       
#         total_file_size = sum(os.path.getsize(file) for file in attachment_paths) / (1024 * 1024)

#         self.logger.info(f"Total attachment size is: {total_file_size}")

#         file_url = []

#         if total_file_size > 20:
#             self.logger.info("Total Attachment file size is greater than 20 mb")
#             for attachment_path in attachment_paths:
#                 try:
#                     upload_res= self.uploader.upload_file(attachment_path)
#                     if upload_res:
#                         # filename = os.path.basename(attachment_path)
#                         filename, _ = os.path.splitext(os.path.basename(attachment_path))  # Remove file extension
#                         file_url.append(f"{filename}: {upload_res['url']}")
#                         self.logger.info(f"Uploaded file URL: {upload_res['url']}")
#                 except Exception as err:
#                     self.logger.error(f"Error uploading file {attachment_path}: str{err}")
#                     raise
        
#         else:
#             self.logger.info("Attachment file size is less than 20 mb")
#             for attachment_path in attachment_paths:
#                 try:
#                     file_size = os.path.getsize(attachment_path) / (1024 * 1024)
#                     self.logger.info(f"Processing file: {attachment_path} ({file_size} MB)")
#                     with open(attachment_path, "rb") as attachment:
#                         part = MIMEBase("application", "octet-stream")
#                         part.set_payload(attachment.read())
#                     # Encode file in ASCII characters to send by email
#                     encoders.encode_base64(part)
 
#                     # Add header as key/value pair to attachment part
#                     filename = attachment_path.split("/")[1]
#                     part.add_header("Content-Disposition", f"attachment; filename= {filename}")
 
#                     msg.attach(part)
#                 except Exception as err:
#                     self.logger.error(f"Error processing attachment {attachment_path}: {err}")
#                     raise       
       
#         if file_url:
#             file_url_text = "\n".join(file_url)
#             body += f"\n\nAttachments exceeding 20MB have been uploaded. Please click on below link to download the same:\n{file_url_text}\n"
       
#         body_signature = body + f"\n\n{config['schedulertask']['message_1']},\n{config['schedulertask']['message_2']}"
#         msg.attach(MIMEText(body_signature, "plain"))

#         text = msg.as_string()
#         try:
#             server = smtplib.SMTP(self.smtp, self.port)
           
#             server.starttls()
#             server.login(self.email, self.password)
#             to_cc_mail = recipient_email + cc_emails
#             server.sendmail(self.email, to_cc_mail, text)
#             self.logger.info("Email sent successfully!")
#             # print("Email sent successfully!")
#         except Exception as e:
#             self.logger.error("Failed to send email:", e)
#             # print("Failed to send email:", e)
#         finally:
#             if "server" in locals():
#                 server.quit()
