# Methodology References

Use this file as the traceability log for all important methodological decisions.

## Format
For each method, record:

- Method decision
- What was implemented
- Why it was chosen
- Source
- Adaptation note

## Entries

### Patient-level splitting for BreaKHis
- Method decision: split by patient identifier instead of image-level random split
- What was implemented: derive patient IDs from filenames and split patients, not images
- Why it was chosen: avoids train/test leakage caused by multiple images from the same patient appearing in different subsets
- Source: BreaKHis dataset naming convention and standard leakage-avoidance practice in medical imaging
- Adaptation note: implemented directly from filename structure in this repo

### Frozen Wisconsin branch
- Method decision: reuse the published Wisconsin notebook and artifacts unchanged
- What was implemented: read-only integration and documentation only
- Why it was chosen: user explicitly required this branch to remain untouched
- Source: project constraint from user and local artifact inspection
- Adaptation note: downstream notebooks may summarize but not rewrite the original branch

### Synthetic label-aligned pairing
- Method decision: pair benign tabular samples with benign image samples and malignant with malignant for exploratory fusion only
- What was implemented: same-label pairing plus random-pairing control and repeated seeds
- Why it was chosen: true matched multimodal data was not adopted as the main dissertation path due feasibility constraints; controls are required to keep the experiment intellectually honest
- Source: dissertation design decision for constrained multimodal experimentation
- Adaptation note: must always be described as artificial and non-clinical

### Calibration and error analysis
- Method decision: report calibration and false-negative behavior alongside headline metrics where feasible
- What was implemented: planned confusion matrices, Brier score, and calibration plots for new image/fusion outputs
- Why it was chosen: supports a more defendable dissertation argument than accuracy alone
- Source: standard classification evaluation practice and medical-AI safety motivation
- Adaptation note: use only where model probabilities are available and stable

