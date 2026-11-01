from typing import Generator
from fastapi import Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.pipeline.pipeline_orchestrator import VirtualTryOnPipeline

# 싱글톤 파이프라인 인스턴스 (실제 GPU 모델 로드 메모리 절약)
_pipeline_instance = None

def get_pipeline() -> VirtualTryOnPipeline:
    global _pipeline_instance
    if _pipeline_instance is None:
        _pipeline_instance = VirtualTryOnPipeline()
    return _pipeline_instance

