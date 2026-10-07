import cors from "cors";
import express from "express";
import type { HealthResponse } from "@qforge/shared";
import type { AppConfig } from "./config/env.js";
import { errorHandler } from "./middleware/errors.js";

export function createApp(config: AppConfig) {
  const app = express();
  app.disable("x-powered-by");
  app.use(cors({ origin: config.FRONTEND_ORIGINS }));
  app.use(express.json({ limit: "100kb" }));

  app.get("/health", (_request, response) => {
    const body: HealthResponse = {
      success: true,
      data: { status: "ok", service: "qforge-api" },
    };
    response.json(body);
  });

  app.use((_request, response) => {
    response.status(404).json({
      success: false,
      error: { code: "NOT_FOUND", message: "Endpoint not found." },
    });
  });
  app.use(errorHandler);
  return app;
}
