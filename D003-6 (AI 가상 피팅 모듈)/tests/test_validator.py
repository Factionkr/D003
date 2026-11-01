import pytest
from app.services.validator import TryOnInputValidator
from app.schemas.tryon_schemas import GarmentItemSchema, GarmentCategoryEnum
from app.core.exceptions import InvalidPoseException, InvalidLayeringException

def test_validate_user_pose_normal():
    normal_pose = {
        "body_occluded_by_hands": False,
        "body_tilt_angle": 5.2
    }
    # 예외가 발생하지 않아야 함
    TryOnInputValidator.validate_user_pose(normal_pose)

def test_validate_user_pose_occluded():
    occluded_pose = {
        "body_occluded_by_hands": True,
        "body_tilt_angle": 2.0
    }
    with pytest.raises(InvalidPoseException) as exc_info:
        TryOnInputValidator.validate_user_pose(occluded_pose)
    assert "가이드" in exc_info.value.details.get("guidance", "")
    assert exc_info.value.error_code == "INVALID_USER_POSE"

def test_validate_user_pose_tilted():
    tilted_pose = {
        "body_occluded_by_hands": False,
        "body_tilt_angle": 30.5
    }
    with pytest.raises(InvalidPoseException) as exc_info:
        TryOnInputValidator.validate_user_pose(tilted_pose)
    assert "기울기" in exc_info.value.message

def test_sort_and_validate_garments_empty():
    with pytest.raises(InvalidLayeringException):
        TryOnInputValidator.sort_and_validate_garments([])

def test_sort_and_validate_garments_duplicate_category():
    garments = [
        GarmentItemSchema(category=GarmentCategoryEnum.UPPER_BODY, garment_image_url="https://ex.com/1.png", layer_order=1),
        GarmentItemSchema(category=GarmentCategoryEnum.UPPER_BODY, garment_image_url="https://ex.com/2.png", layer_order=2),
    ]
    with pytest.raises(InvalidLayeringException) as exc_info:
        TryOnInputValidator.sort_and_validate_garments(garments)
    assert "중복" in exc_info.value.message

def test_sort_and_validate_garments_dress_conflict():
    garments = [
        GarmentItemSchema(category=GarmentCategoryEnum.DRESS, garment_image_url="https://ex.com/dress.png", layer_order=1),
        GarmentItemSchema(category=GarmentCategoryEnum.UPPER_BODY, garment_image_url="https://ex.com/top.png", layer_order=2),
    ]
    with pytest.raises(InvalidLayeringException) as exc_info:
        TryOnInputValidator.sort_and_validate_garments(garments)
    assert "원피스" in exc_info.value.message

def test_sort_and_validate_garments_wrong_layering_order():
    # 아우터가 상의보다 먼저 착용되는 순서 위반 케이스 (outer layer 1, upper layer 2)
    garments = [
        GarmentItemSchema(category=GarmentCategoryEnum.OUTERWEAR, garment_image_url="https://ex.com/coat.png", layer_order=1),
        GarmentItemSchema(category=GarmentCategoryEnum.UPPER_BODY, garment_image_url="https://ex.com/shirt.png", layer_order=2),
    ]
    with pytest.raises(InvalidLayeringException) as exc_info:
        TryOnInputValidator.sort_and_validate_garments(garments)
    assert "상의" in exc_info.value.message and "아우터" in exc_info.value.message

def test_sort_and_validate_garments_valid_multi_layer():
    garments = [
        GarmentItemSchema(category=GarmentCategoryEnum.OUTERWEAR, garment_image_url="https://ex.com/coat.png", layer_order=2),
        GarmentItemSchema(category=GarmentCategoryEnum.UPPER_BODY, garment_image_url="https://ex.com/shirt.png", layer_order=1),
    ]
    sorted_g = TryOnInputValidator.sort_and_validate_garments(garments)
    assert sorted_g[0].category == GarmentCategoryEnum.UPPER_BODY
    assert sorted_g[1].category == GarmentCategoryEnum.OUTERWEAR

