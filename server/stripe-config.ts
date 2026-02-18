/**
 * Stripe Configuration & Environment Validation
 *
 * Validates Stripe API keys, detects live vs test mode,
 * and provides a centralized Stripe instance.
 */

export interface StripeConfig {
  isLive: boolean;
  isConfigured: boolean;
  hasWebhookSecret: boolean;
  secretKeyPrefix: string;
  publishableKeyPrefix: string;
  warnings: string[];
}

/**
 * Validate Stripe environment configuration.
 * Call this at server startup to surface misconfigurations early.
 */
export function validateStripeConfig(): StripeConfig {
  const secretKey = process.env.STRIPE_SECRET_KEY || "";
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

  const warnings: string[] = [];

  const isSecretLive = secretKey.startsWith("sk_live_");
  const isSecretTest = secretKey.startsWith("sk_test_");
  const isPubLive = publishableKey.startsWith("pk_live_");
  const isPubTest = publishableKey.startsWith("pk_test_");

  // Check for mode mismatch
  if ((isSecretLive && isPubTest) || (isSecretTest && isPubLive)) {
    warnings.push(
      "CRITICAL: Stripe key mode mismatch! Secret key and publishable key are in different modes (live vs test). " +
      "This will cause payment failures."
    );
  }

  // Check for missing keys
  if (!secretKey) {
    warnings.push("STRIPE_SECRET_KEY is not set. Payments will run in demo mode.");
  }
  if (!publishableKey) {
    warnings.push("STRIPE_PUBLISHABLE_KEY is not set. Client-side payment forms will not work.");
  }
  if (!webhookSecret) {
    warnings.push(
      "STRIPE_WEBHOOK_SECRET is not set. Webhook signature verification is disabled. " +
      "Create a webhook endpoint in Stripe Dashboard → Developers → Webhooks."
    );
  }

  // Warn about test mode in production
  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction && isSecretTest) {
    warnings.push(
      "WARNING: Running in production with Stripe TEST keys. " +
      "Switch to live keys (sk_live_ / pk_live_) before accepting real payments."
    );
  }

  const isLive = isSecretLive && isPubLive;
  const isConfigured = !!secretKey && !!publishableKey;

  return {
    isLive,
    isConfigured,
    hasWebhookSecret: !!webhookSecret,
    secretKeyPrefix: secretKey.substring(0, 8) + "...",
    publishableKeyPrefix: publishableKey.substring(0, 8) + "...",
    warnings,
  };
}

/**
 * Log Stripe configuration status at server startup.
 */
export function logStripeStatus(): void {
  const config = validateStripeConfig();

  console.log("\n═══ Stripe Configuration ═══");
  console.log(`  Mode:           ${config.isLive ? "🟢 LIVE" : "🟡 TEST"}`);
  console.log(`  Configured:     ${config.isConfigured ? "✅ Yes" : "❌ No"}`);
  console.log(`  Webhook Secret: ${config.hasWebhookSecret ? "✅ Set" : "⚠️  Missing"}`);
  console.log(`  Secret Key:     ${config.secretKeyPrefix}`);
  console.log(`  Publishable:    ${config.publishableKeyPrefix}`);

  if (config.warnings.length > 0) {
    console.log("\n  ⚠️  Warnings:");
    config.warnings.forEach((w) => console.log(`    - ${w}`));
  }

  console.log("════════════════════════════\n");
}
