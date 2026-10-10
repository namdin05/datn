import "dotenv/config";
import { createServer } from "node:http";
import { ZodError } from "zod";
import { createApp, createBackendRuntime } from "./app.js";
import { readEnv } from "./config/env.js";
import { createDb } from './config/db.js';
import { createSessionEventBus } from './modules/session-events.js';
import { attachRealtime } from './realtime/socket.js';

try {
  const config = readEnv();
  const db = process.env.DATABASE_URL ? createDb() : undefined;
  const bus = createSessionEventBus();
  const runtime = db ? createBackendRuntime(config, db, { events: bus }) : undefined;
  const server = createServer(createApp(config, { db, runtime }));
  // Realtime needs DB-backed auth; without a DB the API serves only health endpoints.
  const realtime = runtime ? attachRealtime(server, runtime, bus, { origins: config.FRONTEND_ORIGINS }) : undefined;
  server.on("error", (error: NodeJS.ErrnoException) => {
    console.error(`Server failed to start: ${error.code ?? "UNKNOWN"}`);
    process.exitCode = 1;
  });
  server.listen(config.PORT, config.HOST, () => {
    console.log(`QForge API listening at http://${config.HOST}:${config.PORT}`);
  });

  const shutdown = () => {
    const timeout = setTimeout(() => process.exit(1), 10_000);
    timeout.unref();
    realtime?.shutdown();
    server.close(async () => {
      await db?.end();
      clearTimeout(timeout);
      process.exit(0);
    });
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
} catch (error) {
  if (error instanceof ZodError) {
    console.error("Invalid environment configuration:",
      error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "));
  } else {
    console.error("Server initialization failed.");
  }
  process.exitCode = 1;
}
