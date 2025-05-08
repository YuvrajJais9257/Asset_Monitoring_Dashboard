"""Module to read Config file and return the details as dictionary"""
import configparser
import os
# pylint: disable=E0401
# pylint: disable=W0212
# pylint: disable=w0621
from utilities.encrypion import decode_base64


def read_config(file_name):
    """Function to read Config"""
    config = configparser.ConfigParser()
    config._interpolation = configparser.ExtendedInterpolation()
    config.read(file_name)
    filesection = config.sections()
    details = {}
    for section in filesection:
        details_dict = dict(config.items(section))
        for key, value in details_dict.items():
            if (
                key
                in [
                    "mysql_password",
                    "postgres_password",
                    "password",
                    "key",
                    "secret_key",
                ]
                and value != ""
            ):
                details_dict[key] = decode_base64(value)
            elif section.lower() == "codes" and value.isdigit():
                details_dict[key] = int(value)
        details[section.lower()] = details_dict
    return details

CFG_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "config", "config.ini"
)
config = read_config(CFG_PATH)