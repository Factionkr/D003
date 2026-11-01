from datetime import datetime, timezone
from typing import List, Set, Optional
from app.models.context import TargetContext
from app.models.profile import UserProfile
from app.models.wardrobe import WardrobeItem, OutfitCombination
from app.models.response import ScoreBreakdown


class OutfitScoringEngine:
    """
    4060 여성 디지털 옷장 코디 조합 평가 엔진
    
    100점 만점 기준 5가지 핵심 가중치 항목을 계산합니다:
    1. 체형 보정 및 비율 (Body Coverage & Ratio, 30%)
    2. TPO & 격식도 적합성 (Formality Match, 25%)
    3. 컬러 & 패턴 조화 (Color & Pattern Harmony, 20%)
    4. 착용감 및 날씨 적합도 (Comfort & Weather Match, 15%)
    5. 착용 빈도 순환 및 다양성 (Wear Rotation & Diversity, 10%)
    """

    # 고급/프리미엄 소재 정의 (TPO 가점 대상)
    LUXURY_MATERIALS: Set[str] = {"CASHMERE", "SILK", "SILK_100", "WOOL", "HEAVY_WOOL", "LINEN"}

    # 4060 선호 톤온톤 / 톤인톤 조화 컬러 그룹
    HARMONIOUS_COLOR_GROUPS: List[Set[str]] = [
        {"IVORY", "BEIGE", "BROWN", "CAMEL", "CREAM", "OATMEAL", "TAUPE", "KHAKI", "TAN", "WHEAT"},
        {"WHITE", "GREY", "GRAY", "CHARCOAL", "BLACK", "SILVER", "OFF_WHITE"},
        {"LIGHT_BLUE", "SKY_BLUE", "NAVY", "DENIM", "INDIGO", "COBALT", "BLUE"},
        {"SAGE", "OLIVE", "MINT", "GREEN", "KHAKI"},
        {"DUSTY_PINK", "ROSE", "BURGUNDY", "WINE", "PLUM", "LAVENDER", "PINK"}
    ]

    # 웜톤 / 쿨톤 매칭 컬러군
    WARM_COLORS: Set[str] = {
        "IVORY", "BEIGE", "BROWN", "CAMEL", "CREAM", "OATMEAL", "KHAKI",
        "TERRACOTTA", "MUSTARD", "PEACH", "CORAL", "OLIVE", "TAN", "WHEAT"
    }
    COOL_COLORS: Set[str] = {
        "WHITE", "GREY", "GRAY", "CHARCOAL", "BLACK", "NAVY", "LIGHT_BLUE",
        "SKY_BLUE", "BLUE", "LAVENDER", "PURPLE", "SILVER", "ROSE", "WINE", "BURGUNDY"
    }

    def calculate_body_coverage_score(self, outfit: OutfitCombination, profile: UserProfile) -> float:
        """
        [가중치 30%] 체형 보정 및 비율 (Body Coverage & Ratio, 30점 만점)
        - 복부 및 팔뚝 커버: 루즈핏, A라인, H라인 상의 및 롱 가디건, 핀턱 와이드 팬츠 가점
        - 타이트/크롭 상하의 감점
        - 실루엣 균형: (여유 상의 + 슬림/일자 하의) 또는 (와이드 하의 + 단정/슬림 상의) 가점
        - 다리 길이 착시: 상하의 톤온톤 및 하이웨이스트/핀턱 와이드 슬랙스 가점
        """
        score = 15.0  # 기본 점수

        top = outfit.top
        bottom = outfit.bottom
        outer = outfit.outer

        top_fit = top.fit.upper()
        bottom_fit = bottom.fit.upper()
        outer_fit = outer.fit.upper() if outer else ""

        # 1) 복부 및 팔뚝 커버 가점
        needs_abdomen = "ABDOMEN_COVER" in profile.body_focus_areas
        needs_arm = "UPPER_ARM_COVER" in profile.body_focus_areas

        if needs_abdomen or needs_arm:
            if top_fit in {"LOOSE", "A_LINE", "H_LINE", "OVERSIZED"}:
                score += 5.0
            if outer and outer_fit in {"LOOSE", "A_LINE", "LONG", "OVERSIZED"}:
                score += 3.0
            if bottom_fit in {"WIDE", "A_LINE", "PALAZZO"}:
                score += 3.0

            # 4060 체형 비선호 타이트/크롭 감점
            if top_fit in {"SLIM", "BODYCON", "CROP"}:
                score -= 4.0

        # 2) 실루엣 균형 (상하의 볼륨 밸런스)
        is_top_loose = top_fit in {"LOOSE", "A_LINE", "OVERSIZED"}
        is_bottom_slim = bottom_fit in {"SLIM", "STRAIGHT", "REGULAR"}
        is_bottom_wide = bottom_fit in {"WIDE", "PALAZZO", "A_LINE"}
        is_top_neat = top_fit in {"REGULAR", "STRAIGHT", "NEAT", "SLIM"}

        if (is_top_loose and is_bottom_slim) or (is_bottom_wide and is_top_neat):
            score += 4.0

        # 3) 다리 비율 착시 효과 (상하의 톤온톤 매칭 또는 세미 와이드 핀턱)
        if self._is_tone_on_tone(top.color, bottom.color):
            score += 3.0

        if "핀턱" in bottom.name or "PINTUCK" in bottom.subcategory.upper() or "PIN_TUCK" in bottom.subcategory.upper():
            score += 2.0

        return round(min(30.0, max(0.0, score)), 1)

    def calculate_formality_score(self, outfit: OutfitCombination, context: TargetContext) -> float:
        """
        [가중치 25%] TPO & 격식도 적합성 (Formality Match, 25점 만점)
        - 평균 격식도와 컨텍스트 격식도 레벨 일치율 평가 (±1 오차 범위 가점)
        - 고급 소재감 (실크, 캐시미어, 울, 린넨) 매칭 가점 (격식도 >= 3일 때)
        - 높은 격식도(>=4) 행사 시 트레이닝/슬리퍼 등 캐주얼 아이템 강력 감점
        """
        score = 12.0  # 기본 점수

        items = [outfit.top, outfit.bottom]
        if outfit.outer:
            items.append(outfit.outer)
        if outfit.shoes:
            items.append(outfit.shoes)

        # 1) 격식도 레벨 부합성
        avg_formality = sum(item.formality_rating for item in items) / len(items)
        diff = abs(avg_formality - context.formality_level)

        if diff <= 0.5:
            score += 5.0
        elif diff <= 1.0:
            score += 3.0
        elif diff <= 1.5:
            score += 1.0
        else:
            score -= 3.0

        # 2) 고급 소재감 가점 (격식도 3 이상 시 품격 반영)
        if context.formality_level >= 3:
            luxury_count = sum(1 for it in items if it.material.upper() in self.LUXURY_MATERIALS)
            score += min(5.0, luxury_count * 2.5)

        # 3) 모임/경조사(격식도 4 이상) 시 부적합 캐주얼 감점
        if context.formality_level >= 4:
            for it in items:
                sub = it.subcategory.upper()
                if sub in {"TRACKSUIT", "SWEATPANTS", "HOODIE", "SLIPPERS", "RIPPED_JEANS", "RUNNING_SHOES"}:
                    score -= 8.0

        return round(min(25.0, max(0.0, score)), 1)

    def calculate_color_harmony_score(self, outfit: OutfitCombination, profile: UserProfile) -> float:
        """
        [가중치 20%] 컬러 & 패턴 조화 (Color & Pattern Harmony, 20점 만점)
        - 고급스러운 톤온톤(Tone-on-Tone) 및 톤인톤 조화 가점
        - 사용자 퍼스널 컬러와 상의 색상 매칭 가점
        - 은은한 스카프/액세서리 포인트 가점
        - 상하의 요란한 복합 패턴 충돌 감점
        """
        score = 10.0  # 기본 점수

        top_color = outfit.top.color.upper()
        bottom_color = outfit.bottom.color.upper()

        # 1) 상하의 톤온톤 / 톤인톤 조화
        if self._is_tone_on_tone(top_color, bottom_color):
            score += 5.0

        # 아우터까지 색상 조화가 이어질 경우
        if outfit.outer:
            outer_color = outfit.outer.color.upper()
            if self._is_tone_on_tone(top_color, outer_color) or self._is_tone_on_tone(bottom_color, outer_color):
                score += 2.0

        # 2) 퍼스널 컬러와 상의 색상 매칭
        if self._matches_personal_color(top_color, profile.personal_color):
            score += 3.0

        # 3) 액세서리(스카프, 브로치 등)를 활용한 은은한 포인트 가점
        if outfit.accessory:
            acc_sub = outfit.accessory.subcategory.upper()
            if acc_sub in {"SCARF", "SILK_SCARF", "BROOCH"}:
                score += 2.0

        # 4) 패턴 충돌 감점 (상의와 하의가 모두 화려한 무늬일 때)
        top_pat = outfit.top.pattern.upper()
        bot_pat = outfit.bottom.pattern.upper()
        if top_pat not in {"SOLID", "PLAIN"} and bot_pat not in {"SOLID", "PLAIN"}:
            score -= 3.0

        return round(min(20.0, max(0.0, score)), 1)

    def calculate_comfort_weather_score(self, outfit: OutfitCombination, context: TargetContext) -> float:
        """
        [가중치 15%] 착용감 및 날씨 적합도 (Comfort & Weather Match, 15점 만점)
        - 허리 밴딩 팬츠, 신축성(스트레치) 원단 가점
        - 환절기/기온 변화 대응 레이어드(가디건/스카프) 가점
        - 불편한 핏(바디콘/크롭) 감점
        """
        score = 8.0  # 기본 점수

        # 1) 편안한 착용감 (밴딩 팬츠 및 신축성)
        if outfit.bottom.is_elastic_waist:
            score += 2.5
        if outfit.bottom.stretchable or outfit.top.stretchable:
            score += 2.0

        # 2) 기온 대응 레이어드 (가디건, 아우터, 스카프 등)
        temp = context.temperature_celsius
        has_outer = outfit.outer is not None
        has_scarf = outfit.accessory is not None and "SCARF" in outfit.accessory.subcategory.upper()

        if temp < 22.0:
            if has_outer or has_scarf:
                score += 2.5
        else:
            # 22도 이상 온화/더운 날씨에 불필요한 두꺼운 아우터 없이 가벼운 스타일링
            if not has_outer:
                score += 2.0

        # 3) 불편한 핏 감점
        if outfit.top.fit.upper() in {"BODYCON", "CROP"} or outfit.bottom.fit.upper() in {"BODYCON"}:
            score -= 5.0

        return round(min(15.0, max(0.0, score)), 1)

    def calculate_wear_rotation_score(self, outfit: OutfitCombination) -> float:
        """
        [가중치 10%] 착용 빈도 순환 및 다양성 (Wear Rotation & Diversity, 10점 만점)
        - 최근 30일 이상 미착용 의류 재활용 가점
        - 최근 3일 이내 착용 의류 반복 착용 시 감점
        """
        score = 5.0  # 기본 점수
        now = datetime.now()

        items = [outfit.top, outfit.bottom]
        if outfit.outer:
            items.append(outfit.outer)

        unworn_days_list: List[int] = []
        for it in items:
            if it.last_worn_date is None:
                unworn_days_list.append(60)  # 착용 기록 없음 = 오래 안 입음
            else:
                last_worn = it.last_worn_date
                if last_worn.tzinfo is not None:
                    last_worn = last_worn.replace(tzinfo=None)
                days = (now - last_worn).days
                unworn_days_list.append(max(0, days))

        avg_unworn_days = sum(unworn_days_list) / len(unworn_days_list) if unworn_days_list else 60

        if avg_unworn_days >= 30:
            score += 5.0
        elif avg_unworn_days >= 14:
            score += 3.0
        elif avg_unworn_days < 3:
            score -= 2.0  # 직전 며칠 내 입은 옷의 반복 착용 지양

        return round(min(10.0, max(0.0, score)), 1)

    def evaluate_outfit(
        self, outfit: OutfitCombination, profile: UserProfile, context: TargetContext
    ) -> ScoreBreakdown:
        """
        코디 조합에 대한 5대 가중치 세부 점수 및 총점을 종합 산출합니다.
        """
        body_score = self.calculate_body_coverage_score(outfit, profile)
        formality_score = self.calculate_formality_score(outfit, context)
        color_score = self.calculate_color_harmony_score(outfit, profile)
        comfort_score = self.calculate_comfort_weather_score(outfit, context)
        rotation_score = self.calculate_wear_rotation_score(outfit)

        total_score = round(
            body_score + formality_score + color_score + comfort_score + rotation_score, 1
        )
        total_score = min(100.0, max(0.0, total_score))

        return ScoreBreakdown(
            body_coverage=body_score,
            formality_match=formality_score,
            color_harmony=color_score,
            comfort_weather=comfort_score,
            wear_rotation=rotation_score,
            total_score=total_score
        )

    # ==============================================================
    # 헬퍼 함수군 (Helper Functions)
    # ==============================================================
    def _is_tone_on_tone(self, color1: str, color2: str) -> bool:
        """두 색상이 동일하거나 조화로운 톤온톤/톤인톤 그룹에 속하는지 판별"""
        c1 = color1.upper()
        c2 = color2.upper()

        if c1 == c2:
            return True

        for group in self.HARMONIOUS_COLOR_GROUPS:
            if c1 in group and c2 in group:
                return True

        return False

    def _matches_personal_color(self, color: str, personal_color: str) -> bool:
        """퍼스널 컬러 타입과 상의 컬러의 조화 여부 판단"""
        c = color.upper()
        pc = personal_color.upper()

        if "WARM" in pc or "AUTUMN" in pc or "SPRING" in pc:
            return c in self.WARM_COLORS
        elif "COOL" in pc or "SUMMER" in pc or "WINTER" in pc:
            return c in self.COOL_COLORS

        return False

