import sys
import json
import uvicorn
from datetime import datetime, timedelta
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

from app.api.routes import router
from app.models.context import TargetContext
from app.models.profile import UserProfile
from app.models.wardrobe import WardrobeItem
from app.engine.outfit_engine import OutfitCombinationEngine

app = FastAPI(
    title="4060 Women Digital Wardrobe Outfit Engine",
    description="4060 여성 맞춤 디지털 옷장 코디 조합 및 AI 스타일리스트 추천 엔진",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


def run_cli_demo():
    """CLI 데모 실행: 동창회 모임(격식도 4) 시나리오 테스트"""
    print("=" * 60)
    print("👗 [DEMO] 4060 여성 디지털 옷장 코디 조합 엔진 시작")
    print("=" * 60)

    # 1. 컨텍스트 설정: 18.5도 맑은 날씨, 동창회 모임 (격식도 4)
    context = TargetContext(
        occasion="ALUMNI_GATHERING",
        formality_level=4,
        temperature_celsius=18.5,
        weather_condition="CLEAR"
    )

    # 2. 사용자 프로필: 50대, 가을 뮤트, 복부/팔뚝 커버 희망
    profile = UserProfile(
        user_id="user_4060_001",
        age_group="50s",
        personal_color="AUTUMN_MUTED",
        body_focus_areas=["ABDOMEN_COVER", "UPPER_ARM_COVER"],
        preferred_fits=["LOOSE", "A_LINE"]
    )

    # 3. 옷장 데이터 준비
    now = datetime.now()
    wardrobe = [
        # 배제 대상 1: 한여름 린넨 (겨울 전용 아니지만 저온/상황 테스트용)
        # 배제 대상 2: 동창회에 부적합한 찢어진 청바지 (격식도 4 배제)
        WardrobeItem(
            item_id="cloth_bad_01",
            name="찢어진 배기 청바지",
            category="BOTTOM",
            subcategory="RIPPED_JEANS",
            fit="LOOSE",
            color="BLUE",
            material="DENIM",
            pattern="SOLID",
            seasonality=["SPRING", "AUTUMN"],
            formality_rating=1
        ),
        # 정상 후보군:
        WardrobeItem(
            item_id="cloth_0102",
            name="캐시미어 혼방 베이지 롱 가디건",
            category="OUTER",
            subcategory="CARDIGAN",
            fit="LOOSE",
            color="BEIGE",
            material="CASHMERE",
            pattern="SOLID",
            seasonality=["SPRING", "AUTUMN"],
            formality_rating=4,
            is_elastic_waist=False,
            stretchable=True,
            last_worn_date=now - timedelta(days=40)
        ),
        WardrobeItem(
            item_id="cloth_0305",
            name="아이보리 실크 블라우스",
            category="TOP",
            subcategory="BLOUSE",
            fit="LOOSE",
            color="IVORY",
            material="SILK",
            pattern="SOLID",
            seasonality=["SPRING", "AUTUMN"],
            formality_rating=4,
            is_elastic_waist=False,
            stretchable=True,
            last_worn_date=now - timedelta(days=35)
        ),
        WardrobeItem(
            item_id="cloth_0812",
            name="다크브라운 핀턱 세미 와이드 슬랙스",
            category="BOTTOM",
            subcategory="SLACKS",
            fit="WIDE",
            color="BROWN",
            material="WOOL",
            pattern="SOLID",
            seasonality=["SPRING", "AUTUMN"],
            formality_rating=4,
            is_elastic_waist=True,
            stretchable=True,
            last_worn_date=now - timedelta(days=25)
        ),
        WardrobeItem(
            item_id="shoe_0041",
            name="수제 가죽 로퍼 (굽 3cm)",
            category="SHOES",
            subcategory="LOAFER",
            fit="REGULAR",
            color="BROWN",
            material="LEATHER",
            pattern="SOLID",
            seasonality=["SPRING", "AUTUMN", "WINTER"],
            formality_rating=4,
            is_elastic_waist=False,
            stretchable=False,
            last_worn_date=now - timedelta(days=20)
        ),
        WardrobeItem(
            item_id="acc_0009",
            name="실크 패턴 스카프",
            category="ACCESSORY",
            subcategory="SCARF",
            fit="FREE",
            color="BEIGE",
            material="SILK",
            pattern="FLORAL",
            seasonality=["SPRING", "AUTUMN"],
            formality_rating=4,
            is_elastic_waist=False,
            stretchable=False,
            last_worn_date=now - timedelta(days=15)
        )
    ]

    engine = OutfitCombinationEngine()
    response = engine.recommend_outfits(wardrobe, context, profile, top_k=1)

    print("\n✅ 추천 완료! 결과 JSON 출력:")
    print(response.model_dump_json(indent=2))


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "server":
        uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
    else:
        run_cli_demo()
