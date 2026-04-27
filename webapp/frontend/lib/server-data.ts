import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

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

const publicRoot = path.join(process.cwd(), "public");
const artifactsRoot = path.join(publicRoot, "artifacts");
const animationsRoot = path.join(publicRoot, "animations");
const demoImagesRoot = path.join(publicRoot, "demo-images");
const demoPresetsPath = path.join(artifactsRoot, "demo_presets.json");
const landingMetricsPath = path.join(artifactsRoot, "landing-metrics.json");

function resolvePublicFile(root: string, name: string) {
  const candidate = path.resolve(root, name);
  const normalizedRoot = path.resolve(root);
  if (candidate !== normalizedRoot && candidate.startsWith(`${normalizedRoot}${path.sep}`)) {
    return candidate;
  }
  return null;
}

export async function getLandingMetrics(): Promise<LandingMetrics> {
  return JSON.parse(await readFile(landingMetricsPath, "utf8")) as LandingMetrics;
}

async function readDemoPresetManifest(): Promise<DemoCasesPayload> {
  return JSON.parse(await readFile(demoPresetsPath, "utf8")) as DemoCasesPayload;
}

export async function buildLocalDemoCases(): Promise<DemoCasesPayload> {
  return readDemoPresetManifest();
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
  const candidate = resolvePublicFile(animationsRoot, name);
  if (!candidate) {
    return false;
  }
  try {
    const fileStats = await stat(candidate);
    return fileStats.isFile();
  } catch {
    return false;
  }
}

export async function getAnimationPath(name: string) {
  if (!(await animationExists(name))) {
    return null;
  }
  return resolvePublicFile(animationsRoot, name);
}

export async function getFigurePath(name: string) {
  const candidate = resolvePublicFile(path.join(artifactsRoot, "figures"), name);
  if (!candidate) {
    return null;
  }
  try {
    const fileStats = await stat(candidate);
    return fileStats.isFile() ? candidate : null;
  } catch {
    return null;
  }
}

export async function getNotebookPath(name: string) {
  const candidate = resolvePublicFile(path.join(artifactsRoot, "notebooks"), name);
  if (!candidate) {
    return null;
  }
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
  const candidate = resolvePublicFile(demoImagesRoot, `${image.imageId}.png`);
  if (!candidate) {
    return null;
  }
  try {
    const fileStats = await stat(candidate);
    return fileStats.isFile() ? candidate : null;
  } catch {
    return null;
  }
}

export async function getLocalHealthSummary() {
  const demoCases = await buildLocalDemoCases();
  const requiredPaths = [demoPresetsPath, landingMetricsPath];
  const demoImagePaths = demoCases.image.map((entry) => path.join(demoImagesRoot, `${entry.imageId}.png`));

  const checks = await Promise.all(
    [...requiredPaths, ...demoImagePaths].map(async (targetPath) => {
      try {
        const fileStats = await stat(targetPath);
        return fileStats.isFile();
      } catch {
        return false;
      }
    }),
  );

  const artifactsReady = checks.every(Boolean);
  return {
    status: "degraded",
    backend: "disconnected",
    artifactsReady,
    checks: {
      demoPresets: checks[0],
      landingMetrics: checks[1],
      demoImages: checks.slice(2).every(Boolean),
    },
  };
}
