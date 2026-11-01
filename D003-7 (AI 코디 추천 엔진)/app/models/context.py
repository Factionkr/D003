from typing import Optional
from pydantic import BaseModel, Field


class TargetContext(BaseModel):
    """TPO 및 날씨/환경 컨텍스트 모델"""
    occasion: str = Field(..., description="착용 목적/TPO (예: ALUMNI_GATHERING, WORK, FAMILY_EVENT 등)")
    formality_level: int = Field(..., ge=1, le=5, description="격식도 레벨 (1: 매우 캐주얼 ~ 5: 최고 격식)")
    temperature_celsius: float = Field(..., description="현재/예상 기온 (섭씨)")
    humidity_percent: Optional[float] = Field(None, ge=0.0, le=100.0, description="습도 (%)")
    weather_condition: str = Field(..., description="날씨 상태 (예: CLEAR, RAIN, SNOW, WINDY 등)")

    class Config:
        json_schema_extra = {
            "example": {
                "occasion": "ALUMNI_GATHERING",
                "formality_level": 4,
                "temperature_celsius": 18.5,
                "weather_condition": "CLEAR",
            }
        }

