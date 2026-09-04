import numpy as np
import pandas as pd
import pytest

from loan_modeling.preprocessing import (
    BINARY_FEATURES,
    CATEGORICAL_FEATURES,
    NUMERIC_FEATURES,
    NegativeExperienceImputer,
    make_preprocessor,
    model_input_columns,
    prepare_raw_features,
    split_features_target,
)


def synthetic_frame():
    return pd.DataFrame(
        {
            "ID": [101, 102, 103, 104],
            "Age": [25, 45, 35, 50],
            "Experience": [-1, 20, 10, 30],
            "Income": [50, 120, 85, 140],
            "ZIPCode": [91107, 90089, 94112, 91330],
            "Family": [1, 2, 3, 4],
            "CCAvg": [1.2, 3.5, 2.0, 4.1],
            "Education": [1, 2, 3, 2],
            "Mortgage": [0, 100, 0, 250],
            "Personal_Loan": [0, 1, 0, 1],
            "Securities_Account": [0, 1, 0, 1],
            "CD_Account": [0, 1, 0, 1],
            "Online": [1, 1, 0, 0],
            "CreditCard": [0, 1, 1, 0],
        }
    )


def test_split_and_prepare_features_exclude_target_id_and_zipcode():
    X, y = split_features_target(synthetic_frame())
    prepared = prepare_raw_features(X)

    assert y.tolist() == [0, 1, 0, 1]
    assert "Personal_Loan" not in X.columns
    assert "ID" not in prepared.columns
    assert "ZIPCode" not in prepared.columns
    assert set(prepared.columns) == set(model_input_columns())


def test_negative_experience_imputer_learns_from_training_data_only():
    train = synthetic_frame().drop(columns=["ID", "ZIPCode", "Personal_Loan"])
    imputer = NegativeExperienceImputer().fit(train)

    transformed = imputer.transform(train)

    assert imputer.experience_fill_value_ == 20.0
    assert transformed.loc[0, "Experience"] == 20.0
    assert transformed["Experience_was_negative"].tolist() == [1, 0, 0, 0]
    assert (transformed["Experience"] < 0).sum() == 0


def test_negative_experience_imputer_reuses_training_fill_value_at_inference():
    train = synthetic_frame().drop(columns=["ID", "ZIPCode", "Personal_Loan"])
    inference = train.iloc[[0, 1]].copy()
    inference.loc[:, "Experience"] = [-3, -2]

    imputer = NegativeExperienceImputer().fit(train)
    transformed = imputer.transform(inference)

    assert transformed["Experience"].tolist() == [20.0, 20.0]
    assert transformed["Experience_was_negative"].tolist() == [1, 1]


def test_negative_experience_imputer_requires_non_negative_training_values():
    frame = synthetic_frame().drop(columns=["ID", "ZIPCode", "Personal_Loan"])
    frame.loc[:, "Experience"] = [-1, -2, -3, -4]

    with pytest.raises(ValueError, match="no non-negative values"):
        NegativeExperienceImputer().fit(frame)


def test_preprocessor_fit_transform_has_expected_shape_and_no_leakage_columns():
    X, _ = split_features_target(synthetic_frame())
    prepared = prepare_raw_features(X)
    preprocessor = make_preprocessor(scale_numeric=False)

    transformed = preprocessor.fit_transform(prepared)
    feature_names = preprocessor.named_steps["columns"].get_feature_names_out()

    assert transformed.shape[0] == len(prepared)
    assert "Experience_was_negative" in feature_names
    assert "Personal_Loan" not in feature_names
    assert "ID" not in feature_names
    assert "ZIPCode" not in feature_names
    assert set(BINARY_FEATURES).issubset(set(feature_names))
    assert all(col in prepared.columns for col in NUMERIC_FEATURES + CATEGORICAL_FEATURES + BINARY_FEATURES)


def test_scaled_preprocessor_accepts_inference_shaped_data_consistently():
    X, _ = split_features_target(synthetic_frame())
    prepared = prepare_raw_features(X)
    preprocessor = make_preprocessor(scale_numeric=True)

    train_transformed = preprocessor.fit_transform(prepared)
    inference_transformed = preprocessor.transform(prepared.iloc[[0, 1]])

    assert train_transformed.shape[1] == inference_transformed.shape[1]
    assert np.isfinite(inference_transformed).all()

