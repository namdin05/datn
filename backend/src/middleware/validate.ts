import type { RequestPart, ValidationIssue } from "@qforge/shared";
import type { Request, RequestHandler } from "express";
import { z } from "zod";
import { ApiError } from "../common/api-error.js";

export type RequestSchemas = Partial<Record<RequestPart, z.ZodType>>;

export type ValidatedRequest<S extends RequestSchemas> = {
  [K in keyof S]: S[K] extends z.ZodType ? z.output<S[K]> : never;
};

export type ValidatedRequestHandler<S extends RequestSchemas> = RequestHandler<
  Request["params"],
  unknown,
  unknown,
  Request["query"],
  { validated: ValidatedRequest<S> }
>;

export function validateRequest<S extends RequestSchemas>(schemas: S): ValidatedRequestHandler<S> {
  return async (request, response, next) => {
    const parsed: Partial<Record<RequestPart, unknown>> = {};
    const details: ValidationIssue[] = [];
    const parts: RequestPart[] = ["body", "params", "query"];

    for (const source of parts) {
      const schema = schemas[source];
      if (!schema) continue;

      const result = await schema.safeParseAsync(request[source]);
      if (result.success) {
        parsed[source] = result.data;
      } else {
        details.push(...result.error.issues.map((issue) => ({
          source,
          field: issue.path.length ? issue.path.map(String).join(".") : "$",
          message: issue.message,
        })));
      }
    }

    if (details.length) {
      next(new ApiError("INVALID_INPUT", { details }));
      return;
    }

    // Each configured schema has succeeded before exposing its parsed output.
    response.locals.validated = parsed as ValidatedRequest<S>;
    next();
  };
}
