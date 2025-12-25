import { describe, expect, it } from "vitest";
import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number, userRole: "producer" | "actor"): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `user${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
    userRole: userRole,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("contracts.update", () => {
  it("allows producer to update their own contract", async () => {
    const { ctx } = createAuthContext(1, "producer");
    const caller = appRouter.createCaller(ctx);

    // First create a contract
    const createResult = await caller.contracts.create({
      projectTitle: "Original Title",
      actorId: 2,
      paymentTerms: "Original terms",
      status: "active",
    });

    // Then update it
    const updateResult = await caller.contracts.update({
      id: createResult.id,
      projectTitle: "Updated Title",
      paymentTerms: "Updated payment terms",
    });

    expect(updateResult).toHaveProperty("success", true);
  });

  it("prevents non-producer from updating contract", async () => {
    const producerCtx = createAuthContext(1, "producer");
    const producerCaller = appRouter.createCaller(producerCtx.ctx);

    // Create contract as producer
    const createResult = await producerCaller.contracts.create({
      projectTitle: "Test Movie",
      actorId: 2,
      paymentTerms: "50% upfront",
      status: "active",
    });

    // Try to update as different user (actor)
    const actorCtx = createAuthContext(2, "actor");
    const actorCaller = appRouter.createCaller(actorCtx.ctx);

    await expect(
      actorCaller.contracts.update({
        id: createResult.id,
        projectTitle: "Hacked Title",
      })
    ).rejects.toThrow("Only the producer can edit this contract");
  });

  it("requires authentication", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.contracts.update({
        id: 1,
        projectTitle: "Updated Title",
      })
    ).rejects.toThrow();
  });
});
