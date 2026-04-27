FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY webapp/api/requirements.txt ./webapp/api/requirements.txt
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r ./webapp/api/requirements.txt

COPY webapp/api ./webapp/api
COPY dissertation_project/src ./dissertation_project/src
COPY dissertation_project/notebook_Wisconsin ./dissertation_project/notebook_Wisconsin
COPY dissertation_project/outputs_v2/reports/demo_presets.json ./dissertation_project/outputs_v2/reports/demo_presets.json
COPY dissertation_project/models/breakhis_resnet18_patient_level_clean.pth ./dissertation_project/models/breakhis_resnet18_patient_level_clean.pth

WORKDIR /app/webapp/api

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
