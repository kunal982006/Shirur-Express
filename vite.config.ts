import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
      process.env.REPL_ID !== undefined
      ? [
        await import("@replit/vite-plugin-cartographer").then((m) =>
          m.cartographer(),
        ),
        await import("@replit/vite-plugin-dev-banner").then((m) =>
          m.devBanner(),
        ),
      ]
      : []),
  ],
  resolve: {
    // --- YEH RAHA FIX ---
    // Humne alias syntax ko object se array mein change kar diya hai
    // Yeh zyada reliable hai
    alias: [
      {
        find: "@",
        replacement: path.resolve(import.meta.dirname, "client/src")
      },
      {
        find: "@shared",
        replacement: path.resolve(import.meta.dirname, "shared")
      },
      {
        find: "@assets",
        replacement: path.resolve(import.meta.dirname, "attached_assets")
      },
    ],
    // --- FIX KHATAM ---
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    watch: {
      ignored: [
        "**/check_output.txt",
        "**/tsc_output.txt",
        "**/attached_assets/**",
        "**/*.log",
        "**/.git/**",
        "**/node_modules/**",
        "**/dist/**",
        "**/.replit",
        "**/replit.md"
      ],
    },
  },
});