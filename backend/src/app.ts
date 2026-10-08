import cors from "cors";
import express, { Router } from "express";
import type { HealthResponse, ReadyResponse } from "@qforge/shared";
import type { Pool } from "pg";
import { ApiError } from "./common/api-error.js";
import { sendSuccess } from "./common/response.js";
import type { AppConfig } from "./config/env.js";
import { createErrorHandler } from "./middleware/errors.js";
import type { ErrorLogger } from "./middleware/errors.js";
import { databaseReadRouter, publicRoomRouter } from "./modules/database-read.js";

export function createApp(config: AppConfig, options: {
  db?: Pool;
  apiRouter?: Router;
  errorLogger?: ErrorLogger;
} = {}) {
  const { db } = options;
  const app = express();
  app.disable("x-powered-by");
  app.use(cors({ origin: config.FRONTEND_ORIGINS }));
  app.use(express.json({ limit: "100kb" }));

  app.get("/health", (_request, response) => {
    const data: HealthResponse["data"] = { status: "ok", service: "qforge-api" };
    sendSuccess(response, data);
  });

  app.get("/ready", async (_request, response) => {
    if (!db) throw new ApiError("DB_UNAVAILABLE");
    try {
      await db.query("SELECT 1");
    } catch {
      throw new ApiError("DB_UNAVAILABLE");
    }
    const data: ReadyResponse["data"] = { status: "ready", database: "ok" };
    sendSuccess(response, data);
  });

  if (db) {
    app.use("/api/rooms", publicRoomRouter(db));
    // Teacher read APIs use a demo actor until authentication is implemented.
    if (config.NODE_ENV !== "production") app.use("/api/dev", databaseReadRouter(db));
  }
  app.use("/api", options.apiRouter ?? Router());

  app.use((_request, _response, next) => {
    next(new ApiError("NOT_FOUND", { message: "Endpoint not found." }));
  });
  app.use(createErrorHandler(options.errorLogger));
  return app;
}
