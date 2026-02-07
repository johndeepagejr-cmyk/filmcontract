/**
 * HelloSign E-Signature Service
 * Handles all interactions with HelloSign API for legally binding e-signatures
 * 
 * Author: John Dee Page Jr
 * Created for FilmContract - Professional Film Contract Management
 */

import axios, { AxiosInstance } from "axios";

interface HelloSignConfig {
  apiKey: string;
  clientId?: string;
  testMode?: boolean;
}

interface SignatureRequest {
  title: string;
  subject: string;
  message: string;
  signers: Array<{
    email: string;
    name: string;
    order?: number;
  }>;
  files?: Buffer[];
  fileUrls?: string[];
  metadata?: Record<string, string>;
  customFields?: Array<{
    name: string;
    value: string;
  }>;
}

interface SignatureRequestResponse {
  signature_request_id: string;
  signature_request_url: string;
  signatures: Array<{
    signature_id: string;
    signer_email: string;
    signer_name: string;
    status: string;
  }>;
}

interface SignatureStatus {
  signature_request_id: string;
  status: "pending" | "signed" | "declined" | "expired";
  signatures: Array<{
    signature_id: string;
    signer_email: string;
    signer_name: string;
    status: string;
    signed_at?: number;
  }>;
}

export class HelloSignService {
  private client: AxiosInstance;
  private apiKey: string;
  private testMode: boolean;

  constructor(config: HelloSignConfig) {
    this.apiKey = config.apiKey;
    this.testMode = config.testMode ?? false;

    // Create axios instance with HelloSign API configuration
    this.client = axios.create({
      baseURL: "https://api.hellosign.com/v3",
      auth: {
        username: config.apiKey,
        password: "", // HelloSign uses API key as username, empty password
      },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error("HelloSign API Error:", {
          status: error.response?.status,
          message: error.response?.data?.error?.error_msg,
          details: error.response?.data,
        });
        throw error;
      }
    );
  }

  /**
   * Send a signature request to signers
   * This creates a legally binding signature request that must be signed by all parties
   */
  async sendSignatureRequest(
    request: SignatureRequest
  ): Promise<SignatureRequestResponse> {
    try {
      const formData = new URLSearchParams();

      // Add basic request info
      formData.append("title", request.title);
      formData.append("subject", request.subject);
      formData.append("message", request.message);
      formData.append("test_mode", this.testMode ? "1" : "0");

      // Add signers
      request.signers.forEach((signer, index) => {
        formData.append(`signers[${index}][email_address]`, signer.email);
        formData.append(`signers[${index}][name]`, signer.name);
        if (signer.order) {
          formData.append(`signers[${index}][order]`, signer.order.toString());
        }
      });

      // Add file URLs (we'll use URLs instead of uploading files)
      if (request.fileUrls && request.fileUrls.length > 0) {
        request.fileUrls.forEach((url, index) => {
          formData.append(`file_urls[${index}]`, url);
        });
      }

      // Add metadata for tracking
      if (request.metadata) {
        Object.entries(request.metadata).forEach(([key, value]) => {
          formData.append(`metadata[${key}]`, value);
        });
      }

      // Add custom fields if provided
      if (request.customFields && request.customFields.length > 0) {
        request.customFields.forEach((field, index) => {
          formData.append(
            `custom_fields[${index}][name]`,
            field.name
          );
          formData.append(
            `custom_fields[${index}][value]`,
            field.value
          );
        });
      }

      const response = await this.client.post(
        "/signature_request/send",
        formData
      );

      return {
        signature_request_id: response.data.signature_request.signature_request_id,
        signature_request_url: response.data.signature_request.signature_request_url,
        signatures: response.data.signature_request.signatures.map(
          (sig: any) => ({
            signature_id: sig.signature_id,
            signer_email: sig.signer_email_address,
            signer_name: sig.signer_name,
            status: sig.status,
          })
        ),
      };
    } catch (error) {
      console.error("Failed to send signature request:", error);
      throw new Error(
        `Failed to send signature request: ${
          (error as any).response?.data?.error?.error_msg || (error as any).message
        }`
      );
    }
  }

  /**
   * Get the current status of a signature request
   * Returns whether all parties have signed, declined, or if it's still pending
   */
  async getSignatureStatus(
    signatureRequestId: string
  ): Promise<SignatureStatus> {
    try {
      const response = await this.client.get(
        `/signature_request/${signatureRequestId}`
      );

      const data = response.data.signature_request;

      return {
        signature_request_id: data.signature_request_id,
        status: data.is_complete
          ? "signed"
          : data.has_error
          ? "declined"
          : "pending",
        signatures: data.signatures.map((sig: any) => ({
          signature_id: sig.signature_id,
          signer_email: sig.signer_email_address,
          signer_name: sig.signer_name,
          status: sig.status,
          signed_at: sig.signed_at,
        })),
      };
    } catch (error) {
      console.error("Failed to get signature status:", error);
      throw new Error(
        `Failed to get signature status: ${
          (error as any).response?.data?.error?.error_msg || (error as any).message
        }`
      );
    }
  }

  /**
   * Download the signed document
   * Returns the URL to download the fully signed PDF
   */
  async getSignedDocument(signatureRequestId: string): Promise<string> {
    try {
      const response = await this.client.get(
        `/signature_request/${signatureRequestId}/files`,
        {
          responseType: "arraybuffer",
        }
      );

      // The response is the PDF file as a buffer
      // In production, you'd upload this to S3 and return the URL
      // For now, we return a base64 encoded version
      const base64 = Buffer.from(response.data).toString("base64");
      return `data:application/pdf;base64,${base64}`;
    } catch (error) {
      console.error("Failed to download signed document:", error);
      throw new Error(
        `Failed to download signed document: ${
          (error as any).response?.data?.error?.error_msg || (error as any).message
        }`
      );
    }
  }

  /**
   * Cancel a signature request
   * Useful if you need to stop a pending signature request
   */
  async cancelSignatureRequest(signatureRequestId: string): Promise<boolean> {
    try {
      await this.client.post(
        `/signature_request/${signatureRequestId}/cancel`
      );
      return true;
    } catch (error) {
      console.error("Failed to cancel signature request:", error);
      throw new Error(
        `Failed to cancel signature request: ${
          (error as any).response?.data?.error?.error_msg || (error as any).message
        }`
      );
    }
  }

  /**
   * Verify webhook signature from HelloSign
   * This ensures webhook events are actually from HelloSign
   */
  verifyWebhookSignature(
    eventData: string,
    signature: string,
    webhookSecret: string
  ): boolean {
    const crypto = require("crypto");
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(eventData)
      .digest("hex");

    return signature === expectedSignature;
  }

  /**
   * Parse webhook event from HelloSign
   * Extracts the event type and data from webhook payload
   */
  parseWebhookEvent(payload: any): {
    eventType: string;
    signatureRequestId: string;
    status: string;
  } {
    return {
      eventType: payload.event?.type || "unknown",
      signatureRequestId:
        payload.signature_request?.signature_request_id || "",
      status: payload.signature_request?.is_complete ? "signed" : "pending",
    };
  }
}

// Initialize HelloSign service with API key from environment
export function initializeHelloSign(): HelloSignService {
  const apiKey = process.env.HELLOSIGN_API_KEY;
  if (!apiKey) {
    throw new Error(
      "HELLOSIGN_API_KEY environment variable is not set. " +
      "Get your API key from https://app.hellosign.com/api/account"
    );
  }

  return new HelloSignService({
    apiKey,
    testMode: process.env.NODE_ENV !== "production",
  });
}

// Export singleton instance
let helloSignInstance: HelloSignService | null = null;

export function getHelloSignService(): HelloSignService {
  if (!helloSignInstance) {
    helloSignInstance = initializeHelloSign();
  }
  return helloSignInstance;
}
