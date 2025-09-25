from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api import api_router
from app.core.config import settings
from app.db import base  # noqa: F401
from app.db.session import engine


def create_app() -> FastAPI:
    application = FastAPI(title=settings.project_name)

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors.allow_origins,
        allow_credentials=settings.cors.allow_credentials,
        allow_methods=settings.cors.allow_methods,
        allow_headers=settings.cors.allow_headers,
    )

    @application.on_event("startup")
    def startup_event() -> None:
        base.Base.metadata.create_all(bind=engine)

    @application.get("/health")
    def health_check() -> dict[str, str]:
        return {"status": "ok"}

    application.include_router(api_router, prefix=settings.api_v1_prefix)

    return application


app = create_app()
