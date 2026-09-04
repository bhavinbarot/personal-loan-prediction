import numpy as np
import pytest

from loan_modeling.metrics import (
    campaign_metrics,
    classification_metrics,
    confusion_matrix_frame,
    threshold_for_top_k,
)


def test_classification_metrics_use_project_threshold_logic():
    y_true = np.array([0, 0, 1, 1])
    y_score = np.array([0.10, 0.40, 0.70, 0.90])

    metrics = classification_metrics(y_true, y_score, threshold=0.50)

    assert metrics["accuracy"] == pytest.approx(1.0)
    assert metrics["precision"] == pytest.approx(1.0)
    assert metrics["recall"] == pytest.approx(1.0)
    assert metrics["f1"] == pytest.approx(1.0)
    assert metrics["roc_auc"] == pytest.approx(1.0)
    assert metrics["average_precision"] == pytest.approx(1.0)


def test_classification_metrics_count_threshold_ties_as_positive():
    y_true = np.array([0, 1, 1])
    y_score = np.array([0.50, 0.50, 0.90])

    metrics = classification_metrics(y_true, y_score, threshold=0.50)
    confusion = confusion_matrix_frame(y_true, y_score, threshold=0.50)

    assert metrics["precision"] == pytest.approx(2 / 3)
    assert metrics["recall"] == pytest.approx(1.0)
    assert confusion.loc["actual_0", "predicted_1"] == 1
    assert confusion.loc["actual_1", "predicted_1"] == 2


def test_threshold_for_top_k_returns_cutoff_score():
    y_score = np.array([0.10, 0.20, 0.80, 0.90])

    assert threshold_for_top_k(y_score, 0.50) == pytest.approx(0.80)


def test_threshold_for_top_k_validates_fraction():
    with pytest.raises(ValueError, match="between 0 and 1"):
        threshold_for_top_k([0.1, 0.2], 1.0)


def test_threshold_cutoff_can_select_more_than_k_when_scores_tie():
    y_score = np.array([0.10, 0.80, 0.80, 0.80])
    threshold = threshold_for_top_k(y_score, 0.50)

    selected_by_threshold = y_score >= threshold

    assert threshold == pytest.approx(0.80)
    assert selected_by_threshold.sum() == 3


def test_campaign_metrics_compute_exact_top_k_rows():
    y_true = np.array([0, 1, 0, 1, 1])
    y_score = np.array([0.10, 0.90, 0.20, 0.80, 0.30])

    result = campaign_metrics(y_true, y_score, k_values=(0.40,))
    row = result.iloc[0]

    assert row["top_k_fraction"] == pytest.approx(0.40)
    assert row["customers_contacted"] == 2
    assert row["responders_captured"] == 2
    assert row["precision_at_k"] == pytest.approx(1.0)
    assert row["recall_at_k"] == pytest.approx(2 / 3)
    assert row["lift_at_k"] == pytest.approx(1.0 / 0.6)
    assert row["number_needed_to_contact"] == pytest.approx(1.0)


def test_confusion_matrix_frame_labels_output():
    y_true = np.array([0, 0, 1, 1])
    y_score = np.array([0.20, 0.70, 0.40, 0.80])

    matrix = confusion_matrix_frame(y_true, y_score, threshold=0.50)

    assert list(matrix.index) == ["actual_0", "actual_1"]
    assert list(matrix.columns) == ["predicted_0", "predicted_1"]
    assert matrix.loc["actual_0", "predicted_0"] == 1
    assert matrix.loc["actual_0", "predicted_1"] == 1
    assert matrix.loc["actual_1", "predicted_0"] == 1
    assert matrix.loc["actual_1", "predicted_1"] == 1

