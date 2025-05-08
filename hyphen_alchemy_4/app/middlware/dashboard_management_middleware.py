"""
Dashboard Management Application Module. Creates a FastAPI application instance and configures CORS middleware.
"""
# pylint: disable=E0401
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.endpoints.v1.dashboard_management import router as dashboard_router


def create_dashboard_management_app() -> FastAPI:
    """
    Creates a FastAPI application instance.

    Returns:
        FastAPI: The created application instance.
    """
    app = FastAPI(
        title="Dashboard Management API",
        description="API for managing dashboard functionality.",
        version="1.0.0",
    )

    # Include dashboard management router
    app.include_router(dashboard_router)

    # Configure CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Allow all origins
        allow_credentials=True,  # Allow credentials
        allow_methods=["*"],  # Allow all methods
        allow_headers=["*"],  # Allow all headers
    )

    return app
