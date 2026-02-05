import Stripe from "stripe";

// Initialize Stripe with secret key from environment
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn("⚠️  STRIPE_SECRET_KEY not found in environment variables. Payment processing will not work.");
}

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2025-12-15.clover",
    })
  : null;

/**
 * Create a payment intent for contract payment
 */
export async function createContractPaymentIntent(
  amount: number,
  contractId: number,
  actorEmail: string,
  projectTitle: string
): Promise<{ clientSecret: string; paymentIntentId: string }> {
  if (!stripe) {
    throw new Error("Stripe is not configured. Please add STRIPE_SECRET_KEY to environment variables.");
  }

  // Convert amount to cents (Stripe requires amounts in smallest currency unit)
  const amountInCents = Math.round(amount * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: "usd",
    metadata: {
      type: "contract_payment",
      contractId: contractId.toString(),
      actorEmail,
      projectTitle,
    },
    receipt_email: actorEmail,
  });

  return {
    clientSecret: paymentIntent.client_secret!,
    paymentIntentId: paymentIntent.id,
  };
}

/**
 * Create a payment intent for donation to developer
 */
export async function createDonationPaymentIntent(
  amount: number,
  donorEmail?: string,
  donorName?: string
): Promise<{ clientSecret: string; paymentIntentId: string }> {
  if (!stripe) {
    throw new Error("Stripe is not configured. Please add STRIPE_SECRET_KEY to environment variables.");
  }

  // Convert amount to cents
  const amountInCents = Math.round(amount * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: "usd",
    metadata: {
      type: "donation",
      donorName: donorName || "Anonymous",
    },
    receipt_email: donorEmail,
  });

  return {
    clientSecret: paymentIntent.client_secret!,
    paymentIntentId: paymentIntent.id,
  };
}

/**
 * Verify payment intent status
 */
export async function verifyPaymentIntent(paymentIntentId: string): Promise<boolean> {
  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  return paymentIntent.status === "succeeded";
}

/**
 * Get payment intent details
 */
export async function getPaymentIntent(paymentIntentId: string) {
  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  return await stripe.paymentIntents.retrieve(paymentIntentId);
}
