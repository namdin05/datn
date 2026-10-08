import type { ErrorRequestHandler } from "express";
import { ApiError } from "../common/api-error.js";
import { sendFailure } from "../common/response.js";

export type ErrorLogger = (error: unknown) => void;

function bodyParserError(error: unknown): ApiError | undefined {
  if (!error || typeof error !== "object" || !("type" in error) || !("status" in error)) {
    return undefined;
  }

  if (error.type === "entity.parse.failed" && error.status === 400) {
    return new ApiError("INVALID_JSON");
  }
  if (error.type === "entity.too.large" && error.status === 413) {
    return new ApiError("PAYLOAD_TOO_LARGE");
  }
  if ((error.type === "charset.unsupported" || error.type === "encoding.unsupported") && error.status === 415) {
    return new ApiError("UNSUPPORTED_MEDIA_TYPE");
  }
  return undefined;
}

export function createErrorHandler(logError: ErrorLogger = (error) => {
  console.error("Unhandled request error", error);
}): ErrorRequestHandler {
  return (error: unknown, _request, response, next) => {
    if (response.headersSent) {
      next(error);
      return;
    }

    const knownError = error instanceof ApiError ? error : bodyParserError(error);
    if (knownError && knownError.code !== "INTERNAL_ERROR") {
      sendFailure(response, knownError);
      return;
    }

    logError(error);
    sendFailure(response, new ApiError("INTERNAL_ERROR"));
  };
}
