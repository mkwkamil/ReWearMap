from collections.abc import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings


settings = get_settings()

engine = create_async_engine(
    settings.database_url,
    pool_size=5,
    max_overflow=5,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


async def init_db() -> None:
    from app import models  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.execute(
            text("ALTER TABLE thrift_stores ADD COLUMN IF NOT EXISTS notes TEXT NOT NULL DEFAULT ''")
        )
        await conn.execute(
            text(
                "ALTER TABLE thrift_stores ADD COLUMN IF NOT EXISTS delivery_enabled BOOLEAN NOT NULL DEFAULT true"
            )
        )
        await conn.execute(
            text(
                "ALTER TABLE thrift_stores ADD COLUMN IF NOT EXISTS delivery_verified BOOLEAN NOT NULL DEFAULT false"
            )
        )
        await conn.execute(
            text("ALTER TABLE thrift_stores ADD COLUMN IF NOT EXISTS opening_hours VARCHAR(200) NOT NULL DEFAULT ''")
        )
        await conn.execute(
            text("ALTER TABLE thrift_stores ADD COLUMN IF NOT EXISTS facebook_url TEXT NOT NULL DEFAULT ''")
        )
        await conn.execute(
            text("ALTER TABLE thrift_stores ADD COLUMN IF NOT EXISTS instagram_url TEXT NOT NULL DEFAULT ''")
        )
        await conn.execute(
            text("ALTER TABLE thrift_stores ADD COLUMN IF NOT EXISTS opening_time VARCHAR(5) NOT NULL DEFAULT ''")
        )
        await conn.execute(
            text("ALTER TABLE thrift_stores ADD COLUMN IF NOT EXISTS delivery_time VARCHAR(5) NOT NULL DEFAULT '08:00'")
        )
