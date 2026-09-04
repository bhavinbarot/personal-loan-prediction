# 003 — Separate probability threshold from fixed campaign capacity

## Context

Two business questions look similar but are not: "which customers exceed a
probability cutoff?" and "if we can contact exactly 10% of customers, who are they?".
A rule such as `score >= threshold` can select more than K customers when scores
tie at the cutoff, and its selected count changes with the score distribution of
each new population.

## Decision

Keep both policies, implemented separately in `loan_modeling.metrics`:

- **Threshold classification** uses a single operating threshold (0.29) derived
  from out-of-fold development probabilities at the 10% mark. It drives
  `threshold_prediction` and the "higher / lower outreach priority" label.
- **Exact top-K selection** (`select_top_k_mask`) ranks by probability descending
  and selects exactly `ceil(N × K)` customers, breaking ties by stable input order.
  It drives campaign metrics and the `/campaign/rank` endpoint.

The application never derives one from the other, and the frontend never
re-implements either.

## Alternatives considered

- **Threshold only**: simple, but cannot guarantee a fixed contact volume.
- **Top-K only**: guarantees volume, but gives no answer for a single customer
  outside a population.
- **Random tie-breaking**: statistically neutral, but non-reproducible across runs.

## Why

Campaign planning needs an exact, reproducible contact count; individual customer
review needs a stable per-customer signal. Treating them as one policy produced the
off-by-ties bug this repository fixed in `fix: enforce exact campaign top-k selection`.

## Tradeoffs

Two policies must be explained side by side. The UI does this in the customer
result's technical details and in the simulator's benchmark panel.

## Status

Accepted.
