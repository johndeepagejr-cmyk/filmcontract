import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { contractTemplates, contractNotes, contractAttachments } from "@/drizzle/schema";
import { getDb } from "./db";
import { eq, or, sql } from "drizzle-orm";
import { notifyContractCreated, notifyContractSigned, notifyPaymentReceived, notifyStatusChanged } from "./email-service";
import { getProducerReputation, getProducerReviews, createProducerReview, getAllProducersWithReputation } from "./reputation-service";
import { getActorReputation, getActorReviews, createActorReview, getAllActorsWithReputation } from "./actor-reputation-service";
import { createContractPaymentIntent, createDonationPaymentIntent, verifyPaymentIntent } from "./stripe-service";
import { sendPaymentReceiptEmail } from "./receipt-generator";

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
        
        // Send email notification to actor
        try {
          await notifyContractCreated(input.actorId, {
            projectTitle: input.projectTitle,
            producerName: ctx.user.name || "Unknown Producer",
            startDate: input.startDate ? new Date(input.startDate) : null,
            endDate: input.endDate ? new Date(input.endDate) : null,
            paymentAmount: input.paymentAmount,
          });
        } catch (error) {
          console.error("Failed to send email notification:", error);
        }
        
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

    getAttachments: protectedProcedure
      .input(z.object({ contractId: z.number() }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) throw new Error("Database not available");
        return database.select().from(contractAttachments).where(eq(contractAttachments.contractId, input.contractId));
      }),
    uploadAttachment: protectedProcedure
      .input(
        z.object({
          contractId: z.number(),
          fileName: z.string(),
          fileType: z.string(),
          fileSize: z.number(),
          fileData: z.string(), // base64
        })
      )
      .mutation(async ({ ctx, input }) => {
        // In a real app, upload to S3 here
        // For now, we'll store the base64 data directly (not recommended for production)
        const fileUrl = `data:${input.fileType};base64,${input.fileData}`;
        
        const database = await getDb();
        if (!database) throw new Error("Database not available");
        
        await database.insert(contractAttachments).values({
          contractId: input.contractId,
          fileName: input.fileName,
          fileType: input.fileType,
          fileSize: input.fileSize,
          fileUrl,
          uploadedBy: ctx.user.id,
        });
        
        return { success: true };
      }),
    deleteAttachment: protectedProcedure
      .input(z.object({ attachmentId: z.number() }))
      .mutation(async ({ input }) => {
        const database = await getDb();
        if (!database) throw new Error("Database not available");
        await database.delete(contractAttachments).where(eq(contractAttachments.id, input.attachmentId));
        return { success: true };
      }),
    updatePaymentStatus: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          paymentStatus: z.enum(["unpaid", "partial", "paid"]),
          paymentAmount: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await db.updateContract(input.id, { paymentStatus: input.paymentStatus }, ctx.user.id);
        
        // Send receipt email when payment is completed
        if (input.paymentStatus === "paid" && input.paymentAmount) {
          await sendPaymentReceiptEmail(input.id, input.paymentAmount, "Credit Card");
        }
        
        return { success: true };
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

  reputation: router({
    // Get reputation stats for a specific producer (public)
    getProducerReputation: publicProcedure
      .input(z.object({ producerId: z.number() }))
      .query(async ({ input }) => {
        return getProducerReputation(input.producerId);
      }),

    // Get all reviews for a producer (public)
    getProducerReviews: publicProcedure
      .input(z.object({ producerId: z.number() }))
      .query(async ({ input }) => {
        return getProducerReviews(input.producerId);
      }),

    // Get list of all producers with reputation (public directory)
    getAllProducers: publicProcedure.query(async () => {
      return getAllProducersWithReputation();
    }),

    // Submit a review for a producer (actors only)
    submitReview: protectedProcedure
      .input(
        z.object({
          producerId: z.number(),
          contractId: z.number(),
          rating: z.number().min(1).max(5),
          review: z.string().optional(),
          paymentOnTime: z.boolean(),
          wouldWorkAgain: z.boolean(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return createProducerReview({
          producerId: input.producerId,
          actorId: ctx.user.id,
          contractId: input.contractId,
          rating: input.rating,
          review: input.review,
          paymentOnTime: input.paymentOnTime,
          wouldWorkAgain: input.wouldWorkAgain,
        });
      }),
  }),

  actorReputation: router({
    // Get reputation stats for a specific actor (public)
    getActorReputation: publicProcedure
      .input(z.object({ actorId: z.number() }))
      .query(async ({ input }) => {
        return getActorReputation(input.actorId);
      }),

    // Get all reviews for an actor (public)
    getActorReviews: publicProcedure
      .input(z.object({ actorId: z.number() }))
      .query(async ({ input }) => {
        return getActorReviews(input.actorId);
      }),

    // Get list of all actors with reputation (public directory)
    getAllActors: publicProcedure.query(async () => {
      return getAllActorsWithReputation();
    }),

    // Submit a review for an actor (producers only)
    submitReview: protectedProcedure
      .input(
        z.object({
          actorId: z.number(),
          contractId: z.number(),
          rating: z.number().min(1).max(5),
          review: z.string().optional(),
          professionalismRating: z.number().min(1).max(5),
          reliabilityRating: z.number().min(1).max(5),
          wouldHireAgain: z.boolean(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return createActorReview({
          actorId: input.actorId,
          producerId: ctx.user.id,
          contractId: input.contractId,
          rating: input.rating,
          review: input.review,
          professionalismRating: input.professionalismRating,
          reliabilityRating: input.reliabilityRating,
          wouldHireAgain: input.wouldHireAgain,
        });
      }),
  }),

  // Stripe payment integration
  payments: router({
    // Create payment intent for contract payment
    createContractPayment: protectedProcedure
      .input(
        z.object({
          contractId: z.number(),
          amount: z.number(),
          actorEmail: z.string(),
          projectTitle: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const { clientSecret, paymentIntentId } = await createContractPaymentIntent(
          input.amount,
          input.contractId,
          input.actorEmail,
          input.projectTitle
        );
        return { clientSecret, paymentIntentId };
      }),

    // Create payment intent for donation
    createDonation: publicProcedure
      .input(
        z.object({
          amount: z.number(),
          donorEmail: z.string().optional(),
          donorName: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { clientSecret, paymentIntentId } = await createDonationPaymentIntent(
          input.amount,
          input.donorEmail,
          input.donorName
        );
        return { clientSecret, paymentIntentId };
      }),

    // Verify payment was successful
    verifyPayment: protectedProcedure
      .input(z.object({ paymentIntentId: z.string() }))
      .mutation(async ({ input }) => {
        const isSuccessful = await verifyPaymentIntent(input.paymentIntentId);
        return { success: isSuccessful };
      }),
  }),
});

export type AppRouter = typeof appRouter;
