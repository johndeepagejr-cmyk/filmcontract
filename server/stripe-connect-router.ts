import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { getDb } from "./db";
import {
  users,
  escrowPayments,
  contracts,
  castingCalls,
  notifications,
  subscriptions,
} from "@/drizzle/schema";
import { eq, and, desc, sql, lt, gt } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// ─── Stripe Instance ───────────────────────────────────────

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Stripe = require("stripe");
  return new Stripe(key, { apiVersion: "2024-12-18.acacia" });
}

const PLATFORM_FEE_PERCENT = 7.5; // 7.5% platform fee (display)
const PLATFORM_FEE_RATE = 0.075; // 7.5% as decimal (calculation)
const BOOST_PRICE_CENTS = 1900; // $19.00 for featured casting
const BOOST_DURATION_DAYS = 7;

// ─── Helpers ───────────────────────────────────────────────

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

// ─── Router ────────────────────────────────────────────────

export const stripeConnectRouter = router({
  // ═══════════════════════════════════════════════════════════
  // STRIPE CONNECT - Actor Onboarding
  // ═══════════════════════════════════════════════════════════

  /** Create Stripe Connect Express account for actor */
  createConnectAccount: protectedProcedure.mutation(async ({ ctx }) => {
    const stripe = getStripe();
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    // Check if user already has a Connect account
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

    if (user.stripeConnectAccountId) {
      // Already has an account, return onboarding link to complete setup
      if (!stripe) {
        return {
          accountId: user.stripeConnectAccountId,
          onboardingUrl: null,
          alreadyOnboarded: user.stripeConnectOnboarded || false,
          message: "Stripe not configured. Connect account ID exists but cannot generate onboarding link.",
        };
      }

      const accountLink = await stripe.accountLinks.create({
        account: user.stripeConnectAccountId,
        refresh_url: `${process.env.APP_URL || "https://filmcontract.app"}/payments/connect/refresh`,
        return_url: `${process.env.APP_URL || "https://filmcontract.app"}/payments/connect/complete`,
        type: "account_onboarding",
      });

      return {
        accountId: user.stripeConnectAccountId,
        onboardingUrl: accountLink.url,
        alreadyOnboarded: user.stripeConnectOnboarded || false,
      };
    }

    if (!stripe) {
      // Demo mode: create a simulated Connect account
      const simulatedId = `acct_demo_${ctx.user.id}_${Date.now()}`;
      await db
        .update(users)
        .set({ stripeConnectAccountId: simulatedId, stripeConnectOnboarded: false })
        .where(eq(users.id, ctx.user.id));

      return {
        accountId: simulatedId,
        onboardingUrl: null,
        alreadyOnboarded: false,
        message: "Demo mode: Stripe not configured. Simulated Connect account created.",
      };
    }

    // Create real Express account
    const account = await stripe.accounts.create({
      type: "express",
      email: user.email || undefined,
      metadata: { userId: ctx.user.id.toString(), platform: "filmcontract" },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    // Save account ID
    await db
      .update(users)
      .set({ stripeConnectAccountId: account.id, stripeConnectOnboarded: false })
      .where(eq(users.id, ctx.user.id));

    // Generate onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.APP_URL || "https://filmcontract.app"}/payments/connect/refresh`,
      return_url: `${process.env.APP_URL || "https://filmcontract.app"}/payments/connect/complete`,
      type: "account_onboarding",
    });

    return {
      accountId: account.id,
      onboardingUrl: accountLink.url,
      alreadyOnboarded: false,
    };
  }),

  /** Get Connect account status */
  getConnectStatus: protectedProcedure.query(async ({ ctx }) => {
    const stripe = getStripe();
    const db = await getDb();
    if (!db) return { hasAccount: false, chargesEnabled: false, payoutsEnabled: false, onboarded: false };

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    if (!user?.stripeConnectAccountId) {
      return { hasAccount: false, chargesEnabled: false, payoutsEnabled: false, onboarded: false };
    }

    if (!stripe) {
      // Demo mode
      return {
        hasAccount: true,
        accountId: user.stripeConnectAccountId,
        chargesEnabled: user.stripeConnectOnboarded || false,
        payoutsEnabled: user.stripeConnectOnboarded || false,
        onboarded: user.stripeConnectOnboarded || false,
        demoMode: true,
      };
    }

    try {
      const account = await stripe.accounts.retrieve(user.stripeConnectAccountId);
      const onboarded = account.charges_enabled && account.payouts_enabled;

      // Update onboarded status if changed
      if (onboarded !== user.stripeConnectOnboarded) {
        await db
          .update(users)
          .set({ stripeConnectOnboarded: onboarded })
          .where(eq(users.id, ctx.user.id));
      }

      return {
        hasAccount: true,
        accountId: user.stripeConnectAccountId,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        onboarded,
        detailsSubmitted: account.details_submitted,
      };
    } catch (error: any) {
      return {
        hasAccount: true,
        accountId: user.stripeConnectAccountId,
        chargesEnabled: false,
        payoutsEnabled: false,
        onboarded: false,
        error: error.message,
      };
    }
  }),

  /** Complete Connect onboarding (called after redirect) */
  completeConnectOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
    const stripe = getStripe();
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    if (!user?.stripeConnectAccountId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "No Connect account found" });
    }

    if (!stripe) {
      // Demo mode: mark as onboarded
      await db
        .update(users)
        .set({ stripeConnectOnboarded: true })
        .where(eq(users.id, ctx.user.id));
      return { success: true, onboarded: true, demoMode: true };
    }

    const account = await stripe.accounts.retrieve(user.stripeConnectAccountId);
    const onboarded = account.charges_enabled && account.payouts_enabled;

    await db
      .update(users)
      .set({ stripeConnectOnboarded: onboarded })
      .where(eq(users.id, ctx.user.id));

    return { success: true, onboarded };
  }),

  // ═══════════════════════════════════════════════════════════
  // ESCROW CHARGE - Hold funds in platform account
  // ═══════════════════════════════════════════════════════════

  /** Create escrow charge (producer pays, funds held by platform) */
  createEscrowCharge: protectedProcedure
    .input(
      z.object({
        escrowId: z.number(),
        paymentMethodId: z.string().optional(), // Stripe payment method ID
      })
    )
    .mutation(async ({ ctx, input }) => {
      const stripe = getStripe();
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Get escrow details
      const [escrow] = await db
        .select()
        .from(escrowPayments)
        .where(eq(escrowPayments.id, input.escrowId))
        .limit(1);

      if (!escrow) throw new TRPCError({ code: "NOT_FOUND", message: "Escrow not found" });
      if (escrow.payerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the payer can fund escrow" });
      }
      if (escrow.status !== "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Escrow is already ${escrow.status}` });
      }

      const amountCents = Math.round(parseFloat(escrow.amount) * 100);

      if (!stripe) {
        // Demo mode: simulate funding
        const simulatedPiId = `pi_demo_${Date.now()}`;
        await db
          .update(escrowPayments)
          .set({
            status: "funded",
            stripePaymentIntentId: simulatedPiId,
            fundedAt: new Date(),
          })
          .where(eq(escrowPayments.id, input.escrowId));

        await createNotification(
          escrow.payeeId,
          "escrow_funded",
          "Escrow Funded",
          `$${escrow.amount} has been deposited into escrow (demo mode)`,
          { escrowId: input.escrowId, contractId: escrow.contractId }
        );

        return {
          success: true,
          paymentIntentId: simulatedPiId,
          clientSecret: null,
          demoMode: true,
        };
      }

      // Create PaymentIntent with metadata
      const [contract] = await db
        .select()
        .from(contracts)
        .where(eq(contracts.id, escrow.contractId))
        .limit(1);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: "usd",
        metadata: {
          escrowId: input.escrowId.toString(),
          contractId: escrow.contractId.toString(),
          actorId: escrow.payeeId.toString(),
          producerId: escrow.payerId.toString(),
          platformFeePercent: PLATFORM_FEE_PERCENT.toString(),
          type: "escrow_charge",
        },
        description: `Escrow for "${contract?.projectTitle || "Contract"}" - ${escrow.description || "Payment"}`,
        ...(input.paymentMethodId
          ? { payment_method: input.paymentMethodId, confirm: true }
          : {}),
      });

      // Save PaymentIntent ID
      await db
        .update(escrowPayments)
        .set({ stripePaymentIntentId: paymentIntent.id })
        .where(eq(escrowPayments.id, input.escrowId));

      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: amountCents,
      };
    }),

  // ═══════════════════════════════════════════════════════════
  // RELEASE - Transfer to actor minus platform fee
  // ═══════════════════════════════════════════════════════════

  /** Release escrow funds to actor's Connect account */
  releaseToActor: protectedProcedure
    .input(z.object({ escrowId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const stripe = getStripe();
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [escrow] = await db
        .select()
        .from(escrowPayments)
        .where(eq(escrowPayments.id, input.escrowId))
        .limit(1);

      if (!escrow) throw new TRPCError({ code: "NOT_FOUND" });
      if (escrow.payerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the payer can release escrow" });
      }
      if (escrow.status !== "funded") {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Cannot release escrow in "${escrow.status}" status` });
      }

      const grossAmount = parseFloat(escrow.amount);
      const platformFee = Math.round(grossAmount * PLATFORM_FEE_RATE * 100) / 100;
      const netToActor = grossAmount - platformFee;
      const netToActorCents = Math.round(netToActor * 100);

      // Get actor's Connect account
      const [actor] = await db
        .select()
        .from(users)
        .where(eq(users.id, escrow.payeeId))
        .limit(1);

      if (!stripe || !actor?.stripeConnectAccountId) {
        // Demo mode: simulate transfer
        const simulatedTransferId = `tr_demo_${Date.now()}`;
        await db
          .update(escrowPayments)
          .set({
            status: "released",
            stripeTransferId: simulatedTransferId,
            releasedAt: new Date(),
          })
          .where(eq(escrowPayments.id, input.escrowId));

        // Update contract payment status
        await db
          .update(contracts)
          .set({ paymentStatus: "paid", paidAmount: escrow.amount })
          .where(eq(contracts.id, escrow.contractId));

        await createNotification(
          escrow.payeeId,
          "escrow_released",
          "Payment Released!",
          `$${netToActor.toFixed(2)} has been released to your account (after ${PLATFORM_FEE_PERCENT}% platform fee)`,
          {
            escrowId: input.escrowId,
            contractId: escrow.contractId,
            grossAmount: grossAmount.toFixed(2),
            platformFee: platformFee.toFixed(2),
            netToActor: netToActor.toFixed(2),
          }
        );

        return {
          success: true,
          grossAmount: grossAmount.toFixed(2),
          platformFee: platformFee.toFixed(2),
          netToActor: netToActor.toFixed(2),
          transferId: simulatedTransferId,
          demoMode: true,
        };
      }

      // Real Stripe transfer
      const transfer = await stripe.transfers.create({
        amount: netToActorCents,
        currency: "usd",
        destination: actor.stripeConnectAccountId,
        metadata: {
          escrowId: input.escrowId.toString(),
          contractId: escrow.contractId.toString(),
          grossAmount: grossAmount.toFixed(2),
          platformFee: platformFee.toFixed(2),
          netToActor: netToActor.toFixed(2),
          type: "escrow_release",
        },
      });

      await db
        .update(escrowPayments)
        .set({
          status: "released",
          stripeTransferId: transfer.id,
          releasedAt: new Date(),
        })
        .where(eq(escrowPayments.id, input.escrowId));

      // Update contract
      await db
        .update(contracts)
        .set({ paymentStatus: "paid", paidAmount: escrow.amount })
        .where(eq(contracts.id, escrow.contractId));

      await createNotification(
        escrow.payeeId,
        "escrow_released",
        "Payment Released!",
        `$${netToActor.toFixed(2)} has been released to your account (after ${PLATFORM_FEE_PERCENT}% platform fee)`,
        {
          escrowId: input.escrowId,
          contractId: escrow.contractId,
          grossAmount: grossAmount.toFixed(2),
          platformFee: platformFee.toFixed(2),
          netToActor: netToActor.toFixed(2),
        }
      );

      return {
        success: true,
        grossAmount: grossAmount.toFixed(2),
        platformFee: platformFee.toFixed(2),
        netToActor: netToActor.toFixed(2),
        transferId: transfer.id,
      };
    }),

  // ═══════════════════════════════════════════════════════════
  // PLATFORM FEES DASHBOARD
  // ═══════════════════════════════════════════════════════════

  /** Get platform fee analytics (admin/producer view) */
  getPlatformFees: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { totalFees: "0.00", monthlyBreakdown: [], projectedMonthly: "0.00" };

    // Get all released escrows
    const released = await db
      .select()
      .from(escrowPayments)
      .where(eq(escrowPayments.status, "released"));

    let totalFees = 0;
    const monthlyMap: Record<string, number> = {};

    for (const e of released) {
      const gross = parseFloat(e.amount) || 0;
      const fee = Math.round(gross * PLATFORM_FEE_RATE * 100) / 100;
      totalFees += fee;

      if (e.releasedAt) {
        const month = `${e.releasedAt.getFullYear()}-${String(e.releasedAt.getMonth() + 1).padStart(2, "0")}`;
        monthlyMap[month] = (monthlyMap[month] || 0) + fee;
      }
    }

    const monthlyBreakdown = Object.entries(monthlyMap)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([month, amount]) => ({ month, amount: amount.toFixed(2) }));

    // Simple projection: average of last 3 months
    const recentMonths = monthlyBreakdown.slice(0, 3);
    const avgMonthly =
      recentMonths.length > 0
        ? recentMonths.reduce((sum, m) => sum + parseFloat(m.amount), 0) / recentMonths.length
        : 0;

    return {
      totalFees: totalFees.toFixed(2),
      platformFeePercent: PLATFORM_FEE_PERCENT,
      monthlyBreakdown,
      projectedMonthly: avgMonthly.toFixed(2),
      totalTransactions: released.length,
    };
  }),

  // ═══════════════════════════════════════════════════════════
  // FEATURED CASTING BOOST
  // ═══════════════════════════════════════════════════════════

  /** Create payment for featured casting boost ($19) */
  createBoostPayment: protectedProcedure
    .input(z.object({ castingCallId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const stripe = getStripe();
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [casting] = await db
        .select()
        .from(castingCalls)
        .where(eq(castingCalls.id, input.castingCallId))
        .limit(1);

      if (!casting) throw new TRPCError({ code: "NOT_FOUND" });
      if (casting.producerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the casting creator can boost" });
      }

      if (!stripe) {
        // Demo mode: immediately boost
        const featuredUntil = new Date();
        featuredUntil.setDate(featuredUntil.getDate() + BOOST_DURATION_DAYS);

        await db
          .update(castingCalls)
          .set({
            isFeatured: true,
            featuredUntil,
            boostPaymentIntentId: `pi_boost_demo_${Date.now()}`,
          })
          .where(eq(castingCalls.id, input.castingCallId));

        return {
          success: true,
          clientSecret: null,
          demoMode: true,
          featuredUntil: featuredUntil.toISOString(),
          message: `Casting boosted for ${BOOST_DURATION_DAYS} days (demo mode)`,
        };
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: BOOST_PRICE_CENTS,
        currency: "usd",
        metadata: {
          castingCallId: input.castingCallId.toString(),
          producerId: ctx.user.id.toString(),
          type: "casting_boost",
          boostDurationDays: BOOST_DURATION_DAYS.toString(),
        },
        description: `Featured casting boost for "${casting.title}" (${BOOST_DURATION_DAYS} days)`,
      });

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: BOOST_PRICE_CENTS,
        boostDurationDays: BOOST_DURATION_DAYS,
      };
    }),

  /** Confirm boost payment and activate featured status */
  confirmBoost: protectedProcedure
    .input(
      z.object({
        castingCallId: z.number(),
        paymentIntentId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const stripe = getStripe();
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verify payment if Stripe is available
      if (stripe) {
        const pi = await stripe.paymentIntents.retrieve(input.paymentIntentId);
        if (pi.status !== "succeeded") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Payment not yet confirmed" });
        }
      }

      const featuredUntil = new Date();
      featuredUntil.setDate(featuredUntil.getDate() + BOOST_DURATION_DAYS);

      await db
        .update(castingCalls)
        .set({
          isFeatured: true,
          featuredUntil,
          boostPaymentIntentId: input.paymentIntentId,
        })
        .where(eq(castingCalls.id, input.castingCallId));

      return {
        success: true,
        featuredUntil: featuredUntil.toISOString(),
        boostDurationDays: BOOST_DURATION_DAYS,
      };
    }),

  // ═══════════════════════════════════════════════════════════
  // SUBSCRIPTION BILLING (Stripe Checkout)
  // ═══════════════════════════════════════════════════════════

  /** Create Stripe Checkout session for subscription upgrade */
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        plan: z.enum(["pro", "studio"]),
        billingCycle: z.enum(["monthly", "annual"]).default("monthly"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const stripe = getStripe();
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const prices: Record<string, Record<string, number>> = {
        pro: { monthly: 4900, annual: 39200 }, // $49/mo or $392/yr (2 months free)
        studio: { monthly: 19900, annual: 159200 }, // $199/mo or $1592/yr
      };

      const priceAmount = prices[input.plan][input.billingCycle];
      const interval = input.billingCycle === "annual" ? "year" : "month";

      if (!stripe) {
        // Demo mode: upgrade immediately
        const now = new Date();
        const periodEnd = new Date(now);
        if (input.billingCycle === "annual") {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        }

        const [existing] = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.userId, ctx.user.id))
          .limit(1);

        if (existing) {
          await db
            .update(subscriptions)
            .set({
              plan: input.plan,
              status: "active",
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
            })
            .where(eq(subscriptions.id, existing.id));
        } else {
          await db.insert(subscriptions).values({
            userId: ctx.user.id,
            plan: input.plan,
            status: "active",
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            contractsUsedThisMonth: 0,
            contractCountMonth: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
          });
        }

        return {
          checkoutUrl: null,
          demoMode: true,
          plan: input.plan,
          message: `Upgraded to ${input.plan} plan (demo mode)`,
        };
      }

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `FilmContract ${input.plan.charAt(0).toUpperCase() + input.plan.slice(1)}`,
                description: `${input.billingCycle === "annual" ? "Annual" : "Monthly"} subscription`,
              },
              unit_amount: priceAmount,
              recurring: { interval },
            },
            quantity: 1,
          },
        ],
        metadata: {
          userId: ctx.user.id.toString(),
          plan: input.plan,
          billingCycle: input.billingCycle,
        },
        success_url: `${process.env.APP_URL || "https://filmcontract.app"}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.APP_URL || "https://filmcontract.app"}/subscription/cancel`,
      });

      return {
        checkoutUrl: session.url,
        sessionId: session.id,
        plan: input.plan,
      };
    }),

  /** Create Stripe Customer Portal session for self-serve management */
  createPortalSession: protectedProcedure.mutation(async ({ ctx }) => {
    const stripe = getStripe();
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, ctx.user.id))
      .limit(1);

    if (!stripe) {
      return {
        portalUrl: null,
        demoMode: true,
        message: "Stripe not configured. Customer portal unavailable in demo mode.",
      };
    }

    if (!sub?.stripeCustomerId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No Stripe customer found. Please subscribe first.",
      });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${process.env.APP_URL || "https://filmcontract.app"}/profile`,
    });

    return { portalUrl: session.url };
  }),

  // ═══════════════════════════════════════════════════════════
  // ACTOR EARNINGS
  // ═══════════════════════════════════════════════════════════

  /** Get actor earnings with platform fee breakdown */
  getEarningsDetailed: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      return {
        available: "0.00",
        pending: "0.00",
        lifetime: "0.00",
        platformFeesTotal: "0.00",
        transactions: [],
      };
    }

    const escrows = await db
      .select()
      .from(escrowPayments)
      .where(eq(escrowPayments.payeeId, ctx.user.id))
      .orderBy(desc(escrowPayments.createdAt));

    let available = 0;
    let pending = 0;
    let lifetime = 0;
    let platformFeesTotal = 0;

    const transactions = await Promise.all(
      escrows.map(async (e) => {
        const gross = parseFloat(e.amount) || 0;
        const fee = Math.round(gross * PLATFORM_FEE_RATE * 100) / 100;
        const net = gross - fee;

        if (e.status === "funded") available += net;
        if (e.status === "pending") pending += gross;
        if (e.status === "released" || e.status === "resolved") {
          lifetime += net;
          platformFeesTotal += fee;
        }

        const [contract] = await db
          .select({ projectTitle: contracts.projectTitle })
          .from(contracts)
          .where(eq(contracts.id, e.contractId))
          .limit(1);

        return {
          id: e.id,
          contractId: e.contractId,
          projectTitle: contract?.projectTitle || "Unknown",
          grossAmount: gross.toFixed(2),
          platformFee: fee.toFixed(2),
          netAmount: net.toFixed(2),
          status: e.status,
          createdAt: e.createdAt,
          fundedAt: e.fundedAt,
          releasedAt: e.releasedAt,
        };
      })
    );

    return {
      available: available.toFixed(2),
      pending: pending.toFixed(2),
      lifetime: lifetime.toFixed(2),
      platformFeesTotal: platformFeesTotal.toFixed(2),
      platformFeePercent: PLATFORM_FEE_PERCENT,
      transactions,
    };
  }),

  /** Request instant payout (Stripe Instant Payouts) */
  requestInstantPayout: protectedProcedure.mutation(async ({ ctx }) => {
    const stripe = getStripe();
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    if (!user?.stripeConnectAccountId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Set up your Stripe Connect account first to receive payouts",
      });
    }

    if (!stripe) {
      return {
        success: true,
        demoMode: true,
        message: "Instant payout simulated (demo mode)",
      };
    }

    try {
      // Get available balance for this connected account
      const balance = await stripe.balance.retrieve({
        stripeAccount: user.stripeConnectAccountId,
      });

      const available = balance.available.find((b: any) => b.currency === "usd");
      if (!available || available.amount <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No available balance for instant payout",
        });
      }

      const payout = await stripe.payouts.create(
        {
          amount: available.amount,
          currency: "usd",
          method: "instant",
        },
        { stripeAccount: user.stripeConnectAccountId }
      );

      return {
        success: true,
        payoutId: payout.id,
        amount: (available.amount / 100).toFixed(2),
      };
    } catch (error: any) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: error.message || "Failed to create instant payout",
      });
    }
  }),
});
