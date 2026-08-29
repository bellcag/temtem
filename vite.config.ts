import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "./src"),
    },
  },
  server: {
    // IPv4 0.0.0.0 — Cursor preview talks to 127.0.0.1:5173. `vite --host`
    // often binds only :::5173 (IPv6), which shows up as ERR_CONNECTION_REFUSED.
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    // Allow phone preview via tunnels (localtunnel / cloudflared)
    allowedHosts: true,
  },
});
