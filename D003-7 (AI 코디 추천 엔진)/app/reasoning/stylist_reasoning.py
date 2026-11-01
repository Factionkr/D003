from typing import List, Optional
from app.models.context import TargetContext
from app.models.profile import UserProfile
from app.models.wardrobe import OutfitCombination, WardrobeItem


class StylistReasoningGenerator:
    """
    4060 여성 맞춤형 한글 전문 스타일리스트 총평 생성기
    
    TPO(목적), 톤온톤 컬러 조화, 체형 결점(복부/팔뚝) 자연스러운 커버,
    고급 소재감 및 착용 편안함, 보완 추천 아이템에 대한 설명을 자연스러운 한국어 문장으로 생성합니다.
    """

    OCCASION_TEXT_MAP = {
        "ALUMNI_GATHERING": "오랜만에 만나는 동창회 및 친목 모임",
        "FAMILY_EVENT": "격식과 품위를 갖춰야 하는 경조사 및 가족 행사",
        "WORK": "단정하고 신뢰감을 주는 비즈니스 및 출근 자리",
        "TRAVEL": "활동성과 우아한 사진 연출을 모두 만족하는 여행/나들이",
        "CASUAL": "편안하면서도 정돈된 인상을 주는 일상 모임",
        "FORMAL_DINNER": "기품 있고 세련된 인상을 남기는 격식 있는 식사 자리"
    }

    @classmethod
    def generate_reasoning(
        cls,
        outfit: OutfitCombination,
        profile: UserProfile,
        context: TargetContext,
        is_fallback_applied: bool = False,
        supplement_items: Optional[List[WardrobeItem]] = None
    ) -> str:
        sentences: List[str] = []

        top = outfit.top
        bottom = outfit.bottom
        outer = outfit.outer
        accessory = outfit.accessory

        # 1. TPO 및 컬러 조화 문장
        occ_desc = cls.OCCASION_TEXT_MAP.get(context.occasion.upper(), "특별한 외출 일정")
        is_tone_on_tone = top.color.upper() == bottom.color.upper() or (
            top.color.upper() in {"IVORY", "BEIGE", "BROWN", "CAMEL", "CREAM"} and
            bottom.color.upper() in {"IVORY", "BEIGE", "BROWN", "CAMEL", "CREAM"}
        )

        if is_tone_on_tone:
            sentences.append(
                f"{occ_desc}에 최적화된 우아한 {top.color} & {bottom.color} 톤온톤(Tone-on-Tone) 조합입니다."
            )
        else:
            sentences.append(
                f"{occ_desc}에 잘 어울리는 세련되고 안정적인 {top.color}와 {bottom.color}의 컬러 매치입니다."
            )

        # 2. 체형 보정 및 실루엣 설명
        coverage_points = []
        if "ABDOMEN_COVER" in profile.body_focus_areas or "UPPER_ARM_COVER" in profile.body_focus_areas:
            if top.fit.upper() in {"LOOSE", "A_LINE", "H_LINE", "OVERSIZED"}:
                coverage_points.append("여유로운 실루엣의 상의")
            if outer and outer.fit.upper() in {"LOOSE", "A_LINE", "LONG"}:
                coverage_points.append("자연스럽게 떨어지는 롱 아우터")
            if bottom.fit.upper() in {"WIDE", "PALAZZO"} or "핀턱" in bottom.name or "SLACKS" in bottom.subcategory.upper():
                coverage_points.append("체형 라인을 정돈해 주는 핀턱 세미 와이드 슬랙스")

        if coverage_points:
            joined_points = "와 ".join(coverage_points)
            sentences.append(
                f"{joined_points}로 복부와 체형 라인을 부담 없이 커버하면서 시각적으로 한층 슬림하고 길어 보이는 실루엣을 완성했습니다."
            )
        else:
            sentences.append(
                "상하의 볼륨 밸런스가 조화로워 전체적인 체형 비율을 단정하게 정돈해 줍니다."
            )

        # 3. 소재, 착용감, 레이어드 디테일
        luxury_mats = []
        for it in [top, bottom, outer]:
            if it and it.material.upper() in {"CASHMERE", "SILK", "SILK_100", "WOOL", "LINEN"}:
                luxury_mats.append(it.material)

        comfort_phrases = []
        if luxury_mats:
            comfort_phrases.append("고급스러운 소재감으로 기품 있는 분위기를 연출하며")
        if bottom.is_elastic_waist or bottom.stretchable:
            comfort_phrases.append("허리 밴딩과 신축성 있는 원단으로 장시간 착용에도 편안합니다")
        if outer:
            comfort_phrases.append(f"기온 변화에 유연하게 대응할 수 있는 {outer.name}을(를) 매칭했습니다")

        if comfort_phrases:
            sentences.append(". ".join(comfort_phrases) + ".")

        # 4. 액세서리 포인트 연출
        if accessory and accessory.subcategory.upper() in {"SCARF", "SILK_SCARF"}:
            sentences.append(f"{accessory.name}로 목선에 화사한 포인트를 주어 세련미를 한 층 끌어올렸습니다.")

        # 5. Fallback 보완 추천 안내 (적용 시)
        if is_fallback_applied and supplement_items:
            supp_names = ", ".join(f"'{s.name}'" for s in supplement_items)
            sentences.append(
                f"💡 [스타일리스트 제안] 옷장에 {supp_names}을(를) 더하시면 코디 완성도와 고급스러움이 한층 완벽해집니다."
            )

        return " ".join(sentences)
