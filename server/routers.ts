import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { contractTemplates, contractNotes, contractAttachments, portfolioViews, contracts, favorites, paymentHistory, savedFilterPresets, users } from "@/drizzle/schema";
import { getDb } from "./db";
import { eq, or, sql } from "drizzle-orm";
import { notifyContractCreated, notifyContractSigned, notifyPaymentReceived, notifyStatusChanged } from "./email-service";
import { getProducerReputation, getProducerReviews, createProducerReview, getAllProducersWithReputation } from "./reputation-service";
import { getActorReputation, getActorReviews, createActorReview, getAllActorsWithReputation } from "./actor-reputation-service";
// Stripe removed for lightweight build
import { sendPaymentReceiptEmail } from "./receipt-generator";
import { storagePut } from "./storage";
import { savePushToken, notifyContractCreated as pushNotifyContractCreated, notifyContractSigned as pushNotifyContractSigned } from "./notification-service";
import { socialRouter } from "./social-router";
import { messagingRouter } from "./messaging-router";
import { getHelloSignService } from "./hellosign-service";
import { subscriptionRouter } from "./subscription-router";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  social: socialRouter,
  messaging: messagingRouter,
  subscription: subscriptionRouter,
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

  // Actor profile management
  profilesDetail: router({    // Get actor profile by user ID
    get: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return db.getActorProfile(input.userId);
      }),

    // Get current user's actor profile
    getMy: protectedProcedure.query(async ({ ctx }) => {
      return db.getActorProfile(ctx.user.id);
    }),

    // Create or update actor profile
    upsert: protectedProcedure
      .input(
        z.object({
          bio: z.string().optional(),
          location: z.string().optional(),
          yearsExperience: z.number().optional(),
          specialties: z.array(z.string()).optional(),
          profilePhotoUrl: z.string().optional(),
          coverPhotoUrl: z.string().optional(),
          height: z.string().optional(),
          weight: z.string().optional(),
          eyeColor: z.string().optional(),
          hairColor: z.string().optional(),
          website: z.string().optional(),
          imdbUrl: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.upsertActorProfile(ctx.user.id, input);
      }),

    // Get actor's photos
    getPhotos: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return db.getActorPhotos(input.userId);
      }),

    // Add photo to portfolio
    addPhoto: protectedProcedure
      .input(
        z.object({
          photoUrl: z.string(),
          caption: z.string().optional(),
          photoType: z.enum(["headshot", "portfolio", "behind_scenes"]).default("portfolio"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.addActorPhoto(ctx.user.id, input);
      }),

    // Upload photo to S3 and return URL
    uploadPhoto: protectedProcedure
      .input(
        z.object({
          base64Data: z.string(),
          fileName: z.string(),
          mimeType: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Convert base64 to buffer
        const base64WithoutPrefix = input.base64Data.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64WithoutPrefix, "base64");
        
        // Generate unique filename
        const timestamp = Date.now();
        const extension = input.fileName.split(".").pop() || "jpg";
        const uniqueFileName = `actor-photos/${ctx.user.id}/${timestamp}-${input.fileName}`;
        
        // Upload to S3
        const { url } = await storagePut(uniqueFileName, buffer, input.mimeType);
        
        return { photoUrl: url };
      }),

    // Delete photo
    deletePhoto: protectedProcedure
      .input(z.object({ photoId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.deleteActorPhoto(input.photoId, ctx.user.id);
      }),

    // Get actor's filmography
    getFilms: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return db.getActorFilms(input.userId);
      }),

    // Add film to filmography
    addFilm: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1),
          role: z.string().min(1),
          year: z.number(),
          description: z.string().optional(),
          posterUrl: z.string().optional(),
          projectType: z.enum(["feature_film", "short_film", "tv_series", "commercial", "theater", "voice_over", "other"]).default("feature_film"),
          director: z.string().optional(),
          productionCompany: z.string().optional(),
          imdbUrl: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.addActorFilm(ctx.user.id, input);
      }),

    // Update film
    updateFilm: protectedProcedure
      .input(
        z.object({
          filmId: z.number(),
          title: z.string().min(1).optional(),
          role: z.string().min(1).optional(),
          year: z.number().optional(),
          description: z.string().optional(),
          posterUrl: z.string().optional(),
          projectType: z.enum(["feature_film", "short_film", "tv_series", "commercial", "theater", "voice_over", "other"]).optional(),
          director: z.string().optional(),
          productionCompany: z.string().optional(),
          imdbUrl: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.updateActorFilm(input.filmId, ctx.user.id, input);
      }),

    // Delete film
    deleteFilm: protectedProcedure
      .input(z.object({ filmId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.deleteActorFilm(input.filmId, ctx.user.id);
      }),
  }),

  // Producers Directory
  producers: router({    // Get all producers with profiles
    getAllProducers: publicProcedure.query(async () => {
      const database = await getDb();
      if (!database) return [];

      const { producerProfiles, users } = await import("../drizzle/schema.js");
      
      return database
        .select({
          userId: producerProfiles.userId,
          companyName: producerProfiles.companyName,
          bio: producerProfiles.bio,
          location: producerProfiles.location,
          yearsInBusiness: producerProfiles.yearsInBusiness,
          website: producerProfiles.website,
          profilePhotoUrl: producerProfiles.profilePhotoUrl,
          companyLogoUrl: producerProfiles.companyLogoUrl,
          specialties: producerProfiles.specialties,
          notableProjects: producerProfiles.notableProjects,
          awards: producerProfiles.awards,
          userName: users.name,
        })
        .from(producerProfiles)
        .leftJoin(users, eq(producerProfiles.userId, users.id));
    }),
  }),

  // Producer Profile Management
  producerProfile: router({
    // Get current user's producer profile
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getProducerProfile(ctx.user.id);
    }),

    // Create or update producer profile
    upsert: protectedProcedure
      .input(
        z.object({
          companyName: z.string().optional(),
          bio: z.string().optional(),
          location: z.string().optional(),
          yearsInBusiness: z.number().optional(),
          website: z.string().optional(),
          profilePhotoUrl: z.string().optional(),
          companyLogoUrl: z.string().optional(),
          specialties: z.array(z.string()).optional(),
          notableProjects: z.array(z.string()).optional(),
          awards: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.upsertProducerProfile(ctx.user.id, input);
      }),

    // Upload profile photo
    uploadPhoto: protectedProcedure
      .input(
        z.object({
          base64: z.string(),
          filename: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const url = await storagePut(`producer-photos/${ctx.user.id}/${input.filename}`, buffer);
        return { url };
      }),
  }),

  // Portfolio Photos Management
  portfolioPhotos: router({
    // Get user's portfolio photos
    getPhotos: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return db.getPortfolioPhotos(input.userId);
      }),

    // Get current user's portfolio photos
    getMy: protectedProcedure.query(async ({ ctx }) => {
      return db.getPortfolioPhotos(ctx.user.id);
    }),

    // Add portfolio photo
    addPhoto: protectedProcedure
      .input(
        z.object({
          photoUrl: z.string(),
          caption: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.addPortfolioPhoto(ctx.user.id, input);
      }),

    // Upload photo to S3 and return URL
    uploadPhoto: protectedProcedure
      .input(
        z.object({
          base64Data: z.string(),
          fileName: z.string(),
          mimeType: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Convert base64 to buffer
        const base64WithoutPrefix = input.base64Data.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64WithoutPrefix, "base64");
        
        // Generate unique filename
        const timestamp = Date.now();
        const extension = input.fileName.split(".").pop() || "jpg";
        const uniqueFileName = `portfolio-photos/${ctx.user.id}/${timestamp}-${input.fileName}`;
        
        // Upload to S3
        const { url } = await storagePut(uniqueFileName, buffer, input.mimeType);
        
        return { photoUrl: url };
      }),

    // Update photo caption or order
    updatePhoto: protectedProcedure
      .input(
        z.object({
          photoId: z.number(),
          caption: z.string().optional(),
          displayOrder: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { photoId, ...data } = input;
        return db.updatePortfolioPhoto(photoId, ctx.user.id, data);
      }),

    // Delete photo
    deletePhoto: protectedProcedure
      .input(z.object({ photoId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.deletePortfolioPhoto(input.photoId, ctx.user.id);
      }),

    // Reorder photos
    reorderPhotos: protectedProcedure
      .input(
        z.object({
          photoOrders: z.array(
            z.object({
              id: z.number(),
              displayOrder: z.number(),
            })
          ),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return db.reorderPortfolioPhotos(ctx.user.id, input.photoOrders);
      }),
  }),

  // Push notifications
  notifications: router({
    // Register push token
    registerToken: protectedProcedure
      .input(z.object({ pushToken: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const success = await savePushToken(ctx.user.id, input.pushToken);
        return { success };
      }),
  }),

  // Payments (Stripe removed for lightweight build)
  payments: router({
    createContractPayment: protectedProcedure
      .input(z.object({ contractId: z.number(), amount: z.number(), actorEmail: z.string(), projectTitle: z.string() }))
      .mutation(async () => {
        throw new Error("Payment processing not configured. Please set up Stripe.");
      }),
    createDonation: publicProcedure
      .input(z.object({ amount: z.number(), donorEmail: z.string().optional(), donorName: z.string().optional() }))
      .mutation(async () => {
        throw new Error("Payment processing not configured. Please set up Stripe.");
      }),
    verifyPayment: protectedProcedure
      .input(z.object({ paymentIntentId: z.string() }))
      .mutation(async () => {
        throw new Error("Payment processing not configured. Please set up Stripe.");
      }),
  }),

  // Analytics
  analytics: router({
    // Get portfolio view statistics
    getPortfolioStats: protectedProcedure
      .input(
        z.object({
          days: z.number().optional().default(30), // Last N days
        })
      )
      .query(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) return { totalViews: 0, recentViews: 0, uniqueVisitors: 0, viewsByDay: [] };
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - input.days);

        const totalViewsResult = await database
          .select({ count: sql<number>`count(*)` })
          .from(portfolioViews)
          .where(sql`${portfolioViews.portfolioUserId} = ${ctx.user.id}`);
        const totalViews = Number(totalViewsResult[0]?.count || 0);

        const recentViewsResult = await database
          .select({ count: sql<number>`count(*)` })
          .from(portfolioViews)
          .where(sql`${portfolioViews.portfolioUserId} = ${ctx.user.id} AND ${portfolioViews.createdAt} >= ${cutoffDate}`);
        const recentViews = Number(recentViewsResult[0]?.count || 0);

        const uniqueVisitorsResult = await database
          .select({ count: sql<number>`count(DISTINCT ${portfolioViews.viewerIp})` })
          .from(portfolioViews)
          .where(sql`${portfolioViews.portfolioUserId} = ${ctx.user.id} AND ${portfolioViews.createdAt} >= ${cutoffDate}`);
        const uniqueVisitors = Number(uniqueVisitorsResult[0]?.count || 0);

        const viewsByDay = await database
          .select({ date: sql<string>`DATE(${portfolioViews.createdAt})`, count: sql<number>`count(*)` })
          .from(portfolioViews)
          .where(sql`${portfolioViews.portfolioUserId} = ${ctx.user.id} AND ${portfolioViews.createdAt} >= ${cutoffDate}`)
          .groupBy(sql`DATE(${portfolioViews.createdAt})`);

        return {
          totalViews,
          recentViews,
          uniqueVisitors,
          viewsByDay: viewsByDay.map((row: any) => ({ date: row.date, views: Number(row.count) })),
        };
      }),

    // Get contract trends over time
    getContractTrends: protectedProcedure
      .input(
        z.object({
          days: z.number().optional().default(30),
        })
      )
      .query(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) return { contractsByDay: [] };
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - input.days);

        const contractsByDay = await database
          .select({ date: sql<string>`DATE(${contracts.createdAt})`, count: sql<number>`count(*)` })
          .from(contracts)
          .where(sql`(${contracts.producerId} = ${ctx.user.id} OR ${contracts.actorId} = ${ctx.user.id}) AND ${contracts.createdAt} >= ${cutoffDate}`)
          .groupBy(sql`DATE(${contracts.createdAt})`);

        return {
          contractsByDay: contractsByDay.map((row: any) => ({ date: row.date, count: Number(row.count) })),
        };
      }),

    // Get payment trends over time
    getPaymentTrends: protectedProcedure
      .input(
        z.object({
          days: z.number().optional().default(30),
        })
      )
      .query(async ({ ctx, input }) => {
        const contracts = await db.getUserContracts(ctx.user.id);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - input.days);

        // Group payments by month
        const paymentsByMonth: Record<string, number> = {};
        
        contracts.forEach((contract) => {
          if (contract.paymentStatus === "paid" && contract.updatedAt) {
            const contractDate = new Date(contract.updatedAt);
            if (contractDate >= cutoffDate) {
              const monthKey = `${contractDate.getFullYear()}-${String(contractDate.getMonth() + 1).padStart(2, "0")}`;
              const amount = parseFloat(contract.paidAmount?.toString() || "0") || 0;
              paymentsByMonth[monthKey] = (paymentsByMonth[monthKey] || 0) + amount;
            }
          }
        });

        return {
          paymentsByMonth: Object.entries(paymentsByMonth)
            .map(([month, amount]) => ({ month, amount }))
            .sort((a, b) => a.month.localeCompare(b.month)),
        };
      }),
  }),

  // Favorites
  favorites: router({
    // Add a favorite
    add: protectedProcedure
      .input(
        z.object({
          favoritedUserId: z.number(),
          type: z.enum(["actor", "producer"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new Error("Database not available");
        
        const existing = await database
          .select()
          .from(favorites)
          .where(sql`${favorites.userId} = ${ctx.user.id} AND ${favorites.favoritedUserId} = ${input.favoritedUserId}`);
        
        if (existing.length > 0) {
          return { success: true, message: "Already favorited" };
        }
        
        await database.insert(favorites).values({
          userId: ctx.user.id,
          favoritedUserId: input.favoritedUserId,
          type: input.type,
        });
        
        return { success: true };
      }),

    // Remove a favorite
    remove: protectedProcedure
      .input(
        z.object({
          favoritedUserId: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new Error("Database not available");
        
        await database
          .delete(favorites)
          .where(sql`${favorites.userId} = ${ctx.user.id} AND ${favorites.favoritedUserId} = ${input.favoritedUserId}`);
        
        return { success: true };
      }),

    // Get user's favorites
    list: protectedProcedure.query(async ({ ctx }) => {
      const database = await getDb();
      if (!database) return [];
      
      const userFavorites = await database
        .select()
        .from(favorites)
        .where(sql`${favorites.userId} = ${ctx.user.id}`);
      
      return userFavorites;
    }),

    // Check if a user is favorited
    isFavorited: protectedProcedure
      .input(
        z.object({
          favoritedUserId: z.number(),
        })
      )
      .query(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) return false;
        
        const existing = await database
          .select()
          .from(favorites)
          .where(sql`${favorites.userId} = ${ctx.user.id} AND ${favorites.favoritedUserId} = ${input.favoritedUserId}`);
        
        return existing.length > 0;
      }),
  }),

  // Payment tracking endpoints (moved to separate router)
  paymentTracking: router({
    // Record a payment for a contract
    recordPayment: protectedProcedure
      .input(
        z.object({
          contractId: z.number(),
          amount: z.number(),
          paymentDate: z.string(),
          receiptUrl: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new Error("Database not available");
        
        await database.insert(paymentHistory).values({
          contractId: input.contractId,
          amount: input.amount.toString(),
          paymentDate: new Date(input.paymentDate),
          receiptUrl: input.receiptUrl,
          notes: input.notes,
          recordedBy: ctx.user.id,
        });

        const payments = await database
          .select()
          .from(paymentHistory)
          .where(eq(paymentHistory.contractId, input.contractId));
        
        const totalPaid = payments.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);
        
        await database
          .update(contracts)
          .set({ paidAmount: totalPaid.toString() })
          .where(eq(contracts.id, input.contractId));

        return { success: true };
      }),

    // Get payment history for a contract
    getHistory: protectedProcedure
      .input(z.object({ contractId: z.number() }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) return [];
        
        return database
          .select()
          .from(paymentHistory)
          .where(eq(paymentHistory.contractId, input.contractId));
      }),
  }),

  // Saved filter presets endpoints
  filterPresets: router({
    // Save a filter preset
    save: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          filterType: z.enum(["actor", "producer"]),
          filters: z.string(), // JSON string
        })
      )
      .mutation(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new Error("Database not available");
        
        await database.insert(savedFilterPresets).values({
          userId: ctx.user.id,
          name: input.name,
          filterType: input.filterType,
          filters: input.filters,
        });

        return { success: true };
      }),

    // Get user's saved presets
    list: protectedProcedure
      .input(z.object({ filterType: z.enum(["actor", "producer"]) }))
      .query(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) return [];
        
        return database
          .select()
          .from(savedFilterPresets)
          .where(sql`${savedFilterPresets.userId} = ${ctx.user.id} AND ${savedFilterPresets.filterType} = ${input.filterType}`);
      }),

    // Delete a preset
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new Error("Database not available");
        
        await database
          .delete(savedFilterPresets)
          .where(sql`${savedFilterPresets.id} = ${input.id} AND ${savedFilterPresets.userId} = ${ctx.user.id}`);

        return { success: true };
      }),
  }),

  // Verification and trust score endpoints
  verification: router({
    // Calculate and update user's trust score
    calculateTrustScore: protectedProcedure
      .mutation(async ({ ctx }) => {
        const database = await getDb();
        if (!database) throw new Error("Database not available");
        const userId = ctx.user.id;
        
        const userContracts = await database
          .select()
          .from(contracts)
          .where(sql`${contracts.producerId} = ${userId} OR ${contracts.actorId} = ${userId}`);
        
        const completedContracts = userContracts.filter((c: any) => c.status === 'completed').length;
        const totalContracts = userContracts.length;
        
        // Calculate trust score (0-100)
        let score = 0;
        
        // Base score from completed contracts (up to 40 points)
        if (totalContracts > 0) {
          const completionRate = completedContracts / totalContracts;
          score += completionRate * 40;
        }
        
        // Bonus points for volume (up to 30 points)
        score += Math.min(completedContracts * 3, 30);
        
        // Verification bonus (30 points)
        if (ctx.user.isVerified) {
          score += 30;
        }
        
        const finalScore = Math.min(Math.round(score), 100);
        
        // Update user's trust score
        await database
          .update(users)
          .set({ trustScore: finalScore })
          .where(eq(users.id, userId));
        
        return { trustScore: finalScore };
      }),
    
    // Get user's trust score
    getTrustScore: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) return { trustScore: 0, isVerified: false };
        
        const user = await database
          .select()
          .from(users)
          .where(eq(users.id, input.userId))
          .limit(1);
        
        return {
          trustScore: user[0]?.trustScore || 0,
          isVerified: user[0]?.isVerified || false,
        };
      }),
  }),

  // Casting Calls
  casting: router({
    // List all open casting calls (for actors)
    listOpen: protectedProcedure.query(async () => {
      const database = await getDb();
      if (!database) return [];
      const { castingCalls, users: usersTable } = await import("../drizzle/schema.js");
      return database
        .select({
          id: castingCalls.id,
          producerId: castingCalls.producerId,
          title: castingCalls.title,
          description: castingCalls.description,
          roles: castingCalls.roles,
          budget: castingCalls.budget,
          deadline: castingCalls.deadline,
          status: castingCalls.status,
          createdAt: castingCalls.createdAt,
          producerName: usersTable.name,
        })
        .from(castingCalls)
        .leftJoin(usersTable, eq(castingCalls.producerId, usersTable.id))
        .where(eq(castingCalls.status, "open"))
        .orderBy(castingCalls.createdAt);
    }),

    // List producer's own casting calls
    listMine: protectedProcedure.query(async ({ ctx }) => {
      const database = await getDb();
      if (!database) return [];
      const { castingCalls } = await import("../drizzle/schema.js");
      return database
        .select()
        .from(castingCalls)
        .where(eq(castingCalls.producerId, ctx.user.id))
        .orderBy(castingCalls.createdAt);
    }),

    // Get a single casting call by ID
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) return null;
        const { castingCalls, users: usersTable, castingSubmissions } = await import("../drizzle/schema.js");
        const result = await database
          .select({
            id: castingCalls.id,
            producerId: castingCalls.producerId,
            title: castingCalls.title,
            description: castingCalls.description,
            roles: castingCalls.roles,
            budget: castingCalls.budget,
            deadline: castingCalls.deadline,
            status: castingCalls.status,
            createdAt: castingCalls.createdAt,
            updatedAt: castingCalls.updatedAt,
            producerName: usersTable.name,
          })
          .from(castingCalls)
          .leftJoin(usersTable, eq(castingCalls.producerId, usersTable.id))
          .where(eq(castingCalls.id, input.id))
          .limit(1);
        if (!result[0]) return null;
        // Get submission count
        const subs = await database
          .select()
          .from(castingSubmissions)
          .where(eq(castingSubmissions.castingCallId, input.id));
        return { ...result[0], submissionCount: subs.length };
      }),

    // Create a new casting call (producers only)
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        roles: z.string().optional(),
        budget: z.string().optional(),
        deadline: z.string().optional(),
        status: z.enum(["open", "closed", "filled"]).default("open"),
      }))
      .mutation(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new Error("Database unavailable");
        const { castingCalls } = await import("../drizzle/schema.js");
        const result = await database.insert(castingCalls).values({
          producerId: ctx.user.id,
          title: input.title,
          description: input.description,
          roles: input.roles || null,
          budget: input.budget || null,
          deadline: input.deadline ? new Date(input.deadline) : null,
          status: input.status,
        });
        return { id: result[0].insertId, success: true };
      }),

    // Update a casting call
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        roles: z.string().optional(),
        budget: z.string().optional(),
        deadline: z.string().optional(),
        status: z.enum(["open", "closed", "filled"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new Error("Database unavailable");
        const { castingCalls } = await import("../drizzle/schema.js");
        const { id, ...data } = input;
        const updateData: any = {};
        if (data.title) updateData.title = data.title;
        if (data.description) updateData.description = data.description;
        if (data.roles !== undefined) updateData.roles = data.roles;
        if (data.budget !== undefined) updateData.budget = data.budget;
        if (data.deadline) updateData.deadline = new Date(data.deadline);
        if (data.status) updateData.status = data.status;
        await database.update(castingCalls).set(updateData).where(eq(castingCalls.id, id));
        return { success: true };
      }),

    // Submit for a casting call (actors only)
    submit: protectedProcedure
      .input(z.object({
        castingCallId: z.number(),
        videoUrl: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new Error("Database unavailable");
        const { castingSubmissions } = await import("../drizzle/schema.js");
        const result = await database.insert(castingSubmissions).values({
          castingCallId: input.castingCallId,
          actorId: ctx.user.id,
          videoUrl: input.videoUrl || null,
          notes: input.notes || null,
          status: "submitted",
        });
        return { id: result[0].insertId, success: true };
      }),

    // Get submissions for a casting call (producer view)
    getSubmissions: protectedProcedure
      .input(z.object({ castingCallId: z.number() }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) return [];
        const { castingSubmissions, users: usersTable } = await import("../drizzle/schema.js");
        return database
          .select({
            id: castingSubmissions.id,
            actorId: castingSubmissions.actorId,
            videoUrl: castingSubmissions.videoUrl,
            notes: castingSubmissions.notes,
            status: castingSubmissions.status,
            createdAt: castingSubmissions.createdAt,
            actorName: usersTable.name,
          })
          .from(castingSubmissions)
          .leftJoin(usersTable, eq(castingSubmissions.actorId, usersTable.id))
          .where(eq(castingSubmissions.castingCallId, input.castingCallId));
      }),

    // Get actor's own submissions
    mySubmissions: protectedProcedure.query(async ({ ctx }) => {
      const database = await getDb();
      if (!database) return [];
      const { castingSubmissions, castingCalls } = await import("../drizzle/schema.js");
      return database
        .select({
          id: castingSubmissions.id,
          castingCallId: castingSubmissions.castingCallId,
          videoUrl: castingSubmissions.videoUrl,
          notes: castingSubmissions.notes,
          status: castingSubmissions.status,
          createdAt: castingSubmissions.createdAt,
          castingTitle: castingCalls.title,
          castingDeadline: castingCalls.deadline,
        })
        .from(castingSubmissions)
        .leftJoin(castingCalls, eq(castingSubmissions.castingCallId, castingCalls.id))
        .where(eq(castingSubmissions.actorId, ctx.user.id));
    }),

    // Update submission status (producer)
    updateSubmissionStatus: protectedProcedure
      .input(z.object({
        submissionId: z.number(),
        status: z.enum(["submitted", "reviewing", "shortlisted", "rejected", "hired"]),
      }))
      .mutation(async ({ input }) => {
        const database = await getDb();
        if (!database) throw new Error("Database unavailable");
        const { castingSubmissions } = await import("../drizzle/schema.js");
        await database.update(castingSubmissions)
          .set({ status: input.status })
          .where(eq(castingSubmissions.id, input.submissionId));
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
