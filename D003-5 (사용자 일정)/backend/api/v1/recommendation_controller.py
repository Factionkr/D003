from fastapi import APIRouter, HTTPException, status
from schemas.recommendation import UserScheduleRequest, RecommendationResponse
from services.recommendation_service import OutfitRecommendationService

router = APIRouter(prefix="/api/v1/recommendations", tags=["Outfit Recommendation Engine"])

@router.post("/style", response_model=RecommendationResponse, status_code=status.HTTP_200_OK)
async def get_outfit_recommendation(request: UserScheduleRequest):
    try:
        return OutfitRecommendationService.generate_recommendation(request)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
