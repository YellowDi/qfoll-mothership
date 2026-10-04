/**
 * [INPUT]: 依赖构建产物目录和 index.html
 * [OUTPUT]: 对外提供 SPA 深链接 fallback 生成脚本
 * [POS]: 部署产物后处理工具
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
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
