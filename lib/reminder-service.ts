import { sendLocalNotification } from "./notifications";

export type ReminderType = "end_date" | "payment_due" | "pending_approval";

export interface CreateReminderParams {
  contractId: number;
  userId: number;
  reminderType: ReminderType;
  reminderDate: Date;
  message: string;
}

/**
 * Calculate reminder date based on contract dates
 */
export function calculateReminderDate(targetDate: Date, daysBefore: number = 7): Date {
  const reminderDate = new Date(targetDate);
  reminderDate.setDate(reminderDate.getDate() - daysBefore);
  return reminderDate;
}

/**
 * Generate reminder message based on type
 */
export function generateReminderMessage(
  reminderType: ReminderType,
  contractTitle: string,
  date?: Date
): string {
  switch (reminderType) {
    case "end_date":
      return `Contract "${contractTitle}" ends on ${date?.toLocaleDateString()}. Consider renewal or closeout.`;
    case "payment_due":
      return `Payment due for contract "${contractTitle}" on ${date?.toLocaleDateString()}.`;
    case "pending_approval":
      return `Contract "${contractTitle}" is pending your approval. Review and respond.`;
    default:
      return `Reminder for contract "${contractTitle}"`;
  }
}

/**
 * Check if a reminder should be sent
 */
export function shouldSendReminder(reminderDate: Date): boolean {
  const now = new Date();
  const reminderTime = new Date(reminderDate);
  
  // Send if reminder date is today or in the past
  return reminderTime <= now;
}

/**
 * Send reminder notification
 */
export async function sendReminderNotification(
  userId: number,
  title: string,
  message: string,
  contractId: number
) {
  await sendLocalNotification({
    title,
    body: message,
    data: {
      type: "contract_reminder",
      contractId: contractId.toString(),
    },
  });
}
