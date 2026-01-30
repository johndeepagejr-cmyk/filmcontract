import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { selfTapeTemplates, selfTapes } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Self-Tape Templates Router
 * Manages reusable templates for requesting self-tapes
 */

export const selfTapeTemplatesRouter = router({
  /**
   * Create a new template
   */
  createTemplate: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      projectTitle: z.string().min(1),
      roleDescription: z.string().optional(),
      characterName: z.string().optional(),
      requirements: z.string().optional(),
      suggestedDuration: z.number().optional(),
      requireSlate: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      // Verify user is a producer
      if (ctx.user.userRole !== "producer") {
        throw new Error("Only producers can create templates");
      }

      const [template] = await db.insert(selfTapeTemplates).values({
        producerId: userId,
        name: input.name,
        description: input.description,
        projectTitle: input.projectTitle,
        roleDescription: input.roleDescription,
        characterName: input.characterName,
        requirements: input.requirements,
        suggestedDuration: input.suggestedDuration,
        requireSlate: input.requireSlate,
      });

      return { id: (template as any).insertId };
    }),

  /**
   * Get all templates for a producer
   */
  getMyTemplates: protectedProcedure
    .input(z.object({
      includeInactive: z.boolean().default(false),
    }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      // Verify user is a producer
      if (ctx.user.userRole !== "producer") {
        throw new Error("Only producers can view templates");
      }

      let query = db
        .select()
        .from(selfTapeTemplates)
        .where(eq(selfTapeTemplates.producerId, userId));

      if (!input.includeInactive) {
        query = query.where(eq(selfTapeTemplates.isActive, true));
      }

      return query;
    }),

  /**
   * Get a specific template
   */
  getTemplate: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      const [template] = await db
        .select()
        .from(selfTapeTemplates)
        .where(eq(selfTapeTemplates.id, input.templateId));

      if (!template) {
        throw new Error("Template not found");
      }

      // Verify access
      if (template.producerId !== userId) {
        throw new Error("You don't have access to this template");
      }

      return template;
    }),

  /**
   * Update a template
   */
  updateTemplate: protectedProcedure
    .input(z.object({
      templateId: z.number(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      projectTitle: z.string().min(1).optional(),
      roleDescription: z.string().optional(),
      characterName: z.string().optional(),
      requirements: z.string().optional(),
      suggestedDuration: z.number().optional(),
      requireSlate: z.boolean().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      const [template] = await db
        .select()
        .from(selfTapeTemplates)
        .where(eq(selfTapeTemplates.id, input.templateId));

      if (!template) {
        throw new Error("Template not found");
      }

      if (template.producerId !== userId) {
        throw new Error("You don't have access to this template");
      }

      const { templateId, ...updateData } = input;
      await db
        .update(selfTapeTemplates)
        .set(updateData)
        .where(eq(selfTapeTemplates.id, templateId));

      return { success: true };
    }),

  /**
   * Delete a template
   */
  deleteTemplate: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      const [template] = await db
        .select()
        .from(selfTapeTemplates)
        .where(eq(selfTapeTemplates.id, input.templateId));

      if (!template) {
        throw new Error("Template not found");
      }

      if (template.producerId !== userId) {
        throw new Error("You don't have access to this template");
      }

      // Soft delete by marking as inactive
      await db
        .update(selfTapeTemplates)
        .set({ isActive: false })
        .where(eq(selfTapeTemplates.id, templateId));

      return { success: true };
    }),

  /**
   * Create self-tape from template
   */
  createFromTemplate: protectedProcedure
    .input(z.object({
      templateId: z.number(),
      videoUrl: z.string().url(),
      thumbnailUrl: z.string().url().optional(),
      durationSeconds: z.number().optional(),
      actorNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const userId = ctx.user.id;

      // Verify user is an actor
      if (ctx.user.userRole !== "actor") {
        throw new Error("Only actors can create self-tapes");
      }

      const [template] = await db
        .select()
        .from(selfTapeTemplates)
        .where(eq(selfTapeTemplates.id, input.templateId));

      if (!template) {
        throw new Error("Template not found");
      }

      // Create self-tape using template data
      const [selfTape] = await db.insert(selfTapes).values({
        actorId: userId,
        producerId: template.producerId,
        projectTitle: template.projectTitle,
        roleDescription: template.roleDescription,
        characterName: template.characterName,
        videoUrl: input.videoUrl,
        thumbnailUrl: input.thumbnailUrl,
        durationSeconds: input.durationSeconds,
        slateText: `${ctx.user.name || "Actor"} - ${template.characterName || template.projectTitle}`,
        slateEnabled: template.requireSlate,
        actorNotes: input.actorNotes,
        status: "submitted",
        submittedAt: new Date(),
      });

      // Increment template usage count
      await db
        .update(selfTapeTemplates)
        .set({ usageCount: template.usageCount + 1 })
        .where(eq(selfTapeTemplates.id, input.templateId));

      return { id: (selfTape as any).insertId };
    }),

  /**
   * Get templates by producer (for actors to browse)
   */
  getProducerTemplates: protectedProcedure
    .input(z.object({ producerId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();

      const templates = await db
        .select()
        .from(selfTapeTemplates)
        .where(
          and(
            eq(selfTapeTemplates.producerId, input.producerId),
            eq(selfTapeTemplates.isActive, true)
          )
        );

      return templates;
    }),
});
