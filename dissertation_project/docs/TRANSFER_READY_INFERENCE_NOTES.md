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
- Current defendable image branch is the corrected patient-level BreaKHis embedding baseline
- Key reports:
  - `dissertation_project/outputs_v2/metrics/breakhis_patient_metrics.csv`
  - `dissertation_project/outputs_v2/figures/breakhis_patient_confusion_matrix.png`
  - `dissertation_project/outputs_v2/figures/breakhis_patient_calibration.png`
- Current artifact logic:
  - sampled BreaKHis images
  - frozen ResNet18 embedding extraction
  - patient-level embedding aggregation
  - logistic regression prediction

## Synthetic Fusion Branch
- This branch is exploratory only
- Expected input:
  - a tabular record
  - an image-derived embedding record
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
