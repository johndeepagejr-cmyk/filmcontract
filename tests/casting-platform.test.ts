import { describe, it, expect } from "vitest";

describe("Casting Platform - Backend Router Structure", () => {
  it("casting-router.ts exports a valid tRPC router", async () => {
    // Verify the casting router file exists and exports correctly
    const fs = await import("fs");
    const routerPath = "/home/ubuntu/filmcontract/server/casting-router.ts";
    expect(fs.existsSync(routerPath)).toBe(true);
    const content = fs.readFileSync(routerPath, "utf-8");
    
    // Verify key endpoints exist
    expect(content).toContain("listOpen");
    expect(content).toContain("listMine");
    expect(content).toContain("submit");
    expect(content).toContain("updateSubmissionStatus");
    expect(content).toContain("getSubmissions");
    expect(content).toContain("hasSubmitted");
    expect(content).toContain("mySubmissions");
    expect(content).toContain("getAnalytics");
  });

  it("casting router is integrated into main routers.ts", async () => {
    const fs = await import("fs");
    const routersPath = "/home/ubuntu/filmcontract/server/routers.ts";
    const content = fs.readFileSync(routersPath, "utf-8");
    expect(content).toContain("casting-router");
  });
});

describe("Casting Platform - Screen Files", () => {
  it("my-submissions.tsx screen exists with proper structure", async () => {
    const fs = await import("fs");
    const filePath = "/home/ubuntu/filmcontract/app/casting/my-submissions.tsx";
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, "utf-8");
    
    // Verify key UI elements
    expect(content).toContain("MySubmissions");
    expect(content).toContain("trpc.casting.mySubmissions");
    expect(content).toContain("status");
    expect(content).toContain("submitted");
    expect(content).toContain("shortlisted");
    expect(content).toContain("hired");
    expect(content).toContain("rejected");
  });

  it("submissions.tsx (producer pipeline) screen exists with proper structure", async () => {
    const fs = await import("fs");
    const filePath = "/home/ubuntu/filmcontract/app/casting/submissions.tsx";
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, "utf-8");
    
    // Verify pipeline/Kanban elements
    expect(content).toContain("getSubmissions");
    expect(content).toContain("updateSubmissionStatus");
    expect(content).toContain("shortlisted");
    expect(content).toContain("reviewing");
    expect(content).toContain("hired");
    expect(content).toContain("rejected");
  });
});

describe("Casting Platform - Home Screen Enhancements", () => {
  it("Actor Home has My Submissions integration", async () => {
    const fs = await import("fs");
    const filePath = "/home/ubuntu/filmcontract/app/(tabs)/index.tsx";
    const content = fs.readFileSync(filePath, "utf-8");
    
    // Verify actor home has submissions query
    expect(content).toContain("trpc.casting.mySubmissions");
    expect(content).toContain("submissionCount");
    expect(content).toContain("shortlistedCount");
    expect(content).toContain("hiredCount");
    expect(content).toContain("/casting/my-submissions");
    expect(content).toContain("Applied");
  });

  it("Producer Home has casting analytics", async () => {
    const fs = await import("fs");
    const filePath = "/home/ubuntu/filmcontract/app/(tabs)/index.tsx";
    const content = fs.readFileSync(filePath, "utf-8");
    
    // Verify producer home has analytics
    expect(content).toContain("trpc.casting.getAnalytics");
    expect(content).toContain("trpc.casting.listMine");
    expect(content).toContain("analyticsCard");
    expect(content).toContain("Casting Analytics");
    expect(content).toContain("totalCastings");
    expect(content).toContain("openCastings");
    expect(content).toContain("totalSubmissions");
    expect(content).toContain("hiredCount");
  });

  it("Producer Home links to submissions pipeline", async () => {
    const fs = await import("fs");
    const filePath = "/home/ubuntu/filmcontract/app/(tabs)/index.tsx";
    const content = fs.readFileSync(filePath, "utf-8");
    
    // Verify pipeline links
    expect(content).toContain("/casting/submissions?castingId=");
    expect(content).toContain("miniPipeline");
    expect(content).toContain("applicants");
  });
});

describe("Casting Platform - Detail Screen Enhancements", () => {
  it("Casting detail has hasSubmitted check", async () => {
    const fs = await import("fs");
    const filePath = "/home/ubuntu/filmcontract/app/casting/[id].tsx";
    const content = fs.readFileSync(filePath, "utf-8");
    
    // Verify hasSubmitted integration
    expect(content).toContain("trpc.casting.hasSubmitted");
    expect(content).toContain("Already Applied");
    expect(content).toContain("Applied – View Status");
    expect(content).toContain("/casting/my-submissions");
  });

  it("Casting detail has producer pipeline link", async () => {
    const fs = await import("fs");
    const filePath = "/home/ubuntu/filmcontract/app/casting/[id].tsx";
    const content = fs.readFileSync(filePath, "utf-8");
    
    // Verify producer pipeline link
    expect(content).toContain("Pipeline");
    expect(content).toContain("/casting/submissions?castingId=");
    expect(content).toContain("isOwner");
  });
});

describe("Casting Platform - Feed Page Enhancements", () => {
  it("Casting feed has sorting options", async () => {
    const fs = await import("fs");
    const filePath = "/home/ubuntu/filmcontract/app/casting/index.tsx";
    const content = fs.readFileSync(filePath, "utf-8");
    
    // Verify sorting
    expect(content).toContain("SortKey");
    expect(content).toContain("newest");
    expect(content).toContain("deadline");
    expect(content).toContain("budget_high");
    expect(content).toContain("budget_low");
    expect(content).toContain("sortOptions");
  });

  it("Casting feed has submission count and pipeline links", async () => {
    const fs = await import("fs");
    const filePath = "/home/ubuntu/filmcontract/app/casting/index.tsx";
    const content = fs.readFileSync(filePath, "utf-8");
    
    // Verify submission count display
    expect(content).toContain("submissionCount");
    expect(content).toContain("pipelineBtn");
    expect(content).toContain("Pipeline");
  });
});

describe("Casting Platform - Icon Mappings", () => {
  it("All required icons are mapped", async () => {
    const fs = await import("fs");
    const filePath = "/home/ubuntu/filmcontract/components/ui/icon-symbol.tsx";
    const content = fs.readFileSync(filePath, "utf-8");
    
    // Verify critical icon mappings
    expect(content).toContain("arrow.up.arrow.down");
    expect(content).toContain("checkmark.circle.fill");
    expect(content).toContain("person.2.fill");
    expect(content).toContain("megaphone.fill");
    expect(content).toContain("camera.fill");
    expect(content).toContain("magnifyingglass");
    expect(content).toContain("calendar");
    expect(content).toContain("dollarsign.circle");
  });
});
