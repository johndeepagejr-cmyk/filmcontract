import { eq, or, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, contracts, InsertContract, Contract, contractHistory, InsertContractHistory, contractVersions, InsertContractVersion, actorProfiles, actorPhotos, actorFilms, InsertActorProfile, InsertActorPhoto, InsertActorFilm } from "../drizzle/schema";
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
 * Update contract details and save version history
 */
export async function updateContract(
  contractId: number,
  data: Partial<InsertContract>,
  userId: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get current contract data to save as version
  const currentContract = await getContractById(contractId);
  if (currentContract) {
    // Get the latest version number
    const versions = await db
      .select()
      .from(contractVersions)
      .where(eq(contractVersions.contractId, contractId))
      .orderBy(desc(contractVersions.versionNumber));
    
    const nextVersionNumber = versions.length > 0 ? versions[0].versionNumber + 1 : 1;
    
    // Save current state as a version
    await db.insert(contractVersions).values({
      contractId,
      versionNumber: nextVersionNumber,
      projectTitle: currentContract.projectTitle,
      actorId: currentContract.actorId,
      paymentTerms: currentContract.paymentTerms,
      paymentAmount: currentContract.paymentAmount,
      startDate: currentContract.startDate,
      endDate: currentContract.endDate,
      deliverables: currentContract.deliverables,
      status: currentContract.status,
      editedBy: userId,
    });
  }
  
  // Update the contract
  await db.update(contracts).set(data).where(eq(contracts.id, contractId));
}

/**
 * Get all versions of a contract
 */
export async function getContractVersions(contractId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(contractVersions)
    .where(eq(contractVersions.contractId, contractId))
    .orderBy(desc(contractVersions.versionNumber));
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
 * Add contract history event
 */
export async function addContractHistory(
  contractId: number,
  userId: number,
  eventType: "created" | "edited" | "status_changed" | "payment_received",
  eventDescription: string,
  metadata?: any
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(contractHistory).values({
    contractId,
    userId,
    eventType,
    eventDescription,
    metadata: metadata ? JSON.stringify(metadata) : null,
  });
}

/**
 * Get contract history
 */
export async function getContractHistory(contractId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(contractHistory)
    .where(eq(contractHistory.contractId, contractId))
    .orderBy(desc(contractHistory.createdAt));
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

/**
 * Actor Profile Management Functions
 */

/**
 * Get actor profile by user ID
 */
export async function getActorProfile(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(actorProfiles)
    .where(eq(actorProfiles.userId, userId))
    .limit(1);

  if (result.length === 0) return null;

  const profile = result[0];
  
  // Parse specialties JSON if it exists
  const parsedProfile: any = { ...profile };
  if (profile.specialties) {
    try {
      parsedProfile.specialties = JSON.parse(profile.specialties as string);
    } catch (e) {
      parsedProfile.specialties = [];
    }
  }

  return parsedProfile;

}

/**
 * Create or update actor profile
 */
export async function upsertActorProfile(
  userId: number,
  data: {
    bio?: string;
    location?: string;
    yearsExperience?: number;
    specialties?: string[];
    profilePhotoUrl?: string;
    coverPhotoUrl?: string;
    height?: string;
    weight?: string;
    eyeColor?: string;
    hairColor?: string;
    website?: string;
    imdbUrl?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Convert specialties array to JSON string
  const profileData: any = { ...data };
  if (data.specialties) {
    profileData.specialties = JSON.stringify(data.specialties);
  }

  const values: InsertActorProfile = {
    userId,
    ...profileData,
  };

  await db
    .insert(actorProfiles)
    .values(values)
    .onDuplicateKeyUpdate({
      set: profileData,
    });

  return getActorProfile(userId);
}

/**
 * Get actor's photos
 */
export async function getActorPhotos(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(actorPhotos)
    .where(eq(actorPhotos.userId, userId))
    .orderBy(actorPhotos.displayOrder, actorPhotos.createdAt);
}

/**
 * Add photo to actor's portfolio
 */
export async function addActorPhoto(userId: number, data: Omit<InsertActorPhoto, 'userId'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(actorPhotos).values({
    userId,
    ...data,
  });

  return result[0].insertId;
}

/**
 * Delete actor photo
 */
export async function deleteActorPhoto(photoId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(actorPhotos)
    .where(and(eq(actorPhotos.id, photoId), eq(actorPhotos.userId, userId)));
}

/**
 * Get actor's filmography
 */
export async function getActorFilms(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(actorFilms)
    .where(eq(actorFilms.userId, userId))
    .orderBy(desc(actorFilms.year), actorFilms.displayOrder);
}

/**
 * Add film to actor's filmography
 */
export async function addActorFilm(userId: number, data: Omit<InsertActorFilm, 'userId'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(actorFilms).values({
    userId,
    ...data,
  });

  return result[0].insertId;
}

/**
 * Update film in actor's filmography
 */
export async function updateActorFilm(
  filmId: number,
  userId: number,
  data: Partial<InsertActorFilm>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(actorFilms)
    .set(data)
    .where(and(eq(actorFilms.id, filmId), eq(actorFilms.userId, userId)));
}

/**
 * Delete film from actor's filmography
 */
export async function deleteActorFilm(filmId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(actorFilms)
    .where(and(eq(actorFilms.id, filmId), eq(actorFilms.userId, userId)));
}
