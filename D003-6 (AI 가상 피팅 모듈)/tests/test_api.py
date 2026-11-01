import pytest
from unittest.mock import AsyncMock, patch
from app.models.db_models import TryOnRequest, TryOnStatus
from app.schemas.tryon_schemas import TryOnStatusEnum
from app.core.exceptions import (
    InvalidPoseException,
    InvalidLayeringException,
    PipelineInferenceException,
)

def test_health_check(client):
    """헬스체크 엔드포인트 정상 동작 검증"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "Virtual Try-On" in data["service"]

def test_create_tryon_success(client, sample_valid_payload):
    """정상 가상 피팅 요청 성공 케이스 테스트 (HTTP 200 & SUCCESS)"""
    response = client.post("/api/v1/tryon", json=sample_valid_payload)
    assert response.status_code == 200
    data = response.json()["tryon_response"]
    assert data["status"] == "SUCCESS"
    assert data["result_image_url"] is not None
    assert data["processing_time_sec"] >= 0.0

@patch("app.pipeline.pose_analyzer.PoseAnalyzer.extract_pose")
def test_create_tryon_invalid_pose_exception(mock_pose, client, sample_valid_payload):
    """부적절한 포즈(손 가림) 감지 시 INVALID_INPUT (HTTP 400) 응답 반환 테스트"""
    mock_pose.return_value = {
        "keypoints": {},
        "body_tilt_angle": 5.0,
        "body_occluded_by_hands": True,  # 손으로 몸 가림
        "densepose_mesh_map": "",
        "skeleton_map_url": "",
    }

    response = client.post("/api/v1/tryon", json=sample_valid_payload)
    assert response.status_code == 400
    data = response.json()["tryon_response"]
    assert data["status"] == "INVALID_INPUT"
    assert "가이드" in data["error_message"]
    assert data["result_image_url"] is None

def test_create_tryon_duplicate_category_layering_error(client, sample_valid_payload):
    """동일 카테고리 중복 입력 시 레이어 검증 실패 (HTTP 400) 테스트"""
    sample_valid_payload["tryon_request"]["garment_items"] = [
        {"category": "UPPER_BODY", "garment_image_url": "https://example.com/shirt1.png", "layer_order": 1},
        {"category": "UPPER_BODY", "garment_image_url": "https://example.com/shirt2.png", "layer_order": 2},
    ]

    response = client.post("/api/v1/tryon", json=sample_valid_payload)
    assert response.status_code == 400
    data = response.json()["tryon_response"]
    assert data["status"] == "INVALID_INPUT"
    assert "중복" in data["error_message"]

def test_create_tryon_invalid_layering_order(client, sample_valid_payload):
    """상의가 아우터보다 늦게 착용되도록 잘못된 layer_order 설정 시 실패 (HTTP 400) 테스트"""
    sample_valid_payload["tryon_request"]["garment_items"] = [
        {"category": "OUTERWEAR", "garment_image_url": "https://example.com/coat.png", "layer_order": 1},
        {"category": "UPPER_BODY", "garment_image_url": "https://example.com/shirt.png", "layer_order": 2},
    ]

    response = client.post("/api/v1/tryon", json=sample_valid_payload)
    assert response.status_code == 400
    data = response.json()["tryon_response"]
    assert data["status"] == "INVALID_INPUT"
    assert "먼저 착용되어야 합니다" in data["error_message"]

@patch("app.pipeline.diffusion_blender.DiffusionBlender.blend_garments")
def test_create_tryon_pipeline_inference_error(mock_blend, client, sample_valid_payload):
    """Diffusion 추론 중 오류(OOM/CUDA 에러 등) 발생 시 FAILED (HTTP 500) 응답 반환 테스트"""
    mock_blend.side_effect = RuntimeError("CUDA Out of Memory (OOM)")

    response = client.post("/api/v1/tryon", json=sample_valid_payload)
    assert response.status_code == 500
    data = response.json()["tryon_response"]
    assert data["status"] == "FAILED"
    assert "Diffusion Blending" in data["error_message"]

def test_get_tryon_status_success(client, db_session):
    """GET /api/v1/tryon/{task_id} 작업 상태 조회 성공 테스트"""
    task = TryOnRequest(
        user_id="user_test_status",
        user_image_url="https://example.com/user.jpg",
        status=TryOnStatus.SUCCESS,
        result_image_url="https://example.com/result.png",
        processing_time_sec=3.12,
    )
    db_session.add(task)
    db_session.commit()

    response = client.get(f"/api/v1/tryon/{task.id}")
    assert response.status_code == 200
    data = response.json()["tryon_response"]
    assert data["status"] == "SUCCESS"
    assert data["result_image_url"] == "https://example.com/result.png"
    assert data["processing_time_sec"] == 3.12

def test_get_tryon_status_not_found(client):
    """존재하지 않는 task_id 조회 시 INVALID_INPUT 안내 반환 테스트"""
    response = client.get("/api/v1/tryon/999999")
    assert response.status_code == 200
    data = response.json()["tryon_response"]
    assert data["status"] == "INVALID_INPUT"
    assert "찾을 수 없습니다" in data["error_message"]

def test_get_user_tryon_history(client, db_session):
    """GET /api/v1/tryon/history/{user_id} 사용자 이력 조회 테스트"""
    user_id = "user_history_01"
    for i in range(3):
        task = TryOnRequest(
            user_id=user_id,
            user_image_url=f"https://example.com/user_{i}.jpg",
            status=TryOnStatus.SUCCESS,
            result_image_url=f"https://example.com/result_{i}.png",
            processing_time_sec=2.0 + i,
        )
        db_session.add(task)
    db_session.commit()

    response = client.get(f"/api/v1/tryon/history/{user_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == user_id
    assert data["total_count"] == 3
    assert len(data["history"]) == 3

