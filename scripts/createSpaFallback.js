import { copyFile } from "node:fs/promises";
import { resolve } from "node:path";

const distDir = resolve(process.cwd(), "dist");
const indexFile = resolve(distDir, "index.html");
const fallbackFile = resolve(distDir, "404.html");

try {
  await copyFile(indexFile, fallbackFile);
  console.log("[createSpaFallback] Created dist/404.html from dist/index.html");
} catch (error) {
  console.error("[createSpaFallback] Failed to create SPA fallback:", error);
  process.exitCode = 1;
}
