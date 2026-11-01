"""AI 코디 앱 옷장 데이터 관리 모듈 & FastAPI 엔드포인트 구현.

단일 모듈로 실행 가능하며, Swagger UI(/docs) 및 TestClient 기반 시나리오 테스트를 지원합니다.
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
import httpx
from fastapi import FastAPI, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict, Field, field_validator


# ============================================================================
# 1. 데이터 분류 체계 및 상숫값 정의 (Taxonomy & Constants)
# ============================================================================

class CategoryEnum(str, Enum):
    TOP = "top"
    PANTS = "pants"
    SKIRT = "skirt"
    ONEPIECE = "onepiece"
    OUTER = "outer"
    HAT = "hat"
    SHOES = "shoes"
    BAG = "bag"
    JEWELRY = "jewelry"
    ETC = "etc"


# 10대 카테고리별 세부 예시 정의
CATEGORY_SUB_EXAMPLES: Dict[CategoryEnum, List[str]] = {
    CategoryEnum.TOP: ["반팔티", "긴팔티", "셔츠/블라우스", "맨투맨", "후드티", "니트/가디건", "민소매"],
    CategoryEnum.PANTS: ["청바지", "슬랙스", "면바지", "트레이닝팬츠", "숏팬츠", "와이드팬츠"],
    CategoryEnum.SKIRT: ["미니스커트", "미디스커트", "롱스커트", "플리츠스커트", "A라인스커트"],
    CategoryEnum.ONEPIECE: ["미니원피스", "미디원피스", "롱원피스", "점프슈트", "뷔스티에원피스"],
    CategoryEnum.OUTER: ["자켓", "코트", "패딩", "점퍼/집업", "가디건", "트렌치코트", "집업후드"],
    CategoryEnum.HAT: ["볼캡", "버킷햇", "비니", "페도라", "썬캡"],
    CategoryEnum.SHOES: ["스니커즈/운동화", "로퍼/단화", "구두/힐", "부츠/워커", "샌들/슬리퍼", "레인부츠"],
    CategoryEnum.BAG: ["숄더백", "크로스백", "토트백", "백팩", "클러치", "미니백"],
    CategoryEnum.JEWELRY: ["목걸이", "귀걸이", "반지", "팔찌", "시계"],
    CategoryEnum.ETC: ["목도리/스카프", "장갑", "벨트", "양말/스타킹", "선글라스/안경"],
}

ALLOWED_COLORS: set[str] = {
    "블랙", "화이트", "그레이", "베이지", "브라운", "네이비", "블루", "그린",
    "옐로우", "핑크", "레드", "퍼플", "카키", "오렌지", "멀티/패턴", "기타",
}

ALLOWED_SEASONS: set[str] = {"봄", "여름", "가을", "겨울", "사계절"}

ALLOWED_STYLES: set[str] = {
    "캐주얼", "스트릿", "미니멀", "아메카지", "비즈니스/출근룩",
    "스포티", "페미닌", "모던", "빈티지/레트로", "홈웨어",
}

ALL_SEASONS_WILDCARD = "사계절"


# ============================================================================
# 2. Pydantic 데이터 모델 (Schemas)
# ============================================================================

class ClothingItemBase(BaseModel):
    name: str = Field(..., description="의류/패션 아이템 이름", example="린넨 오버핏 셔츠")
    category: str = Field(..., description="10대 대분류 카테고리 키 (top, pants, outer 등)", example="top")
    sub_category: Optional[str] = Field(None, description="세부 하위 카테고리", example="셔츠/블라우스")
    colors: List[str] = Field(..., min_length=1, description="색상 목록", example=["화이트", "베이지"])
    seasons: List[str] = Field(..., min_length=1, description="적합 계절 목록", example=["봄", "여름"])
    styles: List[str] = Field(..., min_length=1, description="스타일 목록", example=["미니멀", "캐주얼"])
    image_url: Optional[str] = Field(None, description="아이템 이미지 URL", example="https://example.com/items/shirt.jpg")
    memo: Optional[str] = Field(None, description="추가 메모", example="여름철 에어컨 바람용으로도 적합")

    @field_validator("category")
    @classmethod
    def validate_category(cls, value: str) -> str:
        valid_keys = [cat.value for cat in CategoryEnum]
        if value not in valid_keys:
            raise ValueError(f"유효하지 않은 카테고리입니다: '{value}'. 허용 카테고리: {valid_keys}")
        return value

    @field_validator("colors")
    @classmethod
    def validate_colors(cls, colors: List[str]) -> List[str]:
        invalid = [c for c in colors if c not in ALLOWED_COLORS]
        if invalid:
            raise ValueError(f"유효하지 않은 색상이 포함되어 있습니다: {invalid}. 허용 색상: {sorted(ALLOWED_COLORS)}")
        return colors

    @field_validator("seasons")
    @classmethod
    def validate_seasons(cls, seasons: List[str]) -> List[str]:
        invalid = [s for s in seasons if s not in ALLOWED_SEASONS]
        if invalid:
            raise ValueError(f"유효하지 않은 계절이 포함되어 있습니다: {invalid}. 허용 계절: {sorted(ALLOWED_SEASONS)}")
        return seasons

    @field_validator("styles")
    @classmethod
    def validate_styles(cls, styles: List[str]) -> List[str]:
        invalid = [s for s in styles if s not in ALLOWED_STYLES]
        if invalid:
            raise ValueError(f"유효하지 않은 스타일이 포함되어 있습니다: {invalid}. 허용 스타일: {sorted(ALLOWED_STYLES)}")
        return styles


class ClothingItemCreate(ClothingItemBase):
    pass


class ClothingItemResponse(ClothingItemBase):
    item_id: str = Field(..., description="아이템 고유 식별자 (예: item_001)", example="item_001")
    user_id: str = Field(..., description="사용자 ID", example="user_default")
    created_at: str = Field(..., description="생성 일시 (ISO 8601 UTC)", example="2026-10-28T14:00:00Z")

    model_config = ConfigDict(from_attributes=True)


class OutfitValidationRequest(BaseModel):
    item_ids: List[str] = Field(..., min_length=1, description="검증할 코디 아이템 ID 목록", example=["item_001", "item_002"])
    city_name: Optional[str] = Field("Seoul", description="착용 지역(날씨 검증용)", example="Seoul")


class OutfitValidationResponse(BaseModel):
    is_valid: bool = Field(..., description="코디 조합 유효 여부")
    issues: List[str] = Field(default_factory=list, description="위반된 규칙 및 경고 메시지 목록")
    items: List[ClothingItemResponse] = Field(default_factory=list, description="조합에 포함된 아이템 상세")
    weather_info: Dict[str, Any] = Field(default_factory=dict, description="검증 당시 참조된 날씨 정보")


class AIContextResponse(BaseModel):
    weather_summary: Dict[str, Any] = Field(..., description="날씨 요약 정보 (기온, 날씨 상태, 추천 계절 등)")
    formatted_context: str = Field(..., description="LLM 프롬프트에 즉시 주입 가능한 옷장 및 날씨 컨텍스트 텍스트")


# ============================================================================
# 3. 비즈니스 로직 & 날씨 연동 서비스 (MyClosetService)
# ============================================================================

class MyClosetService:
    """옷장 데이터 관리 및 기상 기반 패션 추천 비즈니스 로직 서비스."""

    def __init__(self, openweather_api_key: Optional[str] = None):
        self.openweather_api_key = openweather_api_key or os.getenv("OPENWEATHER_API_KEY", "")
        # 인메모리 저장소: {item_id: item_dict}
        self._items: Dict[str, Dict[str, Any]] = {}
        self._item_counter: int = 0

    # ------------------------------------------------------------------------
    # 3.1 아이템 관리 CRUD
    # ------------------------------------------------------------------------
    def add_item(self, item_in: ClothingItemCreate, user_id: str = "user_default") -> Dict[str, Any]:
        self._item_counter += 1
        item_id = f"item_{self._item_counter:03d}"
        created_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

        item_dict = item_in.model_dump()
        item_dict.update({
            "item_id": item_id,
            "user_id": user_id,
            "created_at": created_at,
        })
        self._items[item_id] = item_dict
        return item_dict

    def get_item(self, item_id: str) -> Optional[Dict[str, Any]]:
        return self._items.get(item_id)

    def delete_item(self, item_id: str) -> bool:
        if item_id in self._items:
            del self._items[item_id]
            return True
        return False

    def list_items(
        self,
        category: Optional[str] = None,
        season: Optional[str] = None,
        style: Optional[str] = None,
        color: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        results = []
        for item in self._items.values():
            if category and item["category"] != category:
                continue

            # 사계절 와일드카드 규칙: 사계절 아이템은 모든 season 질의에 매칭됨
            if season:
                item_seasons = item.get("seasons", [])
                if season not in item_seasons and ALL_SEASONS_WILDCARD not in item_seasons:
                    continue

            if style and style not in item.get("styles", []):
                continue

            if color and color not in item.get("colors", []):
                continue

            results.append(item)
        return results

    # ------------------------------------------------------------------------
    # 3.2 날씨 정보 조회 & Graceful Fallback
    # ------------------------------------------------------------------------
    async def get_weather(self, city_name: str = "Seoul") -> Dict[str, Any]:
        """OpenWeatherMap API를 호출하며 실패 또는 미설정 시 Mock 데이터로 Graceful Fallback."""
        mock_weather = {
            "city": city_name,
            "temp": 18.5,
            "condition": "Rain",
            "description": "실시간 날씨 API 미연동 또는 호출 실패로 인한 대체 데이터(18.5°C, 비)",
            "is_mock": True,
        }

        if not self.openweather_api_key:
            return mock_weather

        url = "https://api.openweathermap.org/data/2.5/weather"
        params = {
            "q": city_name,
            "appid": self.openweather_api_key,
            "units": "metric",
            "lang": "kr",
        }

        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(url, params=params)
                if res.status_code == 200:
                    data = res.json()
                    temp = round(float(data["main"]["temp"]), 1)
                    weather_desc = data["weather"][0]["description"] if data.get("weather") else "Clear"
                    main_condition = data["weather"][0]["main"] if data.get("weather") else "Clear"
                    return {
                        "city": city_name,
                        "temp": temp,
                        "condition": main_condition,
                        "description": weather_desc,
                        "is_mock": False,
                    }
                else:
                    return mock_weather
        except Exception:
            return mock_weather

    # ------------------------------------------------------------------------
    # 3.3 기온-계절 매핑 규격
    # ------------------------------------------------------------------------
    @staticmethod
    def map_temperature_to_seasons(temp: float) -> List[str]:
        """기온-계절 비즈니스 매핑:

        - 28°C 이상: 여름
        - 20°C ~ 27°C: 봄, 여름
        - 12°C ~ 19°C: 봄, 가을
        - 5°C ~ 11°C: 가을, 겨울
        - 4°C 이하: 겨울
        """
        if temp >= 28.0:
            return ["여름"]
        elif 20.0 <= temp <= 27.99:
            return ["봄", "여름"]
        elif 12.0 <= temp <= 19.99:
            return ["봄", "가을"]
        elif 5.0 <= temp <= 11.99:
            return ["가을", "겨울"]
        else:
            return ["겨울"]

    # ------------------------------------------------------------------------
    # 3.4 코디 조합 규칙 검증 (Outfit Validation)
    # ------------------------------------------------------------------------
    async def validate_outfit(self, item_ids: List[str], city_name: str = "Seoul") -> OutfitValidationResponse:
        issues: List[str] = []
        resolved_items: List[Dict[str, Any]] = []

        for iid in item_ids:
            item = self.get_item(iid)
            if not item:
                issues.append(f"아이템을 찾을 수 없습니다: '{iid}'")
            else:
                resolved_items.append(item)

        categories = [item["category"] for item in resolved_items]

        # 규칙 1: 원피스 조합 제약
        # onepiece 아이템이 포함된 경우 top, pants, skirt 카테고리 아이템이 함께 들어있으면 위반
        if CategoryEnum.ONEPIECE.value in categories:
            clashing = [cat for cat in [CategoryEnum.TOP.value, CategoryEnum.PANTS.value, CategoryEnum.SKIRT.value] if cat in categories]
            if clashing:
                issues.append(
                    f"원피스(onepiece) 착용 시 상의/하의({', '.join(clashing)})를 동시에 매치할 수 없습니다."
                )

        # 날씨 조회 및 기온 매핑 검증
        weather = await self.get_weather(city_name)
        recommended_seasons = self.map_temperature_to_seasons(weather["temp"])
        weather["recommended_seasons"] = recommended_seasons

        # 기온-계절 적합성 검증
        for item in resolved_items:
            seasons = item.get("seasons", [])
            # 사계절 와일드카드는 무조건 허용
            if ALL_SEASONS_WILDCARD in seasons:
                continue
            # 추천 계절과 겹치는지 확인
            if not any(s in seasons for s in recommended_seasons):
                issues.append(
                    f"아이템 '{item['name']}'({item['item_id']})의 계절 설정 {seasons}은(는) "
                    f"현재 날씨({weather['temp']}°C, 권장: {recommended_seasons})에 적합하지 않습니다."
                )

        is_valid = len(issues) == 0
        pydantic_items = [ClothingItemResponse(**item) for item in resolved_items]

        return OutfitValidationResponse(
            is_valid=is_valid,
            issues=issues,
            items=pydantic_items,
            weather_info=weather,
        )

    # ------------------------------------------------------------------------
    # 3.5 LLM 프롬프트 주입용 AI Context 생성
    # ------------------------------------------------------------------------
    async def generate_ai_context(self, city_name: str = "Seoul", target_style: Optional[str] = None) -> AIContextResponse:
        weather = await self.get_weather(city_name)
        recommended_seasons = self.map_temperature_to_seasons(weather["temp"])
        weather["recommended_seasons"] = recommended_seasons

        # 추천 계절 및 스타일에 맞는 아이템 필터링
        candidate_items = []
        for item in self._items.values():
            seasons = item.get("seasons", [])
            season_match = (ALL_SEASONS_WILDCARD in seasons) or any(s in seasons for s in recommended_seasons)
            if not season_match:
                continue

            if target_style and target_style not in item.get("styles", []):
                continue

            candidate_items.append(item)

        # 카테고리별 분류 텍스트 구성
        grouped: Dict[str, List[str]] = {}
        for item in candidate_items:
            cat = item["category"]
            details = (
                f"- [{item['item_id']}] {item['name']} "
                f"(색상: {', '.join(item['colors'])}, 계절: {', '.join(item['seasons'])}, 스타일: {', '.join(item['styles'])})"
            )
            grouped.setdefault(cat, []).append(details)

        items_text_lines = []
        for cat, lines in grouped.items():
            items_text_lines.append(f"### 카테고리: {cat.upper()}")
            items_text_lines.extend(lines)

        items_block = "\n".join(items_text_lines) if items_text_lines else "(적합한 추천 후보 아이템이 옷장에 없습니다.)"

        formatted_context = f"""[사용자 실시간 환경 & 디지털 옷장 컨텍스트]
- 조회 도시: {weather['city']}
- 현재 기온: {weather['temp']}°C ({weather['condition']}, {weather['description']})
- 현재 기온 기반 추천 계절군: {', '.join(recommended_seasons)}
- 요청 스타일 필터: {target_style or '전체 스타일'}

[추천 가능한 보유 옷장 아이템 목록]
{items_block}

[코디 가이드라인]
1. 원피스(onepiece) 선택 시 상의(top), 바지(pants), 치마(skirt)를 동시에 매치하지 마세요.
2. 현재 기온({weather['temp']}°C) 및 추천 계절에 부합하는 아이템 위주로 최적의 조합을 구성하세요.
"""
        return AIContextResponse(
            weather_summary=weather,
            formatted_context=formatted_context,
        )


# ============================================================================
# 4. FastAPI 앱 및 엔드포인트 정의
# ============================================================================

app = FastAPI(
    title="AI 코디 앱 디지털 옷장 API",
    description="실시간 날씨와 연동하여 옷장 아이템 관리, 코디 조합 검증 및 LLM 프롬프트 컨텍스트를 제공하는 백엔드 API",
    version="1.0.0",
)

closet_service = MyClosetService()


@app.post(
    "/api/v1/closet/items",
    response_model=ClothingItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="신규 옷장 아이템 등록",
    description="10대 대분류 카테고리 및 색상/계절/스타일 규칙을 준수하여 새 옷장 아이템을 등록합니다.",
)
async def create_item(item: ClothingItemCreate):
    # Category 유효성 검증은 Pydantic validator에서 수행되며, 실패 시 422 또는 400 반환
    # 명세서의 요구사항(10대 분류에 맞지 않으면 HTTP 400 Bad Request)에 맞추어 추가 방어 로직 적용
    if item.category not in [c.value for c in CategoryEnum]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"카테고리가 10대 분류에 맞지 않습니다: '{item.category}'",
        )
    created = closet_service.add_item(item)
    return created


@app.get(
    "/api/v1/closet/items",
    response_model=List[ClothingItemResponse],
    summary="아이템 목록 조회 및 다중 조건 필터링",
    description="카테고리, 계절(사계절 자동 매칭), 스타일, 색상 조건을 조합하여 보유 아이템을 검색합니다.",
)
async def list_items(
    category: Optional[str] = Query(None, description="대분류 카테고리 (예: top, pants)"),
    season: Optional[str] = Query(None, description="계절 필터 (봄, 여름, 가을, 겨울)"),
    style: Optional[str] = Query(None, description="스타일 필터 (예: 캐주얼, 미니멀)"),
    color: Optional[str] = Query(None, description="색상 필터 (예: 블랙, 화이트)"),
):
    items = closet_service.list_items(category=category, season=season, style=style, color=color)
    return items


@app.get(
    "/api/v1/closet/items/{item_id}",
    response_model=ClothingItemResponse,
    summary="아이템 단건 상세 조회",
    description="아이템 ID(item_001 등)로 특정 옷장 아이템을 조회합니다.",
)
async def get_item(item_id: str):
    item = closet_service.get_item(item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"아이템 '{item_id}'을(를) 찾을 수 없습니다.",
        )
    return item


@app.delete(
    "/api/v1/closet/items/{item_id}",
    status_code=status.HTTP_200_OK,
    summary="아이템 삭제",
    description="지정된 아이템 ID를 옷장에서 제거합니다.",
)
async def delete_item(item_id: str):
    success = closet_service.delete_item(item_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"삭제 대상 아이템 '{item_id}'을(를) 찾을 수 없습니다.",
        )
    return {"message": f"아이템 '{item_id}'이(가) 성공적으로 삭제되었습니다."}


@app.get(
    "/api/v1/closet/ai-context",
    response_model=AIContextResponse,
    summary="LLM 주입용 날씨 & 옷장 컨텍스트 생성",
    description="지정 도시의 실시간 날씨를 기반으로 현재 기온에 맞는 추천 아이템을 정제하여 LLM 프롬프트에 주입 가능한 텍스트를 반환합니다.",
)
async def get_ai_context(
    city_name: str = Query("Seoul", description="조회할 도시 이름"),
    target_style: Optional[str] = Query(None, description="목표 스타일(선택)"),
):
    ai_context = await closet_service.generate_ai_context(city_name=city_name, target_style=target_style)
    return ai_context


@app.post(
    "/api/v1/closet/validate-outfit",
    response_model=OutfitValidationResponse,
    summary="코디 조합 규칙 검증",
    description="선택한 아이템들의 조합에서 원피스-상하의 충돌, 기온-계절 불일치 여부를 검증하고 리포트를 반환합니다.",
)
async def validate_outfit(req: OutfitValidationRequest):
    result = await closet_service.validate_outfit(item_ids=req.item_ids, city_name=req.city_name or "Seoul")
    return result


# ============================================================================
# 5. 예시 실행 및 테스트 코드 (Main & FastAPI TestClient)
# ============================================================================

def run_automated_test_scenarios():
    """요청된 3가지 시나리오를 FastAPI TestClient로 자동 검증하는 테스트 러너."""
    from fastapi.testclient import TestClient

    print("\n" + "=" * 70)
    print(">>> [테스트 시작] FastAPI TestClient를 통한 자동 검증 시나리오 실행")
    print("=" * 70)

    client = TestClient(app)

    # 시나리오 1: POST /api/v1/closet/items 로 4개 아이템 등록 테스트
    print("\n[시나리오 1] 4개 아이템(가디건, 반팔티, 청바지, 원피스) 등록 테스트")
    items_to_create = [
        {
            "name": "포근한 베이지 가디건",
            "category": "outer",
            "sub_category": "가디건",
            "colors": ["베이지"],
            "seasons": ["봄", "가을"],
            "styles": ["미니멀", "캐주얼"],
            "memo": "간절기 필수템",
        },
        {
            "name": "베이직 화이트 반팔티",
            "category": "top",
            "sub_category": "반팔티",
            "colors": ["화이트"],
            "seasons": ["여름", "사계절"],
            "styles": ["캐주얼", "미니멀"],
            "memo": "기본 이너웨어",
        },
        {
            "name": "스트레이트 핏 청바지",
            "category": "pants",
            "sub_category": "청바지",
            "colors": ["블루"],
            "seasons": ["사계절"],
            "styles": ["캐주얼", "스트릿"],
            "memo": "어디에나 잘 어울림",
        },
        {
            "name": "플라워 미디 뷔스티에 원피스",
            "category": "onepiece",
            "sub_category": "뷔스티에원피스",
            "colors": ["핑크", "멀티/패턴"],
            "seasons": ["봄", "여름"],
            "styles": ["페미닌", "모던"],
            "memo": "단독 혹은 가디건 매치",
        },
    ]

    registered_item_ids = []
    for item_data in items_to_create:
        res = client.post("/api/v1/closet/items", json=item_data)
        assert res.status_code == 201, f"아이템 등록 실패: {res.text}"
        data = res.json()
        registered_item_ids.append(data["item_id"])
        print(f"  + 등록 완료: [{data['item_id']}] {data['name']} (카테고리: {data['category']})")

    # 잘못된 카테고리 등록 시 HTTP 400/422 검증
    invalid_category_res = client.post(
        "/api/v1/closet/items",
        json={
            "name": "미확인 아이템",
            "category": "unknown_category",
            "colors": ["블랙"],
            "seasons": ["봄"],
            "styles": ["캐주얼"],
        },
    )
    assert invalid_category_res.status_code in (400, 422), "카테고리 오류 시 400 또는 422이어야 합니다."
    print("  + [검증 확인] 잘못된 카테고리 요청 거절 확인 (Status Code:", invalid_category_res.status_code, ")")

    # 시나리오 2: GET /api/v1/closet/ai-context?city_name=Seoul 호출 및 formatted_context 검증
    print("\n[시나리오 2] GET /api/v1/closet/ai-context?city_name=Seoul 호출 검증")
    res_context = client.get("/api/v1/closet/ai-context?city_name=Seoul")
    assert res_context.status_code == 200, f"AI Context 호출 실패: {res_context.text}"
    context_data = res_context.json()
    formatted_context = context_data["formatted_context"]

    print("  - 기온 / 날씨 요약:", context_data["weather_summary"])
    print("  - LLM 주입용 formatted_context 미리보기:")
    print("-" * 50)
    print(formatted_context.strip())
    print("-" * 50)
    assert "[사용자 실시간 환경 & 디지털 옷장 컨텍스트]" in formatted_context
    assert "Seoul" in formatted_context

    # 시나리오 3: POST /api/v1/closet/validate-outfit 으로 원피스 + 청바지 조합 시 유효성 검증 에러 확인
    print("\n[시나리오 3] 원피스 + 청바지 조합 전달 시 유효성 검증 에러 발생 확인")
    # 원피스는 item_004, 청바지는 item_003
    onepiece_id = registered_item_ids[3]
    jeans_id = registered_item_ids[2]

    conflict_req = {
        "item_ids": [onepiece_id, jeans_id],
        "city_name": "Seoul",
    }
    res_validate = client.post("/api/v1/closet/validate-outfit", json=conflict_req)
    assert res_validate.status_code == 200, f"검증 API 호출 실패: {res_validate.text}"
    val_data = res_validate.json()

    print(f"  - 검증 대상: 원피스({onepiece_id}) + 청바지({jeans_id})")
    print(f"  - is_valid 결과: {val_data['is_valid']}")
    print(f"  - 발생한 이슈 목록: {val_data['issues']}")

    assert val_data["is_valid"] is False, "원피스와 바지 조합은 is_valid가 False여야 합니다."
    assert any("원피스(onepiece) 착용 시 상의/하의" in issue for issue in val_data["issues"]), "원피스 제약 오류 메시지가 포함되어야 합니다."
    print("  + [검증 통과] 원피스 + 바지 조합 규칙 위반 정상 감지 완료!")

    # 정상 조합 테스트도 함께 확인 (반팔티 + 청바지 + 가디건)
    print("\n[추가 검증] 정상 조합 (반팔티 + 청바지 + 가디건) 테스트")
    valid_combo_req = {
        "item_ids": [registered_item_ids[0], registered_item_ids[1], registered_item_ids[2]],
        "city_name": "Seoul",
    }
    res_valid_combo = client.post("/api/v1/closet/validate-outfit", json=valid_combo_req)
    assert res_valid_combo.status_code == 200
    valid_data = res_valid_combo.json()
    print(f"  - is_valid 결과: {valid_data['is_valid']}")
    print(f"  - 이슈: {valid_data['issues']}")

    print("\n" + "=" * 70)
    print(">>> [테스트 완료] 모든 시나리오 테스트가 성공적으로 통과되었습니다!")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    import uvicorn

    # 1. 자동 테스트 시나리오 먼저 실행
    run_automated_test_scenarios()

    # 2. FastAPI 서버 구동 안내 및 서버 실행
    print("=" * 70)
    print("FastAPI 서버를 시작합니다.")
    print("Swagger 문서 확인: http://127.0.0.1:8000/docs")
    print("=" * 70)

    uvicorn.run(app, host="127.0.0.1", port=8000)
