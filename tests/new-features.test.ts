import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "../server/routers";
import { getDb } from "../server/db";
import type { User } from "../drizzle/schema";

describe("Photo Upload & Actor Search Features", () => {
  let testProducer: User;
  let testActor: User;

  beforeEach(async () => {
    // Create test users
    testProducer = {
      id: 1,
      openId: "test-producer-openid",
      email: "producer@test.com",
      name: "Test Producer",
      loginMethod: "google",
      role: "user",
      userRole: "producer",
      pushToken: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    testActor = {
      id: 2,
      openId: "test-actor-openid",
      email: "actor@test.com",
      name: "Test Actor",
      loginMethod: "google",
      role: "user",
      userRole: "actor",
      pushToken: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
  });

  it("should create actor profile with photo", async () => {
    const caller = appRouter.createCaller({ user: testActor });

    const profile = await caller.actorProfile.upsert({
      bio: "Experienced actor",
      location: "Los Angeles, CA",
      yearsExperience: 5,
      specialties: ["Drama", "Comedy"],
      profilePhotoUrl: "https://example.com/photo.jpg",
    });

    expect(profile).toBeDefined();
    expect(profile.profilePhotoUrl).toBe("https://example.com/photo.jpg");
    expect(profile.location).toBe("Los Angeles, CA");
  });

  it("should search actors by location", async () => {
    const caller = appRouter.createCaller({ user: testProducer });

    // Create actor profile first
    const actorCaller = appRouter.createCaller({ user: testActor });
    await actorCaller.actorProfile.upsert({
      bio: "Test actor",
      location: "New York, NY",
      yearsExperience: 3,
      specialties: ["Action"],
    });

    const results = await caller.actorProfile.searchActors({
      location: "New York",
    });

    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
  });

  it("should filter actors by specialties", async () => {
    const caller = appRouter.createCaller({ user: testProducer });

    const actorCaller = appRouter.createCaller({ user: testActor });
    await actorCaller.actorProfile.upsert({
      bio: "Test actor",
      location: "Los Angeles, CA",
      yearsExperience: 5,
      specialties: ["Drama", "Thriller"],
    });

    const results = await caller.actorProfile.searchActors({
      specialties: ["Drama"],
    });

    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
  });
});

describe("Contract Templates", () => {
  let testProducer: User;

  beforeEach(async () => {
    testProducer = {
      id: 1,
      openId: "test-producer-openid",
      email: "producer@test.com",
      name: "Test Producer",
      loginMethod: "google",
      role: "user",
      userRole: "producer",
      pushToken: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
  });

  it("should list contract templates", async () => {
    const caller = appRouter.createCaller({ user: testProducer });

    const templates = await caller.templates.list();

    expect(templates).toBeDefined();
    expect(Array.isArray(templates)).toBe(true);
    expect(templates.length).toBeGreaterThan(0);
  });

  it("should have system templates with correct fields", async () => {
    const caller = appRouter.createCaller({ user: testProducer });

    const templates = await caller.templates.list();
    const systemTemplate = templates.find((t) => t.isSystemTemplate);

    expect(systemTemplate).toBeDefined();
    expect(systemTemplate?.name).toBeDefined();
    expect(systemTemplate?.defaultPaymentTerms).toBeDefined();
    expect(systemTemplate?.defaultDeliverables).toBeDefined();
  });
});

describe("Push Notifications", () => {
  let testActor: User;

  beforeEach(async () => {
    testActor = {
      id: 2,
      openId: "test-actor-openid",
      email: "actor@test.com",
      name: "Test Actor",
      loginMethod: "google",
      role: "user",
      userRole: "actor",
      pushToken: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
  });

  it("should register push token", async () => {
    const caller = appRouter.createCaller({ user: testActor } as any);

    const result = await caller.notifications.registerToken({
      pushToken: "ExponentPushToken[test-token-123]",
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it("should update existing push token", async () => {
    const caller = appRouter.createCaller({ user: testActor } as any);

    // Register first token
    await caller.notifications.registerToken({
      pushToken: "ExponentPushToken[test-token-1]",
    });

    // Update with new token
    const result = await caller.notifications.registerToken({
      pushToken: "ExponentPushToken[test-token-2]",
    });

    expect(result.success).toBe(true);
  });
});
