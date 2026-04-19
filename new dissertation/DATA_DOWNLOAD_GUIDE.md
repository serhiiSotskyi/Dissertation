# Data Download Guide

This file mirrors the step-by-step instructions given in chat for downloading only the minimum data needed for the new dissertation workflow.

## Minimum Required
1. Clinical spreadsheet
2. Data dictionary
3. Selected HSI folders
4. ROI annotations
5. Histology images only if you can selectively stage them

## Target Local Folder Layout
Place downloaded data under:

`/Users/sergeysotskiy/Documents/UNI/year 3/Dissertation/new dissertation/data/`

Suggested structure:

```text
new dissertation/data/
  clinical/
  annotations/
  hsi/
  histology/
```

## Selection Rule
Download the smallest useful subset first:
- all clinical data
- all ROI/tissue annotations if possible
- HSI for all patients if manageable
- histology only after the above is present

Do not try to download the full 1.2 TB package blindly.

## Operational Goal
The agent can proceed once the files are local and readable from the workspace.
