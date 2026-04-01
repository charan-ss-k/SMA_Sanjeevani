"""Shared environment loader for backend runtime and scripts."""

from __future__ import annotations

from pathlib import Path
from typing import Iterable

from dotenv import load_dotenv


BACKEND_ROOT = Path(__file__).resolve().parents[2]
REPO_ROOT = BACKEND_ROOT.parent


def get_backend_env_candidates() -> list[Path]:
    """Return backend environment files in load order.

    Local-specific settings are loaded first, then cloud, then the legacy
    backend .env, then the repo-root .env_cloud fallback.
    """
    return [
        BACKEND_ROOT / ".env.local",
        BACKEND_ROOT / ".env.cloud",
        BACKEND_ROOT / ".env",
        REPO_ROOT / ".env_cloud",
    ]


def load_backend_env(override: bool = False) -> list[Path]:
    """Load all available backend env files and return the loaded paths."""
    loaded: list[Path] = []
    for env_path in get_backend_env_candidates():
        if env_path.exists():
            load_dotenv(env_path, override=True)
            loaded.append(env_path)
    return loaded
