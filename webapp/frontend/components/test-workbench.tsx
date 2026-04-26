"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { LottieSupport } from "@/components/lottie-support";
import { MetricCounter } from "@/components/metric-counter";
import { featureGroups } from "@/lib/content";
import type { DemoCasesPayload } from "@/lib/server-data";

type PredictionResponse = {
  mode: string;
  prediction_label: string;
  probability_malignant: number;
  model_name: string;
  disclaimer_type: string;
  disclaimer_text: string;
  latency_ms: number;
};

type HealthResponse = {
  status: string;
  backend?: string;
  artifactsReady?: boolean;
};

type TestWorkbenchProps = {
  demoCases: DemoCasesPayload;
  scannerAnimationName: string | null;
  successAnimationName: string | null;
  tapeAnimationName: string | null;
};

type Mode = "tabular" | "image" | "fusion-demo";

export function TestWorkbench({
  demoCases,
  scannerAnimationName,
  successAnimationName,
  tapeAnimationName,
}: TestWorkbenchProps) {
  const [mode, setMode] = useState<Mode>("tabular");
  const [featureValues, setFeatureValues] = useState<Record<string, number>>(demoCases.tabular[0]?.features ?? {});
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(demoCases.image[0]?.imageId ?? null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/health")
      .then((response) => response.json())
      .then((payload: HealthResponse) => setHealth(payload))
      .catch(() => setHealth({ status: "offline" }));
  }, []);

  useEffect(() => {
    if (!uploadedImage) {
      setUploadedPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(uploadedImage);
    setUploadedPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [uploadedImage]);

  function updateFeature(field: string, value: string) {
    setFeatureValues((current) => ({
      ...current,
      [field]: Number(value),
    }));
  }

  function applyTabularCase(caseId: string) {
    const selectedCase = demoCases.tabular.find((entry) => entry.id === caseId);
    if (!selectedCase) {
      return;
    }
    setMode("tabular");
    setFeatureValues(selectedCase.features);
    setResult(null);
    setErrorMessage(null);
  }

  function applyImageCase(caseId: string) {
    const selectedCase = demoCases.image.find((entry) => entry.id === caseId);
    if (!selectedCase) {
      return;
    }
    setMode("image");
    setSelectedImageId(selectedCase.imageId);
    setUploadedImage(null);
    setResult(null);
    setErrorMessage(null);
  }

  function applyFusionCase(caseId: string) {
    const selectedCase = demoCases.fusion.find((entry) => entry.id === caseId);
    if (!selectedCase) {
      return;
    }
    setMode("fusion-demo");
    setFeatureValues(selectedCase.features);
    setSelectedImageId(selectedCase.imageId);
    setUploadedImage(null);
    setResult(null);
    setErrorMessage(null);
  }

  async function getEffectiveImageFile() {
    if (uploadedImage) {
      return uploadedImage;
    }

    if (!selectedImageId) {
      return null;
    }

    const response = await fetch(`/api/artifacts/dataset-image?id=${encodeURIComponent(selectedImageId)}`);
    if (!response.ok) {
      throw new Error("Unable to load the predefined pathology sample.");
    }

    const blob = await response.blob();
    return new File([blob], `${selectedImageId}.png`, { type: blob.type || "image/png" });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setResult(null);
    setErrorMessage(null);

    try {
      let response: Response;

      if (mode === "tabular") {
        response = await fetch("/api/predict/tabular", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ features: featureValues }),
        });
      } else if (mode === "image") {
        const file = await getEffectiveImageFile();
        if (!file) {
          throw new Error("Choose a pathology tile or apply a predefined image case.");
        }
        const formData = new FormData();
        formData.append("file", file);
        response = await fetch("/api/predict/image", {
          method: "POST",
          body: formData,
        });
      } else {
        const file = await getEffectiveImageFile();
        if (!file) {
          throw new Error("Synthetic fusion requires both tabular features and a pathology tile.");
        }
        const formData = new FormData();
        formData.append("file", file);
        formData.append("features", JSON.stringify(featureValues));
        response = await fetch("/api/predict/fusion-demo", {
          method: "POST",
          body: formData,
        });
      }

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.detail ?? "Inference request failed.");
      }

      setResult(payload as PredictionResponse);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Inference request failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const probability = result ? result.probability_malignant * 100 : 0;
  const previewUrl = uploadedPreviewUrl
    ? uploadedPreviewUrl
    : selectedImageId
      ? `/api/artifacts/dataset-image?id=${encodeURIComponent(selectedImageId)}`
      : null;

  return (
    <div className="app-shell app-shell--test">
      <div className="ambient-layer ambient-layer--mesh ambient-layer--dense" />
      <header className="topbar">
        <div>
          <span className="eyebrow">Live testing surface</span>
          <p className="topbar-copy">Demo page for trying the project models with predefined cases or your own inputs.</p>
        </div>
        <nav className="topbar-nav">
          <Link href="/">Home</Link>
          <Link href="/notebooks">Notebook archive</Link>
        </nav>
      </header>

      <main className="test-layout">
        <section className="test-control glass-panel">
          <div className="section-header">
            <div>
              <span className="eyebrow">Inference runner</span>
              <h1 className="section-title">Testing page</h1>
            </div>
            <div className={`status-pill status-pill--${health?.status ?? "checking"}`}>
              {health?.status === "ok" ? "API ready" : health?.status === "degraded" ? "Local artifacts ready" : "Checking"}
            </div>
          </div>

          <div className="tab-row">
            {[
              ["tabular", "Tabular"],
              ["image", "Image"],
              ["fusion-demo", "Synthetic Fusion Demo"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`tab-chip ${mode === value ? "tab-chip--active" : ""}`}
                onClick={() => setMode(value as Mode)}
              >
                {label}
              </button>
            ))}
          </div>

          <form className="test-form" onSubmit={submit}>
            <div className="demo-case-grid">
              <div className="demo-case-group">
                <span className="demo-case-label">Tabular demos</span>
                {demoCases.tabular.map((entry) => (
                  <button key={entry.id} type="button" className="demo-case-button" onClick={() => applyTabularCase(entry.id)}>
                    {entry.description}
                  </button>
                ))}
              </div>
              <div className="demo-case-group">
                <span className="demo-case-label">Image demos</span>
                {demoCases.image.map((entry) => (
                  <button key={entry.id} type="button" className="demo-case-button" onClick={() => applyImageCase(entry.id)}>
                    {entry.description}
                  </button>
                ))}
              </div>
              <div className="demo-case-group">
                <span className="demo-case-label">Fusion demos</span>
                {demoCases.fusion.map((entry) => (
                  <button key={entry.id} type="button" className="demo-case-button" onClick={() => applyFusionCase(entry.id)}>
                    {entry.description}
                  </button>
                ))}
              </div>
            </div>

            {(mode === "image" || mode === "fusion-demo") && (
              <div className="upload-panel glass-panel glass-panel--nested">
                <div className="upload-header">
                  <div>
                    <span className="eyebrow">Pathology tile</span>
                    <h2>Upload or keep the predefined sample</h2>
                  </div>
                  <LottieSupport className="upload-support" name={tapeAnimationName} />
                </div>
                <label className="upload-dropzone">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={(event) => setUploadedImage(event.target.files?.[0] ?? null)}
                  />
                  <span>Drop a pathology tile here or click to browse.</span>
                  <span className="upload-subcopy">If you do nothing, the currently selected predefined sample stays active.</span>
                </label>
                {previewUrl ? <img alt="Selected pathology sample preview" className="upload-preview" src={previewUrl} /> : null}
              </div>
            )}

            {(mode === "tabular" || mode === "fusion-demo") && (
              <div className="feature-stack">
                {featureGroups.map((group) => (
                  <section key={group.title} className="feature-group glass-panel glass-panel--nested">
                    <div className="feature-group-header">
                      <span className="eyebrow">{group.title}</span>
                    </div>
                    <div className="feature-grid">
                      {group.fields.map((field) => (
                        <label key={field} className="feature-field">
                          <span>{field.replace("x.", "").replaceAll("_", " ")}</span>
                          <input
                            type="number"
                            step="any"
                            value={featureValues[field] ?? 0}
                            onChange={(event) => updateFeature(field, event.target.value)}
                          />
                        </label>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}

            <button className="button button--primary button--wide" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Running inference..." : "Run selected mode"}
            </button>

            {errorMessage ? <p className="error-banner">{errorMessage}</p> : null}
          </form>
        </section>

        <aside className="test-result glass-panel">
          <div className="section-header">
            <div>
              <span className="eyebrow">Prediction panel</span>
              <h2 className="section-title">Model response</h2>
            </div>
            <LottieSupport className="result-support" name={isSubmitting ? scannerAnimationName : successAnimationName} />
          </div>

          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key={result.mode}
                className="result-card"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
              >
                <div className="result-headline">
                  <span className="result-mode">{result.mode}</span>
                  <h3 className={`prediction-chip prediction-chip--${result.prediction_label}`}>
                    {result.prediction_label}
                  </h3>
                </div>
                <div className="probability-band">
                  <MetricCounter className="probability-value" value={probability} suffix="%" decimals={1} />
                  <div className="probability-bar">
                    <motion.div
                      className="probability-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${probability}%` }}
                    />
                  </div>
                </div>
                <dl className="result-meta">
                  <div>
                    <dt>Model</dt>
                    <dd>{result.model_name}</dd>
                  </div>
                  <div>
                    <dt>Latency</dt>
                    <dd>{result.latency_ms.toFixed(0)} ms</dd>
                  </div>
                </dl>
                <div className={`disclaimer-block disclaimer-block--${result.disclaimer_type}`}>
                  <span className="eyebrow">Disclaimer</span>
                  <p>{result.disclaimer_text}</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                className="result-empty"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
              >
                <h3>Choose a mode and run a demo.</h3>
              </motion.div>
            )}
          </AnimatePresence>
        </aside>
      </main>
    </div>
  );
}
