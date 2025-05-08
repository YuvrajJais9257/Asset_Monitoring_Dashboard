"""
Scheduler Management Application Module.

Creates a FastAPI application instance, includes scheduler router, and configures CORS middleware.
"""
# pylint: disable=E0401
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.endpoints.v1.scheduler_management import router as scheduler_router


def create_scheduler_management_app() -> FastAPI:
    """
    Creates a FastAPI application instance.

    Returns:
        FastAPI: The created application instance.
    """
    app = FastAPI(
        title="Scheduler Management API",
        description="API for managing schedulers.",
        version="1.0.0",
    )

    # Include scheduler router
    app.include_router(scheduler_router)

    # Configure CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Allow all origins
        allow_credentials=True,  # Allow credentials
        allow_methods=["*"],  # Allow all methods
        allow_headers=["*"],  # Allow all headers
    )

    return app
