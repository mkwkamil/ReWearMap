from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_admin
from app.db import get_db
from app.models import ThriftStore
from app.schemas import ThriftStoreCreate, ThriftStoreOut, ThriftStoreUpdate
from app.services.delivery_schedule import advance_next_delivery, normalize_frequency_code, roll_forward_store

router = APIRouter(prefix="/thrift-stores", tags=["thrift-stores"])


@router.get("", response_model=list[ThriftStoreOut])
async def list_stores(db: AsyncSession = Depends(get_db)) -> list[ThriftStore]:
    # Public read — map/list for visitors. Mutations require admin JWT.
    result = await db.execute(select(ThriftStore).order_by(ThriftStore.name.asc()))
    stores = list(result.scalars().all())
    changed = any(roll_forward_store(store) for store in stores)
    if changed:
        await db.commit()
    return stores


def _finalize_delivery_fields(data: dict) -> dict:
    data["delivery_frequency"] = normalize_frequency_code(data.get("delivery_frequency", "none"))
    if not data.get("delivery_enabled", True):
        data["next_delivery"] = None
    elif (
        data.get("delivery_verified")
        and data.get("next_delivery")
        and data["delivery_frequency"] != "none"
    ):
        data["next_delivery"] = advance_next_delivery(data["next_delivery"], data["delivery_frequency"])
    return data


@router.post("", response_model=ThriftStoreOut, status_code=status.HTTP_201_CREATED)
async def create_store(
    payload: ThriftStoreCreate,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(require_admin),
) -> ThriftStore:
    data = _finalize_delivery_fields(payload.model_dump())
    store = ThriftStore(**data)
    db.add(store)
    await db.commit()
    await db.refresh(store)
    return store


@router.get("/{store_id}", response_model=ThriftStoreOut)
async def get_store(store_id: UUID, db: AsyncSession = Depends(get_db)) -> ThriftStore:
    store = await db.get(ThriftStore, store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    if roll_forward_store(store):
        await db.commit()
        await db.refresh(store)
    return store


@router.patch("/{store_id}", response_model=ThriftStoreOut)
async def update_store(
    store_id: UUID,
    payload: ThriftStoreUpdate,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(require_admin),
) -> ThriftStore:
    store = await db.get(ThriftStore, store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(store, key, value)

    if "delivery_frequency" in data:
        store.delivery_frequency = normalize_frequency_code(store.delivery_frequency)

    merged = {
        "delivery_enabled": store.delivery_enabled,
        "delivery_verified": store.delivery_verified,
        "next_delivery": store.next_delivery,
        "delivery_frequency": store.delivery_frequency,
    }
    finalized = _finalize_delivery_fields(merged)
    store.delivery_enabled = finalized["delivery_enabled"]
    store.delivery_verified = finalized["delivery_verified"]
    store.next_delivery = finalized["next_delivery"]
    store.delivery_frequency = finalized["delivery_frequency"]

    await db.commit()
    await db.refresh(store)
    return store


@router.delete("/{store_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_store(
    store_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(require_admin),
) -> None:
    store = await db.get(ThriftStore, store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    await db.delete(store)
    await db.commit()
