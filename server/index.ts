// server/index.ts (UPDATED)

import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { registerRoutes } from "./routes"; // registerRoutes from server/routes.ts
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.set("trust proxy", 1);

const PgStore = connectPgSimple(session);

// Validate DB connection on startup
pool.connect().then(client => {
  console.log("Database connected successfully");
  client.release();
}).catch(err => {
  console.error("Database connection failed on startup:", err);
});

// Extend Express Session to include userId and userRole
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    userRole?: string;
  }
}

// Extend Request type to include rawBody
declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }

}));
app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    cookie: {
      secure: app.get("env") === "production", // Render par ye TRUE hona chahiye, dev mein FALSE
      sameSite: "lax", // Ye zaroori hai
      maxAge: 24 * 60 * 60 * 1000 // 1 din
    },
    store: new PgStore({
      pool,
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || "dev-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,

  })
);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(this, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error(err);
    // In development, you might want to throw err to see full stack trace
    // throw err; // Only throw in dev if you want server to crash on error
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    console.log(`[DEBUG] Server restarted. Debug logs active.`);
    log(`serving on port ${port}`);
  });
})();