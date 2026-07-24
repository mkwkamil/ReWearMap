import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Float, SmallInteger, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class ThriftStore(Base):
    __tablename__ = "thrift_stores"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    next_delivery: Mapped[date | None] = mapped_column(Date, nullable=True)
    delivery_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    delivery_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    delivery_frequency: Mapped[str] = mapped_column(String(20), default="none", nullable=False)
    hotness: Mapped[int] = mapped_column(SmallInteger, default=5, nullable=False)
    notes: Mapped[str] = mapped_column(Text, default="", nullable=False)
    opening_time: Mapped[str] = mapped_column(String(5), default="", nullable=False)
    delivery_time: Mapped[str] = mapped_column(String(5), default="08:00", nullable=False)
    facebook_url: Mapped[str] = mapped_column(Text, default="", nullable=False)
    instagram_url: Mapped[str] = mapped_column(Text, default="", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
