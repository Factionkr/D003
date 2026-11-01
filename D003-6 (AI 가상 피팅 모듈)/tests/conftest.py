import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database.session import Base, get_db

# ----------------------------------------------------------------------
# In-Memory SQLite Database Fixture for Testing
# ----------------------------------------------------------------------
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="function")
def db_session() -> Generator:
    """테스트 함수마다 격리된 In-Memory DB 세션을 생성하고 종료 시 초기화합니다."""
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=test_engine)

@pytest.fixture(scope="function")
def client(db_session) -> Generator:
    """FastAPI TestClient에 테스트용 DB 의존성을 주입합니다."""
    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def sample_valid_payload():
    """정상 가상 피팅 요청 페이로드 (상의 + 아우터 레이어드)"""
    return {
        "tryon_request": {
            "user_id": "user_test_001",
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
                "preserve_face": True,
                "preserve_background": True,
                "output_resolution": "1024x1536"
            }
        }
    }

