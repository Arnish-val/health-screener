"""
Alzheimer's disease screening service.

This adapts the ADNI v4.5 pipeline for one uploaded patient scan: DICOM zip or
NIfTI input -> DMN time series -> 55 Pearson + 55 phase-sync features -> AD/CN.
"""

import math
import os
import shutil
import subprocess
import tempfile
import zipfile
from itertools import combinations
from pathlib import Path
from typing import Optional

import numpy as np
from scipy.signal import hilbert

from app.core.exceptions import PredictionError, ValidationError
from app.schemas.alzheimers import AlzheimersResult, CognitiveResult, FmriResult

REMOVE_VOLUMES = 10
SPHERE_RADIUS = 6
SMOOTHING_FWHM = 5.0
LOW_PASS = 0.1
HIGH_PASS = 0.01
TR_FALLBACK = 3.0
REGISTRATION_TYPE = "SyN"

DMN_REGIONS = {
    "PCC": (-2, -54, 26),
    "vmPFC": (2, 56, 0),
    "amPFC": (1, 55, 26),
    "R_SFG": (17, 35, 58),
    "L_SFG": (-14, 36, 59),
    "R_ITG": (66, -17, -19),
    "L_ITG": (-62, -33, -20),
    "R_PHG": (25, -26, -18),
    "L_PHG": (-22, -26, -21),
    "R_LPC": (54, -61, 36),
    "L_LPC": (-47, -71, 35),
}

ROI_NAMES = list(DMN_REGIONS.keys())
MNI_COORDS_RAS = list(DMN_REGIONS.values())

DOMAIN_MAX = {
    "orientation": 6,
    "memory": 5,
    "attention": 6,
    "language": 3,
    "executive": 5,
    "visuospatial": 5,
}


def _sigmoid(value: float) -> float:
    return 1.0 / (1.0 + math.exp(-value))


def _cognitive_risk(total_score: int) -> float:
    return _sigmoid(-0.8 * (total_score - 26.0))


def score_cognitive(cognitive_scores: dict[str, int]) -> CognitiveResult:
    domains = {}
    total = 0

    for domain, max_score in DOMAIN_MAX.items():
        score = int(cognitive_scores.get(domain, 0))
        score = min(max(score, 0), max_score)
        total += score
        domains[domain] = {
            "score": score,
            "max": max_score,
            "pct": round((score / max_score) * 100, 1),
        }

    return CognitiveResult(
        total_score=total,
        max_score=sum(DOMAIN_MAX.values()),
        probability_ad=round(_cognitive_risk(total), 4),
        domains=domains,
    )


def _safe_extract_zip(zip_path: Path, output_dir: Path) -> None:
    with zipfile.ZipFile(zip_path) as archive:
        for member in archive.infolist():
            target = (output_dir / member.filename).resolve()
            if output_dir.resolve() not in target.parents and target != output_dir.resolve():
                raise ValidationError("Upload zip contains an unsafe file path.")
        archive.extractall(output_dir)


def _detect_tr(nifti_path: Path) -> float:
    import nibabel as nib

    try:
        img = nib.load(str(nifti_path))
        tr = float(img.header.get_zooms()[3])
        if 0.5 <= tr <= 10.0:
            return tr
    except Exception:
        pass
    return TR_FALLBACK


def _uploaded_scan_to_nifti(upload_path: Path, work_dir: Path) -> tuple[Path, str]:
    suffixes = "".join(upload_path.suffixes).lower()
    nifti_dir = work_dir / "nifti"
    nifti_dir.mkdir(parents=True, exist_ok=True)

    if suffixes.endswith(".nii") or suffixes.endswith(".nii.gz"):
        nifti_path = nifti_dir / upload_path.name
        shutil.copy2(upload_path, nifti_path)
        return nifti_path, "nifti"

    dicom_dir = work_dir / "dicom"
    dicom_dir.mkdir(parents=True, exist_ok=True)

    if suffixes.endswith(".zip"):
        _safe_extract_zip(upload_path, dicom_dir)
        source_format = "dicom_zip"
    elif suffixes.endswith(".dcm"):
        shutil.copy2(upload_path, dicom_dir / upload_path.name)
        source_format = "dicom"
    else:
        raise ValidationError("Upload must be a DICOM .zip, .dcm, .nii, or .nii.gz file.")

    if shutil.which("dcm2niix") is None:
        raise PredictionError("DICOM conversion requires dcm2niix on the backend server.")

    cmd = ["dcm2niix", "-z", "y", "-f", "patient_scan", "-o", str(nifti_dir), "-v", "n", str(dicom_dir)]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    nifti_files = sorted(nifti_dir.glob("*.nii.gz")) + sorted(nifti_dir.glob("*.nii"))

    if result.returncode != 0 or not nifti_files:
        raise PredictionError("DICOM to NIfTI conversion failed. Upload a complete DICOM series.")

    return nifti_files[0], source_format


def _extract_adni_features(nifti_path: Path, tmp_dir: Path) -> np.ndarray:
    try:
        import ants
        import nibabel as nib
        import pandas as pd
        import nilearn.masking
        from nilearn import datasets
        from nilearn.image import clean_img, high_variance_confounds, index_img, math_img, mean_img, smooth_img
        from nilearn.maskers import NiftiSpheresMasker
    except ImportError as exc:
        raise PredictionError(
            "Raw fMRI processing requires nibabel, nilearn, scipy, pandas, and antspyx on the backend."
        ) from exc

    os.environ["TMPDIR"] = str(tmp_dir)
    tempfile.tempdir = str(tmp_dir)

    img = nib.load(str(nifti_path))
    if len(img.shape) != 4:
        raise ValidationError("The uploaded scan must be a 4D resting-state fMRI NIfTI.")

    tr = _detect_tr(nifti_path)
    if img.shape[3] > REMOVE_VOLUMES:
        img = index_img(img, slice(REMOVE_VOLUMES, None))
    if img.shape[3] < 20:
        raise ValidationError("The uploaded fMRI has too few usable time volumes.")

    mni_nii = datasets.load_mni152_template(resolution=2)
    mni_mask = datasets.load_mni152_brain_mask(resolution=2)
    mni_nii = math_img("img * mask", img=mni_nii, mask=mni_mask)
    mni_path = tmp_dir / "mni_template.nii.gz"
    mean_path = tmp_dir / "patient_mean.nii.gz"
    nib.save(mni_nii, str(mni_path))
    mean_3d = mean_img(img)
    epi_mask = nilearn.masking.compute_epi_mask(mean_3d)
    mean_3d = math_img("img * mask", img=mean_3d, mask=epi_mask)
    nib.save(mean_3d, str(mean_path))

    mni_ants_img = ants.image_read(str(mni_path))
    mean_ants_img = ants.image_read(str(mean_path))
    reg_result = None

    try:
        reg_result = ants.registration(
            fixed=mni_ants_img,
            moving=mean_ants_img,
            type_of_transform=REGISTRATION_TYPE,
            syn_metric="mattes",
        )

        mni_coords_lps = pd.DataFrame({
            "x": [-coord[0] for coord in MNI_COORDS_RAS],
            "y": [-coord[1] for coord in MNI_COORDS_RAS],
            "z": [coord[2] for coord in MNI_COORDS_RAS],
        })
        native_coords_lps = ants.apply_transforms_to_points(
            dim=3,
            points=mni_coords_lps,
            transformlist=reg_result["fwdtransforms"],
        )
        native_coords_ras = [
            (-float(row.x), -float(row.y), float(row.z))
            for _, row in native_coords_lps.iterrows()
        ]

        img = smooth_img(img, fwhm=SMOOTHING_FWHM)
        confounds = high_variance_confounds(img, n_confounds=5)
        img = clean_img(
            img,
            detrend=True,
            standardize="zscore",
            low_pass=LOW_PASS,
            high_pass=HIGH_PASS,
            confounds=confounds,
            t_r=tr,
            ensure_finite=True,
        )

        masker = NiftiSpheresMasker(
            seeds=native_coords_ras,
            radius=SPHERE_RADIUS,
            t_r=tr,
            standardize=False,
        )
        ts = masker.fit_transform(img)
        if ts.shape[1] != len(ROI_NAMES):
            raise PredictionError(f"Expected {len(ROI_NAMES)} ROIs, got {ts.shape[1]}.")

        corr = np.corrcoef(ts.T)[np.triu_indices(ts.shape[1], k=1)]
        phase = np.angle(hilbert(ts, axis=0))
        sync = [
            np.abs(np.mean(np.exp(1j * (phase[:, i] - phase[:, j]))))
            for i, j in combinations(range(ts.shape[1]), 2)
        ]
        features = np.nan_to_num(np.concatenate([corr, sync]), nan=0.0, posinf=0.0, neginf=0.0)
        if features.shape[0] != 110:
            raise PredictionError(f"Expected 110 ADNI features, got {features.shape[0]}.")
        return features
    finally:
        if reg_result:
            for key in ("fwdtransforms", "invtransforms"):
                for transform_path in reg_result.get(key, []):
                    try:
                        Path(transform_path).unlink(missing_ok=True)
                    except Exception:
                        pass


def _predict_fmri(features: np.ndarray, model, scaler, source_format: str) -> FmriResult:
    if model is None:
        raise PredictionError("Alzheimer's AD/CN model is not loaded.")

    x = features.reshape(1, -1)
    expected = getattr(model, "n_features_in_", None)
    if expected is not None and int(expected) != x.shape[1]:
        raise PredictionError(f"Loaded Alzheimer's model expects {expected} features, but ADNI pipeline produced 110.")

    x_model = scaler.transform(x) if scaler is not None else x
    pred = int(model.predict(x_model)[0])

    decision_score: Optional[float] = None
    if hasattr(model, "predict_proba"):
        probabilities = model.predict_proba(x_model)[0]
        classes = list(getattr(model, "classes_", [0, 1]))
        ad_index = classes.index(1) if 1 in classes else len(probabilities) - 1
        probability_ad = float(probabilities[ad_index])
    elif hasattr(model, "decision_function"):
        decision_score = float(model.decision_function(x_model)[0])
        probability_ad = _sigmoid(decision_score)
    else:
        probability_ad = 1.0 if pred == 1 else 0.0

    return FmriResult(
        prediction="AD" if pred == 1 else "CN",
        probability_ad=round(probability_ad, 4),
        decision_score=round(decision_score, 4) if decision_score is not None else None,
        n_features_used=int(x.shape[1]),
        source_format=source_format,
    )


def predict_alzheimers(
    upload_path: Optional[Path],
    cognitive_scores: dict[str, int],
    model,
    scaler=None,
) -> AlzheimersResult:
    cognitive = score_cognitive(cognitive_scores)
    fmri = None

    if upload_path is not None:
        with tempfile.TemporaryDirectory(prefix="alz_upload_") as tmp:
            work_dir = Path(tmp)
            nifti_path, source_format = _uploaded_scan_to_nifti(upload_path, work_dir)
            features = _extract_adni_features(nifti_path, work_dir)
            fmri = _predict_fmri(features, model=model, scaler=scaler, source_format=source_format)

    if fmri is not None:
        combined_risk = 0.6 * fmri.probability_ad + 0.4 * cognitive.probability_ad
    else:
        combined_risk = cognitive.probability_ad

    if combined_risk >= 0.70:
        risk_level = "High"
        risk_color = "#ef4444"
        recommendation = "Elevated AD indicators detected. Review these results with a neurologist."
    elif combined_risk >= 0.40:
        risk_level = "Moderate"
        risk_color = "#f59e0b"
        recommendation = "Some AD risk indicators are present. Consider a clinical follow-up."
    else:
        risk_level = "Low"
        risk_color = "#10b981"
        recommendation = "The combined screening indicates low AD risk based on the provided inputs."

    return AlzheimersResult(
        combined_risk=round(combined_risk, 4),
        risk_level=risk_level,
        risk_color=risk_color,
        recommendation=recommendation,
        cognitive=cognitive,
        fmri=fmri,
        weights={"fmri": 0.6 if fmri is not None else 0.0, "cognitive": 0.4 if fmri is not None else 1.0},
    )
