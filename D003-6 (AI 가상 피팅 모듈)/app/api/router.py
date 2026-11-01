import time
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, status, Request
from sqlalchemy.orm import Session

from app.schemas.tryon_schemas import (
    TryOnRequestPayload,
    TryOnResponsePayload,
    TryOnResponseBody,
    TryOnStatusEnum,
)
from app.models.db_models import TryOnRequest, TryOnRequestGarment, TryOnStatus, GarmentCategory
from app.services.tryon_service import VirtualTryOnService
from app.api.dependencies import get_db, get_pipeline
from app.pipeline.pipeline_orchestrator import VirtualTryOnPipeline

logger = logging.getLogger("tryon_router")
router = APIRouter(prefix="/api/v1", tags=["Virtual Try-On"])

@router.post(
    "/tryon",
    response_model=TryOnResponsePayload,
    status_code=status.HTTP_200_OK,
    summary="AI 가상 피팅 요청 생성 및 처리"
)
async def create_virtual_tryon(
    payload: TryOnRequestPayload,
    request: Request,
    db: Session = Depends(get_db),
    pipeline: VirtualTryOnPipeline = Depends(get_pipeline)
):
    """
    사용자의 전신 사진과 단품 의상 목록을 입력받아 4단계 AI 가상 피팅 파이프라인을 실행합니다.
    - **layer_order**: 상의 -> 아우터 순서의 순차적 레이어 피팅 지원
    - **options**: ID-Loss 기반 얼굴 보존 및 Real-ESRGAN 고해상도 복원 적용
    """
    request_data = payload.tryon_request
    request.state.start_time = time.time()

    # 1. DB에 가상 피팅 태스크 생성 (PENDING 상태)
    db_task = TryOnRequest(
        user_id=request_data.user_id,
        user_image_url=str(request_data.user_image_url),
        preserve_face=request_data.options.preserve_face,
        preserve_background=request_data.options.preserve_background,
        output_resolution=request_data.options.output_resolution,
        status=TryOnStatus.PENDING,
    )
    db.add(db_task)
    db.flush()  # db_task.id 채번

    # 2. 피팅 요청 의상 매핑 정보 저장
    for g_item in request_data.garment_items:
        garment_mapping = TryOnRequestGarment(
            tryon_request_id=db_task.id,
            category=GarmentCategory(g_item.category.value),
            garment_image_url=str(g_item.garment_image_url),
            layer_order=g_item.layer_order,
        )
        db.add(garment_mapping)

    db.commit()

    # 3. 비즈니스 서비스 레이어를 통한 피팅 파이프라인 실행
    service = VirtualTryOnService(db_session=db, pipeline=pipeline)
    result_body: TryOnResponseBody = await service.execute_tryon_pipeline(
        request_data=request_data,
        db_task_id=db_task.id
    )

    return TryOnResponsePayload(tryon_response=result_body)

@router.get(
    "/tryon/{task_id}",
    response_model=TryOnResponsePayload,
    summary="가상 피팅 작업 상태 및 결과 조회"
)
async def get_tryon_status(
    task_id: int,
    db: Session = Depends(get_db)
):
    """
    작업 ID(task_id)로 비동기 피팅 진행 상태(PENDING, PROCESSING, SUCCESS, FAILED) 및
    생성된 결과 이미지 URL을 조회합니다.
    """
    db_task = db.query(TryOnRequest).filter(TryOnRequest.id == task_id).first()
    if not db_task:
        return TryOnResponsePayload(
            tryon_response=TryOnResponseBody(
                status=TryOnStatusEnum.INVALID_INPUT,
                result_image_url=None,
                processing_time_sec=0.0,
                error_message=f"작업 ID {task_id}를 찾을 수 없습니다."
            )
        )

    return TryOnResponsePayload(
        tryon_response=TryOnResponseBody(
            status=TryOnStatusEnum(db_task.status.value),
            result_image_url=db_task.result_image_url,
            processing_time_sec=db_task.processing_time_sec or 0.0,
            error_message=db_task.error_message
        )
    )

@router.get(
    "/tryon/history/{user_id}",
    summary="특정 사용자의 가상 피팅 이력 목록 조회"
)
async def get_user_tryon_history(
    user_id: str,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    사용자의 이전 가상 피팅 히스토리 목록을 최신순으로 조회합니다.
    """
    tasks = (
        db.query(TryOnRequest)
        .filter(TryOnRequest.user_id == user_id)
        .order_by(TryOnRequest.created_at.desc())
        .limit(limit)
        .all()
    )

    history = [
        {
            "task_id": t.id,
            "status": t.status.value,
            "result_image_url": t.result_image_url,
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "processing_time_sec": t.processing_time_sec,
        }
        for t in tasks
    ]
    return {"user_id": user_id, "total_count": len(history), "history": history}

