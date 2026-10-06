/**
 * [INPUT]: 依赖 Vite、React 插件与图片处理、产物分析插件
 * [OUTPUT]: 对外提供 React 单一框架的构建配置
 * [POS]: 构建工具链入口，资源处理与分包策略集中于此
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { imagetools } from "vite-imagetools";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";
import { visualizer } from "rollup-plugin-visualizer";

// https://vite.dev/config/
export default defineConfig(() => {
  return {
    plugins: [
      react(),
      imagetools({
        removeMetadata: true,
      }),
      ViteImageOptimizer({
        includePublic: true,
        png: { quality: 80 },
        jpeg: { quality: 80 },
        jpg: { quality: 80 },
        webp: { quality: 80 },
      }),
      visualizer({
        filename: "stats.html",
        emitFile: true,
        open: false,
        gzipSize: true,
        brotliSize: true,
      }),
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (
              id.includes("node_modules/react/") ||
              id.includes("node_modules/react-dom/") ||
              id.includes("node_modules/scheduler/")
            ) return "react";
            if (
              id.includes("node_modules/react-router/") ||
              id.includes("node_modules/react-router-dom/")
            ) return "react-router";
            if (id.includes("node_modules/mermaid/")) return "mermaid";
            if (id.includes("node_modules/highlight.js/")) return "highlight";
            if (id.includes("node_modules/markdown-it/")) return "markdown-it";
          },
        },
      },
    },
  };
});
