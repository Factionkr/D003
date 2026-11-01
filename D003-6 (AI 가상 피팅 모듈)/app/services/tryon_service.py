import time
import logging
from typing import Optional
from sqlalchemy.orm import Session

from app.core.exceptions import (
    TryOnBaseException,
    PipelineInferenceException,
    InvalidPoseException,
    InvalidLayeringException,
)
from app.models.db_models import TryOnRequest, TryOnStatus
from app.schemas.tryon_schemas import (
    TryOnRequestBody,
    TryOnResponseBody,
    TryOnStatusEnum,
)
from app.services.validator import TryOnInputValidator
from app.pipeline.pipeline_orchestrator import VirtualTryOnPipeline

logger = logging.getLogger("tryon_service")

class VirtualTryOnService:
    """
    가상 피팅 비즈니스 로직 및 트랜잭션 관리 서비스
    - DB 태스크 상태 관리 (PENDING -> PROCESSING -> SUCCESS / FAILED)
    - 입력값 정렬 및 레이어링 규칙 검증
    - 4단계 AI 피팅 파이프라인 호출 및 결과 저장
    """

    def __init__(self, db_session: Session, pipeline: Optional[VirtualTryOnPipeline] = None):
        self.db = db_session
        self.pipeline = pipeline or VirtualTryOnPipeline()

    async def execute_tryon_pipeline(
        self,
        request_data: TryOnRequestBody,
        db_task_id: int
    ) -> TryOnResponseBody:
        """
        피팅 요청에 대해 파이프라인을 실행하고 결과를 DB에 저장합니다.
        """
        start_time = time.time()
        db_task = self.db.query(TryOnRequest).filter(TryOnRequest.id == db_task_id).first()
        if not db_task:
            raise PipelineInferenceException(stage="Initialization", reason="Task ID not found in database.")

        try:
            # 1. 의상 레이어 순서 검증 및 정렬
            sorted_garments = TryOnInputValidator.sort_and_validate_garments(request_data.garment_items)

            # 2. 태스크 상태를 PROCESSING으로 변경
            db_task.status = TryOnStatus.PROCESSING
            self.db.commit()

            # 3. 파이프라인 실행용 데이터 포맷 변환
            garment_payloads = [
                {
                    "category": g.category.value,
                    "garment_image_url": str(g.garment_image_url),
                    "layer_order": g.layer_order,
                }
                for g in sorted_garments
            ]
            options_dict = request_data.options.model_dump()

            # 4. 4단계 가상 피팅 파이프라인 실행
            pipeline_result = await self.pipeline.run(
                user_image_url=str(request_data.user_image_url),
                garment_items=garment_payloads,
                options=options_dict
            )

            # 5. 성공 결과 DB 저장
            elapsed_time = round(time.time() - start_time, 2)
            db_task.status = TryOnStatus.SUCCESS
            db_task.result_image_url = pipeline_result["result_image_url"]
            db_task.processing_time_sec = elapsed_time
            db_task.error_message = None
            self.db.commit()

            logger.info(f"Task {db_task_id} completed successfully in {elapsed_time}s")

            return TryOnResponseBody(
                status=TryOnStatusEnum.SUCCESS,
                result_image_url=pipeline_result["result_image_url"],
                processing_time_sec=elapsed_time,
                error_message=None
            )

        except TryOnBaseException as e:
            # 커스텀 예외 발생 시 DB 상태를 적절한 에러 코드로 기록
            self.db.rollback()
            is_input_error = isinstance(e, (InvalidPoseException, InvalidLayeringException))
            db_task.status = TryOnStatus.INVALID_INPUT if is_input_error else TryOnStatus.FAILED
            db_task.error_message = e.message
            db_task.processing_time_sec = round(time.time() - start_time, 2)
            self.db.commit()
            logger.warning(f"TryOn Task {db_task_id} failed with handled exception: {e.message}")
            raise e

        except Exception as e:
            # 예상치 못한 시스템 장애 발생 시 롤백 및 FAILED 상태 기록
            self.db.rollback()
            db_task.status = TryOnStatus.FAILED
            db_task.error_message = f"Internal Pipeline System Error: {str(e)}"
            db_task.processing_time_sec = round(time.time() - start_time, 2)
            self.db.commit()
            logger.error(f"TryOn Task {db_task_id} unhandled system error: {str(e)}", exc_info=True)
            raise PipelineInferenceException(stage="PipelineExecution", reason=str(e))

