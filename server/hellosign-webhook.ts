/**
 * HelloSign Webhook Handler
 * Listens for signature completion events and updates contract status
 * 
 * Author: John Dee Page Jr
 * Created for FilmContract - Professional Film Contract Management
 */

import { Request, Response } from "express";
import { getHelloSignService } from "./hellosign-service";
import * as db from "./db";
import { contracts } from "@/drizzle/schema";
import { getDb } from "./db";
import { eq } from "drizzle-orm";
import {
  notifyContractSigned,
  notifyStatusChanged,
} from "./email-service";

/**
 * Handle HelloSign webhook events
 * Called when signature requests are completed, declined, or expire
 */
export async function handleHelloSignWebhook(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Get webhook secret from environment
    const webhookSecret = process.env.HELLOSIGN_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("HELLOSIGN_WEBHOOK_SECRET not configured");
      res.status(500).json({ error: "Webhook secret not configured" });
      return;
    }

    // Verify webhook signature
    const eventData = JSON.stringify(req.body);
    const signature = req.headers["x-hellosign-signature"] as string;

    const helloSign = getHelloSignService();
    const isValid = helloSign.verifyWebhookSignature(
      eventData,
      signature,
      webhookSecret
    );

    if (!isValid) {
      console.warn("Invalid HelloSign webhook signature");
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    // Parse webhook event
    const event = helloSign.parseWebhookEvent(req.body);
    console.log("HelloSign webhook event:", event);

    // Handle different event types
    switch (event.eventType) {
      case "signature_request_signed":
        await handleSignatureComplete(event.signatureRequestId);
        break;

      case "signature_request_declined":
        await handleSignatureDeclined(event.signatureRequestId);
        break;

      case "signature_request_all_signed":
        await handleAllSigned(event.signatureRequestId);
        break;

      case "signature_request_expired":
        await handleSignatureExpired(event.signatureRequestId);
        break;

      default:
        console.log("Unhandled event type:", event.eventType);
    }

    // Return 200 OK to acknowledge receipt
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error handling HelloSign webhook:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Handle signature completion event
 * Called when a party signs the contract
 */
async function handleSignatureComplete(
  signatureRequestId: string
): Promise<void> {
  try {
    const database = await getDb();
    if (!database) {
      throw new Error("Database not available");
    }

    // Find contract by HelloSign signature ID
    const contractList = await database
      .select()
      .from(contracts)
      .where(eq(contracts.hellosignSignatureId, signatureRequestId));

    if (contractList.length === 0) {
      console.warn(`Contract not found for signature request: ${signatureRequestId}`);
      return;
    }

    const contract = contractList[0];

    // Get signature status from HelloSign
    const helloSign = getHelloSignService();
    const status = await helloSign.getSignatureStatus(signatureRequestId);

    // Update contract with latest signature status
    await database
      .update(contracts)
      .set({
        signatureStatus: status.status as any,
        updatedAt: new Date(),
      })
      .where(eq(contracts.id, contract.id));

    // Add history event
    await db.addContractHistory(
      contract.id,
      contract.producerId,
      "status_changed",
      `Signature received. Status: ${status.status}`
    );

    console.log(
      `Contract ${contract.id} signature status updated: ${status.status}`
    );
  } catch (error) {
    console.error("Error handling signature complete:", error);
  }
}

/**
 * Handle all signatures complete event
 * Called when all parties have signed the contract
 */
async function handleAllSigned(signatureRequestId: string): Promise<void> {
  try {
    const database = await getDb();
    if (!database) {
      throw new Error("Database not available");
    }

    // Find contract by HelloSign signature ID
    const contractList = await database
      .select()
      .from(contracts)
      .where(eq(contracts.hellosignSignatureId, signatureRequestId));

    if (contractList.length === 0) {
      console.warn(`Contract not found for signature request: ${signatureRequestId}`);
      return;
    }

    const contract = contractList[0];

    // Get the signed document
    const helloSign = getHelloSignService();
    const signedDocUrl = await helloSign.getSignedDocument(signatureRequestId);

    // Update contract status to "active" (fully signed)
    await database
      .update(contracts)
      .set({
        status: "active",
        signatureStatus: "signed",
        signedDocumentUrl: signedDocUrl,
        fullySignedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(contracts.id, contract.id));

    // Add history event
    await db.addContractHistory(
      contract.id,
      contract.producerId,
      "status_changed",
      "Contract fully signed by all parties and is now active"
    );

    // Get user details for notifications
    const producer = await db.getUserById(contract.producerId);
    const actor = await db.getUserById(contract.actorId);

    // Send notifications to both parties
    try {
      if (producer) {
        await notifyStatusChanged(producer.id, {
          projectTitle: contract.projectTitle,
          status: "active",
          message: "Contract has been fully signed and is now active",
        });
      }

      if (actor) {
        await notifyStatusChanged(actor.id, {
          projectTitle: contract.projectTitle,
          status: "active",
          message: "Contract has been fully signed and is now active",
        });
      }
    } catch (error) {
      console.error("Error sending notifications:", error);
    }

    console.log(`Contract ${contract.id} fully signed and activated`);
  } catch (error) {
    console.error("Error handling all signed:", error);
  }
}

/**
 * Handle signature declined event
 * Called when a party declines to sign
 */
async function handleSignatureDeclined(
  signatureRequestId: string
): Promise<void> {
  try {
    const database = await getDb();
    if (!database) {
      throw new Error("Database not available");
    }

    // Find contract by HelloSign signature ID
    const contractList = await database
      .select()
      .from(contracts)
      .where(eq(contracts.hellosignSignatureId, signatureRequestId));

    if (contractList.length === 0) {
      console.warn(`Contract not found for signature request: ${signatureRequestId}`);
      return;
    }

    const contract = contractList[0];

    // Update contract status
    await database
      .update(contracts)
      .set({
        signatureStatus: "declined",
        updatedAt: new Date(),
      })
      .where(eq(contracts.id, contract.id));

    // Add history event
    await db.addContractHistory(
      contract.id,
      contract.producerId,
      "status_changed",
      "Contract signature declined by one or more parties"
    );

    // Get user details for notifications
    const producer = await db.getUserById(contract.producerId);
    const actor = await db.getUserById(contract.actorId);

    // Send notifications
    try {
      if (producer) {
        await notifyStatusChanged(producer.id, {
          projectTitle: contract.projectTitle,
          status: "declined",
          message: "Contract signature was declined",
        });
      }

      if (actor) {
        await notifyStatusChanged(actor.id, {
          projectTitle: contract.projectTitle,
          status: "declined",
          message: "Contract signature was declined",
        });
      }
    } catch (error) {
      console.error("Error sending notifications:", error);
    }

    console.log(`Contract ${contract.id} signature declined`);
  } catch (error) {
    console.error("Error handling signature declined:", error);
  }
}

/**
 * Handle signature expired event
 * Called when signature request expires without being signed
 */
async function handleSignatureExpired(
  signatureRequestId: string
): Promise<void> {
  try {
    const database = await getDb();
    if (!database) {
      throw new Error("Database not available");
    }

    // Find contract by HelloSign signature ID
    const contractList = await database
      .select()
      .from(contracts)
      .where(eq(contracts.hellosignSignatureId, signatureRequestId));

    if (contractList.length === 0) {
      console.warn(`Contract not found for signature request: ${signatureRequestId}`);
      return;
    }

    const contract = contractList[0];

    // Update contract status
    await database
      .update(contracts)
      .set({
        signatureStatus: "expired",
        updatedAt: new Date(),
      })
      .where(eq(contracts.id, contract.id));

    // Add history event
    await db.addContractHistory(
      contract.id,
      contract.producerId,
      "status_changed",
      "Contract signature request expired"
    );

    // Get user details for notifications
    const producer = await db.getUserById(contract.producerId);
    const actor = await db.getUserById(contract.actorId);

    // Send notifications
    try {
      if (producer) {
        await notifyStatusChanged(producer.id, {
          projectTitle: contract.projectTitle,
          status: "expired",
          message: "Contract signature request has expired",
        });
      }

      if (actor) {
        await notifyStatusChanged(actor.id, {
          projectTitle: contract.projectTitle,
          status: "expired",
          message: "Contract signature request has expired",
        });
      }
    } catch (error) {
      console.error("Error sending notifications:", error);
    }

    console.log(`Contract ${contract.id} signature request expired`);
  } catch (error) {
    console.error("Error handling signature expired:", error);
  }
}
