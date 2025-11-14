// File: CryptoVault/vite.config.ts

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Unified configuration for React (Vite + Django + Node integration)
export default defineConfig(({ mode }) => ({
  // 🔑 Base path
  base: mode === "production" ? "/static/" : "/",

  server: {
    host: "::",
    port: 8080,
    // 🔥 Allow requests from Django and Node backend
    cors: true,
    proxy: {
      // Forward API requests to Node backend
      "/api": "http://localhost:5000",
    },
  },

  plugins: [
    react(),
    mode === "development" && componentTagger()
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
