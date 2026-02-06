import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export const profilePictureRouter = router({
  /**
   * Upload or update actor profile picture
   * Accepts base64 encoded image data
   */
  uploadProfilePicture: protectedProcedure
    .input(
      z.object({
        imageData: z.string().describe("Base64 encoded image data"),
        fileName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const database = await getDb();
      if (!database) throw new Error("Database not available");

      // In a real app, you'd upload to S3 or similar
      // For now, we'll store the base64 data directly
      const profilePictureUrl = `data:image/jpeg;base64,${input.imageData}`;

      await database
        .update(users)
        .set({
          profilePictureUrl,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      return {
        success: true,
        profilePictureUrl,
        message: "Profile picture updated successfully",
      };
    }),

  /**
   * Get user profile picture URL
   */
  getProfilePicture: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database not available");
      
      const user = await database.query.users.findFirst({
        where: eq(users.id, input.userId),
      });

      return {
        profilePictureUrl: user?.profilePictureUrl || null,
        hasProfilePicture: !!user?.profilePictureUrl,
      };
    }),

  /**
   * Remove profile picture
   */
  removeProfilePicture: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user.id;
    const database = await getDb();
    if (!database) throw new Error("Database not available");

    await database
      .update(users)
      .set({
        profilePictureUrl: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return {
      success: true,
      message: "Profile picture removed",
    };
  }),
});
