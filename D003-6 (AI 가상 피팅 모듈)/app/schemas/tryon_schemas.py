from enum import Enum
from typing import List, Optional, Union
from pydantic import BaseModel, HttpUrl, Field, field_validator

# ----------------------------------------------------------------------
# Enums
# ----------------------------------------------------------------------
class GarmentCategoryEnum(str, Enum):
    UPPER_BODY = "UPPER_BODY"
    LOWER_BODY = "LOWER_BODY"
    OUTERWEAR = "OUTERWEAR"
    DRESS = "DRESS"

class TryOnStatusEnum(str, Enum):
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    INVALID_INPUT = "INVALID_INPUT"
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"

# ----------------------------------------------------------------------
# Request Schemas
# ----------------------------------------------------------------------
class GarmentItemSchema(BaseModel):
    category: GarmentCategoryEnum = Field(..., description="의상 카테고리 (UPPER_BODY, LOWER_BODY, OUTERWEAR, DRESS)")
    garment_image_url: Union[HttpUrl, str] = Field(..., description="의상 단품 누끼 이미지 URL")
    layer_order: int = Field(1, ge=1, description="레이어 착용 순서 (예: 1=이너/상의, 2=아우터)")

    @field_validator("garment_image_url")
    @classmethod
    def convert_url_to_str(cls, v: Union[HttpUrl, str]) -> str:
        return str(v)

class TryOnOptionsSchema(BaseModel):
    preserve_face: bool = Field(True, description="얼굴/피부 정체성 보존 여부 (ID-Loss)")
    preserve_background: bool = Field(True, description="배경 보존 여부")
    output_resolution: str = Field("1024x1536", description="최종 출력 해상도 (e.g. 1024x1536)")

class TryOnRequestBody(BaseModel):
    user_id: str = Field(..., examples=["user_12345"], description="사용자 식별 ID")
    user_image_url: Union[HttpUrl, str] = Field(..., description="사용자 전신 사진 이미지 URL")
    garment_items: List[GarmentItemSchema] = Field(..., min_length=1, description="피팅할 의상 목록")
    options: TryOnOptionsSchema = Field(default_factory=TryOnOptionsSchema, description="가상 피팅 생성 옵션")

    @field_validator("user_image_url")
    @classmethod
    def convert_url_to_str(cls, v: Union[HttpUrl, str]) -> str:
        return str(v)

class TryOnRequestPayload(BaseModel):
    """
    가상 피팅 요청 최상위 래퍼 (기술 가이드 규격)
    """
    tryon_request: TryOnRequestBody

# ----------------------------------------------------------------------
# Response Schemas
# ----------------------------------------------------------------------
class TryOnResponseBody(BaseModel):
    status: TryOnStatusEnum = Field(..., description="처리 결과 상태 (SUCCESS, FAILED, INVALID_INPUT)")
    result_image_url: Optional[str] = Field(None, description="생성된 가상 피팅 결과 이미지 URL")
    processing_time_sec: float = Field(..., description="총 처리 소요 시간 (초)")
    error_message: Optional[str] = Field(None, description="에러 또는 예외 안내 메시지")

class TryOnResponsePayload(BaseModel):
    """
    가상 피팅 응답 최상위 래퍼 (기술 가이드 규격)
    """
    tryon_response: TryOnResponseBody

# ----------------------------------------------------------------------
# Health & Status Schemas
# ----------------------------------------------------------------------
class HealthCheckResponse(BaseModel):
    status: str
    service: str
    version: str

