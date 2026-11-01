from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.models.context import TargetContext
from app.models.profile import UserProfile


class ItemSummary(BaseModel):
    item_id: str
    name: str
    category: Optional[str] = None
    subcategory: Optional[str] = None
    color: Optional[str] = None
    material: Optional[str] = None
    fit: Optional[str] = None
    is_supplement: bool = False
    purchase_url: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "item_id": "cloth_0102",
                "name": "캐시미어 혼방 베이지 롱 가디건"
            }
        }


class OutfitItemCombination(BaseModel):
    outer: Optional[ItemSummary] = None
    top: ItemSummary
    bottom: ItemSummary
    shoes: Optional[ItemSummary] = None
    accessory: Optional[ItemSummary] = None


class ScoreBreakdown(BaseModel):
    body_coverage: float = Field(..., description="체형 보정 및 비율 점수 (30% 만점)")
    formality_match: float = Field(..., description="TPO & 격식도 적합성 점수 (25% 만점)")
    color_harmony: float = Field(..., description="컬러 & 패턴 조화 점수 (20% 만점)")
    comfort_weather: float = Field(..., description="착용감 및 날씨 적합도 점수 (15% 만점)")
    wear_rotation: float = Field(..., description="착용 빈도 및 다양성 점수 (10% 만점)")
    total_score: Optional[float] = Field(None, description="총점 (100점 만점)")


class RecommendedOutfit(BaseModel):
    rank: int = Field(..., description="추천 순위 (1위부터)")
    total_score: float = Field(..., description="종합 완성도 점수 (100점 만점)")
    score_breakdown: ScoreBreakdown
    outfit_combination: OutfitItemCombination
    stylist_reasoning: str = Field(..., description="4060 타겟 맞춤형 한글 스타일리스트 총평")
    supplement_items: Optional[List[ItemSummary]] = Field(
        default=None,
        description="Fallback 시 추가 제안된 20% 보완/구매 아이템 목록"
    )


class MatchingResponse(BaseModel):
    is_fallback_applied: bool = Field(False, description="70점 미만 시 보완 추천(Fallback) 적용 여부")
    fallback_reason: Optional[str] = Field(None, description="Fallback 발동 사유 (발동 시)")
    recommended_outfits: List[RecommendedOutfit]


class OutfitMatchingRequestHeader(BaseModel):
    user_id: str
    target_context: TargetContext
    user_profile: UserProfile


class OutfitRecommendationResponse(BaseModel):
    """최종 클라이언트 응답 규격 (표준 JSON 스펙)"""
    outfit_matching_request: OutfitMatchingRequestHeader
    matching_response: MatchingResponse

