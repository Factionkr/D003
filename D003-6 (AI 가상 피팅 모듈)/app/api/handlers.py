import time
import logging
from fastapi import Request, status
from fastapi.responses import JSONResponse

from app.core.exceptions import (
    TryOnBaseException,
    InvalidPoseException,
    InvalidLayeringException,
)
from app.schemas.tryon_schemas import (
    TryOnResponsePayload,
    TryOnResponseBody,
    TryOnStatusEnum,
)

logger = logging.getLogger("tryon_exception_handler")

async def tryon_exception_handler(request: Request, exc: TryOnBaseException) -> JSONResponse:
    """
    모든 가상 피팅 커스텀 예외를 기술 가이드 규격의 JSON 응답으로 변환합니다.
    - 입력값 오류(포즈 불가, 레이어 오류): INVALID_INPUT (HTTP 400)
    - 시스템 및 추론 오류: FAILED (HTTP 500)
    """
    start_time = getattr(request.state, "start_time", time.time())
    processing_time = round(time.time() - start_time, 2)

    if isinstance(exc, (InvalidPoseException, InvalidLayeringException)):
        response_status = TryOnStatusEnum.INVALID_INPUT
        http_code = status.HTTP_400_BAD_REQUEST
    else:
        response_status = TryOnStatusEnum.FAILED
        http_code = status.HTTP_500_INTERNAL_SERVER_ERROR

    # 사용자 가이드 메시지가 포함되어 있는 경우 병합
    error_msg = exc.message
    if "guidance" in exc.details:
        error_msg += f" (가이드: {exc.details['guidance']})"

    logger.warning(
        f"API Error Handler caught {exc.__class__.__name__}: [{http_code}] {error_msg}"
    )

    response_payload = TryOnResponsePayload(
        tryon_response=TryOnResponseBody(
            status=response_status,
            result_image_url=None,
            processing_time_sec=processing_time,
            error_message=error_msg,
        )
    )

    return JSONResponse(
        status_code=http_code,
        content=response_payload.model_dump(mode="json"),
    )

