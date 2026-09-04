import type { MetricsResponse } from "@/lib/api/types";

/** Snapshot of GET /metrics generated from the tracked reports/ files. Used by tests and Storybook-style previews. */
export const metricsFixture: MetricsResponse = {
  "dataset": {
    "rows": 5000,
    "positive_count": 480,
    "positive_rate": 0.096,
    "development_rows": 4000,
    "holdout_rows": 1000,
    "holdout_fraction": 0.2,
    "holdout_responders": 96,
    "stratified": true
  },
  "cross_validation": {
    "type": "StratifiedKFold",
    "n_splits": 5,
    "shuffle": true
  },
  "selection": {
    "primary_metric": "average_precision",
    "selected_model": "random_forest",
    "selected_model_label": "Random Forest",
    "threshold_source": "5-fold out-of-fold training probabilities",
    "selected_threshold": 0.29,
    "selected_top_k_fraction": 0.1
  },
  "model_selection": [
    {
      "model": "random_forest",
      "label": "Random Forest",
      "selected": true,
      "best_params": {
        "model__class_weight": null,
        "model__max_depth": null,
        "model__max_features": "sqrt",
        "model__min_samples_leaf": 1
      },
      "mean_cv_average_precision": 0.983463030900662,
      "std_cv_average_precision": 0.0068744512655442,
      "mean_cv_roc_auc": 0.9976065068497462,
      "std_cv_roc_auc": 0.0012417465362839,
      "mean_cv_f1": 0.9169863325378284,
      "std_cv_f1": 0.0261763630035466,
      "mean_cv_precision": 0.9743401786880048,
      "std_cv_precision": 0.02498485221141,
      "mean_cv_recall": 0.8672248803827751,
      "std_cv_recall": 0.0412844083370534,
      "mean_cv_accuracy": 0.985,
      "std_cv_accuracy": 0.0044721359549995,
      "mean_cv_balanced_accuracy": 0.9323680089923474,
      "std_cv_balanced_accuracy": 0.0206039361617625
    },
    {
      "model": "gradient_boosting",
      "label": "Gradient Boosting",
      "selected": false,
      "best_params": {
        "model__learning_rate": 0.1,
        "model__max_depth": 3,
        "model__min_samples_leaf": 10,
        "model__n_estimators": 200
      },
      "mean_cv_average_precision": 0.9818947752248988,
      "std_cv_average_precision": 0.0070839223665039,
      "mean_cv_roc_auc": 0.9978235595000032,
      "std_cv_roc_auc": 0.0008849086940822,
      "mean_cv_f1": 0.915801881332762,
      "std_cv_f1": 0.0203247898688139,
      "mean_cv_precision": 0.9550620953434252,
      "std_cv_precision": 0.0194134546392863,
      "mean_cv_recall": 0.8801777170198222,
      "std_cv_recall": 0.0301927114097696,
      "mean_cv_accuracy": 0.9845,
      "std_cv_accuracy": 0.0036742346141747,
      "mean_cv_balanced_accuracy": 0.9378764302452376,
      "std_cv_balanced_accuracy": 0.0152940738826881
    },
    {
      "model": "decision_tree",
      "label": "Decision Tree",
      "selected": false,
      "best_params": {
        "model__ccp_alpha": 0.0,
        "model__class_weight": null,
        "model__max_depth": 5,
        "model__min_samples_leaf": 5,
        "model__min_samples_split": 25
      },
      "mean_cv_average_precision": 0.966339853982136,
      "std_cv_average_precision": 0.0087143678931628,
      "mean_cv_roc_auc": 0.996155253341103,
      "std_cv_roc_auc": 0.0009313641331573,
      "mean_cv_f1": 0.9131426689242004,
      "std_cv_f1": 0.0102053897781751,
      "mean_cv_precision": 0.9399282764862266,
      "std_cv_precision": 0.0384324332305491,
      "mean_cv_recall": 0.8906015037593985,
      "std_cv_recall": 0.0382415488707571,
      "mean_cv_accuracy": 0.98375,
      "std_cv_accuracy": 0.0019364916731037,
      "mean_cv_balanced_accuracy": 0.942120326549392,
      "std_cv_balanced_accuracy": 0.0172616989603278
    },
    {
      "model": "logistic_regression",
      "label": "Logistic Regression",
      "selected": false,
      "best_params": {
        "model__C": 10.0,
        "model__class_weight": null
      },
      "mean_cv_average_precision": 0.8536819326361804,
      "std_cv_average_precision": 0.0415249651593358,
      "mean_cv_roc_auc": 0.9609956734897612,
      "std_cv_roc_auc": 0.0108653485456411,
      "mean_cv_f1": 0.7689355621729723,
      "std_cv_f1": 0.0403623540075405,
      "mean_cv_precision": 0.878097356851528,
      "std_cv_precision": 0.0513628503451338,
      "mean_cv_recall": 0.6848598769651402,
      "std_cv_recall": 0.0416447484028547,
      "mean_cv_accuracy": 0.9605,
      "std_cv_accuracy": 0.007008922884438,
      "mean_cv_balanced_accuracy": 0.8373129459025437,
      "std_cv_balanced_accuracy": 0.0219962808956398
    },
    {
      "model": "dummy_most_frequent",
      "label": "Dummy Baseline",
      "selected": false,
      "best_params": {},
      "mean_cv_average_precision": 0.096,
      "std_cv_average_precision": 0.0005,
      "mean_cv_roc_auc": 0.5,
      "std_cv_roc_auc": 0.0,
      "mean_cv_f1": 0.0,
      "std_cv_f1": 0.0,
      "mean_cv_precision": 0.0,
      "std_cv_precision": 0.0,
      "mean_cv_recall": 0.0,
      "std_cv_recall": 0.0,
      "mean_cv_accuracy": 0.904,
      "std_cv_accuracy": 0.0004999999999999,
      "mean_cv_balanced_accuracy": 0.5,
      "std_cv_balanced_accuracy": 0.0
    }
  ],
  "holdout": {
    "model": "random_forest",
    "threshold": 0.29,
    "accuracy": 0.984,
    "balanced_accuracy": 0.9771847345132744,
    "precision": 0.8773584905660378,
    "recall": 0.96875,
    "f1": 0.9207920792079208,
    "roc_auc": 0.9991588311209438,
    "average_precision": 0.9930534987514714
  },
  "confusion_matrix": {
    "threshold": 0.29,
    "correctly_excluded": 891,
    "false_outreach": 13,
    "missed_responders": 3,
    "captured_responders": 93,
    "raw": {
      "actual_0": {
        "predicted_0": 891,
        "predicted_1": 13
      },
      "actual_1": {
        "predicted_0": 3,
        "predicted_1": 93
      }
    }
  },
  "campaign": [
    {
      "capacity": 0.05,
      "customers_contacted": 50,
      "responders_captured": 50,
      "precision_at_k": 1.0,
      "recall_at_k": 0.5208333333333334,
      "lift_at_k": 10.416666666666666,
      "number_needed_to_contact": 1.0
    },
    {
      "capacity": 0.1,
      "customers_contacted": 100,
      "responders_captured": 93,
      "precision_at_k": 0.93,
      "recall_at_k": 0.96875,
      "lift_at_k": 9.6875,
      "number_needed_to_contact": 1.075268817204301
    },
    {
      "capacity": 0.2,
      "customers_contacted": 200,
      "responders_captured": 96,
      "precision_at_k": 0.48,
      "recall_at_k": 1.0,
      "lift_at_k": 5.0,
      "number_needed_to_contact": 2.0833333333333335
    }
  ]
};
