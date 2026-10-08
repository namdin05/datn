import { z } from "zod";

export const apiErrorCodeSchema = z.enum([
  "INVALID_INPUT",
  "INVALID_JSON",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "PAYLOAD_TOO_LARGE",
  "UNSUPPORTED_MEDIA_TYPE",
  "INTERNAL_ERROR",
]);

export const requestPartSchema = z.enum(["body", "params", "query"]);

export const validationIssueSchema = z.object({
  field: z.string().min(1),
  message: z.string().min(1),
  source: requestPartSchema.optional(),
});

export const apiFailureSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: apiErrorCodeSchema,
    message: z.string().min(1),
    details: z.array(validationIssueSchema).optional(),
  }),
});

export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;
export type RequestPart = z.infer<typeof requestPartSchema>;
export type ValidationIssue = z.infer<typeof validationIssueSchema>;
export type ApiFailure = z.infer<typeof apiFailureSchema>;
export type ApiSuccess<T> = { success: true; data: T };
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export function createApiResponseSchema<T extends z.ZodType>(dataSchema: T) {
  return z.discriminatedUnion("success", [
    z.object({ success: z.literal(true), data: dataSchema }),
    apiFailureSchema,
  ]);
}
