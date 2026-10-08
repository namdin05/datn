import cors from "cors";
import express, { Router } from "express";
import type { HealthResponse } from "@qforge/shared";
import { ApiError } from "./common/api-error.js";
import { sendSuccess } from "./common/response.js";
import type { AppConfig } from "./config/env.js";
import { createErrorHandler } from "./middleware/errors.js";
import type { ErrorLogger } from "./middleware/errors.js";

export function createApp(config: AppConfig, options: {
  apiRouter?: Router;
  errorLogger?: ErrorLogger;
} = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.use(cors({ origin: config.FRONTEND_ORIGINS }));
  app.use(express.json({ limit: "100kb" }));

  app.get("/health", (_request, response) => {
    const data: HealthResponse["data"] = { status: "ok", service: "qforge-api" };
    sendSuccess(response, data);
  });

  app.use("/api", options.apiRouter ?? Router());

  app.use((_request, _response, next) => {
    next(new ApiError("NOT_FOUND", { message: "Endpoint not found." }));
  });
  app.use(createErrorHandler(options.errorLogger));
  return app;
}
