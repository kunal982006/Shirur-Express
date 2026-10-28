import type { Request, Response, NextFunction } from "express";

// Cloudinary support asked us to stop serving original files (bandwidth limit).
// Every Cloudinary image URL leaving the API gets f_auto,q_auto + a width cap, so
// the CDN serves a compressed WebP/AVIF instead of the full-size JPG/PNG.
const DELIVERY_TRANSFORMATION = "f_auto,q_auto,c_limit,w_500";

const CLOUDINARY_UPLOAD_RE = /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/;
// First path segment after /upload/ that is already a transformation, e.g. "w_800,c_limit"
const TRANSFORMATION_SEGMENT_RE = /^[a-z]{1,3}_[^/]*$/;

export function optimizeCloudinaryUrl(url: string): string {
  const match = CLOUDINARY_UPLOAD_RE.exec(url);
  if (!match) return url;
  const [, prefix, rest] = match;
  if (TRANSFORMATION_SEGMENT_RE.test(rest.split("/")[0])) return url; // already optimized
  return `${prefix}${DELIVERY_TRANSFORMATION}/${rest}`;
}

function optimizeDeep(value: unknown): unknown {
  if (typeof value === "string") {
    return value.includes("res.cloudinary.com") ? optimizeCloudinaryUrl(value) : value;
  }
  if (Array.isArray(value)) return value.map(optimizeDeep);
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = optimizeDeep(v);
    return out;
  }
  return value;
}

// Rewrites Cloudinary URLs in every JSON response under /api.
export function cloudinaryDeliveryMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.path.startsWith("/api")) return next();
  const originalJson = res.json.bind(res);
  res.json = (body?: unknown) => originalJson(optimizeDeep(body));
  next();
}
