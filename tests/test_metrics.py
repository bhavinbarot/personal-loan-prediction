import numpy as np
import pytest

from loan_modeling.metrics import (
    campaign_metrics,
    classification_metrics,
    confusion_matrix_frame,
    select_top_k_mask,
    threshold_for_top_k,
    top_k_count,
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


def test_threshold_policy_can_select_more_than_k_when_scores_tie():
    y_score = np.array([0.10, 0.80, 0.80, 0.80])
    threshold = threshold_for_top_k(y_score, 0.50)

    selected_by_threshold = y_score >= threshold

    assert threshold == pytest.approx(0.80)
    assert selected_by_threshold.sum() == 3


def test_top_k_count_uses_existing_ceiling_rounding_convention():
    assert top_k_count(1000, 0.10) == 100
    assert top_k_count(103, 0.10) == 11
    assert top_k_count(3, 0.10) == 1


def test_select_top_k_mask_returns_exact_count_and_highest_scores():
    y_score = np.array([0.10, 0.90, 0.20, 0.80, 0.30])

    mask = select_top_k_mask(y_score, 0.40)

    assert mask.tolist() == [False, True, False, True, False]
    assert mask.sum() == 2


def test_select_top_k_mask_keeps_exact_count_with_boundary_ties():
    y_score = np.array([0.10, 0.80, 0.80, 0.80])

    mask = select_top_k_mask(y_score, 0.50)

    assert mask.sum() == 2
    assert mask.tolist() == [False, True, True, False]


def test_select_top_k_mask_tie_breaking_is_deterministic():
    y_score = np.array([0.80, 0.80, 0.80, 0.10])

    first = select_top_k_mask(y_score, 0.50)
    second = select_top_k_mask(y_score, 0.50)

    assert first.tolist() == [True, True, False, False]
    assert np.array_equal(first, second)


def test_select_top_k_mask_validates_inputs():
    with pytest.raises(ValueError, match="one-dimensional"):
        select_top_k_mask([[0.1, 0.2]], 0.50)

    with pytest.raises(ValueError, match="positive"):
        select_top_k_mask([], 0.50)


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


def test_campaign_metrics_use_exact_top_k_population_when_tied():
    y_true = np.array([0, 1, 1, 0])
    y_score = np.array([0.10, 0.80, 0.80, 0.80])

    result = campaign_metrics(y_true, y_score, k_values=(0.50,))
    row = result.iloc[0]

    assert row["customers_contacted"] == 2
    assert row["responders_captured"] == 2
    assert row["precision_at_k"] == pytest.approx(1.0)
    assert row["recall_at_k"] == pytest.approx(1.0)


def test_campaign_metrics_validate_matching_lengths():
    with pytest.raises(ValueError, match="same length"):
        campaign_metrics([0, 1], [0.1], k_values=(0.50,))


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
