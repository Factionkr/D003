import logging
from typing import List
from app.schemas.tryon_schemas import GarmentItemSchema, GarmentCategoryEnum
from app.core.exceptions import InvalidPoseException, InvalidLayeringException

logger = logging.getLogger("tryon_validator")

class TryOnInputValidator:
    """
    가상 피팅 요청 데이터 유효성 검증 및 전처리 예외 핸들러
    """

    @staticmethod
    def validate_user_pose(pose_data: dict) -> None:
        """
        포즈 키포인트를 분석하여 부적절한 포즈(손으로 몸 가림, 과도한 기울기) 감지 시 예외 발생
        """
        is_occluded = pose_data.get("body_occluded_by_hands", False)
        tilt_angle = pose_data.get("body_tilt_angle", 0.0)

        if is_occluded:
            logger.warning("Pose validation failed: hand occlusion detected.")
            raise InvalidPoseException(
                message="손으로 상체나 몸을 가린 포즈는 피팅 정밀도가 떨어질 수 있습니다.",
                guidance="양손을 몸 옆에 자연스럽게 내린 전신 사진을 업로드해 주세요."
            )

        if abs(tilt_angle) > 25.0:
            logger.warning(f"Pose validation failed: tilt angle {tilt_angle} exceeds limit.")
            raise InvalidPoseException(
                message=f"사진의 기울기({abs(tilt_angle)}°)가 너무 큽니다.",
                guidance="정면을 바라보고 바르게 선 정면 전신 사진을 업로드해 주세요."
            )

    @staticmethod
    def sort_and_validate_garments(garments: List[GarmentItemSchema]) -> List[GarmentItemSchema]:
        """
        의상 레이어 순서(Layering Order) 검증 및 정렬
        - 동일 카테고리 중복 입력 방지
        - 원피스(DRESS)와 상/하의 동시 착장 충돌 방지
        - 상의(UPPER_BODY) -> 아우터(OUTERWEAR) 순서 준수
        """
        if not garments:
            raise InvalidLayeringException("피팅할 의상 항목이 존재하지 않습니다.")

        # 1. 동일 카테고리 중복 피팅 검사
        categories = [g.category for g in garments]
        if len(categories) != len(set(categories)):
            raise InvalidLayeringException("동일한 의상 카테고리가 중복 요청되었습니다.")

        # 2. 원피스(DRESS)와 상/하의 충돌 검사
        if GarmentCategoryEnum.DRESS in categories:
            if GarmentCategoryEnum.UPPER_BODY in categories or GarmentCategoryEnum.LOWER_BODY in categories:
                raise InvalidLayeringException(
                    "원피스(DRESS)는 단독 또는 아우터(OUTERWEAR)와만 함께 피팅할 수 있습니다."
                )

        # 3. layer_order 기준 오름차순 정렬
        sorted_garments = sorted(garments, key=lambda g: g.layer_order)

        # 4. 상의와 아우터가 모두 있는 경우, 상의가 아우터보다 먼저(layer_order가 낮아야 함) 위치해야 함
        has_upper = False
        upper_order = -1
        outer_order = -1

        for g in sorted_garments:
            if g.category == GarmentCategoryEnum.UPPER_BODY:
                has_upper = True
                upper_order = g.layer_order
            elif g.category == GarmentCategoryEnum.OUTERWEAR:
                outer_order = g.layer_order

        if has_upper and outer_order != -1:
            if upper_order >= outer_order:
                raise InvalidLayeringException(
                    f"상의(layer_order={upper_order})는 아우터(layer_order={outer_order})보다 먼저 착용되어야 합니다."
                )

        return sorted_garments

