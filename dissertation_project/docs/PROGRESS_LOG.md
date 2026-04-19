# Progress Log

## 2026-04-19

### Grounding completed
- Audited the BreaKHis notebooks and found patient leakage in the original random image-level split.
- Verified the Wisconsin branch exists locally with notebook, dataset, saved model, and scaler.
- Confirmed the Wisconsin branch must remain untouched.
- Inspected the report template documents under `dissertation_project/paper template/`.

### Structural work completed
- Added reusable source modules under `dissertation_project/src/` for:
  - BreaKHis patient-level parsing and splitting
  - metrics and plotting
  - synthetic pairing construction
  - later inference reuse
- Added project documentation scaffold under `dissertation_project/docs/`.
- Added a clean notebook track under `dissertation_project/notebooks_v2/`.

### Experimental work completed
- Generated a patient-level BreaKHis split with zero overlap across train/validation/test.
- Exported patient-level split CSVs into `dissertation_project/outputs_v2/reports/`.
- Built a corrected lightweight image baseline using frozen ResNet18 image embeddings aggregated to patient level.
- Saved corrected image metrics and figures into `dissertation_project/outputs_v2/`.
- Exported read-only Wisconsin branch summary artifacts into `dissertation_project/outputs_v2/reports/`.
- Ran repeated-seed synthetic pairing experiments for:
  - same-label pairing
  - random pairing control
  - tabular-only baseline on the synthetic experiment frame
  - image-only baseline on the synthetic experiment frame
  - early fusion on the synthetic experiment frame
- Saved synthetic fusion metrics and summaries into `dissertation_project/outputs_v2/metrics/`.
- Added `TRANSFER_READY_INFERENCE_NOTES.md` to document how the current artifacts should move into a later demo app without redesign.

### Pending next actions
- Review and package transfer-ready inference notes for later app work
- Add additional figures/tables if needed for dissertation writing
- Commit and push the next major milestone once outputs and notebooks are staged cleanly
