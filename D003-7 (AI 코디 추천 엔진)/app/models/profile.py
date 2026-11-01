from typing import List
from pydantic import BaseModel, Field


class UserProfile(BaseModel):
    """4060 여성 사용자 프로필 모델"""
    user_id: str = Field(..., description="사용자 고유 식별자")
    age_group: str = Field("50s", description="연령대 (예: 40s, 50s, 60s)")
    personal_color: str = Field("AUTUMN_MUTED", description="퍼스널 컬러 타입 (예: AUTUMN_MUTED, SPRING_WARM, SUMMER_COOL, WINTER_COOL)")
    body_focus_areas: List[str] = Field(
        default_factory=lambda: ["ABDOMEN_COVER", "UPPER_ARM_COVER"],
        description="체형 커버 및 보정 관심 부위 (예: ABDOMEN_COVER, UPPER_ARM_COVER, LEG_LENGTH, HIP_COVER 등)"
    )
    preferred_fits: List[str] = Field(
        default_factory=lambda: ["LOOSE", "A_LINE"],
        description="선호하는 실루엣 및 핏 (예: LOOSE, A_LINE, WIDE, FIT_AND_FLARE 등)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user_4060_001",
                "age_group": "50s",
                "personal_color": "AUTUMN_MUTED",
                "body_focus_areas": ["ABDOMEN_COVER", "UPPER_ARM_COVER"],
                "preferred_fits": ["LOOSE", "A_LINE"],
            }
        }

