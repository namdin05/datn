import { z } from "zod";

const originsSchema = z.string().transform((value) =>
  value.split(",").map((origin) => origin.trim()),
).pipe(z.array(z.url()).min(1));

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().min(1).default("127.0.0.1"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3002),
  FRONTEND_ORIGINS: originsSchema.prefault(
    "http://localhost:5173,http://127.0.0.1:5173",
  ),
});

export function readEnv(source: NodeJS.ProcessEnv = process.env) {
  return envSchema.parse(source);
}

export type AppConfig = ReturnType<typeof readEnv>;
