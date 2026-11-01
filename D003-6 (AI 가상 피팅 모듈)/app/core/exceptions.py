from typing import Optional, Dict, Any

class TryOnBaseException(Exception):
    """
    가상 피팅 모듈 최상위 예외 클래스
    """
    def __init__(
        self,
        message: str,
        error_code: str = "TRYON_ERROR",
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)

class InvalidPoseException(TryOnBaseException):
    """
    부적절한 포즈 (손으로 몸 가림, 기울어진 각도 등) 감지 시 예외
    촬영 가이드라인(guidance)을 사용자에게 반환할 수 있도록 세부 정보를 포함합니다.
    """
    def __init__(self, message: str, guidance: str):
        super().__init__(
            message=message,
            error_code="INVALID_USER_POSE",
            details={"guidance": guidance}
        )

class InvalidLayeringException(TryOnBaseException):
    """
    의상 레이어드 순서(Layering Order) 또는 카테고리 충돌 예외
    (예: 동일 카테고리 중복, 레이어 우선순위 위반 등)
    """
    def __init__(self, message: str):
        super().__init__(
            message=message,
            error_code="INVALID_LAYERING_ORDER"
        )

class ImageDownloadException(TryOnBaseException):
    """
    사용자 또는 의상 이미지 URL 다운로드/디코딩 실패 예외
    """
    def __init__(self, url: str, reason: str):
        super().__init__(
            message=f"이미지를 불러올 수 없습니다: {reason}",
            error_code="IMAGE_DOWNLOAD_FAILED",
            details={"url": url, "reason": reason}
        )

class SegmentationException(TryOnBaseException):
    """
    SCHP/SAM 세그멘테이션 및 신체/의상 마스킹 파싱 실패 예외
    """
    def __init__(self, reason: str):
        super().__init__(
            message=f"신체 및 의상 영역 분리에 실패했습니다: {reason}",
            error_code="SEGMENTATION_FAILED",
            details={"reason": reason}
        )

class PipelineInferenceException(TryOnBaseException):
    """
    Diffusion 모델 추론, Warping, OOM 또는 타임아웃 예외
    """
    def __init__(self, stage: str, reason: str):
        super().__init__(
            message=f"피팅 생성 파이프라인({stage}) 처리 중 오류가 발생했습니다: {reason}",
            error_code="INFERENCE_PIPELINE_ERROR",
            details={"stage": stage, "reason": reason}
        )

class IdentityDistortionException(TryOnBaseException):
    """
    후처리 단계에서 ID-Loss(얼굴/피부 정체성 손실) 기준치 초과 예외
    """
    def __init__(self, score: float, threshold: float):
        super().__init__(
            message="사용자 얼굴 및 정체성 보존 기준을 충족하지 못했습니다.",
            error_code="IDENTITY_PRESERVATION_FAILED",
            details={"id_loss_score": score, "threshold": threshold}
        )

class UpscalingException(TryOnBaseException):
    """
    Real-ESRGAN 고해상도 업스케일링 처리 실패 예외
    """
    def __init__(self, reason: str):
        super().__init__(
            message=f"고해상도 업스케일링 복원에 실패했습니다: {reason}",
            error_code="UPSCALING_FAILED",
            details={"reason": reason}
        )

