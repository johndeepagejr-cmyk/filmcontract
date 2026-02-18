import type { Request, Response } from "express";
import { getDb } from "./db";
import {
  escrowPayments,
  castingCalls,
  subscriptions,
  users,
  notifications,
} from "@/drizzle/schema";
import { eq } from "drizzle-orm";

// ─── Helpers ───────────────────────────────────────────────

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  const Stripe = require("stripe");
  return new Stripe(key, { apiVersion: "2024-12-18.acacia" });
}

async function createNotification(
  userId: number,
  type: string,
  title: string,
  body: string,
  data?: Record<string, any>
) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values({
    userId,
    type,
    title,
    body,
    data: data ? JSON.stringify(data) : null,
    groupKey: type,
  });
}

// ─── Webhook Handler ───────────────────────────────────────

export async function handleStripeWebhook(req: Request, res: Response) {
  const stripe = getStripe();
  if (!stripe) {
    return res.status(400).json({ error: "Stripe not configured" });
  }

  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: any;

  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      // No webhook secret configured — parse raw body
      event = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    }
  } catch (err: any) {
    console.error("[Stripe Webhook] Signature verification failed:", err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  const db = await getDb();
  if (!db) {
    return res.status(500).json({ error: "Database not available" });
  }

  try {
    switch (event.type) {
      // ═══════════════════════════════════════════════════════
      // PAYMENT INTENT EVENTS (Escrow)
      // ═══════════════════════════════════════════════════════

      case "payment_intent.succeeded": {
        const pi = event.data.object;
        const metadata = pi.metadata || {};

        if (metadata.type === "escrow_charge") {
          // Escrow payment confirmed — mark as funded
          const escrowId = parseInt(metadata.escrowId);
          if (escrowId) {
            await db
              .update(escrowPayments)
              .set({
                status: "funded",
                fundedAt: new Date(),
              })
              .where(eq(escrowPayments.id, escrowId));

            // Notify actor
            const actorId = parseInt(metadata.actorId);
            if (actorId) {
              const amount = (pi.amount / 100).toFixed(2);
              await createNotification(
                actorId,
                "escrow_funded",
                "Escrow Funded",
                `$${amount} has been deposited into escrow for your contract`,
                { escrowId, contractId: parseInt(metadata.contractId) }
              );
            }
          }
        }

        if (metadata.type === "casting_boost") {
          // Featured casting boost confirmed
          const castingCallId = parseInt(metadata.castingCallId);
          const boostDays = parseInt(metadata.boostDurationDays) || 7;
          const featuredUntil = new Date();
          featuredUntil.setDate(featuredUntil.getDate() + boostDays);

          await db
            .update(castingCalls)
            .set({
              isFeatured: true,
              featuredUntil,
              boostPaymentIntentId: pi.id,
            })
            .where(eq(castingCalls.id, castingCallId));

          const producerId = parseInt(metadata.producerId);
          if (producerId) {
            await createNotification(
              producerId,
              "casting_boosted",
              "Casting Boosted!",
              `Your casting is now featured for ${boostDays} days`,
              { castingCallId }
            );
          }
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object;
        const metadata = pi.metadata || {};

        if (metadata.type === "escrow_charge") {
          const producerId = parseInt(metadata.producerId);
          if (producerId) {
            await createNotification(
              producerId,
              "payment_failed",
              "Payment Failed",
              `Escrow payment of $${(pi.amount / 100).toFixed(2)} failed. Please try again.`,
              { escrowId: parseInt(metadata.escrowId) }
            );
          }
        }
        break;
      }

      // ═══════════════════════════════════════════════════════
      // SUBSCRIPTION EVENTS
      // ═══════════════════════════════════════════════════════

      case "checkout.session.completed": {
        const session = event.data.object;
        const metadata = session.metadata || {};

        if (session.mode === "subscription" && metadata.userId) {
          const userId = parseInt(metadata.userId);
          const plan = metadata.plan as "pro" | "studio";

          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(session.subscription);

          const [existing] = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.userId, userId))
            .limit(1);

          const subData = {
            plan,
            status: "active" as const,
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            isTrial: false,
          };

          if (existing) {
            await db
              .update(subscriptions)
              .set(subData)
              .where(eq(subscriptions.id, existing.id));
          } else {
            const now = new Date();
            await db.insert(subscriptions).values({
              ...subData,
              userId,
              contractsUsedThisMonth: 0,
              contractCountMonth: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
            });
          }

          await createNotification(
            userId,
            "subscription_upgraded",
            "Subscription Upgraded!",
            `Welcome to FilmContract ${plan.charAt(0).toUpperCase() + plan.slice(1)}!`,
            { plan }
          );
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        const [sub] = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.stripeCustomerId, customerId))
          .limit(1);

        if (sub) {
          await db
            .update(subscriptions)
            .set({
              status: subscription.status === "active" ? "active" : "past_due",
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            })
            .where(eq(subscriptions.id, sub.id));
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        const [sub] = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.stripeCustomerId, customerId))
          .limit(1);

        if (sub) {
          await db
            .update(subscriptions)
            .set({
              plan: "free",
              status: "canceled",
              canceledAt: new Date(),
            })
            .where(eq(subscriptions.id, sub.id));

          await createNotification(
            sub.userId,
            "subscription_canceled",
            "Subscription Canceled",
            "Your subscription has been canceled. You're now on the Free plan.",
            { plan: "free" }
          );
        }
        break;
      }

      // ═══════════════════════════════════════════════════════
      // CONNECT EVENTS
      // ═══════════════════════════════════════════════════════

      case "account.updated": {
        const account = event.data.object;
        const userId = account.metadata?.userId;

        if (userId) {
          const onboarded = account.charges_enabled && account.payouts_enabled;
          await db
            .update(users)
            .set({ stripeConnectOnboarded: onboarded })
            .where(eq(users.id, parseInt(userId)));

          if (onboarded) {
            await createNotification(
              parseInt(userId),
              "connect_onboarded",
              "Payment Setup Complete!",
              "Your Stripe account is verified. You can now receive payments for your work.",
              {}
            );
          }
        }
        break;
      }

      case "transfer.created": {
        const transfer = event.data.object;
        const metadata = transfer.metadata || {};

        if (metadata.type === "escrow_release") {
          console.log(
            `[Stripe] Transfer ${transfer.id} created: $${(transfer.amount / 100).toFixed(2)} to ${transfer.destination}`
          );
        }
        break;
      }

      default:
        // Unhandled event type
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return res.json({ received: true });
  } catch (error: any) {
    console.error("[Stripe Webhook] Processing error:", error);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
}
