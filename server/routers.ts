import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  user: router({
    updateRole: protectedProcedure
      .input(z.object({ userRole: z.enum(["producer", "actor"]) }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserRole(ctx.user.id, input.userRole);
        return { success: true };
      }),
    getActors: protectedProcedure.query(async () => {
      return db.getUsersByRole("actor");
    }),
  }),

  contracts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const contracts = await db.getUserContracts(ctx.user.id);
      // Fetch producer and actor details for each contract
      const contractsWithDetails = await Promise.all(
        contracts.map(async (contract) => {
          const producer = await db.getUserById(contract.producerId);
          const actor = await db.getUserById(contract.actorId);
          return {
            ...contract,
            producerName: producer?.name || "Unknown",
            actorName: actor?.name || "Unknown",
          };
        })
      );
      return contractsWithDetails;
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getContractWithDetails(input.id);
      }),

    create: protectedProcedure
      .input(
        z.object({
          projectTitle: z.string().min(1).max(255),
          actorId: z.number(),
          paymentTerms: z.string().min(1),
          paymentAmount: z.string().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          deliverables: z.string().optional(),
          status: z.enum(["draft", "active", "pending", "completed", "cancelled"]).default("draft"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const contractId = await db.createContract({
          producerId: ctx.user.id,
          actorId: input.actorId,
          projectTitle: input.projectTitle,
          paymentTerms: input.paymentTerms,
          paymentAmount: input.paymentAmount,
          startDate: input.startDate ? new Date(input.startDate) : null,
          endDate: input.endDate ? new Date(input.endDate) : null,
          deliverables: input.deliverables,
          status: input.status,
        });
        return { id: contractId, success: true };
      }),

    updateStatus: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["draft", "active", "pending", "completed", "cancelled"]),
        })
      )
      .mutation(async ({ input }) => {
        await db.updateContractStatus(input.id, input.status);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
