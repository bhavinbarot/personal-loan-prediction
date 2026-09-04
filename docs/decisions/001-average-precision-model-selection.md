# 001 — Use Average Precision for model selection

## Context

Only about 9.6% of customers in the dataset accepted the personal loan offer. With
that imbalance, accuracy rewards a model that predicts "no" for everyone (about 90%
accurate, zero business value), and ROC-AUC saturates near 1.0 for every reasonable
candidate, which makes it a weak tie-breaker. The business use is ranking customers
for limited outreach, so the quality of the top of the ranking matters most.

## Decision

Rank candidate models by mean cross-validated Average Precision (PR-AUC), computed
with 5-fold stratified cross-validation on the development split. The metric and the
procedure were fixed before results were inspected. `GridSearchCV` refits on
`average_precision`, and `loan_modeling.evaluate` sorts the comparison table by it.

## Alternatives considered

- **Accuracy**: simple, but dominated by the majority class.
- **ROC-AUC**: robust, but nearly saturated across candidates and less sensitive to
  precision at the top of the ranking.
- **F1 at a fixed threshold**: depends on a threshold chosen before the model, which
  couples two decisions that should stay separate (see ADR 003).

## Why

Average Precision summarizes precision across recall levels and is directly aligned
with "how good is the ranked list we hand to the campaign team". It is also the
metric under which Random Forest and Gradient Boosting were separable in CV.

## Tradeoffs

Accuracy, precision, recall, F1, and ROC-AUC are still computed and reported as
secondary metrics, but none of them influence selection. Stakeholders used to
accuracy need the imbalance explained; the Technical Validation page does that.

## Status

Accepted.
