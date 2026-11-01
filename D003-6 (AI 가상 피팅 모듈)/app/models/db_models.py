from datetime import datetime
from enum import Enum as PyEnum
from typing import List, Optional
from sqlalchemy import (
    String, DateTime, Boolean, Float, Integer, ForeignKey, Enum, Text
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.session import Base

# ----------------------------------------------------------------------
# Enums
# ----------------------------------------------------------------------
class GarmentCategory(str, PyEnum):
    """의상 카테고리"""
    UPPER_BODY = "UPPER_BODY"
    LOWER_BODY = "LOWER_BODY"
    OUTERWEAR = "OUTERWEAR"
    DRESS = "DRESS"

class TryOnStatus(str, PyEnum):
    """가상 피팅 처리 상태"""
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    INVALID_INPUT = "INVALID_INPUT"

# ----------------------------------------------------------------------
# DB Models
# ----------------------------------------------------------------------
class User(Base):
    """사용자 테이블"""
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    email: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    user_images: Mapped[List["UserImage"]] = relationship(
        "UserImage", back_populates="user", cascade="all, delete-orphan"
    )
    tryon_requests: Mapped[List["TryOnRequest"]] = relationship(
        "TryOnRequest", back_populates="user"
    )

class UserImage(Base):
    """사용자 전신 사진 테이블"""
    __tablename__ = "user_images"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(50), ForeignKey("users.id"), index=True)
    image_url: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="user_images")

class GarmentItem(Base):
    """의상 단품 이미지 및 카테고리 테이블"""
    __tablename__ = "garment_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    category: Mapped[GarmentCategory] = mapped_column(Enum(GarmentCategory), nullable=False, index=True)
    garment_image_url: Mapped[str] = mapped_column(Text, nullable=False)
    title: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class TryOnRequest(Base):
    """가상 피팅 태스크 및 결과 이력 테이블"""
    __tablename__ = "tryon_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(50), ForeignKey("users.id"), index=True)
    user_image_url: Mapped[str] = mapped_column(Text, nullable=False)
    
    # 옵션 설정
    preserve_face: Mapped[bool] = mapped_column(Boolean, default=True)
    preserve_background: Mapped[bool] = mapped_column(Boolean, default=True)
    output_resolution: Mapped[str] = mapped_column(String(20), default="1024x1536")

    # 결과 데이터
    status: Mapped[TryOnStatus] = mapped_column(
        Enum(TryOnStatus), default=TryOnStatus.PENDING, index=True
    )
    result_image_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    processing_time_sec: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    user: Mapped[Optional["User"]] = relationship("User", back_populates="tryon_requests")
    garments: Mapped[List["TryOnRequestGarment"]] = relationship(
        "TryOnRequestGarment", back_populates="tryon_request", cascade="all, delete-orphan"
    )

class TryOnRequestGarment(Base):
    """피팅 요청에 매핑된 의상 및 착용 레이어 순서(Layering Order) 테이블"""
    __tablename__ = "tryon_request_garments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tryon_request_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("tryon_requests.id"), index=True
    )
    garment_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("garment_items.id"), nullable=True
    )
    
    category: Mapped[GarmentCategory] = mapped_column(Enum(GarmentCategory), nullable=False)
    garment_image_url: Mapped[str] = mapped_column(Text, nullable=False)
    layer_order: Mapped[int] = mapped_column(Integer, default=1)  # 1: 이너/상의, 2: 아우터 등

    # Relationships
    tryon_request: Mapped["TryOnRequest"] = relationship("TryOnRequest", back_populates="garments")

