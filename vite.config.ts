import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";

// Writes the list of every built file next to them (asset-manifest.json).
// `npm run android:bundle:live` reads it from the live site to copy exactly the
// deployed files into the Android app.
function assetManifest(): Plugin {
  let outDir = "";
  const walk = (dir: string, base: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name);
      return entry.isDirectory() ? walk(full, base) : [path.relative(base, full).split(path.sep).join("/")];
    });
  return {
    name: "asset-manifest",
    apply: "build",
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      if (!fs.existsSync(outDir)) return;
      const files = walk(outDir, outDir).filter((file) => file !== "asset-manifest.json").sort();
      fs.writeFileSync(path.join(outDir, "asset-manifest.json"), JSON.stringify({ files }));
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    assetManifest(),
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
          // Charts (dashboards only) and 3D (cake designer only) are left out on
          // purpose: Vite then puts them in files that load with those pages only,
          // instead of in a file every customer downloads at startup.
          'vendor-ui': ['framer-motion', 'lucide-react'],
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