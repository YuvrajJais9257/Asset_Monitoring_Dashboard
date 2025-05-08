"""
This module contains the FastAPI application factory function. it includes the group, scheduler, user, and dashboard routers, and configures CORS middleware.
"""
# pylint: disable=E0401
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from api.endpoints.v1.report_management import router as report_router
from utilities.config import config

# Access the configuration values
origins = config['middleware']['origins']
hosts = config['middleware']['hosts']
methods = config['middleware']['methods']
headers = config['middleware']['headers']

# Convert the string representations of lists back to lists
origins = origins.split(', ')
hosts = hosts.split(', ')
methods = methods.split(', ')
headers = headers.split(', ')

def report_app() -> FastAPI:
    """
    Creates a FastAPI application instance.

    Returns:
        FastAPI: The created application instance.
    """
    app = FastAPI(
        title="Report Management API",
        description="API for managing reports.",
        version="1.0.0",
    )

        # Add Trusted Host Middleware to restrict allowed hosts
    app.add_middleware(
        TrustedHostMiddleware, 
        allowed_hosts=hosts
    )

    # Configure CORS middleware with stricter settings
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=methods,
        allow_headers=headers
    )

    # Custom middleware to add security headers
    @app.middleware("http")
    async def add_security_headers(request, call_next):
        response = await call_next(request)
        
        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # Protect against XSS
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # Prevent Clickjacking
        response.headers["X-Frame-Options"] = "DENY"
        
        # Enforce HTTPS (adjust max-age as needed)
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        # Basic Content Security Policy
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data:; "
            "connect-src 'self'"
        )
        return response

    # Include report router
    app.include_router(report_router)

    # return app
    return app
