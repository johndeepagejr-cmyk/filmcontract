import { getDb } from "./db.js";
import { contracts, users } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";

interface PaymentReceiptData {
  contractId: number;
  paymentAmount: string;
  paymentDate: Date;
  actorName: string;
  actorEmail: string;
  producerName: string;
  projectTitle: string;
  paymentMethod: string;
}

/**
 * Generate a payment receipt as a formatted text string
 * In production, this could generate a PDF using a library like pdfkit
 */
export function generatePaymentReceipt(data: PaymentReceiptData): string {
  const receiptDate = new Date(data.paymentDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const receiptTime = new Date(data.paymentDate).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `
═══════════════════════════════════════════════════════════
                    PAYMENT RECEIPT
                     FilmContract
═══════════════════════════════════════════════════════════

Receipt Date: ${receiptDate} at ${receiptTime}
Contract ID: #${data.contractId}

───────────────────────────────────────────────────────────
PAYMENT DETAILS
───────────────────────────────────────────────────────────

Project:          ${data.projectTitle}
Amount Paid:      $${parseFloat(data.paymentAmount).toFixed(2)} USD
Payment Method:   ${data.paymentMethod}
Payment Status:   COMPLETED

───────────────────────────────────────────────────────────
PARTIES
───────────────────────────────────────────────────────────

Producer:         ${data.producerName}
Actor:            ${data.actorName}
Actor Email:      ${data.actorEmail}

───────────────────────────────────────────────────────────
NOTES
───────────────────────────────────────────────────────────

This receipt confirms payment for services rendered under
the contract agreement for "${data.projectTitle}".

This document serves as proof of payment and should be
retained for tax and accounting purposes.

───────────────────────────────────────────────────────────

Thank you for using FilmContract!

For questions or support, please contact:
support@filmcontract.com

═══════════════════════════════════════════════════════════
  `.trim();
}

/**
 * Send payment receipt email to actor and confirmation to producer
 */
export async function sendPaymentReceiptEmail(
  contractId: number,
  paymentAmount: string,
  paymentMethod: string = "Credit Card"
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("Database not available for receipt email");
    return;
  }

  // Get contract details
  const contractResult = await db.select().from(contracts).where(eq(contracts.id, contractId)).limit(1);
  const contract = contractResult[0];

  if (!contract) {
    console.error("Contract not found for receipt email");
    return;
  }

  // Get producer and actor details
  const producerResult = await db.select().from(users).where(eq(users.id, contract.producerId)).limit(1);
  const actorResult = await db.select().from(users).where(eq(users.id, contract.actorId)).limit(1);
  
  const producer = producerResult[0];
  const actor = actorResult[0];

  if (!actor || !producer) {
    console.error("Contract parties not found for receipt email");
    return;
  }

  const receiptData: PaymentReceiptData = {
    contractId,
    paymentAmount,
    paymentDate: new Date(),
    actorName: actor.name || "Actor",
    actorEmail: actor.email || "",
    producerName: producer.name || "Producer",
    projectTitle: contract.projectTitle,
    paymentMethod,
  };

  const receiptText = generatePaymentReceipt(receiptData);

  // Send receipt to actor
  console.log("\n📧 Sending payment receipt email to actor:");
  console.log("─".repeat(60));
  console.log(`To: ${actor.email}`);
  console.log(`Subject: Payment Receipt - ${contract.projectTitle}`);
  console.log("─".repeat(60));
  console.log(receiptText);
  console.log("─".repeat(60));

  // Send confirmation to producer
  console.log("\n📧 Sending payment confirmation email to producer:");
  console.log("─".repeat(60));
  console.log(`To: ${producer.email}`);
  console.log(`Subject: Payment Received - ${contract.projectTitle}`);
  console.log("─".repeat(60));
  console.log(`
Payment Received Notification
════════════════════════════════════════════════════════

Hi ${producer.name},

Great news! You've received a payment for your contract.

Contract: ${contract.projectTitle}
Actor: ${actor.name}
Amount: $${parseFloat(paymentAmount).toFixed(2)} USD
Date: ${new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })}

The payment has been processed successfully and will be
deposited into your account according to your payment
processor's schedule.

View contract details: [Link to contract #${contractId}]

Thank you for using FilmContract!

Best regards,
The FilmContract Team
  `.trim());
  console.log("─".repeat(60));

  // In production, integrate with an email service like SendGrid or Mailgun:
  // await sendEmail({
  //   to: contract.actor.email,
  //   subject: `Payment Receipt - ${contract.projectTitle}`,
  //   text: receiptText,
  //   attachments: [{ filename: `receipt-${contractId}.pdf`, content: pdfBuffer }]
  // });
}
