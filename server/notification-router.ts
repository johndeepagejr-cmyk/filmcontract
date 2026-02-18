import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { notifications, users } from "@/drizzle/schema";
import { eq, and, desc, sql, isNull } from "drizzle-orm";
import { savePushToken } from "./notification-service";

export const notificationRouter = router({
  // Get all notifications for current user
  list: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().default(0),
      unreadOnly: z.boolean().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { items: [], unreadCount: 0, total: 0 };

      const limit = input?.limit || 50;
      const offset = input?.offset || 0;
      const unreadOnly = input?.unreadOnly || false;

      let condition = eq(notifications.userId, ctx.user.id);
      if (unreadOnly) {
        condition = and(condition, eq(notifications.isRead, false))!;
      }

      const items = await db.select().from(notifications)
        .where(condition)
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset);

      // Get unread count
      const [countResult] = await db.select({ count: sql<number>`COUNT(*)` })
        .from(notifications)
        .where(and(eq(notifications.userId, ctx.user.id), eq(notifications.isRead, false)));

      // Get total count
      const [totalResult] = await db.select({ count: sql<number>`COUNT(*)` })
        .from(notifications)
        .where(eq(notifications.userId, ctx.user.id));

      return {
        items: items.map(n => ({
          ...n,
          data: n.data ? JSON.parse(n.data) : null,
        })),
        unreadCount: countResult?.count || 0,
        total: totalResult?.count || 0,
      };
    }),

  // Get unread count only (for badge)
  unreadCount: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return 0;

      const [result] = await db.select({ count: sql<number>`COUNT(*)` })
        .from(notifications)
        .where(and(eq(notifications.userId, ctx.user.id), eq(notifications.isRead, false)));

      return result?.count || 0;
    }),

  // Mark single notification as read
  markRead: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };

      await db.update(notifications)
        .set({ isRead: true })
        .where(and(
          eq(notifications.id, input.notificationId),
          eq(notifications.userId, ctx.user.id)
        ));

      return { success: true };
    }),

  // Mark all as read
  markAllRead: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { success: false };

      await db.update(notifications)
        .set({ isRead: true })
        .where(and(
          eq(notifications.userId, ctx.user.id),
          eq(notifications.isRead, false)
        ));

      return { success: true };
    }),

  // Delete a notification
  delete: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };

      await db.delete(notifications)
        .where(and(
          eq(notifications.id, input.notificationId),
          eq(notifications.userId, ctx.user.id)
        ));

      return { success: true };
    }),

  // Register push token
  registerPushToken: protectedProcedure
    .input(z.object({ pushToken: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await savePushToken(ctx.user.id, input.pushToken);
      return { success: result };
    }),
});
