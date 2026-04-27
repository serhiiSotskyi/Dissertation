import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(frontendRoot, "..", "..");
const projectRoot = path.join(repoRoot, "dissertation_project");
const publicRoot = path.join(frontendRoot, "public");

const paths = {
  animationsSource: path.join(repoRoot, "webapp", "animations"),
  figuresSource: path.join(projectRoot, "outputs_v2", "figures"),
  notebooksSource: path.join(projectRoot, "notebooks_v2"),
  demoPresetsSource: path.join(projectRoot, "outputs_v2", "reports", "demo_presets.json"),
  patientMetricsSource: path.join(projectRoot, "outputs_v2", "metrics", "breakhis_patient_level_metrics.csv"),
  jointMetricsSource: path.join(projectRoot, "outputs_v2", "metrics", "joint_model_comparison.csv"),
  syntheticMetricsSource: path.join(projectRoot, "outputs_v2", "metrics", "synthetic_fusion_summary.csv"),
  animationsDest: path.join(publicRoot, "animations"),
  figuresDest: path.join(publicRoot, "artifacts", "figures"),
  notebooksDest: path.join(publicRoot, "artifacts", "notebooks"),
  demoPresetsDest: path.join(publicRoot, "artifacts", "demo_presets.json"),
  landingMetricsDest: path.join(publicRoot, "artifacts", "landing-metrics.json"),
  demoImagesDest: path.join(publicRoot, "demo-images"),
};

function splitCsvLine(line) {
  return line.split(",").map((entry) => entry.trim());
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

async function readCsv(filePath) {
  return parseCsv(await readFile(filePath, "utf8"));
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function resetDirectory(targetPath) {
  await rm(targetPath, { recursive: true, force: true });
  await mkdir(targetPath, { recursive: true });
}

async function copyDirectory(source, destination, includeEntry = () => true) {
  await resetDirectory(destination);
  await cp(source, destination, {
    recursive: true,
    filter: (entry) => {
      if (entry === source) {
        return true;
      }
      return !path.basename(entry).startsWith(".") && includeEntry(entry);
    },
  });
}

async function buildLandingMetrics() {
  const patientMetricsRows = await readCsv(paths.patientMetricsSource);
  const jointRows = await readCsv(paths.jointMetricsSource);
  const syntheticRows = await readCsv(paths.syntheticMetricsSource);
  const figures = await readdir(paths.figuresSource);
  const notebooks = await readdir(paths.notebooksSource);

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
    notebookCount: notebooks.filter((name) => name.endsWith(".ipynb")).length,
    figureCount: figures.filter((name) => name.endsWith(".png")).length,
  };
}

async function copyDemoImages(demoPresets) {
  await resetDirectory(paths.demoImagesDest);

  for (const imageCase of demoPresets.image) {
    const sourcePath = path.join(projectRoot, imageCase.relativePath);
    const extension = path.extname(sourcePath) || ".png";
    const destinationPath = path.join(paths.demoImagesDest, `${imageCase.imageId}${extension}`);
    await cp(sourcePath, destinationPath);
  }
}

await mkdir(path.dirname(paths.demoPresetsDest), { recursive: true });
await copyDirectory(paths.animationsSource, paths.animationsDest);
await copyDirectory(paths.figuresSource, paths.figuresDest, (entry) => entry.endsWith(".png"));
await copyDirectory(paths.notebooksSource, paths.notebooksDest, (entry) => entry.endsWith(".ipynb"));
await cp(paths.demoPresetsSource, paths.demoPresetsDest);

const demoPresets = JSON.parse(await readFile(paths.demoPresetsSource, "utf8"));
await copyDemoImages(demoPresets);

const landingMetrics = await buildLandingMetrics();
await writeFile(paths.landingMetricsDest, `${JSON.stringify(landingMetrics, null, 2)}\n`);

console.log("Prepared frontend deployment assets in webapp/frontend/public.");
