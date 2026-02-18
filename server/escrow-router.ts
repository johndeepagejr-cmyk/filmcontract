import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { escrowPayments, contracts, users, notifications } from "@/drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// ─── Helpers ────────────────────────────────────────────────

async function createNotification(
  userId: number,
  type: string,
  title: string,
  body: string,
  data?: Record<string, any>,
  groupKey?: string
) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values({
    userId,
    type,
    title,
    body,
    data: data ? JSON.stringify(data) : null,
    groupKey: groupKey || type,
  });
}

// Valid state transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["funded", "cancelled"],
  funded: ["released", "disputed"],
  disputed: ["resolved", "refunded"],
  resolved: [], // terminal
  released: [], // terminal
  refunded: [], // terminal
  cancelled: [], // terminal
};

// ─── Router ─────────────────────────────────────────────────

export const escrowRouter = router({
  // Create escrow for a contract
  create: protectedProcedure
    .input(z.object({
      contractId: z.number(),
      amount: z.string(), // decimal string
      description: z.string().optional(),
      milestoneNumber: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verify contract exists and user is the producer
      const [contract] = await db.select().from(contracts).where(eq(contracts.id, input.contractId)).limit(1);
      if (!contract) throw new TRPCError({ code: "NOT_FOUND", message: "Contract not found" });
      if (contract.producerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the producer can create escrow payments" });
      }

      const result = await db.insert(escrowPayments).values({
        contractId: input.contractId,
        payerId: ctx.user.id,
        payeeId: contract.actorId,
        amount: input.amount,
        description: input.description || `Payment for ${contract.projectTitle}`,
        milestoneNumber: input.milestoneNumber || 1,
      });

      // Notify actor
      await createNotification(
        contract.actorId,
        "escrow_created",
        "Escrow Payment Created",
        `A $${input.amount} escrow payment has been created for "${contract.projectTitle}"`,
        { contractId: input.contractId, escrowId: result[0].insertId },
        `escrow_${input.contractId}`
      );

      return { id: result[0].insertId, success: true };
    }),

  // Fund escrow (simulate Stripe payment)
  fund: protectedProcedure
    .input(z.object({
      escrowId: z.number(),
      stripePaymentIntentId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [escrow] = await db.select().from(escrowPayments).where(eq(escrowPayments.id, input.escrowId)).limit(1);
      if (!escrow) throw new TRPCError({ code: "NOT_FOUND", message: "Escrow not found" });
      if (escrow.payerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the payer can fund escrow" });
      }
      if (!VALID_TRANSITIONS[escrow.status]?.includes("funded")) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Cannot fund escrow in "${escrow.status}" status` });
      }

      await db.update(escrowPayments).set({
        status: "funded",
        stripePaymentIntentId: input.stripePaymentIntentId || `pi_simulated_${Date.now()}`,
        fundedAt: new Date(),
      }).where(eq(escrowPayments.id, input.escrowId));

      // Notify actor
      await createNotification(
        escrow.payeeId,
        "escrow_funded",
        "Escrow Funded",
        `$${escrow.amount} has been deposited into escrow for your project`,
        { escrowId: input.escrowId, contractId: escrow.contractId },
        `escrow_${escrow.contractId}`
      );

      return { success: true };
    }),

  // Release escrow to actor
  release: protectedProcedure
    .input(z.object({ escrowId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [escrow] = await db.select().from(escrowPayments).where(eq(escrowPayments.id, input.escrowId)).limit(1);
      if (!escrow) throw new TRPCError({ code: "NOT_FOUND" });
      if (escrow.payerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the payer can release escrow" });
      }
      if (!VALID_TRANSITIONS[escrow.status]?.includes("released")) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Cannot release escrow in "${escrow.status}" status` });
      }

      await db.update(escrowPayments).set({
        status: "released",
        stripeTransferId: `tr_simulated_${Date.now()}`,
        releasedAt: new Date(),
      }).where(eq(escrowPayments.id, input.escrowId));

      // Update contract payment status
      await db.update(contracts).set({
        paymentStatus: "paid",
        paidAmount: escrow.amount,
      }).where(eq(contracts.id, escrow.contractId));

      // Notify actor
      await createNotification(
        escrow.payeeId,
        "escrow_released",
        "Payment Released!",
        `$${escrow.amount} has been released to your account`,
        { escrowId: input.escrowId, contractId: escrow.contractId, amount: escrow.amount },
        `escrow_${escrow.contractId}`
      );

      return { success: true };
    }),

  // Dispute escrow
  dispute: protectedProcedure
    .input(z.object({
      escrowId: z.number(),
      reason: z.string().min(10),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [escrow] = await db.select().from(escrowPayments).where(eq(escrowPayments.id, input.escrowId)).limit(1);
      if (!escrow) throw new TRPCError({ code: "NOT_FOUND" });
      if (escrow.payerId !== ctx.user.id && escrow.payeeId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only parties to the escrow can dispute" });
      }
      if (!VALID_TRANSITIONS[escrow.status]?.includes("disputed")) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Cannot dispute escrow in "${escrow.status}" status` });
      }

      await db.update(escrowPayments).set({
        status: "disputed",
        disputeReason: input.reason,
        disputedBy: ctx.user.id,
        disputedAt: new Date(),
      }).where(eq(escrowPayments.id, input.escrowId));

      // Notify the other party
      const otherPartyId = ctx.user.id === escrow.payerId ? escrow.payeeId : escrow.payerId;
      await createNotification(
        otherPartyId,
        "escrow_disputed",
        "Escrow Disputed",
        `A dispute has been raised on a $${escrow.amount} escrow payment`,
        { escrowId: input.escrowId, contractId: escrow.contractId },
        `escrow_${escrow.contractId}`
      );

      return { success: true };
    }),

  // Resolve dispute
  resolve: protectedProcedure
    .input(z.object({
      escrowId: z.number(),
      resolution: z.enum(["release_to_payee", "refund_to_payer"]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [escrow] = await db.select().from(escrowPayments).where(eq(escrowPayments.id, input.escrowId)).limit(1);
      if (!escrow) throw new TRPCError({ code: "NOT_FOUND" });

      const newStatus = input.resolution === "release_to_payee" ? "resolved" : "refunded";

      await db.update(escrowPayments).set({
        status: newStatus,
        resolutionNotes: input.notes || `Resolved: ${input.resolution}`,
        resolvedAt: new Date(),
        ...(input.resolution === "release_to_payee" ? { releasedAt: new Date() } : {}),
      }).where(eq(escrowPayments.id, input.escrowId));

      // Notify both parties
      const notifTitle = input.resolution === "release_to_payee" ? "Dispute Resolved - Funds Released" : "Dispute Resolved - Funds Refunded";
      await createNotification(escrow.payerId, "escrow_resolved", notifTitle, `The dispute on $${escrow.amount} escrow has been resolved`, { escrowId: input.escrowId });
      await createNotification(escrow.payeeId, "escrow_resolved", notifTitle, `The dispute on $${escrow.amount} escrow has been resolved`, { escrowId: input.escrowId });

      return { success: true };
    }),

  // Cancel pending escrow
  cancel: protectedProcedure
    .input(z.object({ escrowId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [escrow] = await db.select().from(escrowPayments).where(eq(escrowPayments.id, input.escrowId)).limit(1);
      if (!escrow) throw new TRPCError({ code: "NOT_FOUND" });
      if (escrow.payerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      if (!VALID_TRANSITIONS[escrow.status]?.includes("cancelled")) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Cannot cancel escrow in "${escrow.status}" status` });
      }

      await db.update(escrowPayments).set({ status: "cancelled" }).where(eq(escrowPayments.id, input.escrowId));
      return { success: true };
    }),

  // Get escrow payments for a contract
  getByContract: protectedProcedure
    .input(z.object({ contractId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      return db.select().from(escrowPayments)
        .where(eq(escrowPayments.contractId, input.contractId))
        .orderBy(desc(escrowPayments.createdAt));
    }),

  // Get escrow status summary
  getStatus: protectedProcedure
    .input(z.object({ escrowId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [escrow] = await db.select().from(escrowPayments).where(eq(escrowPayments.id, input.escrowId)).limit(1);
      if (!escrow) throw new TRPCError({ code: "NOT_FOUND" });

      // Get payer and payee names
      const [payer] = await db.select({ name: users.name }).from(users).where(eq(users.id, escrow.payerId)).limit(1);
      const [payee] = await db.select({ name: users.name }).from(users).where(eq(users.id, escrow.payeeId)).limit(1);

      return {
        ...escrow,
        payerName: payer?.name || "Unknown",
        payeeName: payee?.name || "Unknown",
      };
    }),

  // Get payment history for current user (all escrows as payer or payee)
  getHistory: protectedProcedure
    .input(z.object({
      role: z.enum(["payer", "payee", "all"]).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      const role = input?.role || "all";
      let condition;
      if (role === "payer") {
        condition = eq(escrowPayments.payerId, ctx.user.id);
      } else if (role === "payee") {
        condition = eq(escrowPayments.payeeId, ctx.user.id);
      } else {
        condition = sql`(${escrowPayments.payerId} = ${ctx.user.id} OR ${escrowPayments.payeeId} = ${ctx.user.id})`;
      }

      const escrows = await db.select().from(escrowPayments)
        .where(condition)
        .orderBy(desc(escrowPayments.createdAt));

      // Enrich with contract titles
      const enriched = await Promise.all(escrows.map(async (e) => {
        const [contract] = await db.select({ projectTitle: contracts.projectTitle }).from(contracts).where(eq(contracts.id, e.contractId)).limit(1);
        const [otherParty] = await db.select({ name: users.name }).from(users).where(
          eq(users.id, e.payerId === ctx.user.id ? e.payeeId : e.payerId)
        ).limit(1);
        return {
          ...e,
          projectTitle: contract?.projectTitle || "Unknown Project",
          otherPartyName: otherParty?.name || "Unknown",
          isIncoming: e.payeeId === ctx.user.id,
        };
      }));

      return enriched;
    }),

  // Get earnings summary for actors
  getEarningsSummary: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { pending: "0", available: "0", released: "0", disputed: "0", total: "0" };

      const escrows = await db.select().from(escrowPayments)
        .where(eq(escrowPayments.payeeId, ctx.user.id));

      const summary = { pending: 0, available: 0, released: 0, disputed: 0, total: 0 };
      for (const e of escrows) {
        const amt = parseFloat(e.amount) || 0;
        summary.total += amt;
        if (e.status === "pending") summary.pending += amt;
        else if (e.status === "funded") summary.available += amt;
        else if (e.status === "released" || e.status === "resolved") summary.released += amt;
        else if (e.status === "disputed") summary.disputed += amt;
      }

      return {
        pending: summary.pending.toFixed(2),
        available: summary.available.toFixed(2),
        released: summary.released.toFixed(2),
        disputed: summary.disputed.toFixed(2),
        total: summary.total.toFixed(2),
      };
    }),
});
