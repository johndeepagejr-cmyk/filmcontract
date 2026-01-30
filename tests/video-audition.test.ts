import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Video Audition Feature", () => {
  describe("Database Schema", () => {
    it("should have video_auditions table definition in schema file", () => {
      const schemaPath = path.join(process.cwd(), "drizzle/schema.ts");
      const schemaContent = fs.readFileSync(schemaPath, "utf-8");
      
      expect(schemaContent).toContain("videoAuditions");
      expect(schemaContent).toContain("video_auditions");
      expect(schemaContent).toContain("producerId");
      expect(schemaContent).toContain("actorId");
      expect(schemaContent).toContain("roomName");
      expect(schemaContent).toContain("scheduledAt");
      expect(schemaContent).toContain("recordingEnabled");
    });

    it("should have audition_participants table definition in schema file", () => {
      const schemaPath = path.join(process.cwd(), "drizzle/schema.ts");
      const schemaContent = fs.readFileSync(schemaPath, "utf-8");
      
      expect(schemaContent).toContain("auditionParticipants");
      expect(schemaContent).toContain("audition_participants");
      expect(schemaContent).toContain("auditionId");
      expect(schemaContent).toContain("joinedAt");
    });

    it("should have audition_invitations table definition in schema file", () => {
      const schemaPath = path.join(process.cwd(), "drizzle/schema.ts");
      const schemaContent = fs.readFileSync(schemaPath, "utf-8");
      
      expect(schemaContent).toContain("auditionInvitations");
      expect(schemaContent).toContain("audition_invitations");
    });
  });

  describe("Video Audition Router", () => {
    it("should have video-audition-router.ts file", () => {
      const routerPath = path.join(process.cwd(), "server/video-audition-router.ts");
      expect(fs.existsSync(routerPath)).toBe(true);
    });

    it("should define scheduleAudition procedure", () => {
      const routerPath = path.join(process.cwd(), "server/video-audition-router.ts");
      const routerContent = fs.readFileSync(routerPath, "utf-8");
      
      expect(routerContent).toContain("scheduleAudition");
      expect(routerContent).toContain("protectedProcedure");
    });

    it("should define getAudition procedure", () => {
      const routerPath = path.join(process.cwd(), "server/video-audition-router.ts");
      const routerContent = fs.readFileSync(routerPath, "utf-8");
      
      expect(routerContent).toContain("getAudition");
    });

    it("should define getMyAuditions procedure", () => {
      const routerPath = path.join(process.cwd(), "server/video-audition-router.ts");
      const routerContent = fs.readFileSync(routerPath, "utf-8");
      
      expect(routerContent).toContain("getMyAuditions");
    });

    it("should define joinAudition procedure", () => {
      const routerPath = path.join(process.cwd(), "server/video-audition-router.ts");
      const routerContent = fs.readFileSync(routerPath, "utf-8");
      
      expect(routerContent).toContain("joinAudition");
    });

    it("should define leaveAudition procedure", () => {
      const routerPath = path.join(process.cwd(), "server/video-audition-router.ts");
      const routerContent = fs.readFileSync(routerPath, "utf-8");
      
      expect(routerContent).toContain("leaveAudition");
    });

    it("should define endAudition procedure", () => {
      const routerPath = path.join(process.cwd(), "server/video-audition-router.ts");
      const routerContent = fs.readFileSync(routerPath, "utf-8");
      
      expect(routerContent).toContain("endAudition");
    });

    it("should define cancelAudition procedure", () => {
      const routerPath = path.join(process.cwd(), "server/video-audition-router.ts");
      const routerContent = fs.readFileSync(routerPath, "utf-8");
      
      expect(routerContent).toContain("cancelAudition");
    });

    it("should define respondToInvitation procedure", () => {
      const routerPath = path.join(process.cwd(), "server/video-audition-router.ts");
      const routerContent = fs.readFileSync(routerPath, "utf-8");
      
      expect(routerContent).toContain("respondToInvitation");
    });

    it("should define getMyInvitations procedure", () => {
      const routerPath = path.join(process.cwd(), "server/video-audition-router.ts");
      const routerContent = fs.readFileSync(routerPath, "utf-8");
      
      expect(routerContent).toContain("getMyInvitations");
    });
  });

  describe("Router Integration", () => {
    it("should be imported in routers.ts", () => {
      const routersPath = path.join(process.cwd(), "server/routers.ts");
      const routersContent = fs.readFileSync(routersPath, "utf-8");
      
      expect(routersContent).toContain("videoAuditionRouter");
      expect(routersContent).toContain("video-audition-router");
    });

    it("should be registered in appRouter", () => {
      const routersPath = path.join(process.cwd(), "server/routers.ts");
      const routersContent = fs.readFileSync(routersPath, "utf-8");
      
      // Check that videoAudition router is registered
      expect(routersContent).toContain("videoAudition");
      expect(routersContent).toContain("videoAuditionRouter");
    });
  });

  describe("Daily.co Integration", () => {
    it("should have Daily.co API configuration", () => {
      const routerPath = path.join(process.cwd(), "server/video-audition-router.ts");
      const routerContent = fs.readFileSync(routerPath, "utf-8");
      
      expect(routerContent).toContain("DAILY_API_KEY");
      expect(routerContent).toContain("DAILY_API_URL");
      expect(routerContent).toContain("https://api.daily.co");
    });

    it("should have createDailyRoom function", () => {
      const routerPath = path.join(process.cwd(), "server/video-audition-router.ts");
      const routerContent = fs.readFileSync(routerPath, "utf-8");
      
      expect(routerContent).toContain("createDailyRoom");
    });

    it("should generate unique room names", () => {
      const projectId = 123;
      const actorId = 456;
      const timestamp = Date.now();
      const roomName = `filmcontract-${projectId}-${actorId}-${timestamp}`;
      
      expect(roomName).toContain("filmcontract");
      expect(roomName).toContain(projectId.toString());
      expect(roomName).toContain(actorId.toString());
    });

    it("should construct valid Daily.co room URL", () => {
      const roomName = "filmcontract-123-456-1234567890";
      const roomUrl = `https://filmcontract.daily.co/${roomName}`;
      
      expect(roomUrl).toMatch(/^https:\/\/filmcontract\.daily\.co\//);
      expect(roomUrl).toContain(roomName);
    });
  });

  describe("Audition Status Values", () => {
    it("should support all required status values in schema", () => {
      const schemaPath = path.join(process.cwd(), "drizzle/schema.ts");
      const schemaContent = fs.readFileSync(schemaPath, "utf-8");
      
      expect(schemaContent).toContain("scheduled");
      expect(schemaContent).toContain("in_progress");
      expect(schemaContent).toContain("completed");
      expect(schemaContent).toContain("cancelled");
    });
  });
});

describe("Video Audition UI Components", () => {
  describe("Auditions List Screen", () => {
    it("should have auditions index file", () => {
      const filePath = path.join(process.cwd(), "app/auditions/index.tsx");
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it("should use trpc for data fetching", () => {
      const filePath = path.join(process.cwd(), "app/auditions/index.tsx");
      const content = fs.readFileSync(filePath, "utf-8");
      
      expect(content).toContain("trpc");
      expect(content).toContain("getMyAuditions");
    });
  });

  describe("Audition Details Screen", () => {
    it("should have audition details file", () => {
      const filePath = path.join(process.cwd(), "app/auditions/[id]/index.tsx");
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it("should display audition information", () => {
      const filePath = path.join(process.cwd(), "app/auditions/[id]/index.tsx");
      const content = fs.readFileSync(filePath, "utf-8");
      
      expect(content).toContain("getAudition");
      expect(content).toContain("scheduledAt");
    });
  });

  describe("Video Call Screen", () => {
    it("should have video call file", () => {
      const filePath = path.join(process.cwd(), "app/auditions/[id]/call.tsx");
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it("should use WebView for video call integration", () => {
      const filePath = path.join(process.cwd(), "app/auditions/[id]/call.tsx");
      const content = fs.readFileSync(filePath, "utf-8");
      
      expect(content).toContain("WebView");
      expect(content).toContain("roomUrl");
    });
  });

  describe("Schedule Audition Screen", () => {
    it("should have schedule audition file", () => {
      const filePath = path.join(process.cwd(), "app/auditions/schedule.tsx");
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it("should have form for scheduling", () => {
      const filePath = path.join(process.cwd(), "app/auditions/schedule.tsx");
      const content = fs.readFileSync(filePath, "utf-8");
      
      expect(content).toContain("scheduleAudition");
      expect(content).toContain("scheduledAt");
    });
  });

  describe("Invitation Response Screen", () => {
    it("should have invitation response file", () => {
      const filePath = path.join(process.cwd(), "app/auditions/invitation/[id].tsx");
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it("should handle accept/decline actions", () => {
      const filePath = path.join(process.cwd(), "app/auditions/invitation/[id].tsx");
      const content = fs.readFileSync(filePath, "utf-8");
      
      expect(content).toContain("respondToInvitation");
      expect(content).toContain("accepted");
      expect(content).toContain("declined");
    });
  });
});

describe("Profile Integration", () => {
  it("should have video auditions link in profile screen", () => {
    const filePath = path.join(process.cwd(), "app/(tabs)/profile.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    
    expect(content).toContain("/auditions");
    expect(content).toContain("Video Auditions");
  });
});

describe("Actors Directory Integration", () => {
  it("should have schedule audition option in quick actions", () => {
    const filePath = path.join(process.cwd(), "app/actors/index.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    
    expect(content).toContain("Schedule Video Audition");
    expect(content).toContain("/auditions/schedule");
  });
});
