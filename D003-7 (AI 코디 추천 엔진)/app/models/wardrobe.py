from typing import List, Optional
from datetime import datetime, date
from pydantic import BaseModel, Field, field_validator


class WardrobeItem(BaseModel):
    """디지털 옷장 등록 의류/잡화 아이템 모델"""
    item_id: str = Field(..., description="의류 아이템 고유 ID")
    name: str = Field(..., description="아이템 명칭")
    category: str = Field(..., description="대분류 (OUTER, TOP, BOTTOM, SHOES, ACCESSORY)")
    subcategory: str = Field(..., description="중분류 (CARDIGAN, BLOUSE, SLACKS, LOAFER, SCARF 등)")
    fit: str = Field(..., description="실루엣/핏 (LOOSE, SLIM, WIDE, A_LINE, CROP, BODYCON 등)")
    color: str = Field(..., description="색상 (IVORY, BEIGE, BROWN, BLACK, NAVY 등)")
    material: str = Field(..., description="소재 (CASHMERE, SILK, WOOL, LINEN, DENIM, SUEDE 등)")
    pattern: str = Field("SOLID", description="패턴 (SOLID, STRIPE, FLORAL, CHECK 등)")
    seasonality: List[str] = Field(..., description="착용 계절 (SPRING, SUMMER, AUTUMN, WINTER)")
    formality_rating: int = Field(..., ge=1, le=5, description="자체 격식도 (1~5)")
    is_elastic_waist: bool = Field(False, description="허리 밴딩 여부 (편안함 가점 요건)")
    stretchable: bool = Field(False, description="스판/신축성 원단 여부")
    last_worn_date: Optional[datetime] = Field(None, description="최근 착용 일시")

    # 보완 추천(Fallback / 구매 제안) 연계 필드
    is_supplement: bool = Field(False, description="구매/보완 추천 아이템 여부")
    purchase_url: Optional[str] = Field(None, description="구매 링크 (보완 아이템일 경우)")

    @field_validator("category", "subcategory", "fit", "color", "material", mode="before")
    @classmethod
    def normalize_upper(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip().upper()
        return v

    @field_validator("seasonality", mode="before")
    @classmethod
    def normalize_seasonality(cls, v: List[str]) -> List[str]:
        if isinstance(v, list):
            return [s.strip().upper() for s in v if isinstance(s, str)]
        return v

    @field_validator("last_worn_date", mode="before")
    @classmethod
    def parse_last_worn_date(cls, v):
        if v is None or v == "":
            return None
        if isinstance(v, datetime):
            return v
        if isinstance(v, date):
            return datetime.combine(v, datetime.min.time())
        if isinstance(v, str):
            # Parse ISO or YYYY-MM-DD
            try:
                return datetime.fromisoformat(v)
            except ValueError:
                try:
                    return datetime.strptime(v, "%Y-%m-%d")
                except ValueError:
                    return None
        return None

    class Config:
        json_schema_extra = {
            "example": {
                "item_id": "cloth_0102",
                "name": "캐시미어 혼방 베이지 롱 가디건",
                "category": "OUTER",
                "subcategory": "CARDIGAN",
                "fit": "LOOSE",
                "color": "BEIGE",
                "material": "CASHMERE",
                "pattern": "SOLID",
                "seasonality": ["SPRING", "AUTUMN", "WINTER"],
                "formality_rating": 4,
                "is_elastic_waist": False,
                "stretchable": True,
                "last_worn_date": "2026-09-15T00:00:00",
                "is_supplement": False
            }
        }


class OutfitCombination(BaseModel):
    """코디 조합 (상의, 하의 필수 / 아우터, 신발, 액세서리 선택/필수 조합)"""
    top: WardrobeItem
    bottom: WardrobeItem
    outer: Optional[WardrobeItem] = None
    shoes: Optional[WardrobeItem] = None
    accessory: Optional[WardrobeItem] = None

    def get_all_items(self) -> List[WardrobeItem]:
        items = [self.top, self.bottom]
        if self.outer:
            items.append(self.outer)
        if self.shoes:
            items.append(self.shoes)
        if self.accessory:
            items.append(self.accessory)
        return items

    def supplement_ratio(self) -> float:
        items = self.get_all_items()
        supplement_count = sum(1 for it in items if it.is_supplement)
        return supplement_count / len(items) if items else 0.0

