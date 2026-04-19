# New Dissertation Proposal

## Working Title
Lightweight Multimodal Breast Cancer Recurrence Prediction Using Clinical Data, Hyperspectral Imaging, and ROI-Level Histopathology Features

## Problem Statement
Many breast cancer AI studies rely on a single modality and report strong internal performance, but they often do not reflect the way clinicians assess recurrence risk in practice. Histopathology, spectral tissue characteristics, and patient clinical information each capture different aspects of disease biology. The challenge is that true matched multimodal datasets are rare, computationally expensive to process, and often too small for large end-to-end deep learning pipelines. This dissertation therefore focuses on a realistic question: whether a lightweight multimodal system built from matched patient data can provide meaningful predictive value for breast cancer recurrence without requiring full-scale whole-slide or raw hyperspectral deep learning.

## Aim
To develop and evaluate a feasible multimodal breast cancer recurrence prediction system using matched clinical variables, hyperspectral imaging features, and limited ROI-level histopathology features from the HistologyHSI-BC-Recurrence dataset.

## Objectives
1. Build a clinical-only baseline recurrence prediction model.
2. Build an HSI-only recurrence prediction model using compact spectral and texture features.
3. Build a histology-only recurrence prediction model using ROI-level image embeddings rather than full whole-slide training.
4. Build a late-fusion multimodal model combining the available patient-level modality features.
5. Compare unimodal and multimodal models using patient-level evaluation.
6. Analyse calibration, uncertainty, and error behaviour, especially false negatives.
7. Evaluate robustness when one modality is missing or excluded.

## Research Questions
1. Can a lightweight multimodal model improve breast cancer recurrence prediction compared with unimodal baselines on matched patient data?
2. Which modality contributes most to predictive performance and calibration?
3. Does multimodal fusion improve clinically relevant error behaviour, especially reduction of false negatives?
4. Is a resource-constrained feature-based multimodal pipeline a viable alternative to computationally heavy end-to-end multimodal deep learning?

## Dataset
The dissertation will use the HistologyHSI-BC-Recurrence dataset hosted by TCIA.

- 47 patients
- 22 recurrence cases
- 25 non-recurrence cases
- matched clinical data
- 677 hyperspectral captures
- 47 histopathology WSIs with tissue and ROI annotations

Source:
- https://www.cancerimagingarchive.net/collection/histologyhsi-bc-recurrence/
- https://github.com/HIRIS-Lab/HistologyHSI-BC-Recurrence

## Methodology
### Clinical branch
- Load the standardized clinical spreadsheet.
- Clean, encode, and scale features.
- Use a simple classifier such as logistic regression and a tree-based baseline.

### HSI branch
- Avoid raw 3D CNN training.
- Use ENVI cubes from selected patient captures.
- Extract compact per-capture features:
  - mean calibrated spectrum
  - standard deviation spectrum
  - PCA-reduced spectral features
  - simple texture statistics from synthetic RGB or selected bands
- Aggregate capture-level features to patient-level features.

### Histology branch
- Avoid full WSI training.
- Use only ROI-linked regions corresponding to HSI capture annotations.
- Export small histology crops from the annotated WSI regions.
- Use a pretrained CNN as a frozen feature extractor.
- Aggregate crop embeddings to patient-level features.

### Fusion
- Use late fusion at patient level.
- Concatenate modality features after independent preprocessing.
- Train a lightweight final classifier such as logistic regression, SVM, or XGBoost.

### Evaluation
- Patient-level only.
- Prefer leave-one-out cross-validation or repeated stratified cross-validation due to the small cohort.
- Report:
  - ROC-AUC
  - F1-score
  - sensitivity
  - specificity
  - balanced accuracy
  - confusion matrix
  - Brier score
  - calibration curve / ECE if feasible

### Robustness
- Compare:
  - clinical-only
  - HSI-only
  - histology-only
  - clinical + HSI
  - clinical + histology
  - HSI + histology
  - clinical + HSI + histology
- Run missing-modality ablation where possible.

## Expected Contribution
This dissertation does not aim to build a full-scale end-to-end multimodal foundation model. Its contribution is different and more defensible under tight computational constraints:

- a true matched-patient multimodal recurrence study
- a lightweight practical multimodal pipeline
- a comparison of unimodal and multimodal value
- analysis of calibration and clinically important errors
- a demonstration that dissertation-level multimodal research can be done without full 1.2 TB processing or heavy end-to-end training

## Scope Decision
The guaranteed deliverable is a clinical + HSI multimodal recurrence pipeline.

The histology branch is in scope and intended, but it is dependent on local availability of ROI-level image data after selective download. If raw WSI handling proves too slow, the dissertation remains valid with clinical + HSI multimodal fusion plus a documented histology feasibility section.
