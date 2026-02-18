import { getDb } from "./db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

interface PushNotification {
  to: string; // Push token
  title: string;
  body: string;
  data?: Record<string, any>;
}

/**
 * Send push notification using Expo Push Notification service
 */
async function sendPushNotification(notification: PushNotification) {
  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(notification),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Failed to send push notification:", error);
    return null;
  }
}

/**
 * Get user's push token from database
 */
async function getUserPushToken(userId: number): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;

  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return user[0]?.pushToken || null;
}

/**
 * Notify actor when a new contract is created
 */
export async function notifyContractCreated(actorId: number, producerName: string, projectTitle: string) {
  const pushToken = await getUserPushToken(actorId);
  if (!pushToken) return;

  await sendPushNotification({
    to: pushToken,
    title: "New Contract Received",
    body: `${producerName} sent you a contract for "${projectTitle}"`,
    data: { type: "contract_created", actorId, projectTitle },
  });
}

/**
 * Notify producer when actor signs the contract
 */
export async function notifyContractSigned(producerId: number, actorName: string, projectTitle: string) {
  const pushToken = await getUserPushToken(producerId);
  if (!pushToken) return;

  await sendPushNotification({
    to: pushToken,
    title: "Contract Signed",
    body: `${actorName} signed the contract for "${projectTitle}"`,
    data: { type: "contract_signed", producerId, projectTitle },
  });
}

/**
 * Notify actor when payment is released
 */
export async function notifyPaymentReleased(actorId: number, amount: string, projectTitle: string) {
  const pushToken = await getUserPushToken(actorId);
  if (!pushToken) return;

  await sendPushNotification({
    to: pushToken,
    title: "Payment Received",
    body: `You received $${amount} for "${projectTitle}"`,
    data: { type: "payment_released", actorId, amount, projectTitle },
  });
}

/**
 * Notify user when contract status changes
 */
export async function notifyContractStatusChange(
  userId: number,
  projectTitle: string,
  oldStatus: string,
  newStatus: string
) {
  const pushToken = await getUserPushToken(userId);
  if (!pushToken) return;

  await sendPushNotification({
    to: pushToken,
    title: "Contract Status Updated",
    body: `"${projectTitle}" status changed from ${oldStatus} to ${newStatus}`,
    data: { type: "status_change", userId, projectTitle, oldStatus, newStatus },
  });
}

/**
 * Save user's push token to database
 */
export async function savePushToken(userId: number, pushToken: string) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.update(users).set({ pushToken }).where(eq(users.id, userId));
    return true;
  } catch (error) {
    console.error("Failed to save push token:", error);
    return false;
  }
}

/**
 * Notify user when they receive a new message
 */
export async function notifyNewMessage(recipientId: number, senderName: string, messagePreview: string) {
  const pushToken = await getUserPushToken(recipientId);
  if (!pushToken) return;

  await sendPushNotification({
    to: pushToken,
    title: "New Message",
    body: `${senderName}: ${messagePreview.substring(0, 100)}${messagePreview.length > 100 ? '...' : ''}`,
    data: { type: "new_message", recipientId, senderName },
  });
}

// ─── Escrow Notifications ─────────────────────────────────────

export async function notifyEscrowFunded(actorId: number, amount: string, projectTitle: string) {
  const pushToken = await getUserPushToken(actorId);
  await createInAppNotification(actorId, "escrow_funded", "Payment Secured",
    `$${amount} has been deposited in escrow for "${projectTitle}"`,
    { amount, projectTitle });
  if (!pushToken) return;
  await sendPushNotification({
    to: pushToken,
    title: "Payment Secured in Escrow",
    body: `$${amount} deposited for "${projectTitle}"`,
    data: { type: "escrow_funded", amount, projectTitle },
  });
}

export async function notifyEscrowReleased(actorId: number, amount: string, projectTitle: string) {
  const pushToken = await getUserPushToken(actorId);
  await createInAppNotification(actorId, "escrow_released", "Payment Released",
    `$${amount} has been released to you for "${projectTitle}"`,
    { amount, projectTitle });
  if (!pushToken) return;
  await sendPushNotification({
    to: pushToken,
    title: "Payment Released!",
    body: `$${amount} released for "${projectTitle}"`,
    data: { type: "escrow_released", amount, projectTitle },
  });
}

export async function notifyEscrowDisputed(userId: number, amount: string, projectTitle: string, reason: string) {
  const pushToken = await getUserPushToken(userId);
  await createInAppNotification(userId, "escrow_disputed", "Payment Disputed",
    `A dispute has been raised on $${amount} for "${projectTitle}": ${reason.substring(0, 80)}`,
    { amount, projectTitle, reason });
  if (!pushToken) return;
  await sendPushNotification({
    to: pushToken,
    title: "Escrow Disputed",
    body: `Dispute on $${amount} for "${projectTitle}"`,
    data: { type: "escrow_disputed", amount, projectTitle },
  });
}

// ─── Casting/Submission Notifications ─────────────────────────

export async function notifySubmissionStatus(
  actorId: number, castingTitle: string, status: string, producerNote?: string
) {
  const statusLabels: Record<string, string> = {
    reviewed: "Your submission is being reviewed",
    shortlisted: "You've been shortlisted!",
    callback: "You've been called back!",
    hired: "Congratulations, you've been hired!",
    passed: "The production has moved forward with other talent",
  };
  const body = statusLabels[status] || `Status updated to ${status}`;
  const fullBody = producerNote ? `${body} — "${producerNote.substring(0, 60)}"` : body;

  await createInAppNotification(actorId, "submission_status", `Casting: ${castingTitle}`,
    fullBody, { castingTitle, status, producerNote });

  const pushToken = await getUserPushToken(actorId);
  if (!pushToken) return;
  await sendPushNotification({
    to: pushToken,
    title: status === "hired" ? "You're Hired!" : `Casting Update: ${castingTitle}`,
    body: fullBody,
    data: { type: "submission_status", castingTitle, status },
  });
}

export async function notifyNewSubmission(producerId: number, actorName: string, castingTitle: string) {
  await createInAppNotification(producerId, "new_submission", "New Submission",
    `${actorName} submitted a self-tape for "${castingTitle}"`,
    { actorName, castingTitle });

  const pushToken = await getUserPushToken(producerId);
  if (!pushToken) return;
  await sendPushNotification({
    to: pushToken,
    title: "New Self-Tape Submission",
    body: `${actorName} applied for "${castingTitle}"`,
    data: { type: "new_submission", actorName, castingTitle },
  });
}

// ─── In-App Notification Helper ───────────────────────────────

async function createInAppNotification(
  userId: number, type: string, title: string, body: string, data?: Record<string, any>
) {
  try {
    const db = await getDb();
    if (!db) return;
    const { notifications } = await import("@/drizzle/schema");
    await db.insert(notifications).values({
      userId,
      type,
      title,
      body,
      data: data ? JSON.stringify(data) : null,
    });
  } catch (error) {
    console.error("Failed to create in-app notification:", error);
  }
}
