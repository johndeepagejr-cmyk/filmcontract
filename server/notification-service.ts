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
