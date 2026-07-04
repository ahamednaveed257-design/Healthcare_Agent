from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None


BASE_DIR = Path(__file__).resolve().parent.parent

if load_dotenv is not None:
    load_dotenv(BASE_DIR / ".env")


def _bool_env(name: str, default: bool = False) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    data_dir: Path = BASE_DIR / os.getenv("HEALTHCARE_DATA_DIR", "data")
    memory_dir: Path = BASE_DIR / os.getenv("HEALTHCARE_MEMORY_DIR", ".agent_memory")
    openai_api_key: str | None = os.getenv("OPENAI_API_KEY")
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    enable_real_alerts: bool = _bool_env("ENABLE_REAL_ALERTS", False)
    twilio_account_sid: str | None = os.getenv("TWILIO_ACCOUNT_SID")
    twilio_auth_token: str | None = os.getenv("TWILIO_AUTH_TOKEN")
    twilio_from_number: str | None = os.getenv("TWILIO_FROM_NUMBER")
    caregiver_phone_number: str | None = os.getenv("CAREGIVER_PHONE_NUMBER")
    caregiver_email: str | None = os.getenv("CAREGIVER_EMAIL")


settings = Settings()
