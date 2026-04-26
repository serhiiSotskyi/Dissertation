import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

import { notebooks } from "@/lib/content";

type CsvRecord = Record<string, string>;
type DemoCaseLabelHint = "benign" | "borderline" | "malignant";

type TabularDemoCase = {
  id: string;
  labelHint: DemoCaseLabelHint;
  description: string;
  features: Record<string, number>;
  probabilityMalignant?: number;
  sourceLabel?: string;
  sourceUrl?: string;
};

type ImageDemoCase = {
  id: string;
  imageId: string;
  labelHint: DemoCaseLabelHint;
  description: string;
  relativePath: string;
  patientId?: string;
  magnification?: string;
  probabilityMalignant?: number;
  selectionReason?: string;
};

type FusionDemoCase = {
  id: string;
  imageId: string;
  labelHint: DemoCaseLabelHint;
  description: string;
  features: Record<string, number>;
  tabularPresetId?: string;
  imagePresetId?: string;
  caseType?: string;
  probabilityMalignant?: number;
};

export type DemoCasesPayload = {
  schemaVersion?: number;
  generatedAt?: string;
  source?: Record<string, string>;
  disclaimer?: string;
  featureOrder: string[];
  tabular: TabularDemoCase[];
  image: ImageDemoCase[];
  fusion: FusionDemoCase[];
};

export type LandingMetrics = {
  patientAccuracy: number;
  patientRocAuc: number;
  wisconsinAccuracy: number;
  syntheticBestAccuracy: number;
  notebookCount: number;
  figureCount: number;
};

const repoRoot = path.resolve(process.cwd(), "..", "..");
const projectRoot = path.join(repoRoot, "dissertation_project");
const animationsRoot = path.join(repoRoot, "webapp", "animations");
const demoPresetsPath = path.join(projectRoot, "outputs_v2", "reports", "demo_presets.json");

function splitCsvLine(line: string) {
  return line.split(",").map((entry) => entry.trim());
}

function parseCsv(text: string) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map<CsvRecord>((line) => {
    const values = splitCsvLine(line);
    return headers.reduce<CsvRecord>((record, header, index) => {
      record[header] = values[index] ?? "";
      return record;
    }, {});
  });
}

async function readCsv(relativePath: string) {
  const csvText = await readFile(path.join(projectRoot, relativePath), "utf8");
  return parseCsv(csvText);
}

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function getLandingMetrics(): Promise<LandingMetrics> {
  const patientMetricsRows = await readCsv("outputs_v2/metrics/breakhis_patient_level_metrics.csv");
  const jointRows = await readCsv("outputs_v2/metrics/joint_model_comparison.csv");
  const syntheticRows = await readCsv("outputs_v2/metrics/synthetic_fusion_summary.csv");

  const patientMetrics = patientMetricsRows[0];
  const wisconsinRow = jointRows.find((row) => row.model.includes("Wisconsin"));
  const syntheticAccuracy = syntheticRows
    .filter((row) => row.metric === "accuracy")
    .reduce((best, row) => Math.max(best, toNumber(row.mean)), 0);

  return {
    patientAccuracy: toNumber(patientMetrics.accuracy),
    patientRocAuc: toNumber(patientMetrics.roc_auc),
    wisconsinAccuracy: toNumber(wisconsinRow?.accuracy ?? "0"),
    syntheticBestAccuracy: syntheticAccuracy,
    notebookCount: notebooks.length,
    figureCount: notebooks.reduce((count, notebook) => count + notebook.figures.length, 0),
  };
}

function coerceFeatureRow(row: CsvRecord) {
  return Object.fromEntries(
    Object.entries(row)
      .filter(([key]) => key !== "Unnamed: 0" && key !== "y")
      .map(([key, value]) => [key, toNumber(value)]),
  );
}

async function readDemoPresetManifest(): Promise<DemoCasesPayload> {
  return JSON.parse(await readFile(demoPresetsPath, "utf8")) as DemoCasesPayload;
}

export async function buildLocalDemoCases(): Promise<DemoCasesPayload> {
  try {
    return await readDemoPresetManifest();
  } catch {
    // Keep the test page usable in partial checkouts where generated reports are absent.
  }

  const rows = await readCsv("notebook_Wisconsin/brca.csv");
  const benignRow = rows.find((row) => row.y === "B") ?? rows[0];
  const malignantRow = rows.find((row) => row.y === "M") ?? rows[rows.length - 1];
  const featureOrder = Object.keys(coerceFeatureRow(benignRow));

  const benignFeatures = coerceFeatureRow(benignRow);
  const malignantFeatures = coerceFeatureRow(malignantRow);

  return {
    featureOrder,
    tabular: [
      {
        id: "tabular-benign-published",
        labelHint: "benign",
        description: "Wisconsin sample expected to read as benign in the tabular model.",
        features: benignFeatures,
      },
      {
        id: "tabular-malignant-published",
        labelHint: "malignant",
        description: "Wisconsin sample expected to read as malignant in the tabular model.",
        features: malignantFeatures,
      },
    ],
    image: [],
    fusion: [],
  };
}

export async function getAvailableAnimations() {
  try {
    const entries = await readdir(animationsRoot);
    return entries
      .filter((entry) => !entry.startsWith("."))
      .sort((left, right) => left.localeCompare(right));
  } catch {
    return [];
  }
}

export function pickAnimation(available: string[], preferredNames: string[]) {
  const lowered = new Map(available.map((name) => [name.toLowerCase(), name]));
  for (const preferredName of preferredNames) {
    const match = lowered.get(preferredName.toLowerCase());
    if (match) {
      return match;
    }
  }
  return null;
}

export async function animationExists(name: string) {
  if (!name) {
    return false;
  }
  try {
    const fileStats = await stat(path.join(animationsRoot, name));
    return fileStats.isFile();
  } catch {
    return false;
  }
}

export async function getAnimationPath(name: string) {
  if (!(await animationExists(name))) {
    return null;
  }
  return path.join(animationsRoot, name);
}

export async function getFigurePath(name: string) {
  const candidate = path.join(projectRoot, "outputs_v2", "figures", name);
  try {
    const fileStats = await stat(candidate);
    return fileStats.isFile() ? candidate : null;
  } catch {
    return null;
  }
}

export async function getNotebookPath(name: string) {
  const candidate = path.join(projectRoot, "notebooks_v2", name);
  try {
    const fileStats = await stat(candidate);
    return fileStats.isFile() ? candidate : null;
  } catch {
    return null;
  }
}

export async function getDatasetImagePath(id: string) {
  const demoCases = await buildLocalDemoCases();
  const image = demoCases.image.find((entry) => entry.imageId === id || entry.id === id);
  if (!image) {
    return null;
  }
  const candidate = path.join(projectRoot, image.relativePath);
  try {
    const fileStats = await stat(candidate);
    return fileStats.isFile() ? candidate : null;
  } catch {
    return null;
  }
}

export async function getLocalHealthSummary() {
  const requiredPaths = [
    path.join(projectRoot, "notebook_Wisconsin", "model.pt"),
    path.join(projectRoot, "notebook_Wisconsin", "scaler.joblib"),
    path.join(projectRoot, "models", "breakhis_resnet18_patient_level_clean.pth"),
  ];

  const checks = await Promise.all(
    requiredPaths.map(async (targetPath) => {
      try {
        const fileStats = await stat(targetPath);
        return fileStats.isFile();
      } catch {
        return false;
      }
    }),
  );

  return {
    status: checks.every(Boolean) ? "ok" : "degraded",
    backend: "disconnected",
    artifactsReady: checks.every(Boolean),
    checks: {
      wisconsinModel: checks[0],
      wisconsinScaler: checks[1],
      breakhisCheckpoint: checks[2],
    },
  };
}
