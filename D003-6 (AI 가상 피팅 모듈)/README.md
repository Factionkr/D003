# 👗 AI 코디앱 생성형 AI 가상 피팅 (Virtual Try-On) 모듈

AI 코디네이터(AI Codi) 앱의 핵심 기능인 **생성형 AI 기반 Virtual Try-On (가상 피팅) 모듈**입니다. 사용자의 전신 사진과 단품 의상 이미지를 입력받아 자연스러운 가상 착장 이미지를 생성하는 4단계 파이프라인 및 고성능 비동기 REST API 서비스를 제공합니다.

---

## 🌟 시스템 아키텍처 및 4단계 파이프라인 (Architecture & Pipeline)

```
[ 사용자 전신 사진 ]  +  [ 의상 단품 누끼 이미지 ]
        │                       │
        ▼                       ▼
 ┌────────────────────────────────────────────────────────┐
 │ 0. 입력 데이터 전처리 & 마스킹 (Preprocessing)          │
 │    - 배경 분리, 이미지 해상도/품질 정규화                │
 └──────────────────────────┬─────────────────────────────┘
                            │
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │ Stage 1. 포즈 및 체형 분석 (Pose Analysis)             │
 │    - OpenPose / DensePose / MediaPipe 관절 키포인트     │
 │    - 몸통 가림(Occlusion) 및 과도한 기울기(Tilt) 사전 감지│
 └──────────────────────────┬─────────────────────────────┘
                            │
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │ Stage 2. 의상 세그멘테이션 (Garment Segmentation)       │
 │    - SCHP & SAM 기반 신체 마스킹 (Agnostic Mask)        │
 │    - 머리카락, 손, 피부 경계면 정밀도 보존 마스크 추출   │
 └──────────────────────────┬─────────────────────────────┘
                            │
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │ Stage 3. 의상 워핑 (Garment Warping)                   │
 │    - Thin Plate Spline (TPS) & Geometric Flow Matching │
 │    - 신체 3D 곡면에 맞춘 의상 정렬 및 패턴 왜곡 최소화  │
 │    - 의상-환경 조명 색상 보정 (Color Matching)         │
 └──────────────────────────┬─────────────────────────────┘
                            │
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │ Stage 4. 이미지 생성 및 블렌딩 (Diffusion Blending)     │
 │    - IDM-VTON / CatVTON Inpainting Diffusion           │
 │    - ControlNet (Skeleton/DensePose UV) + SDXL          │
 │    - 자연스러운 옷주름, 음영, 직물 드레이프 생성         │
 └──────────────────────────┬─────────────────────────────┘
                            │
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │ Post-Processing & Quality Control (품질 제어 및 후처리)│
 │    - ID-Loss (ArcFace): 얼굴 및 피부 정체성 보존 검증    │
 │    - Real-ESRGAN: 고해상도 초해상화(1024x1536) 질감 복원│
 └──────────────────────────┬─────────────────────────────┘
                            │
                            ▼
                 [ 최종 가상 피팅 결과 이미지 ]
```

---

## 📂 프로젝트 디렉토리 구조 (Directory Structure)

```
c:\Project\D003\D003-6\
├── app/
│   ├── __init__.py
│   ├── main.py                     # FastAPI 엔트리포인트 및 미들웨어
│   ├── core/                       # 핵심 환경 설정 및 예외 계층
│   │   ├── __init__.py
│   │   ├── config.py               # 모델, 임계값, 해상도 환경 설정
│   │   └── exceptions.py           # TryOn 커스텀 예외 클래스
│   ├── database/                   # SQLAlchemy DB 세션 및 연결
│   │   ├── __init__.py
│   │   └── session.py
│   ├── models/                     # SQLAlchemy 2.0 ORM 모델
│   │   ├── __init__.py
│   │   └── db_models.py            # User, UserImage, TryOnRequest, etc.
│   ├── schemas/                    # Pydantic v2 API 스키마
│   │   ├── __init__.py
│   │   └── tryon_schemas.py        # 요청/응답 스키마
│   ├── services/                   # 비즈니스 로직 및 입력 검증
│   │   ├── __init__.py
│   │   ├── validator.py            # 포즈 및 레이어링 순서 검증기
│   │   └── tryon_service.py        # 피팅 서비스 트랜잭션 관리
│   ├── pipeline/                   # 4-Stage 가상 피팅 AI 엔진
│   │   ├── __init__.py
│   │   ├── preprocessor.py         # 전처리 & 누끼 분리
│   │   ├── pose_analyzer.py        # Stage 1: 포즈/체형 분석 (OpenPose/DensePose)
│   │   ├── segmentor.py            # Stage 2: 의상 세그멘테이션 (SCHP/SAM)
│   │   ├── warper.py               # Stage 3: TPS & Flow Network 워핑
│   │   ├── diffusion_blender.py    # Stage 4: Inpainting Diffusion 블렌딩
│   │   ├── postprocessor.py        # ID-Loss 보존 & Real-ESRGAN & Color Matching
│   │   └── pipeline_orchestrator.py# 파이프라인 통합 오케스트레이터
│   └── api/                        # REST API 라우터 및 핸들러
│       ├── __init__.py
│       ├── dependencies.py         # DB 세션 및 파이프라인 DI
│       ├── handlers.py             # 전역 예외 처리기 (JSON 스키마 자동 변환)
│       └── router.py               # POST /api/v1/tryon, GET /api/v1/tryon/{task_id}
├── tests/                          # pytest 단위 및 통합 테스트
│   ├── __init__.py
│   ├── conftest.py                 # SQLite In-Memory DB & TestClient Fixtures
│   ├── test_schemas.py             # 데이터 스키마 유효성 테스트
│   ├── test_validator.py           # 포즈 및 레이어 순서 검증 테스트
│   ├── test_pipeline.py            # 4단계 파이프라인 모듈 테스트
│   └── test_api.py                 # API 엔드포인트 및 에러 핸들링 테스트
├── pytest.ini                      # pytest 실행 설정
├── requirements.txt                # 의존성 패키지 목록
└── README.md                       # 기술 문서
```

---

## ⚡ 핵심 예외 대응 및 품질 제어 (Quality Control)

1. **부적절한 포즈 (Edge Case: Inappropriate Pose)**
   - 손으로 몸이나 상체를 가린 경우(`body_occluded_by_hands=True`) 또는 사진이 25° 이상 기울어진 경우(`body_tilt_angle > 25.0`), `InvalidPoseException`을 발생시켜 HTTP 400 (`INVALID_INPUT`) 상태와 함께 구체적인 **촬영 가이드라인**을 반환합니다.
2. **복잡한 레이어드 순서 (Layering Order)**
   - 상의(`UPPER_BODY`)와 아우터(`OUTERWEAR`)를 동시 피팅할 때 `layer_order`에 따라 **상의(1) -> 아우터(2)** 순서로 정렬하여 순차 워핑 및 피팅을 적용합니다. 순서가 위배되거나 동일 카테고리 중복 요청 시 사전에 차단합니다.
3. **색상 및 조명 보정 (Color Matching)**
   - 의상 단품 누끼와 사용자 환경 간의 색온도/밝기 차이를 줄이기 위해 Lab 색공간 기반 Reinhard Color Transfer를 적용합니다.
4. **얼굴 및 피부 정체성 보존 (ID-Loss)**
   - ArcFace 임베딩 코사인 거리를 측정하여 임계값(`0.35`) 초과 시 변형으로 판단하고, `preserve_face=True` 옵션에 따라 원래 얼굴과 손 피부를 고정밀 알파 블렌딩으로 보존합니다.
5. **고해상도 업스케일링 (Real-ESRGAN)**
   - 최종 결과에 Super-Resolution을 적용하여 최대 `1024x1536` 해상도로 복원하고, 섬세한 직물 질감과 스티치 디테일을 살려냅니다.

---

## 📡 REST API 규격 (API Endpoints)

### 1. 가상 피팅 요청 생성 및 실행
- **Endpoint**: `[POST] /api/v1/tryon`
- **Request Body**:
```json
{
  "tryon_request": {
    "user_id": "user_12345",
    "user_image_url": "https://static.aicodi.io/users/user_fullbody_01.jpg",
    "garment_items": [
      {
        "category": "UPPER_BODY",
        "garment_image_url": "https://static.aicodi.io/garments/white_tshirt.png",
        "layer_order": 1
      },
      {
        "category": "OUTERWEAR",
        "garment_image_url": "https://static.aicodi.io/garments/black_blazer.png",
        "layer_order": 2
      }
    ],
    "options": {
      "preserve_face": true,
      "preserve_background": true,
      "output_resolution": "1024x1536"
    }
  }
}
```

- **Response Body (성공 시 - HTTP 200)**:
```json
{
  "tryon_response": {
    "status": "SUCCESS",
    "result_image_url": "https://static.aicodi.io/results/final_tryon_1024x1536.png",
    "processing_time_sec": 3.42,
    "error_message": null
  }
}
```

- **Response Body (포즈/입력 예외 시 - HTTP 400)**:
```json
{
  "tryon_response": {
    "status": "INVALID_INPUT",
    "result_image_url": null,
    "processing_time_sec": 0.05,
    "error_message": "손으로 상체나 몸을 가린 포즈는 피팅 정밀도가 떨어질 수 있습니다. (가이드: 양손을 몸 옆에 자연스럽게 내린 전신 사진을 업로드해 주세요.)"
  }
}
```

### 2. 피팅 작업 상태 및 결과 조회
- **Endpoint**: `[GET] /api/v1/tryon/{task_id}`

### 3. 사용자별 피팅 이력 조회
- **Endpoint**: `[GET] /api/v1/tryon/history/{user_id}`

### 4. 헬스체크
- **Endpoint**: `[GET] /health`

---

## 🛠️ 실행 및 테스트 방법 (How to Run & Test)

### 1. 패키지 설치
```bash
pip install -r requirements.txt
```

### 2. 단위 및 통합 테스트 실행 (pytest)
```bash
pytest -v
```

### 3. 개발 서버 실행
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
실행 후 브라우저에서 `http://localhost:8000/docs` (Swagger UI)로 API 명세를 직접 테스트할 수 있습니다.

