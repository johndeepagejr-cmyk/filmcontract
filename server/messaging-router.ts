import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { conversations, messages, users } from "@/drizzle/schema";
import { eq, or, and, desc, sql } from "drizzle-orm";
import { notifyNewMessage } from "./notification-service";

export const messagingRouter = router({
  // Get all conversations for current user
  getConversations: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    
    const userId = ctx.user.id;
    
    const userConversations = await db
      .select({
        id: conversations.id,
        participant1Id: conversations.participant1Id,
        participant2Id: conversations.participant2Id,
        lastMessageAt: conversations.lastMessageAt,
        lastMessagePreview: conversations.lastMessagePreview,
        createdAt: conversations.createdAt,
      })
      .from(conversations)
      .where(
        or(
          eq(conversations.participant1Id, userId),
          eq(conversations.participant2Id, userId)
        )
      )
      .orderBy(desc(conversations.lastMessageAt));

    // Get participant details for each conversation
    const conversationsWithUsers = await Promise.all(
      userConversations.map(async (conv) => {
        const otherUserId = conv.participant1Id === userId ? conv.participant2Id : conv.participant1Id;
        const [otherUser] = await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            userRole: users.userRole,
          })
          .from(users)
          .where(eq(users.id, otherUserId));

        // Count unread messages
        const [unreadCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(messages)
          .where(
            and(
              eq(messages.conversationId, conv.id),
              eq(messages.isRead, false),
              sql`${messages.senderId} != ${userId}`
            )
          );

        return {
          ...conv,
          otherUser,
          unreadCount: unreadCount?.count || 0,
        };
      })
    );

    return conversationsWithUsers;
  }),

  // Get messages for a conversation
  getMessages: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      
      const userId = ctx.user.id;

      // Verify user is part of this conversation
      const [conversation] = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, input.conversationId),
            or(
              eq(conversations.participant1Id, userId),
              eq(conversations.participant2Id, userId)
            )
          )
        );

      if (!conversation) {
        throw new Error("Conversation not found");
      }

      // Get messages
      const conversationMessages = await db
        .select({
          id: messages.id,
          conversationId: messages.conversationId,
          senderId: messages.senderId,
          content: messages.content,
          isRead: messages.isRead,
          createdAt: messages.createdAt,
        })
        .from(messages)
        .where(eq(messages.conversationId, input.conversationId))
        .orderBy(messages.createdAt);

      // Mark messages as read
      await db
        .update(messages)
        .set({ isRead: true })
        .where(
          and(
            eq(messages.conversationId, input.conversationId),
            sql`${messages.senderId} != ${userId}`
          )
        );

      return conversationMessages;
    }),

  // Send a message
  sendMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.number().optional(),
        recipientId: z.number().optional(),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const userId = ctx.user.id;
      let conversationId = input.conversationId;

      // If no conversationId, create or find existing conversation
      if (!conversationId && input.recipientId) {
        // Check if conversation already exists
        const [existingConversation] = await db
          .select()
          .from(conversations)
          .where(
            or(
              and(
                eq(conversations.participant1Id, userId),
                eq(conversations.participant2Id, input.recipientId)
              ),
              and(
                eq(conversations.participant1Id, input.recipientId),
                eq(conversations.participant2Id, userId)
              )
            )
          );

        if (existingConversation) {
          conversationId = existingConversation.id;
        } else {
          // Create new conversation
          const [newConversation] = await db
            .insert(conversations)
            .values({
              participant1Id: userId,
              participant2Id: input.recipientId,
              lastMessagePreview: input.content.substring(0, 255),
            })
            .$returningId();
          conversationId = newConversation.id;
        }
      }

      if (!conversationId) {
        throw new Error("Conversation ID or recipient ID required");
      }

      // Insert message
      const [newMessage] = await db
        .insert(messages)
        .values({
          conversationId,
          senderId: userId,
          content: input.content,
        })
        .$returningId();

      // Update conversation last message
      await db
        .update(conversations)
        .set({
          lastMessageAt: new Date(),
          lastMessagePreview: input.content.substring(0, 255),
        })
        .where(eq(conversations.id, conversationId));

      // Get recipient ID and sender name for push notification
      const [conversation] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, conversationId));
      
      if (conversation) {
        const recipientId = conversation.participant1Id === userId 
          ? conversation.participant2Id 
          : conversation.participant1Id;
        const senderName = ctx.user.name || "Someone";
        
        // Send push notification to recipient
        await notifyNewMessage(recipientId, senderName, input.content);
      }

      return { id: newMessage.id, conversationId };
    }),

  // Start a new conversation (or get existing one)
  startConversation: protectedProcedure
    .input(z.object({ recipientId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const userId = ctx.user.id;

      // Check if conversation already exists
      const [existingConversation] = await db
        .select()
        .from(conversations)
        .where(
          or(
            and(
              eq(conversations.participant1Id, userId),
              eq(conversations.participant2Id, input.recipientId)
            ),
            and(
              eq(conversations.participant1Id, input.recipientId),
              eq(conversations.participant2Id, userId)
            )
          )
        );

      if (existingConversation) {
        return existingConversation;
      }

      // Create new conversation
      const [newConversation] = await db
        .insert(conversations)
        .values({
          participant1Id: userId,
          participant2Id: input.recipientId,
        })
        .$returningId();

      return { id: newConversation.id };
    }),

  // Get unread message count
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { count: 0 };
    
    const userId = ctx.user.id;

    // Get all conversations where user is a participant
    const userConversations = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(
        or(
          eq(conversations.participant1Id, userId),
          eq(conversations.participant2Id, userId)
        )
      );

    if (userConversations.length === 0) {
      return { count: 0 };
    }

    const conversationIds = userConversations.map((c) => c.id);

    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(
        and(
          sql`${messages.conversationId} IN (${sql.raw(conversationIds.join(","))})`,
          eq(messages.isRead, false),
          sql`${messages.senderId} != ${userId}`
        )
      );

    return { count: result?.count || 0 };
  }),
});
