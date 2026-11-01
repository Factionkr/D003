from typing import Dict
from schemas.recommendation import (
    UserScheduleRequest, RecommendationResponse, UserScheduleSummary,
    RecommendedStyleRule, OccasionDetailType, MobilityType, PreferredFit, PersonalColor
)

FORMALITY_PRIORITY: Dict[OccasionDetailType, float] = {
    OccasionDetailType.FUNERAL: 5.0,
    OccasionDetailType.FORMAL_CEREMONY: 4.8,
    OccasionDetailType.WORK_MEETING: 4.0,
    OccasionDetailType.WEDDING_GUEST: 3.8,
    OccasionDetailType.FAMILY_GATHERING: 3.5,
    OccasionDetailType.WORK_OFFICE: 3.0,
    OccasionDetailType.SPECIAL_ANNIVERSARY: 3.0,
    OccasionDetailType.AFTER_WORK_DINNER: 2.8,
    OccasionDetailType.AFTER_WORK_PUB: 1.8,
    OccasionDetailType.WEEKEND_OUTING: 1.2,
    OccasionDetailType.WEEKEND_DAILY: 1.0,
}

STYLE_BASE_CATALOG = {
    5.0: {
        "dress_code": "Dark Formal (엄숙한 정장)",
        "base_items": ["블랙 무지 정장 슬랙스", "매트 화이트 드레스 셔츠"],
        "outerwear": "포멀 블랙 싱글 블레이저 자켓",
        "footwear": "블랙 플레인토 가죽 더비슈즈 (다크 삭스)",
        "avoid_items": ["화려한 원색/형광 의류", "맨발 노출 / 샌들", "화려한 메탈 시계", "모자 착용"]
    },
    4.0: {
        "dress_code": "Business Formal",
        "base_items": ["테일러드 울 슬랙스", "고밀도 옥스포드 드레스 셔츠"],
        "outerwear": "다크 네이비/차콜 테일러드 블레이저",
        "footwear": "클래식 옥스포드 슈즈 or 페니 로퍼",
        "avoid_items": ["슬리퍼 및 오픈토 샌들", "디스트로이드 데님", "그래픽 티셔츠"]
    },
    3.0: {
        "dress_code": "Smart Casual",
        "base_items": ["테이퍼드 핏 치노 슬랙스", "버튼다운 드레스 셔츠"],
        "outerwear": "언스트럭처드 블레이저 or 파인게이지 가디건",
        "footwear": "모던 스웨이드 로퍼 or 클래식 미니멀 레더 스니커즈",
        "avoid_items": ["운동용 트레이닝 팬츠", "과도한 로고 플레이 의류", "등산복"]
    },
    2.0: {
        "dress_code": "City Casual / Day-to-Night",
        "base_items": ["원턱 와이드 슬랙스 or 다크 데님", "실켓 코튼 크루넥 티셔츠 & 셔츠"],
        "outerwear": "소프트 캐주얼 가디건 or 미니멀 집업 블루종",
        "footwear": "레더 스니커즈 or 테슬 로퍼",
        "avoid_items": ["등산화", "형광 트레이닝복"]
    },
    1.0: {
        "dress_code": "Relaxed Daily Casual",
        "base_items": ["이지 밴딩 와이드 팬츠 or 편안한 워싱 데님", "코튼 오버핏 맨투맨"],
        "outerwear": "라이트 나일론 윈드브레이커 or 루즈핏 후드 집업",
        "footwear": "쿠셔닝 워킹 스니커즈",
        "avoid_items": ["불편한 정장 구두", "뻣뻣한 넥타이"]
    }
}

class OutfitRecommendationService:
    @classmethod
    def generate_recommendation(cls, req: UserScheduleRequest) -> RecommendationResponse:
        p_score = FORMALITY_PRIORITY.get(req.primary_occasion, 3.0)
        s_score = FORMALITY_PRIORITY.get(req.secondary_occasion, 0.0) if req.secondary_occasion else 0.0
        dominant_score = max(max(p_score, float(req.formality_level)), s_score)
        
        target_bracket = min(STYLE_BASE_CATALOG.keys(), key=lambda k: abs(k - dominant_score))
        tmpl = STYLE_BASE_CATALOG[target_bracket]

        base_items = list(tmpl["base_items"])
        outerwear = tmpl["outerwear"]
        footwear = tmpl["footwear"]
        avoid_items = list(tmpl["avoid_items"])
        dress_code = tmpl["dress_code"]

        # 핏 & 퍼스널 컬러 적용
        fit_prefix = "릴랙스 오버핏 " if req.preferences.preferred_fit == PreferredFit.OVERFIT else ("슬림 테이퍼드 핏 " if req.preferences.preferred_fit == PreferredFit.SLIMFIT else "스탠다드 레귤러 핏 ")
        base_items[0] = f"{fit_prefix}{base_items[0]}"

        if req.preferences.personal_color == PersonalColor.WARM_TONE:
            base_items.append("웜톤 포인트: 크림 아이보리, 베이지, 카멜 톤 추천")
        elif req.preferences.personal_color == PersonalColor.COOL_TONE:
            base_items.append("쿨톤 포인트: 쿨 그레이, 네이비, 소프트 블루 톤 추천")

        # 날씨 가중치
        avg_temp = (req.weather.min_temp + req.weather.max_temp) / 2
        if avg_temp < 10:
            outerwear = f"{outerwear} + 롱 코트 레이어드"
        elif avg_temp >= 24:
            outerwear = "가벼운 린넨 블레이저 or 아우터 생략 권장"

        if req.weather.precipitation_prob >= 60:
            footwear = f"{footwear} (※ 우천 대비: 스웨이드 금지, 발수 레더 슈즈 권장)"
            avoid_items.append("스웨이드 슈즈 및 밑단이 끌리는 팬츠")

        # Day-to-Night 팁
        all_occ = [req.primary_occasion] + ([req.secondary_occasion] if req.secondary_occasion else [])
        transition_tip = None
        if req.secondary_occasion and any(occ in [OccasionDetailType.AFTER_WORK_DINNER, OccasionDetailType.AFTER_WORK_PUB, OccasionDetailType.SPECIAL_ANNIVERSARY] for occ in all_occ):
            dress_code = f"{dress_code} with Convertible Option"
            transition_tip = "퇴근 후 저녁 모임 시 자켓을 벗거나 상의 단추를 가볍게 풀어 연출하세요."

        if OccasionDetailType.WEDDING_GUEST in all_occ:
            avoid_items.insert(0, "신부 드레스와 겹치는 올 화이트 룩 엄격 금지")
        if OccasionDetailType.FUNERAL in all_occ:
            avoid_items.insert(0, "원색 계열 의류 및 화려한 액세서리 금지")

        return RecommendationResponse(
            user_schedule=UserScheduleSummary(
                primary_occasion=req.primary_occasion.value,
                secondary_occasion=req.secondary_occasion.value if req.secondary_occasion else None,
                formality_level=int(dominant_score),
                location=req.location_type
            ),
            recommended_style_rule=RecommendedStyleRule(
                dress_code=dress_code,
                base_items=base_items,
                outerwear=outerwear,
                footwear=footwear,
                transition_tip=transition_tip,
                avoid_items=list(set(avoid_items))
            )
        )
