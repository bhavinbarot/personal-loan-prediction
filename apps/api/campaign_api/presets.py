from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path


PRESETS_PATH = Path(__file__).resolve().parent / "data" / "sample_customers.json"


@lru_cache(maxsize=1)
def load_presets() -> dict:
    """Neutral sample customers chosen by scripts/select_presets.py.

    Only the identifier, display name, and input features are exposed; the selection
    record (target probability band) stays in the file so the UI cannot leak the
    expected outcome through a label.
    """
    payload = json.loads(PRESETS_PATH.read_text())
    return {
        "note": payload["note"],
        "presets": [
            {"id": preset["id"], "name": preset["name"], "features": preset["features"]}
            for preset in payload["presets"]
        ],
    }
