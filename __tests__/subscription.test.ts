import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Subscription System", () => {
  it("donation page should be removed", () => {
    const donatePath = path.join(__dirname, "../app/donate.tsx");
    expect(fs.existsSync(donatePath)).toBe(false);
  });

  it("about page should exist", () => {
    const aboutPath = path.join(__dirname, "../app/about.tsx");
    expect(fs.existsSync(aboutPath)).toBe(true);
  });

  it("subscription screen should exist", () => {
    const subPath = path.join(__dirname, "../app/subscription/index.tsx");
    expect(fs.existsSync(subPath)).toBe(true);
  });

  it("profile should not reference donate page", () => {
    const profileContent = fs.readFileSync(
      path.join(__dirname, "../app/(tabs)/profile.tsx"),
      "utf-8"
    );
    expect(profileContent).not.toContain("/donate");
    expect(profileContent).not.toContain("Support Developer");
  });

  it("profile should have subscription and about links", () => {
    const profileContent = fs.readFileSync(
      path.join(__dirname, "../app/(tabs)/profile.tsx"),
      "utf-8"
    );
    expect(profileContent).toContain("/subscription");
    expect(profileContent).toContain("Manage Subscription");
    expect(profileContent).toContain("/about");
    expect(profileContent).toContain("About FilmContract");
  });

  it("subscription router should have correct pricing", () => {
    const routerContent = fs.readFileSync(
      path.join(__dirname, "../server/subscription-router.ts"),
      "utf-8"
    );
    // Pro should be $4.99/mo (499 cents)
    expect(routerContent).toContain("pro: { monthly: 499, yearly: 4990 }");
    // Studio should be $14.99/mo (1499 cents)
    expect(routerContent).toContain("studio: { monthly: 1499, yearly: 14990 }");
  });

  it("free tier should allow 3 contracts per month", () => {
    const routerContent = fs.readFileSync(
      path.join(__dirname, "../server/subscription-router.ts"),
      "utf-8"
    );
    expect(routerContent).toContain("contractsPerMonth: 3,");
  });

  it("free tier should not include premium features", () => {
    const routerContent = fs.readFileSync(
      path.join(__dirname, "../server/subscription-router.ts"),
      "utf-8"
    );
    // Check that free tier has pdfExport: false and signatures: false
    const freeSection = routerContent.split("free:")[1].split("},")[0];
    expect(freeSection).toContain("pdfExport: false");
    expect(freeSection).toContain("signatures: false");
    expect(freeSection).toContain("analytics: false");
    expect(freeSection).toContain("templates: false");
  });

  it("pro tier should include all premium features", () => {
    const routerContent = fs.readFileSync(
      path.join(__dirname, "../server/subscription-router.ts"),
      "utf-8"
    );
    const proSection = routerContent.split("pro:")[1].split("},")[0];
    expect(proSection).toContain("pdfExport: true");
    expect(proSection).toContain("signatures: true");
    expect(proSection).toContain("analytics: true");
    expect(proSection).toContain("templates: true");
  });

  it("create-contract should check subscription limits", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../app/create-contract.tsx"),
      "utf-8"
    );
    expect(content).toContain("canCreateContract");
    expect(content).toContain("incrementContractUsage");
    expect(content).toContain("Contract Limit Reached");
  });

  it("analytics screen should gate behind subscription", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../app/(tabs)/analytics-old.tsx"),
      "utf-8"
    );
    expect(content).toContain("subscription.getCurrent");
    expect(content).toContain("Upgrade to Pro");
  });

  it("templates screen should gate behind subscription", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../app/templates/index.tsx"),
      "utf-8"
    );
    expect(content).toContain("subscription.getCurrent");
    expect(content).toContain("Upgrade to Pro");
  });

  it("home screen should show upgrade banner for free users", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../app/(tabs)/index.tsx"),
      "utf-8"
    );
    expect(content).toContain("subscription.getCurrent");
    expect(content).toContain("Upgrade to Pro");
    expect(content).toContain("$4.99/mo");
  });

  it("about page should credit John Dee Page Jr", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../app/about.tsx"),
      "utf-8"
    );
    expect(content).toContain("John Dee Page Jr");
    expect(content).toContain("DeePage Studios");
    expect(content).toContain("2026");
  });
});
