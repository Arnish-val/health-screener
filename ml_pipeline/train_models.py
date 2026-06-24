"""
Health & Wellness Screener — Production ML Pipeline (v4.0)
==========================================================
Trains THREE production-ready calibrated classifiers.

  PIPELINE A — Disease Predictor
    Dataset : kaushil268/disease-prediction-using-machine-learning
              data/raw/disease_training.csv  (4920 x 133)
    Optional augmentation (recommended, fixes "vague Hepatitis-type" results):
              dhivyeshrk/diseases-and-symptoms-dataset
              data/raw/disease_extra.csv  (773 diseases, 377 symptoms, 246k rows)
    NEW in v4.0: detects diseases whose symptom signatures are statistically
    indistinguishable in the training data (e.g. Hepatitis B/C/D very often
    are, in the 132-symptom kaushil268 schema) and reports them as a grouped
    "clinical cluster" instead of pretending the model can split them.

  PIPELINE B1 — Student Depression Screener
    Dataset : adilshamim8/student-depression-dataset
              data/raw/mental_health_student.csv  (27901 x 18)
    Input   : academic/lifestyle features (CGPA, academic pressure, sleep...)

  PIPELINE B2 — Working Professional Depression/Burnout Screener   [NEW]
    Dataset : osmi/mental-health-in-tech-survey
              data/raw/mental_health_professional.csv  (~1259 x 27, 2014 survey)
    Input   : workplace features (remote work, company size, benefits,
              work interference, family history, leave policy...)
    Target  : `treatment` (sought mental-health treatment) used as the
              depression/burnout-risk proxy label, since this survey has
              no direct "Depression" column.

Both B1 and B2 are deliberately kept as SEPARATE models with separate
feature schemas and separately-tuned risk thresholds — blending student
academic-stress signal with workplace-burnout signal into one model would
just average away both signals.

Run:
    python train_models.py

Requirements:
    pip install scikit-learn pandas numpy joblib

Version : 4.0.0
"""

import time
import warnings
import json
from pathlib import Path
from itertools import combinations

import numpy as np
import pandas as pd
import joblib

from sklearn.ensemble import (
    RandomForestClassifier,
    GradientBoostingClassifier,
    ExtraTreesClassifier,
    VotingClassifier,
    StackingClassifier,
)
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, LabelEncoder, OrdinalEncoder
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
    brier_score_loss,
    precision_recall_curve,
)
from sklearn.calibration import CalibratedClassifierCV
try:
    from sklearn.calibration import FrozenEstimator
    HAS_FROZEN_ESTIMATOR = True
except ImportError:
    HAS_FROZEN_ESTIMATOR = False
from sklearn.impute import SimpleImputer

warnings.filterwarnings("ignore")

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR   = Path(__file__).parent
DATA_DIR   = BASE_DIR / "data" / "raw"
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(exist_ok=True)

DISEASE_TRAIN_CSV = DATA_DIR / "disease_training.csv"
DISEASE_TEST_CSV  = DATA_DIR / "disease_testing.csv"
DISEASE_EXTRA_CSV = DATA_DIR / "disease_extra.csv"          # dhivyeshrk dataset (optional)
MENTAL_STUDENT_CSV       = DATA_DIR / "mental_health_student.csv"
MENTAL_PROFESSIONAL_CSV  = DATA_DIR / "mental_health_professional.csv"


# ══════════════════════════════════════════════════════════════════════════════
# UTILITY
# ══════════════════════════════════════════════════════════════════════════════

def banner(title: str) -> None:
    w = 70
    print(f"\n{'=' * w}\n  {title}\n{'=' * w}")


def section(title: str) -> None:
    print(f"\n  -- {title} --")


def _make_ensemble(clf1_name, clf1, clf2_name, clf2, stacking=False, task="clf"):
    """Soft-voting or stacking ensemble of two tuned models."""
    estimators = [
        (clf1_name.lower().replace(" ", "_"), clf1),
        (clf2_name.lower().replace(" ", "_"), clf2),
    ]
    if stacking:
        # Stacking with a logistic meta-learner usually yields better-calibrated
        # probabilities than plain soft-voting.
        return StackingClassifier(
            estimators=estimators,
            final_estimator=LogisticRegression(max_iter=1000),
            stack_method="predict_proba",
            n_jobs=1,
            cv=3,
        )
    return VotingClassifier(estimators=estimators, voting="soft", n_jobs=1)


def _get_feature_importances(clf, feature_names):
    if hasattr(clf, "estimators_"):
        for est in clf.estimators_:
            inner = est
            if hasattr(inner, "named_steps"):
                inner = inner.named_steps.get("clf", inner)
            if hasattr(inner, "feature_importances_"):
                return pd.Series(inner.feature_importances_, index=feature_names)
    if hasattr(clf, "feature_importances_"):
        return pd.Series(clf.feature_importances_, index=feature_names)
    return None


def tune_threshold(y_true, y_prob, target_metric="f1"):
    """Pick the probability threshold that maximizes F1 on a PR curve,
    instead of hardcoding 0.5 / 0.35 / 0.65 by guesswork."""
    precision, recall, thresholds = precision_recall_curve(y_true, y_prob)
    f1s = 2 * precision * recall / np.clip(precision + recall, 1e-9, None)
    best_idx = np.nanargmax(f1s[:-1]) if len(thresholds) else 0
    best_thr = thresholds[best_idx] if len(thresholds) else 0.5
    return float(best_thr), float(f1s[best_idx]) if len(thresholds) else 0.0


def find_confusable_disease_clusters(df: pd.DataFrame, symptom_cols: list, target_col: str,
                                     similarity_threshold: float = 0.92) -> list:
    """
    NEW v4.0 — Identifies groups of diseases whose mean symptom vectors are
    nearly identical (cosine similarity above threshold). These are diseases
    the model CANNOT reliably separate given this symptom schema, no matter
    how good the classifier is (this is exactly why Hepatitis subtypes get
    confused in the kaushil268 dataset). Returns a list of disease-name sets.
    """
    profiles = df.groupby(target_col)[symptom_cols].mean()
    names = profiles.index.tolist()
    vecs = profiles.values
    norms = np.linalg.norm(vecs, axis=1, keepdims=True)
    norms[norms == 0] = 1
    unit_vecs = vecs / norms
    sim_matrix = unit_vecs @ unit_vecs.T

    clusters = []
    visited = set()
    for i, j in combinations(range(len(names)), 2):
        if sim_matrix[i, j] >= similarity_threshold:
            pair = {names[i], names[j]}
            merged = False
            for c in clusters:
                if c & pair:
                    c |= pair
                    merged = True
                    break
            if not merged:
                clusters.append(pair)
    return [sorted(c) for c in clusters]


def evaluate_classifier(name: str, model, X_test, y_test,
                         classes=None, binary: bool = False) -> dict:
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
        brier = brier_score_loss(y_test, y_prob[:, 1])
        print(f"    ROC-AUC     : {auc:.4f}")
        print(f"    Brier score : {brier:.4f}  (lower = better calibrated)")
        print(f"\n{classification_report(y_test, y_pred, target_names=['No Depression','Depression'], zero_division=0)}")
        metrics["roc_auc"] = round(auc, 4)
        metrics["brier_score"] = round(brier, 4)

        best_thr, best_f1 = tune_threshold(y_test, y_prob[:, 1])
        print(f"    Tuned threshold (max F1) : {best_thr:.3f}  (F1={best_f1:.4f}, vs F1@0.5 above)")
        metrics["tuned_threshold"] = round(best_thr, 3)
    else:
        n_classes = len(np.unique(y_test))
        k = min(3, n_classes)
        top_k = top_k_accuracy_score(y_test, y_prob, k=k)
        print(f"    Top-{k} Acc   : {top_k:.4f}")
        print(f"\n{classification_report(y_test, y_pred, target_names=classes, zero_division=0)}")
        metrics[f"top{k}_accuracy"] = round(top_k, 4)

    return metrics


def check_data_files() -> dict:
    return {
        "disease": DISEASE_TRAIN_CSV.exists(),
        "disease_extra": DISEASE_EXTRA_CSV.exists(),
        "student": MENTAL_STUDENT_CSV.exists(),
        "professional": MENTAL_PROFESSIONAL_CSV.exists(),
    }


# ══════════════════════════════════════════════════════════════════════════════
# SHARED: generic tuned-ensemble training routine (multi-class or binary)
# ══════════════════════════════════════════════════════════════════════════════

def train_tuned_ensemble(X_train, y_train, candidates: dict, param_grids: dict,
                         scoring: str, cv, n_iter=15, use_stacking=False):
    """Step 1-3 shared by all three pipelines: compare candidates, tune top-2,
    ensemble them, keep whichever scores best."""
    section("Step 1 — Candidate model comparison")
    cv_results = {}
    for name, clf in candidates.items():
        t0 = time.perf_counter()
        scores = cross_val_score(clf, X_train, y_train, cv=cv, scoring=scoring, n_jobs=-1)
        elapsed = time.perf_counter() - t0
        cv_results[name] = scores.mean()
        print(f"    {name:<22}  CV {scoring} = {scores.mean():.4f} +/- {scores.std():.4f}  [{elapsed:.1f}s]")

    section("Step 2 — RandomizedSearchCV on top-2 candidates")
    sorted_cv = sorted(cv_results.items(), key=lambda x: x[1], reverse=True)
    top2_names = [n for n, _ in sorted_cv[:2]]
    print(f"  Tuning: {top2_names}")

    tuned, tuned_scores = {}, {}
    for name in top2_names:
        base_est, grid = param_grids[name]
        search = RandomizedSearchCV(base_est, grid, n_iter=n_iter, cv=cv,
                                    scoring=scoring, n_jobs=-1, random_state=42)
        t0 = time.perf_counter()
        search.fit(X_train, y_train)
        elapsed = time.perf_counter() - t0
        tuned[name] = search.best_estimator_
        tuned_scores[name] = search.best_score_
        print(f"    {name:<22}  Tuned {scoring} = {search.best_score_:.4f}  [{elapsed:.1f}s]")
        print(f"      Best params: {search.best_params_}")

    section("Step 3 — Ensemble (top-2 tuned models)")
    n1, n2 = top2_names
    ensemble = _make_ensemble(n1, tuned[n1], n2, tuned[n2], stacking=use_stacking)
    t0 = time.perf_counter()
    ens_scores = cross_val_score(ensemble, X_train, y_train, cv=cv, scoring=scoring, n_jobs=-1)
    elapsed = time.perf_counter() - t0

    best_tuned_score = max(tuned_scores.values())
    kind = "Stacking" if use_stacking else "Voting"
    print(f"  Best single (tuned) CV {scoring} : {best_tuned_score:.4f}")
    print(f"  {kind} ensemble CV {scoring}      : {ens_scores.mean():.4f} +/- {ens_scores.std():.4f}  [{elapsed:.1f}s]")

    if ens_scores.mean() >= best_tuned_score:
        return ensemble, f"{kind} Ensemble ({n1} + {n2})", ens_scores.mean()
    best_name = max(tuned_scores, key=tuned_scores.get)
    print(f"  -> Ensemble did not improve; using tuned {best_name}")
    return tuned[best_name], best_name, tuned_scores[best_name]


# ══════════════════════════════════════════════════════════════════════════════
# PIPELINE A — DISEASE PREDICTOR
# ══════════════════════════════════════════════════════════════════════════════

def train_disease_pipeline(use_extra: bool = False) -> dict:
    banner("PIPELINE A | Disease Predictor (v4.0)")

    if not DISEASE_TRAIN_CSV.exists():
        raise FileNotFoundError(
            f"Dataset not found at: {DISEASE_TRAIN_CSV}\n"
            "Download from Kaggle: kaushil268/disease-prediction-using-machine-learning"
        )

    print(f"\n  Loading: {DISEASE_TRAIN_CSV}")
    df = pd.read_csv(DISEASE_TRAIN_CSV)
    df = df.loc[:, ~df.columns.str.contains("^Unnamed")]
    df.columns = df.columns.str.strip()
    df["prognosis"] = df["prognosis"].str.strip()

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

    # ── Optional: augment with the richer dhivyeshrk dataset ─────────────────
    if use_extra and DISEASE_EXTRA_CSV.exists():
        section("Augmenting with dhivyeshrk/diseases-and-symptoms-dataset")
        extra = pd.read_csv(DISEASE_EXTRA_CSV)
        extra.columns = extra.columns.str.strip()
        extra_target = "diseases" if "diseases" in extra.columns else extra.columns[-1]
        extra = extra.rename(columns={extra_target: TARGET_COL})
        common_diseases = set(df[TARGET_COL].unique()) & set(extra[TARGET_COL].unique())
        extra = extra[extra[TARGET_COL].isin(common_diseases)]
        for col in SYMPTOM_COLS:
            if col not in extra.columns:
                extra[col] = 0
        extra = extra[SYMPTOM_COLS + [TARGET_COL]]
        df = pd.concat([df, extra], ignore_index=True)
        print(f"  Added {len(extra):,} rows for {len(common_diseases)} overlapping diseases -> {len(df):,} total")
    elif use_extra:
        print(f"  [WARN] use_extra=True but {DISEASE_EXTRA_CSV} not found — skipping augmentation.")

    print(f"  Rows: {len(df):,}  |  Symptom features: {len(SYMPTOM_COLS)}")

    section("Class distribution")
    vc = df[TARGET_COL].value_counts()
    n_classes = vc.shape[0]
    imbalance_ratio = vc.max() / vc.min()
    print(f"  Total classes   : {n_classes}")
    print(f"  Imbalance ratio : {imbalance_ratio:.2f}x  (balanced = 1.0x)")

    # ── NEW v4.0: detect statistically indistinguishable disease clusters ────
    section("Confusable-disease cluster detection (NEW)")
    clusters = find_confusable_disease_clusters(df, SYMPTOM_COLS, TARGET_COL)
    if clusters:
        print("  These disease groups have near-identical symptom signatures")
        print("  in this dataset — the model cannot reliably separate them,")
        print("  and predictions among them should be shown as a CLUSTER,")
        print("  not a single overconfident guess:")
        for c in clusters:
            print(f"    * {' / '.join(c)}")
    else:
        print("  No near-duplicate symptom signatures detected at current threshold.")

    X = df[SYMPTOM_COLS].values.astype(np.float32)
    le = LabelEncoder()
    y  = le.fit_transform(df[TARGET_COL])

    X_trainval, X_test, y_trainval, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    X_train, X_cal, y_train, y_cal = train_test_split(
        X_trainval, y_trainval, test_size=0.15, random_state=42, stratify=y_trainval
    )
    print(f"\n  Train  : {X_train.shape}")
    print(f"  Cal    : {X_cal.shape}")
    print(f"  Test   : {X_test.shape}")

    class_counts = np.bincount(y_train)
    actual_imbalance = class_counts.max() / class_counts.min()
    cw = "balanced" if actual_imbalance > 3.0 else None

    candidates = {
        "Random Forest": RandomForestClassifier(
            n_estimators=300, n_jobs=1, class_weight=cw, random_state=42),
        "Extra Trees": ExtraTreesClassifier(
            n_estimators=300, n_jobs=1, class_weight=cw, random_state=42),
        "Gradient Boosting": GradientBoostingClassifier(
            n_estimators=200, learning_rate=0.1, max_depth=3,
            subsample=0.8, n_iter_no_change=20, random_state=42),
    }
    param_grids = {
        "Random Forest": (
            RandomForestClassifier(n_jobs=1, class_weight=cw, random_state=42),
            {"n_estimators": [200, 400, 600], "max_depth": [None, 20, 40],
             "min_samples_leaf": [1, 2, 4], "max_features": ["sqrt", "log2", 0.3]}),
        "Extra Trees": (
            ExtraTreesClassifier(n_jobs=1, class_weight=cw, random_state=42),
            {"n_estimators": [200, 400, 600], "max_depth": [None, 20, 40],
             "min_samples_leaf": [1, 2, 4], "max_features": ["sqrt", "log2", 0.3]}),
        "Gradient Boosting": (
            GradientBoostingClassifier(n_iter_no_change=20, random_state=42),
            {"n_estimators": [100, 200, 300], "learning_rate": [0.05, 0.1, 0.2],
             "max_depth": [3, 4, 5], "subsample": [0.7, 0.8, 1.0]}),
    }

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    final_clf, final_name, final_cv = train_tuned_ensemble(
        X_train, y_train, candidates, param_grids, scoring="f1_weighted", cv=cv,
    )

    section("Step 4 — Final fit on training set")
    final_clf.fit(X_train, y_train)

    section("Step 5 — Platt calibration on held-out calibration set")
    if HAS_FROZEN_ESTIMATOR:
        calibrated = CalibratedClassifierCV(FrozenEstimator(final_clf), method="sigmoid")
    else:
        calibrated = CalibratedClassifierCV(final_clf, method="sigmoid", cv="prefit")
    calibrated.fit(X_cal, y_cal)

    section("Step 6 — Test set evaluation")
    raw_metrics = evaluate_classifier(f"{final_name} (raw)", final_clf, X_test, y_test, classes=le.classes_)
    cal_metrics = evaluate_classifier(f"{final_name} (calibrated)", calibrated, X_test, y_test, classes=le.classes_)

    section("Step 7 — Top-15 most informative symptoms")
    fi = _get_feature_importances(final_clf, SYMPTOM_COLS)
    if fi is not None:
        for sym, imp in fi.nlargest(15).items():
            print(f"    {sym:<40} {imp:.4f}  {'#' * int(imp * 300)}")

    section("Step 8 — Demo: top-3 prediction with cluster-aware reporting")
    demo_x = X_test[0:1]
    probs = calibrated.predict_proba(demo_x)[0]
    top3_idx = np.argsort(probs)[::-1][:3]
    true_label = le.inverse_transform([y_test[0]])[0]
    print(f"  True label: {true_label}")
    for rank, idx in enumerate(top3_idx, 1):
        disease = le.classes_[idx]
        match = "v" if disease == true_label else " "
        cluster_note = ""
        for c in clusters:
            if disease in c:
                cluster_note = f"   [clinically indistinguishable from: {', '.join(x for x in c if x != disease)}]"
        print(f"    #{rank} {match} {disease:<40}  {probs[idx]*100:5.1f}%{cluster_note}")

    section("Saving artifacts")
    artifacts = {
        "pipeline": calibrated,
        "label_encoder": le,
        "feature_names": SYMPTOM_COLS,
        "classes": le.classes_.tolist(),
        "model_name": final_name,
        "confusable_clusters": clusters,
        "metrics": {**cal_metrics, "cv_f1": round(final_cv, 4),
                    "raw_accuracy": raw_metrics["accuracy"], "raw_f1": raw_metrics["f1_weighted"]},
    }
    out = MODELS_DIR / "disease_pipeline.joblib"
    joblib.dump(artifacts, out, compress=3)
    print(f"  Saved -> {out}")
    return artifacts["metrics"]


# ══════════════════════════════════════════════════════════════════════════════
# PIPELINE B1 — STUDENT DEPRESSION SCREENER
# ══════════════════════════════════════════════════════════════════════════════

def train_student_depression_pipeline() -> dict:
    banner("PIPELINE B1 | Student Depression Screener (v4.0)")

    if not MENTAL_STUDENT_CSV.exists():
        raise FileNotFoundError(
            f"Dataset not found at: {MENTAL_STUDENT_CSV}\n"
            "Download from Kaggle: adilshamim8/student-depression-dataset"
        )

    print(f"\n  Loading: {MENTAL_STUDENT_CSV}")
    df = pd.read_csv(MENTAL_STUDENT_CSV)
    df.columns = df.columns.str.strip()

    TARGET_COL = "Depression"
    for alt in ["depression", "Depression_Status", "label"]:
        if TARGET_COL not in df.columns and alt in df.columns:
            df.rename(columns={alt: TARGET_COL}, inplace=True)

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

    binary_cols = ["Have you ever had suicidal thoughts ?", "Family History of Mental Illness", "Gender"]
    for col in binary_cols:
        if col in df.columns:
            vals_lower = {str(v).strip().lower() for v in df[col].dropna().unique()}
            if vals_lower <= {"yes", "no"}:
                df[col] = df[col].map({"Yes": 1, "No": 0, "yes": 1, "no": 0}).fillna(0)
            elif vals_lower <= {"male", "female"}:
                df[col] = df[col].map({"Male": 1, "Female": 0, "male": 1, "female": 0}).fillna(0)

    FEATURE_COLS = [c for c in df.columns if c != TARGET_COL]
    for col in FEATURE_COLS:
        if df[col].isna().any():
            df[col] = df[col].fillna(df[col].median())

    X = df[FEATURE_COLS].values.astype(np.float32)
    y = df[TARGET_COL].values.astype(np.int32)

    metrics, calibrated, RISK_BANDS = _train_binary_screener(
        X, y, FEATURE_COLS, population_label="student",
        suicidal_col_idx=FEATURE_COLS.index("Have you ever had suicidal thoughts ?")
            if "Have you ever had suicidal thoughts ?" in FEATURE_COLS else None,
    )

    artifacts = {
        "pipeline": calibrated, "feature_names": FEATURE_COLS,
        "population": "student", "risk_bands": RISK_BANDS,
        "classes": ["No Depression", "Depression"],
        "feature_types": {
            "Sleep Duration": {"type": "ordinal", "options": SLEEP_ORDER},
            "Dietary Habits": {"type": "ordinal", "options": ["Unhealthy", "Moderate", "Healthy"]},
            "Gender": {"type": "binary", "options": ["Female", "Male"]},
            "Have you ever had suicidal thoughts ?": {"type": "binary", "options": ["No", "Yes"]},
            "Family History of Mental Illness": {"type": "binary", "options": ["No", "Yes"]},
        },
        "metrics": metrics,
    }
    out = MODELS_DIR / "depression_student_pipeline.joblib"
    joblib.dump(artifacts, out, compress=3)
    print(f"  Saved -> {out}")
    return metrics


# ══════════════════════════════════════════════════════════════════════════════
# PIPELINE B2 — WORKING PROFESSIONAL DEPRESSION/BURNOUT SCREENER  (NEW)
# ══════════════════════════════════════════════════════════════════════════════

def train_professional_depression_pipeline() -> dict:
    banner("PIPELINE B2 | Working Professional Depression/Burnout Screener (v4.0, NEW)")

    if not MENTAL_PROFESSIONAL_CSV.exists():
        raise FileNotFoundError(
            f"Dataset not found at: {MENTAL_PROFESSIONAL_CSV}\n"
            "Download from Kaggle: osmi/mental-health-in-tech-survey"
        )

    print(f"\n  Loading: {MENTAL_PROFESSIONAL_CSV}")
    df = pd.read_csv(MENTAL_PROFESSIONAL_CSV)
    df.columns = df.columns.str.strip()

    TARGET_COL = "treatment"
    if TARGET_COL not in df.columns:
        raise KeyError(f"Expected target column '{TARGET_COL}' not found in {MENTAL_PROFESSIONAL_CSV}")

    DROP_COLS = ["Timestamp", "state", "comments", "Country"]
    df = df.drop(columns=[c for c in DROP_COLS if c in df.columns])

    if "Age" in df.columns:
        df["Age"] = pd.to_numeric(df["Age"], errors="coerce")
        df.loc[(df["Age"] < 15) | (df["Age"] > 90), "Age"] = np.nan
        df["Age"] = df["Age"].fillna(df["Age"].median())

    if "Gender" in df.columns:
        def norm_gender(g):
            g = str(g).strip().lower()
            if g in {"m", "male", "man", "cis male", "cis man"}:
                return "Male"
            if g in {"f", "female", "woman", "cis female", "cis woman"}:
                return "Female"
            return "Other"
        df["Gender"] = df["Gender"].apply(norm_gender)

    df[TARGET_COL] = df[TARGET_COL].astype(str).str.strip().str.lower().map({"yes": 1, "no": 0})
    df = df.dropna(subset=[TARGET_COL])
    df[TARGET_COL] = df[TARGET_COL].astype(int)

    if "work_interfere" in df.columns:
        df["work_interfere"] = df["work_interfere"].fillna("Don't know")

    FEATURE_COLS = [c for c in df.columns if c != TARGET_COL]
    num_cols = list(df[FEATURE_COLS].select_dtypes(include=[np.number]).columns)
    cat_cols = list(df[FEATURE_COLS].select_dtypes(exclude=[np.number]).columns)

    for c in num_cols:
        df[c] = df[c].fillna(df[c].median())
    for c in cat_cols:
        df[c] = df[c].fillna("Unknown").astype(str)

    print(f"  Rows: {len(df):,}  |  Features: {len(FEATURE_COLS)}  ({len(num_cols)} numeric, {len(cat_cols)} categorical)")

    encoder = OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)
    df[cat_cols] = encoder.fit_transform(df[cat_cols])

    X = df[FEATURE_COLS].values.astype(np.float32)
    y = df[TARGET_COL].values.astype(np.int32)

    metrics, calibrated, RISK_BANDS = _train_binary_screener(
        X, y, FEATURE_COLS, population_label="working professional",
        suicidal_col_idx=None,
    )

    artifacts = {
        "pipeline": calibrated, "feature_names": FEATURE_COLS,
        "population": "working_professional", "risk_bands": RISK_BANDS,
        "classes": ["Low Risk", "Elevated Risk"],
        "categorical_encoder": encoder, "categorical_columns": cat_cols,
        "metrics": metrics,
    }
    out = MODELS_DIR / "depression_professional_pipeline.joblib"
    joblib.dump(artifacts, out, compress=3)
    print(f"  Saved -> {out}")
    return metrics


# ══════════════════════════════════════════════════════════════════════════════
# SHARED binary-screener trainer (used by both B1 and B2)
# ══════════════════════════════════════════════════════════════════════════════

def _train_binary_screener(X, y, feature_cols, population_label, suicidal_col_idx=None):
    X_trainval, X_test, y_trainval, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    X_train, X_cal, y_train, y_cal = train_test_split(
        X_trainval, y_trainval, test_size=0.15, random_state=42, stratify=y_trainval
    )
    print(f"\n  [{population_label}] Train: {X_train.shape}  Cal: {X_cal.shape}  Test: {X_test.shape}")

    n_pos, n_neg = y_train.sum(), len(y_train) - y_train.sum()
    imbalance = max(n_pos, n_neg) / max(min(n_pos, n_neg), 1)
    cw_dict = {0: 1.0, 1: float(n_neg / max(n_pos, 1))} if imbalance > 1.5 else None
    print(f"  Imbalance: {imbalance:.2f}x  -> class_weight={cw_dict}")

    candidates = {
        "Gradient Boosting": Pipeline([("clf", GradientBoostingClassifier(
            n_estimators=200, learning_rate=0.05, max_depth=3, subsample=0.8,
            min_samples_leaf=20, n_iter_no_change=20, random_state=42))]),
        "Random Forest": Pipeline([("clf", RandomForestClassifier(
            n_estimators=300, min_samples_leaf=5, n_jobs=1, class_weight=cw_dict, random_state=42))]),
        "Logistic Regression": Pipeline([
            ("scaler", StandardScaler()),
            ("clf", LogisticRegression(C=1.0, max_iter=1000, class_weight="balanced", random_state=42)),
        ]),
    }
    param_grids = {
        "Gradient Boosting": (
            GradientBoostingClassifier(n_iter_no_change=15, random_state=42),
            {"n_estimators": [100, 200, 300], "learning_rate": [0.03, 0.05, 0.1, 0.2],
             "max_depth": [3, 4, 5], "subsample": [0.7, 0.8, 1.0], "min_samples_leaf": [10, 20, 30]}),
        "Random Forest": (
            RandomForestClassifier(n_jobs=1, class_weight=cw_dict, random_state=42),
            {"n_estimators": [200, 400, 600], "max_depth": [None, 10, 20],
             "min_samples_leaf": [2, 5, 10], "max_features": ["sqrt", "log2"]}),
        "Logistic Regression": (
            Pipeline([("scaler", StandardScaler()),
                     ("clf", LogisticRegression(max_iter=2000, class_weight="balanced", random_state=42))]),
            {"clf__C": [0.01, 0.1, 0.5, 1.0, 5.0, 10.0]}),
    }

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    final_clf, final_name, final_cv = train_tuned_ensemble(
        X_train, y_train, candidates, param_grids, scoring="roc_auc", cv=cv,
        use_stacking=True,
    )

    final_clf.fit(X_train, y_train)
    if HAS_FROZEN_ESTIMATOR:
        calibrated = CalibratedClassifierCV(FrozenEstimator(final_clf), method="sigmoid")
    else:
        calibrated = CalibratedClassifierCV(final_clf, method="sigmoid", cv="prefit")
    calibrated.fit(X_cal, y_cal)

    metrics = evaluate_classifier(f"{final_name} (calibrated)", calibrated, X_test, y_test, binary=True)
    metrics["cv_roc_auc"] = round(final_cv, 4)

    fi = _get_feature_importances(final_clf, feature_cols)
    if fi is not None:
        section(f"Feature importances [{population_label}]")
        for feat, imp in fi.sort_values(ascending=False).items():
            print(f"    {feat:<45} {imp:.4f}  {'#' * int(imp * 60)}")

    y_prob_test = calibrated.predict_proba(X_test)[:, 1]
    tuned_thr, _ = tune_threshold(y_test, y_prob_test)
    low_hi  = max(tuned_thr - 0.20, 0.05)
    high_lo = min(tuned_thr + 0.15, 0.95)
    RISK_BANDS = {
        "Low":      (0.00, low_hi, "#22c55e", "No significant risk detected."),
        "Moderate": (low_hi, high_lo, "#f59e0b", "Some indicators present. Consider talking to someone."),
        "High":     (high_lo, 1.01, "#ef4444", "Strong indicators. Please consult a professional."),
    }
    print(f"  Risk bands tuned around F1-optimal threshold {tuned_thr:.3f}: "
          f"Low <{low_hi:.2f}  Moderate <{high_lo:.2f}  High >={high_lo:.2f}")

    return metrics, calibrated, RISK_BANDS


# ══════════════════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════════════════

def main():
    print("\n" + "=" * 72)
    print("  HEALTH & WELLNESS SCREENER -- UNIFIED ML PIPELINE (v4.0)")
    print("=" * 72)

    status = check_data_files()
    missing = [k for k, v in status.items() if not v and k != "disease_extra"]
    if missing:
        print(f"\n  [WARN] Missing required files for: {missing}")
        print("  Required Kaggle datasets:")
        print("    disease       -> kaushil268/disease-prediction-using-machine-learning")
        print("    disease_extra -> dhivyeshrk/diseases-and-symptoms-dataset      (optional augmentation)")
        print("    student       -> adilshamim8/student-depression-dataset")
        print("    professional  -> osmi/mental-health-in-tech-survey            (NEW)")
        print("  Place CSVs under data/raw/ with the filenames at the top of this script.")

    t_start = time.perf_counter()
    results = {}

    if status["disease"]:
        results["disease_predictor"] = train_disease_pipeline(use_extra=status["disease_extra"])
    if status["student"]:
        results["depression_student"] = train_student_depression_pipeline()
    if status["professional"]:
        results["depression_professional"] = train_professional_depression_pipeline()

    total_time = time.perf_counter() - t_start

    banner("PIPELINE SUMMARY")
    summary = {
        "version": "4.0.0",
        "datasets_used": status,
        "results": results,
        "total_training_time_sec": round(total_time, 2),
    }
    print(json.dumps(summary, indent=4, default=str))
    with open(MODELS_DIR / "pipeline_summary.json", "w") as f:
        json.dump(summary, f, indent=4, default=str)

    print(f"\n  Total time : {total_time:.1f}s")
    print("=" * 72 + "\n")


if __name__ == "__main__":
    main()
