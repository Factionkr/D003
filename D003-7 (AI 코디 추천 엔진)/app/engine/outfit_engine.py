from typing import List, Optional, Dict, Any
import itertools
from app.models.context import TargetContext
from app.models.profile import UserProfile
from app.models.wardrobe import WardrobeItem, OutfitCombination
from app.models.response import (
    ItemSummary,
    OutfitItemCombination,
    ScoreBreakdown,
    RecommendedOutfit,
    MatchingResponse,
    OutfitMatchingRequestHeader,
    OutfitRecommendationResponse,
)
from app.filter.hard_filter import HardFilterModule
from app.scorer.scoring_engine import OutfitScoringEngine
from app.fallback.fallback_manager import FallbackManager
from app.reasoning.stylist_reasoning import StylistReasoningGenerator


class OutfitCombinationEngine:
    """
    4060 여성 디지털 옷장 코디 조합 메인 엔진
    
    1. Hard Filter: 절대적 배제 규칙에 의한 1차 필터링
    2. Combination Generator: 가능한 코디 조합 생성
    3. Scoring Engine: 5대 가중치(100점 만점) 평가
    4. Fallback Manager: 70점 미만 시 80% 옷장 + 20% 보완 추천 적용
    5. Stylist Reasoning: 4060 맞춤형 한글 총평 생성
    6. Output Formatter: 표준 규격 JSON 응답 생성
    """

    def __init__(
        self,
        scorer: Optional[OutfitScoringEngine] = None,
        fallback_manager: Optional[FallbackManager] = None
    ):
        self.scorer = scorer or OutfitScoringEngine()
        self.fallback_manager = fallback_manager or FallbackManager(self.scorer)

    def recommend_outfits(
        self,
        wardrobe: List[WardrobeItem],
        context: TargetContext,
        profile: UserProfile,
        top_k: int = 1
    ) -> OutfitRecommendationResponse:
        """
        사용자 옷장과 TPO 컨텍스트, 프로필을 기반으로 최적의 코디를 추천합니다.
        """
        # Step 1: 1차 절대적 배제 필터링 (Hard Constraints Filter)
        valid_items, exclusion_logs = HardFilterModule.filter_wardrobe(wardrobe, context)

        # 카테고리별 분류
        tops = [it for it in valid_items if it.category == "TOP"]
        bottoms = [it for it in valid_items if it.category == "BOTTOM"]
        outers = [it for it in valid_items if it.category == "OUTER"]
        shoes = [it for it in valid_items if it.category == "SHOES"]
        accessories = [it for it in valid_items if it.category == "ACCESSORY"]

        is_fallback_applied = False
        fallback_reason = None
        recommended_outfit_list: List[RecommendedOutfit] = []

        # 상의나 하의가 없는 경우 -> 옷장만으로는 조합 불가 -> 즉시 Fallback 가동
        if not tops or not bottoms:
            is_fallback_applied = True
            fallback_reason = "필수 의류(상의 또는 하의)가 필터링되었거나 옷장에 부족하여 보완 아이템을 추천합니다."
            
            # 기본 대용 상/하의 구성
            dummy_top = tops[0] if tops else self.fallback_manager.SUPPLEMENT_CATALOG[3]
            dummy_bottom = bottoms[0] if bottoms else self.fallback_manager.SUPPLEMENT_CATALOG[2]
            dummy_shoes = shoes[0] if shoes else self.fallback_manager.SUPPLEMENT_CATALOG[4]

            base_combo = OutfitCombination(
                top=dummy_top,
                bottom=dummy_bottom,
                shoes=dummy_shoes
            )
            enhanced_combo, supp_items, reason = self.fallback_manager.apply_fallback(
                base_combo, profile, context, initial_score=50.0
            )
            score_obj = self.scorer.evaluate_outfit(enhanced_combo, profile, context)
            reasoning = StylistReasoningGenerator.generate_reasoning(
                enhanced_combo, profile, context, is_fallback_applied=True, supplement_items=supp_items
            )

            rec_outfit = self._build_recommended_outfit(
                rank=1,
                outfit=enhanced_combo,
                score_obj=score_obj,
                reasoning=reasoning,
                supplement_items=supp_items
            )
            recommended_outfit_list.append(rec_outfit)

        else:
            # Step 2: 코디 조합 생성 (Combination Generation)
            candidate_combinations: List[OutfitCombination] = self._generate_combinations(
                tops=tops,
                bottoms=bottoms,
                outers=outers,
                shoes=shoes,
                accessories=accessories,
                context=context
            )

            # Step 3: 가중치 점수 평가 (Scoring)
            scored_candidates: List[tuple[OutfitCombination, ScoreBreakdown]] = []
            for combo in candidate_combinations:
                score_obj = self.scorer.evaluate_outfit(combo, profile, context)
                scored_candidates.append((combo, score_obj))

            # 점수 내림차순 정렬
            scored_candidates.sort(key=lambda x: x[1].total_score, reverse=True)

            best_combo, best_score_obj = scored_candidates[0]

            # Step 4: Fallback 검사 (< 70점 여부)
            if self.fallback_manager.should_trigger_fallback(best_score_obj.total_score):
                is_fallback_applied = True
                enhanced_combo, supp_items, fallback_reason = self.fallback_manager.apply_fallback(
                    best_combo, profile, context, initial_score=best_score_obj.total_score
                )
                new_score_obj = self.scorer.evaluate_outfit(enhanced_combo, profile, context)
                reasoning = StylistReasoningGenerator.generate_reasoning(
                    enhanced_combo, profile, context, is_fallback_applied=True, supplement_items=supp_items
                )
                rec_outfit = self._build_recommended_outfit(
                    rank=1,
                    outfit=enhanced_combo,
                    score_obj=new_score_obj,
                    reasoning=reasoning,
                    supplement_items=supp_items
                )
                recommended_outfit_list.append(rec_outfit)

            else:
                # 정상 추천 (Top-k)
                for rank_idx, (combo, score_obj) in enumerate(scored_candidates[:top_k], start=1):
                    reasoning = StylistReasoningGenerator.generate_reasoning(
                        combo, profile, context, is_fallback_applied=False
                    )
                    rec_outfit = self._build_recommended_outfit(
                        rank=rank_idx,
                        outfit=combo,
                        score_obj=score_obj,
                        reasoning=reasoning
                    )
                    recommended_outfit_list.append(rec_outfit)

        # Step 5: 표준 JSON 규격 응답 포맷 조립
        header = OutfitMatchingRequestHeader(
            user_id=profile.user_id,
            target_context=context,
            user_profile=profile
        )

        response_body = MatchingResponse(
            is_fallback_applied=is_fallback_applied,
            fallback_reason=fallback_reason,
            recommended_outfits=recommended_outfit_list
        )

        return OutfitRecommendationResponse(
            outfit_matching_request=header,
            matching_response=response_body
        )

    def _generate_combinations(
        self,
        tops: List[WardrobeItem],
        bottoms: List[WardrobeItem],
        outers: List[WardrobeItem],
        shoes: List[WardrobeItem],
        accessories: List[WardrobeItem],
        context: TargetContext
    ) -> List[OutfitCombination]:
        """
        후보 조합을 생성합니다. (상의, 하의, 신발 필수 / 아우터, 액세서리 조건부 포함)
        """
        outer_candidates: List[Optional[WardrobeItem]] = [None]
        if outers:
            outer_candidates.extend(outers)

        shoes_candidates: List[Optional[WardrobeItem]] = [None]
        if shoes:
            shoes_candidates = shoes  # 신발이 있으면 신발 필수화

        accessory_candidates: List[Optional[WardrobeItem]] = [None]
        if accessories:
            accessory_candidates.extend(accessories)

        # 기온 20도 미만 시 아우터 착용 조합을 우선순위로 두되 미착용도 생성
        combinations = []
        for top, bottom in itertools.product(tops, bottoms):
            for shoe in shoes_candidates:
                for outer in outer_candidates:
                    for acc in accessory_candidates:
                        combinations.append(
                            OutfitCombination(
                                top=top,
                                bottom=bottom,
                                outer=outer,
                                shoes=shoe,
                                accessory=acc
                            )
                        )

        return combinations

    def _build_recommended_outfit(
        self,
        rank: int,
        outfit: OutfitCombination,
        score_obj: ScoreBreakdown,
        reasoning: str,
        supplement_items: Optional[List[WardrobeItem]] = None
    ) -> RecommendedOutfit:
        """
        OutfitCombination 및 점수 객체로부터 RecommendedOutfit 스키마를 구성합니다.
        """
        def to_summary(item: Optional[WardrobeItem]) -> Optional[ItemSummary]:
            if not item:
                return None
            return ItemSummary(
                item_id=item.item_id,
                name=item.name,
                category=item.category,
                subcategory=item.subcategory,
                color=item.color,
                material=item.material,
                fit=item.fit,
                is_supplement=item.is_supplement,
                purchase_url=item.purchase_url
            )

        combo_model = OutfitItemCombination(
            outer=to_summary(outfit.outer),
            top=to_summary(outfit.top) if outfit.top else ItemSummary(item_id="", name=""),
            bottom=to_summary(outfit.bottom) if outfit.bottom else ItemSummary(item_id="", name=""),
            shoes=to_summary(outfit.shoes),
            accessory=to_summary(outfit.accessory)
        )

        supp_summaries = None
        if supplement_items:
            supp_summaries = [to_summary(s) for s in supplement_items if s]

        return RecommendedOutfit(
            rank=rank,
            total_score=score_obj.total_score or 0.0,
            score_breakdown=score_obj,
            outfit_combination=combo_model,
            stylist_reasoning=reasoning,
            supplement_items=supp_summaries
        )

