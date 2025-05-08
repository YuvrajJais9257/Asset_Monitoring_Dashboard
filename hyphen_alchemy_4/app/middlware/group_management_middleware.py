"""
This module contains the FastAPI application factory for the group management API. it includes the database management router and configures CORS middleware.
"""
# pylint: disable=E0401
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.endpoints.v1.group_management import router as group_router


def create_group_management_app() -> FastAPI:
    """
    Creates a FastAPI application instance.

    Returns:
        FastAPI: The created application instance.
    """
    app = FastAPI(
        title="Group Management API",
        description="API for managing group functionality.",
        version="1.0.0",
    )

    # Include group management router
    app.include_router(group_router)

    # Configure CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Allow all origins
        allow_credentials=True,  # Allow credentials
        allow_methods=["*"],  # Allow all methods
        allow_headers=["*"],  # Allow all headers
    )

    return app
