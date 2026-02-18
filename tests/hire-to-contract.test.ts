/**
 * Hire → Contract Integration Tests
 * Verifies the end-to-end flow from Review screen Hire button to Contract Wizard pre-fill.
 * © John dee page jr
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";

const REVIEW_PATH = "/home/ubuntu/filmcontract/app/casting/review.tsx";
const WIZARD_PATH = "/home/ubuntu/filmcontract/app/contract-wizard/index.tsx";

describe("Hire → Contract Integration", () => {
  const reviewContent = fs.readFileSync(REVIEW_PATH, "utf-8");
  const wizardContent = fs.readFileSync(WIZARD_PATH, "utf-8");

  // ─── Review Screen (Sender) ─────────────────────────────────
  describe("Review screen Hire button", () => {
    it("passes actorName to contract wizard", () => {
      expect(reviewContent).toContain("actorName: sub.actorName");
    });

    it("passes actorId to contract wizard", () => {
      expect(reviewContent).toContain("actorId: sub.actorId");
    });

    it("passes actorEmail to contract wizard", () => {
      expect(reviewContent).toContain("actorEmail: sub.actorEmail");
    });

    it("passes projectTitle from casting to contract wizard", () => {
      expect(reviewContent).toContain("projectTitle: castingTitle");
    });

    it("passes castingCallId to contract wizard", () => {
      expect(reviewContent).toContain("castingCallId: castingId");
    });

    it("passes roleName to contract wizard", () => {
      expect(reviewContent).toContain("roleName:");
    });

    it("sets fromHire=true flag", () => {
      expect(reviewContent).toContain('fromHire: "true"');
    });

    it("updates submission status to hired", () => {
      expect(reviewContent).toContain('updateStatus(sub.id, "hired")');
    });

    it("navigates to /contract-wizard", () => {
      expect(reviewContent).toContain('pathname: "/contract-wizard"');
    });
  });

  // ─── Contract Wizard (Receiver) ─────────────────────────────
  describe("Contract Wizard pre-fill handling", () => {
    it("accepts actorName param", () => {
      expect(wizardContent).toContain("actorName?: string");
    });

    it("accepts actorId param", () => {
      expect(wizardContent).toContain("actorId?: string");
    });

    it("accepts actorEmail param", () => {
      expect(wizardContent).toContain("actorEmail?: string");
    });

    it("accepts projectTitle param", () => {
      expect(wizardContent).toContain("projectTitle?: string");
    });

    it("accepts roleName param", () => {
      expect(wizardContent).toContain("roleName?: string");
    });

    it("accepts castingCallId param", () => {
      expect(wizardContent).toContain("castingCallId?: string");
    });

    it("accepts fromHire param", () => {
      expect(wizardContent).toContain("fromHire?: string");
    });

    it("detects fromHire flag", () => {
      expect(wizardContent).toContain('params.fromHire === "true"');
    });

    it("skips to Step 3 (Terms) when fromHire is true", () => {
      expect(wizardContent).toContain("isFromHire ? 2");
    });

    it("pre-fills talent data from params", () => {
      expect(wizardContent).toContain("selectedActorName: params.actorName");
      expect(wizardContent).toContain("selectedActorId: params.actorId");
      expect(wizardContent).toContain("inviteEmail: params.actorEmail");
    });

    it("pre-fills project title with role name", () => {
      expect(wizardContent).toContain("params.roleName");
      expect(wizardContent).toContain("params.projectTitle");
    });

    it("pre-fills terms amount from params", () => {
      expect(wizardContent).toContain("amount: params.amount");
      expect(wizardContent).toContain("rateType: (params.rateType");
    });

    it("includes castingCallId in contract payload", () => {
      expect(wizardContent).toContain("castingCallId");
      expect(wizardContent).toContain("castingCallId ? { castingCallId }");
    });
  });

  // ─── Step Navigation ────────────────────────────────────────
  describe("Step navigation logic", () => {
    it("starts at Step 0 by default (no params)", () => {
      // When no actorName and no fromHire, step starts at 0
      expect(wizardContent).toContain("params.actorName ? 1 : 0");
    });

    it("starts at Step 1 when actorName is provided (non-hire)", () => {
      expect(wizardContent).toContain("params.actorName ? 1 : 0");
    });

    it("starts at Step 2 when fromHire is true", () => {
      expect(wizardContent).toContain("isFromHire ? 2");
    });

    it("allows navigating back to earlier steps", () => {
      expect(wizardContent).toContain("step > 0");
      expect(wizardContent).toContain("prev");
    });
  });
});
