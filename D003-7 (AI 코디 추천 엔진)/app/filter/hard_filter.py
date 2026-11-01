from typing import List, Tuple, Dict, Any
import logging
from app.models.context import TargetContext
from app.models.wardrobe import WardrobeItem

logger = logging.getLogger(__name__)


class HardFilterModule:
    """
    절대적 배제 규칙 처리 모듈 (Hard Constraints Filtering Module)
    
    코디 조합 생성 이전에 기온/계절감 이탈, 격식도(TPO) 미달, 우천/강수 환경 부적합,
    4060 세대표준 부적합 핏에 해당하는 아이템을 사전 단계에서 100% 완전 배제합니다.
    """

    # Rule 1: 고온/저온 관련 배제 집합
    EXCLUDED_SUMMER_MATERIALS = {"CASHMERE", "HEAVY_WOOL", "DOWN_PADDING", "FLEECE"}
    EXCLUDED_SUMMER_SUBCATS = {"PADDING", "DOWN_PADDING", "HEAVY_COAT", "WINTER_GLOVES"}

    EXCLUDED_WINTER_MATERIALS = {"LINEN", "SEERSUCKER", "THIN_MESH"}
    EXCLUDED_WINTER_SUBCATS = {"SHORT_PANTS", "CROP_TOP", "SLEEVELESS", "SANDALS"}

    # Rule 2: 격식도(TPO) 관련 배제 집합
    EXCLUDED_HIGH_FORMALITY_SUBCATS = {
        "SHORT_PANTS", "RIPPED_JEANS", "CAP", "TRACKSUIT", "SWEATPANTS", "HOODIE", "SLIPPERS"
    }
    EXCLUDED_VERY_HIGH_FORMALITY_SUBCATS = {
        "GRAPHIC_TEE", "JEANS", "RUNNING_SHOES"
    }

    # Rule 3: 강수 환경 배제 집합
    EXCLUDED_RAIN_SHOE_MATERIALS = {"SUEDE", "FABRIC_CANVAS"}

    # Rule 4: 4060 타겟 전면 배제 핏
    EXCLUDED_TARGET_FITS = {"BODYCON", "EXCESSIVE_CROP_TOP"}

    @classmethod
    def is_item_valid(cls, item: WardrobeItem, context: TargetContext) -> Tuple[bool, str]:
        """
        단일 아이템이 모든 절대적 배제 규칙을 통과하는지 검증합니다.
        
        Returns:
            (is_valid, rejection_reason): 통과 여부 및 기각 사유
        """
        mat = item.material.upper() if item.material else ""
        subcat = item.subcategory.upper() if item.subcategory else ""
        fit = item.fit.upper() if item.fit else ""
        seasons = [s.upper() for s in item.seasonality] if item.seasonality else []
        cat = item.category.upper() if item.category else ""
        weather = context.weather_condition.upper() if context.weather_condition else ""

        # ==============================================================
        # 4. 4060 타겟 과도한 핏 전면 배제 (Target-Specific Fit Exclusion)
        # ==============================================================
        if fit in cls.EXCLUDED_TARGET_FITS:
            return False, f"Target exclusion: Fit '{item.fit}' is excluded for 4060 mature style & comfort standards."

        # ==============================================================
        # 1. 기온 및 계절감 이탈 필터링 (Temperature & Seasonality Mismatch)
        # ==============================================================
        # 고온 제약 (>= 25.0°C, 한여름/무더위)
        if context.temperature_celsius >= 25.0:
            if mat in cls.EXCLUDED_SUMMER_MATERIALS:
                return False, f"High temperature exclusion: Heavy material '{item.material}' invalid for {context.temperature_celsius}°C"
            if subcat in cls.EXCLUDED_SUMMER_SUBCATS:
                return False, f"High temperature exclusion: Heavy subcategory '{item.subcategory}' invalid for {context.temperature_celsius}°C"
            if "WINTER" in seasons and "SUMMER" not in seasons:
                return False, f"Seasonality mismatch: Winter-only item invalid for summer temperature ({context.temperature_celsius}°C)"

        # 저온 제약 (<= 5.0°C, 한겨울/혹한)
        if context.temperature_celsius <= 5.0:
            if mat in cls.EXCLUDED_WINTER_MATERIALS:
                return False, f"Low temperature exclusion: Summer material '{item.material}' invalid for {context.temperature_celsius}°C"
            if subcat in cls.EXCLUDED_WINTER_SUBCATS:
                return False, f"Low temperature exclusion: Open/short subcategory '{item.subcategory}' invalid for {context.temperature_celsius}°C"
            if "SUMMER" in seasons and "WINTER" not in seasons:
                return False, f"Seasonality mismatch: Summer-only item invalid for winter temperature ({context.temperature_celsius}°C)"

        # ==============================================================
        # 2. 격식도 미달 필터링 (TPO Formality Level Mismatch)
        # ==============================================================
        # 높은 격식도 (formality_level >= 4: 동창회, 경조사, 공식 행사 등)
        if context.formality_level >= 4:
            if subcat in cls.EXCLUDED_HIGH_FORMALITY_SUBCATS:
                return False, f"Formality exclusion: Casual subcategory '{item.subcategory}' inappropriate for formality level {context.formality_level}"
            if fit in {"CROP", "BODYCON", "EXCESSIVE_CROP_TOP"}:
                return False, f"Formality exclusion: Fit '{item.fit}' inappropriate for high formality level {context.formality_level}"

        # 최고 격식도 (formality_level == 5: 셋업/정장 필수 공식 자리)
        if context.formality_level == 5:
            if subcat in cls.EXCLUDED_VERY_HIGH_FORMALITY_SUBCATS:
                return False, f"Strict formality exclusion: '{item.subcategory}' is strictly prohibited for formality level 5"

        # ==============================================================
        # 3. 우천/강수 환경 필터링 (Weather & Environment Constraint)
        # ==============================================================
        if weather in ["RAIN", "SNOW"]:
            if cat == "SHOES" and mat in cls.EXCLUDED_RAIN_SHOE_MATERIALS:
                return False, f"Weather exclusion: Suede/Canvas shoes invalid during {weather} conditions"
            if mat == "SILK_100" and cat in ["OUTER", "SHOES"]:
                return False, f"Weather exclusion: Delicate SILK_100 outer/shoes easily water-damaged during {weather}"

        return True, "PASSED"

    @classmethod
    def filter_wardrobe(
        cls, wardrobe: List[WardrobeItem], context: TargetContext
    ) -> Tuple[List[WardrobeItem], List[Dict[str, Any]]]:
        """
        전체 옷장 목록을 검증하여 배제 기준을 통과한 유효 아이템과 배제 내역을 반환합니다.
        
        Returns:
            (valid_items, exclusion_logs)
        """
        valid_items: List[WardrobeItem] = []
        exclusion_logs: List[Dict[str, Any]] = []

        for item in wardrobe:
            is_valid, reason = cls.is_item_valid(item, context)
            if is_valid:
                valid_items.append(item)
            else:
                log_entry = {
                    "item_id": item.item_id,
                    "name": item.name,
                    "category": item.category,
                    "subcategory": item.subcategory,
                    "reason": reason
                }
                exclusion_logs.append(log_entry)
                logger.info(
                    f"[HARD_FILTER_EXCLUDED] Item: {item.item_id} ({item.name}) - Reason: {reason}"
                )

        return valid_items, exclusion_logs

