"""Choose representative synthetic sample customers by scoring a candidate pool with the real model.

Usage (from the repository root, with a trained artifact in artifacts/model.joblib):

    PYTHONPATH=src:apps/api python3 apps/api/scripts/select_presets.py

The script generates a large seeded synthetic pool, scores every candidate with the
trained pipeline, prints the probability distribution, and writes one representative
profile per target band to campaign_api/data/sample_customers.json. Predictions are
never edited: the chosen profiles are real synthetic inputs whose model output happens
to fall in each band. If the model produces no candidates in a band, that band is
reported and skipped rather than fabricated.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd

from loan_modeling.predict import load_model, predict_batch

from campaign_api.config import DEFAULT_MODEL_PATH
from campaign_api.demo_population import generate_population


OUTPUT_PATH = Path(__file__).resolve().parents[1] / "campaign_api" / "data" / "sample_customers.json"

# Neutral names on purpose: the label must not reveal the model's output.
BANDS = [
    ("Sample Customer A", "lower", 0.02, 0.08),
    ("Sample Customer B", "moderate", 0.20, 0.40),
    ("Sample Customer C", "higher", 0.55, 0.75),
    ("Sample Customer D", "very high", 0.90, 1.00),
]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pool-size", type=int, default=6000)
    parser.add_argument("--seed", type=int, default=2026)
    parser.add_argument("--model-path", type=Path, default=DEFAULT_MODEL_PATH)
    parser.add_argument("--output", type=Path, default=OUTPUT_PATH)
    args = parser.parse_args()

    bundle = load_model(args.model_path)
    candidates = generate_population(args.pool_size, seed=args.seed)
    features = pd.DataFrame([c["features"] for c in candidates])
    scores = predict_batch(bundle, features, include_classification=False)["predicted_probability"].to_numpy()

    print(f"Scored {len(scores)} synthetic candidates with {bundle['metadata']['model_type']}.")
    print("Probability distribution:")
    edges = [0, 0.01, 0.05, 0.1, 0.2, 0.3, 0.5, 0.7, 0.9, 1.0001]
    counts, _ = np.histogram(scores, bins=edges)
    for lo, hi, n in zip(edges[:-1], edges[1:], counts):
        print(f"  [{lo:.2f}, {min(hi, 1):.2f}) {n:5d}  {n / len(scores):6.1%}")
    print(f"  exactly 0.0: {(scores == 0).sum()}   exactly 1.0: {(scores == 1).sum()}   distinct values: {len(np.unique(scores))}")

    presets = []
    for name, band, lo, hi in BANDS:
        in_band = np.where((scores >= lo) & (scores <= hi))[0]
        if len(in_band) == 0:
            print(f"! No candidates in band {band} [{lo}, {hi}] - skipped, not fabricated.")
            continue
        # Pick the candidate closest to the band midpoint for a stable, representative profile.
        midpoint = (lo + hi) / 2
        chosen = int(in_band[np.argmin(np.abs(scores[in_band] - midpoint))])
        presets.append(
            {
                "id": name.lower().replace(" ", "-"),
                "name": name,
                "features": candidates[chosen]["features"],
                "selection": {
                    "band": band,
                    "band_range": [lo, hi],
                    "model_probability_at_selection": round(float(scores[chosen]), 4),
                },
            }
        )
        print(f"  {name}: band={band} probability={scores[chosen]:.4f} (pool index {chosen})")

    payload = {
        "generated_with": {
            "model_type": bundle["metadata"]["model_type"],
            "artifact_version": bundle["metadata"]["artifact_version"],
            "trained_from_commit": bundle["metadata"].get("git_commit_sha"),
            "pool_size": args.pool_size,
            "pool_seed": args.seed,
        },
        "note": (
            "Synthetic profiles selected by scoring a seeded candidate pool with the trained model. "
            "Probabilities shown in the application are always recomputed live; the stored value is a "
            "record of the selection run only."
        ),
        "presets": presets,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, indent=2) + "\n")
    print(f"Wrote {len(presets)} presets to {args.output.relative_to(Path.cwd()) if args.output.is_relative_to(Path.cwd()) else args.output}")


if __name__ == "__main__":
    main()
