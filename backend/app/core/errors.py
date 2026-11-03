import logging
import uuid

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("nyayai")


class AppError(Exception):
    """Base class for expected, client-facing errors."""

    def __init__(self, code: str, message: str, status_code: int = 400) -> None:
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def _request_id(request: Request) -> str:
    return getattr(request.state, "request_id", None) or str(uuid.uuid4())


def _error_response(
    request: Request,
    status_code: int,
    code: str,
    message: str,
    details: list | None = None,
) -> JSONResponse:
    body: dict = {
        "error": {"code": code, "message": message, "request_id": _request_id(request)}
    }
    if details:
        body["error"]["details"] = details
    return JSONResponse(status_code=status_code, content=body)


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def handle_app_error(request: Request, exc: AppError) -> JSONResponse:
        return _error_response(request, exc.status_code, exc.code, exc.message)

    @app.exception_handler(StarletteHTTPException)
    async def handle_http_error(
        request: Request, exc: StarletteHTTPException
    ) -> JSONResponse:
        return _error_response(
            request, exc.status_code, f"http_{exc.status_code}", str(exc.detail)
        )

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        details = [
            {"field": ".".join(str(p) for p in e["loc"]), "message": e["msg"]}
            for e in exc.errors()
        ]
        return _error_response(
            request, 422, "validation_error", "Invalid request.", details
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
        # Log the traceback server-side only; never leak it to the client.
        logger.exception("Unhandled error (request_id=%s)", _request_id(request))
        return _error_response(
            request, 500, "internal_error", "An unexpected error occurred."
        )