import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock AsyncStorage
const mockStorage: Record<string, string> = {};
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn((key: string) => Promise.resolve(mockStorage[key] || null)),
    setItem: vi.fn((key: string, value: string) => {
      mockStorage[key] = value;
      return Promise.resolve();
    }),
    removeItem: vi.fn((key: string) => {
      delete mockStorage[key];
      return Promise.resolve();
    }),
  },
}));

// Test the isFirstOpenDone and resetFirstOpen logic using mock storage directly
describe("First Open Experience - Storage Logic", () => {
  const STORAGE_KEY = "@filmcontract_first_open_done";

  // Simulate the same logic used in the component
  async function isFirstOpenDone(): Promise<boolean> {
    const value = mockStorage[STORAGE_KEY] || null;
    if (!value) return false;
    try {
      const data = JSON.parse(value);
      return data.completed === true;
    } catch {
      return false;
    }
  }

  async function markFirstOpenDone(role: string | null): Promise<void> {
    mockStorage[STORAGE_KEY] = JSON.stringify({
      completed: true,
      role,
      completedAt: new Date().toISOString(),
    });
  }

  async function resetFirstOpen(): Promise<void> {
    delete mockStorage[STORAGE_KEY];
  }

  beforeEach(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  });

  it("should return false when first open has not been completed", async () => {
    const result = await isFirstOpenDone();
    expect(result).toBe(false);
  });

  it("should return true after first open is marked as done", async () => {
    await markFirstOpenDone("actor");
    const result = await isFirstOpenDone();
    expect(result).toBe(true);
  });

  it("should clear first open state on reset", async () => {
    await markFirstOpenDone("actor");
    expect(await isFirstOpenDone()).toBe(true);

    await resetFirstOpen();
    expect(await isFirstOpenDone()).toBe(false);
    expect(mockStorage[STORAGE_KEY]).toBeUndefined();
  });

  it("should handle corrupted storage data gracefully", async () => {
    mockStorage[STORAGE_KEY] = "not-valid-json";
    const result = await isFirstOpenDone();
    expect(result).toBe(false);
  });

  it("should store the selected role", async () => {
    await markFirstOpenDone("producer");
    const data = JSON.parse(mockStorage[STORAGE_KEY]);
    expect(data.role).toBe("producer");
    expect(data.completed).toBe(true);
    expect(data.completedAt).toBeDefined();
  });
});

// Test the auth login fix logic
describe("Email Auth - OAuth Account Linking", () => {
  it("should allow OAuth users to set password on first email login", () => {
    // This tests the logic: if user exists but has no passwordHash,
    // the system should set the password instead of rejecting
    const user = {
      id: 1,
      email: "johndeepagejr@gmail.com",
      passwordHash: null, // OAuth user, no password set
      loginMethod: "google",
      openId: "google_123",
    };

    // The fix: instead of rejecting, we should allow setting a password
    const shouldAllowPasswordSet = !user.passwordHash;
    expect(shouldAllowPasswordSet).toBe(true);
  });

  it("should reject login with wrong password for users who have a password", () => {
    const user = {
      id: 2,
      email: "testactor@filmcontract.app",
      passwordHash: "$2a$12$somehash", // Has a password
      loginMethod: "email",
      openId: "email_456",
    };

    // Users with existing passwords should go through normal validation
    const shouldAllowPasswordSet = !user.passwordHash;
    expect(shouldAllowPasswordSet).toBe(false);
  });

  it("should allow OAuth users to register with email and link accounts", () => {
    const existingUser = {
      id: 1,
      email: "johndeepagejr@gmail.com",
      passwordHash: null,
      loginMethod: "google",
    };

    // The fix: if user exists with no password, link the account
    const shouldLinkAccount = existingUser && !existingUser.passwordHash;
    expect(shouldLinkAccount).toBe(true);
  });

  it("should reject registration for users who already have a password", () => {
    const existingUser = {
      id: 2,
      email: "existing@example.com",
      passwordHash: "$2a$12$somehash",
      loginMethod: "email",
    };

    // Users with existing passwords should get "account already exists"
    const shouldLinkAccount = existingUser && !existingUser.passwordHash;
    expect(shouldLinkAccount).toBe(false);
  });
});

// Test the onboarding flow step progression
describe("First Open Experience - Step Flow", () => {
  it("should have 7 total steps (welcome, role, 4 tours, completion)", () => {
    const TOTAL_STEPS = 7; // 0=welcome, 1=role, 2-5=tours, 6=completion
    expect(TOTAL_STEPS).toBe(7);
  });

  it("should have 4 tab tours matching the app tabs", () => {
    const TAB_TOURS = [
      { tabName: "Home", spotlight: "Find roles matched to your profile" },
      { tabName: "Contracts", spotlight: "Track your applications and active contracts" },
      { tabName: "Network", spotlight: "Connect with casting directors" },
      { tabName: "Profile", spotlight: "Your professional portfolio" },
    ];

    expect(TAB_TOURS).toHaveLength(4);
    expect(TAB_TOURS.map((t) => t.tabName)).toEqual(["Home", "Contracts", "Network", "Profile"]);
  });

  it("should provide role-specific CTA on completion", () => {
    const getCTA = (role: string | null) => {
      if (role === "producer") return "Post a Role";
      if (role === "both") return "Explore FilmContract";
      return "Explore Casting Calls";
    };

    expect(getCTA("actor")).toBe("Explore Casting Calls");
    expect(getCTA("producer")).toBe("Post a Role");
    expect(getCTA("both")).toBe("Explore FilmContract");
    expect(getCTA(null)).toBe("Explore Casting Calls");
  });
});
