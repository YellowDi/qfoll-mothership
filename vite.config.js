import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { imagetools } from "vite-imagetools";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";
import { visualizer } from "rollup-plugin-visualizer";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
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
          if (id.includes("node_modules/vue/") || id.includes("node_modules/@vue/")) return "vue";
          if (id.includes("node_modules/vue-router/")) return "vue-router";
          if (id.includes("node_modules/mermaid/")) return "mermaid";
          if (id.includes("node_modules/highlight.js/")) return "highlight";
          if (id.includes("node_modules/markdown-it/")) return "markdown-it";
        },
      },
    },
  },
});
