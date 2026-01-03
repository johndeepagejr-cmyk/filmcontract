import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { 
  actorProfiles, 
  actorSkills, 
  actorReels, 
  actorCredits, 
  actorUnions, 
  actorAvailability,
  producerProfiles,
  producerSpecialties
} from "@/drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Profiles router - handles detailed profile management for actors and producers
 */
export const profilesRouter = router({
  // Actor profile endpoints
  getActorProfile: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const database = getDb();
      const profile = await database
        .select()
        .from(actorProfiles)
        .where(eq(actorProfiles.userId, input.userId))
        .limit(1);
      return profile[0] || null;
    }),

  updateActorProfile: protectedProcedure
    .input(z.object({
      bio: z.string().optional(),
      height: z.string().optional(),
      weight: z.string().optional(),
      eyeColor: z.string().optional(),
      hairColor: z.string().optional(),
      ethnicity: z.string().optional(),
      age: z.number().optional(),
      ageRange: z.string().optional(),
      gender: z.enum(["male", "female", "non-binary", "other"]).optional(),
      location: z.string().optional(),
      baseLocation: z.string().optional(),
      willingToRelocate: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const database = getDb();
      await database
        .update(actorProfiles)
        .set(input)
        .where(eq(actorProfiles.userId, ctx.user.id));
      return { success: true };
    }),

  // Skills endpoints
  addSkill: protectedProcedure
    .input(z.object({
      skill: z.string(),
      proficiency: z.enum(["beginner", "intermediate", "advanced", "expert"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const database = getDb();
      await database.insert(actorSkills).values({
        userId: ctx.user.id,
        ...input,
      });
      return { success: true };
    }),

  getSkills: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const database = getDb();
      return database
        .select()
        .from(actorSkills)
        .where(eq(actorSkills.userId, input.userId));
    }),

  // Reels endpoints
  addReel: protectedProcedure
    .input(z.object({
      title: z.string(),
      description: z.string().optional(),
      videoUrl: z.string(),
      duration: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const database = getDb();
      await database.insert(actorReels).values({
        userId: ctx.user.id,
        ...input,
      });
      return { success: true };
    }),

  getReels: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const database = getDb();
      return database
        .select()
        .from(actorReels)
        .where(eq(actorReels.userId, input.userId))
        .orderBy(actorReels.createdAt);
    }),

  // Credits endpoints
  addCredit: protectedProcedure
    .input(z.object({
      title: z.string(),
      role: z.string(),
      creditType: z.enum(["film", "tv", "theater", "commercial", "web"]),
      year: z.number().optional(),
      director: z.string().optional(),
      description: z.string().optional(),
      imdbUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const database = getDb();
      await database.insert(actorCredits).values({
        userId: ctx.user.id,
        ...input,
      });
      return { success: true };
    }),

  getCredits: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const database = getDb();
      return database
        .select()
        .from(actorCredits)
        .where(eq(actorCredits.userId, input.userId))
        .orderBy(actorCredits.year);
    }),

  // Unions endpoints
  addUnion: protectedProcedure
    .input(z.object({
      union: z.enum(["SAG-AFTRA", "EQUITY", "AGVA", "OTHER"]),
      membershipNumber: z.string().optional(),
      joinDate: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const database = getDb();
      await database.insert(actorUnions).values({
        userId: ctx.user.id,
        ...input,
      });
      return { success: true };
    }),

  getUnions: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const database = getDb();
      return database
        .select()
        .from(actorUnions)
        .where(eq(actorUnions.userId, input.userId));
    }),

  // Availability endpoints
  setAvailability: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
      availabilityStatus: z.enum(["available", "unavailable", "tentative"]),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const database = getDb();
      await database.insert(actorAvailability).values({
        userId: ctx.user.id,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        availabilityStatus: input.availabilityStatus,
        reason: input.reason,
      });
      return { success: true };
    }),

  getAvailability: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const database = getDb();
      return database
        .select()
        .from(actorAvailability)
        .where(eq(actorAvailability.userId, input.userId))
        .orderBy(actorAvailability.startDate);
    }),

  // Producer profile endpoints
  getProducerProfile: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const database = getDb();
      const profile = await database
        .select()
        .from(producerProfiles)
        .where(eq(producerProfiles.userId, input.userId))
        .limit(1);
      return profile[0] || null;
    }),

  updateProducerProfile: protectedProcedure
    .input(z.object({
      companyName: z.string().optional(),
      bio: z.string().optional(),
      location: z.string().optional(),
      website: z.string().optional(),
      yearsInIndustry: z.number().optional(),
      producerType: z.enum(["independent", "studio", "network", "agency", "other"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const database = getDb();
      await database
        .update(producerProfiles)
        .set(input)
        .where(eq(producerProfiles.userId, ctx.user.id));
      return { success: true };
    }),
});
