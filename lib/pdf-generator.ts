import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import type { Contract } from "@/drizzle/schema";

interface ContractWithNames extends Contract {
  producerName: string;
  actorName: string;
}

export async function generateContractPDF(contract: ContractWithNames) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 40px;
            line-height: 1.6;
            color: #1f2937;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #1E40AF;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #1E40AF;
            font-size: 32px;
            margin: 0 0 10px 0;
          }
          .header p {
            color: #6b7280;
            margin: 0;
          }
          .section {
            margin-bottom: 30px;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #1E40AF;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 2px solid #e5e7eb;
          }
          .field {
            margin-bottom: 15px;
          }
          .field-label {
            font-weight: 600;
            color: #4b5563;
            margin-bottom: 5px;
          }
          .field-value {
            color: #1f2937;
            padding-left: 10px;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
            text-transform: capitalize;
          }
          .status-draft { background-color: #fef3c7; color: #92400e; }
          .status-active { background-color: #d1fae5; color: #065f46; }
          .status-pending { background-color: #dbeafe; color: #1e40af; }
          .status-completed { background-color: #d1fae5; color: #065f46; }
          .status-cancelled { background-color: #fee2e2; color: #991b1b; }
          .payment-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
            text-transform: capitalize;
          }
          .payment-unpaid { background-color: #fee2e2; color: #991b1b; }
          .payment-partial { background-color: #fef3c7; color: #92400e; }
          .payment-paid { background-color: #d1fae5; color: #065f46; }
          .footer {
            margin-top: 60px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
          .parties {
            display: flex;
            justify-content: space-between;
            margin-top: 40px;
          }
          .party {
            flex: 1;
          }
          .signature-line {
            border-top: 1px solid #000;
            margin-top: 60px;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>FilmContract</h1>
          <p>Transparent contracts for film professionals</p>
        </div>

        <div class="section">
          <div class="section-title">Contract Information</div>
          <div class="field">
            <div class="field-label">Project Title</div>
            <div class="field-value">${contract.projectTitle}</div>
          </div>
          <div class="field">
            <div class="field-label">Contract ID</div>
            <div class="field-value">#${contract.id}</div>
          </div>
          <div class="field">
            <div class="field-label">Status</div>
            <div class="field-value">
              <span class="status-badge status-${contract.status}">${contract.status}</span>
            </div>
          </div>
          <div class="field">
            <div class="field-label">Created Date</div>
            <div class="field-value">${new Date(contract.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Parties</div>
          <div class="field">
            <div class="field-label">Producer</div>
            <div class="field-value">${contract.producerName}</div>
          </div>
          <div class="field">
            <div class="field-label">Actor</div>
            <div class="field-value">${contract.actorName}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Contract Terms</div>
          ${contract.startDate ? `
          <div class="field">
            <div class="field-label">Start Date</div>
            <div class="field-value">${new Date(contract.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
          ` : ''}
          ${contract.endDate ? `
          <div class="field">
            <div class="field-label">End Date</div>
            <div class="field-value">${new Date(contract.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
          ` : ''}
          <div class="field">
            <div class="field-label">Payment Terms</div>
            <div class="field-value">${contract.paymentTerms}</div>
          </div>
          ${contract.paymentAmount ? `
          <div class="field">
            <div class="field-label">Payment Amount</div>
            <div class="field-value">$${parseFloat(contract.paymentAmount.toString()).toLocaleString()}</div>
          </div>
          ` : ''}
          ${contract.paymentAmount ? `
          <div class="field">
            <div class="field-label">Payment Status</div>
            <div class="field-value">
              <span class="payment-badge payment-${contract.paymentStatus}">${contract.paymentStatus}</span>
              ${contract.paidAmount ? ` - $${parseFloat(contract.paidAmount.toString()).toLocaleString()} paid` : ''}
            </div>
          </div>
          ` : ''}
          ${contract.deliverables ? `
          <div class="field">
            <div class="field-label">Deliverables</div>
            <div class="field-value">${contract.deliverables}</div>
          </div>
          ` : ''}
        </div>

        <div class="parties">
          <div class="party">
            <div class="signature-line">
              <strong>Producer Signature</strong><br>
              ${contract.producerName}
            </div>
          </div>
          <div class="party">
            <div class="signature-line">
              <strong>Actor Signature</strong><br>
              ${contract.actorName}
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Created by John Dee Page Jr</p>
          <p>© ${new Date().getFullYear()} FilmContract - Transparent contracts for film professionals</p>
          <p>Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });
    
    if (Platform.OS === "web") {
      // On web, trigger download
      const link = document.createElement("a");
      link.href = uri;
      link.download = `Contract_${contract.projectTitle.replace(/[^a-z0-9]/gi, '_')}_${contract.id}.pdf`;
      link.click();
    } else {
      // On mobile, use sharing
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: `Contract: ${contract.projectTitle}`,
          UTI: "com.adobe.pdf",
        });
      }
    }
    
    return uri;
  } catch (error) {
    console.error("PDF generation error:", error);
    throw error;
  }
}
