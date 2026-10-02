import logging

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def safe_exception_handler(exc, context):
    """Return API errors without leaking internals.

    DRF-handled exceptions pass through with their normal body. Anything
    unhandled is logged server-side and becomes a generic 500 — never a
    traceback in the response body.
    """
    response = exception_handler(exc, context)
    if response is not None:
        return response
    logger.exception("Unhandled API error", exc_info=exc)
    return Response(
        {"detail": "Internal server error"},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
