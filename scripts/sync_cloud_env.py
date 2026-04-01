#!/usr/bin/env python3
"""Sync backend/frontend/mobile API base configuration from .env_cloud.

Usage:
  python scripts/sync_cloud_env.py
"""

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ENV_CLOUD = ROOT / ".env_cloud"
FRONTEND_ENV_PROD = ROOT / "frontend" / ".env.production"
FRONTEND_ENV_CLOUD = ROOT / "frontend" / ".env.cloud"
FRONTEND_ENV_LOCAL = ROOT / "frontend" / ".env.local"
FRONTEND_ENV_DEV = ROOT / "frontend" / ".env.development"
MOBILE_ENV = ROOT / "mobile" / ".env"
MOBILE_ENV_CLOUD = ROOT / "mobile" / ".env.cloud"
MOBILE_ENV_LOCAL = ROOT / "mobile" / ".env.local"
BACKEND_ENV = ROOT / "backend" / ".env"
BACKEND_ENV_LOCAL = ROOT / "backend" / ".env.local"
BACKEND_ENV_CLOUD = ROOT / "backend" / ".env.cloud"


def parse_env(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip()
    return values


def main() -> int:
    if not ENV_CLOUD.exists():
        print("ERROR: .env_cloud not found at repo root")
        return 1

    cloud = parse_env(ENV_CLOUD)

    backend_base = cloud.get("BACKEND_BASE_URL", "").strip().rstrip("/")
    if not backend_base:
        print("ERROR: BACKEND_BASE_URL is missing in .env_cloud")
        print("Add for example: BACKEND_BASE_URL=http://98.70.223.78")
        return 1

    frontend_env_content = f"VITE_API_BASE_URL={backend_base}\n"
    FRONTEND_ENV_PROD.write_text(frontend_env_content, encoding="utf-8")
    FRONTEND_ENV_CLOUD.write_text(frontend_env_content, encoding="utf-8")
    FRONTEND_ENV_LOCAL.write_text(frontend_env_content, encoding="utf-8")
    FRONTEND_ENV_DEV.write_text(frontend_env_content, encoding="utf-8")

    mobile_api_base = f"{backend_base}/api"
    mobile_env_content = f"EXPO_PUBLIC_API_BASE_URL={mobile_api_base}\n"
    MOBILE_ENV.write_text(mobile_env_content, encoding="utf-8")
    MOBILE_ENV_CLOUD.write_text(mobile_env_content, encoding="utf-8")
    MOBILE_ENV_LOCAL.write_text(mobile_env_content, encoding="utf-8")

    # Keep backend env files aligned with .env_cloud values.
    BACKEND_ENV.write_text(ENV_CLOUD.read_text(encoding="utf-8"), encoding="utf-8")
    BACKEND_ENV_LOCAL.write_text(ENV_CLOUD.read_text(encoding="utf-8"), encoding="utf-8")
    BACKEND_ENV_CLOUD.write_text(ENV_CLOUD.read_text(encoding="utf-8"), encoding="utf-8")

    print("Synced configuration successfully:")
    print(f"- backend/.env <= .env_cloud")
    print(f"- backend/.env.local <= .env_cloud")
    print(f"- backend/.env.cloud <= .env_cloud")
    print(f"- frontend/.env.cloud => VITE_API_BASE_URL={backend_base}")
    print(f"- frontend/.env.production => VITE_API_BASE_URL={backend_base}")
    print(f"- frontend/.env.local => VITE_API_BASE_URL={backend_base}")
    print(f"- frontend/.env.development => VITE_API_BASE_URL={backend_base}")
    print(f"- mobile/.env.cloud => EXPO_PUBLIC_API_BASE_URL={mobile_api_base}")
    print(f"- mobile/.env => EXPO_PUBLIC_API_BASE_URL={mobile_api_base}")
    print(f"- mobile/.env.local => EXPO_PUBLIC_API_BASE_URL={mobile_api_base}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
