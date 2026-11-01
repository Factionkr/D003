import pytest
from pydantic import ValidationError
from app.schemas.tryon_schemas import (
    GarmentCategoryEnum,
    TryOnStatusEnum,
    GarmentItemSchema,
    TryOnOptionsSchema,
    TryOnRequestBody,
    TryOnRequestPayload,
    TryOnResponseBody,
    TryOnResponsePayload,
)

def test_garment_item_schema_valid():
    item = GarmentItemSchema(
        category=GarmentCategoryEnum.UPPER_BODY,
        garment_image_url="https://example.com/shirt.png",
        layer_order=1
    )
    assert item.category == GarmentCategoryEnum.UPPER_BODY
    assert item.garment_image_url == "https://example.com/shirt.png"
    assert item.layer_order == 1

def test_garment_item_schema_invalid_order():
    with pytest.raises(ValidationError):
        GarmentItemSchema(
            category=GarmentCategoryEnum.UPPER_BODY,
            garment_image_url="https://example.com/shirt.png",
            layer_order=0  # ge=1 violated
        )

def test_tryon_request_payload_parsing(sample_valid_payload):
    payload = TryOnRequestPayload.model_validate(sample_valid_payload)
    assert payload.tryon_request.user_id == "user_test_001"
    assert len(payload.tryon_request.garment_items) == 2
    assert payload.tryon_request.options.output_resolution == "1024x1536"

def test_tryon_response_payload_success():
    response = TryOnResponsePayload(
        tryon_response=TryOnResponseBody(
            status=TryOnStatusEnum.SUCCESS,
            result_image_url="https://example.com/result.png",
            processing_time_sec=2.45
        )
    )
    assert response.tryon_response.status == TryOnStatusEnum.SUCCESS
    assert response.tryon_response.result_image_url == "https://example.com/result.png"
    assert response.tryon_response.processing_time_sec == 2.45

