import type { Request, Response, NextFunction } from "express";

// ─── Rate Limiter (In-Memory) ──────────────────────────────
// Simple sliding window rate limiter. For production at scale,
// replace with Redis-backed limiter (e.g., rate-limiter-flexible).

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (entry.resetAt < now) rateLimitStore.delete(key);
  }
}, 5 * 60 * 1000);

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
}

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, maxRequests, keyPrefix = "rl" } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();

    const entry = rateLimitStore.get(key);

    if (!entry || entry.resetAt < now) {
      rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", maxRequests - 1);
      res.setHeader("X-RateLimit-Reset", Math.ceil((now + windowMs) / 1000));
      return next();
    }

    entry.count++;

    if (entry.count > maxRequests) {
      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", 0);
      res.setHeader("X-RateLimit-Reset", Math.ceil(entry.resetAt / 1000));
      res.setHeader("Retry-After", Math.ceil((entry.resetAt - now) / 1000));
      return res.status(429).json({
        error: "Too Many Requests",
        message: "Rate limit exceeded. Please try again later.",
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      });
    }

    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", maxRequests - entry.count);
    res.setHeader("X-RateLimit-Reset", Math.ceil(entry.resetAt / 1000));
    next();
  };
}

// ─── Security Headers ──────────────────────────────────────

export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");

  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // XSS protection (legacy browsers)
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Referrer policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions policy — disable unnecessary browser features
  res.setHeader(
    "Permissions-Policy",
    "camera=(self), microphone=(self), geolocation=(), payment=(self), usb=()"
  );

  // Content Security Policy (report-only for now to avoid breaking things)
  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Content-Security-Policy-Report-Only",
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.stripe.com https://expo.dev;"
    );
  }

  // Strict Transport Security (HTTPS only)
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }

  next();
}

// ─── Request Validation ────────────────────────────────────

export function validateContentType(req: Request, res: Response, next: NextFunction) {
  // Only check POST/PUT/PATCH requests
  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    const contentType = req.headers["content-type"];
    // Skip webhook endpoints (they use raw body)
    if (req.path.includes("/webhooks/")) return next();
    // Skip if no body
    if (!contentType && !req.body) return next();
    // Allow JSON and form data
    if (
      contentType &&
      !contentType.includes("application/json") &&
      !contentType.includes("multipart/form-data") &&
      !contentType.includes("application/x-www-form-urlencoded")
    ) {
      return res.status(415).json({
        error: "Unsupported Media Type",
        message: "Content-Type must be application/json, multipart/form-data, or application/x-www-form-urlencoded",
      });
    }
  }
  next();
}

// ─── Request Logging ───────────────────────────────────────

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;

    // Only log slow requests (>1s) or errors in production
    if (process.env.NODE_ENV === "production") {
      if (duration > 1000 || status >= 400) {
        console.log(
          `[API] ${req.method} ${req.path} → ${status} (${duration}ms)${status >= 400 ? " ⚠" : " 🐌"}`
        );
      }
    } else {
      // In dev, log everything except health checks
      if (!req.path.includes("/health")) {
        const emoji = status >= 500 ? "❌" : status >= 400 ? "⚠️" : "✅";
        console.log(`[API] ${emoji} ${req.method} ${req.path} → ${status} (${duration}ms)`);
      }
    }
  });

  next();
}

// ─── Error Handler ─────────────────────────────────────────

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  console.error(`[API Error] ${req.method} ${req.path}:`, err.message);

  // Don't leak stack traces in production
  const isDev = process.env.NODE_ENV !== "production";

  if (err.name === "ZodError") {
    return res.status(400).json({
      error: "Validation Error",
      message: "Invalid request data",
      details: isDev ? err.errors : undefined,
    });
  }

  if (err.code === "UNAUTHORIZED" || err.statusCode === 401) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Authentication required",
    });
  }

  if (err.code === "FORBIDDEN" || err.statusCode === 403) {
    return res.status(403).json({
      error: "Forbidden",
      message: "You don't have permission to perform this action",
    });
  }

  return res.status(err.statusCode || 500).json({
    error: "Internal Server Error",
    message: isDev ? err.message : "Something went wrong. Please try again.",
    ...(isDev && { stack: err.stack }),
  });
}

// ─── Preset Rate Limiters ──────────────────────────────────

/** General API: 100 requests per minute */
export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  maxRequests: 100,
  keyPrefix: "api",
});

/** Auth endpoints: 10 requests per minute */
export const authRateLimit = rateLimit({
  windowMs: 60 * 1000,
  maxRequests: 10,
  keyPrefix: "auth",
});

/** Payment endpoints: 20 requests per minute */
export const paymentRateLimit = rateLimit({
  windowMs: 60 * 1000,
  maxRequests: 20,
  keyPrefix: "pay",
});

/** Upload endpoints: 5 requests per minute */
export const uploadRateLimit = rateLimit({
  windowMs: 60 * 1000,
  maxRequests: 5,
  keyPrefix: "upload",
});
