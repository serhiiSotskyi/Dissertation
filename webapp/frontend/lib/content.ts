export type NotebookDefinition = {
  slug: string;
  title: string;
  filename: string;
  summary: string;
  purpose: string;
  findings: string[];
  figures: Array<{ name: string; caption: string }>;
  emptyStateNote?: string;
};

export const featureGroups = [
  {
    title: "Morphology Means",
    fields: [
      "x.radius_mean",
      "x.texture_mean",
      "x.perimeter_mean",
      "x.area_mean",
      "x.smoothness_mean",
      "x.compactness_mean",
      "x.concavity_mean",
      "x.concave_pts_mean",
      "x.symmetry_mean",
      "x.fractal_dim_mean",
    ],
  },
  {
    title: "Morphology Standard Errors",
    fields: [
      "x.radius_se",
      "x.texture_se",
      "x.perimeter_se",
      "x.area_se",
      "x.smoothness_se",
      "x.compactness_se",
      "x.concavity_se",
      "x.concave_pts_se",
      "x.symmetry_se",
      "x.fractal_dim_se",
    ],
  },
  {
    title: "Worst-Case Morphology",
    fields: [
      "x.radius_worst",
      "x.texture_worst",
      "x.perimeter_worst",
      "x.area_worst",
      "x.smoothness_worst",
      "x.compactness_worst",
      "x.concavity_worst",
      "x.concave_pts_worst",
      "x.symmetry_worst",
      "x.fractal_dim_worst",
    ],
  },
];

export const notebooks: NotebookDefinition[] = [
  {
    slug: "scope-and-research-questions",
    title: "01 Scope And Research Questions",
    filename: "01_scope_and_research_questions.ipynb",
    summary: "Frames the dissertation around tabular baseline evaluation, image-model development, and synthetic multimodal experimentation under explicit non-clinical constraints.",
    purpose: "Define the study scope, central research questions, and the boundaries around exploratory multimodal claims.",
    findings: [
      "The Wisconsin branch is used as the tabular baseline for comparison.",
      "The BreaKHis build is the main image contribution.",
      "Synthetic fusion is positioned as exploratory methodology, not clinical evidence.",
    ],
    figures: [],
    emptyStateNote:
      "This notebook defines the study scope, the main research questions, and the project claim boundaries, so the key output is the notebook narrative rather than standalone figures.",
  },
  {
    slug: "breakhis-dataset-exploration",
    title: "02 BreaKHis Dataset Exploration",
    filename: "02_breakhis_dataset_exploration.ipynb",
    summary: "Audits class balance, magnification coverage, image size variation, and sample appearance before training the image branch.",
    purpose: "Establish an empirical understanding of the BreaKHis binary dataset and surface practical preprocessing constraints.",
    findings: [
      "The dataset spans multiple magnifications and heterogeneous staining appearances.",
      "Image dimensions and colour distributions vary enough to justify careful normalization.",
      "Exploration outputs anchor later preprocessing and augmentation decisions.",
    ],
    figures: [
      { name: "breakhis_class_magnification_counts.png", caption: "Class and magnification distribution across the BreaKHis workflow." },
      { name: "breakhis_sample_mosaic.png", caption: "Representative sample mosaic used to ground the visual variability of the image branch." },
    ],
  },
  {
    slug: "split-audit-and-patient-leakage",
    title: "03 Split Audit And Patient Leakage",
    filename: "03_breakhis_split_audit_and_patient_leakage.ipynb",
    summary: "Demonstrates leakage in the naive image-level split and motivates the patient-level evaluation protocol.",
    purpose: "Prove why patient-level separation is necessary before reporting any image-model result.",
    findings: [
      "Naive image-level splitting leaks patient information across train and test.",
      "The patient-level split materially changes the credibility of downstream metrics.",
      "Leakage auditing becomes a first-class part of the dissertation narrative.",
    ],
    figures: [
      { name: "breakhis_leakage_audit.png", caption: "Leakage evidence that motivates the patient-level protocol." },
    ],
  },
  {
    slug: "preprocessing-and-dataloaders",
    title: "04 Preprocessing And Dataloaders",
    filename: "04_breakhis_preprocessing_and_dataloaders.ipynb",
    summary: "Builds reproducible transforms, loaders, and normalization choices around the patient-level split.",
    purpose: "Translate the audited dataset into a stable image-processing pipeline ready for model development.",
    findings: [
      "BreakHis-specific normalization is tracked explicitly rather than assumed.",
      "Augmentation is controlled and lightweight instead of visually extreme.",
      "The preprocessing pipeline is structured for reuse in later inference.",
    ],
    figures: [
      { name: "breakhis_augmented_batch_examples.png", caption: "Examples from the final augmentation and preprocessing pipeline." },
      { name: "breakhis_normalisation_comparison.png", caption: "Comparison view for the normalization choices considered in the workflow." },
    ],
  },
  {
    slug: "model-development",
    title: "05 Model Development",
    filename: "05_breakhis_model_development.ipynb",
    summary: "Compares image-branch development runs and saves the patient-level ResNet18 checkpoint used by the app.",
    purpose: "Identify the most credible image model configuration for transfer-ready inference.",
    findings: [
      "The final patient-level model is selected from the development sequence.",
      "Best-checkpoint selection is based on validation behaviour under the patient-level split.",
      "The saved clean checkpoint becomes the app-facing image artifact.",
    ],
    figures: [
      { name: "breakhis_model_development_comparison.png", caption: "Comparison of the image-model development runs." },
      { name: "breakhis_run_a_history.png", caption: "Training history for one development run in the final pipeline." },
      { name: "breakhis_run_b_history.png", caption: "Training history for the alternate development run." },
    ],
  },
  {
    slug: "evaluation-and-error-analysis",
    title: "06 Evaluation And Error Analysis",
    filename: "06_breakhis_evaluation_and_error_analysis.ipynb",
    summary: "Evaluates the patient-level image model with ROC, calibration, confusion, magnification, and failure analysis outputs.",
    purpose: "Produce the test-set evidence used throughout the written dissertation and web application.",
    findings: [
      "Patient-level performance remains credible under the leakage-safe split.",
      "Calibration and error analysis are surfaced alongside accuracy and ROC rather than hidden.",
      "Magnification-specific behaviour is examined instead of assuming uniform performance.",
    ],
    figures: [
      { name: "breakhis_patient_roc_curve.png", caption: "Patient-level ROC curve for the image branch." },
      { name: "breakhis_patient_calibration.png", caption: "Calibration plot for the patient-level model." },
      { name: "breakhis_patient_confusion_matrix.png", caption: "Patient-level confusion matrix for the holdout evaluation." },
      { name: "breakhis_error_panel.png", caption: "Selected failure cases used in the error analysis discussion." },
      { name: "breakhis_magnification_roc_auc.png", caption: "Magnification-specific ROC/AUC view for the image branch." },
    ],
  },
  {
    slug: "wisconsin-review-and-integration",
    title: "07 Wisconsin Review And Integration",
    filename: "07_wisconsin_branch_review_and_integration.ipynb",
    summary: "Reviews the Wisconsin branch, documents its transfer contract, and aligns it with the image-side app integration.",
    purpose: "Prepare the tabular baseline for safe reuse without altering the original notebook or artifacts.",
    findings: [
      "Its input contract is made explicit for downstream app integration.",
      "The tabular branch is treated as a baseline and comparison anchor.",
    ],
    figures: [],
    emptyStateNote:
      "This notebook documents how the tabular workflow is reused in the application, so the main value is the integration contract and raw notebook rather than figure output.",
  },
  {
    slug: "synthetic-pairing-design",
    title: "08 Synthetic Pairing Design",
    filename: "08_synthetic_pairing_design.ipynb",
    summary: "Constructs the synthetic pairing logic used to test fusion strategies across independent unimodal datasets.",
    purpose: "Define how same-label and random pairing experiments are constructed while preserving the project’s non-clinical framing.",
    findings: [
      "Pairings are explicitly synthetic and should never be interpreted as patient-level multimodal truth.",
      "Same-label and random strategies are both retained for comparison.",
      "The pairing process is auditable and reproducible across seeds.",
    ],
    figures: [
      { name: "synthetic_pairing_design_summary.png", caption: "Visual summary of the synthetic pairing design used for the fusion experiments." },
    ],
  },
  {
    slug: "fusion-experiments",
    title: "09 Fusion Experiments",
    filename: "09_fusion_experiments.ipynb",
    summary: "Runs exploratory early- and late-fusion experiments on synthetic pairings and benchmarks them against unimodal baselines.",
    purpose: "Evaluate whether synthetic pairings can still support useful fusion-method comparisons under data scarcity.",
    findings: [
      "Fusion outputs are reported as exploratory only.",
      "Repeated-seed evaluation surfaces stability rather than relying on a single run.",
      "The experiments are retained for comparison while keeping the claim boundary explicit.",
    ],
    figures: [
      { name: "fusion_experiment_comparison.png", caption: "Comparison of synthetic fusion experiment families across pairing strategies." },
    ],
  },
  {
    slug: "model-comparison-and-joint-analysis",
    title: "10 Model Comparison And Joint Analysis",
    filename: "10_model_comparison_and_joint_analysis.ipynb",
    summary: "Brings the tabular, image, and synthetic-fusion branches into one comparison space for the final dissertation analysis.",
    purpose: "Create the cross-model evidence tables and figures used to explain the strengths and limits of each branch.",
    findings: [
      "The tabular branch remains the strongest benchmark numerically.",
      "The image branch provides the main new contribution.",
      "Synthetic fusion comparisons are kept visible but carefully caveated.",
    ],
    figures: [
      { name: "joint_model_accuracy_comparison.png", caption: "High-level accuracy comparison between the model families." },
      { name: "joint_model_roc_auc_comparison.png", caption: "ROC/AUC comparison across unimodal and exploratory synthetic-fusion branches." },
    ],
  },
  {
    slug: "results-synthesis-and-defense-pack",
    title: "11 Results Synthesis And Defense Pack",
    filename: "11_results_synthesis_and_defense_pack.ipynb",
    summary: "Packages the core dissertation claims, defense figures, and final synthesis outputs for written delivery and presentation.",
    purpose: "Provide the final narrative layer that turns the research workflow into a defendable dissertation artifact set.",
    findings: [
      "The final pack distills the project into a concise claim set.",
      "Figures and tables are curated for communication rather than exploration alone.",
      "The web experience can reuse this notebook as its top-level narrative anchor.",
    ],
    figures: [
      { name: "breakhis_patient_history.png", caption: "Patient-level training history included in the defense-facing synthesis outputs." },
    ],
  },
  {
    slug: "demo-preset-generation",
    title: "12 Demo Preset Generation",
    filename: "12_demo_preset_generation.ipynb",
    summary: "Generates the traceable preset manifest used by the web app for tabular, image, and synthetic-fusion demo cases.",
    purpose: "Create auditable demo inputs without hard-coding preset data directly inside the application.",
    findings: [
      "Tabular presets reuse the existing BreaScope AI profile values and validate them against Wisconsin feature ranges.",
      "Image presets cover each binary BreaKHis label and magnification using real held-out examples.",
      "Fusion presets are explicitly synthetic story cases with recorded probability construction.",
    ],
    figures: [],
    emptyStateNote:
      "This notebook writes JSON and CSV preset artifacts for the app, so its main outputs are reports rather than figures.",
  },
];
