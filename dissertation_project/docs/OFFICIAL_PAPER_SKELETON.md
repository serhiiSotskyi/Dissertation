# Official Paper Skeleton

This skeleton is mapped to the structure found in:

- `dissertation_project/paper template/CMU601 Report Structure.docx`
- `dissertation_project/paper template/2324 - Report Template.docx`

It is a writing guide, not the final dissertation.

## Title Page
- Final title should foreground synthetic multimodal pairing and data scarcity.
- Candidate title:
  `Exploring Synthetic Label-Aligned Multimodal Fusion for Breast Cancer Classification Under Data Scarcity`

## Acknowledgements
- Supervisors
- institution
- datasets and tooling support

## Table of Content
- auto-generated later in Word

## List of Figures
- populated after figure export

## List of Tables
- populated after table export

## Glossary
- BreaKHis
- WDBC / Wisconsin Diagnostic
- ROC-AUC
- F1-score
- calibration
- synthetic pairing
- early fusion
- late fusion

## Abstract
- problem: matched multimodal datasets are scarce
- approach: preserve tabular model, rebuild image model, test synthetic label-aligned pairing
- results: summarize unimodal baselines and fusion behavior
- conclusion: exploratory framework only, not clinical validity

## 1. Introduction
### 1.1 Introduction
- introduce breast cancer AI and multimodal motivation

### 1.2 Motivation
- true multimodal datasets are scarce and impractical in small dissertation settings

### 1.3 Background
- image-based classification
- tabular diagnostic modelling
- multimodal fusion interest

### 1.4 Problem overview
- independent datasets cannot directly support real multimodal learning
- need a defensible exploratory alternative

### 1.5 Research aims
- build strong unimodal baselines
- explore synthetic label-aligned pairing for fusion

### 1.6 Research questions
- can synthetic label-aligned pairing serve as a useful exploratory framework for multimodal fusion evaluation?
- how do unimodal baselines compare?
- do fusion methods outperform controls?

### 1.7 Proposed solution
- frozen Wisconsin branch
- patient-level BreaKHis rebuild
- same-label and random-pairing synthetic experiments

### 1.8 Dissertation structure
- map chapter flow briefly

### 1.9 Conclusion
- close chapter

## 2. Literature Review
- multimodal breast cancer AI
- breast histopathology classification
- tabular diagnostic models
- data scarcity and surrogate multimodal strategies
- calibration and safety-oriented evaluation
- end with gap analysis supporting this dissertation

## 3. Research Methodologies
- justify quantitative experimental methodology
- justify comparative and exploratory framing
- justify why synthetic pairing is treated as a methodological experiment

## 4. Software Development Lifecycle
- practical workflow for notebook-led experimental development
- version control and milestone structure

## 5. Design Methodology
- explain experimental design decisions
- justify notebook/module split
- explain controls and repeated seeds

## 6. Design
- data flow diagram for:
  - Wisconsin branch
  - BreaKHis branch
  - synthetic pairing
  - fusion evaluation

## 7. Implementation
- preserved Wisconsin branch
- rebuilt BreaKHis branch
- synthetic pairing construction
- fusion methods
- artifact packaging for later app transfer

## 8. Testing Methodology
- patient leakage checks
- artifact loading checks
- pairing integrity checks
- repeated-seed robustness checks

## 9. Results and Evaluation
- image-only baseline
- tabular-only baseline
- synthetic early fusion
- synthetic late fusion
- random pairing control
- calibration and false-negative analysis where available

## 10. Discussion
- interpret what fusion gains mean
- discuss whether gains may be driven by artificial label alignment
- compare against methodological expectations from literature
- highlight limitations strongly

## 11. Conclusion
- summarize findings
- state what this dissertation does and does not prove
- propose future work with real matched multimodal datasets

## References
- fill from `METHODOLOGY_REFERENCES.md` and literature review sources

## Appendices
- notebook list
- dataset notes
- generated figures and tables
- AI usage declaration
- additional technical outputs if needed

