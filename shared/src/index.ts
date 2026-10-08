import { z } from "zod";

export * from "./api.js";

export const healthResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    status: z.literal("ok"),
    service: z.literal("qforge-api"),
  }),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
