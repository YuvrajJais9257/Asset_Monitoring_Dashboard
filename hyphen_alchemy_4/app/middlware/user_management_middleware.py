"""
This module contains the FastAPI application factory for the user_management API. it includes the user_management router and configures CORS middleware.
"""
# pylint: disable=E0401
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.endpoints.v1.user_management import router as user_router


def create_user_management_app() -> FastAPI:
    """
    Creates a FastAPI application instance.

    Returns:
        FastAPI: The created application instance.
    """
    app = FastAPI(
        title="User Management API",
        description="API for managing users.",
        version="1.0.0",
    )

    # Include user router
    app.include_router(user_router)

    # Configure CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Allow all origins
        allow_credentials=True,  # Allow credentials
        allow_methods=["*"],  # Allow all methods
        allow_headers=["*"],  # Allow all headers
    )

    return app
