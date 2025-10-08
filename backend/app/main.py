import time
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST

from app.api.v1.api import api_router
from app.core.config import settings
from app.core.logging_config import setup_logging
from app.core.metrics import record_api_request, app_info
from app.db import base  # noqa: F401
from app.db.session import engine

# Setup logging
setup_logging(json_logs=False, log_level="INFO")
logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    application = FastAPI(title=settings.project_name)

    # Set application info for Prometheus
    app_info.info({
        'version': '1.0.0',
        'environment': 'production'
    })

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors.allow_origins,
        allow_credentials=settings.cors.allow_credentials,
        allow_methods=settings.cors.allow_methods,
        allow_headers=settings.cors.allow_headers,
    )

    # Add metrics middleware
    @application.middleware("http")
    async def metrics_middleware(request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        duration = time.time() - start_time

        # Record metrics
        record_api_request(
            method=request.method,
            endpoint=request.url.path,
            status=response.status_code,
            duration=duration
        )

        # Add response time header
        response.headers["X-Process-Time"] = str(duration)

        return response

    @application.on_event("startup")
    def startup_event() -> None:
        logger.info("Starting application: %s", settings.project_name)
        base.Base.metadata.create_all(bind=engine)
        logger.info("Database tables created/verified")

    @application.on_event("shutdown")
    def shutdown_event() -> None:
        logger.info("Shutting down application")

    @application.get("/health")
    def health_check() -> dict[str, str]:
        return {"status": "ok", "service": settings.project_name}

    @application.get("/metrics")
    def metrics() -> Response:
        """Prometheus metrics endpoint."""
        return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

    application.include_router(api_router, prefix=settings.api_v1_prefix)

    # Include WebSocket router
    from app.api.v1.websocket import router as ws_router
    application.include_router(ws_router, prefix=settings.api_v1_prefix)

    return application


app = create_app()
