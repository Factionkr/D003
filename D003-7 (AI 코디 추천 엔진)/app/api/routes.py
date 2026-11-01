from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.models.context import TargetContext
from app.models.profile import UserProfile
from app.models.wardrobe import WardrobeItem
from app.models.response import OutfitRecommendationResponse
from app.engine.outfit_engine import OutfitCombinationEngine

router = APIRouter(prefix="/api/v1", tags=["Outfit Recommendation"])

engine = OutfitCombinationEngine()


class OutfitRecommendationApiRequest(BaseModel):
    """코디 추천 API 요청 바디"""
    context: TargetContext
    profile: UserProfile
    wardrobe: List[WardrobeItem] = Field(..., description="사용자 옷장에 등록된 의류/잡화 목록")
    top_k: int = Field(1, ge=1, le=10, description="반환할 추천 코디 개수")

    class Config:
        json_schema_extra = {
            "example": {
                "context": {
                    "occasion": "ALUMNI_GATHERING",
                    "formality_level": 4,
                    "temperature_celsius": 18.5,
                    "weather_condition": "CLEAR"
                },
                "profile": {
                    "user_id": "user_4060_001",
                    "age_group": "50s",
                    "personal_color": "AUTUMN_MUTED",
                    "body_focus_areas": ["ABDOMEN_COVER", "UPPER_ARM_COVER"],
                    "preferred_fits": ["LOOSE", "A_LINE"]
                },
                "wardrobe": [
                    {
                        "item_id": "cloth_0102",
                        "name": "캐시미어 혼방 베이지 롱 가디건",
                        "category": "OUTER",
                        "subcategory": "CARDIGAN",
                        "fit": "LOOSE",
                        "color": "BEIGE",
                        "material": "CASHMERE",
                        "pattern": "SOLID",
                        "seasonality": ["SPRING", "AUTUMN"],
                        "formality_rating": 4,
                        "is_elastic_waist": False,
                        "stretchable": True
                    },
                    {
                        "item_id": "cloth_0305",
                        "name": "아이보리 실크 블라우스",
                        "category": "TOP",
                        "subcategory": "BLOUSE",
                        "fit": "LOOSE",
                        "color": "IVORY",
                        "material": "SILK",
                        "pattern": "SOLID",
                        "seasonality": ["SPRING", "AUTUMN"],
                        "formality_rating": 4,
                        "is_elastic_waist": False,
                        "stretchable": True
                    },
                    {
                        "item_id": "cloth_0812",
                        "name": "다크브라운 핀턱 세미 와이드 슬랙스",
                        "category": "BOTTOM",
                        "subcategory": "SLACKS",
                        "fit": "WIDE",
                        "color": "BROWN",
                        "material": "WOOL",
                        "pattern": "SOLID",
                        "seasonality": ["SPRING", "AUTUMN"],
                        "formality_rating": 4,
                        "is_elastic_waist": True,
                        "stretchable": True
                    },
                    {
                        "item_id": "shoe_0041",
                        "name": "수제 가죽 로퍼 (굽 3cm)",
                        "category": "SHOES",
                        "subcategory": "LOAFER",
                        "fit": "REGULAR",
                        "color": "BROWN",
                        "material": "LEATHER",
                        "pattern": "SOLID",
                        "seasonality": ["SPRING", "AUTUMN", "WINTER"],
                        "formality_rating": 4,
                        "is_elastic_waist": False,
                        "stretchable": False
                    },
                    {
                        "item_id": "acc_0009",
                        "name": "실크 패턴 스카프",
                        "category": "ACCESSORY",
                        "subcategory": "SCARF",
                        "fit": "FREE",
                        "color": "BEIGE",
                        "material": "SILK",
                        "pattern": "FLORAL",
                        "seasonality": ["SPRING", "AUTUMN"],
                        "formality_rating": 4,
                        "is_elastic_waist": False,
                        "stretchable": False
                    }
                ],
                "top_k": 1
            }
        }


@router.post(
    "/recommend",
    response_model=OutfitRecommendationResponse,
    summary="4060 디지털 옷장 맞춤 코디 조합 추천",
    description=(
        "입력된 TPO 컨텍스트, 4060 사용자 프로필, 등록 옷장 아이템을 기반으로 "
        "절대적 배제 규칙 필터링, 5대 평가 가중치 점수 산출, 70점 미만 시 80%+20% Fallback 보완 추천을 거쳐 "
        "스타일리스트 한글 총평과 함께 최적의 코디를 반환합니다."
    )
)
def recommend_outfit(payload: OutfitRecommendationApiRequest):
    if not payload.wardrobe:
        raise HTTPException(status_code=400, detail="Wardrobe items cannot be empty.")

    try:
        response = engine.recommend_outfits(
            wardrobe=payload.wardrobe,
            context=payload.context,
            profile=payload.profile,
            top_k=payload.top_k
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation engine error: {str(e)}")


@router.get("/health", summary="Health Check")
def health_check():
    return {"status": "ok", "service": "4060-outfit-combination-engine"}

