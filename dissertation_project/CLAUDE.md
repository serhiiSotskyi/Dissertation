# CLAUDE.md — dissertation project

This repo holds a multimodal breast-cancer classification dissertation
(BreakHis histopathology + Wisconsin tabular data, plus fusion experiments).
Proposal, methodology, and progress notes live in `docs/`.

## Project layout (short map)

- `docs/` — proposal, methodology, progress log, paper skeleton (the prose)
- `src/` — Python modules (breakhis, fusion, image_pipeline, inference, metrics, pairing)
- `notebooks_v2/` — current experiment notebooks (v2); `notebooks/` is the older set
- `notebook_Wisconsin/` — Wisconsin-only branch notebooks
- `data/` — raw datasets (1.7 GB, excluded from graphify)
- `models/` — trained weights (excluded from graphify)
- `outputs/`, `outputs_v2/` — figures and run artefacts (excluded)
- `paper template/` — LaTeX template scaffolding (excluded)

## graphify

This project has a graphify knowledge graph at `graphify-out/` once you run
`/graphify .` for the first time.

Rules:
- Before answering architecture or codebase questions, read
  `graphify-out/GRAPH_REPORT.md` for god nodes and community structure.
- If `graphify-out/wiki/index.md` exists, navigate it instead of grepping raw files.
- After modifying code files in this session, run `graphify update .` to keep
  the graph current (AST-only, no API cost).
- The Obsidian vault at `graph-vault/` mirrors the same graph as linked `.md`
  notes — open the folder in Obsidian to browse the graph view.

## Working style

- Prefer editing existing docs and notebooks over creating parallel ones.
- Don't commit anything in `data/` or `models/`.
- The authoritative progress log is `docs/PROGRESS_LOG.md` — append to it, don't rewrite it.
