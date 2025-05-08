"""Module for encoding and decoding passwords using base64."""
import base64

def decode_base64(encoded_str):
    """Decode a base64 encoded string."""
    return base64.b64decode(encoded_str).decode('utf-8')

def encode_base64(plain_str):
    """Encode a string using base64."""
    return base64.b64encode(plain_str.encode('utf-8')).decode('utf-8')
