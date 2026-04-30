/**
 * Image generation for Mantra
 * Uses the Forge proxy if configured, otherwise returns a helpful error.
 * Exposed via tRPC so the frontend can request images from chat context.
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { generateImage } from "../_core/imageGeneration";

export const imageRouter = router({
  generate: protectedProcedure
    .input(z.object({
      prompt: z.string().min(1).max(1000),
      originalImageUrl: z.string().url().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      try {
        const result = await generateImage({
          prompt: input.prompt,
          originalImages: input.originalImageUrl
            ? [{ url: input.originalImageUrl, mimeType: "image/jpeg" }]
            : undefined,
        });
        return { url: result.url ?? null, prompt: input.prompt };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Image generation failed",
        });
      }
    }),
});
