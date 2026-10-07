import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, next) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  const errorType = error && typeof error === "object" && "type" in error
    ? error.type : undefined;
  if (errorType === "entity.parse.failed") {
    response.status(400).json({
      success: false,
      error: { code: "INVALID_JSON", message: "Request body must be valid JSON." },
    });
    return;
  }
  if (errorType === "entity.too.large") {
    response.status(413).json({
      success: false,
      error: { code: "PAYLOAD_TOO_LARGE", message: "Request body exceeds the size limit." },
    });
    return;
  }

  console.error("Unhandled request error", error);
  response.status(500).json({
    success: false,
    error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." },
  });
};
