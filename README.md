# Personal Loan Campaign Targeting

This project predicts which existing bank customers are most likely to accept a personal loan offer. The portfolio version focuses on sound tabular ML methodology: clean validation, model comparison, campaign-oriented metrics, and interpretable business recommendations.

## Important Data Note

`Loan_Modelling.csv` is kept locally for analysis. Its redistribution rights have not been verified, so the dataset should not be assumed safe to publish publicly.

## Why This Version Exists

The original course notebook reported strong decision-tree results, but the test set was reused during pruning and model selection. This portfolio version treats the original notebook as historical course work and produces new measurements with a corrected evaluation protocol.

Historical results should not be presented as final portfolio performance.

## Corrected Methodology

```text
Raw data
   -> Drop ID and ZIPCode from the primary model
   -> Create one stratified 80/20 final holdout split
   -> Use only the 80% training data for preprocessing, model selection, tuning, and threshold selection
   -> Run 5-fold StratifiedKFold cross-validation inside sklearn pipelines
   -> Select the model by average precision / PR-AUC
   -> Select a campaign top-k threshold from out-of-fold training probabilities
   -> Refit the selected pipeline on all training data
   -> Evaluate once on the untouched holdout test set
```

## Feature Treatment

- `ID`: dropped.
- `ZIPCode`: dropped from the primary model because numeric ZIP codes are not ordinal measurements.
- `Experience`: negative values are replaced inside the pipeline using the median non-negative value learned from training data only; an `Experience_was_negative` indicator is added.
- `Education` and `Family`: treated as categorical features.
- Binary account/channel variables: passed through as `0/1`.
- Numeric variables: imputed and scaled only for models that need scaling.

## Models Compared

- `DummyClassifier`
- `LogisticRegression`
- `DecisionTreeClassifier`
- `RandomForestClassifier`
- `GradientBoostingClassifier`

The primary model-selection metric is average precision because the business problem is imbalanced and ranking likely responders is more useful than maximizing raw accuracy.

## Run

Use this from the project root with `src` on `PYTHONPATH`:

```bash
PYTHONPATH=src python3 -m loan_modeling.evaluate
```

Generated outputs are written under `reports/`.
