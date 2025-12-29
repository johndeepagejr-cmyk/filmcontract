import { getDb } from "./db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

interface EmailNotification {
  to: string;
  subject: string;
  body: string;
}

/**
 * Send email notification to a user
 * Note: This is a simplified implementation that logs emails
 * In production, integrate with an email service like SendGrid, Mailgun, or AWS SES
 */
export async function sendEmail({ to, subject, body }: EmailNotification) {
  // For now, we'll log the email instead of actually sending it
  // This allows the app to work without requiring external email service setup
  console.log("=== EMAIL NOTIFICATION ===");
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body:\n${body}`);
  console.log("========================");
  
  // TODO: Integrate with actual email service
  // Example with SendGrid:
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // await sgMail.send({ to, from: 'noreply@filmcontract.com', subject, text: body });
  
  return { success: true, logged: true };
}

/**
 * Send contract created notification to actor
 */
export async function notifyContractCreated(actorId: number, contractDetails: {
  projectTitle: string;
  producerName: string;
  startDate?: Date | null;
  endDate?: Date | null;
  paymentAmount?: string;
}) {
  const db = await getDb();
  if (!db) return;
  const actor = await db.select().from(users).where(eq(users.id, actorId)).limit(1);
  
  if (!actor[0]?.email) {
    console.error("Actor email not found");
    return;
  }
  
  const subject = `New Contract: ${contractDetails.projectTitle}`;
  const body = `
Hello,

You have been invited to a new contract for "${contractDetails.projectTitle}" by ${contractDetails.producerName}.

Contract Details:
- Project: ${contractDetails.projectTitle}
- Producer: ${contractDetails.producerName}
${contractDetails.startDate ? `- Start Date: ${contractDetails.startDate.toLocaleDateString()}` : ""}
${contractDetails.endDate ? `- End Date: ${contractDetails.endDate.toLocaleDateString()}` : ""}
${contractDetails.paymentAmount ? `- Payment: $${contractDetails.paymentAmount}` : ""}

Please sign in to FilmContract to review and accept this contract.

Best regards,
FilmContract Team
  `.trim();
  
  return sendEmail({ to: actor[0].email, subject, body });
}

/**
 * Send contract signed notification
 */
export async function notifyContractSigned(userId: number, contractDetails: {
  projectTitle: string;
  signerName: string;
  signerRole: "producer" | "actor";
}) {
  const db = await getDb();
  if (!db) return;
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  
  if (!user[0]?.email) {
    console.error("User email not found");
    return;
  }
  
  const subject = `Contract Signed: ${contractDetails.projectTitle}`;
  const body = `
Hello,

The contract for "${contractDetails.projectTitle}" has been signed by ${contractDetails.signerName} (${contractDetails.signerRole}).

${contractDetails.signerRole === "actor" ? "The contract is now fully executed and active." : "Waiting for the actor to sign."}

Sign in to FilmContract to view the signed contract.

Best regards,
FilmContract Team
  `.trim();
  
  return sendEmail({ to: user[0].email, subject, body });
}

/**
 * Send payment received notification to producer
 */
export async function notifyPaymentReceived(producerId: number, contractDetails: {
  projectTitle: string;
  actorName: string;
  amount: string;
}) {
  const db = await getDb();
  if (!db) return;
  const producer = await db.select().from(users).where(eq(users.id, producerId)).limit(1);
  
  if (!producer[0]?.email) {
    console.error("Producer email not found");
    return;
  }
  
  const subject = `Payment Received: ${contractDetails.projectTitle}`;
  const body = `
Hello,

You have received a payment of $${contractDetails.amount} from ${contractDetails.actorName} for the contract "${contractDetails.projectTitle}".

Sign in to FilmContract to view payment details.

Best regards,
FilmContract Team
  `.trim();
  
  return sendEmail({ to: producer[0].email, subject, body });
}

/**
 * Send contract status changed notification
 */
export async function notifyStatusChanged(userId: number, contractDetails: {
  projectTitle: string;
  oldStatus: string;
  newStatus: string;
}) {
  const db = await getDb();
  if (!db) return;
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  
  if (!user[0]?.email) {
    console.error("User email not found");
    return;
  }
  
  const subject = `Contract Status Updated: ${contractDetails.projectTitle}`;
  const body = `
Hello,

The status of your contract "${contractDetails.projectTitle}" has been updated from "${contractDetails.oldStatus}" to "${contractDetails.newStatus}".

Sign in to FilmContract to view details.

Best regards,
FilmContract Team
  `.trim();
  
  return sendEmail({ to: user[0].email, subject, body });
}
