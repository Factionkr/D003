from typing import List, Optional
from pydantic import BaseModel, Field

class Settings(BaseModel):
    """
    AI Virtual Try-On Module Configuration Settings
    """
    APP_NAME: str = "AI Virtual Try-On Service"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Database
    DATABASE_URL: str = "sqlite:///./virtual_tryon.db"
    
    # Pipeline Settings
    DEFAULT_OUTPUT_RESOLUTION: str = "1024x1536"
    SUPPORTED_RESOLUTIONS: List[str] = ["768x1024", "1024x1536", "1536x2048"]
    
    # Edge Case & Quality Control Thresholds
    MAX_BODY_TILT_ANGLE: float = 25.0  # degrees
    MAX_ID_LOSS_THRESHOLD: float = 0.35  # Cosine distance limit for face identity
    MIN_FACE_CONFIDENCE: float = 0.60
    
    # Model Configurations
    POSE_MODEL_NAME: str = "openpose_densepose_v2"
    SEGMENTATION_MODEL_NAME: str = "schp_sam_vit_h"
    WARPING_MODEL_NAME: str = "tps_geometric_flow_v1"
    DIFFUSION_MODEL_NAME: str = "idm_vton_sdxl"
    UPSCALER_MODEL_NAME: str = "real_esrgan_x4plus"
    
    # Execution
    DEVICE: str = "cuda"  # "cuda" or "cpu"
    ENABLE_AI_SIMULATION_FALLBACK: bool = True  # Allows running pipeline in mock/dev mode when GPU/weights not mounted
    PIPELINE_TIMEOUT_SEC: float = 120.0

settings = Settings()

