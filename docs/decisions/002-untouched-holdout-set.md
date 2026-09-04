# 002 — Preserve an untouched holdout set

## Context

The original course notebook reused its test set while pruning trees and comparing
models, so its reported metrics were optimistic and could not be presented as
portfolio results.

## Decision

Split the 5,000 records once, stratified by the target, into an 80% development set
and a 20% holdout set (`random_state=42`). All cross-validation, hyperparameter
search, model comparison, and threshold selection use the development set only. The
holdout set is scored exactly once, by the final refit model, to produce the tracked
reports in `reports/`. The served artifact is trained on the same development split.

## Alternatives considered

- **Nested cross-validation**: statistically cleaner, but heavier to explain and to
  reproduce for a 5,000-row problem.
- **A single train/validation/test split**: simpler, but the validation slice would
  be small and the CV estimates would be noisier.

## Why

A single untouched holdout gives one honest, easily explained number per metric and
matches how the model would be judged in production: on data it has never seen.

## Tradeoffs

The holdout has only 96 responders, so its metrics carry sampling noise; the
cross-validated estimates on the development set are reported alongside it. Because
the split is fixed, it must never be reused for further tuning; that constraint is
documented on the Technical Validation page.

## Status

Accepted.
