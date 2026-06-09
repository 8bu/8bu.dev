import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

// The TanStack Router plugin MUST come before the react plugin. The dev proxy
// fronts the two 8bu backends: /api → the public retrieve api (@8budev/api :3010),
// /admin → the loopback ingest/admin api (@8budev/admin-api :3001).
export default defineConfig({
  plugins: [tanstackRouter({ target: "react", autoCodeSplitting: true }), react(), tailwindcss()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  server: {
    port: 5175, // 5174 is taken by apps/web (the portfolio); neolab sits beside it

    proxy: {
      "/api": {
        target: process.env.VITE_API_BASE ?? "http://localhost:3010",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
      "/admin": {
        target: process.env.VITE_ADMIN_BASE ?? "http://localhost:3001",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/admin/, ""),
      },
    },
  },
});
