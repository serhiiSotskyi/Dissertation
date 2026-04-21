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

### Lightweight image baseline via frozen ResNet18 embeddings
- Method decision: use a frozen ImageNet-pretrained ResNet18 backbone to extract embeddings from sampled BreaKHis images, then aggregate to patient level and classify with logistic regression
- What was implemented: one sampled image per patient per magnification, embedding extraction, patient-level averaging, logistic regression classifier
- Why it was chosen: substantially cheaper than full fine-tuning on the local machine while still producing a usable patient-level image baseline
- Source: standard transfer-learning practice in medical image classification; ResNet18 backbone available locally through torchvision
- Adaptation note: this is a pragmatic dissertation implementation choice motivated by local compute limits

### Clean corrected BreaKHis training run
- Method decision: train a clean ResNet18 baseline on the full corrected patient-level split and keep the best epoch by validation accuracy
- What was implemented: a full-split augmented training run with best-checkpoint selection by validation accuracy, followed by corrected full-test evaluation
- Why it was chosen: provides a genuinely new image-model result that does not rely on the initial image-level comparator and removes the earlier compromise of sampled-only training
- Source: standard supervised image-classification training practice with holdout validation model selection
- Adaptation note: the run was intentionally stopped once later epochs were clearly degrading validation performance; the selected artifact is the best saved checkpoint, not the last epoch

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
- What was implemented: confusion matrices, Brier score, expected calibration error, ROC curve, magnification-level analysis, and a saved false-negative/false-positive review panel for the corrected BreaKHis model
- Why it was chosen: supports a stronger dissertation argument than accuracy alone
- Source: standard classification evaluation practice and medical-AI safety motivation
- Adaptation note: use only where model probabilities are available and stable

### Random-pairing control
- Method decision: include random synthetic pairing as a control condition
- What was implemented: repeated random pair construction across multiple seeds and direct comparison against same-label pairing
- Why it was chosen: prevents synthetic same-label fusion results from being interpreted without a baseline for artificially broken correspondence
- Source: methodological control principle for synthetic experimental designs
- Adaptation note: this control is central to the dissertation defense because the paired data is manufactured

### Early vs late fusion comparison
- Method decision: compare concatenated-feature early fusion with probability-level late fusion under the same synthetic pairing conditions
- What was implemented: repeated-seed evaluation of tabular-only, image-only, early-fusion, and late-fusion logistic baselines on same-label and random controls
- Why it was chosen: allows the dissertation to discuss whether the apparent multimodal gain comes from richer joint features or simply from ensembling already-strong unimodal signals
- Source: common multimodal evaluation practice using early- and decision-level fusion baselines
- Adaptation note: the late-fusion implementation averages probabilities from separate tabular and image logistic models for interpretability and speed

### Joint monomodel vs fusion analysis
- Method decision: dedicate a notebook to comparing both monomodels against the synthetic fusion results under one consistent frame
- What was implemented: cross-model comparison table, family-level plots, and synthesis notes separating main results from exploratory claims
- Why it was chosen: the dissertation question is comparative, not only descriptive, so the final analysis must explicitly answer what each branch contributes
- Source: dissertation design requirement and standard comparative experimental reporting
- Adaptation note: Wisconsin metrics are taken from the frozen published branch, while BreaKHis and fusion metrics come from the rebuilt notebook workflow
