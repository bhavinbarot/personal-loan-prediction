from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


TARGET = "Personal_Loan"
DROP_COLUMNS = ["ID", "ZIPCode"]

NUMERIC_FEATURES = ["Age", "Experience", "Income", "CCAvg", "Mortgage"]
CATEGORICAL_FEATURES = ["Education", "Family"]
BINARY_FEATURES = ["Securities_Account", "CD_Account", "Online", "CreditCard"]


class NegativeExperienceImputer(BaseEstimator, TransformerMixin):
    """Replace negative Experience values using the median non-negative training value."""

    def fit(self, X, y=None):
        frame = pd.DataFrame(X).copy()
        exp = pd.to_numeric(frame["Experience"], errors="coerce")
        non_negative = exp[exp >= 0]
        if non_negative.empty:
            raise ValueError("Experience has no non-negative values to learn an imputation value.")
        self.experience_fill_value_ = float(non_negative.median())
        return self

    def transform(self, X):
        frame = pd.DataFrame(X).copy()
        negative_mask = frame["Experience"] < 0
        frame["Experience_was_negative"] = negative_mask.astype(int)
        frame.loc[negative_mask, "Experience"] = self.experience_fill_value_
        return frame


def split_features_target(data: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    X = data.drop(columns=[TARGET])
    y = data[TARGET].astype(int)
    return X, y


def make_preprocessor(scale_numeric: bool) -> Pipeline:
    numeric_steps = [("imputer", SimpleImputer(strategy="median"))]
    if scale_numeric:
        numeric_steps.append(("scaler", StandardScaler()))

    numeric_features = NUMERIC_FEATURES + ["Experience_was_negative"]

    column_transformer = ColumnTransformer(
        transformers=[
            ("numeric", Pipeline(numeric_steps), numeric_features),
            ("categorical", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
            ("binary", "passthrough", BINARY_FEATURES),
        ],
        remainder="drop",
        verbose_feature_names_out=False,
    )

    return Pipeline(
        steps=[
            ("experience", NegativeExperienceImputer()),
            ("columns", column_transformer),
        ]
    )


def model_input_columns() -> list[str]:
    return NUMERIC_FEATURES + CATEGORICAL_FEATURES + BINARY_FEATURES


def prepare_raw_features(X: pd.DataFrame) -> pd.DataFrame:
    return X.drop(columns=[col for col in DROP_COLUMNS if col in X.columns]).copy()

