import pytest
from app.pipeline.preprocessor import TryOnPreprocessor
from app.pipeline.pose_analyzer import PoseAnalyzer
from app.pipeline.segmentor import GarmentSegmentor
from app.pipeline.warper import GarmentWarper
from app.pipeline.diffusion_blender import DiffusionBlender
from app.pipeline.postprocessor import TryOnPostprocessor
from app.pipeline.pipeline_orchestrator import VirtualTryOnPipeline
from app.core.exceptions import InvalidPoseException, IdentityDistortionException

@pytest.mark.asyncio
async def test_preprocessor():
    preprocessor = TryOnPreprocessor(device="cpu")
    user_img = await preprocessor.preprocess_user_image("https://example.com/user.jpg")
    assert user_img["width"] == 1024
    assert user_img["height"] == 1536

    garment = await preprocessor.extract_garment_cutout("https://example.com/garment.png", "UPPER_BODY")
    assert garment["has_alpha_mask"] is True

@pytest.mark.asyncio
async def test_pose_analyzer():
    analyzer = PoseAnalyzer(device="cpu")
    user_data = {"image_url": "https://example.com/user.jpg"}
    pose = await analyzer.extract_pose(user_data)
    assert "keypoints" in pose
    assert "body_tilt_angle" in pose
    assert pose["body_occluded_by_hands"] is False

@pytest.mark.asyncio
async def test_segmentor():
    segmentor = GarmentSegmentor(device="cpu")
    mask_info = await segmentor.generate_agnostic_mask(
        user_image_data={"image_url": "https://example.com/user.jpg"},
        target_categories=["UPPER_BODY"]
    )
    assert "agnostic_image_url" in mask_info
    assert "preserved_regions" in mask_info

@pytest.mark.asyncio
async def test_warper():
    warper = GarmentWarper(device="cpu")
    warped = await warper.warp_garment(
        garment_data={"category": "UPPER_BODY"},
        garment_segment_data={"collar_keypoints": [(0.4, 0.1), (0.6, 0.1)]},
        pose_data={"keypoints": {"neck": [0.5, 0.2, 1.0]}},
        agnostic_mask_data={}
    )
    assert "warped_garment_url" in warped

@pytest.mark.asyncio
async def test_diffusion_blender():
    blender = DiffusionBlender(device="cpu")
    result = await blender.blend_garments(
        user_image_data={},
        agnostic_mask_data={},
        pose_data={},
        warped_garments=[{"warped_garment_url": "internal://warped.png"}],
        options={"output_resolution": "1024x1536"}
    )
    assert "raw_result_url" in result

@pytest.mark.asyncio
async def test_postprocessor_id_loss():
    postprocessor = TryOnPostprocessor(id_loss_threshold=0.35, device="cpu")
    score = await postprocessor.verify_and_preserve_identity(
        original_user_image={},
        generated_result_url="https://example.com/result.png",
        preserve_face=True
    )
    assert score <= 0.35

@pytest.mark.asyncio
async def test_postprocessor_id_loss_failure():
    # threshold를 극단적으로 낮춰 예외 유발 테스트
    postprocessor = TryOnPostprocessor(id_loss_threshold=0.05, device="cpu")
    with pytest.raises(IdentityDistortionException):
        await postprocessor.verify_and_preserve_identity(
            original_user_image={},
            generated_result_url="https://example.com/result.png",
            preserve_face=True
        )

@pytest.mark.asyncio
async def test_pipeline_orchestrator_full():
    pipeline = VirtualTryOnPipeline(device="cpu")
    result = await pipeline.run(
        user_image_url="https://example.com/user.jpg",
        garment_items=[
            {"category": "UPPER_BODY", "garment_image_url": "https://example.com/top.png", "layer_order": 1}
        ],
        options={"preserve_face": True, "output_resolution": "1024x1536"}
    )
    assert "result_image_url" in result
    assert result["processing_time_sec"] >= 0.0

