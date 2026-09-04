from __future__ import annotations

import os
import subprocess
from functools import lru_cache

from campaign_api.config import PROJECT_ROOT


APPLICATION_NAME = "campaign-api"
SCHEMA_VERSION = "1"


@lru_cache(maxsize=1)
def git_commit() -> str | None:
    """Short commit identifier for the running code.

    Deployments should set APP_GIT_COMMIT at build time; local development falls back
    to asking git. Neither path exposes anything beyond the commit hash.
    """
    configured = os.environ.get("APP_GIT_COMMIT", "").strip()
    if configured:
        return configured[:40]
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "--short=12", "HEAD"],
            cwd=PROJECT_ROOT,
            text=True,
            stderr=subprocess.DEVNULL,
            timeout=2,
        ).strip()
    except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
        return None


def build_timestamp() -> str | None:
    value = os.environ.get("APP_BUILD_TIMESTAMP", "").strip()
    return value or None
