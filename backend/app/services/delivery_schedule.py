from __future__ import annotations

import logging
from datetime import date, timedelta

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import ThriftStore

logger = logging.getLogger(__name__)

# Standard codes: 3d, 1w, 2w, 3w, 4w, none
_CODE_DAYS: dict[str, int | None] = {
    "3d": 3,
    "1w": 7,
    "2w": 14,
    "3w": 21,
    "4w": 28,
    "none": None,
}

_LEGACY_DAYS: dict[str, int] = {
    "co 3 dni": 3,
    "co tydzień": 7,
    "co tydzien": 7,
    "co 2 tygodnie": 14,
    "co 3 tygodnie": 21,
    "co 4 tygodnie": 28,
    "co miesiąc": 28,
    "co miesiac": 28,
}


def normalize_frequency_code(frequency: str) -> str:
    normalized = frequency.strip().lower()
    if normalized in _CODE_DAYS:
        return normalized
    legacy_days = _LEGACY_DAYS.get(normalized)
    if legacy_days is not None:
        for code, days in _CODE_DAYS.items():
            if days == legacy_days:
                return code
    if not normalized:
        return "none"
    return "none"


def parse_frequency_days(frequency: str) -> int | None:
    code = normalize_frequency_code(frequency)
    return _CODE_DAYS.get(code)


def is_monthly_frequency(frequency: str) -> bool:
    return False


def add_delivery_interval(value: date, frequency: str) -> date:
    days = parse_frequency_days(frequency)
    if days is None:
        return value
    return value + timedelta(days=days)


def advance_next_delivery(
    next_delivery: date | None,
    frequency: str,
    *,
    today: date | None = None,
) -> date | None:
    if next_delivery is None or normalize_frequency_code(frequency) == "none":
        return next_delivery

    reference = today or date.today()
    current = next_delivery
    guard = 0
    while current < reference and guard < 520:
        current = add_delivery_interval(current, frequency)
        guard += 1
    return current


def roll_forward_store(store: ThriftStore, *, today: date | None = None) -> bool:
    if not store.delivery_enabled or not store.delivery_verified:
        return False
    if store.next_delivery is None or normalize_frequency_code(store.delivery_frequency) == "none":
        return False
    advanced = advance_next_delivery(store.next_delivery, store.delivery_frequency, today=today)
    if advanced is None or advanced == store.next_delivery:
        return False
    logger.info(
        "Advanced delivery for '%s': %s -> %s (%s)",
        store.name,
        store.next_delivery,
        advanced,
        store.delivery_frequency,
    )
    store.next_delivery = advanced
    return True


async def roll_forward_all_stores(session: AsyncSession, *, today: date | None = None) -> int:
    result = await session.execute(select(ThriftStore))
    stores = list(result.scalars().all())
    updated = 0
    for store in stores:
        normalized = normalize_frequency_code(store.delivery_frequency)
        if store.delivery_frequency != normalized:
            store.delivery_frequency = normalized
            updated += 1
        if roll_forward_store(store, today=today):
            updated += 1
    if updated:
        await session.commit()
        logger.info("Updated %s thrift store delivery record(s)", updated)
    return updated
