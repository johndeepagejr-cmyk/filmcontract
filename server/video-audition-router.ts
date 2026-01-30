import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { getDb } from "./db";
import {
  videoAuditions,
  auditionParticipants,
  auditionInvitations,
  users,
  contracts,
  actorProfiles,
} from "../drizzle/schema";
import { eq, and, desc, gte, or } from "drizzle-orm";

// Daily.co API configuration
const DAILY_API_KEY = process.env.DAILY_API_KEY || "";
const DAILY_API_URL = "https://api.daily.co/v1";

/**
 * Send push notification helper (inline to avoid import issues)
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

/**
 * Create a Daily.co room for video audition
 */
async function createDailyRoom(roomName: string, options?: {
  enableRecording?: boolean;
  expiryMinutes?: number;
}) {
  const response = await fetch(`${DAILY_API_URL}/rooms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      name: roomName,
      privacy: "private",
      properties: {
        enable_recording: options?.enableRecording || false,
        exp: options?.expiryMinutes 
          ? Math.floor(Date.now() / 1000) + (options.expiryMinutes * 60)
          : Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour default
        enable_chat: true,
        enable_screenshare: true,
        start_video_off: false,
        start_audio_off: false,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create Daily room: ${error}`);
  }

  return response.json();
}

/**
 * Delete a Daily.co room
 */
async function deleteDailyRoom(roomName: string) {
  const response = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${DAILY_API_KEY}`,
    },
  });

  return response.ok;
}

/**
 * Get recording for a Daily.co room
 */
async function getDailyRecording(roomName: string) {
  const response = await fetch(`${DAILY_API_URL}/recordings?room_name=${roomName}`, {
    headers: {
      "Authorization": `Bearer ${DAILY_API_KEY}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.data?.[0] || null;
}

export const videoAuditionRouter = router({
  /**
   * Schedule a new video audition
   */
  scheduleAudition: protectedProcedure
    .input(z.object({
      contractId: z.number().optional(), // Optional contract reference
      projectTitle: z.string(), // Project title for display
      actorId: z.number(),
      scheduledAt: z.string(), // ISO date string
      durationMinutes: z.number().min(5).max(120).default(30),
      notes: z.string().optional(),
      enableRecording: z.boolean().default(false),
      message: z.string().optional(), // Message to send with invitation
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      // Verify user is a producer
      if (ctx.user.userRole !== "producer") {
        throw new Error("Only producers can schedule auditions");
      }

      // Generate unique room name
      const roomName = `filmcontract-${userId}-${input.actorId}-${Date.now()}`;
      
      // Create Daily.co room
      let dailyRoom;
      if (DAILY_API_KEY) {
        try {
          dailyRoom = await createDailyRoom(roomName, {
            enableRecording: input.enableRecording,
            expiryMinutes: input.durationMinutes + 30, // Extra buffer time
          });
        } catch (error) {
          console.error("Failed to create Daily room:", error);
          // Continue without Daily room - will use fallback
        }
      }

      // Create audition record
      const [audition] = await db.insert(videoAuditions).values({
        projectId: input.contractId || 0, // Use contractId or 0 for standalone auditions
        producerId: userId,
        actorId: input.actorId,
        roomName,
        roomUrl: dailyRoom?.url || `https://filmcontract.daily.co/${roomName}`,
        scheduledAt: new Date(input.scheduledAt),
        durationMinutes: input.durationMinutes,
        notes: input.notes,
        recordingEnabled: input.enableRecording,
        status: "scheduled",
      });

      const auditionId = (audition as any).insertId;

      // Create invitation for the actor
      await db.insert(auditionInvitations).values({
        auditionId,
        actorId: input.actorId,
        message: input.message,
        status: "pending",
        expiresAt: new Date(input.scheduledAt), // Expires at scheduled time
      });

      // Send push notification to actor
      const [actor] = await db
        .select()
        .from(users)
        .where(eq(users.id, input.actorId));

      if (actor?.pushToken) {
        await sendPushNotificationToUser(
          actor.pushToken,
          "New Audition Invitation! 🎬",
          `You've been invited to a video audition for "${input.projectTitle}". Tap to view details.`,
          { type: "audition_invite", auditionId }
        );
      }

      return {
        id: auditionId,
        roomName,
        roomUrl: dailyRoom?.url || `https://filmcontract.daily.co/${roomName}`,
        scheduledAt: input.scheduledAt,
      };
    }),

  /**
   * Get audition details
   */
  getAudition: protectedProcedure
    .input(z.object({ auditionId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      const [audition] = await db
        .select()
        .from(videoAuditions)
        .where(eq(videoAuditions.id, input.auditionId));

      if (!audition) {
        throw new Error("Audition not found");
      }

      // Verify user is participant
      if (audition.producerId !== userId && audition.actorId !== userId) {
        throw new Error("You don't have access to this audition");
      }

      // Get producer details
      const [producer] = await db
        .select()
        .from(users)
        .where(eq(users.id, audition.producerId));

      // Get actor details
      const [actor] = await db
        .select()
        .from(users)
        .where(eq(users.id, audition.actorId));

      // Get contract/project info if available
      let project = null;
      if (audition.projectId && audition.projectId > 0) {
        const [contract] = await db
          .select()
          .from(contracts)
          .where(eq(contracts.id, audition.projectId));
        if (contract) {
          project = { id: contract.id, title: contract.projectTitle };
        }
      }

      return {
        ...audition,
        project,
        role: null, // No role reference in simplified schema
        producer,
        actor,
      };
    }),

  /**
   * Get upcoming auditions for current user
   */
  getMyAuditions: protectedProcedure
    .input(z.object({
      status: z.enum(["scheduled", "in_progress", "completed", "cancelled", "no_show", "all"]).default("all"),
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      const auditions = await db
        .select()
        .from(videoAuditions)
        .where(
          or(
            eq(videoAuditions.producerId, userId),
            eq(videoAuditions.actorId, userId)
          )
        )
        .orderBy(desc(videoAuditions.scheduledAt))
        .limit(input.limit);

      // Filter by status if not "all"
      const filteredAuditions = input.status !== "all"
        ? auditions.filter(a => a.status === input.status)
        : auditions;

      // Get project info for each audition
      const result = await Promise.all(
        filteredAuditions.map(async (audition) => {
          let project = null;
          if (audition.projectId && audition.projectId > 0) {
            const [contract] = await db
              .select()
              .from(contracts)
              .where(eq(contracts.id, audition.projectId));
            if (contract) {
              project = { id: contract.id, title: contract.projectTitle };
            }
          }
          return { audition, project, role: null };
        })
      );

      return result;
    }),

  /**
   * Respond to audition invitation
   */
  respondToInvitation: protectedProcedure
    .input(z.object({
      invitationId: z.number(),
      response: z.enum(["accepted", "declined"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      // Get invitation
      const [invitation] = await db
        .select()
        .from(auditionInvitations)
        .where(eq(auditionInvitations.id, input.invitationId));

      if (!invitation) {
        throw new Error("Invitation not found");
      }

      if (invitation.actorId !== userId) {
        throw new Error("This invitation is not for you");
      }

      if (invitation.status !== "pending") {
        throw new Error("This invitation has already been responded to");
      }

      // Update invitation
      await db
        .update(auditionInvitations)
        .set({
          status: input.response,
          respondedAt: new Date(),
        })
        .where(eq(auditionInvitations.id, input.invitationId));

      // If declined, update audition status
      if (input.response === "declined") {
        await db
          .update(videoAuditions)
          .set({ status: "cancelled" })
          .where(eq(videoAuditions.id, invitation.auditionId));
      }

      // Notify producer
      const [audition] = await db
        .select()
        .from(videoAuditions)
        .where(eq(videoAuditions.id, invitation.auditionId));

      if (audition) {
        const [producer] = await db
          .select()
          .from(users)
          .where(eq(users.id, audition.producerId));

        const [actor] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId));

        if (producer?.pushToken) {
          const message = input.response === "accepted"
            ? `${actor?.name || "An actor"} accepted your audition invitation! 🎉`
            : `${actor?.name || "An actor"} declined your audition invitation.`;

          await sendPushNotificationToUser(
            producer.pushToken,
            "Audition Response",
            message,
            { type: "audition_response", auditionId: audition.id }
          );
        }
      }

      return { success: true };
    }),

  /**
   * Join an audition call
   */
  joinAudition: protectedProcedure
    .input(z.object({ auditionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      const [audition] = await db
        .select()
        .from(videoAuditions)
        .where(eq(videoAuditions.id, input.auditionId));

      if (!audition) {
        throw new Error("Audition not found");
      }

      // Verify user is participant
      if (audition.producerId !== userId && audition.actorId !== userId) {
        throw new Error("You don't have access to this audition");
      }

      // Update audition status if first to join
      if (audition.status === "scheduled") {
        await db
          .update(videoAuditions)
          .set({
            status: "in_progress",
            startedAt: new Date(),
          })
          .where(eq(videoAuditions.id, input.auditionId));
      }

      // Record participant join
      await db.insert(auditionParticipants).values({
        auditionId: input.auditionId,
        userId,
        role: audition.producerId === userId ? "producer" : "actor",
        joinedAt: new Date(),
      });

      return {
        roomUrl: audition.roomUrl,
        roomName: audition.roomName,
      };
    }),

  /**
   * Leave/end an audition call
   */
  leaveAudition: protectedProcedure
    .input(z.object({ auditionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      // Update participant record
      const [participant] = await db
        .select()
        .from(auditionParticipants)
        .where(
          and(
            eq(auditionParticipants.auditionId, input.auditionId),
            eq(auditionParticipants.userId, userId)
          )
        )
        .orderBy(desc(auditionParticipants.joinedAt))
        .limit(1);

      if (participant && !participant.leftAt) {
        const duration = participant.joinedAt
          ? Math.floor((Date.now() - participant.joinedAt.getTime()) / 1000)
          : 0;

        await db
          .update(auditionParticipants)
          .set({
            leftAt: new Date(),
            durationSeconds: duration,
          })
          .where(eq(auditionParticipants.id, participant.id));
      }

      return { success: true };
    }),

  /**
   * End audition (producer only)
   */
  endAudition: protectedProcedure
    .input(z.object({
      auditionId: z.number(),
      rating: z.number().min(1).max(5).optional(),
      feedback: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      const [audition] = await db
        .select()
        .from(videoAuditions)
        .where(eq(videoAuditions.id, input.auditionId));

      if (!audition) {
        throw new Error("Audition not found");
      }

      if (audition.producerId !== userId) {
        throw new Error("Only the producer can end the audition");
      }

      // Check for recording if enabled
      let recordingUrl = null;
      if (audition.recordingEnabled && DAILY_API_KEY) {
        try {
          const recording = await getDailyRecording(audition.roomName);
          recordingUrl = recording?.download_link || null;
        } catch (error) {
          console.error("Failed to get recording:", error);
        }
      }

      // Update audition
      await db
        .update(videoAuditions)
        .set({
          status: "completed",
          endedAt: new Date(),
          rating: input.rating,
          feedback: input.feedback,
          recordingUrl,
        })
        .where(eq(videoAuditions.id, input.auditionId));

      // Clean up Daily room
      if (DAILY_API_KEY) {
        try {
          await deleteDailyRoom(audition.roomName);
        } catch (error) {
          console.error("Failed to delete Daily room:", error);
        }
      }

      return { success: true, recordingUrl };
    }),

  /**
   * Cancel an audition
   */
  cancelAudition: protectedProcedure
    .input(z.object({
      auditionId: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      const [audition] = await db
        .select()
        .from(videoAuditions)
        .where(eq(videoAuditions.id, input.auditionId));

      if (!audition) {
        throw new Error("Audition not found");
      }

      // Only producer or actor can cancel
      if (audition.producerId !== userId && audition.actorId !== userId) {
        throw new Error("You don't have permission to cancel this audition");
      }

      if (audition.status !== "scheduled") {
        throw new Error("Can only cancel scheduled auditions");
      }

      await db
        .update(videoAuditions)
        .set({
          status: "cancelled",
          notes: input.reason ? `Cancelled: ${input.reason}` : audition.notes,
        })
        .where(eq(videoAuditions.id, input.auditionId));

      // Notify the other party
      const otherUserId = audition.producerId === userId ? audition.actorId : audition.producerId;
      const [otherUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, otherUserId));

      if (otherUser?.pushToken) {
        await sendPushNotificationToUser(
          otherUser.pushToken,
          "Audition Cancelled",
          input.reason || "An audition has been cancelled.",
          { type: "audition_cancelled", auditionId: audition.id }
        );
      }

      // Clean up Daily room
      if (DAILY_API_KEY) {
        try {
          await deleteDailyRoom(audition.roomName);
        } catch (error) {
          console.error("Failed to delete Daily room:", error);
        }
      }

      return { success: true };
    }),

  /**
   * Get pending invitations for current actor
   */
  getMyInvitations: protectedProcedure
    .query(async ({ ctx }) => {
      const db = getDb();
      const userId = ctx.user.id;

      const invitations = await db
        .select({
          invitation: auditionInvitations,
          audition: videoAuditions,
        })
        .from(auditionInvitations)
        .innerJoin(videoAuditions, eq(auditionInvitations.auditionId, videoAuditions.id))
        .where(
          and(
            eq(auditionInvitations.actorId, userId),
            eq(auditionInvitations.status, "pending")
          )
        )
        .orderBy(desc(auditionInvitations.sentAt));

      // Get project and producer info for each invitation
      const result = await Promise.all(
        invitations.map(async (inv) => {
          let project = null;
          if (inv.audition.projectId && inv.audition.projectId > 0) {
            const [contract] = await db
              .select()
              .from(contracts)
              .where(eq(contracts.id, inv.audition.projectId));
            if (contract) {
              project = { id: contract.id, title: contract.projectTitle };
            }
          }

          const [producer] = await db
            .select()
            .from(users)
            .where(eq(users.id, inv.audition.producerId));

          return {
            invitation: inv.invitation,
            audition: inv.audition,
            project,
            producer,
          };
        })
      );

      return result;
    }),
});
