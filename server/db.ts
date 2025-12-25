import { eq, or, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, contracts, InsertContract, Contract } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get all contracts for a specific user (either as producer or actor)
 */
export async function getUserContracts(userId: number): Promise<Contract[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(contracts)
    .where(or(eq(contracts.producerId, userId), eq(contracts.actorId, userId)))
    .orderBy(desc(contracts.createdAt));
}

/**
 * Get a specific contract by ID
 */
export async function getContractById(contractId: number): Promise<Contract | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(contracts).where(eq(contracts.id, contractId)).limit(1);
  return result[0] || null;
}

/**
 * Create a new contract
 */
export async function createContract(data: InsertContract): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(contracts).values(data);
  return result[0].insertId;
}

/**
 * Update contract status
 */
export async function updateContractStatus(
  contractId: number,
  status: "draft" | "active" | "pending" | "completed" | "cancelled"
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(contracts).set({ status }).where(eq(contracts.id, contractId));
}

/**
 * Update user role (producer or actor)
 */
export async function updateUserRole(
  userId: number,
  userRole: "producer" | "actor"
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set({ userRole }).where(eq(users.id, userId));
}

/**
 * Get user by ID
 */
export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0] || null;
}

/**
 * Search users by role (for finding actors when creating contracts)
 */
export async function getUsersByRole(userRole: "producer" | "actor") {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(users).where(eq(users.userRole, userRole));
}

/**
 * Get contract with producer and actor details
 */
export async function getContractWithDetails(contractId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select({
      contract: contracts,
      producer: users,
    })
    .from(contracts)
    .leftJoin(users, eq(contracts.producerId, users.id))
    .where(eq(contracts.id, contractId))
    .limit(1);

  if (!result[0]) return null;

  // Get actor separately
  const actorResult = await db.select().from(users).where(eq(users.id, result[0].contract.actorId)).limit(1);

  return {
    ...result[0].contract,
    producer: result[0].producer,
    actor: actorResult[0] || null,
  };
}
