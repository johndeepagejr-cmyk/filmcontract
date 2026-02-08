import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { subscriptions } from "@/drizzle/schema";
import { eq, sql } from "drizzle-orm";

/** Plan limits configuration */
const PLAN_LIMITS = {
  free: {
    contractsPerMonth: 2,
    templates: false,
    hellosign: false,
    analytics: false,
    prioritySupport: false,
    featuredProfile: false,
    teamMembers: 1,
    storageGB: 1,
  },
  pro: {
    contractsPerMonth: 25,
    templates: true,
    hellosign: true,
    analytics: true,
    prioritySupport: false,
    featuredProfile: false,
    teamMembers: 1,
    storageGB: 10,
  },
  studio: {
    contractsPerMonth: -1, // unlimited
    templates: true,
    hellosign: true,
    analytics: true,
    prioritySupport: true,
    featuredProfile: true,
    teamMembers: 10,
    storageGB: 100,
  },
} as const;

const PLAN_PRICES = {
  free: { monthly: 0, yearly: 0 },
  pro: { monthly: 1499, yearly: 14990 }, // in cents
  studio: { monthly: 4999, yearly: 49990 },
} as const;

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export const subscriptionRouter = router({
  /** Get current user's subscription info */
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    const database = await getDb();
    if (!database) {
      return {
        plan: "free" as const,
        status: "active" as const,
        contractsUsedThisMonth: 0,
        limits: PLAN_LIMITS.free,
        prices: PLAN_PRICES,
      };
    }

    const result = await database
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, ctx.user.id))
      .limit(1);

    const sub = result[0];
    const currentMonth = getCurrentMonth();

    if (!sub) {
      // Create free subscription for new users
      await database.insert(subscriptions).values({
        userId: ctx.user.id,
        plan: "free",
        status: "active",
        contractsUsedThisMonth: 0,
        contractCountMonth: currentMonth,
      });

      return {
        plan: "free" as const,
        status: "active" as const,
        contractsUsedThisMonth: 0,
        limits: PLAN_LIMITS.free,
        prices: PLAN_PRICES,
      };
    }

    // Reset monthly count if new month
    let contractsUsed = sub.contractsUsedThisMonth;
    if (sub.contractCountMonth !== currentMonth) {
      await database
        .update(subscriptions)
        .set({ contractsUsedThisMonth: 0, contractCountMonth: currentMonth })
        .where(eq(subscriptions.id, sub.id));
      contractsUsed = 0;
    }

    const plan = sub.plan as keyof typeof PLAN_LIMITS;
    return {
      plan,
      status: sub.status,
      contractsUsedThisMonth: contractsUsed,
      currentPeriodEnd: sub.currentPeriodEnd,
      isTrial: sub.isTrial,
      trialEndsAt: sub.trialEndsAt,
      limits: PLAN_LIMITS[plan],
      prices: PLAN_PRICES,
    };
  }),

  /** Check if user can create a new contract */
  canCreateContract: protectedProcedure.query(async ({ ctx }) => {
    const database = await getDb();
    if (!database) return { allowed: true, reason: null };

    const result = await database
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, ctx.user.id))
      .limit(1);

    const sub = result[0];
    if (!sub) return { allowed: true, reason: null }; // Free users get 2

    const plan = sub.plan as keyof typeof PLAN_LIMITS;
    const limit = PLAN_LIMITS[plan].contractsPerMonth;

    if (limit === -1) return { allowed: true, reason: null }; // Unlimited

    const currentMonth = getCurrentMonth();
    const used = sub.contractCountMonth === currentMonth ? sub.contractsUsedThisMonth : 0;

    if (used >= limit) {
      return {
        allowed: false,
        reason: `You've reached your monthly limit of ${limit} contracts on the ${plan} plan. Upgrade to create more.`,
      };
    }

    return { allowed: true, reason: null, remaining: limit - used };
  }),

  /** Increment contract usage count */
  incrementContractUsage: protectedProcedure.mutation(async ({ ctx }) => {
    const database = await getDb();
    if (!database) return { success: true };

    const currentMonth = getCurrentMonth();
    const result = await database
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, ctx.user.id))
      .limit(1);

    if (!result[0]) {
      await database.insert(subscriptions).values({
        userId: ctx.user.id,
        plan: "free",
        status: "active",
        contractsUsedThisMonth: 1,
        contractCountMonth: currentMonth,
      });
    } else {
      const sub = result[0];
      const newCount = sub.contractCountMonth === currentMonth
        ? sub.contractsUsedThisMonth + 1
        : 1;

      await database
        .update(subscriptions)
        .set({
          contractsUsedThisMonth: newCount,
          contractCountMonth: currentMonth,
        })
        .where(eq(subscriptions.id, sub.id));
    }

    return { success: true };
  }),

  /** Get all plan details for pricing page */
  getPlans: protectedProcedure.query(() => {
    return {
      plans: [
        {
          id: "free",
          name: "Free",
          description: "Get started with basic contract management",
          monthlyPrice: 0,
          yearlyPrice: 0,
          features: [
            "2 contracts per month",
            "Basic contract templates",
            "In-app signatures",
            "1 GB storage",
            "Community support",
          ],
          limits: PLAN_LIMITS.free,
        },
        {
          id: "pro",
          name: "Pro",
          description: "For working actors and independent producers",
          monthlyPrice: 14.99,
          yearlyPrice: 149.90,
          features: [
            "25 contracts per month",
            "All contract templates",
            "HelloSign legal e-signatures",
            "Analytics dashboard",
            "10 GB storage",
            "Email support",
          ],
          limits: PLAN_LIMITS.pro,
          popular: true,
        },
        {
          id: "studio",
          name: "Studio",
          description: "For production companies and agencies",
          monthlyPrice: 49.99,
          yearlyPrice: 499.90,
          features: [
            "Unlimited contracts",
            "All Pro features",
            "Featured profile listing",
            "Priority support",
            "Up to 10 team members",
            "100 GB storage",
            "Custom branding",
          ],
          limits: PLAN_LIMITS.studio,
        },
      ],
    };
  }),

  /** Upgrade/downgrade subscription plan */
  changePlan: protectedProcedure
    .input(
      z.object({
        plan: z.enum(["free", "pro", "studio"]),
        billingCycle: z.enum(["monthly", "yearly"]).optional().default("monthly"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      // For free plan, just update directly
      if (input.plan === "free") {
        const result = await database
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.userId, ctx.user.id))
          .limit(1);

        if (result[0]) {
          await database
            .update(subscriptions)
            .set({ plan: "free", status: "active", canceledAt: new Date() })
            .where(eq(subscriptions.id, result[0].id));
        }

        return { success: true, plan: "free", checkoutUrl: null };
      }

      // For paid plans, check if Stripe is configured
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) {
        // If no Stripe, still allow plan change (for testing/demo)
        const currentMonth = getCurrentMonth();
        const result = await database
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.userId, ctx.user.id))
          .limit(1);

        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        if (result[0]) {
          await database
            .update(subscriptions)
            .set({
              plan: input.plan,
              status: "active",
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
              isTrial: true,
              trialEndsAt: periodEnd,
            })
            .where(eq(subscriptions.id, result[0].id));
        } else {
          await database.insert(subscriptions).values({
            userId: ctx.user.id,
            plan: input.plan,
            status: "active",
            contractsUsedThisMonth: 0,
            contractCountMonth: currentMonth,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            isTrial: true,
            trialEndsAt: periodEnd,
          });
        }

        return {
          success: true,
          plan: input.plan,
          checkoutUrl: null,
          message: "Plan activated with a 30-day free trial. Set up Stripe for payment processing.",
        };
      }

      // With Stripe configured, create checkout session
      try {
        const stripe = require("stripe")(stripeKey);
        const priceAmount = PLAN_PRICES[input.plan][input.billingCycle === "yearly" ? "yearly" : "monthly"];

        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: `FilmContract ${input.plan.charAt(0).toUpperCase() + input.plan.slice(1)} Plan`,
                  description: `${input.billingCycle === "yearly" ? "Annual" : "Monthly"} subscription`,
                },
                unit_amount: priceAmount,
                recurring: {
                  interval: input.billingCycle === "yearly" ? "year" : "month",
                },
              },
              quantity: 1,
            },
          ],
          metadata: {
            userId: ctx.user.id.toString(),
            plan: input.plan,
          },
          success_url: `${process.env.APP_URL || "https://filmcontract.app"}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.APP_URL || "https://filmcontract.app"}/subscription/cancel`,
        });

        return {
          success: true,
          plan: input.plan,
          checkoutUrl: session.url,
        };
      } catch (error: any) {
        throw new Error(`Failed to create checkout: ${error.message}`);
      }
    }),
});
