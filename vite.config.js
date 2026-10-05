/**
 * [INPUT]: 依赖 Vite、Vue/React 插件与现有图片处理、产物分析插件
 * [OUTPUT]: 对外提供默认 React 模式和显式 Vue 兼容模式的构建配置
 * [POS]: 构建工具链入口，共享资源处理，按模式选择单一框架及产物目录
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import vue from "@vitejs/plugin-vue";
import { imagetools } from "vite-imagetools";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";
import { visualizer } from "rollup-plugin-visualizer";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const useLegacyVue = mode === "vue";
  const reactEntryPlugin = {
    name: "react-migration-entry",
    transformIndexHtml: {
      order: "pre",
      handler: (html) => html.replace("/src/main.js", "/src/react/main.tsx"),
    },
  };

  return {
    plugins: [
      ...(useLegacyVue ? [vue()] : [react(), reactEntryPlugin]),
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
      outDir: mode === "react" ? "dist-react" : "dist",
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
            if (id.includes("node_modules/vue/") || id.includes("node_modules/@vue/")) return "vue";
            if (id.includes("node_modules/vue-router/")) return "vue-router";
            if (id.includes("node_modules/mermaid/")) return "mermaid";
            if (id.includes("node_modules/highlight.js/")) return "highlight";
            if (id.includes("node_modules/markdown-it/")) return "markdown-it";
          },
        },
      },
    },
  };
});
