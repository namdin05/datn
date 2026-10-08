import type { ApiFailure, ApiSuccess } from "@qforge/shared";
import type { Response } from "express";
import type { ApiError } from "./api-error.js";

export function sendSuccess<T>(response: Response, data: T, status: 200 | 201 | 202 = 200) {
  const body: ApiSuccess<T> = { success: true, data };
  return response.status(status).json(body);
}

export function sendFailure(response: Response, error: ApiError) {
  const body: ApiFailure = {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
    },
  };
  return response.status(error.statusCode).json(body);
}
