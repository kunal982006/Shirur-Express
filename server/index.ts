// server/index.ts (UPDATED)

import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import cors from "cors";
import compression from "compression";
import connectPgSimple from "connect-pg-simple";
import { pool, checkDatabaseConnection } from "./db";
import { registerRoutes } from "./routes"; // registerRoutes from server/routes.ts
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.set("trust proxy", 1);

const isProduction = process.env.NODE_ENV === "production";
const sessionSecret = process.env.SESSION_SECRET;

// A predictable session secret lets an attacker forge a logged-in session. Do not
// start a production instance unless a real secret has been configured.
if (isProduction && (!sessionSecret || sessionSecret.length < 32)) {
  throw new Error("SESSION_SECRET must be set to at least 32 characters in production.");
}

const trustedOrigins = new Set([
  "https://shirur-express.onrender.com",
  "capacitor://localhost",
  "ionic://localhost",
  "http://localhost",
  "http://localhost:5173",
]);

function isTrustedOrigin(origin: string | undefined): boolean {
  return Boolean(origin && trustedOrigins.has(origin));
}

type RateLimitBucket = { count: number; resetAt: number };
const rateLimitBuckets = new Map<string, RateLimitBucket>();

function rateLimit(windowMs: number, maxRequests: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = `${req.path}:${req.ip}`;
    const bucket = rateLimitBuckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      rateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (bucket.count >= maxRequests) {
      res.setHeader("Retry-After", Math.ceil((bucket.resetAt - now) / 1000));
      return res.status(429).json({ message: "Too many requests. Please try again shortly." });
    }
    bucket.count += 1;
    next();
  };
}

const PgStore = connectPgSimple(session);

// Gzip/deflate compression for all HTTP responses (~70% size reduction)
app.use(compression());

// Baseline browser protections. CSP runs in report-only mode first so payment and
// analytics integrations can be observed before it is enforced in production.
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(self), geolocation=(self), microphone=()");
  res.setHeader("Content-Security-Policy-Report-Only", "default-src 'self'; script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://connect.facebook.net; connect-src 'self' https://*.razorpay.com https://*.facebook.com https://graph.facebook.com; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com");
  if (isProduction) res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
});

// Validate DB connection on startup moved to main execution block

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

// CORS configuration for Capacitor iOS/Android builds
app.use(cors({
  origin(origin, callback) {
    // Requests without Origin are native/server-to-server requests; browsers are
    // restricted to the explicit allow-list below.
    callback(null, !origin || isTrustedOrigin(origin));
  },
  credentials: true,
}));

// Cookie-authenticated API mutations must originate from the application. This
// blocks cross-site form/fetch requests while keeping native clients functional.
app.use((req, res, next) => {
  const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
  const origin = req.get("origin");
  if (isMutation && req.path.startsWith("/api/") && origin && !isTrustedOrigin(origin)) {
    return res.status(403).json({ message: "Untrusted request origin." });
  }
  next();
});

app.use("/api/auth/login", rateLimit(15 * 60 * 1000, 10));
app.use("/api/auth/register", rateLimit(60 * 60 * 1000, 10));
app.use("/api/payment", rateLimit(10 * 60 * 1000, 30));

app.use(
  session({
    cookie: {
      secure: isProduction,
      sameSite: isProduction ? "none" as const : "lax" as const,
      maxAge: 90 * 24 * 60 * 60 * 1000 // 90 days — users stay logged in for a long time
    },
    store: new PgStore({
      pool,
      createTableIfMissing: true,
    }),
    secret: sessionSecret || "development-only-session-secret-not-for-production",
    resave: false,
    saveUninitialized: false,
    rolling: true, // Refresh session expiry on every request — active users never get logged out
  })
);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Ensure DB is connected before starting server
  await checkDatabaseConnection();

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

    // --- RENDER FREE TIER KEEP-ALIVE ---
    if (app.get("env") === "production") {
      const REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes
      const PING_URL = 'https://shirur-express.onrender.com/api/health';
      
      setInterval(() => {
        fetch(PING_URL)
          .then(res => {
            if (res.ok) console.log(`[KEEP-ALIVE] Pinged self successfully.`);
            else console.error(`[KEEP-ALIVE] Self-ping returned status ${res.status}`);
          })
          .catch(err => console.error('[KEEP-ALIVE] Self-ping failed:', err.message));
      }, REFRESH_INTERVAL);
      
      console.log(`[KEEP-ALIVE] Self-ping scheduled every 10 minutes targeting ${PING_URL}.`);
    }
  });
})();
