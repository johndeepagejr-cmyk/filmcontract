import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerEmailAuthRoutes } from "./email-auth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { handleStripeWebhook } from "../stripe-webhooks";
import { logStripeStatus } from "../stripe-config";
import { initSentry, sentryErrorHandler } from "../sentry";
import { securityHeaders, requestLogger, apiRateLimit, authRateLimit, paymentRateLimit, errorHandler, validateContentType } from "../middleware/security";
import { privacyPolicyHtml, termsOfServiceHtml } from "../legal-pages";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Enable CORS for all routes - reflect the request origin to support credentials
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );
    res.header("Access-Control-Allow-Credentials", "true");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Security middleware
  app.use(securityHeaders);
  app.use(requestLogger);
  app.use(validateContentType);

  // Stripe webhook needs raw body for signature verification — must be before json parser
  app.post("/api/webhooks/stripe", express.raw({ type: "application/json" }), handleStripeWebhook);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerOAuthRoutes(app);
  registerEmailAuthRoutes(app);

  // Privacy Policy page (required by App Store & Google Play)
  app.get("/privacy", (_req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(privacyPolicyHtml);
  });

  // Terms of Service page
  app.get("/terms", (_req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(termsOfServiceHtml);
  });

  // Health check endpoint with version info
  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      status: "healthy",
      version: "1.0.0",
      timestamp: Date.now(),
      uptime: process.uptime(),
    });
  });

  // Rate limiting for specific routes
  app.use("/api/auth", authRateLimit);
  app.use("/api/webhooks", paymentRateLimit);
  app.use("/api/trpc", apiRateLimit);

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  // Global error handler (must be last)
  app.use(sentryErrorHandler());
  app.use(errorHandler);

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`[api] server listening on port ${port}`);
    logStripeStatus();
    initSentry();
  });
}

startServer().catch(console.error);
