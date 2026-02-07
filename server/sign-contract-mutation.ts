/**
 * Updated signContract mutation with HelloSign integration
 * This replaces the old base64 signature method with legally binding e-signatures
 * 
 * Author: John Dee Page Jr
 * Created for FilmContract - Professional Film Contract Management
 */

import { protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { contracts } from "@/drizzle/schema";
import { getDb } from "./db";
import { eq } from "drizzle-orm";
import { getHelloSignService } from "./hellosign-service";
import { notifyContractSigned } from "./email-service";

/**
 * Updated signContract mutation
 * Sends contract to HelloSign for legally binding e-signatures
 */
export const signContractMutation = protectedProcedure
  .input(
    z.object({
      contractId: z.number(),
      role: z.enum(["producer", "actor"]),
      useHelloSign: z.boolean().default(true),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const contract = await db.getContractById(input.contractId);
    if (!contract) {
      throw new Error("Contract not found");
    }

    // Verify user is authorized to sign
    if (input.role === "producer" && contract.producerId !== ctx.user.id) {
      throw new Error("Only the producer can sign as producer");
    }
    if (input.role === "actor" && contract.actorId !== ctx.user.id) {
      throw new Error("Only the actor can sign as actor");
    }

    // Get user details for HelloSign
    const user = await db.getUserById(ctx.user.id);
    if (!user) {
      throw new Error("User not found");
    }

    // If using HelloSign (legally binding)
    if (input.useHelloSign) {
      try {
        const helloSign = getHelloSignService();

        // Get producer and actor info
        const producer = await db.getUserById(contract.producerId);
        const actor = await db.getUserById(contract.actorId);

        if (!producer || !actor) {
          throw new Error("Producer or actor not found");
        }

        // Check if signature request already exists
        if (!contract.hellosignSignatureId) {
          // Create a new signature request
          const signatureRequest = await helloSign.sendSignatureRequest({
            title: `Contract: ${contract.projectTitle}`,
            subject: `Please sign the contract for ${contract.projectTitle}`,
            message: `This is a legally binding contract. Please review and sign.`,
            signers: [
              {
                email: producer.email || "",
                name: producer.name || "Producer",
                order: 1,
              },
              {
                email: actor.email || "",
                name: actor.name || "Actor",
                order: 2,
              },
            ],
            fileUrls: [
              // In production, generate PDF and upload to S3, then pass URL here
              // For now, we'll use a placeholder
              `${process.env.API_URL || "http://localhost:3000"}/api/contracts/${contract.id}/pdf`,
            ],
            metadata: {
              contractId: contract.id.toString(),
              projectTitle: contract.projectTitle,
              producerId: contract.producerId.toString(),
              actorId: contract.actorId.toString(),
            },
          });

          // Store HelloSign signature ID in database
          const database = await getDb();
          if (!database) throw new Error("Database not available");

          await database
            .update(contracts)
            .set({
              hellosignSignatureId: signatureRequest.signature_request_id,
              hellosignRequestId: signatureRequest.signature_request_id,
              signatureStatus: "pending",
              updatedAt: new Date(),
            })
            .where(eq(contracts.id, contract.id));

          // Add history event
          await db.addContractHistory(
            contract.id,
            ctx.user.id,
            "status_changed",
            `Signature request sent via HelloSign to ${actor.email}`
          );

          // Send notifications
          try {
            await notifyContractSigned(actor.id, {
              projectTitle: contract.projectTitle,
              producerName: producer.name || "Unknown Producer",
              signingUrl: signatureRequest.signature_request_url,
            });
          } catch (error) {
            console.error("Failed to send notification:", error);
          }

          return {
            success: true,
            signingUrl: signatureRequest.signature_request_url,
            message:
              "Signature request sent. Please check your email to sign the contract.",
          };
        } else {
          // Signature request already exists, get status
          const status = await helloSign.getSignatureStatus(
            contract.hellosignSignatureId
          );
          return {
            success: true,
            status: status.status,
            message: `Signature request status: ${status.status}`,
          };
        }
      } catch (error) {
        console.error("HelloSign error:", error);
        throw new Error(
          `Failed to send signature request: ${(error as any).message}`
        );
      }
    } else {
      // Fallback to old base64 signature method (not legally binding)
      return {
        success: false,
        message: "HelloSign is required for legally binding signatures",
      };
    }
  });
