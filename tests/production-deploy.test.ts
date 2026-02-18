import { describe, it, expect, beforeAll } from "vitest";
import * as fs from "fs";
import * as path from "path";

const projectRoot = path.resolve(__dirname, "..");

// ─── Helper ─────────────────────────────────────────────────

function readFile(relativePath: string): string {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf-8");
}

function fileExists(relativePath: string): boolean {
  return fs.existsSync(path.join(projectRoot, relativePath));
}

// ─── Stripe Connect Router ──────────────────────────────────

describe("Stripe Connect Router", () => {
  let routerCode: string;

  beforeAll(() => {
    routerCode = readFile("server/stripe-connect-router.ts");
  });

  it("exports stripeConnectRouter", () => {
    expect(routerCode).toContain("export const stripeConnectRouter");
  });

  it("has createConnectAccount endpoint", () => {
    expect(routerCode).toContain("createConnectAccount");
  });

  it("has getConnectStatus endpoint", () => {
    expect(routerCode).toContain("getConnectStatus");
  });

  it("has completeConnectOnboarding endpoint", () => {
    expect(routerCode).toContain("completeConnectOnboarding");
  });

  it("has createEscrowCharge endpoint for funding escrow", () => {
    expect(routerCode).toContain("createEscrowCharge");
  });

  it("has releaseToActor endpoint for releasing funds", () => {
    expect(routerCode).toContain("releaseToActor");
  });

  it("implements 7.5% platform fee", () => {
    expect(routerCode).toMatch(/0\.075|7\.5/);
  });

  it("has getPlatformFees endpoint for analytics", () => {
    expect(routerCode).toContain("getPlatformFees");
  });

  it("has createPortalSession endpoint", () => {
    expect(routerCode).toContain("createPortalSession");
  });

  it("has getEarningsDetailed endpoint", () => {
    expect(routerCode).toContain("getEarningsDetailed");
  });

  it("has requestInstantPayout endpoint", () => {
    expect(routerCode).toContain("requestInstantPayout");
  });

  it("uses Stripe SDK", () => {
    expect(routerCode).toMatch(/require\("stripe"\)|import.*stripe/i);
  });

  it("creates Express accounts (not Standard)", () => {
    expect(routerCode).toContain("express");
  });
});

// ─── Stripe Webhooks ────────────────────────────────────────

describe("Stripe Webhooks", () => {
  let webhookCode: string;

  beforeAll(() => {
    webhookCode = readFile("server/stripe-webhooks.ts");
  });

  it("exports handleStripeWebhook", () => {
    expect(webhookCode).toContain("export");
    expect(webhookCode).toContain("handleStripeWebhook");
  });

  it("handles payment_intent.succeeded", () => {
    expect(webhookCode).toContain("payment_intent.succeeded");
  });

  it("handles customer.subscription events", () => {
    expect(webhookCode).toContain("customer.subscription");
  });

  it("handles account.updated for Connect", () => {
    expect(webhookCode).toContain("account.updated");
  });

  it("verifies webhook signature", () => {
    expect(webhookCode).toContain("constructEvent");
  });

  it("handles payment and subscription events", () => {
    expect(webhookCode).toMatch(/payment_intent|customer\.subscription|account\.updated/);
  });
});

// ─── Webhook Registration ───────────────────────────────────

describe("Webhook Registration", () => {
  let serverCode: string;

  beforeAll(() => {
    serverCode = readFile("server/_core/index.ts");
  });

  it("registers webhook route before JSON parser", () => {
    const webhookPos = serverCode.indexOf("webhooks/stripe");
    const jsonPos = serverCode.indexOf("express.json");
    expect(webhookPos).toBeLessThan(jsonPos);
    expect(webhookPos).toBeGreaterThan(-1);
  });

  it("uses raw body for webhook", () => {
    expect(serverCode).toContain("express.raw");
  });
});

// ─── Subscription Gating Hook ───────────────────────────────

describe("Subscription Gating Hook", () => {
  let hookCode: string;

  beforeAll(() => {
    hookCode = readFile("hooks/use-subscription.ts");
  });

  it("exports useSubscription hook", () => {
    expect(hookCode).toContain("useSubscription");
  });

  it("defines plan limits for free tier", () => {
    expect(hookCode).toContain("free");
  });

  it("defines plan limits for pro tier", () => {
    expect(hookCode).toContain("pro");
  });

  it("defines plan limits for studio tier", () => {
    expect(hookCode).toContain("studio");
  });

  it("has canPerformAction check", () => {
    expect(hookCode).toMatch(/canPerform|canCreate|checkLimit|isAllowed|checkUsageLimit|canUseFeature/);
  });

  it("tracks usage counts", () => {
    expect(hookCode).toMatch(/usage|count|limit/i);
  });
});

// ─── Featured Casting Boost ─────────────────────────────────

describe("Featured Casting Boost", () => {
  let createCode: string;

  beforeAll(() => {
    createCode = readFile("app/casting/create.tsx");
  });

  it("has boost/featured option in create wizard", () => {
    expect(createCode).toMatch(/boost|featured|Featured/i);
  });

  it("has boost duration options", () => {
    expect(createCode).toMatch(/7 days|14 days|30 days|week|month/i);
  });

  it("shows boost pricing", () => {
    expect(createCode).toMatch(/\$\d+|\d+\.\d{2}/);
  });
});

// ─── Schema Updates ─────────────────────────────────────────

describe("Schema Updates", () => {
  let schemaCode: string;

  beforeAll(() => {
    schemaCode = readFile("drizzle/schema.ts");
  });

  it("has isFeatured column on castingCalls", () => {
    expect(schemaCode).toContain("isFeatured");
  });

  it("has featuredUntil column on castingCalls", () => {
    expect(schemaCode).toContain("featuredUntil");
  });

  it("has stripeConnectAccountId on users", () => {
    expect(schemaCode).toContain("stripeConnectAccountId");
  });
});

// ─── Security Middleware ────────────────────────────────────

describe("Security Middleware", () => {
  let securityCode: string;

  beforeAll(() => {
    securityCode = readFile("server/middleware/security.ts");
  });

  it("exports securityHeaders middleware", () => {
    expect(securityCode).toContain("securityHeaders");
  });

  it("exports rate limiting middleware", () => {
    expect(securityCode).toContain("apiRateLimit");
    expect(securityCode).toContain("authRateLimit");
    expect(securityCode).toContain("paymentRateLimit");
  });

  it("sets HSTS header", () => {
    expect(securityCode).toContain("Strict-Transport-Security");
  });

  it("sets X-Frame-Options header", () => {
    expect(securityCode).toContain("X-Frame-Options");
  });

  it("sets Content-Security-Policy header", () => {
    expect(securityCode).toContain("Content-Security-Policy");
  });

  it("exports request logger", () => {
    expect(securityCode).toContain("requestLogger");
  });

  it("exports error handler", () => {
    expect(securityCode).toContain("errorHandler");
  });

  it("exports content type validator", () => {
    expect(securityCode).toContain("validateContentType");
  });

  it("has rate limit configuration", () => {
    expect(securityCode).toMatch(/window|interval|windowMs|limit|max/i);
  });
});

// ─── Security Registration ──────────────────────────────────

describe("Security Registration in Server", () => {
  let serverCode: string;

  beforeAll(() => {
    serverCode = readFile("server/_core/index.ts");
  });

  it("imports security middleware", () => {
    expect(serverCode).toContain("securityHeaders");
    expect(serverCode).toContain("requestLogger");
  });

  it("applies security headers", () => {
    expect(serverCode).toContain("app.use(securityHeaders)");
  });

  it("applies rate limiting to auth routes", () => {
    expect(serverCode).toContain('"/api/auth", authRateLimit');
  });

  it("applies rate limiting to API routes", () => {
    expect(serverCode).toContain('"/api/trpc", apiRateLimit');
  });

  it("applies error handler last", () => {
    expect(serverCode).toContain("app.use(errorHandler)");
  });
});

// ─── Earnings Screen ────────────────────────────────────────

describe("Earnings Screen", () => {
  let earningsCode: string;

  beforeAll(() => {
    earningsCode = readFile("app/earnings/index.tsx");
  });

  it("exists as a screen", () => {
    expect(fileExists("app/earnings/index.tsx")).toBe(true);
  });

  it("shows Stripe Connect onboarding banner", () => {
    expect(earningsCode).toMatch(/Connect|Set Up Payments|Complete Payment Setup/);
  });

  it("shows earnings overview with total earned", () => {
    expect(earningsCode).toContain("Total Earned");
  });

  it("shows available balance and in-escrow amounts", () => {
    expect(earningsCode).toContain("Available");
    expect(earningsCode).toContain("Escrow");
  });

  it("shows payment history", () => {
    expect(earningsCode).toContain("Recent Payments");
  });

  it("has tax information section", () => {
    expect(earningsCode).toContain("Tax Information");
    expect(earningsCode).toContain("1099");
  });

  it("links to Stripe Dashboard", () => {
    expect(earningsCode).toContain("Stripe Dashboard");
  });

  it("uses pull-to-refresh", () => {
    expect(earningsCode).toContain("RefreshControl");
  });

  it("uses correct tRPC methods", () => {
    expect(earningsCode).toContain("getConnectStatus");
    expect(earningsCode).toContain("createConnectAccount");
    expect(earningsCode).toContain("createPortalSession");
  });
});

// ─── Router Registration ────────────────────────────────────

describe("Router Registration", () => {
  let routersCode: string;

  beforeAll(() => {
    routersCode = readFile("server/routers.ts");
  });

  it("registers stripeConnect router", () => {
    expect(routersCode).toContain("stripeConnect");
  });

  it("registers escrow router", () => {
    expect(routersCode).toContain("escrow");
  });

  it("registers notification router", () => {
    expect(routersCode).toContain("notification");
  });

  it("registers subscription router", () => {
    expect(routersCode).toContain("subscription");
  });
});

// ─── Home Screen Integration ────────────────────────────────

describe("Home Screen Integration", () => {
  let homeCode: string;

  beforeAll(() => {
    homeCode = readFile("app/(tabs)/index.tsx");
  });

  it("links actors to earnings screen", () => {
    expect(homeCode).toContain("/earnings");
  });

  it("links to notifications", () => {
    expect(homeCode).toContain("/notifications");
  });

  it("has upgrade banner for free tier", () => {
    expect(homeCode).toContain("Upgrade to Pro");
  });
});

// ─── App Store Metadata ─────────────────────────────────────

describe("App Store Metadata", () => {
  it("APP_STORE_METADATA.md exists", () => {
    expect(fileExists("APP_STORE_METADATA.md")).toBe(true);
  });

  it("contains app description", () => {
    const metadata = readFile("APP_STORE_METADATA.md");
    expect(metadata).toContain("Description");
  });

  it("contains keywords", () => {
    const metadata = readFile("APP_STORE_METADATA.md");
    expect(metadata).toContain("Keywords");
  });

  it("contains privacy information", () => {
    const metadata = readFile("APP_STORE_METADATA.md");
    expect(metadata).toMatch(/Privacy|privacy/);
  });
});
