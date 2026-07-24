from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://rewear:rewear@db:5432/rewearmap"
    admin_username: str = "admin"
    admin_password: str = "change-me-admin"
    jwt_secret: str = "change-me-jwt-secret-please"
    jwt_expire_hours: int = 168
    cors_origins: str = "*"


@lru_cache
def get_settings() -> Settings:
    return Settings()
