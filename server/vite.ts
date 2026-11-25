import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: false,
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "..", "dist", "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Hashed assets (JS/CSS/images) — cache for 1 year since Vite hashes filenames
  app.use("/assets", express.static(path.resolve(distPath, "assets"), {
    maxAge: "1y",
    immutable: true,
  }));

  // A hashed asset that is not there belongs to an older deploy. Answer 404 so
  // the app notices and reloads onto the new version, instead of handing it the
  // HTML page below in place of a script.
  app.use("/assets", (_req, res) => {
    res.status(404).end();
  });

  // Other static files — short cache with revalidation
  app.use(express.static(distPath, {
    maxAge: "1h",
    setHeaders: (res, filePath) => {
      // HTML, the service worker and the manifest should always revalidate to pick up new deploys
      if (/\.html$|[\\/]sw\.js$|manifest\.json$/.test(filePath)) {
        res.setHeader("Cache-Control", "no-cache");
      } else if (/\.(jpe?g|png|webp|gif|svg|ico)$/i.test(filePath)) {
        // Photos rarely change: let phones keep them for a week instead of
        // downloading them again every hour (saves Render bandwidth).
        res.setHeader("Cache-Control", "public, max-age=604800, stale-while-revalidate=86400");
      }
    },
  }));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
