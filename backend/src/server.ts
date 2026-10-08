import "dotenv/config";
import { createServer } from "node:http";
import { ZodError } from "zod";
import { createApp } from "./app.js";
import { readEnv } from "./config/env.js";
import { createDb } from './config/db.js';

try {
  const config = readEnv();
  const db = process.env.DATABASE_URL ? createDb() : undefined;
  const server = createServer(createApp(config, db));
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
