"""
    A module to manage authentication using JWT tokens, with functionalities to 
    generate, validate, and revoke tokens. It also supports tracking revoked tokens.
"""
import os
import configparser
from datetime import datetime, timedelta
import jwt
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException, status, Request
# pylint: disable=E0401
# pylint: disable=raise-missing-from
# pylint: disable=broad-exception-caught
from utilities.config import config
from pytz import timezone
import secrets
import base64

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class AuthManager:
    """
    A class to manage authentication using JWT tokens, with functionalities to 
    generate, validate, and revoke tokens. It also supports tracking revoked tokens.
    """
    def __init__(self) -> None:
        """
        Initializes the AuthManager class with configuration parameters for JWT tokens and
        loads or creates a section for revoked tokens in the config file.
        """
        
        self.algorithm = config["authentication"]["algorithm"]
        self.cfg_path = os.path.join(
            os.path.dirname(os.path.abspath(__file__)), "..", "config", "config.ini")
        self.config = configparser.ConfigParser()
        self.config.read(self.cfg_path)
        self.conf = config

        self.login_cfg_path = os.path.join(
            os.path.dirname(os.path.abspath(__file__)), "..", "config", "login_attempts.ini")
        self.login_config = configparser.ConfigParser()
        self.login_config.read(self.login_cfg_path)

        if not self.config.has_section("revoked_tokens"):
            self.config.add_section("revoked_tokens")
            self.config.write(open(self.cfg_path, "w"))

        self.MAX_REVOKED_TOKENS = 5

    def generate_token(self, username: str):
        """
        Generates a JSON Web Token (JWT) for the given username.

        Args:
            username (str): The username to be encoded in the token.

        Returns:
            str: A JWT token containing the username and expiration details.

        Notes:
            The token expiration time is configured through the "authentication" section
            in the config file. The "issued at" claim is also included in the token.
        """
        self.secret_key = self.login_config['authentication_keys']['secret_key']
        
        payload = {
            "sub": username,
            "exp": datetime.utcnow() + timedelta(minutes=\
                                                 int(config["authentication"]["expiration"])),
            "iat": datetime.utcnow()  # Add the "issued at" claim
        }
     
        token = jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
        return token

    async def validate_token(self, token: str = Depends(oauth2_scheme)):
        """
        Validate a given JWT token.

        Args:
        - token (str): The JWT token to be validated. Defaults to the token provided by the oauth2_scheme.

        Returns:
        - dict: A dictionary containing a success message if the token is valid.

        Raises:
        - HTTPException: If the token is invalid, expired, or revoked. The exception contains a JSON response with a detailed error message.
        """
        try:
            self.secret_key = self.login_config['authentication_keys']['secret_key']
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            username: str = payload.get("sub")

            if username is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail={"message": "Invalid token", "status_code": "401"},
                    headers={"WWW-Authenticate": "bearer"},
                )
            
            self.config = configparser.ConfigParser()
            self.config.read(self.cfg_path)
            if self.config.has_option("revoked_tokens", token):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail={"message": "Token is revoked", "status_code": "401"},
                    headers={"WWW-Authenticate": "bearer"},
                )

        except jwt.ExpiredSignatureError:
            # Token has expired, extract the creation time
            try:
                decoded_token = jwt.decode(token, self.secret_key, algorithms=\
                                           [self.algorithm], options={"verify_exp": False})
                creation_time = datetime.fromtimestamp(decoded_token['iat'],\
                                                        tz=timezone('Asia/Kolkata'))
                formatted_time = creation_time.strftime("%Y-%m-%d %H:%M:%S %Z")
                
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail={
                        "message": "Token expired",
                        "status_code": "401",
                        "token_creation_time": formatted_time
                    },
                    headers={"WWW-Authenticate": "bearer"},
                )
            except Exception as e:
                # If there's any error in decoding or extracting the creation time
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail={"message": f"Token expired (unable to extract \
                            creation time: {str(e)})", "status_code": "401"},
                    headers={"WWW-Authenticate": "bearer"},
                )

        except jwt.PyJWTError as e:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"message": f"Could not validate credentials- {e}", "status_code": "403"},
                headers={"WWW-Authenticate": "bearer"},
            )
        return {"message": "Token is valid"}
    
    async def check_token(self, request: Request):
        """
        Extracts and validates the JWT token from the request headers.
        """
        if "authorization" in request.headers:
            token_list = str(request.headers.get("authorization")).split(" ")
            if str(token_list[0]).lower() == "bearer":
                await self.validate_token(token_list[1])
            else:
                raise HTTPException(
                    status_code=500,
                    detail={"statusCode":self.conf['codes']['internal error'],"error":"Different authorization type is selected. Please select bearer as authorization"}
                )
                # raise HTTPException(
                #     status_code=500,
                #     detail=str(
                #         "Different authorization type is selected. Please select \
                #             bearer as authorization"
                #     ),
                # )
        else:
            raise HTTPException(status_code=500,detail={"statusCode":self.conf['codes']['internal error'],"error":"Token is missing"})

    def expire_token(self, token: str):
        """
        Revokes the given token by adding it to the revoked tokens list in the config file.
        """
        if len(self.config.options("revoked_tokens")) >= self.MAX_REVOKED_TOKENS:
            # Get the oldest token by finding the token with the earliest timestamp
            oldest_token = min(self.config.options("revoked_tokens"), 
                                key=lambda token: self.config.get("revoked_tokens", token))
            self.config.remove_option("revoked_tokens", oldest_token)
        
        # Store the current timestamp with the revoked token
        self.config.set("revoked_tokens", token, str(int(datetime.now().timestamp())))
        with open(self.cfg_path, "w") as config_file:
            self.config.write(config_file)
        return {"statusCode":self.conf['codes']['success'],"message": "Token is revoked"}
    
    def rotate_secret_key(self):
        """
        Generate and save a new secret key to the configuration file.
        
        Returns:
            str: Base64 encoded secret key
        """
        # Path to configuration file
        cfg_path = os.path.join(
            os.path.dirname(os.path.abspath(__file__)), "..", "config", "login_attempts.ini"
        )
        
        # Load configuration
        config = configparser.ConfigParser()
        config.read(cfg_path)

        # Ensure authentication keys section exists
        if not config.has_section("authentication_keys"):
            config.add_section("authentication_keys")

        # Generate a new 256-bit secret key
        new_key = secrets.token_bytes(32)
        base64_key = base64.urlsafe_b64encode(new_key).decode('utf-8')
        
        # Save to config
        config.set("authentication_keys", "secret_key", base64_key)
        
        # Write the updated configuration
        with open(cfg_path, "w") as config_file:
            config.write(config_file)
        
        return base64_key
