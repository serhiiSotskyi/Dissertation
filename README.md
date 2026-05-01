# Dissertation Project

Repository: https://github.com/serhiiSotskyi/Dissertation

This repository contains the CMU601 dissertation project artefacts, including the research notebooks, generated outputs, reusable Python modules, FastAPI inference service, and Next.js frontend.

## Deployed Versions

- Frontend: https://dissertation-nu.vercel.app/
- API: https://dissertation-production-fce9.up.railway.app/
- API health check: https://dissertation-production-fce9.up.railway.app/health

## Project Structure

```text
dissertation_project/
  src/                  Reusable Python modules for data handling, modelling, metrics and inference
  notebooks/            Executed research notebooks
  outputs/              Generated figures, metrics and report artefacts
  models/               Saved model checkpoints used by the API
  notebook_Wisconsin/   Wisconsin model, scaler, dataset and original notebook

webapp/
  api/                  FastAPI inference service
  frontend/             Next.js frontend application
```

## Local Setup

Clone the repository:

```bash
git clone https://github.com/serhiiSotskyi/Dissertation.git
cd Dissertation
```

The application expects these project artefacts to be present:

```text
dissertation_project/models/breakhis_resnet18_patient_level_clean.pth
dissertation_project/notebook_Wisconsin/model.pt
dissertation_project/notebook_Wisconsin/scaler.joblib
dissertation_project/notebook_Wisconsin/brca.csv
dissertation_project/outputs/reports/demo_presets.json
```

## Run The API Locally

Use Python 3.12 if available.

```bash
cd webapp/api
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Check the API:

```bash
curl http://127.0.0.1:8000/health
```

The API will run in a degraded state if any required model artefact is missing.

## Run The Frontend Locally

Start the API first, then run the frontend in a second terminal.

```bash
cd webapp/frontend
npm install
cp .env.example .env.local
npm run dev
```

The local frontend should open at:

```text
http://localhost:3000
```

For local development, `webapp/frontend/.env.local` should contain:

```text
API_BASE_URL=http://127.0.0.1:8000
```

To point the frontend at the deployed API instead:

```text
API_BASE_URL=https://dissertation-production-fce9.up.railway.app
```

## Refresh Frontend Artefacts

The frontend serves selected figures, notebooks and demo files from `webapp/frontend/public/`. If project outputs are regenerated, refresh the public frontend artefacts with:

```bash
cd webapp/frontend
npm run prepare:assets
```

## Build Checks

Frontend type check:

```bash
cd webapp/frontend
npm run lint
```

Frontend production build:

```bash
cd webapp/frontend
npm run build
```

API import and health check:

```bash
cd webapp/api
source .venv/bin/activate
uvicorn main:app --host 127.0.0.1 --port 8000
```

Then open:

```text
http://127.0.0.1:8000/health
```

## Deployment Notes

The frontend is deployed from `webapp/frontend` as a Vercel Next.js project. Set the frontend environment variable:

```text
API_BASE_URL=https://dissertation-production-fce9.up.railway.app
```

The API is deployed from the repository root using `webapp/api/Dockerfile`. The Docker build copies the FastAPI service, inference code, Wisconsin artefacts, demo preset manifest, and clean BreaKHis checkpoint.
