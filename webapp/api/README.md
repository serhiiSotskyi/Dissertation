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
