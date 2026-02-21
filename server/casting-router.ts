/**
 * Enhanced Casting Router — Full casting platform backend
 * Supports: listing with pagination/filters, pipeline management,
 * self-tape submissions, producer review tools, analytics
 */
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { eq, sql, and, desc, asc, like, or, gte, lte } from "drizzle-orm";
import { storagePut } from "./storage";
import {
  castingCalls,
  castingSubmissions,
  selfTapes,
  selfTapeFeedback,
  selfTapeRatings,
  users,
} from "../drizzle/schema";

// ─── Submission pipeline statuses ──────────────────────────────
const PIPELINE_STATUSES = ["submitted", "reviewing", "shortlisted", "rejected", "hired"] as const;

export const castingRouter = router({
  // ─── List open casting calls with filters + pagination ──────
  listOpen: protectedProcedure
    .input(
      z.object({
        cursor: z.number().optional(),
        limit: z.number().min(1).max(50).optional().default(20),
        search: z.string().optional(),
        sortBy: z.enum(["newest", "deadline", "budget_high", "budget_low"]).optional().default("newest"),
      }).optional()
    )
    .query(async ({ input }) => {
      const database = await getDb();
      if (!database) return { items: [], nextCursor: null };

      const opts = input ?? { limit: 20, sortBy: "newest" };
      const limit = opts.limit ?? 20;

      let query = database
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
          producerName: users.name,
        })
        .from(castingCalls)
        .leftJoin(users, eq(castingCalls.producerId, users.id))
        .where(eq(castingCalls.status, "open"))
        .limit(limit + 1)
        .$dynamic();

      if (opts.cursor) {
        query = query.where(and(eq(castingCalls.status, "open"), lte(castingCalls.id, opts.cursor)));
      }

      if (opts.search) {
        query = query.where(
          and(
            eq(castingCalls.status, "open"),
            or(
              like(castingCalls.title, `%${opts.search}%`),
              like(castingCalls.description, `%${opts.search}%`)
            )
          )
        );
      }

      // Sort
      if (opts.sortBy === "deadline") {
        query = query.orderBy(asc(castingCalls.deadline));
      } else if (opts.sortBy === "budget_high") {
        query = query.orderBy(desc(castingCalls.budget));
      } else if (opts.sortBy === "budget_low") {
        query = query.orderBy(asc(castingCalls.budget));
      } else {
        query = query.orderBy(desc(castingCalls.createdAt));
      }

      const results = await query;

      // Get submission counts for each casting call
      const items = await Promise.all(
        results.slice(0, limit).map(async (c) => {
          const subs = await database
            .select({ count: sql<number>`count(*)` })
            .from(castingSubmissions)
            .where(eq(castingSubmissions.castingCallId, c.id));
          return { ...c, submissionCount: Number(subs[0]?.count ?? 0) };
        })
      );

      return {
        items,
        nextCursor: results.length > limit ? results[limit - 1].id : null,
      };
    }),

  // ─── List producer's own casting calls ──────────────────────
  listMine: protectedProcedure.query(async ({ ctx }) => {
    const database = await getDb();
    if (!database) return [];

    const calls = await database
      .select()
      .from(castingCalls)
      .where(eq(castingCalls.producerId, ctx.user.id))
      .orderBy(desc(castingCalls.createdAt));

    // Attach submission counts
    return Promise.all(
      calls.map(async (c) => {
        const subs = await database
          .select({ count: sql<number>`count(*)` })
          .from(castingSubmissions)
          .where(eq(castingSubmissions.castingCallId, c.id));

        // Pipeline breakdown
        const pipeline = await database
          .select({
            status: castingSubmissions.status,
            count: sql<number>`count(*)`,
          })
          .from(castingSubmissions)
          .where(eq(castingSubmissions.castingCallId, c.id))
          .groupBy(castingSubmissions.status);

        const pipelineMap: Record<string, number> = {};
        pipeline.forEach((p: any) => {
          pipelineMap[p.status] = Number(p.count);
        });

        return {
          ...c,
          submissionCount: Number(subs[0]?.count ?? 0),
          pipeline: pipelineMap,
        };
      })
    );
  }),

  // ─── Get single casting call by ID ──────────────────────────
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const database = await getDb();
      if (!database) return null;

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
          producerName: users.name,
        })
        .from(castingCalls)
        .leftJoin(users, eq(castingCalls.producerId, users.id))
        .where(eq(castingCalls.id, input.id))
        .limit(1);

      if (!result[0]) return null;

      const subs = await database
        .select()
        .from(castingSubmissions)
        .where(eq(castingSubmissions.castingCallId, input.id));

      return { ...result[0], submissionCount: subs.length };
    }),

  // ─── Create casting call ────────────────────────────────────
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        roles: z.string().optional(),
        budget: z.string().optional(),
        deadline: z.string().optional(),
        status: z.enum(["open", "closed", "filled"]).default("open"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database unavailable");

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

  // ─── Update casting call ────────────────────────────────────
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        roles: z.string().optional(),
        budget: z.string().optional(),
        deadline: z.string().optional(),
        status: z.enum(["open", "closed", "filled"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database unavailable");

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

  // ─── Upload self-tape video to S3 ────────────────────────────
  uploadVideo: protectedProcedure
    .input(
      z.object({
        base64Data: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Strip data URI prefix if present
      const base64WithoutPrefix = input.base64Data.replace(/^data:[^;]+;base64,/, "");
      const buffer = Buffer.from(base64WithoutPrefix, "base64");

      // Generate unique filename
      const timestamp = Date.now();
      const uniqueFileName = `self-tapes/${ctx.user.id}/${timestamp}-${input.fileName}`;

      // Upload to S3
      const { url } = await storagePut(uniqueFileName, buffer, input.mimeType);

      return { videoUrl: url };
    }),

  // ─── Submit for a casting call (actors) ─────────────────────
  submit: protectedProcedure
    .input(
      z.object({
        castingCallId: z.number(),
        videoUrl: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database unavailable");

      // Check for duplicate submission
      const existing = await database
        .select()
        .from(castingSubmissions)
        .where(
          and(
            eq(castingSubmissions.castingCallId, input.castingCallId),
            eq(castingSubmissions.actorId, ctx.user.id)
          )
        );

      if (existing.length > 0) {
        throw new Error("You have already submitted for this casting call");
      }

      const result = await database.insert(castingSubmissions).values({
        castingCallId: input.castingCallId,
        actorId: ctx.user.id,
        videoUrl: input.videoUrl || null,
        notes: input.notes || null,
        status: "submitted",
      });
      return { id: result[0].insertId, success: true };
    }),

  // ─── Get submissions for a casting call (producer view) ─────
  getSubmissions: protectedProcedure
    .input(
      z.object({
        castingCallId: z.number(),
        statusFilter: z.enum(["all", ...PIPELINE_STATUSES]).optional().default("all"),
      })
    )
    .query(async ({ input }) => {
      const database = await getDb();
      if (!database) return [];

      let whereClause = eq(castingSubmissions.castingCallId, input.castingCallId);
      if (input.statusFilter && input.statusFilter !== "all") {
        whereClause = and(
          eq(castingSubmissions.castingCallId, input.castingCallId),
          eq(castingSubmissions.status, input.statusFilter)
        ) as any;
      }

      return database
        .select({
          id: castingSubmissions.id,
          actorId: castingSubmissions.actorId,
          videoUrl: castingSubmissions.videoUrl,
          notes: castingSubmissions.notes,
          status: castingSubmissions.status,
          createdAt: castingSubmissions.createdAt,
          actorName: users.name,
          actorEmail: users.email,
        })
        .from(castingSubmissions)
        .leftJoin(users, eq(castingSubmissions.actorId, users.id))
        .where(whereClause)
        .orderBy(desc(castingSubmissions.createdAt));
    }),

  // ─── Get actor's own submissions ────────────────────────────
  mySubmissions: protectedProcedure.query(async ({ ctx }) => {
    const database = await getDb();
    if (!database) return [];

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
        castingBudget: castingCalls.budget,
        producerName: users.name,
      })
      .from(castingSubmissions)
      .leftJoin(castingCalls, eq(castingSubmissions.castingCallId, castingCalls.id))
      .leftJoin(users, eq(castingCalls.producerId, users.id))
      .where(eq(castingSubmissions.actorId, ctx.user.id))
      .orderBy(desc(castingSubmissions.createdAt));
  }),

  // ─── Update submission status (producer pipeline) ───────────
  updateSubmissionStatus: protectedProcedure
    .input(
      z.object({
        submissionId: z.number(),
        status: z.enum(PIPELINE_STATUSES),
      })
    )
    .mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database unavailable");

      await database
        .update(castingSubmissions)
        .set({ status: input.status })
        .where(eq(castingSubmissions.id, input.submissionId));
      return { success: true };
    }),

  // ─── Bulk update submission statuses ────────────────────────
  bulkUpdateStatus: protectedProcedure
    .input(
      z.object({
        submissionIds: z.array(z.number()),
        status: z.enum(PIPELINE_STATUSES),
      })
    )
    .mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database unavailable");

      for (const id of input.submissionIds) {
        await database
          .update(castingSubmissions)
          .set({ status: input.status })
          .where(eq(castingSubmissions.id, id));
      }
      return { success: true, count: input.submissionIds.length };
    }),

  // ─── Casting analytics for a producer ───────────────────────
  getAnalytics: protectedProcedure.query(async ({ ctx }) => {
    const database = await getDb();
    if (!database)
      return { totalCastings: 0, openCastings: 0, totalSubmissions: 0, hiredCount: 0, pipeline: {} };

    const myCastings = await database
      .select()
      .from(castingCalls)
      .where(eq(castingCalls.producerId, ctx.user.id));

    const castingIds = myCastings.map((c) => c.id);
    if (castingIds.length === 0) {
      return { totalCastings: 0, openCastings: 0, totalSubmissions: 0, hiredCount: 0, pipeline: {} };
    }

    const openCastings = myCastings.filter((c) => c.status === "open").length;

    // Get all submissions for my castings
    const allSubs = await database
      .select()
      .from(castingSubmissions)
      .where(sql`${castingSubmissions.castingCallId} IN (${sql.join(castingIds.map(id => sql`${id}`), sql`, `)})`);

    const pipeline: Record<string, number> = {};
    allSubs.forEach((s: any) => {
      pipeline[s.status] = (pipeline[s.status] || 0) + 1;
    });

    return {
      totalCastings: myCastings.length,
      openCastings,
      totalSubmissions: allSubs.length,
      hiredCount: pipeline["hired"] || 0,
      pipeline,
    };
  }),

  // ─── Check if actor already submitted ───────────────────────
  hasSubmitted: protectedProcedure
    .input(z.object({ castingCallId: z.number() }))
    .query(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) return false;

      const existing = await database
        .select()
        .from(castingSubmissions)
        .where(
          and(
            eq(castingSubmissions.castingCallId, input.castingCallId),
            eq(castingSubmissions.actorId, ctx.user.id)
          )
        );
      return existing.length > 0;
    }),

  // ─── Withdraw submission (actor) ────────────────────────────
  withdrawSubmission: protectedProcedure
    .input(z.object({ submissionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database unavailable");

      // Only allow withdrawal of own submissions that are still "submitted"
      const sub = await database
        .select()
        .from(castingSubmissions)
        .where(
          and(
            eq(castingSubmissions.id, input.submissionId),
            eq(castingSubmissions.actorId, ctx.user.id)
          )
        );

      if (sub.length === 0) throw new Error("Submission not found");
      if (sub[0].status !== "submitted") throw new Error("Can only withdraw pending submissions");

      await database
        .delete(castingSubmissions)
        .where(eq(castingSubmissions.id, input.submissionId));

      return { success: true };
    }),
});
