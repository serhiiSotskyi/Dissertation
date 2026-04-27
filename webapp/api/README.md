# BreaScope AI Python API

This FastAPI service is the Railway-facing inference API for the web experience.

## Endpoints

- `GET /health`
- `GET /demo-cases`
- `POST /predict/tabular`
- `POST /predict/image`
- `POST /predict/fusion-demo`

## Local run

```bash
cd webapp/api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

The frontend proxy expects the API at `http://127.0.0.1:8000` unless `API_BASE_URL` is overridden.

## Deployment

Use the repository root as the Docker build context and `webapp/api/Dockerfile` as the Dockerfile. The service exposes `/health` for deployment health checks.

Production environment variables:

```bash
RAILWAY_DOCKERFILE_PATH=webapp/api/Dockerfile
CORS_ALLOW_ORIGINS=https://<your-vercel-domain>
BREAKHIS_CHECKPOINT_PATH=/app/dissertation_project/models/breakhis_resnet18_patient_level_clean.pth
```

Optional path overrides are also supported for `WISCONSIN_MODEL_PATH`, `WISCONSIN_SCALER_PATH`, `WISCONSIN_DATA_PATH`, and `DEMO_PRESETS_PATH`.
