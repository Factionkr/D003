"""
AI 코디 애플리케이션 백엔드용 통합 AI 모듈
- 체형 분석 (Body Shape Analyzer)
- 가상 피팅 전처리 및 추론 파이프라인 (VTON Pipeline Manager)
- 체형별 스타일 추천 엔진 (Styling Recommendation Engine)
- FastAPI Gateway 어댑터 (FastAPI Adapter)
"""

import time
import uuid
from enum import Enum
from typing import Dict, Any, Optional, Tuple, List
from pydantic import BaseModel, Field

# ==========================================
# 1. 시스템 공통 열거형(Enum) 및 모델 정의
# ==========================================

class BodyType(str, Enum):
    HOURGLASS = "모래시계형"          # 어깨 ≈ 골반 & 허리가 가늘 때
    INVERTED_TRIANGLE = "역삼각형"      # 어깨 너비 > 골반 너비
    TRIANGLE = "삼각형(A라인)"         # 골반 너비 > 어깨 너비
    RECTANGLE = "직사각형"             # 어깨 ≈ 허리 ≈ 골반
    ROUND = "라운드형"                 # 허리/복부 비중이 클 때
    UNKNOWN = "미상"

class VTONModelType(str, Enum):
    IDM_VTON = "IDM-VTON"             # UNet + IP-Adapter Diffusion (품질/디테일 최상)
    CAT_VTON = "CatVTON"               # Attention Diffusion (경량화 & 빠른 추론)
    VITON_HD = "VITON-HD"             # TPS Warping + GAN (초경량)

class GarmentCategory(str, Enum):
    UPPER_BODY = "upper_body"         # 상의
    LOWER_BODY = "lower_body"         # 하의
    DRESSES = "dresses"               # 원피스/전신

# 체형 분석 요청/응답 Pydantic 스키마
class LandmarkInput(BaseModel):
    # 각 관절 좌표는 [x, y] 또는 [x, y, z/visibility] 형태 지원 (0.0 ~ 1.0 정규화 좌표)
    landmarks: Dict[str, Tuple[float, float]] = Field(
        ...,
        json_schema_extra={
            "example": {
                "nose": [0.5, 0.15],
                "left_shoulder": [0.38, 0.28],
                "right_shoulder": [0.62, 0.28],
                "left_waist": [0.42, 0.45],
                "right_waist": [0.58, 0.45],
                "left_hip": [0.40, 0.55],
                "right_hip": [0.60, 0.55],
                "left_ankle": [0.42, 0.90]
            }
        }
    )

class BodyAnalysisResponse(BaseModel):
    body_type: BodyType
    metrics: Dict[str, float]
    styling_tips: List[str]
    recommended_items: List[str]
    timestamp: float

# ==========================================
# 2. 체형 분석 모듈 (Body Shape Analyzer)
# ==========================================

class BodyShapeAnalyzer:
    """
    MediaPipe Pose / YOLOv8-Pose 랜드마크 좌표 기반 상대 비율(Ratio) 계산 및 체형 유형 분류 모듈
    """
    def __init__(self, tolerance: float = 0.08):
        """
        :param tolerance: 어깨와 골반 너비 동등 판정 허용 오차 범주 (기본값: 8%)
        """
        self.tolerance = tolerance

    def calculate_ratios(self, landmarks: Dict[str, Tuple[float, float]]) -> Dict[str, float]:
        """주요 관절 랜드마크(x, y) 기반 신체 상대 비율 계산"""
        # 어깨 너비 (Shoulder Width)
        ls = landmarks.get('left_shoulder')
        rs = landmarks.get('right_shoulder')
        shoulder_width = abs(rs[0] - ls[0]) if (ls and rs) else 0.0

        # 골반 너비 (Hip Width)
        lh = landmarks.get('left_hip')
        rh = landmarks.get('right_hip')
        hip_width = abs(rh[0] - lh[0]) if (lh and rh) else 0.0

        # 허리 너비 (Waist Width)
        lw = landmarks.get('left_waist')
        rw = landmarks.get('right_waist')
        if lw and rw:
            waist_width = abs(rw[0] - lw[0])
        else:
            # 좌표 미제공 시 어깨-골반 중간 가중 추정 (평균 0.8 계수)
            waist_width = ((shoulder_width + hip_width) / 2.0) * 0.8

        # 상체/하체 길이 (Torso & Leg Length)
        nose = landmarks.get('nose', (0.5, 0.0))
        ankle = landmarks.get('left_ankle', (0.5, 1.0))
        hip_y = (lh[1] + rh[1]) / 2.0 if (lh and rh) else 0.5

        upper_body_len = abs(hip_y - nose[1])
        lower_body_len = abs(ankle[1] - hip_y)

        # 주요 비율 산출 (0으로 나누기 방지 1e-6 추가)
        shoulder_hip_ratio = shoulder_width / (hip_width + 1e-6)
        waist_hip_ratio = waist_width / (hip_width + 1e-6)
        waist_shoulder_ratio = waist_width / (shoulder_width + 1e-6)
        torso_leg_ratio = upper_body_len / (lower_body_len + 1e-6)

        return {
            "shoulder_hip_ratio": round(shoulder_hip_ratio, 4),
            "waist_hip_ratio": round(waist_hip_ratio, 4),
            "waist_shoulder_ratio": round(waist_shoulder_ratio, 4),
            "torso_leg_ratio": round(torso_leg_ratio, 4),
            "shoulder_width": round(shoulder_width, 4),
            "hip_width": round(hip_width, 4),
            "waist_width": round(waist_width, 4)
        }

    def classify_body_type(self, ratios: Dict[str, float]) -> BodyType:
        """가이드북 알고리즘 기준 체형 분류"""
        s_h = ratios.get("shoulder_hip_ratio", 1.0)
        w_h = ratios.get("waist_hip_ratio", 0.8)
        w_s = ratios.get("waist_shoulder_ratio", 0.8)

        # 1. 역삼각형: 어깨 너비 > 골반 너비
        if s_h > (1.0 + self.tolerance):
            return BodyType.INVERTED_TRIANGLE
        # 2. 삼각형(A라인): 골반 너비 > 어깨 너비
        elif s_h < (1.0 - self.tolerance):
            return BodyType.TRIANGLE
        # 3. 어깨 ≈ 골반 균형 체형
        else:
            # 허리가 어깨/골반 대비 일정 비율 이상 가늘 때
            if w_h < 0.75 and w_s < 0.75:
                return BodyType.HOURGLASS
            # 허리/복부 비율이 높을 때
            elif w_h > 0.88 and w_s > 0.88:
                return BodyType.ROUND
            # 어깨 ≈ 허리 ≈ 골반
            else:
                return BodyType.RECTANGLE

    def get_style_recommendations(self, body_type: BodyType) -> Tuple[List[str], List[str]]:
        """체형별 추천 스타일 가이드 및 추천 아이템 반환"""
        recommendations = {
            BodyType.HOURGLASS: (
                ["허리 라인을 강조하는 벨티드 스타일링", "V넥 또는 랩 스타일 상의로 자연스러운 실루엣 연출"],
                ["랩 드레스", "하이웨이스트 와이드 팬츠", "슬림핏 크롭 니트"]
            ),
            BodyType.INVERTED_TRIANGLE: (
                ["하체로 시선을 분산시키는 볼륨감 있는 하의 착용", "어깨 장식이나 퍼프 소매는 피하고 V넥/U넥 활용"],
                ["A라인 플리츠 스커트", "카고 팬츠", "드롭숄더 오버핏 셔츠"]
            ),
            BodyType.TRIANGLE: (
                ["어깨/상체에 포인트를 주는 디테일(보트넥, 퍼프 등)", "하의는 심플하고 슬림하게 떨어지는 스트레이트 핏 추천"],
                ["보트넥 블라우스", "패디드 재킷", "스트레이트 슬랙스"]
            ),
            BodyType.RECTANGLE: (
                ["허리 라인에 포인트를 주어 곡선미 부여", "레이어드 스타일링으로 입체감 생성"],
                ["페플럼 탑", "벨티드 트렌치 코트", "테이퍼드 핏 데님"]
            ),
            BodyType.ROUND: (
                ["수직 라인을 강조하는 롱 카디건/자켓 오픈 스타일링", "목선이 드러나는 V넥 상의로 시원한 인상 연출"],
                ["오픈형 롱 아우터", "V넥 튜닉 블라우스", "세미 와이드 밴딩 슬랙스"]
            ),
            BodyType.UNKNOWN: (
                ["자연스러운 핏의 기본 베이직 룩 추천"],
                ["스탠다드 핏 셔츠", "스트레이트 데님"]
            )
        }
        return recommendations.get(body_type, (["체형 맞춤 룩"], ["기본 베이직 아이템"]))

    def analyze(self, landmarks: Dict[str, Tuple[float, float]]) -> Dict[str, Any]:
        """체형 분석 및 스타일 팁 통합 실행"""
        ratios = self.calculate_ratios(landmarks)
        body_type = self.classify_body_type(ratios)
        tips, items = self.get_style_recommendations(body_type)

        return {
            "body_type": body_type,
            "metrics": ratios,
            "styling_tips": tips,
            "recommended_items": items,
            "timestamp": time.time()
        }

# ==========================================
# 3. VTON 파이프라인 모듈 (VTON Pipeline Manager)
# ==========================================

class VTONPipelineManager:
    """
    BiRefNet/SAM 2 (Human Parsing) + DWPose (Pose Map) + Diffusion Model (IDM-VTON / CatVTON)
    전처리, 캐싱 및 가상 피팅 추론 매니저
    """
    def __init__(
        self,
        model_type: VTONModelType = VTONModelType.IDM_VTON,
        device: str = "cuda",
        use_fp16: bool = True
    ):
        self.model_type = model_type
        self.device = device
        self.use_fp16 = use_fp16
        # 동일 사용자 전처리 결과(Parsing Mask & Pose Map) 메모리/DB 캐시
        self.feature_cache: Dict[str, Dict[str, Any]] = {}

    def extract_and_cache_features(
        self,
        user_id: str,
        person_image_url: str,
        category: GarmentCategory
    ) -> Dict[str, Any]:
        """
        동일 사용자 전처리 캐싱 로직 (의류만 변경하여 피팅할 때 응답 속도 대폭 단축)
        """
        cache_key = f"{user_id}_{category.value}"
        if cache_key in self.feature_cache:
            # S3/메모리 캐시 적중 시 전처리 단계 재사용
            return self.feature_cache[cache_key]

        # 1. Human Parsing & Agnostic Mask 생성 (BiRefNet / SAM 2)
        # 2. Pose Estimation (DWPose)
        extracted_data = {
            "agnostic_mask_url": f"s3://vton-cache/masks/{cache_key}.png",
            "pose_map_url": f"s3://vton-cache/poses/{cache_key}.png",
            "created_at": time.time()
        }
        self.feature_cache[cache_key] = extracted_data
        return extracted_data

    def run_try_on(
        self,
        user_id: str,
        person_image_url: str,
        garment_image_url: str,
        category: GarmentCategory = GarmentCategory.UPPER_BODY
    ) -> Dict[str, Any]:
        """Agnostic Mask + Pose Map + Garment Image 기반 Try-On Diffusion 추론 실행"""
        start_time = time.time()

        # Step 1 & 2: 인체 분리 및 포즈 추정 전처리 (캐시 활용)
        features = self.extract_and_cache_features(user_id, person_image_url, category)

        # Step 3: Try-On Diffusion Model Inference
        # (PyTorch torch.float16 반정밀도 연산 적용 및 추론 시뮬레이션)
        mock_result_id = uuid.uuid4().hex[:8]
        return {
            "status": "success",
            "model_used": self.model_type.value,
            "user_id": user_id,
            "category": category.value,
            "result_image_url": f"https://cdn.aistylist.app/results/{user_id}_{mock_result_id}.png",
            "features_used": features,
            "elapsed_time_sec": round(time.time() - start_time, 3)
        }

# ==========================================
# 4. 백엔드 서비스 어댑터 (FastAPI Integration)
# ==========================================

def get_ai_stylist_router(
    vton_model: VTONModelType = VTONModelType.IDM_VTON,
    tolerance: float = 0.08
):
    """
    AI 코디 앱의 메인 FastAPI 서비스에 마운트할 비동기 라우터 어댑터 팩토리 함수
    """
    from fastapi import APIRouter, UploadFile, File, Form, Body, HTTPException, status

    router = APIRouter(prefix="/api/v1/stylist", tags=["AI Stylist"])
    body_analyzer = BodyShapeAnalyzer(tolerance=tolerance)
    vton_manager = VTONPipelineManager(model_type=vton_model)

    # 1. 체형 분석 API
    @router.post("/body-analysis", response_model=BodyAnalysisResponse, summary="포즈 랜드마크 기반 체형 분석 및 스타일 팁")
    async def analyze_body(request: LandmarkInput):
        try:
            result = body_analyzer.analyze(request.landmarks)
            return BodyAnalysisResponse(**result)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"체형 분석 중 오류가 발생했습니다: {str(e)}"
            )

    # 2. 가상 피팅(VTON) 비동기 작업 생성 API
    @router.post("/try-on", summary="가상 피팅(Try-On) 작업 요청 등록")
    async def create_vton_task(
        user_id: str = Form(...),
        category: GarmentCategory = Form(GarmentCategory.UPPER_BODY),
        person_img: UploadFile = File(...),
        garment_img: UploadFile = File(...)
    ):
        task_id = str(uuid.uuid4())
        # 실환경: person_img, garment_img를 S3/Storage에 업로드한 후 Celery/Redis 비동기 태스크에 전달
        return {
            "task_id": task_id,
            "user_id": user_id,
            "category": category.value,
            "person_filename": person_img.filename,
            "garment_filename": garment_img.filename,
            "status": "processing",
            "message": "VTON 피팅 요청이 비동기 태스크 큐에 정상 등록되었습니다."
        }

    # 3. 직접 추론 실행 (동기/테스트용)
    @router.post("/try-on/direct", summary="가상 피팅 직접 추론 (테스트/빠른 응답용)")
    async def run_direct_try_on(
        user_id: str = Body(...),
        person_image_url: str = Body(...),
        garment_image_url: str = Body(...),
        category: GarmentCategory = Body(GarmentCategory.UPPER_BODY)
    ):
        result = vton_manager.run_try_on(
            user_id=user_id,
            person_image_url=person_image_url,
            garment_image_url=garment_image_url,
            category=category
        )
        return result

    return router

# ==========================================
# 5. 모듈 단독 테스트 실행
# ==========================================

if __name__ == "__main__":
    print("=== AI 코디 애플리케이션 모듈 동작 테스트 ===\n")

    # [테스트 1] 체형 분석 모듈
    sample_keypoints = {
        'nose': (0.5, 0.15),
        'left_shoulder': (0.38, 0.28),
        'right_shoulder': (0.62, 0.28),
        'left_waist': (0.42, 0.45),
        'right_waist': (0.58, 0.45),
        'left_hip': (0.40, 0.55),
        'right_hip': (0.60, 0.55),
        'left_ankle': (0.42, 0.90),
    }

    body_analyzer = BodyShapeAnalyzer()
    res = body_analyzer.analyze(sample_keypoints)
    print(f"1. 체형 분석 결과: {res['body_type'].value}")
    print(f" - 산출된 상대 비율 지표: {res['metrics']}")
    print(f" - 추천 스타일 팁: {res['styling_tips']}")
    print(f" - 추천 의류 아이템: {res['recommended_items']}\n")

    # [테스트 2] VTON 파이프라인 (CatVTON 경량 모델 사용 예시)
    vton_pipeline = VTONPipelineManager(model_type=VTONModelType.CAT_VTON)

    # 1차 시도 (전처리 캐시 생성)
    fit_res1 = vton_pipeline.run_try_on("user_01", "person.jpg", "tshirt.jpg", GarmentCategory.UPPER_BODY)
    print(f"2. 1차 가상 피팅 결과: {fit_res1}")

    # 2차 시도 (동일 사용자, 다른 옷 피팅 -> 전처리 캐시 재활용)
    fit_res2 = vton_pipeline.run_try_on("user_01", "person.jpg", "jacket.jpg", GarmentCategory.UPPER_BODY)
    print(f"3. 2차 가상 피팅 결과 (캐시 적중): {fit_res2}")
