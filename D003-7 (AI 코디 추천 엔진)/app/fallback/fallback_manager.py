from typing import List, Optional, Tuple
from app.models.context import TargetContext
from app.models.profile import UserProfile
from app.models.wardrobe import WardrobeItem, OutfitCombination
from app.scorer.scoring_engine import OutfitScoringEngine


class FallbackManager:
    """
    Fallback 매니저 (완성도 70점 미만 시 발동)
    
    사용자 옷장 내 아이템 조합 점수가 70점 미만이거나 필수 카테고리가 결측된 경우:
    1. is_fallback_applied = True 로 설정
    2. 80% 사용자 옷장 아이템 + 20% 보완/구매 추천 아이템(1개 보완) 구조로 코디를 재구성
    3. 4060 세대에 최적화된 프리미엄 보완 아이템(실크 스카프, 캐시미어 가디건, 핀턱 밴딩 슬랙스 등)을 매칭하여 완성도를 80~90점대로 승격
    """

    # 4060 타겟 맞춤형 프리미엄 보완 아이템 카탈로그 (20% Supplement Pool)
    SUPPLEMENT_CATALOG: List[WardrobeItem] = [
        WardrobeItem(
            item_id="supp_acc_001",
            name="아르데코 프리미엄 실크 패턴 스카프",
            category="ACCESSORY",
            subcategory="SCARF",
            fit="FREE",
            color="BEIGE",
            material="SILK",
            pattern="FLORAL",
            seasonality=["SPRING", "AUTUMN", "WINTER"],
            formality_rating=4,
            is_elastic_waist=False,
            stretchable=False,
            is_supplement=True,
            purchase_url="https://mall.example.com/item/supp_acc_001"
        ),
        WardrobeItem(
            item_id="supp_outer_002",
            name="캐시미어 100% 모카베이지 롱 가디건",
            category="OUTER",
            subcategory="CARDIGAN",
            fit="LOOSE",
            color="BEIGE",
            material="CASHMERE",
            pattern="SOLID",
            seasonality=["SPRING", "AUTUMN", "WINTER"],
            formality_rating=4,
            is_elastic_waist=False,
            stretchable=True,
            is_supplement=True,
            purchase_url="https://mall.example.com/item/supp_outer_002"
        ),
        WardrobeItem(
            item_id="supp_bottom_003",
            name="울 블렌드 핀턱 와이드 밴딩 슬랙스",
            category="BOTTOM",
            subcategory="SLACKS",
            fit="WIDE",
            color="BROWN",
            material="WOOL",
            pattern="SOLID",
            seasonality=["SPRING", "AUTUMN", "WINTER"],
            formality_rating=4,
            is_elastic_waist=True,
            stretchable=True,
            is_supplement=True,
            purchase_url="https://mall.example.com/item/supp_bottom_003"
        ),
        WardrobeItem(
            item_id="supp_top_004",
            name="실크 드레이프 루즈핏 블라우스",
            category="TOP",
            subcategory="BLOUSE",
            fit="LOOSE",
            color="IVORY",
            material="SILK",
            pattern="SOLID",
            seasonality=["SPRING", "AUTUMN", "WINTER"],
            formality_rating=4,
            is_elastic_waist=False,
            stretchable=True,
            is_supplement=True,
            purchase_url="https://mall.example.com/item/supp_top_004"
        ),
        WardrobeItem(
            item_id="supp_shoe_005",
            name="클래식 핸드메이드 소가죽 로퍼 (굽 3cm)",
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
            is_supplement=True,
            purchase_url="https://mall.example.com/item/supp_shoe_005"
        )
    ]

    def __init__(self, scorer: Optional[OutfitScoringEngine] = None):
        self.scorer = scorer or OutfitScoringEngine()

    def should_trigger_fallback(self, best_score: float) -> bool:
        """최고 코디 점수가 70점 미만인지 검사"""
        return best_score < 70.0

    def apply_fallback(
        self,
        base_outfit: OutfitCombination,
        profile: UserProfile,
        context: TargetContext,
        initial_score: float
    ) -> Tuple[OutfitCombination, List[WardrobeItem], str]:
        """
        기존 코디에 가장 알맞은 보완 아이템을 주입하여 80% 옷장 + 20% 보완 구조로 업그레이드합니다.
        
        Returns:
            (enhanced_outfit, supplement_items, fallback_reason)
        """
        fallback_reason = (
            f"보유 옷장 내 조합의 완성도 점수({initial_score:.1f}점)가 기준선(70.0점) 미만이므로, "
            "4060 품격과 체형 보정을 완성할 20% 보완 추천 아이템을 매칭했습니다."
        )

        candidates: List[Tuple[OutfitCombination, WardrobeItem, float]] = []

        # 보완 후보 탐색: 액세서리 추가, 아우터 추가/교체, 하의 교체, 상의 교체 등 시도
        for supp in self.SUPPLEMENT_CATALOG:
            # 1) 스카프/액세서리 추가
            if supp.category == "ACCESSORY":
                candidate = OutfitCombination(
                    top=base_outfit.top,
                    bottom=base_outfit.bottom,
                    outer=base_outfit.outer,
                    shoes=base_outfit.shoes,
                    accessory=supp
                )
                score_obj = self.scorer.evaluate_outfit(candidate, profile, context)
                candidates.append((candidate, supp, score_obj.total_score))

            # 2) 아우터(가디건) 추가 또는 교체
            elif supp.category == "OUTER":
                candidate = OutfitCombination(
                    top=base_outfit.top,
                    bottom=base_outfit.bottom,
                    outer=supp,
                    shoes=base_outfit.shoes,
                    accessory=base_outfit.accessory
                )
                score_obj = self.scorer.evaluate_outfit(candidate, profile, context)
                candidates.append((candidate, supp, score_obj.total_score))

            # 3) 하의(와이드 핀턱 밴딩) 보완
            elif supp.category == "BOTTOM":
                candidate = OutfitCombination(
                    top=base_outfit.top,
                    bottom=supp,
                    outer=base_outfit.outer,
                    shoes=base_outfit.shoes,
                    accessory=base_outfit.accessory
                )
                score_obj = self.scorer.evaluate_outfit(candidate, profile, context)
                candidates.append((candidate, supp, score_obj.total_score))

            # 4) 상의 보완
            elif supp.category == "TOP":
                candidate = OutfitCombination(
                    top=supp,
                    bottom=base_outfit.bottom,
                    outer=base_outfit.outer,
                    shoes=base_outfit.shoes,
                    accessory=base_outfit.accessory
                )
                score_obj = self.scorer.evaluate_outfit(candidate, profile, context)
                candidates.append((candidate, supp, score_obj.total_score))

            # 5) 신발 보완
            elif supp.category == "SHOES":
                candidate = OutfitCombination(
                    top=base_outfit.top,
                    bottom=base_outfit.bottom,
                    outer=base_outfit.outer,
                    shoes=supp,
                    accessory=base_outfit.accessory
                )
                score_obj = self.scorer.evaluate_outfit(candidate, profile, context)
                candidates.append((candidate, supp, score_obj.total_score))

        # 가장 점수가 높게 개선되는 보완안 선택
        candidates.sort(key=lambda x: x[2], reverse=True)

        if candidates:
            best_enhanced_outfit, chosen_supp, new_score = candidates[0]
            return best_enhanced_outfit, [chosen_supp], fallback_reason

        # fallback 기본 반환
        default_supp = self.SUPPLEMENT_CATALOG[0]
        fallback_outfit = OutfitCombination(
            top=base_outfit.top,
            bottom=base_outfit.bottom,
            outer=base_outfit.outer,
            shoes=base_outfit.shoes,
            accessory=default_supp
        )
        return fallback_outfit, [default_supp], fallback_reason

