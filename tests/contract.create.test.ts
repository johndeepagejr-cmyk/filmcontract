import { describe, expect, it } from "vitest";
import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userRole: "producer" | "actor"): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-producer",
    email: "producer@example.com",
    name: "Test Producer",
    loginMethod: "manus",
    role: "user",
    userRole: userRole,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
      pushToken: null,
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

describe("contracts.create", () => {
  it("creates a contract with valid data", async () => {
    const { ctx } = createAuthContext("producer");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.contracts.create({
      projectTitle: "Test Movie",
      actorId: 2,
      paymentTerms: "50% upfront, 50% on completion",
      paymentAmount: "100000",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      deliverables: "Lead role performance",
      status: "active",
    });

    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("success", true);
    expect(typeof result.id).toBe("number");
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
      caller.contracts.create({
        projectTitle: "Test Movie",
        actorId: 2,
        paymentTerms: "50% upfront, 50% on completion",
        status: "active",
      })
    ).rejects.toThrow();
  });
});
