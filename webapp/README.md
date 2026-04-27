# BreaScope AI Web App Workspace

This workspace contains:

- `frontend/`
  - Next.js App Router frontend for the landing page, testing page, notebook archive, artifact routes, and backend proxy routes.
- `api/`
  - FastAPI inference service intended for Railway deployment.
- `animations/`
  - Optional local support animations.
  - Prefer `.lottie` files when available.
  - Main motion in the app is code-driven 2D animation, not Lottie.

## Local run

### API

```bash
cd webapp/api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

```bash
cd webapp/frontend
npm install
cp .env.example .env.local
npm run dev
```

## Notes

- The frontend serves deployment-safe figures, notebooks, animations, and sample images from `frontend/public/`.
- Regenerate public frontend assets with `cd webapp/frontend && npm run prepare:assets` after updating dissertation outputs.
- The synthetic fusion route is always framed as exploratory and non-clinical.

## Deployment

Deploy this as two services:

1. **Frontend: Vercel**
   - Project root: `webapp/frontend`
   - Framework preset: Next.js
   - Build command: `npm run build`
   - Output: Vercel detects the Next.js `.next` output automatically
   - Environment variable:
     - `API_BASE_URL=https://<your-railway-api-domain>`

2. **Inference API: Railway**
   - Project root/build context: repository root
   - Dockerfile path: `webapp/api/Dockerfile`
   - Healthcheck path: `/health`
   - Environment variables:
     - `RAILWAY_DOCKERFILE_PATH=webapp/api/Dockerfile`
     - `CORS_ALLOW_ORIGINS=https://<your-vercel-domain>`
     - `BREAKHIS_CHECKPOINT_PATH=/app/dissertation_project/models/breakhis_resnet18_patient_level_clean.pth`

The API Docker build intentionally excludes the raw BreaKHis dataset. It copies only the Python service, inference code, tabular artifacts, demo preset manifest, and the clean BreaKHis checkpoint. With the Dockerfile as written, `dissertation_project/models/breakhis_resnet18_patient_level_clean.pth` must be present in the Docker build context. Local Docker/Railway uploads can use the existing local file; Git-based deploys should provide it through Git LFS or another tracked private build artifact.
