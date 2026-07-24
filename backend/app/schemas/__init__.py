from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ThriftStoreCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    lat: float
    lng: float
    next_delivery: date | None = None
    delivery_enabled: bool = True
    delivery_verified: bool = False
    delivery_frequency: str = "none"
    hotness: int = Field(default=5, ge=1, le=10)
    notes: str = ""
    opening_time: str = ""
    delivery_time: str = "08:00"
    facebook_url: str = ""
    instagram_url: str = ""


class ThriftStoreUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    lat: float | None = None
    lng: float | None = None
    next_delivery: date | None = None
    delivery_enabled: bool | None = None
    delivery_verified: bool | None = None
    delivery_frequency: str | None = None
    hotness: int | None = Field(default=None, ge=1, le=10)
    notes: str | None = None
    opening_time: str | None = None
    delivery_time: str | None = None
    facebook_url: str | None = None
    instagram_url: str | None = None


class ThriftStoreOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    lat: float
    lng: float
    next_delivery: date | None
    delivery_enabled: bool
    delivery_verified: bool
    delivery_frequency: str
    hotness: int
    notes: str
    opening_time: str
    delivery_time: str
    facebook_url: str
    instagram_url: str
    created_at: datetime
    updated_at: datetime
