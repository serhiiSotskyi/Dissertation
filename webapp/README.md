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

- The frontend reads figures and notebooks directly from `dissertation_project/` through local route handlers.
- Predefined image demos come from committed BreaKHis sample images already present in the repo.
- The synthetic fusion route is always framed as exploratory and non-clinical.
