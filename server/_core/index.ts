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

  // Deep link scheme for redirecting back to the app
  const APP_SCHEME = "manus20251225042755";

  // Stripe redirect pages — after checkout/onboarding, redirect user back into the app
  const stripeRedirectHtml = (title: string, message: string, deepLink: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - FilmContract</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0F1A2E; color: #fff; }
    .container { text-align: center; padding: 40px 20px; max-width: 400px; }
    .icon { font-size: 64px; margin-bottom: 20px; }
    h1 { font-size: 24px; margin-bottom: 12px; }
    p { color: #9BA1A6; font-size: 16px; line-height: 1.5; margin-bottom: 24px; }
    .btn { display: inline-block; background: #D4A843; color: #0F1A2E; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; }
    .btn:hover { opacity: 0.9; }
    .note { color: #687076; font-size: 13px; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">${title.includes('Success') ? '✅' : title.includes('Cancel') ? '↩️' : '📱'}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="${deepLink}" class="btn">Return to FilmContract</a>
    <p class="note">If the app doesn't open automatically, tap the button above.</p>
  </div>
  <script>
    // Auto-redirect to app after a short delay
    setTimeout(function() { window.location.href = "${deepLink}"; }, 1500);
  </script>
</body>
</html>`;

  // Subscription success page
  app.get("/subscription/success", (req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(stripeRedirectHtml(
      "Payment Successful!",
      "Your subscription has been activated. You can now enjoy all premium features.",
      `${APP_SCHEME}://subscription/success`
    ));
  });

  // Subscription cancel page
  app.get("/subscription/cancel", (_req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(stripeRedirectHtml(
      "Payment Cancelled",
      "No worries! Your subscription was not changed. You can upgrade anytime.",
      `${APP_SCHEME}://subscription`
    ));
  });

  // Stripe Connect onboarding complete
  app.get("/payments/connect/complete", (_req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(stripeRedirectHtml(
      "Account Setup Complete",
      "Your payment account is ready. You can now receive payments for your work.",
      `${APP_SCHEME}://earnings`
    ));
  });

  // Stripe Connect onboarding refresh
  app.get("/payments/connect/refresh", (_req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(stripeRedirectHtml(
      "Session Expired",
      "Your onboarding session expired. Please return to the app and try again.",
      `${APP_SCHEME}://earnings`
    ));
  });

  // Profile return (from Stripe Customer Portal)
  app.get("/profile", (_req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(stripeRedirectHtml(
      "Returning to App",
      "Taking you back to your profile...",
      `${APP_SCHEME}://profile`
    ));
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
