# 004 — Keep the public dataset synthetic

## Context

The training data comes from a course case study, and redistribution rights have
not been confirmed. The public application must still demonstrate scoring and
campaign ranking on realistic inputs, and it is a portfolio piece that will be
deployed and inspected by strangers.

## Decision

- `Loan_Modelling.csv` and the original notebooks stay local and Git-ignored.
- The API never reads the dataset at runtime; it serves a deterministic synthetic
  population generated from a fixed seed within the model's expected input ranges
  (`campaign_api.demo_population`).
- Sample customer presets are synthetic profiles chosen by scoring a synthetic
  candidate pool with the real model, never rows from the dataset.
- Synthetic predictions are labelled as predictions; measured results shown in the
  UI come only from the tracked holdout reports.

## Alternatives considered

- **Publish an anonymized subset**: still a redistribution of the source data.
- **Fit a generative model to the data and sample from it**: more realistic, but
  harder to audit for leakage of real records and disproportionate for a demo.

## Why

Seeded generation is transparent, reproducible, cheap, and cannot leak a real row.

## Tradeoffs

The synthetic population's score distribution differs from the real one, so the
simulator cannot show observed outcomes and must say so. The demo therefore pairs
live synthetic predictions with the validated holdout benchmark rather than
pretending the two are the same thing.

## Status

Accepted.
