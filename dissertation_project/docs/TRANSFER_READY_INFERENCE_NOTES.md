# Transfer-Ready Inference Notes

This phase does not build the web app. It prepares the project so the final artifacts can be transferred into an app later without redesigning the inference logic.

## Tabular Branch
- Source notebook remains frozen:
  - `dissertation_project/notebook_Wisconsin/BreaScope AI.ipynb`
- Frozen artifacts:
  - `dissertation_project/notebook_Wisconsin/model.pt`
  - `dissertation_project/notebook_Wisconsin/scaler.joblib`
- Expected input:
  - the 30 Wisconsin diagnostic features used in `brca.csv`
- Expected output:
  - benign/malignant prediction
  - malignant probability
  - optional MC-dropout uncertainty if exposed later

## Image Branch
- Current main image branch is the corrected patient-level BreaKHis ResNet18 model trained and evaluated through the rebuilt notebook workflow
- Key reports:
  - `dissertation_project/outputs_v2/metrics/breakhis_patient_level_metrics.csv`
  - `dissertation_project/outputs_v2/metrics/breakhis_image_level_metrics.csv`
  - `dissertation_project/outputs_v2/figures/breakhis_patient_confusion_matrix.png`
  - `dissertation_project/outputs_v2/figures/breakhis_patient_roc_curve.png`
  - `dissertation_project/outputs_v2/figures/breakhis_patient_calibration.png`
- Current artifact logic:
  - corrected patient-level split
  - full corrected-split training run with best-checkpoint selection by validation accuracy
  - saved clean checkpoint at `dissertation_project/models/breakhis_resnet18_patient_level_clean.pth`
  - full corrected test-set prediction and patient-level probability aggregation

## Synthetic Fusion Branch
- This branch is exploratory only
- Expected input:
  - a tabular Wisconsin record
  - an image-derived patient embedding record from the corrected BreaKHis branch
- Expected output:
  - synthetic fusion prediction
  - clear disclaimer that the pairing is artificial and not clinically representative

## App Constraints For Later
- The app must repeat the same disclaimer language used in the notebooks and dissertation.
- The app must not present synthetic fusion as a real multimodal clinical model.
- The app can expose:
  - tabular-only mode
  - image-only mode
  - optional synthetic fusion demo mode
- The app should reuse:
  - `model.pt` and `scaler.joblib` for the Wisconsin branch
  - `breakhis_resnet18_patient_level_clean.pth` plus the documented preprocessing settings for the image branch
  - the saved comparison tables and figure manifest for any technical-report view
