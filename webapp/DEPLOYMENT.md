# BreaScope AI Deployment

## Where to deploy

- **Frontend:** Vercel. The UI is a Next.js App Router project and should use `webapp/frontend` as the Vercel project root.
- **Inference API:** Railway. The API is a FastAPI/PyTorch service and should run as a long-lived container, not as a frontend serverless function.

## 1. Prepare assets

From the repository:

```bash
cd webapp/frontend
npm run prepare:assets
npm run build
```

`prepare:assets` copies the deployment-safe figures, notebooks, animations, demo preset JSON, and eight curated pathology demo images into `webapp/frontend/public/`.

## 2. Deploy the API to Railway

Create a Railway service from the repository and configure it to build from the repository root with:

- Dockerfile: `webapp/api/Dockerfile`
- Healthcheck path: `/health`
- Public networking: enabled

Set:

```bash
RAILWAY_DOCKERFILE_PATH=webapp/api/Dockerfile
CORS_ALLOW_ORIGINS=https://<your-vercel-domain>
BREAKHIS_CHECKPOINT_PATH=/app/dissertation_project/models/breakhis_resnet18_patient_level_clean.pth
```

The Dockerfile copies the clean checkpoint from `dissertation_project/models/breakhis_resnet18_patient_level_clean.pth`. That file is ignored by normal Git rules, so with the Dockerfile as written it must be present in the Docker build context. Local Railway/Docker deploys can include the existing local file as long as it is present before building. Git-based Railway deploys should provide the checkpoint through Git LFS or another tracked private build artifact.

After deploy, check:

```bash
curl https://<your-railway-api-domain>/health
```

Expected status is `ok`. If it is `degraded`, the API started but one or more model artifacts are missing.

## 3. Deploy the frontend to Vercel

Create a Vercel project with:

- Root Directory: `webapp/frontend`
- Framework Preset: Next.js
- Build Command: `npm run build`

Set:

```bash
API_BASE_URL=https://<your-railway-api-domain>
```

Deploy, then open:

- `/` for the landing page
- `/notebooks` for dissertation artifacts
- `/test` for the inference workbench

## 4. Verify the connection

From the deployed frontend, open `/test`. The status pill should show `API ready`. Run one tabular preset first because it is the quickest path, then an image preset to confirm the BreaKHis checkpoint is available.
