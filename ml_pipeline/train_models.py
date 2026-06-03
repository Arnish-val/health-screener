"""
Health & Wellness Screener — Production ML Pipeline (v3.0)
==========================================================
Trains two production-ready calibrated classifiers on real Kaggle datasets.

  PIPELINE A — Disease Predictor
    Dataset : kaushil268/disease-prediction-using-machine-learning
              data/raw/disease_training.csv  (4920 × 133)
    Input   : 132 binary symptom flags
    Output  : top-3 diseases + calibrated confidence scores
    Model   : Auto-selected + tuned + soft-voting ensemble (Platt-calibrated)

  PIPELINE B — Mental Health / Depression Screener
    Dataset : adilshamim8/student-depression-dataset
              data/raw/mental_health.csv  (27901 × 18)
    Input   : lifestyle + academic metrics (13 features after engineering)
    Output  : Depression risk (0/1) + probability score + risk level
    Model   : Auto-selected + tuned + soft-voting ensemble (calibrated)

Run:
    python train_models.py

Requirements:
    pip install scikit-learn pandas numpy joblib

Changes vs v2.0:
  - 3-way train/cal/test split (proper held-out calibration set)
  - cv="prefit" on CalibratedClassifierCV (correct sklearn 1.4+ usage)
  - RandomizedSearchCV tuning on top-2 candidate models
  - Soft-voting VotingClassifier ensemble of top-2 tuned models
  - 5-fold CV (was 3-fold) for more stable estimates
  - class_weight applied only when imbalance ratio > 3x
  - StandardScaler removed from tree pipelines (zero effect on trees)
  - GradientBoosting early-stopping via n_iter_no_change
  - top-3 accuracy metric added (meaningful since UI shows top-3)
  - Feature importances from fitted estimators_ (not pre-fit estimators)
  - VotingClassifier nested n_jobs fixed (no deadlock on Windows)
  - disease_testing.csv merge preserved
  - Synthetic data fallback preserved for offline use

Version : 3.0.0
"""

import time
import warnings
import json
from pathlib import Path

import numpy as np
import pandas as pd
import joblib

from sklearn.ensemble import (
    RandomForestClassifier,
    GradientBoostingClassifier,
    ExtraTreesClassifier,
    VotingClassifier,
)
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import (
    train_test_split,
    StratifiedKFold,
    cross_val_score,
    RandomizedSearchCV,
)
from sklearn.metrics import (
    classification_report,
    accuracy_score,
    f1_score,
    roc_auc_score,
    top_k_accuracy_score,
)
from sklearn.calibration import CalibratedClassifierCV
from sklearn.impute import SimpleImputer

warnings.filterwarnings("ignore")

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR   = Path(__file__).parent
DATA_DIR   = BASE_DIR / "data" / "raw"
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(exist_ok=True)

DISEASE_TRAIN_CSV = DATA_DIR / "disease_training.csv"
DISEASE_TEST_CSV  = DATA_DIR / "disease_testing.csv"
MENTAL_CSV        = DATA_DIR / "mental_health.csv"


# ══════════════════════════════════════════════════════════════════════════════
# UTILITY
# ══════════════════════════════════════════════════════════════════════════════

def banner(title: str) -> None:
    w = 68
    print(f"\n{'=' * w}\n  {title}\n{'=' * w}")


def section(title: str) -> None:
    print(f"\n  -- {title} --")


def evaluate_classifier(name: str, model, X_test, y_test,
                         classes=None, binary: bool = False) -> dict:
    """Unified evaluation for multi-class and binary classifiers."""
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)

    acc = accuracy_score(y_test, y_pred)
    f1  = f1_score(y_test, y_pred, average="weighted")

    print(f"\n  > {name}")
    print(f"    Accuracy    : {acc:.4f}")
    print(f"    Weighted F1 : {f1:.4f}")

    metrics = {"accuracy": round(acc, 4), "f1_weighted": round(f1, 4)}

    if binary:
        auc = roc_auc_score(y_test, y_prob[:, 1])
        print(f"    ROC-AUC     : {auc:.4f}")
        print(f"\n{classification_report(y_test, y_pred, target_names=['No Depression','Depression'], zero_division=0)}")
        metrics["roc_auc"] = round(auc, 4)
    else:
        n_classes = len(np.unique(y_test))
        k = min(3, n_classes)
        top_k = top_k_accuracy_score(y_test, y_prob, k=k)
        print(f"    Top-{k} Acc   : {top_k:.4f}")
        print(f"\n{classification_report(y_test, y_pred, target_names=classes, zero_division=0)}")
        metrics[f"top{k}_accuracy"] = round(top_k, 4)

    return metrics


def check_data_files() -> tuple[bool, bool]:
    """Check which Kaggle files are present."""
    return DISEASE_TRAIN_CSV.exists(), MENTAL_CSV.exists()


def _make_ensemble(clf1_name: str, clf1, clf2_name: str, clf2):
    """Build a soft-voting ensemble. n_jobs=1 on the Voting wrapper to avoid
    nested parallelism deadlock (sub-estimators already use n_jobs=-1)."""
    return VotingClassifier(
        estimators=[
            (clf1_name.lower().replace(" ", "_"), clf1),
            (clf2_name.lower().replace(" ", "_"), clf2),
        ],
        voting="soft",
        n_jobs=1,          # avoid nested joblib deadlock on Windows
    )


def _get_feature_importances(clf, feature_names):
    """Safely extract feature importances from a plain or ensemble classifier."""
    # VotingClassifier: look in estimators_ (post-fit attribute)
    if hasattr(clf, "estimators_"):
        for est in clf.estimators_:
            if hasattr(est, "feature_importances_"):
                return pd.Series(est.feature_importances_, index=feature_names)
    if hasattr(clf, "feature_importances_"):
        return pd.Series(clf.feature_importances_, index=feature_names)
    return None


# ══════════════════════════════════════════════════════════════════════════════
# PIPELINE A — DISEASE PREDICTOR
# ══════════════════════════════════════════════════════════════════════════════

def train_disease_pipeline() -> dict:
    banner("PIPELINE A | Disease Predictor (v3.0)")

    # ── Load dataset ──────────────────────────────────────────────────────────
    if not DISEASE_TRAIN_CSV.exists():
        raise FileNotFoundError(
            f"Dataset not found at: {DISEASE_TRAIN_CSV}\n"
            "Download from Kaggle: kaushil268/disease-prediction-using-machine-learning\n"
            "Or run with synthetic data (see generate_synthetic_disease())."
        )

    print(f"\n  Loading: {DISEASE_TRAIN_CSV}")
    df = pd.read_csv(DISEASE_TRAIN_CSV)
    df = df.loc[:, ~df.columns.str.contains("^Unnamed")]
    df.columns = df.columns.str.strip()
    df["prognosis"] = df["prognosis"].str.strip()

    # Optional: merge official test set if present
    if DISEASE_TEST_CSV.exists():
        test_df = pd.read_csv(DISEASE_TEST_CSV)
        test_df = test_df.loc[:, ~test_df.columns.str.contains("^Unnamed")]
        test_df.columns = test_df.columns.str.strip()
        test_df["prognosis"] = test_df["prognosis"].str.strip()
        test_df = test_df[[c for c in df.columns if c in test_df.columns]]
        df = pd.concat([df, test_df], ignore_index=True)
        print(f"  Merged with disease_testing.csv -> {len(df):,} total rows")

    TARGET_COL   = "prognosis"
    SYMPTOM_COLS = [c for c in df.columns if c != TARGET_COL]

    print(f"  Rows: {len(df):,}  |  Symptom features: {len(SYMPTOM_COLS)}")

    # ── Class distribution ────────────────────────────────────────────────────
    section("Class distribution")
    vc = df[TARGET_COL].value_counts()
    n_classes = vc.shape[0]
    imbalance_ratio = vc.max() / vc.min()
    print(f"  Total classes   : {n_classes}")
    print(f"  Imbalance ratio : {imbalance_ratio:.2f}x  (balanced = 1.0x)")
    for disease, count in list(vc.items())[:5]:
        bar = "#" * (count // 5)
        print(f"    {disease:<45} n={count:4d}  {bar}")
    print("    [...]")

    # ── Encode target ─────────────────────────────────────────────────────────
    X = df[SYMPTOM_COLS].values.astype(np.float32)
    le = LabelEncoder()
    y  = le.fit_transform(df[TARGET_COL])

    # ── 3-way split: train / calibration / test ───────────────────────────────
    # Test set: 20% (never seen during training or calibration)
    # Calibration set: 15% of remaining trainval (≈ 12% of total)
    X_trainval, X_test, y_trainval, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    X_train, X_cal, y_train, y_cal = train_test_split(
        X_trainval, y_trainval, test_size=0.15, random_state=42, stratify=y_trainval
    )
    print(f"\n  Train  : {X_train.shape}")
    print(f"  Cal    : {X_cal.shape}   (held-out for Platt calibration)")
    print(f"  Test   : {X_test.shape}   (never seen during training)")

    # ── Decide class_weight based on actual imbalance ─────────────────────────
    class_counts     = np.bincount(y_train)
    actual_imbalance = class_counts.max() / class_counts.min()
    cw = "balanced" if actual_imbalance > 3.0 else None
    print(f"\n  Train imbalance: {actual_imbalance:.2f}x  -> class_weight={'balanced' if cw else 'None (balanced dataset)'}")

    # ── Step 1: Candidate comparison (5-fold CV, no scaler for trees) ─────────
    section("Step 1 — Candidate model comparison (5-fold stratified CV)")

    candidates = {
        "Random Forest": RandomForestClassifier(
            n_estimators=300, max_depth=None, min_samples_leaf=1,
            n_jobs=-1, class_weight=cw, random_state=42),
        "Extra Trees": ExtraTreesClassifier(
            n_estimators=300, max_depth=None, min_samples_leaf=1,
            n_jobs=-1, class_weight=cw, random_state=42),
        "Gradient Boosting": GradientBoostingClassifier(
            n_estimators=200, learning_rate=0.1, max_depth=3,
            subsample=0.8, n_iter_no_change=20,
            # Note: do NOT use validation_fraction inside CV — it carves into
            # already-small folds and destabilises score estimates.
            random_state=42),
    }

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_results: dict[str, float] = {}

    for name, clf in candidates.items():
        t0     = time.perf_counter()
        scores = cross_val_score(clf, X_train, y_train,
                                 cv=cv, scoring="f1_weighted", n_jobs=-1)
        elapsed = time.perf_counter() - t0
        cv_results[name] = scores.mean()
        print(f"    {name:<22}  CV F1 = {scores.mean():.4f} +/- {scores.std():.4f}  [{elapsed:.1f}s]")

    # ── Step 2: Tune top-2 candidates with RandomizedSearchCV ────────────────
    section("Step 2 — RandomizedSearchCV on top-2 candidates")

    sorted_cv = sorted(cv_results.items(), key=lambda x: x[1], reverse=True)
    top2_names = [n for n, _ in sorted_cv[:2]]
    print(f"  Tuning: {top2_names}")

    param_grids = {
        "Random Forest": (
            RandomForestClassifier(n_jobs=-1, class_weight=cw, random_state=42),
            {
                "n_estimators":     [200, 400, 600],
                "max_depth":        [None, 20, 40],
                "min_samples_leaf": [1, 2, 4],
                "max_features":     ["sqrt", "log2", 0.3],
            },
        ),
        "Extra Trees": (
            ExtraTreesClassifier(n_jobs=-1, class_weight=cw, random_state=42),
            {
                "n_estimators":     [200, 400, 600],
                "max_depth":        [None, 20, 40],
                "min_samples_leaf": [1, 2, 4],
                "max_features":     ["sqrt", "log2", 0.3],
            },
        ),
        "Gradient Boosting": (
            GradientBoostingClassifier(n_iter_no_change=20, random_state=42),
            {
                "n_estimators":  [100, 200, 300],
                "learning_rate": [0.05, 0.1, 0.2],
                "max_depth":     [3, 4, 5],
                "subsample":     [0.7, 0.8, 1.0],
            },
        ),
    }

    tuned_clfs: dict[str, object] = {}
    tuned_scores: dict[str, float] = {}

    for name in top2_names:
        base_clf, param_grid = param_grids[name]
        search = RandomizedSearchCV(
            base_clf, param_grid,
            n_iter=15, cv=cv,
            scoring="f1_weighted",
            n_jobs=-1, random_state=42, verbose=0,
        )
        t0 = time.perf_counter()
        search.fit(X_train, y_train)
        elapsed = time.perf_counter() - t0
        tuned_clfs[name]   = search.best_estimator_
        tuned_scores[name] = search.best_score_
        print(f"    {name:<22}  Tuned CV F1 = {search.best_score_:.4f}  [{elapsed:.1f}s]")
        print(f"      Best params: {search.best_params_}")

    # ── Step 3: Soft-voting ensemble of top-2 tuned models ───────────────────
    section("Step 3 — Soft-voting ensemble (top-2 tuned models)")

    clf1_name, clf2_name = top2_names[0], top2_names[1]
    clf1 = tuned_clfs[clf1_name]
    clf2 = tuned_clfs[clf2_name]

    ensemble = _make_ensemble(clf1_name, clf1, clf2_name, clf2)

    t0 = time.perf_counter()
    ens_scores = cross_val_score(ensemble, X_train, y_train,
                                 cv=cv, scoring="f1_weighted", n_jobs=-1)
    elapsed = time.perf_counter() - t0

    best_tuned_score = max(tuned_scores[clf1_name], tuned_scores[clf2_name])
    print(f"  Best single (tuned) CV F1 : {best_tuned_score:.4f}")
    print(f"  Ensemble CV F1            : {ens_scores.mean():.4f} +/- {ens_scores.std():.4f}  [{elapsed:.1f}s]")

    # Use ensemble only if it matches or beats best tuned single model
    if ens_scores.mean() >= best_tuned_score:
        final_clf  = ensemble
        final_name = f"Ensemble ({clf1_name} + {clf2_name})"
        final_cv   = ens_scores.mean()
        print(f"  -> Using ensemble")
    else:
        # Fall back to the best tuned single model
        best_name  = max(tuned_scores, key=tuned_scores.get)
        final_clf  = tuned_clfs[best_name]
        final_name = best_name
        final_cv   = tuned_scores[best_name]
        print(f"  -> Ensemble did not improve; using tuned {best_name}")

    # ── Step 4: Fit final model on X_train ───────────────────────────────────
    section("Step 4 — Final fit on training set")
    t0 = time.perf_counter()
    final_clf.fit(X_train, y_train)
    train_time = time.perf_counter() - t0
    print(f"  Training time: {train_time:.2f}s")

    # ── Step 5: Platt calibration on held-out calibration set ────────────────
    # cv="prefit" tells sklearn the base estimator is already fit — no refitting.
    # This is correct in sklearn 1.4+ (cv="prefit" was NOT removed).
    section("Step 5 — Platt calibration on held-out calibration set")
    calibrated = CalibratedClassifierCV(final_clf, method="sigmoid", cv="prefit")
    calibrated.fit(X_cal, y_cal)
    print(f"  Calibrated on {X_cal.shape[0]} held-out samples (cv='prefit' — base model unchanged)")

    # ── Step 6: Evaluate on untouched test set ───────────────────────────────
    section("Step 6 — Test set evaluation")
    raw_metrics = evaluate_classifier(
        f"{final_name} (raw)",
        final_clf, X_test, y_test,
        classes=le.classes_
    )
    cal_metrics = evaluate_classifier(
        f"{final_name} (calibrated)",
        calibrated, X_test, y_test,
        classes=le.classes_
    )

    # ── Step 7: Feature importances ──────────────────────────────────────────
    section("Step 7 — Top-15 most informative symptoms")
    fi = _get_feature_importances(final_clf, SYMPTOM_COLS)
    if fi is not None:
        for sym, imp in fi.nlargest(15).items():
            bar = "#" * int(imp * 300)
            print(f"    {sym:<40} {imp:.4f}  {bar}")
    else:
        print("  (feature importances not available for this model type)")

    # ── Step 8: Demo — top-3 prediction ──────────────────────────────────────
    section("Step 8 — Demo: top-3 prediction on one test sample")
    demo_x     = X_test[0:1]
    probs      = calibrated.predict_proba(demo_x)[0]
    top3_idx   = np.argsort(probs)[::-1][:3]
    true_label = le.inverse_transform([y_test[0]])[0]
    print(f"  True label: {true_label}")
    for rank, idx in enumerate(top3_idx, 1):
        match = "✓" if le.classes_[idx] == true_label else " "
        print(f"    #{rank} {match} {le.classes_[idx]:<45}  {probs[idx]*100:.1f}%")

    # ── Save artifacts ────────────────────────────────────────────────────────
    section("Saving artifacts")
    artifacts = {
        "pipeline":      calibrated,
        "label_encoder": le,
        "feature_names": SYMPTOM_COLS,
        "classes":       le.classes_.tolist(),
        "model_name":    final_name,
        "metrics": {
            **cal_metrics,
            "cv_f1":        round(final_cv, 4),
            "raw_accuracy": raw_metrics["accuracy"],
            "raw_f1":       raw_metrics["f1_weighted"],
        },
    }
    out = MODELS_DIR / "disease_pipeline.joblib"
    joblib.dump(artifacts, out, compress=3)
    print(f"  Saved -> {out}")

    return artifacts["metrics"]


# ══════════════════════════════════════════════════════════════════════════════
# PIPELINE B — MENTAL HEALTH / DEPRESSION SCREENER
# ══════════════════════════════════════════════════════════════════════════════

def train_mental_health_pipeline() -> dict:
    banner("PIPELINE B | Mental Health / Depression Screener (v3.0)")

    if not MENTAL_CSV.exists():
        raise FileNotFoundError(
            f"Dataset not found at: {MENTAL_CSV}\n"
            "Download from Kaggle: adilshamim8/student-depression-dataset\n"
            "Or run with synthetic data (see generate_synthetic_mental())."
        )

    print(f"\n  Loading: {MENTAL_CSV}")
    df = pd.read_csv(MENTAL_CSV)
    df.columns = df.columns.str.strip()

    print(f"  Rows: {len(df):,}  |  Columns: {list(df.columns)}")

    # ── Target ────────────────────────────────────────────────────────────────
    TARGET_COL = "Depression"
    if TARGET_COL not in df.columns:
        for alt in ["depression", "Depression_Status", "label"]:
            if alt in df.columns:
                df.rename(columns={alt: TARGET_COL}, inplace=True)
                break

    print(f"\n  Target distribution:")
    vc = df[TARGET_COL].value_counts()
    for label, count in vc.items():
        pct   = count / len(df) * 100
        lname = "Depression" if label == 1 else "No Depression"
        print(f"    {lname:<18} n={count:5,}  ({pct:.1f}%)")

    # ── Feature engineering ───────────────────────────────────────────────────
    section("Feature engineering")

    DROP_COLS = ["id", "City", "Degree", "Profession"]
    df = df.drop(columns=[c for c in DROP_COLS if c in df.columns])

    SLEEP_ORDER = ["Less than 5 hours", "5-6 hours", "7-8 hours", "More than 8 hours"]
    if "Sleep Duration" in df.columns:
        sleep_map = {v: i for i, v in enumerate(SLEEP_ORDER)}
        df["Sleep Duration"] = df["Sleep Duration"].map(sleep_map)
        df["Sleep Duration"] = df["Sleep Duration"].fillna(df["Sleep Duration"].median())

    if "Dietary Habits" in df.columns:
        diet_map = {"Unhealthy": 0, "Moderate": 1, "Healthy": 2}
        df["Dietary Habits"] = df["Dietary Habits"].map(diet_map)
        df["Dietary Habits"] = df["Dietary Habits"].fillna(df["Dietary Habits"].median())

    binary_cols = [
        "Have you ever had suicidal thoughts ?",
        "Family History of Mental Illness",
        "Gender",
    ]
    for col in binary_cols:
        if col in df.columns:
            unique_vals = df[col].dropna().unique()
            vals_lower  = {str(v).strip().lower() for v in unique_vals}
            if vals_lower <= {"yes", "no"}:
                df[col] = df[col].map({"Yes": 1, "No": 0, "yes": 1, "no": 0}).fillna(0)
            elif vals_lower <= {"male", "female"}:
                df[col] = df[col].map({"Male": 1, "Female": 0, "male": 1, "female": 0}).fillna(0)

    FEATURE_COLS = [c for c in df.columns if c != TARGET_COL]
    print(f"  Features after engineering ({len(FEATURE_COLS)}): {FEATURE_COLS}")

    # Fill remaining NaNs with column median
    for col in FEATURE_COLS:
        if df[col].isna().any():
            df[col] = df[col].fillna(df[col].median())

    X = df[FEATURE_COLS].values.astype(np.float32)
    y = df[TARGET_COL].values.astype(np.int32)

    # ── 3-way split ───────────────────────────────────────────────────────────
    X_trainval, X_test, y_trainval, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    X_train, X_cal, y_train, y_cal = train_test_split(
        X_trainval, y_trainval, test_size=0.15, random_state=42, stratify=y_trainval
    )
    print(f"\n  Train  : {X_train.shape}")
    print(f"  Cal    : {X_cal.shape}   (held-out for calibration)")
    print(f"  Test   : {X_test.shape}   (never seen during training)")

    # ── Class weight ──────────────────────────────────────────────────────────
    n_pos = y_train.sum()
    n_neg = len(y_train) - n_pos
    scale = n_neg / max(n_pos, 1)
    actual_imbalance = max(n_pos, n_neg) / max(min(n_pos, n_neg), 1)
    cw_dict = {0: 1.0, 1: float(scale)} if actual_imbalance > 1.5 else None
    cw_str  = "balanced" if actual_imbalance > 1.5 else None
    print(f"\n  Class imbalance: pos={n_pos:,} neg={n_neg:,} ({actual_imbalance:.2f}x)")
    print(f"  class_weight: {cw_dict if cw_dict else 'None (balanced)'}")

    # ── Step 1: Candidate comparison (5-fold CV) ──────────────────────────────
    section("Step 1 — Candidate model comparison (5-fold stratified CV, ROC-AUC)")

    # LR needs a scaler — wrap only LR in a pipeline
    candidates = {
        "Gradient Boosting": Pipeline([
            ("clf", GradientBoostingClassifier(
                n_estimators=200, learning_rate=0.05, max_depth=3,
                subsample=0.8, min_samples_leaf=20,
                n_iter_no_change=20, random_state=42))
        ]),
        "Random Forest": Pipeline([
            ("clf", RandomForestClassifier(
                n_estimators=300, max_depth=None, min_samples_leaf=5,
                n_jobs=-1, class_weight=cw_dict, random_state=42))
        ]),
        "Logistic Regression": Pipeline([
            ("scaler", StandardScaler()),
            ("clf",    LogisticRegression(
                C=1.0, max_iter=1000, class_weight="balanced",
                solver="lbfgs", random_state=42))
        ]),
    }

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_results: dict[str, float] = {}

    for name, pipe in candidates.items():
        t0     = time.perf_counter()
        scores = cross_val_score(pipe, X_train, y_train,
                                 cv=cv, scoring="roc_auc", n_jobs=-1)
        elapsed = time.perf_counter() - t0
        cv_results[name] = scores.mean()
        print(f"    {name:<25}  CV ROC-AUC = {scores.mean():.4f} +/- {scores.std():.4f}  [{elapsed:.1f}s]")

    # ── Step 2: Tune top-2 candidates ─────────────────────────────────────────
    section("Step 2 — RandomizedSearchCV on top-2 candidates")

    sorted_cv  = sorted(cv_results.items(), key=lambda x: x[1], reverse=True)
    top2_names = [n for n, _ in sorted_cv[:2]]
    print(f"  Tuning: {top2_names}")

    mh_param_grids = {
        "Gradient Boosting": (
            GradientBoostingClassifier(n_iter_no_change=15, random_state=42),
            {
                "n_estimators":    [100, 200, 300],
                "learning_rate":   [0.03, 0.05, 0.1, 0.2],
                "max_depth":       [3, 4, 5],
                "subsample":       [0.7, 0.8, 1.0],
                "min_samples_leaf":[10, 20, 30],
            },
        ),
        "Random Forest": (
            RandomForestClassifier(n_jobs=-1, class_weight=cw_dict, random_state=42),
            {
                "n_estimators":     [200, 400, 600],
                "max_depth":        [None, 10, 20],
                "min_samples_leaf": [2, 5, 10],
                "max_features":     ["sqrt", "log2"],
            },
        ),
        "Logistic Regression": (
            Pipeline([
                ("scaler", StandardScaler()),
                ("clf",    LogisticRegression(max_iter=2000, class_weight="balanced",
                                              solver="lbfgs", random_state=42))
            ]),
            {"clf__C": [0.01, 0.1, 0.5, 1.0, 5.0, 10.0]},
        ),
    }

    tuned_pipes: dict[str, object] = {}
    tuned_scores: dict[str, float] = {}

    for name in top2_names:
        base_est, param_grid = mh_param_grids[name]
        search = RandomizedSearchCV(
            base_est, param_grid,
            n_iter=12, cv=cv,
            scoring="roc_auc",
            n_jobs=-1, random_state=42, verbose=0,
        )
        t0 = time.perf_counter()
        search.fit(X_train, y_train)
        elapsed = time.perf_counter() - t0
        tuned_pipes[name]   = search.best_estimator_
        tuned_scores[name]  = search.best_score_
        print(f"    {name:<25}  Tuned CV AUC = {search.best_score_:.4f}  [{elapsed:.1f}s]")
        print(f"      Best params: {search.best_params_}")

    # ── Step 3: Soft-voting ensemble ──────────────────────────────────────────
    section("Step 3 — Soft-voting ensemble (top-2 tuned models)")

    clf1_name, clf2_name = top2_names[0], top2_names[1]
    clf1 = tuned_pipes[clf1_name]
    clf2 = tuned_pipes[clf2_name]

    ensemble = _make_ensemble(clf1_name, clf1, clf2_name, clf2)

    t0 = time.perf_counter()
    ens_scores = cross_val_score(ensemble, X_train, y_train,
                                 cv=cv, scoring="roc_auc", n_jobs=-1)
    elapsed = time.perf_counter() - t0

    best_tuned_score = max(tuned_scores[clf1_name], tuned_scores[clf2_name])
    print(f"  Best single (tuned) CV AUC : {best_tuned_score:.4f}")
    print(f"  Ensemble CV AUC            : {ens_scores.mean():.4f} +/- {ens_scores.std():.4f}  [{elapsed:.1f}s]")

    if ens_scores.mean() >= best_tuned_score:
        final_clf  = ensemble
        final_name = f"Ensemble ({clf1_name} + {clf2_name})"
        final_cv   = ens_scores.mean()
        print(f"  -> Using ensemble")
    else:
        best_name  = max(tuned_scores, key=tuned_scores.get)
        final_clf  = tuned_pipes[best_name]
        final_name = best_name
        final_cv   = tuned_scores[best_name]
        print(f"  -> Ensemble did not improve; using tuned {best_name}")

    # ── Step 4: Fit final model ───────────────────────────────────────────────
    section("Step 4 — Final fit on training set")
    t0 = time.perf_counter()
    final_clf.fit(X_train, y_train)
    train_time = time.perf_counter() - t0
    print(f"  Training time: {train_time:.2f}s")

    # ── Step 5: Probability calibration ──────────────────────────────────────
    section("Step 5 — Platt calibration on held-out calibration set")
    calibrated = CalibratedClassifierCV(final_clf, method="sigmoid", cv="prefit")
    calibrated.fit(X_cal, y_cal)
    print(f"  Calibrated on {X_cal.shape[0]} samples (cv='prefit')")

    # ── Step 6: Evaluate ──────────────────────────────────────────────────────
    section("Step 6 — Test set evaluation")
    metrics = evaluate_classifier(
        f"{final_name} (calibrated)",
        calibrated, X_test, y_test, binary=True
    )
    metrics["cv_roc_auc"] = round(final_cv, 4)

    # ── Step 7: Feature importances ───────────────────────────────────────────
    section("Step 7 — Feature importances")
    fi = _get_feature_importances(final_clf, FEATURE_COLS)
    if fi is not None:
        for feat, imp in fi.sort_values(ascending=False).items():
            bar = "#" * int(imp * 60)
            print(f"    {feat:<45} {imp:.4f}  {bar}")
    else:
        print("  (importances not available for this model)")

    # ── Risk level thresholds ─────────────────────────────────────────────────
    RISK_BANDS = {
        "Low":      (0.00, 0.35, "#22c55e", "No significant depression risk detected."),
        "Moderate": (0.35, 0.65, "#f59e0b", "Some indicators present. Consider talking to someone."),
        "High":     (0.65, 1.01, "#ef4444", "Strong indicators. Please consult a professional."),
    }

    # ── Demo prediction ───────────────────────────────────────────────────────
    section("Demo — high-risk profile prediction")
    DEMO_HIGH_RISK = {
        "Gender": 0, "Age": 21, "Academic Pressure": 5, "Work Pressure": 4,
        "CGPA": 5.0, "Study Satisfaction": 1, "Job Satisfaction": 1,
        "Sleep Duration": 0, "Dietary Habits": 0,
        "Have you ever had suicidal thoughts ?": 1,
        "Work/Study Hours": 12, "Financial Stress": 5,
        "Family History of Mental Illness": 1,
    }
    demo_vec = np.array(
        [[DEMO_HIGH_RISK.get(f, 0) for f in FEATURE_COLS]], dtype=np.float32
    )
    prob_depression = calibrated.predict_proba(demo_vec)[0][1]
    risk_label = next(
        k for k, (lo, hi, *_) in RISK_BANDS.items()
        if lo <= prob_depression < hi
    )
    _, _, color, advice = RISK_BANDS[risk_label]
    print(f"  Depression probability : {prob_depression*100:.1f}%")
    print(f"  Risk level             : {risk_label}")
    print(f"  Advice                 : {advice}")

    # ── Save artifacts ────────────────────────────────────────────────────────
    section("Saving artifacts")
    artifacts = {
        "pipeline":      calibrated,
        "feature_names": FEATURE_COLS,
        "model_name":    final_name,
        "risk_bands":    RISK_BANDS,
        "classes":       ["No Depression", "Depression"],
        "feature_types": {
            "Sleep Duration":    {"type": "ordinal", "options": SLEEP_ORDER},
            "Dietary Habits":    {"type": "ordinal",
                                  "options": ["Unhealthy", "Moderate", "Healthy"]},
            "Gender":            {"type": "binary", "options": ["Female", "Male"]},
            "Have you ever had suicidal thoughts ?":
                                 {"type": "binary", "options": ["No", "Yes"]},
            "Family History of Mental Illness":
                                 {"type": "binary", "options": ["No", "Yes"]},
        },
        "metrics": metrics,
    }
    out = MODELS_DIR / "mental_health_pipeline.joblib"
    joblib.dump(artifacts, out, compress=3)
    print(f"  Saved -> {out}")
    return artifacts["metrics"]


# ══════════════════════════════════════════════════════════════════════════════
# FALLBACK — synthetic data generators (offline testing / CI)
# ══════════════════════════════════════════════════════════════════════════════

def generate_synthetic_disease(n: int = 4920) -> pd.DataFrame:
    """Replicates the Kaggle disease dataset structure for offline testing."""
    np.random.seed(42)
    SYMPTOMS = [
        "itching","skin_rash","nodal_skin_eruptions","continuous_sneezing",
        "shivering","chills","joint_pain","stomach_pain","acidity","ulcers_on_tongue",
        "muscle_wasting","vomiting","burning_micturition","spotting_urination",
        "fatigue","weight_gain","anxiety","cold_hands_and_feets","mood_swings",
        "weight_loss","restlessness","lethargy","patches_in_throat",
        "irregular_sugar_level","cough","high_fever","sunken_eyes","breathlessness",
        "sweating","dehydration","indigestion","headache","yellowish_skin",
        "dark_urine","nausea","loss_of_appetite","pain_behind_the_eyes",
        "back_pain","constipation","abdominal_pain","diarrhoea","mild_fever",
        "yellow_urine","yellowing_of_eyes","acute_liver_failure","fluid_overload",
        "swelling_of_stomach","swelled_lymph_nodes","malaise","blurred_and_distorted_vision",
        "phlegm","throat_irritation","redness_of_eyes","sinus_pressure","runny_nose",
        "congestion","chest_pain","weakness_in_limbs","fast_heart_rate",
        "pain_during_bowel_movements","pain_in_anal_region","bloody_stool",
        "irritation_in_anus","neck_pain","dizziness","cramps","bruising",
        "obesity","swollen_legs","swollen_blood_vessels","puffy_face_and_eyes",
        "enlarged_thyroid","brittle_nails","swollen_extremeties","excessive_hunger",
        "extra_marital_contacts","drying_and_tingling_lips","slurred_speech",
        "knee_pain","hip_joint_pain","muscle_weakness","stiff_neck","swelling_joints",
        "movement_stiffness","spinning_movements","loss_of_balance","unsteadiness",
        "weakness_of_one_body_side","loss_of_smell","bladder_discomfort",
        "foul_smell_of_urine","continuous_feel_of_urine","passage_of_gases",
        "internal_itching","toxic_look_(typhos)","depression","irritability",
        "muscle_pain","altered_sensorium","red_spots_over_body","belly_pain",
        "abnormal_menstruation","dischromic_patches","watering_from_eyes",
        "increased_appetite","polyuria","family_history","mucoid_sputum",
        "rusty_sputum","lack_of_concentration","visual_disturbances",
        "receiving_blood_transfusion","receiving_unsterile_injections","coma",
        "stomach_bleeding","distention_of_abdomen","history_of_alcohol_consumption",
        "fluid_overload_1","blood_in_sputum","prominent_veins_on_calf",
        "palpitations","painful_walking","pus_filled_pimples","blackheads",
        "scurring","skin_peeling","silver_like_dusting","small_dents_in_nails",
        "inflammatory_nails","blister","red_sore_around_nose","yellow_crust_ooze",
    ][:132]
    DISEASES = [
        "Fungal infection","Allergy","GERD","Chronic cholestasis","Drug Reaction",
        "Peptic ulcer disease","AIDS","Diabetes","Gastroenteritis","Bronchial Asthma",
        "Hypertension","Migraine","Cervical spondylosis","Paralysis (brain hemorrhage)",
        "Jaundice","Malaria","Chicken pox","Dengue","Typhoid","hepatitis A",
        "Hepatitis B","Hepatitis C","Hepatitis D","Hepatitis E","Alcoholic hepatitis",
        "Tuberculosis","Common Cold","Pneumonia","Dimorphic hemmorhoids(piles)",
        "Heart attack","Varicose veins","Hypothyroidism","Hyperthyroidism",
        "Hypoglycemia","Osteoarthristis","Arthritis",
        "(vertigo) Paroxysmal Positional Vertigo","Acne",
        "Urinary tract infection","Psoriasis","Impetigo",
    ]
    LOGICAL_RULES: dict[str, list[str]] = {
        "Common Cold":      ["continuous_sneezing","chills","fatigue","cough","mild_fever","runny_nose","congestion"],
        "Malaria":          ["chills","vomiting","high_fever","sweating","headache","nausea","muscle_pain"],
        "Dengue":           ["skin_rash","chills","joint_pain","vomiting","fatigue","high_fever","headache","nausea","pain_behind_the_eyes","muscle_pain"],
        "Typhoid":          ["chills","vomiting","fatigue","high_fever","headache","nausea","constipation","abdominal_pain","toxic_look_(typhos)"],
        "Diabetes":         ["fatigue","weight_loss","restlessness","lethargy","irregular_sugar_level","blurred_and_distorted_vision","obesity","excessive_hunger","polyuria"],
        "Hypertension":     ["headache","chest_pain","dizziness","loss_of_balance","lack_of_concentration"],
        "Migraine":         ["acidity","indigestion","headache","blurred_and_distorted_vision","excessive_hunger","stiff_neck","depression","irritability","visual_disturbances"],
        "Arthritis":        ["muscle_weakness","stiff_neck","swelling_joints","movement_stiffness","painful_walking"],
        "Allergy":          ["continuous_sneezing","shivering","chills","watering_from_eyes"],
        "Fungal infection": ["itching","skin_rash","nodal_skin_eruptions","dischromic_patches"],
        "Jaundice":         ["itching","vomiting","fatigue","weight_loss","high_fever","yellowish_skin","dark_urine","abdominal_pain"],
        "Tuberculosis":     ["chills","vomiting","fatigue","weight_loss","cough","high_fever","breathlessness","sweating","loss_of_appetite","phlegm","blood_in_sputum"],
        "Pneumonia":        ["chills","fatigue","cough","high_fever","breathlessness","sweating","malaise","chest_pain","fast_heart_rate","rusty_sputum"],
    }
    for d in DISEASES:
        if d not in LOGICAL_RULES:
            LOGICAL_RULES[d] = list(np.random.choice(SYMPTOMS, np.random.randint(4, 9), replace=False))

    rows = []
    for _ in range(n):
        disease = np.random.choice(DISEASES)
        row = {s: int(np.random.random() < 0.05) for s in SYMPTOMS}
        for s in LOGICAL_RULES[disease]:
            if np.random.random() < 0.8:
                row[s] = 1
        row["prognosis"] = disease
        rows.append(row)
    return pd.DataFrame(rows)


def generate_synthetic_mental(n: int = 27901) -> pd.DataFrame:
    """Replicates the Kaggle student depression dataset structure."""
    np.random.seed(42)
    SLEEP_MAP = ["Less than 5 hours","5-6 hours","7-8 hours","More than 8 hours"]
    DIET_MAP  = ["Unhealthy","Moderate","Healthy"]
    rows = []
    for _ in range(n):
        sleep_idx        = np.random.choice([0, 1, 2, 3])
        diet_idx         = np.random.choice([0, 1, 2])
        academic_pressure= np.random.randint(0, 6)
        work_pressure    = np.random.randint(0, 6)
        cgpa             = round(np.random.uniform(3, 10), 1)
        study_sat        = np.random.randint(0, 6)
        job_sat          = np.random.randint(0, 6)
        financial        = np.random.randint(0, 6)
        hours            = round(np.random.uniform(0, 16), 1)
        suicidal         = np.random.random() < 0.15
        family_hist      = np.random.random() < 0.2

        risk_score = 0.0
        if sleep_idx <= 1:          risk_score += 2.0
        if diet_idx == 0:           risk_score += 1.0
        if academic_pressure >= 4:  risk_score += 2.0
        if work_pressure >= 4:      risk_score += 2.0
        if cgpa < 6.0:              risk_score += 1.5
        if study_sat <= 2:          risk_score += 1.0
        if job_sat <= 2:            risk_score += 1.0
        if financial >= 4:          risk_score += 2.0
        if hours > 10:              risk_score += 1.5
        if suicidal:                risk_score += 5.0
        if family_hist:             risk_score += 3.0

        dep = 1 if risk_score >= 8 else 0
        if np.random.random() < 0.05:   # 5% label noise
            dep = 1 - dep

        rows.append({
            "Gender":             np.random.choice(["Male", "Female"]),
            "Age":                int(np.clip(np.random.normal(21, 3), 17, 30)),
            "Academic Pressure":  academic_pressure,
            "Work Pressure":      work_pressure,
            "CGPA":               cgpa,
            "Study Satisfaction": study_sat,
            "Job Satisfaction":   job_sat,
            "Sleep Duration":     SLEEP_MAP[sleep_idx],
            "Dietary Habits":     DIET_MAP[diet_idx],
            "Have you ever had suicidal thoughts ?": "Yes" if suicidal else "No",
            "Work/Study Hours":   hours,
            "Financial Stress":   financial,
            "Family History of Mental Illness": "Yes" if family_hist else "No",
            "Depression":         dep,
        })
    return pd.DataFrame(rows)


# ══════════════════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════════════════

def main():
    print("\n" + "=" * 70)
    print("  HEALTH & WELLNESS SCREENER — UNIFIED ML PIPELINE (v3.0)")
    print("=" * 70)

    disease_ok, mental_ok = check_data_files()

    # ── Graceful synthetic fallback ───────────────────────────────────────────
    if not disease_ok:
        print(f"\n  [WARN] Disease dataset not found at: {DISEASE_TRAIN_CSV}")
        print("  -> Generating synthetic data (Kaggle schema)...")
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        generate_synthetic_disease().to_csv(DISEASE_TRAIN_CSV, index=False)
        print(f"  OK: Synthetic disease_training.csv created.")

    if not mental_ok:
        print(f"\n  [WARN] Mental health dataset not found at: {MENTAL_CSV}")
        print("  -> Generating synthetic data (Kaggle schema)...")
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        generate_synthetic_mental().to_csv(MENTAL_CSV, index=False)
        print(f"  OK: Synthetic mental_health.csv created.")

    t_start = time.perf_counter()

    disease_metrics = train_disease_pipeline()
    mh_metrics      = train_mental_health_pipeline()

    total_time = time.perf_counter() - t_start

    # ── Summary ───────────────────────────────────────────────────────────────
    banner("PIPELINE SUMMARY")

    summary = {
        "version": "3.0.0",
        "kaggle_data_used": {
            "disease":       disease_ok,
            "mental_health": mental_ok,
        },
        "disease_predictor": {
            "dataset": "kaushil268/disease-prediction-using-machine-learning",
            "model":   "Auto-selected + tuned + soft-voting ensemble (Platt-calibrated, cv=prefit)",
            "input":   "132 binary symptom flags",
            "output":  "top-3 disease predictions + calibrated confidence %",
            "metrics": disease_metrics,
        },
        "mental_health_screener": {
            "dataset": "adilshamim8/student-depression-dataset",
            "model":   "Auto-selected + tuned + soft-voting ensemble (calibrated)",
            "input":   "13 lifestyle/academic/demographic features",
            "output":  "depression probability + risk level (Low/Moderate/High)",
            "metrics": mh_metrics,
        },
        "total_training_time_sec": round(total_time, 2),
        "saved_models": [
            "models/disease_pipeline.joblib",
            "models/mental_health_pipeline.joblib",
        ],
    }

    print(json.dumps(summary, indent=4))
    with open(MODELS_DIR / "pipeline_summary.json", "w") as f:
        json.dump(summary, f, indent=4)

    print(f"\n  Total time : {total_time:.1f}s")
    print("\n" + "=" * 70)
    print("  Both pipelines ready.")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    main()
