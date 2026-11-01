import logging
import math
from typing import Dict, Any, List, Optional

logger = logging.getLogger("pose_analyzer")

class PoseAnalyzer:
    """
    Stage 1. 포즈 및 체형 분석 (Pose Analysis)
    - OpenPose / DensePose / MediaPipe를 활용하여 전신 사진에서 관절 키포인트 및 신체 메시(Mesh) Map 생성
    - 손/몸 가려짐(Occlusion) 및 과도한 포즈 기울기(Tilt)를 사전 감지
    """

    def __init__(self, model_name: str = "openpose_densepose_v2", device: str = "cpu"):
        self.model_name = model_name
        self.device = device
        logger.info(f"PoseAnalyzer initialized with [{model_name}] on {device}")

    async def extract_pose(
        self,
        user_image_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        전신 이미지에서 2D/3D 관절 키포인트를 추출하고 기울기 및 신체 가림 여부를 분석합니다.
        """
        logger.info("Extracting keypoints and DensePose surface mesh...")

        # 표준 18개 OpenPose/COCO 관절 키포인트 좌표 시뮬레이션 및 분석 구조
        # (실제 환경에서는 OpenPose/DensePose 모델의 tensor 출력 좌표)
        # 키포인트: [x, y, confidence] (정규화된 0.0 ~ 1.0 범위)
        keypoint_map = {
            "nose": [0.50, 0.12, 0.95],
            "neck": [0.50, 0.18, 0.96],
            "right_shoulder": [0.42, 0.20, 0.92],
            "right_elbow": [0.38, 0.35, 0.90],
            "right_wrist": [0.36, 0.50, 0.88],
            "left_shoulder": [0.58, 0.20, 0.92],
            "left_elbow": [0.62, 0.35, 0.90],
            "left_wrist": [0.64, 0.50, 0.88],
            "right_hip": [0.44, 0.52, 0.91],
            "left_hip": [0.56, 0.52, 0.91],
            "right_knee": [0.44, 0.72, 0.89],
            "left_knee": [0.56, 0.72, 0.89],
            "right_ankle": [0.44, 0.92, 0.85],
            "left_ankle": [0.56, 0.92, 0.85],
        }

        # 1. 포즈 기울기 계산 (목과 골반 중심점을 잇는 벡터의 각도)
        tilt_angle = self._calculate_tilt_angle(keypoint_map)

        # 2. 손에 의한 상체 가림(Occlusion) 여부 계산
        is_occluded = self._detect_hand_body_occlusion(keypoint_map)

        return {
            "keypoints": keypoint_map,
            "body_tilt_angle": tilt_angle,
            "body_occluded_by_hands": is_occluded,
            "densepose_mesh_map": "internal://mesh/densepose_uv.dat",
            "skeleton_map_url": "internal://skeleton/openpose_map.png",
        }

    def _calculate_tilt_angle(self, keypoints: Dict[str, List[float]]) -> float:
        """
        목(Neck)과 골반 중심(Mid-Hip)을 잇는 척추 벡터를 기준으로 수직선 대비 기울기 각도를 계산합니다.
        """
        neck = keypoints.get("neck")
        r_hip = keypoints.get("right_hip")
        l_hip = keypoints.get("left_hip")

        if not neck or not r_hip or not l_hip:
            return 0.0

        mid_hip_x = (r_hip[0] + l_hip[0]) / 2.0
        mid_hip_y = (r_hip[1] + l_hip[1]) / 2.0

        dx = mid_hip_x - neck[0]
        dy = mid_hip_y - neck[1]

        if dy == 0:
            return 90.0

        # 수직선(dx=0)과의 각도 산출 (단위: 도 degree)
        angle_rad = math.atan2(dx, dy)
        angle_deg = math.degrees(angle_rad)
        return round(angle_deg, 2)

    def _detect_hand_body_occlusion(self, keypoints: Dict[str, List[float]]) -> bool:
        """
        손목(Wrist) 또는 손의 위치가 몸통(어깨~골반 사이의 사각형 영역) 내부를 가리고 있는지 확인합니다.
        """
        r_shoulder = keypoints.get("right_shoulder")
        l_shoulder = keypoints.get("left_shoulder")
        r_hip = keypoints.get("right_hip")
        l_hip = keypoints.get("left_hip")

        r_wrist = keypoints.get("right_wrist")
        l_wrist = keypoints.get("left_wrist")

        if not all([r_shoulder, l_shoulder, r_hip, l_hip]):
            return False

        # 몸통 Bounding Box 정의
        torso_x_min = min(r_shoulder[0], r_hip[0]) - 0.02
        torso_x_max = max(l_shoulder[0], l_hip[0]) + 0.02
        torso_y_min = min(r_shoulder[1], l_shoulder[1])
        torso_y_max = max(r_hip[1], l_hip[1])

        # 손목이 몸통 Bounding Box 내부에 위치하는지 판정
        for wrist in [r_wrist, l_wrist]:
            if wrist and (torso_x_min < wrist[0] < torso_x_max) and (torso_y_min < wrist[1] < torso_y_max):
                logger.warning("Hand occlusion detected over torso region.")
                return True

        return False

