import cors from "cors";
import express from "express";
import type { HealthResponse } from "@qforge/shared";
import type { AppConfig } from "./config/env.js";
import type { Pool } from 'pg';
import { errorHandler } from "./middleware/errors.js";
import { databaseReadRouter, publicRoomRouter } from './modules/database-read.js';

export function createApp(config: AppConfig, db?: Pool) {
  const app = express();
  app.disable("x-powered-by");
  app.use(cors({ origin: config.FRONTEND_ORIGINS }));
  app.use(express.json({ limit: "100kb" }));

  if (db) {
    app.use('/api/rooms', publicRoomRouter(db));
    // Không công khai API Teacher chưa xác thực trong production.
    if (config.NODE_ENV !== 'production') app.use('/api/dev', databaseReadRouter(db));
  }

  app.get('/ready', async (_request, response) => {
    try {
      if (!db) throw new Error('DB_NOT_CONFIGURED');
      await db.query('SELECT 1');
      response.json({ success: true, data: { status: 'ready', database: 'ok' } });
    } catch {
      response.status(503).json({ success: false, error: { code: 'DB_UNAVAILABLE', message: 'Database is unavailable.' } });
    }
  });

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
