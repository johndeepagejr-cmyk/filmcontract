import { getDb } from "./db";
import { contracts, producerReviews, users } from "@/drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

export interface ProducerReputation {
  producerId: number;
  producerName: string;
  producerEmail: string | null;
  totalContracts: number;
  completedContracts: number;
  activeContracts: number;
  completionRate: number; // Percentage of contracts completed
  averageRating: number; // 0-5 stars
  totalReviews: number;
  onTimePaymentRate: number; // Percentage of reviews where payment was on time
  wouldWorkAgainRate: number; // Percentage of actors who would work again
  joinedDate: Date;
}

/**
 * Calculate comprehensive reputation stats for a producer
 */
export async function getProducerReputation(producerId: number): Promise<ProducerReputation | null> {
  const db = await getDb();
  if (!db) return null;

  // Get producer info
  const producer = await db.select().from(users).where(eq(users.id, producerId)).limit(1);
  if (!producer[0]) return null;

  // Get contract stats
  const allContracts = await db
    .select()
    .from(contracts)
    .where(eq(contracts.producerId, producerId));

  const totalContracts = allContracts.length;
  const completedContracts = allContracts.filter((c) => c.status === "completed").length;
  const activeContracts = allContracts.filter((c) => c.status === "active").length;
  const completionRate = totalContracts > 0 ? (completedContracts / totalContracts) * 100 : 0;

  // Get review stats
  const reviews = await db
    .select()
    .from(producerReviews)
    .where(eq(producerReviews.producerId, producerId));

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

  const onTimePayments = reviews.filter((r) => r.paymentOnTime).length;
  const onTimePaymentRate = totalReviews > 0 ? (onTimePayments / totalReviews) * 100 : 0;

  const wouldWorkAgain = reviews.filter((r) => r.wouldWorkAgain).length;
  const wouldWorkAgainRate = totalReviews > 0 ? (wouldWorkAgain / totalReviews) * 100 : 0;

  return {
    producerId,
    producerName: producer[0].name || "Unknown Producer",
    producerEmail: producer[0].email,
    totalContracts,
    completedContracts,
    activeContracts,
    completionRate: Math.round(completionRate),
    averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
    totalReviews,
    onTimePaymentRate: Math.round(onTimePaymentRate),
    wouldWorkAgainRate: Math.round(wouldWorkAgainRate),
    joinedDate: producer[0].createdAt,
  };
}

/**
 * Get all reviews for a producer
 */
export async function getProducerReviews(producerId: number) {
  const db = await getDb();
  if (!db) return [];

  const reviews = await db
    .select({
      id: producerReviews.id,
      rating: producerReviews.rating,
      review: producerReviews.review,
      paymentOnTime: producerReviews.paymentOnTime,
      wouldWorkAgain: producerReviews.wouldWorkAgain,
      createdAt: producerReviews.createdAt,
      actorId: producerReviews.actorId,
      contractId: producerReviews.contractId,
    })
    .from(producerReviews)
    .where(eq(producerReviews.producerId, producerId))
    .orderBy(sql`${producerReviews.createdAt} DESC`);

  // Get actor names for each review
  const reviewsWithActors = await Promise.all(
    reviews.map(async (review) => {
      const actor = await db.select().from(users).where(eq(users.id, review.actorId)).limit(1);
      const contract = await db
        .select()
        .from(contracts)
        .where(eq(contracts.id, review.contractId))
        .limit(1);

      return {
        ...review,
        actorName: actor[0]?.name || "Anonymous Actor",
        projectTitle: contract[0]?.projectTitle || "Unknown Project",
      };
    })
  );

  return reviewsWithActors;
}

/**
 * Create a new review for a producer
 */
export async function createProducerReview(data: {
  producerId: number;
  actorId: number;
  contractId: number;
  rating: number;
  review?: string;
  paymentOnTime: boolean;
  wouldWorkAgain: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if actor already reviewed this contract
  const existing = await db
    .select()
    .from(producerReviews)
    .where(
      and(
        eq(producerReviews.contractId, data.contractId),
        eq(producerReviews.actorId, data.actorId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    throw new Error("You have already reviewed this contract");
  }

  // Verify the contract exists and actor is part of it
  const contract = await db
    .select()
    .from(contracts)
    .where(eq(contracts.id, data.contractId))
    .limit(1);

  if (!contract[0]) {
    throw new Error("Contract not found");
  }

  if (contract[0].actorId !== data.actorId) {
    throw new Error("You are not authorized to review this contract");
  }

  // Create the review
  await db.insert(producerReviews).values({
    producerId: data.producerId,
    actorId: data.actorId,
    contractId: data.contractId,
    rating: data.rating,
    review: data.review,
    paymentOnTime: data.paymentOnTime,
    wouldWorkAgain: data.wouldWorkAgain,
  });

  return { success: true };
}

/**
 * Get list of all producers with their basic reputation stats
 */
export async function getAllProducersWithReputation() {
  const db = await getDb();
  if (!db) return [];

  const allProducers = await db
    .select()
    .from(users)
    .where(eq(users.userRole, "producer"));

  const producersWithReputation = await Promise.all(
    allProducers.map(async (producer) => {
      const reputation = await getProducerReputation(producer.id);
      return reputation;
    })
  );

  return producersWithReputation.filter((p) => p !== null);
}
