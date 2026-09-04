# Architecture decision records

Short records of the decisions that shape this project. Each file answers: what
constraint forced a choice, what was chosen, what else was realistic, why, and what
was traded away. Records are numbered in the order the decisions were made.

| # | Decision | Status |
| --- | --- | --- |
| [001](001-average-precision-model-selection.md) | Use Average Precision for model selection | Accepted |
| [002](002-untouched-holdout-set.md) | Preserve an untouched holdout set | Accepted |
| [003](003-threshold-vs-fixed-capacity.md) | Separate probability threshold from fixed campaign capacity | Accepted |
| [004](004-synthetic-public-data.md) | Keep the public dataset synthetic | Accepted |
| [005](005-fastapi-inference-boundary.md) | Use FastAPI as the inference boundary | Accepted |
| [006](006-nextjs-public-frontend.md) | Replace Streamlit as the public production UI | Accepted |
| [007](007-stateless-inference.md) | Keep inference stateless | Accepted |
| [008](008-lightweight-observability.md) | Use lightweight application observability | Accepted |
| [009](009-container-packaging.md) | Package each service as its own container with the artifact baked in | Accepted |
