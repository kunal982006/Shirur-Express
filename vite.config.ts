import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
export default defineConfig({
  plugins: [
    react(),
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
    dedupe: ["react", "react-dom", "wouter", "lucide-react"],
  },
  optimizeDeps: {
    include: ["react", "react-dom", "wouter", "lucide-react"],
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-select',
            '@radix-ui/react-accordion',
            '@radix-ui/react-popover',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-switch',
            '@radix-ui/react-label',
            '@radix-ui/react-slot',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-separator',
          ],
          'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
          'vendor-ui': ['framer-motion', 'recharts', 'lucide-react'],
        },
      },
    },
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
    hmr: {
      overlay: false
    }

  },
});