import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Contextual Onboarding System", () => {
  describe("OnboardingContext", () => {
    it("should define actor onboarding steps", () => {
      const filePath = path.join(process.cwd(), "context/OnboardingContext.tsx");
      const content = fs.readFileSync(filePath, "utf-8");

      expect(content).toContain("ACTOR_STEPS");
      expect(content).toContain("actor_casting_feed");
      expect(content).toContain("actor_submit_tape");
      expect(content).toContain("actor_track_submissions");
      expect(content).toContain("actor_contracts");
      expect(content).toContain("actor_profile");
    });

    it("should define producer onboarding steps", () => {
      const filePath = path.join(process.cwd(), "context/OnboardingContext.tsx");
      const content = fs.readFileSync(filePath, "utf-8");

      expect(content).toContain("PRODUCER_STEPS");
      expect(content).toContain("producer_post_casting");
      expect(content).toContain("producer_review_submissions");
      expect(content).toContain("producer_hire_pay");
      expect(content).toContain("producer_contracts");
      expect(content).toContain("producer_network");
    });

    it("should have 5 steps for each role", () => {
      const filePath = path.join(process.cwd(), "context/OnboardingContext.tsx");
      const content = fs.readFileSync(filePath, "utf-8");

      // Count actor steps by their id definitions
      const actorStepIds = content.match(/id: "actor_/g);
      expect(actorStepIds).toHaveLength(5);

      // Count producer steps by their id definitions
      const producerStepIds = content.match(/id: "producer_/g);
      expect(producerStepIds).toHaveLength(5);
    });

    it("should persist state with AsyncStorage", () => {
      const filePath = path.join(process.cwd(), "context/OnboardingContext.tsx");
      const content = fs.readFileSync(filePath, "utf-8");

      expect(content).toContain("AsyncStorage");
      expect(content).toContain("@filmcontract_onboarding");
      expect(content).toContain("AsyncStorage.setItem");
      expect(content).toContain("AsyncStorage.getItem");
    });

    it("should provide skip functionality", () => {
      const filePath = path.join(process.cwd(), "context/OnboardingContext.tsx");
      const content = fs.readFileSync(filePath, "utf-8");

      expect(content).toContain("skipOnboarding");
      expect(content).toContain("skipped: true");
    });

    it("should track completion", () => {
      const filePath = path.join(process.cwd(), "context/OnboardingContext.tsx");
      const content = fs.readFileSync(filePath, "utf-8");

      expect(content).toContain("completed: true");
      expect(content).toContain("completedAt");
      expect(content).toContain("isOnboardingDone");
    });

    it("should provide navigation (next/prev/skip)", () => {
      const filePath = path.join(process.cwd(), "context/OnboardingContext.tsx");
      const content = fs.readFileSync(filePath, "utf-8");

      expect(content).toContain("nextStep");
      expect(content).toContain("prevStep");
      expect(content).toContain("skipOnboarding");
      expect(content).toContain("startOnboarding");
    });

    it("should export useOnboarding hook", () => {
      const filePath = path.join(process.cwd(), "context/OnboardingContext.tsx");
      const content = fs.readFileSync(filePath, "utf-8");

      expect(content).toContain("export function useOnboarding");
    });
  });

  describe("OnboardingTooltip Component", () => {
    it("should have OnboardingTooltip component", () => {
      const filePath = path.join(process.cwd(), "components/onboarding/OnboardingTooltip.tsx");
      const content = fs.readFileSync(filePath, "utf-8");

      expect(content).toContain("export function OnboardingTooltip");
    });

    it("should have OnboardingOverlay component", () => {
      const filePath = path.join(process.cwd(), "components/onboarding/OnboardingTooltip.tsx");
      const content = fs.readFileSync(filePath, "utf-8");

      expect(content).toContain("export function OnboardingOverlay");
    });

    it("should support top and bottom placement", () => {
      const filePath = path.join(process.cwd(), "components/onboarding/OnboardingTooltip.tsx");
      const content = fs.readFileSync(filePath, "utf-8");

      expect(content).toContain('placement?: "top" | "bottom"');
    });

    it("should show step progress dots", () => {
      const filePath = path.join(process.cwd(), "components/onboarding/OnboardingTooltip.tsx");
      const content = fs.readFileSync(filePath, "utf-8");

      expect(content).toContain("stepDots");
      expect(content).toContain("totalSteps");
    });

    it("should have skip button", () => {
      const filePath = path.join(process.cwd(), "components/onboarding/OnboardingTooltip.tsx");
      const content = fs.readFileSync(filePath, "utf-8");

      expect(content).toContain("skipOnboarding");
      expect(content).toContain("Skip");
    });

    it("should have back and next navigation", () => {
      const filePath = path.join(process.cwd(), "components/onboarding/OnboardingTooltip.tsx");
      const content = fs.readFileSync(filePath, "utf-8");

      expect(content).toContain("Back");
      expect(content).toContain("Next");
      expect(content).toContain("Done");
    });

    it("should use pulsing animation for highlight", () => {
      const filePath = path.join(process.cwd(), "components/onboarding/OnboardingTooltip.tsx");
      const content = fs.readFileSync(filePath, "utf-8");

      expect(content).toContain("pulseAnim");
      expect(content).toContain("Animated.loop");
    });
  });

  describe("Integration with Screens", () => {
    it("should integrate onboarding in home screen", () => {
      const filePath = path.join(process.cwd(), "app/(tabs)/index.tsx");
      const content = fs.readFileSync(filePath, "utf-8");

      expect(content).toContain("useOnboarding");
      expect(content).toContain("OnboardingTooltip");
      expect(content).toContain("OnboardingOverlay");
      expect(content).toContain("startOnboarding");
    });

    it("should auto-start actor onboarding on first visit", () => {
      const filePath = path.join(process.cwd(), "app/(tabs)/index.tsx");
      const content = fs.readFileSync(filePath, "utf-8");

      expect(content).toContain('startOnboarding("actor")');
      expect(content).toContain('isOnboardingDone("actor")');
    });

    it("should auto-start producer onboarding on first visit", () => {
      const filePath = path.join(process.cwd(), "app/(tabs)/index.tsx");
      const content = fs.readFileSync(filePath, "utf-8");

      expect(content).toContain('startOnboarding("producer")');
      expect(content).toContain('isOnboardingDone("producer")');
    });

    it("should have onboarding overlay on contracts screen", () => {
      const filePath = path.join(process.cwd(), "app/(tabs)/contracts.tsx");
      const content = fs.readFileSync(filePath, "utf-8");

      expect(content).toContain("OnboardingOverlay");
      expect(content).toContain('screen="contracts"');
    });

    it("should have onboarding overlay on profile screen", () => {
      const filePath = path.join(process.cwd(), "app/(tabs)/profile.tsx");
      const content = fs.readFileSync(filePath, "utf-8");

      expect(content).toContain("OnboardingOverlay");
      expect(content).toContain('screen="profile"');
    });

    it("should have onboarding overlay on network screen", () => {
      const filePath = path.join(process.cwd(), "app/(tabs)/network.tsx");
      const content = fs.readFileSync(filePath, "utf-8");

      expect(content).toContain("OnboardingOverlay");
      expect(content).toContain('screen="network"');
    });

    it("should wrap casting feed with tooltip for actor step 1", () => {
      const filePath = path.join(process.cwd(), "app/(tabs)/index.tsx");
      const content = fs.readFileSync(filePath, "utf-8");

      expect(content).toContain('stepId="actor_casting_feed"');
    });

    it("should wrap submissions with tooltip for actor step 3", () => {
      const filePath = path.join(process.cwd(), "app/(tabs)/index.tsx");
      const content = fs.readFileSync(filePath, "utf-8");

      expect(content).toContain('stepId="actor_track_submissions"');
    });

    it("should wrap post casting button with tooltip for producer step 1", () => {
      const filePath = path.join(process.cwd(), "app/(tabs)/index.tsx");
      const content = fs.readFileSync(filePath, "utf-8");

      expect(content).toContain('stepId="producer_post_casting"');
    });
  });

  describe("Provider Integration", () => {
    it("should have OnboardingProvider in root layout", () => {
      const filePath = path.join(process.cwd(), "app/_layout.tsx");
      const content = fs.readFileSync(filePath, "utf-8");

      expect(content).toContain("OnboardingProvider");
      expect(content).toContain("import { OnboardingProvider }");
    });
  });

  describe("Step Definitions", () => {
    it("actor steps should cover all required screens", () => {
      const filePath = path.join(process.cwd(), "context/OnboardingContext.tsx");
      const content = fs.readFileSync(filePath, "utf-8");

      // Actor steps should span home, contracts, and profile screens
      expect(content).toContain('screen: "home"');
      expect(content).toContain('screen: "contracts"');
      expect(content).toContain('screen: "profile"');
    });

    it("producer steps should cover all required screens", () => {
      const filePath = path.join(process.cwd(), "context/OnboardingContext.tsx");
      const content = fs.readFileSync(filePath, "utf-8");

      // Producer steps should span home, contracts, and network screens
      expect(content).toContain('screen: "network"');
    });

    it("each step should have title and description", () => {
      const filePath = path.join(process.cwd(), "context/OnboardingContext.tsx");
      const content = fs.readFileSync(filePath, "utf-8");

      // All steps have title and description fields
      const titleMatches = content.match(/title: "/g);
      const descMatches = content.match(/description: "/g);

      // 10 steps total (5 actor + 5 producer)
      expect(titleMatches!.length).toBeGreaterThanOrEqual(10);
      expect(descMatches!.length).toBeGreaterThanOrEqual(10);
    });
  });
});
