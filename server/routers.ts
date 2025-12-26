import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { contractTemplates, contractNotes } from "@/drizzle/schema";
import { getDb } from "./db";
import { eq, or, sql } from "drizzle-orm";

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

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          projectTitle: z.string().min(1).max(255).optional(),
          actorId: z.number().optional(),
          paymentTerms: z.string().min(1).optional(),
          paymentAmount: z.string().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          deliverables: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...updateData } = input;
        
        // Verify the contract exists and user is the producer
        const contract = await db.getContractById(id);
        if (!contract) {
          throw new Error("Contract not found");
        }
        if (contract.producerId !== ctx.user.id) {
          throw new Error("Only the producer can edit this contract");
        }

        // Prepare update data with proper date conversion
        const data: any = {};
        if (updateData.projectTitle !== undefined) data.projectTitle = updateData.projectTitle;
        if (updateData.actorId !== undefined) data.actorId = updateData.actorId;
        if (updateData.paymentTerms !== undefined) data.paymentTerms = updateData.paymentTerms;
        if (updateData.paymentAmount !== undefined) data.paymentAmount = updateData.paymentAmount;
        if (updateData.startDate !== undefined) data.startDate = updateData.startDate ? new Date(updateData.startDate) : null;
        if (updateData.endDate !== undefined) data.endDate = updateData.endDate ? new Date(updateData.endDate) : null;
        if (updateData.deliverables !== undefined) data.deliverables = updateData.deliverables;

        await db.updateContract(id, data, ctx.user.id);
        return { success: true };
      }),

    getVersions: protectedProcedure
      .input(z.object({ contractId: z.number() }))
      .query(async ({ input }) => {
        const versions = await db.getContractVersions(input.contractId);
        // Fetch editor names for each version
        const versionsWithNames = await Promise.all(
          versions.map(async (version) => {
            const editor = await db.getUserById(version.editedBy);
            const actor = await db.getUserById(version.actorId);
            return {
              ...version,
              editorName: editor?.name || "Unknown",
              actorName: actor?.name || "Unknown",
            };
          })
        );
        return versionsWithNames;
      }),

    getNotes: protectedProcedure
      .input(z.object({ contractId: z.number() }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) return [];
        const notes = await database
          .select()
          .from(contractNotes)
          .where(eq(contractNotes.contractId, input.contractId));
        return notes;
      }),

    addNote: protectedProcedure
      .input(
        z.object({
          contractId: z.number(),
          message: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const database = await getDb();
        if (!database) throw new Error("Database not available");
        const user = ctx.user;
        await database.insert(contractNotes).values({
          contractId: input.contractId,
          userId: user.id,
          userName: user.name || "Unknown",
          userRole: user.userRole || "actor",
          message: input.message,
        });
        return { success: true };
      }),

    getHistory: protectedProcedure
      .input(z.object({ contractId: z.number() }))
      .query(async ({ input }) => {
        const history = await db.getContractHistory(input.contractId);
        // Fetch user names for each event
        const historyWithNames = await Promise.all(
          history.map(async (event) => {
            const user = await db.getUserById(event.userId);
            return {
              ...event,
              userName: user?.name || "Unknown",
            };
          })
        );
        return historyWithNames;
      }),

    signContract: protectedProcedure
      .input(
        z.object({
          contractId: z.number(),
          signature: z.string(),
          role: z.enum(["producer", "actor"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const contract = await db.getContractById(input.contractId);
        if (!contract) {
          throw new Error("Contract not found");
        }

        // Verify user is authorized to sign
        if (input.role === "producer" && contract.producerId !== ctx.user.id) {
          throw new Error("Only the producer can sign as producer");
        }
        if (input.role === "actor" && contract.actorId !== ctx.user.id) {
          throw new Error("Only the actor can sign as actor");
        }

        // Update signature
        const updateData: any = {};
        if (input.role === "producer") {
          updateData.producerSignature = input.signature;
          updateData.producerSignedAt = new Date();
        } else {
          updateData.actorSignature = input.signature;
          updateData.actorSignedAt = new Date();
        }

        await db.updateContract(input.contractId, updateData, ctx.user.id);

        // Add history event
        await db.addContractHistory(
          input.contractId,
          ctx.user.id,
          "status_changed",
          `${input.role === "producer" ? "Producer" : "Actor"} signed the contract`
        );

        return { success: true };
      }),
  }),

  templates: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const database = await getDb();
      if (!database) return [];
      
      // Get all system templates and user's custom templates
      const templates = await database
        .select()
        .from(contractTemplates)
        .where(
          or(
            eq(contractTemplates.isSystemTemplate, true),
            eq(contractTemplates.userId, ctx.user.id)
          )
        );
      return templates;
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) return null;
        
        const result = await database
          .select()
          .from(contractTemplates)
          .where(eq(contractTemplates.id, input.id))
          .limit(1);
        return result[0] || null;
      }),
  }),
});

export type AppRouter = typeof appRouter;
