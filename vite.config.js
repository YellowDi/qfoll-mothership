import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { imagetools } from "vite-imagetools";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";

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
  ],
});
