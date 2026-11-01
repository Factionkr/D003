import logging
import time
from typing import Dict, Any, List, Optional

from app.core.config import settings
from app.core.exceptions import (
    TryOnBaseException,
    InvalidPoseException,
    SegmentationException,
    PipelineInferenceException,
    IdentityDistortionException,
    UpscalingException,
)
from app.pipeline.preprocessor import TryOnPreprocessor
from app.pipeline.pose_analyzer import PoseAnalyzer
from app.pipeline.segmentor import GarmentSegmentor
from app.pipeline.warper import GarmentWarper
from app.pipeline.diffusion_blender import DiffusionBlender
from app.pipeline.postprocessor import TryOnPostprocessor

logger = logging.getLogger("tryon_pipeline")

class VirtualTryOnPipeline:
    """
    AI 코디앱 생성형 AI 가상 피팅 4단계 통합 파이프라인
    - Preprocessing & Masking
    - Stage 1: Pose Analysis (OpenPose / DensePose / MediaPipe)
    - Stage 2: Garment Segmentation (SCHP / SAM)
    - Stage 3: Garment Warping (TPS / Flow Network)
    - Stage 4: Diffusion Blending (IDM-VTON / CatVTON / ControlNet / SDXL)
    - Post-processing: ID-Loss preservation & Real-ESRGAN Upscaling
    - Layering Order 순차 피팅 지원 (상의 -> 아우터 순)
    """

    def __init__(self, device: Optional[str] = None):
        self.device = device or settings.DEVICE
        self.preprocessor = TryOnPreprocessor(device=self.device)
        self.pose_analyzer = PoseAnalyzer(model_name=settings.POSE_MODEL_NAME, device=self.device)
        self.segmentor = GarmentSegmentor(model_name=settings.SEGMENTATION_MODEL_NAME, device=self.device)
        self.warper = GarmentWarper(model_name=settings.WARPING_MODEL_NAME, device=self.device)
        self.blender = DiffusionBlender(model_name=settings.DIFFUSION_MODEL_NAME, device=self.device)
        self.postprocessor = TryOnPostprocessor(
            id_loss_threshold=settings.MAX_ID_LOSS_THRESHOLD,
            upscaler_model=settings.UPSCALER_MODEL_NAME,
            device=self.device,
        )
        logger.info(f"VirtualTryOnPipeline fully assembled on [{self.device}]")

    async def run(
        self,
        user_image_url: str,
        garment_items: List[Dict[str, Any]],
        options: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        가상 피팅 파이프라인 전체 프로세스를 순차 실행합니다.
        garment_items는 layer_order(1=이너/상의, 2=아우터) 순으로 사전 정렬되어 입력되어야 합니다.
        """
        start_time = time.time()
        logger.info(f"Starting Virtual Try-On Pipeline for user image: {user_image_url}")

        # -------------------------------------------------------------
        # 0. 입력 데이터 전처리 (Preprocessing)
        # -------------------------------------------------------------
        user_img_data = await self.preprocessor.preprocess_user_image(user_image_url)
        preprocessed_garments = []
        for g in garment_items:
            g_cutout = await self.preprocessor.extract_garment_cutout(
                garment_url=g["garment_image_url"],
                category=g["category"]
            )
            g_cutout["layer_order"] = g.get("layer_order", 1)
            preprocessed_garments.append(g_cutout)

        # -------------------------------------------------------------
        # Stage 1: 포즈 및 체형 분석 (Pose Analysis)
        # -------------------------------------------------------------
        pose_data = await self.pose_analyzer.extract_pose(user_img_data)
        
        # 포즈 예외 사전 검증 (포즈 기울기 및 손 가림)
        if pose_data.get("body_occluded_by_hands", False):
            raise InvalidPoseException(
                message="손으로 상체나 몸을 가린 포즈는 피팅 정밀도가 떨어질 수 있습니다.",
                guidance="양손을 몸 옆에 자연스럽게 내린 전신 사진을 업로드해 주세요."
            )

        tilt_angle = pose_data.get("body_tilt_angle", 0.0)
        if abs(tilt_angle) > settings.MAX_BODY_TILT_ANGLE:
            raise InvalidPoseException(
                message=f"사진의 기울기({abs(tilt_angle)}°)가 기준치({settings.MAX_BODY_TILT_ANGLE}°)보다 큽니다.",
                guidance="카메라를 정면으로 바라보고 수평을 맞춘 바른 자세의 전신 사진을 업로드해 주세요."
            )

        # -------------------------------------------------------------
        # Stage 2: 의상 세그멘테이션 및 신체 마스킹 (SCHP / SAM)
        # -------------------------------------------------------------
        target_categories = [g["category"] for g in preprocessed_garments]
        try:
            agnostic_mask_data = await self.segmentor.generate_agnostic_mask(
                user_image_data=user_img_data,
                target_categories=target_categories
            )
        except Exception as e:
            raise SegmentationException(reason=f"Failed to generate body agnostic mask: {str(e)}")

        # -------------------------------------------------------------
        # Stage 3: 의상 워핑 (TPS & Geometric Flow Network)
        # Layering Order 순차 적용 (상의 -> 아우터)
        # -------------------------------------------------------------
        warped_garments = []
        for g_data in preprocessed_garments:
            try:
                g_segment = await self.segmentor.segment_garment_item(g_data)
                warped_g = await self.warper.warp_garment(
                    garment_data=g_data,
                    garment_segment_data=g_segment,
                    pose_data=pose_data,
                    agnostic_mask_data=agnostic_mask_data
                )
                
                # 색상 및 조명 보정 (Color Matching)
                warped_g["warped_garment_url"] = await self.postprocessor.apply_color_matching(
                    warped_garment_url=warped_g["warped_garment_url"],
                    user_image_data=user_img_data
                )
                warped_garments.append(warped_g)
            except Exception as e:
                raise PipelineInferenceException(stage="Garment Warping", reason=str(e))

        # -------------------------------------------------------------
        # Stage 4: Diffusion 기반 이미지 합성 (IDM-VTON / CatVTON)
        # -------------------------------------------------------------
        try:
            blended_result = await self.blender.blend_garments(
                user_image_data=user_img_data,
                agnostic_mask_data=agnostic_mask_data,
                pose_data=pose_data,
                warped_garments=warped_garments,
                options=options
            )
            raw_result_url = blended_result["raw_result_url"]
        except Exception as e:
            raise PipelineInferenceException(stage="Diffusion Blending", reason=str(e))

        # -------------------------------------------------------------
        # Post-Processing: 얼굴/피부 보존(ID-Loss) & Real-ESRGAN 업스케일링
        # -------------------------------------------------------------
        preserve_face = options.get("preserve_face", True)
        await self.postprocessor.verify_and_preserve_identity(
            original_user_image=user_img_data,
            generated_result_url=raw_result_url,
            preserve_face=preserve_face
        )

        target_res = options.get("output_resolution", settings.DEFAULT_OUTPUT_RESOLUTION)
        final_image_url = await self.postprocessor.upscale_with_real_esrgan(
            image_url=raw_result_url,
            target_resolution=target_res
        )

        elapsed_time = round(time.time() - start_time, 2)
        logger.info(f"Virtual Try-On Pipeline completed successfully in {elapsed_time}s")

        return {
            "result_image_url": final_image_url,
            "processing_time_sec": elapsed_time,
            "resolution": target_res,
            "warped_layers_count": len(warped_garments),
        }

