import { getDb } from "./db";
import { contracts, actorReviews, users, actorProfiles } from "@/drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

export interface ActorReputation {
  actorId: number;
  actorName: string;
  actorEmail: string | null;
  totalContracts: number;
  completedContracts: number;
  activeContracts: number;
  completionRate: number;
  averageRating: number; // 0-5 stars
  professionalismRating: number; // 0-5 stars
  reliabilityRating: number; // 0-5 stars
  totalReviews: number;
  wouldHireAgainRate: number; // Percentage
  joinedDate: Date;
  // Profile fields
  profilePhotoUrl?: string | null;
  location?: string | null;
  specialties?: string[] | null;
  yearsExperience?: number | null;
  bio?: string | null;
}

/**
 * Calculate comprehensive reputation stats for an actor
 */
export async function getActorReputation(actorId: number): Promise<ActorReputation | null> {
  const db = await getDb();
  if (!db) return null;

  // Get actor info
  const actor = await db.select().from(users).where(eq(users.id, actorId)).limit(1);
  if (!actor[0]) return null;

  // Get actor profile
  const profile = await db
    .select()
    .from(actorProfiles)
    .where(eq(actorProfiles.userId, actorId))
    .limit(1);

  // Get contract stats
  const allContracts = await db
    .select()
    .from(contracts)
    .where(eq(contracts.actorId, actorId));

  const totalContracts = allContracts.length;
  const completedContracts = allContracts.filter((c) => c.status === "completed").length;
  const activeContracts = allContracts.filter((c) => c.status === "active").length;
  const completionRate = totalContracts > 0 ? (completedContracts / totalContracts) * 100 : 0;

  // Get review stats
  const reviews = await db
    .select()
    .from(actorReviews)
    .where(eq(actorReviews.actorId, actorId));

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

  const professionalismRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.professionalismRating, 0) / totalReviews
      : 0;

  const reliabilityRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.reliabilityRating, 0) / totalReviews
      : 0;

  const wouldHireAgain = reviews.filter((r) => r.wouldHireAgain).length;
  const wouldHireAgainRate = totalReviews > 0 ? (wouldHireAgain / totalReviews) * 100 : 0;

  return {
    actorId: actor[0].id,
    actorName: actor[0].name || "Unknown Actor",
    actorEmail: actor[0].email,
    totalContracts,
    completedContracts,
    activeContracts,
    completionRate: Math.round(completionRate),
    averageRating,
    professionalismRating,
    reliabilityRating,
    totalReviews,
    wouldHireAgainRate: Math.round(wouldHireAgainRate),
    joinedDate: actor[0].createdAt,
    // Profile fields
    profilePhotoUrl: profile[0]?.profilePhotoUrl,
    location: profile[0]?.location,
    specialties: profile[0]?.specialties as string[] | null,
    yearsExperience: profile[0]?.yearsExperience,
    bio: profile[0]?.bio,
  };
}

/**
 * Get all reviews for an actor
 */
export async function getActorReviews(actorId: number) {
  const db = await getDb();
  if (!db) return [];

  const reviews = await db
    .select({
      id: actorReviews.id,
      rating: actorReviews.rating,
      review: actorReviews.review,
      professionalismRating: actorReviews.professionalismRating,
      reliabilityRating: actorReviews.reliabilityRating,
      wouldHireAgain: actorReviews.wouldHireAgain,
      createdAt: actorReviews.createdAt,
      producerId: actorReviews.producerId,
      contractId: actorReviews.contractId,
    })
    .from(actorReviews)
    .where(eq(actorReviews.actorId, actorId))
    .orderBy(sql`${actorReviews.createdAt} DESC`);

  // Get producer names for each review
  const reviewsWithProducers = await Promise.all(
    reviews.map(async (review) => {
      const producer = await db.select().from(users).where(eq(users.id, review.producerId)).limit(1);
      const contract = await db
        .select()
        .from(contracts)
        .where(eq(contracts.id, review.contractId))
        .limit(1);

      return {
        ...review,
        producerName: producer[0]?.name || "Anonymous Producer",
        projectTitle: contract[0]?.projectTitle || "Unknown Project",
      };
    })
  );

  return reviewsWithProducers;
}

/**
 * Create a new review for an actor
 */
export async function createActorReview(data: {
  actorId: number;
  producerId: number;
  contractId: number;
  rating: number;
  review?: string;
  professionalismRating: number;
  reliabilityRating: number;
  wouldHireAgain: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if producer already reviewed this contract
  const existing = await db
    .select()
    .from(actorReviews)
    .where(
      and(
        eq(actorReviews.contractId, data.contractId),
        eq(actorReviews.producerId, data.producerId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    throw new Error("You have already reviewed this actor for this contract");
  }

  // Verify the contract exists and producer is part of it
  const contract = await db
    .select()
    .from(contracts)
    .where(eq(contracts.id, data.contractId))
    .limit(1);

  if (!contract[0]) {
    throw new Error("Contract not found");
  }

  if (contract[0].producerId !== data.producerId) {
    throw new Error("You are not authorized to review this contract");
  }

  // Create the review
  await db.insert(actorReviews).values({
    actorId: data.actorId,
    producerId: data.producerId,
    contractId: data.contractId,
    rating: data.rating,
    review: data.review,
    professionalismRating: data.professionalismRating,
    reliabilityRating: data.reliabilityRating,
    wouldHireAgain: data.wouldHireAgain,
  });

  return { success: true };
}

/**
 * Get list of all actors with their basic reputation stats
 */
export async function getAllActorsWithReputation() {
  const db = await getDb();
  if (!db) return [];

  const allActors = await db
    .select()
    .from(users)
    .where(eq(users.userRole, "actor"));

  const actorsWithReputation = await Promise.all(
    allActors.map(async (actor) => {
      const reputation = await getActorReputation(actor.id);
      return reputation;
    })
  );

  return actorsWithReputation.filter((a) => a !== null);
}
