# Progress Log

## 2026-04-19

### Grounding completed
- Audited the BreaKHis notebooks and found patient leakage in the original random image-level split.
- Verified the Wisconsin branch exists locally with notebook, dataset, saved model, and scaler.
- Confirmed the Wisconsin branch must remain untouched.
- Inspected the report template documents under `dissertation_project/paper template/`.

### Structural work completed
- Extended reusable source modules under `dissertation_project/src/` for:
  - BreaKHis patient-level parsing and leakage auditing
  - dataloaders, training, checkpoint selection, and prediction
  - metrics, ROC, calibration, and comparison plotting
  - synthetic pairing construction and repeated-seed fusion evaluation
  - later inference reuse
- Rebuilt `dissertation_project/notebooks_v2/` into an executed 11-notebook research sequence:
  - `01_scope_and_research_questions.ipynb`
  - `02_breakhis_dataset_exploration.ipynb`
  - `03_breakhis_split_audit_and_patient_leakage.ipynb`
  - `04_breakhis_preprocessing_and_dataloaders.ipynb`
  - `05_breakhis_model_development.ipynb`
  - `06_breakhis_evaluation_and_error_analysis.ipynb`
  - `07_wisconsin_branch_review_and_integration.ipynb`
  - `08_synthetic_pairing_design.ipynb`
  - `09_fusion_experiments.ipynb`
  - `10_model_comparison_and_joint_analysis.ipynb`
  - `11_results_synthesis_and_defense_pack.ipynb`

### Experimental work completed
- Executed all rebuilt notebooks top-to-bottom with the `dissertation_dl` kernel so outputs are embedded in place.
- Generated BreaKHis exploratory outputs:
  - class and magnification summaries
  - image-size summary
  - sample mosaics
  - colour summary
- Audited the old image-level split and proved leakage, then exported corrected patient-level split CSVs.
- Built preprocessing and dataloaders for the corrected split, then escalated the image branch to a maximum full-split pass.
- Ran corrected model development on the full patient-level split:
  - legacy frozen-feature reference on the full corrected split
  - clean augmented full-split training run with best-checkpoint selection by validation accuracy
- Saved development outputs including:
  - `breakhis_model_development_runs.csv`
  - `breakhis_patient_history.csv`
  - `breakhis_patient_history.png`
  - `breakhis_run_a_history.png`
  - `breakhis_model_development_comparison.png`
- Evaluated the corrected BreaKHis model on the holdout set and saved:
  - image-level metrics
  - patient-level metrics
  - magnification-level metrics
  - ROC, calibration, confusion-matrix, and error-panel figures
- Exported Wisconsin review artifacts and an integration contract without modifying the frozen branch.
- Ran synthetic same-label and random-pairing analyses with repeated seeds.
- Saved repeated-seed fusion outputs for:
  - tabular-only
  - image-only
  - early fusion
  - late fusion
- Built the joint comparison notebook and final defense pack, including:
  - `joint_model_comparison.csv`
  - `figure_manifest.csv`
  - `defense_claims.csv`
  - dissertation-ready comparison figures

### Pending next actions
- Draft the dissertation chapters from the rebuilt notebook and figure pack
- Add any extra narrative figures if the written dissertation needs more visual support
