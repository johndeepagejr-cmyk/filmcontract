/**
 * Sentry Error Tracking Integration
 *
 * Server-side error tracking with Sentry.
 * Captures unhandled exceptions, tRPC errors, and performance data.
 *
 * Setup: Set SENTRY_DSN environment variable to enable.
 * Get your DSN from https://sentry.io → Project Settings → Client Keys (DSN)
 */

interface SentryEvent {
  level: "fatal" | "error" | "warning" | "info";
  message: string;
  tags?: Record<string, string>;
  extra?: Record<string, any>;
  user?: { id?: string; email?: string; role?: string };
  timestamp: string;
}

// In-memory buffer for when Sentry SDK is not available
const eventBuffer: SentryEvent[] = [];
const MAX_BUFFER_SIZE = 100;

let sentryInitialized = false;

/**
 * Initialize Sentry. Call once at server startup.
 */
export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    console.log("[Sentry] SENTRY_DSN not set — error tracking disabled. Events will be buffered locally.");
    return;
  }

  // Dynamic import to avoid requiring sentry as a hard dependency
  try {
    // For now, use HTTP API directly instead of SDK to avoid dependency issues
    sentryInitialized = true;
    console.log("[Sentry] ✅ Error tracking enabled");
    console.log(`[Sentry] DSN: ${dsn.substring(0, 20)}...`);
    console.log(`[Sentry] Environment: ${process.env.NODE_ENV || "development"}`);
  } catch (err) {
    console.error("[Sentry] Failed to initialize:", err);
  }
}

/**
 * Capture an error event.
 */
export function captureException(
  error: Error | unknown,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
    user?: { id?: string; email?: string; role?: string };
  }
): void {
  const err = error instanceof Error ? error : new Error(String(error));

  const event: SentryEvent = {
    level: "error",
    message: `${err.name}: ${err.message}`,
    tags: {
      ...context?.tags,
      environment: process.env.NODE_ENV || "development",
      runtime: "node",
    },
    extra: {
      ...context?.extra,
      stack: err.stack,
    },
    user: context?.user,
    timestamp: new Date().toISOString(),
  };

  if (sentryInitialized && process.env.SENTRY_DSN) {
    sendToSentry(event);
  } else {
    bufferEvent(event);
  }

  // Always log to console in development
  if (process.env.NODE_ENV !== "production") {
    console.error(`[Sentry:${event.level}] ${event.message}`);
  }
}

/**
 * Capture a message (non-error event).
 */
export function captureMessage(
  message: string,
  level: SentryEvent["level"] = "info",
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
    user?: { id?: string; email?: string; role?: string };
  }
): void {
  const event: SentryEvent = {
    level,
    message,
    tags: {
      ...context?.tags,
      environment: process.env.NODE_ENV || "development",
    },
    extra: context?.extra,
    user: context?.user,
    timestamp: new Date().toISOString(),
  };

  if (sentryInitialized && process.env.SENTRY_DSN) {
    sendToSentry(event);
  } else {
    bufferEvent(event);
  }
}

/**
 * Capture payment-related events for monitoring.
 */
export function capturePaymentEvent(
  action: "escrow_created" | "escrow_funded" | "escrow_released" | "escrow_disputed" | "payment_failed" | "subscription_created" | "subscription_cancelled",
  details: {
    amount?: string;
    userId?: number;
    contractId?: number;
    escrowId?: number;
    error?: string;
  }
): void {
  captureMessage(`Payment: ${action}`, details.error ? "warning" : "info", {
    tags: {
      payment_action: action,
      has_error: details.error ? "true" : "false",
    },
    extra: details,
    user: details.userId ? { id: details.userId.toString() } : undefined,
  });
}

/**
 * Express error handler middleware for Sentry.
 * Add BEFORE your regular error handler.
 */
export function sentryErrorHandler() {
  return (err: Error, req: any, res: any, next: any) => {
    captureException(err, {
      tags: {
        method: req.method,
        path: req.path,
        status: res.statusCode?.toString(),
      },
      extra: {
        query: req.query,
        body: req.body ? "[redacted]" : undefined,
        headers: {
          "user-agent": req.headers?.["user-agent"],
          "content-type": req.headers?.["content-type"],
        },
      },
      user: req.user
        ? { id: req.user.id?.toString(), email: req.user.email, role: req.user.role }
        : undefined,
    });
    next(err);
  };
}

// ─── Internal ─────────────────────────────────────────────

function bufferEvent(event: SentryEvent): void {
  if (eventBuffer.length >= MAX_BUFFER_SIZE) {
    eventBuffer.shift(); // Remove oldest
  }
  eventBuffer.push(event);
}

async function sendToSentry(event: SentryEvent): Promise<void> {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  try {
    // Parse DSN: https://{key}@{host}/{project_id}
    const dsnUrl = new URL(dsn);
    const key = dsnUrl.username;
    const projectId = dsnUrl.pathname.replace("/", "");
    const host = dsnUrl.host;

    const storeUrl = `https://${host}/api/${projectId}/store/`;

    const payload = {
      event_id: crypto.randomUUID().replace(/-/g, ""),
      timestamp: event.timestamp,
      level: event.level,
      logger: "filmcontract.server",
      platform: "node",
      server_name: "filmcontract-api",
      environment: process.env.NODE_ENV || "development",
      message: { formatted: event.message },
      tags: event.tags,
      extra: event.extra,
      user: event.user,
    };

    await fetch(storeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_client=filmcontract/1.0.0, sentry_key=${key}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // Silently fail — don't let Sentry errors crash the app
    bufferEvent(event);
  }
}

/**
 * Get buffered events (useful for debugging when Sentry is not configured).
 */
export function getBufferedEvents(): SentryEvent[] {
  return [...eventBuffer];
}

/**
 * Flush buffered events to Sentry (call after DSN is set).
 */
export async function flushBuffer(): Promise<number> {
  if (!sentryInitialized || !process.env.SENTRY_DSN) return 0;

  const events = [...eventBuffer];
  eventBuffer.length = 0;

  for (const event of events) {
    await sendToSentry(event);
  }

  return events.length;
}
