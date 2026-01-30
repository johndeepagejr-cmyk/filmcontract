import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import {
  selfTapes,
  selfTapeFeedback,
  selfTapeRatings,
  selfTapeRevisions,
  users,
  contracts,
} from "../drizzle/schema";
import { eq, and, desc, or, isNull } from "drizzle-orm";

/**
 * Send push notification helper
 */
async function sendPushNotificationToUser(
  pushToken: string,
  title: string,
  body: string,
  data?: Record<string, any>
) {
  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: pushToken,
        title,
        body,
        data,
      }),
    });
    return await response.json();
  } catch (error) {
    console.error("Failed to send push notification:", error);
    return null;
  }
}

export const selfTapeRouter = router({
  /**
   * Create a new self-tape (draft)
   */
  createSelfTape: protectedProcedure
    .input(z.object({
      projectTitle: z.string().min(1),
      roleDescription: z.string().optional(),
      characterName: z.string().optional(),
      videoUrl: z.string().url(),
      thumbnailUrl: z.string().url().optional(),
      durationSeconds: z.number().optional(),
      fileSizeBytes: z.number().optional(),
      slateText: z.string().optional(),
      slateEnabled: z.boolean().default(true),
      trimStart: z.number().default(0),
      trimEnd: z.number().optional(),
      actorNotes: z.string().optional(),
      producerId: z.number().optional(),
      contractId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      // Verify user is an actor
      if (ctx.user.userRole !== "actor") {
        throw new Error("Only actors can create self-tapes");
      }

      const [selfTape] = await db.insert(selfTapes).values({
        actorId: userId,
        producerId: input.producerId,
        contractId: input.contractId,
        projectTitle: input.projectTitle,
        roleDescription: input.roleDescription,
        characterName: input.characterName,
        videoUrl: input.videoUrl,
        thumbnailUrl: input.thumbnailUrl,
        durationSeconds: input.durationSeconds,
        fileSizeBytes: input.fileSizeBytes,
        slateText: input.slateText || `${ctx.user.name || "Actor"} - ${input.characterName || input.projectTitle}`,
        slateEnabled: input.slateEnabled,
        trimStart: input.trimStart,
        trimEnd: input.trimEnd,
        actorNotes: input.actorNotes,
        status: "draft",
      });

      return { id: (selfTape as any).insertId };
    }),

  /**
   * Update a self-tape (before submission)
   */
  updateSelfTape: protectedProcedure
    .input(z.object({
      selfTapeId: z.number(),
      projectTitle: z.string().min(1).optional(),
      roleDescription: z.string().optional(),
      characterName: z.string().optional(),
      videoUrl: z.string().url().optional(),
      thumbnailUrl: z.string().url().optional(),
      durationSeconds: z.number().optional(),
      slateText: z.string().optional(),
      slateEnabled: z.boolean().optional(),
      trimStart: z.number().optional(),
      trimEnd: z.number().optional(),
      actorNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      const [selfTape] = await db
        .select()
        .from(selfTapes)
        .where(eq(selfTapes.id, input.selfTapeId));

      if (!selfTape) {
        throw new Error("Self-tape not found");
      }

      if (selfTape.actorId !== userId) {
        throw new Error("You can only edit your own self-tapes");
      }

      if (selfTape.status !== "draft") {
        throw new Error("Can only edit draft self-tapes");
      }

      const { selfTapeId, ...updateData } = input;
      await db
        .update(selfTapes)
        .set(updateData)
        .where(eq(selfTapes.id, selfTapeId));

      return { success: true };
    }),

  /**
   * Submit a self-tape for review
   */
  submitSelfTape: protectedProcedure
    .input(z.object({
      selfTapeId: z.number(),
      producerId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      const [selfTape] = await db
        .select()
        .from(selfTapes)
        .where(eq(selfTapes.id, input.selfTapeId));

      if (!selfTape) {
        throw new Error("Self-tape not found");
      }

      if (selfTape.actorId !== userId) {
        throw new Error("You can only submit your own self-tapes");
      }

      if (selfTape.status !== "draft") {
        throw new Error("Self-tape has already been submitted");
      }

      await db
        .update(selfTapes)
        .set({
          status: "submitted",
          submittedAt: new Date(),
          producerId: input.producerId || selfTape.producerId,
        })
        .where(eq(selfTapes.id, input.selfTapeId));

      // Notify producer if one is assigned
      const producerId = input.producerId || selfTape.producerId;
      if (producerId) {
        const [producer] = await db
          .select()
          .from(users)
          .where(eq(users.id, producerId));

        const [actor] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId));

        if (producer?.pushToken) {
          await sendPushNotificationToUser(
            producer.pushToken,
            "New Self-Tape Submitted! 🎬",
            `${actor?.name || "An actor"} submitted a self-tape for "${selfTape.projectTitle}"`,
            { type: "self_tape_submitted", selfTapeId: input.selfTapeId }
          );
        }
      }

      return { success: true };
    }),

  /**
   * Get self-tape by ID
   */
  getSelfTape: protectedProcedure
    .input(z.object({ selfTapeId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      const [selfTape] = await db
        .select()
        .from(selfTapes)
        .where(eq(selfTapes.id, input.selfTapeId));

      if (!selfTape) {
        throw new Error("Self-tape not found");
      }

      // Verify access
      if (selfTape.actorId !== userId && selfTape.producerId !== userId) {
        throw new Error("You don't have access to this self-tape");
      }

      // Get actor info
      const [actor] = await db
        .select()
        .from(users)
        .where(eq(users.id, selfTape.actorId));

      // Get producer info if assigned
      let producer = null;
      if (selfTape.producerId) {
        const [p] = await db
          .select()
          .from(users)
          .where(eq(users.id, selfTape.producerId));
        producer = p;
      }

      // Get feedback
      const feedback = await db
        .select()
        .from(selfTapeFeedback)
        .where(eq(selfTapeFeedback.selfTapeId, input.selfTapeId))
        .orderBy(selfTapeFeedback.timestampSeconds);

      // Get ratings
      const [rating] = await db
        .select()
        .from(selfTapeRatings)
        .where(eq(selfTapeRatings.selfTapeId, input.selfTapeId));

      // Get revision requests
      const revisions = await db
        .select()
        .from(selfTapeRevisions)
        .where(eq(selfTapeRevisions.selfTapeId, input.selfTapeId))
        .orderBy(desc(selfTapeRevisions.createdAt));

      return {
        ...selfTape,
        actor,
        producer,
        feedback,
        rating,
        revisions,
      };
    }),

  /**
   * Get actor's self-tapes
   */
  getMyTapes: protectedProcedure
    .input(z.object({
      status: z.enum(["draft", "submitted", "under_review", "approved", "rejected", "revision_requested", "all"]).default("all"),
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      let tapes = await db
        .select()
        .from(selfTapes)
        .where(eq(selfTapes.actorId, userId))
        .orderBy(desc(selfTapes.createdAt))
        .limit(input.limit);

      if (input.status !== "all") {
        tapes = tapes.filter(t => t.status === input.status);
      }

      return tapes;
    }),

  /**
   * Get self-tapes for producer review
   */
  getTapesForReview: protectedProcedure
    .input(z.object({
      status: z.enum(["submitted", "under_review", "approved", "rejected", "revision_requested", "all"]).default("submitted"),
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      // Verify user is a producer
      if (ctx.user.userRole !== "producer") {
        throw new Error("Only producers can review self-tapes");
      }

      let tapes = await db
        .select({
          selfTape: selfTapes,
          actor: users,
        })
        .from(selfTapes)
        .innerJoin(users, eq(selfTapes.actorId, users.id))
        .where(
          or(
            eq(selfTapes.producerId, userId),
            isNull(selfTapes.producerId) // Also show unassigned tapes
          )
        )
        .orderBy(desc(selfTapes.submittedAt))
        .limit(input.limit);

      // Filter by status
      if (input.status !== "all") {
        tapes = tapes.filter(t => t.selfTape.status === input.status);
      }

      // Filter out drafts
      tapes = tapes.filter(t => t.selfTape.status !== "draft");

      return tapes;
    }),

  /**
   * Add timestamped feedback
   */
  addFeedback: protectedProcedure
    .input(z.object({
      selfTapeId: z.number(),
      timestampSeconds: z.number().optional(),
      note: z.string().min(1),
      feedbackType: z.enum(["positive", "constructive", "question", "general"]).default("general"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      // Verify user is a producer
      if (ctx.user.userRole !== "producer") {
        throw new Error("Only producers can add feedback");
      }

      const [selfTape] = await db
        .select()
        .from(selfTapes)
        .where(eq(selfTapes.id, input.selfTapeId));

      if (!selfTape) {
        throw new Error("Self-tape not found");
      }

      // Update status to under_review if first feedback
      if (selfTape.status === "submitted") {
        await db
          .update(selfTapes)
          .set({ status: "under_review" })
          .where(eq(selfTapes.id, input.selfTapeId));
      }

      const [feedback] = await db.insert(selfTapeFeedback).values({
        selfTapeId: input.selfTapeId,
        producerId: userId,
        timestampSeconds: input.timestampSeconds,
        note: input.note,
        feedbackType: input.feedbackType,
      });

      // Notify actor
      const [actor] = await db
        .select()
        .from(users)
        .where(eq(users.id, selfTape.actorId));

      if (actor?.pushToken) {
        await sendPushNotificationToUser(
          actor.pushToken,
          "New Feedback on Your Self-Tape! 📝",
          `A producer left feedback on your "${selfTape.projectTitle}" self-tape`,
          { type: "self_tape_feedback", selfTapeId: input.selfTapeId }
        );
      }

      return { id: (feedback as any).insertId };
    }),

  /**
   * Submit rating for a self-tape
   */
  submitRating: protectedProcedure
    .input(z.object({
      selfTapeId: z.number(),
      fitScore: z.number().min(1).max(10).optional(),
      energyScore: z.number().min(1).max(10).optional(),
      deliveryScore: z.number().min(1).max(10).optional(),
      technicalScore: z.number().min(1).max(10).optional(),
      overallScore: z.number().min(1).max(10).optional(),
      summary: z.string().optional(),
      wouldConsider: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      // Verify user is a producer
      if (ctx.user.userRole !== "producer") {
        throw new Error("Only producers can rate self-tapes");
      }

      const [selfTape] = await db
        .select()
        .from(selfTapes)
        .where(eq(selfTapes.id, input.selfTapeId));

      if (!selfTape) {
        throw new Error("Self-tape not found");
      }

      // Check if rating already exists
      const [existingRating] = await db
        .select()
        .from(selfTapeRatings)
        .where(
          and(
            eq(selfTapeRatings.selfTapeId, input.selfTapeId),
            eq(selfTapeRatings.producerId, userId)
          )
        );

      if (existingRating) {
        // Update existing rating
        const { selfTapeId, ...updateData } = input;
        await db
          .update(selfTapeRatings)
          .set(updateData)
          .where(eq(selfTapeRatings.id, existingRating.id));
        return { id: existingRating.id };
      }

      // Create new rating
      const [rating] = await db.insert(selfTapeRatings).values({
        selfTapeId: input.selfTapeId,
        producerId: userId,
        fitScore: input.fitScore,
        energyScore: input.energyScore,
        deliveryScore: input.deliveryScore,
        technicalScore: input.technicalScore,
        overallScore: input.overallScore,
        summary: input.summary,
        wouldConsider: input.wouldConsider,
      });

      return { id: (rating as any).insertId };
    }),

  /**
   * Request revision from actor
   */
  requestRevision: protectedProcedure
    .input(z.object({
      selfTapeId: z.number(),
      requestedChanges: z.string().min(1),
      priority: z.enum(["low", "medium", "high"]).default("medium"),
      deadline: z.string().optional(), // ISO date string
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      // Verify user is a producer
      if (ctx.user.userRole !== "producer") {
        throw new Error("Only producers can request revisions");
      }

      const [selfTape] = await db
        .select()
        .from(selfTapes)
        .where(eq(selfTapes.id, input.selfTapeId));

      if (!selfTape) {
        throw new Error("Self-tape not found");
      }

      // Update self-tape status
      await db
        .update(selfTapes)
        .set({ status: "revision_requested" })
        .where(eq(selfTapes.id, input.selfTapeId));

      // Create revision request
      const [revision] = await db.insert(selfTapeRevisions).values({
        selfTapeId: input.selfTapeId,
        producerId: userId,
        requestedChanges: input.requestedChanges,
        priority: input.priority,
        deadline: input.deadline ? new Date(input.deadline) : undefined,
        status: "pending",
      });

      // Notify actor
      const [actor] = await db
        .select()
        .from(users)
        .where(eq(users.id, selfTape.actorId));

      if (actor?.pushToken) {
        await sendPushNotificationToUser(
          actor.pushToken,
          "Revision Requested! 🔄",
          `A producer requested changes to your "${selfTape.projectTitle}" self-tape`,
          { type: "self_tape_revision_requested", selfTapeId: input.selfTapeId }
        );
      }

      return { id: (revision as any).insertId };
    }),

  /**
   * Submit revision (create new tape linked to original)
   */
  submitRevision: protectedProcedure
    .input(z.object({
      originalTapeId: z.number(),
      revisionRequestId: z.number(),
      videoUrl: z.string().url(),
      thumbnailUrl: z.string().url().optional(),
      durationSeconds: z.number().optional(),
      fileSizeBytes: z.number().optional(),
      slateText: z.string().optional(),
      slateEnabled: z.boolean().default(true),
      trimStart: z.number().default(0),
      trimEnd: z.number().optional(),
      actorNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      const [originalTape] = await db
        .select()
        .from(selfTapes)
        .where(eq(selfTapes.id, input.originalTapeId));

      if (!originalTape) {
        throw new Error("Original self-tape not found");
      }

      if (originalTape.actorId !== userId) {
        throw new Error("You can only submit revisions for your own self-tapes");
      }

      // Create new tape as revision
      const [newTape] = await db.insert(selfTapes).values({
        actorId: userId,
        producerId: originalTape.producerId,
        contractId: originalTape.contractId,
        projectTitle: originalTape.projectTitle,
        roleDescription: originalTape.roleDescription,
        characterName: originalTape.characterName,
        videoUrl: input.videoUrl,
        thumbnailUrl: input.thumbnailUrl,
        durationSeconds: input.durationSeconds,
        fileSizeBytes: input.fileSizeBytes,
        slateText: input.slateText || originalTape.slateText,
        slateEnabled: input.slateEnabled,
        trimStart: input.trimStart,
        trimEnd: input.trimEnd,
        actorNotes: input.actorNotes,
        status: "submitted",
        submittedAt: new Date(),
        isRevision: true,
        originalTapeId: input.originalTapeId,
        revisionNumber: (originalTape.revisionNumber || 0) + 1,
      });

      const newTapeId = (newTape as any).insertId;

      // Update revision request
      await db
        .update(selfTapeRevisions)
        .set({
          status: "completed",
          newTapeId,
        })
        .where(eq(selfTapeRevisions.id, input.revisionRequestId));

      // Notify producer
      if (originalTape.producerId) {
        const [producer] = await db
          .select()
          .from(users)
          .where(eq(users.id, originalTape.producerId));

        const [actor] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId));

        if (producer?.pushToken) {
          await sendPushNotificationToUser(
            producer.pushToken,
            "Revision Submitted! 🎬",
            `${actor?.name || "An actor"} submitted a revised self-tape for "${originalTape.projectTitle}"`,
            { type: "self_tape_revision_submitted", selfTapeId: newTapeId }
          );
        }
      }

      return { id: newTapeId };
    }),

  /**
   * Approve or reject a self-tape
   */
  updateStatus: protectedProcedure
    .input(z.object({
      selfTapeId: z.number(),
      status: z.enum(["approved", "rejected"]),
      feedback: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      // Verify user is a producer
      if (ctx.user.userRole !== "producer") {
        throw new Error("Only producers can update self-tape status");
      }

      const [selfTape] = await db
        .select()
        .from(selfTapes)
        .where(eq(selfTapes.id, input.selfTapeId));

      if (!selfTape) {
        throw new Error("Self-tape not found");
      }

      await db
        .update(selfTapes)
        .set({ status: input.status })
        .where(eq(selfTapes.id, input.selfTapeId));

      // Add feedback if provided
      if (input.feedback) {
        await db.insert(selfTapeFeedback).values({
          selfTapeId: input.selfTapeId,
          producerId: userId,
          note: input.feedback,
          feedbackType: input.status === "approved" ? "positive" : "constructive",
        });
      }

      // Notify actor
      const [actor] = await db
        .select()
        .from(users)
        .where(eq(users.id, selfTape.actorId));

      if (actor?.pushToken) {
        const title = input.status === "approved" 
          ? "Self-Tape Approved! 🎉" 
          : "Self-Tape Update";
        const body = input.status === "approved"
          ? `Your "${selfTape.projectTitle}" self-tape has been approved!`
          : `Your "${selfTape.projectTitle}" self-tape was not selected. Check feedback for details.`;

        await sendPushNotificationToUser(
          actor.pushToken,
          title,
          body,
          { type: "self_tape_status_update", selfTapeId: input.selfTapeId, status: input.status }
        );
      }

      return { success: true };
    }),

  /**
   * Delete a self-tape (only drafts)
   */
  deleteSelfTape: protectedProcedure
    .input(z.object({ selfTapeId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      const [selfTape] = await db
        .select()
        .from(selfTapes)
        .where(eq(selfTapes.id, input.selfTapeId));

      if (!selfTape) {
        throw new Error("Self-tape not found");
      }

      if (selfTape.actorId !== userId) {
        throw new Error("You can only delete your own self-tapes");
      }

      if (selfTape.status !== "draft") {
        throw new Error("Can only delete draft self-tapes");
      }

      // Note: In production, also delete the video file from storage
      await db.delete(selfTapes).where(eq(selfTapes.id, input.selfTapeId));

      return { success: true };
    }),
});
