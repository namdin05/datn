import cors from "cors";
import express, { Router } from "express";
import type { HealthResponse, ReadyResponse } from "@qforge/shared";
import type { Pool } from "pg";
import { ApiError } from "./common/api-error.js";
import { sendSuccess } from "./common/response.js";
import type { AppConfig } from "./config/env.js";
import { createErrorHandler } from "./middleware/errors.js";
import type { ErrorLogger } from "./middleware/errors.js";
import { databaseReadRouter } from "./modules/database-read.js";
import { createTeacherVerifier } from './auth/teacher.js';
import type { VerifyTeacherToken } from './auth/teacher.js';
import { ParticipantTokens } from './auth/participant.js';
import { createServices } from './modules/application.js';
import { apiRouter } from './modules/api.routes.js';
import { publicRoomRouter } from './modules/reporting/report.routes.js';
import { requireTeacher } from './auth/teacher.js';
import type { SessionEvents } from './modules/session-events.js';

// Auth adapters and services shared by the REST app and the Socket.IO adapter.
export function createBackendRuntime(config: AppConfig, db: Pool, options: { verifyTeacherToken?: VerifyTeacherToken; events?: SessionEvents } = {}) {
  const verify = options.verifyTeacherToken ?? (config.SUPABASE_URL ? createTeacherVerifier(config.SUPABASE_URL) : undefined);
  const credentials = config.PARTICIPANT_TOKEN_HASH_SECRET ? new ParticipantTokens(config.PARTICIPANT_TOKEN_HASH_SECRET, config.PARTICIPANT_TOKEN_TTL_SECONDS) : undefined;
  return { db, verify, credentials, services: createServices(db, credentials, options.events) };
}
export type BackendRuntime = ReturnType<typeof createBackendRuntime>;

export function createApp(config: AppConfig, options: {
  db?: Pool;
  runtime?: BackendRuntime;
  apiRouter?: Router;
  errorLogger?: ErrorLogger;
  verifyTeacherToken?: VerifyTeacherToken;
} = {}) {
  const db = options.runtime?.db ?? options.db;
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
    const { verify, services } = options.runtime ?? createBackendRuntime(config, db, { verifyTeacherToken: options.verifyTeacherToken });
    app.use('/api/rooms', publicRoomRouter(services.reports));
    app.use('/api', (_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
    // A privileged development escape hatch must be explicitly opted into.
    if (config.ENABLE_DEV_ROUTES && config.NODE_ENV !== "production") app.use("/api/dev", databaseReadRouter(db));
    app.use('/api', apiRouter(services, requireTeacher(db, verify)));
  }
  app.use("/api", options.apiRouter ?? Router());

  app.use((_request, _response, next) => {
    next(new ApiError("NOT_FOUND", { message: "Endpoint not found." }));
  });
  app.use(createErrorHandler(options.errorLogger));
  return app;
}
