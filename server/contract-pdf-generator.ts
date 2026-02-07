/**
 * Contract PDF Generator
 * Generates professional PDF contracts for HelloSign signature
 * 
 * Author: John Dee Page Jr
 * Created for FilmContract - Professional Film Contract Management
 */

import { PDFDocument, PDFPage, rgb } from "pdf-lib";
import * as db from "./db";

interface ContractData {
  contractId: number;
  projectTitle: string;
  producerName: string;
  producerEmail: string;
  actorName: string;
  actorEmail: string;
  paymentAmount: string;
  paymentTerms: string;
  startDate: string;
  endDate: string;
  deliverables: string;
  createdDate: string;
}

/**
 * Generate a professional PDF contract
 * Returns PDF as Buffer for upload to S3 or HelloSign
 */
export async function generateContractPDF(
  contractData: ContractData
): Promise<Buffer> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();

  // Add a blank page
  const page = pdfDoc.addPage([612, 792]); // Letter size: 8.5" x 11"
  const { width, height } = page.getSize();

  // Define colors
  const darkBlue = rgb(0.1, 0.2, 0.4);
  const lightGray = rgb(0.95, 0.95, 0.95);
  const black = rgb(0, 0, 0);

  // Get fonts
  const helveticaBold = await pdfDoc.embedFont("Helvetica-Bold");
  const helvetica = await pdfDoc.embedFont("Helvetica");

  let yPosition = height - 50;

  // Header
  page.drawText("FILM CONTRACT AGREEMENT", {
    x: 50,
    y: yPosition,
    size: 24,
    font: helveticaBold,
    color: darkBlue,
  });

  yPosition -= 40;

  // Subtitle with date
  page.drawText(`Generated: ${contractData.createdDate}`, {
    x: 50,
    y: yPosition,
    size: 10,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5),
  });

  yPosition -= 30;

  // Horizontal line
  page.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: width - 50, y: yPosition },
    thickness: 2,
    color: darkBlue,
  });

  yPosition -= 20;

  // Project Information Section
  page.drawText("PROJECT INFORMATION", {
    x: 50,
    y: yPosition,
    size: 14,
    font: helveticaBold,
    color: darkBlue,
  });

  yPosition -= 20;

  // Project Title
  page.drawText(`Project Title: ${contractData.projectTitle}`, {
    x: 50,
    y: yPosition,
    size: 11,
    font: helvetica,
    color: black,
  });

  yPosition -= 20;

  // Contract ID
  page.drawText(`Contract ID: FC-${contractData.contractId}`, {
    x: 50,
    y: yPosition,
    size: 11,
    font: helvetica,
    color: black,
  });

  yPosition -= 30;

  // Parties Section
  page.drawText("PARTIES TO THIS AGREEMENT", {
    x: 50,
    y: yPosition,
    size: 14,
    font: helveticaBold,
    color: darkBlue,
  });

  yPosition -= 20;

  // Producer
  page.drawText("Producer:", {
    x: 50,
    y: yPosition,
    size: 11,
    font: helveticaBold,
    color: black,
  });

  yPosition -= 15;

  page.drawText(`Name: ${contractData.producerName}`, {
    x: 70,
    y: yPosition,
    size: 10,
    font: helvetica,
    color: black,
  });

  yPosition -= 15;

  page.drawText(`Email: ${contractData.producerEmail}`, {
    x: 70,
    y: yPosition,
    size: 10,
    font: helvetica,
    color: black,
  });

  yPosition -= 25;

  // Actor
  page.drawText("Actor/Performer:", {
    x: 50,
    y: yPosition,
    size: 11,
    font: helveticaBold,
    color: black,
  });

  yPosition -= 15;

  page.drawText(`Name: ${contractData.actorName}`, {
    x: 70,
    y: yPosition,
    size: 10,
    font: helvetica,
    color: black,
  });

  yPosition -= 15;

  page.drawText(`Email: ${contractData.actorEmail}`, {
    x: 70,
    y: yPosition,
    size: 10,
    font: helvetica,
    color: black,
  });

  yPosition -= 30;

  // Terms Section
  page.drawText("TERMS AND CONDITIONS", {
    x: 50,
    y: yPosition,
    size: 14,
    font: helveticaBold,
    color: darkBlue,
  });

  yPosition -= 20;

  // Payment Terms
  page.drawText("Payment Terms:", {
    x: 50,
    y: yPosition,
    size: 11,
    font: helveticaBold,
    color: black,
  });

  yPosition -= 15;

  page.drawText(`Amount: ${contractData.paymentAmount}`, {
    x: 70,
    y: yPosition,
    size: 10,
    font: helvetica,
    color: black,
  });

  yPosition -= 15;

  // Wrap payment terms text
  const paymentTermsLines = wrapText(
    contractData.paymentTerms,
    50,
    helvetica
  );
  page.drawText(`Terms: ${paymentTermsLines[0]}`, {
    x: 70,
    y: yPosition,
    size: 10,
    font: helvetica,
    color: black,
  });

  yPosition -= 15;

  for (let i = 1; i < paymentTermsLines.length; i++) {
    page.drawText(paymentTermsLines[i], {
      x: 70,
      y: yPosition,
      size: 10,
      font: helvetica,
      color: black,
    });
    yPosition -= 15;
  }

  yPosition -= 10;

  // Project Dates
  page.drawText("Project Dates:", {
    x: 50,
    y: yPosition,
    size: 11,
    font: helveticaBold,
    color: black,
  });

  yPosition -= 15;

  page.drawText(`Start Date: ${contractData.startDate}`, {
    x: 70,
    y: yPosition,
    size: 10,
    font: helvetica,
    color: black,
  });

  yPosition -= 15;

  page.drawText(`End Date: ${contractData.endDate}`, {
    x: 70,
    y: yPosition,
    size: 10,
    font: helvetica,
    color: black,
  });

  yPosition -= 25;

  // Deliverables
  page.drawText("Deliverables:", {
    x: 50,
    y: yPosition,
    size: 11,
    font: helveticaBold,
    color: black,
  });

  yPosition -= 15;

  const deliverablesLines = wrapText(
    contractData.deliverables,
    50,
    helvetica
  );
  for (const line of deliverablesLines) {
    page.drawText(line, {
      x: 70,
      y: yPosition,
      size: 10,
      font: helvetica,
      color: black,
    });
    yPosition -= 15;
  }

  yPosition -= 20;

  // Legal Notice
  page.drawText("LEGAL NOTICE", {
    x: 50,
    y: yPosition,
    size: 11,
    font: helveticaBold,
    color: darkBlue,
  });

  yPosition -= 15;

  const legalText =
    "This contract is legally binding and enforceable in court. By signing below, both parties agree to all terms and conditions outlined in this agreement.";
  const legalLines = wrapText(legalText, 50, helvetica);

  for (const line of legalLines) {
    page.drawText(line, {
      x: 50,
      y: yPosition,
      size: 9,
      font: helvetica,
      color: rgb(0.5, 0.5, 0.5),
    });
    yPosition -= 12;
  }

  yPosition -= 20;

  // Signature Section
  page.drawText("SIGNATURES", {
    x: 50,
    y: yPosition,
    size: 14,
    font: helveticaBold,
    color: darkBlue,
  });

  yPosition -= 30;

  // Producer Signature
  page.drawText("Producer Signature:", {
    x: 50,
    y: yPosition,
    size: 11,
    font: helveticaBold,
    color: black,
  });

  yPosition -= 25;

  page.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: 250, y: yPosition },
    thickness: 1,
    color: black,
  });

  yPosition -= 15;

  page.drawText("Date: ________________", {
    x: 50,
    y: yPosition,
    size: 10,
    font: helvetica,
    color: black,
  });

  yPosition -= 30;

  // Actor Signature
  page.drawText("Actor/Performer Signature:", {
    x: 50,
    y: yPosition,
    size: 11,
    font: helveticaBold,
    color: black,
  });

  yPosition -= 25;

  page.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: 250, y: yPosition },
    thickness: 1,
    color: black,
  });

  yPosition -= 15;

  page.drawText("Date: ________________", {
    x: 50,
    y: yPosition,
    size: 10,
    font: helvetica,
    color: black,
  });

  // Footer
  page.drawText(
    "This document was generated by FilmContract - Professional Film Contract Management",
    {
      x: 50,
      y: 20,
      size: 8,
      font: helvetica,
      color: rgb(0.7, 0.7, 0.7),
    }
  );

  // Save PDF to buffer
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Wrap text to fit within a specified width
 * Simple word-wrapping algorithm
 */
function wrapText(
  text: string,
  maxWidth: number,
  font: any,
  fontSize: number = 10
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    // Rough estimate: ~2 characters per 10 pixels at 10pt font
    if (testLine.length * 5 > maxWidth) {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Generate PDF and upload to S3
 * Returns URL for HelloSign to use
 */
export async function generateAndUploadContractPDF(
  contractId: number
): Promise<string> {
  try {
    // Get contract from database
    const contract = await db.getContractById(contractId);
    if (!contract) {
      throw new Error("Contract not found");
    }

    // Get producer and actor info
    const producer = await db.getUserById(contract.producerId);
    const actor = await db.getUserById(contract.actorId);

    if (!producer || !actor) {
      throw new Error("Producer or actor not found");
    }

    // Prepare contract data
    const contractData: ContractData = {
      contractId: contract.id,
      projectTitle: contract.projectTitle,
      producerName: producer.name || "Unknown Producer",
      producerEmail: producer.email || "unknown@example.com",
      actorName: actor.name || "Unknown Actor",
      actorEmail: actor.email || "unknown@example.com",
      paymentAmount: contract.paymentAmount?.toString() || "TBD",
      paymentTerms: contract.paymentTerms || "To be determined",
      startDate: contract.startDate
        ? new Date(contract.startDate).toLocaleDateString()
        : "TBD",
      endDate: contract.endDate
        ? new Date(contract.endDate).toLocaleDateString()
        : "TBD",
      deliverables: contract.deliverables || "To be determined",
      createdDate: new Date().toLocaleDateString(),
    };

    // Generate PDF
    const pdfBuffer = await generateContractPDF(contractData);

    // Upload to S3 (if configured)
    const s3Url = await uploadPDFToS3(contractId, pdfBuffer);

    return s3Url;
  } catch (error) {
    console.error("Error generating and uploading contract PDF:", error);
    throw error;
  }
}

/**
 * Upload PDF to S3
 * Returns public URL for HelloSign to access
 */
async function uploadPDFToS3(
  contractId: number,
  pdfBuffer: Buffer
): Promise<string> {
  try {
    // For now, return a placeholder URL
    // In production, you would:
    // 1. Initialize AWS S3 client
    // 2. Upload the PDF buffer
    // 3. Generate a presigned URL
    // 4. Return the URL

    // Placeholder implementation
    const fileName = `contracts/contract-${contractId}-${Date.now()}.pdf`;
    const s3Url = `${process.env.S3_BUCKET_URL || "https://s3.amazonaws.com/filmcontract"}/${fileName}`;

    console.log(`PDF would be uploaded to: ${s3Url}`);

    return s3Url;
  } catch (error) {
    console.error("Error uploading PDF to S3:", error);
    throw error;
  }
}
