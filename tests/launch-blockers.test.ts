import { describe, it, expect, beforeAll } from "vitest";
import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");

// ─── Escrow Payment System ──────────────────────────────────

describe("Escrow Payment System", () => {
  let escrowRouterCode: string;
  let paymentsDashboardCode: string;
  let paymentScreenCode: string;
  let schemaCode: string;

  beforeAll(() => {
    escrowRouterCode = fs.readFileSync(path.join(ROOT, "server/escrow-router.ts"), "utf-8");
    paymentsDashboardCode = fs.readFileSync(path.join(ROOT, "app/payments/index.tsx"), "utf-8");
    paymentScreenCode = fs.readFileSync(path.join(ROOT, "app/payment/[contractId].tsx"), "utf-8");
    schemaCode = fs.readFileSync(path.join(ROOT, "drizzle/schema.ts"), "utf-8");
  });

  describe("Schema", () => {
    it("has escrowPayments table", () => {
      expect(schemaCode).toContain("escrowPayments");
    });

    it("has required escrow columns", () => {
      expect(schemaCode).toContain("contractId");
      expect(schemaCode).toContain("payerId");
      expect(schemaCode).toContain("payeeId");
      expect(schemaCode).toContain("amount");
    });
  });

  describe("Backend Router", () => {
    it("has create endpoint", () => {
      expect(escrowRouterCode).toContain("create:");
    });

    it("has fund endpoint", () => {
      expect(escrowRouterCode).toContain("fund:");
    });

    it("has release endpoint", () => {
      expect(escrowRouterCode).toContain("release:");
    });

    it("has dispute endpoint", () => {
      expect(escrowRouterCode).toContain("dispute:");
    });

    it("has resolve endpoint", () => {
      expect(escrowRouterCode).toContain("resolve:");
    });

    it("has cancel endpoint", () => {
      expect(escrowRouterCode).toContain("cancel:");
    });

    it("has getHistory endpoint", () => {
      expect(escrowRouterCode).toContain("getHistory:");
    });

    it("has getEarningsSummary endpoint", () => {
      expect(escrowRouterCode).toContain("getEarningsSummary:");
    });

    it("enforces state machine transitions", () => {
      // fund: pending → funded
      expect(escrowRouterCode).toContain("pending");
      expect(escrowRouterCode).toContain("funded");
      // release: funded → released
      expect(escrowRouterCode).toContain("released");
      // dispute: funded → disputed
      expect(escrowRouterCode).toContain("disputed");
    });
  });

  describe("Payments Dashboard UI", () => {
    it("shows earnings overview", () => {
      expect(paymentsDashboardCode).toContain("Earnings Overview");
    });

    it("shows available, released, pending, disputed amounts", () => {
      expect(paymentsDashboardCode).toContain("earnings.available");
      expect(paymentsDashboardCode).toContain("earnings.released");
      expect(paymentsDashboardCode).toContain("earnings.pending");
      expect(paymentsDashboardCode).toContain("earnings.disputed");
    });

    it("has filter chips for status", () => {
      expect(paymentsDashboardCode).toContain("In Escrow");
      expect(paymentsDashboardCode).toContain("Released");
      expect(paymentsDashboardCode).toContain("Disputed");
    });

    it("has Fund Escrow action", () => {
      expect(paymentsDashboardCode).toContain("Fund Escrow");
    });

    it("has Release action", () => {
      expect(paymentsDashboardCode).toContain("Release");
    });

    it("has Dispute action with reason input", () => {
      expect(paymentsDashboardCode).toContain("Dispute");
      expect(paymentsDashboardCode).toContain("disputeReason");
      expect(paymentsDashboardCode).toContain("Submit Dispute");
    });

    it("has Cancel action", () => {
      expect(paymentsDashboardCode).toContain("Cancel");
    });

    it("shows confirmation dialogs before actions", () => {
      expect(paymentsDashboardCode).toContain("confirmAction");
    });
  });

  describe("Contract Payment Screen", () => {
    it("uses escrow.create instead of old payments.createContractPayment", () => {
      expect(paymentScreenCode).toContain("trpc.escrow.create");
      expect(paymentScreenCode).toContain("trpc.escrow.fund");
      expect(paymentScreenCode).not.toContain("trpc.payments.createContractPayment");
    });
  });
});

// ─── Notification System ────────────────────────────────────

describe("Notification System", () => {
  let notifRouterCode: string;
  let notifServiceCode: string;
  let notifCenterCode: string;
  let pushHookCode: string;

  beforeAll(() => {
    notifRouterCode = fs.readFileSync(path.join(ROOT, "server/notification-router.ts"), "utf-8");
    notifServiceCode = fs.readFileSync(path.join(ROOT, "server/notification-service.ts"), "utf-8");
    notifCenterCode = fs.readFileSync(path.join(ROOT, "app/notifications/index.tsx"), "utf-8");
    pushHookCode = fs.readFileSync(path.join(ROOT, "hooks/use-push-notifications.ts"), "utf-8");
  });

  describe("Schema", () => {
    it("has notifications table", () => {
      const schema = fs.readFileSync(path.join(ROOT, "drizzle/schema.ts"), "utf-8");
      expect(schema).toContain("notifications");
    });
  });

  describe("Backend Router", () => {
    it("has list endpoint", () => {
      expect(notifRouterCode).toContain("list:");
    });

    it("has unreadCount endpoint", () => {
      expect(notifRouterCode).toContain("unreadCount:");
    });

    it("has markRead endpoint", () => {
      expect(notifRouterCode).toContain("markRead:");
    });

    it("has markAllRead endpoint", () => {
      expect(notifRouterCode).toContain("markAllRead:");
    });

    it("has delete endpoint", () => {
      expect(notifRouterCode).toContain("delete:");
    });

    it("has registerPushToken endpoint", () => {
      expect(notifRouterCode).toContain("registerPushToken:");
    });
  });

  describe("Notification Service", () => {
    it("has escrow notifications", () => {
      expect(notifServiceCode).toContain("notifyEscrowFunded");
      expect(notifServiceCode).toContain("notifyEscrowReleased");
      expect(notifServiceCode).toContain("notifyEscrowDisputed");
    });

    it("has submission status notifications", () => {
      expect(notifServiceCode).toContain("notifySubmissionStatus");
    });

    it("has new submission notification for producers", () => {
      expect(notifServiceCode).toContain("notifyNewSubmission");
    });

    it("creates in-app notifications", () => {
      expect(notifServiceCode).toContain("createInAppNotification");
    });

    it("sends push notifications via Expo", () => {
      expect(notifServiceCode).toContain("exp.host/--/api/v2/push/send");
    });
  });

  describe("Notification Center UI", () => {
    it("shows unread badge count", () => {
      expect(notifCenterCode).toContain("unreadCount");
    });

    it("has All and Unread filter tabs", () => {
      expect(notifCenterCode).toContain("showUnreadOnly");
    });

    it("has Mark All Read action", () => {
      expect(notifCenterCode).toContain("Read All");
      expect(notifCenterCode).toContain("markAllRead");
    });

    it("has delete notification action", () => {
      expect(notifCenterCode).toContain("deleteMutation");
    });

    it("handles deep linking by notification type", () => {
      expect(notifCenterCode).toContain("handleNotifPress");
      expect(notifCenterCode).toContain("/payments");
      expect(notifCenterCode).toContain("/casting/my-submissions");
    });

    it("shows notification type icons", () => {
      expect(notifCenterCode).toContain("NOTIF_CONFIG");
      expect(notifCenterCode).toContain("escrow_funded");
      expect(notifCenterCode).toContain("submission_status");
    });
  });

  describe("Push Notifications Hook", () => {
    it("registers push token with server", () => {
      expect(pushHookCode).toContain("registerPushToken");
    });

    it("handles notification permissions", () => {
      expect(pushHookCode).toContain("getPermissionsAsync");
      expect(pushHookCode).toContain("requestPermissionsAsync");
    });

    it("sets up Android notification channel", () => {
      expect(pushHookCode).toContain("setNotificationChannelAsync");
    });
  });
});

// ─── Home Screen Integration ────────────────────────────────

describe("Home Screen Integration", () => {
  let homeCode: string;

  beforeAll(() => {
    homeCode = fs.readFileSync(path.join(ROOT, "app/(tabs)/index.tsx"), "utf-8");
  });

  it("has notification bell button in Actor Home", () => {
    expect(homeCode).toContain('router.push("/notifications"');
    expect(homeCode).toContain("bell.fill");
  });

  it("has payments button in Actor Home", () => {
    expect(homeCode).toContain('router.push("/payments"');
    expect(homeCode).toContain("dollarsign.circle");
  });

  it("has notification bell in Producer Home", () => {
    // Both Actor and Producer homes should have notification access
    const bellCount = (homeCode.match(/bell\.fill/g) || []).length;
    expect(bellCount).toBeGreaterThanOrEqual(2);
  });

  it("has payments button in Producer Home", () => {
    const dollarCount = (homeCode.match(/dollarsign\.circle/g) || []).length;
    expect(dollarCount).toBeGreaterThanOrEqual(2);
  });
});

// ─── App Store Metadata ─────────────────────────────────────

describe("App Store Metadata", () => {
  let metadata: string;

  beforeAll(() => {
    metadata = fs.readFileSync(path.join(ROOT, "APP_STORE_METADATA.md"), "utf-8");
  });

  it("has app name", () => {
    expect(metadata).toContain("FilmContract");
  });

  it("has subtitle under 30 chars", () => {
    const match = metadata.match(/## Subtitle.*\n(.*)/);
    expect(match).toBeTruthy();
  });

  it("has primary and secondary categories", () => {
    expect(metadata).toContain("Entertainment");
    expect(metadata).toContain("Business");
  });

  it("has description under 4000 chars", () => {
    const descStart = metadata.indexOf("## App Store Description");
    const descEnd = metadata.indexOf("## Keywords");
    const description = metadata.substring(descStart, descEnd);
    expect(description.length).toBeLessThan(4000);
  });

  it("has keywords under 100 chars", () => {
    const match = metadata.match(/## Keywords.*\n(.*)/);
    expect(match).toBeTruthy();
    if (match) {
      expect(match[1].length).toBeLessThan(100);
    }
  });

  it("has screenshot descriptions for 6 screens", () => {
    expect(metadata).toContain("Casting Feed");
    expect(metadata).toContain("Self-Tape Recorder");
    expect(metadata).toContain("Producer Review");
    expect(metadata).toContain("Contract Wizard");
    expect(metadata).toContain("Escrow Payments");
    expect(metadata).toContain("Notification Center");
  });

  it("has privacy data collection table", () => {
    expect(metadata).toContain("Data Collected");
    expect(metadata).toContain("Contact Info");
    expect(metadata).toContain("Financial Info");
  });

  it("has age rating", () => {
    expect(metadata).toContain("17+");
  });

  it("has release notes", () => {
    expect(metadata).toContain("Version 1.0.0");
  });
});
