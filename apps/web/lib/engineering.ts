/**
 * Verified engineering facts shown on the Overview and Technical Validation pages.
 *
 * Test counts are maintained by hand and must match the suites in the repository:
 *   python3 -m pytest -q             (ML package + API tests, from the repo root)
 *   npm run test:run                 (frontend tests, from apps/web)
 * Update these numbers whenever tests are added or removed.
 */
export const engineeringFacts = {
  pythonTests: 66,
  mlPackageTests: 39,
  apiTests: 27,
  frontendTests: 16,
  cvFolds: 5,
  holdoutFraction: 0.2,
  ciConfigured: false,
} as const;

export const engineeringPractices = [
  {
    title: "Leakage-safe evaluation",
    detail: "Preprocessing lives inside sklearn pipelines and is fit only on training folds.",
  },
  {
    title: "Predefined selection metric",
    detail: "Models compete on mean cross-validated Average Precision, chosen before results were seen.",
  },
  {
    title: "Reproducible artifact",
    detail: "The served model is retrained from the tracked selection results and versioned metadata.",
  },
  {
    title: "Schema-validated inference",
    detail: "Requests are validated twice: by the API contract and by the model package itself.",
  },
  {
    title: "Exact top-K campaign logic",
    detail: "Fixed-capacity selection returns exactly K customers with deterministic tie-breaking.",
  },
  {
    title: "Separated layers",
    detail: "Next.js presents, FastAPI serves HTTP, and the loan_modeling package owns all ML logic.",
  },
] as const;
