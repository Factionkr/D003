import time
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.exceptions import TryOnBaseException
from app.api.handlers import tryon_exception_handler
from app.api.router import router as tryon_router
from app.database.session import engine, Base
from app.schemas.tryon_schemas import HealthCheckResponse

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("tryon_main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    애플리케이션 시작 및 종료 시 생명주기 관리
    - DB 테이블 자동 생성 (개발/테스트 환경)
    """
    logger.info("Initializing Database Tables...")
    Base.metadata.create_all(bind=engine)
    logger.info(f"{settings.APP_NAME} v{settings.APP_VERSION} started successfully.")
    yield
    logger.info("Shutting down AI Virtual Try-On Service.")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="생성형 AI 기반 AI 코디앱 가상 피팅(Virtual Try-On) 모듈 API",
    lifespan=lifespan
)

# CORS 미들웨어 등록
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 요청 단위 소요 시간 추적 미들웨어
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    request.state.start_time = time.time()
    response = await call_next(request)
    elapsed = time.time() - request.state.start_time
    response.headers["X-Process-Time"] = f"{elapsed:.3f}s"
    return response

# 커스텀 예외 핸들러 등록
app.add_exception_handler(TryOnBaseException, tryon_exception_handler)

# 라우터 등록
app.include_router(tryon_router)

@app.get("/health", response_model=HealthCheckResponse, tags=["System Health"])
async def health_check():
    """
    서비스 상태 및 버전 확인을 위한 헬스체크 엔드포인트
    """
    return HealthCheckResponse(
        status="healthy",
        service=settings.APP_NAME,
        version=settings.APP_VERSION
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

