import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { socialFollows, socialPosts, users, contracts, actorReviews, producerReviews } from "@/drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";

/**
 * Social Features Router
 * Handles follow system, activity feed, and messaging
 */
export const socialRouter = router({
  // ============ FOLLOW SYSTEM ============
  follow: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.user.id) {
        throw new Error("Cannot follow yourself");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if already following
      const existing = await db
        .select()
        .from(socialFollows)
        .where(
          and(
            eq(socialFollows.followerId, ctx.user.id),
            eq(socialFollows.followingId, input.userId)
          )
        );

      if (existing.length > 0) {
        throw new Error("Already following this user");
      }

      // Create follow relationship
      await db.insert(socialFollows).values({
        followerId: ctx.user.id,
        followingId: input.userId,
      });

      return { success: true };
    }),

  unfollow: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .delete(socialFollows)
        .where(
          and(
            eq(socialFollows.followerId, ctx.user.id),
            eq(socialFollows.followingId, input.userId)
          )
        );

      return { success: true };
    }),

  isFollowing: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return false;

      const result = await db
        .select()
        .from(socialFollows)
        .where(
          and(
            eq(socialFollows.followerId, ctx.user.id),
            eq(socialFollows.followingId, input.userId)
          )
        );

      return result.length > 0;
    }),

  getFollowers: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const followers = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          userRole: users.userRole,
        })
        .from(socialFollows)
        .innerJoin(users, eq(socialFollows.followerId, users.id))
        .where(eq(socialFollows.followingId, input.userId));

      return followers;
    }),

  getFollowing: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const following = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          userRole: users.userRole,
        })
        .from(socialFollows)
        .innerJoin(users, eq(socialFollows.followingId, users.id))
        .where(eq(socialFollows.followerId, input.userId));

      return following;
    }),

  getFollowerCount: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return 0;

      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(socialFollows)
        .where(eq(socialFollows.followingId, input.userId));

      return result[0]?.count || 0;
    }),

  getFollowingCount: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return 0;

      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(socialFollows)
        .where(eq(socialFollows.followerId, input.userId));

      return result[0]?.count || 0;
    }),

  // ============ ACTIVITY FEED ============
  getActivityFeed: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    // Get all users that current user follows
    const following = await db
      .select({ followingId: socialFollows.followingId })
      .from(socialFollows)
      .where(eq(socialFollows.followerId, ctx.user.id));

    const followingIds = following.map((f) => f.followingId);

    if (followingIds.length === 0) {
      return [];
    }

    // Get recent contracts from followed users
    const recentContracts = await db
      .select({
        type: sql<string>`'contract'`,
        id: contracts.id,
        userId: contracts.producerId,
        userName: users.name,
        userRole: users.userRole,
        action: sql<string>`'created a new contract'`,
        description: contracts.projectTitle,
        createdAt: contracts.createdAt,
      })
      .from(contracts)
      .innerJoin(users, eq(contracts.producerId, users.id))
      .where(sql`${contracts.producerId} IN (${sql.raw(followingIds.join(","))})`)
      .orderBy(desc(contracts.createdAt))
      .limit(50);

    // Get recent reviews from followed users
    const recentActorReviews = await db
      .select({
        type: sql<string>`'review'`,
        id: actorReviews.id,
        userId: actorReviews.producerId,
        userName: users.name,
        userRole: users.userRole,
        action: sql<string>`'left a review'`,
        description: sql<string>`CONCAT('Rating: ', ${actorReviews.rating}, '/5')`,
        createdAt: actorReviews.createdAt,
      })
      .from(actorReviews)
      .innerJoin(users, eq(actorReviews.producerId, users.id))
      .where(sql`${actorReviews.producerId} IN (${sql.raw(followingIds.join(","))})`)
      .orderBy(desc(actorReviews.createdAt))
      .limit(50);

    // Combine and sort by date
    const allActivity = [...recentContracts, ...recentActorReviews].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return allActivity.slice(0, 30);
  }),

  // ============ MESSAGING SYSTEM ============
  sendMessage: protectedProcedure
    .input(
      z.object({
        recipientId: z.number(),
        content: z.string().min(1).max(1000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // For now, we'll store messages in a simple way
      // In production, you'd want a dedicated messages table
      // This is a placeholder that logs the message
      console.log(
        `[Message] From ${ctx.user.id} to ${input.recipientId}: ${input.content}`
      );

      return {
        success: true,
        messageId: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
      };
    }),

  getConversations: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    // Get all users the current user has interacted with
    // This is a simplified version - in production, you'd query a messages table
    const followers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        userRole: users.userRole,
      })
      .from(socialFollows)
      .innerJoin(users, eq(socialFollows.followerId, users.id))
      .where(eq(socialFollows.followingId, ctx.user.id));

    const following = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        userRole: users.userRole,
      })
      .from(socialFollows)
      .innerJoin(users, eq(socialFollows.followingId, users.id))
      .where(eq(socialFollows.followerId, ctx.user.id));

    // Combine and deduplicate
    const conversations = [
      ...followers,
      ...following.filter((f) => !followers.some((fl) => fl.id === f.id)),
    ];

    return conversations;
  }),
});
