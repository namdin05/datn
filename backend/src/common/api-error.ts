import type { ApiErrorCode, ValidationIssue } from "@qforge/shared";

const definitions = {
  INVALID_INPUT: { status: 400, message: "Request data is invalid." },
  INVALID_JSON: { status: 400, message: "Request body must be valid JSON." },
  UNAUTHORIZED: { status: 401, message: "Authentication is required." },
  FORBIDDEN: { status: 403, message: "This action is not allowed." },
  NOT_FOUND: { status: 404, message: "Resource not found." },
  CONFLICT: { status: 409, message: "This action conflicts with the current state." },
  PAYLOAD_TOO_LARGE: { status: 413, message: "Request body exceeds the size limit." },
  UNSUPPORTED_MEDIA_TYPE: { status: 415, message: "Request body encoding is not supported." },
  INTERNAL_ERROR: { status: 500, message: "An unexpected error occurred." },
} satisfies Record<ApiErrorCode, { status: number; message: string }>;

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly statusCode: number;
  readonly details?: ValidationIssue[];

  constructor(code: ApiErrorCode, options: {
    message?: string;
    details?: ValidationIssue[];
  } = {}) {
    super(options.message ?? definitions[code].message);
    this.name = "ApiError";
    this.code = code;
    this.statusCode = definitions[code].status;
    this.details = options.details;
  }
}
