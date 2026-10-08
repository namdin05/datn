import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";
import type { TestContext } from "node:test";
import { apiFailureSchema, createApiResponseSchema, healthResponseSchema, publicRoomSchema, readyResponseSchema } from "@qforge/shared";
import { Router } from "express";
import type { ErrorRequestHandler } from "express";
import { Pool } from "pg";
import { z } from "zod";
import { createApp } from "../src/app.js";
import { ApiError } from "../src/common/api-error.js";
import { sendSuccess } from "../src/common/response.js";
import { readEnv } from "../src/config/env.js";
import { validateRequest } from "../src/middleware/validate.js";
import type { ValidatedRequestHandler } from "../src/middleware/validate.js";

async function startApp(context: TestContext, router = Router(), options: {
  db?: Pool;
  mode?: "test" | "production";
} = {}) {
  const errors: unknown[] = [];
  const app = createApp(readEnv({ NODE_ENV: options.mode ?? "test" }), {
    db: options.db,
    apiRouter: router,
    errorLogger: (error) => errors.push(error),
  });
  const server = createServer(app);
  context.after(() => new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
    server.closeAllConnections();
  }));
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  return { app, errors, url: `http://127.0.0.1:${address.port}` };
}

function jsonPost(body: unknown): RequestInit {
  return { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

function stubDb(context: TestContext, query: (...args: unknown[]) => Promise<unknown>) {
  const pool = new Pool();
  context.after(() => pool.end());
  const mock = context.mock.method(pool, "query", query);
  return { pool, mock };
}

test("readiness without DB returns a shared 503 while health remains live", async (context) => {
  const { url, errors } = await startApp(context);
  const response = await fetch(`${url}/ready`);
  assert.equal(response.status, 503);
  assert.deepEqual(apiFailureSchema.parse(await response.json()), {
    success: false, error: { code: "DB_UNAVAILABLE", message: "Database is unavailable." },
  });
  const health = await fetch(`${url}/health`);
  assert.equal(health.status, 200);
  healthResponseSchema.parse(await health.json());
  assert.equal(errors.length, 0);
});

test("readiness queries the injected DB and follows its shared success contract", async (context) => {
  const { pool, mock } = stubDb(context, async () => ({ rows: [] }));
  const { url } = await startApp(context, Router(), { db: pool });
  const response = await fetch(`${url}/ready`);
  assert.equal(response.status, 200);
  readyResponseSchema.parse(await response.json());
  assert.deepEqual(mock.mock.calls[0]?.arguments, ["SELECT 1"]);
});

test("readiness hides DB failures and preserves the 503 code", async (context) => {
  const { pool } = stubDb(context, async () => { throw new Error("private DB connection string"); });
  const { url } = await startApp(context, Router(), { db: pool });
  const response = await fetch(`${url}/ready`);
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    success: false, error: { code: "DB_UNAVAILABLE", message: "Database is unavailable." },
  });
});

for (const [path, field] of [["/api/dev/quizzes/not-a-guid", "id"], ["/api/dev/sessions/not-a-guid", "id"], ["/api/rooms/bad", "pin"]] as const) {
  test(`${path} rejects invalid params before querying DB`, async (context) => {
    const { pool, mock } = stubDb(context, async () => { throw new Error("DB must not be queried"); });
    const { url } = await startApp(context, Router(), { db: pool });
    const response = await fetch(`${url}${path}`);
    assert.equal(response.status, 400);
    const failure = apiFailureSchema.parse(await response.json());
    assert.equal(failure.error.code, "INVALID_INPUT");
    assert.equal(failure.error.details?.[0]?.source, "params");
    assert.equal(failure.error.details?.[0]?.field, field);
    assert.equal(mock.mock.callCount(), 0);
  });
}

test("a missing room uses NOT_FOUND instead of the invalid-input code", async (context) => {
  const { pool, mock } = stubDb(context, async () => ({ rows: [] }));
  const { url } = await startApp(context, Router(), { db: pool });
  const response = await fetch(`${url}/api/rooms/123456`);
  assert.equal(response.status, 404);
  assert.equal(apiFailureSchema.parse(await response.json()).error.code, "NOT_FOUND");
  assert.deepEqual(mock.mock.calls[0]?.arguments[1], ["123456"]);
});

test("public room metadata keeps its FE contract and maps DB status", async (context) => {
  const { pool } = stubDb(context, async () => ({ rows: [{ title: "Demo", pin: "123456", status: "IN_PROGRESS", participantCount: 2 }] }));
  const { url } = await startApp(context, Router(), { db: pool });
  const response = await fetch(`${url}/api/rooms/123456`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body, { success: true, data: { title: "Demo", pin: "123456", status: "ACTIVE", participantCount: 2 } });
  createApiResponseSchema(publicRoomSchema).parse(body);
});

test("production does not mount demo Teacher routes even with DB configured", async (context) => {
  const { pool, mock } = stubDb(context, async () => { throw new Error("DB must not be queried"); });
  const { url } = await startApp(context, Router(), { db: pool, mode: "production" });
  const response = await fetch(`${url}/api/dev/dashboard`);
  assert.equal(response.status, 404);
  assert.equal(apiFailureSchema.parse(await response.json()).error.code, "NOT_FOUND");
  assert.equal(mock.mock.callCount(), 0);
});

test("DB read failures go through the shared internal-error handler", async (context) => {
  const failure = new Error("private SQL and credentials");
  const { pool } = stubDb(context, async () => { throw failure; });
  const { url, errors } = await startApp(context, Router(), { db: pool });
  const response = await fetch(`${url}/api/dev/dashboard`);
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { success: false, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } });
  assert.deepEqual(errors, [failure]);
});

test("health keeps its contract and only allows configured CORS origins", async (context) => {
  const { url } = await startApp(context);
  const response = await fetch(`${url}/health`, { headers: { Origin: "http://127.0.0.1:5173" } });
  assert.equal(response.status, 200);
  assert.deepEqual(healthResponseSchema.parse(await response.json()), {
    success: true, data: { status: "ok", service: "qforge-api" },
  });
  assert.equal(response.headers.get("access-control-allow-origin"), "http://127.0.0.1:5173");
  assert.equal(response.headers.get("x-powered-by"), null);
  const denied = await fetch(`${url}/health`, { headers: { Origin: "https://other.example" } });
  assert.equal(denied.headers.get("access-control-allow-origin"), null);
  await denied.text();
});

test("unknown endpoints return the shared NOT_FOUND envelope", async (context) => {
  const { url, errors } = await startApp(context);
  const response = await fetch(`${url}/api/missing`);
  assert.equal(response.status, 404);
  assert.deepEqual(apiFailureSchema.parse(await response.json()), {
    success: false, error: { code: "NOT_FOUND", message: "Endpoint not found." },
  });
  assert.equal(errors.length, 0);
});

test("validation exposes parsed body, params and query without modifying Express query", async (context) => {
  const router = Router();
  const schemas = {
    body: z.strictObject({ title: z.string().trim().min(1) }),
    params: z.object({ id: z.uuid() }),
    query: z.object({ page: z.coerce.number().int().positive().default(1) }),
  };
  const handler: ValidatedRequestHandler<typeof schemas> = (request, response) => {
    const { body, params, query } = response.locals.validated;
    const page: number = query.page;
    sendSuccess(response, { title: body.title, id: params.id, page, rawPage: request.query.page }, 201);
  };
  router.post("/quizzes/:id", validateRequest(schemas), handler);
  const { url } = await startApp(context, router);
  const id = "5583b2e3-85f0-4522-853a-4d07ec312be9";
  const response = await fetch(`${url}/api/quizzes/${id}?page=2`, jsonPost({ title: "  Demo  " }));
  assert.equal(response.status, 201);
  const contract = createApiResponseSchema(z.object({ title: z.string(), id: z.uuid(), page: z.number(), rawPage: z.string() }));
  assert.deepEqual(contract.parse(await response.json()), {
    success: true, data: { title: "Demo", id, page: 2, rawPage: "2" },
  });
  const defaultPage = await fetch(`${url}/api/quizzes/${id}`, jsonPost({ title: "Demo" }));
  assert.deepEqual(await defaultPage.json(), { success: true, data: { title: "Demo", id, page: 1 } });
});

test("invalid input reports nested fields and all request sources before the handler", async (context) => {
  const router = Router();
  let called = false;
  router.post("/quizzes/:id", validateRequest({
    body: z.strictObject({ options: z.array(z.object({ text: z.string().trim().min(1) })) }),
    params: z.object({ id: z.uuid() }),
    query: z.object({ page: z.coerce.number().int().positive() }),
  }), (_request, response) => {
    called = true;
    sendSuccess(response, {});
  });
  const { url, errors } = await startApp(context, router);
  const response = await fetch(`${url}/api/quizzes/bad-id?page=bad`, jsonPost({ options: [{ text: " " }], secret: "private-submitted-value" }));
  assert.equal(response.status, 400);
  const result = apiFailureSchema.parse(await response.json());
  const fields = result.error.details?.map(({ source, field }) => `${source}:${field}`);
  assert.ok(fields?.includes("body:options.0.text"));
  assert.ok(fields?.includes("body:$"));
  assert.ok(fields?.includes("params:id"));
  assert.ok(fields?.includes("query:page"));
  assert.equal(JSON.stringify(result).includes("private-submitted-value"), false);
  assert.equal(called, false);
  assert.equal(errors.length, 0);
});

test("missing body and repeated scalar query values are rejected", async (context) => {
  const router = Router();
  router.post("/body", validateRequest({ body: z.object({ title: z.string() }) }), (_request, response) => sendSuccess(response, {}));
  router.get("/query", validateRequest({ query: z.object({ page: z.coerce.number().int() }) }), (_request, response) => sendSuccess(response, {}));
  const { url } = await startApp(context, router);
  const missing = await fetch(`${url}/api/body`, { method: "POST" });
  assert.equal(missing.status, 400);
  assert.deepEqual(apiFailureSchema.parse(await missing.json()).error.details?.map(({ source, field }) => ({ source, field })), [{ source: "body", field: "$" }]);
  const repeated = await fetch(`${url}/api/query?page=1&page=2`);
  assert.equal(repeated.status, 400);
  assert.equal(apiFailureSchema.parse(await repeated.json()).error.code, "INVALID_INPUT");
});

test("async validation accepts transformed output and rejects failed refinements", async (context) => {
  const router = Router();
  const schemas = { body: z.object({ title: z.string().refine(async (value) => value !== "taken", "Title is already used.").transform(async (value) => value.toUpperCase()) }) };
  const handler: ValidatedRequestHandler<typeof schemas> = (_request, response) => sendSuccess(response, response.locals.validated.body);
  router.post("/async", validateRequest(schemas), handler);
  const { url } = await startApp(context, router);
  const valid = await fetch(`${url}/api/async`, jsonPost({ title: "demo" }));
  assert.deepEqual(await valid.json(), { success: true, data: { title: "DEMO" } });
  const invalid = await fetch(`${url}/api/async`, jsonPost({ title: "taken" }));
  assert.equal(invalid.status, 400);
  assert.equal(apiFailureSchema.parse(await invalid.json()).error.details?.[0]?.field, "title");
});

test("parsed values remain isolated across concurrent requests", async (context) => {
  const router = Router();
  const schemas = { body: z.object({ title: z.string().transform(async (value) => {
    await new Promise((resolve) => setImmediate(resolve));
    return value.trim();
  }) }) };
  const handler: ValidatedRequestHandler<typeof schemas> = (_request, response) => sendSuccess(response, response.locals.validated.body);
  router.post("/isolated", validateRequest(schemas), handler);
  const { url } = await startApp(context, router);
  const results = await Promise.all(["First", "Second"].map(async (title) => {
    const response = await fetch(`${url}/api/isolated`, jsonPost({ title: ` ${title} ` }));
    return response.json();
  }));
  assert.deepEqual(results, [{ success: true, data: { title: "First" } }, { success: true, data: { title: "Second" } }]);
});

for (const [code, status] of [["UNAUTHORIZED", 401], ["FORBIDDEN", 403], ["NOT_FOUND", 404], ["CONFLICT", 409]] as const) {
  test(`${code} uses its HTTP status and public message`, async (context) => {
    const router = Router();
    router.get("/known", () => { throw new ApiError(code, { message: "Public reason.", details: [{ field: "status", message: "Action is unavailable." }] }); });
    const { url, errors } = await startApp(context, router);
    const response = await fetch(`${url}/api/known`);
    assert.equal(response.status, status);
    assert.deepEqual(apiFailureSchema.parse(await response.json()), { success: false, error: { code, message: "Public reason.", details: [{ field: "status", message: "Action is unavailable." }] } });
    assert.equal(errors.length, 0);
  });
}

for (const [label, init, code, status] of [
  ["malformed JSON", { method: "POST", headers: { "Content-Type": "application/json" }, body: '{"title":' }, "INVALID_JSON", 400],
  ["oversized body", jsonPost({ title: "x".repeat(103_000) }), "PAYLOAD_TOO_LARGE", 413],
  ["unsupported charset", { method: "POST", headers: { "Content-Type": "application/json; charset=iso-8859-1" }, body: "{}" }, "UNSUPPORTED_MEDIA_TYPE", 415],
  ["unsupported encoding", { method: "POST", headers: { "Content-Type": "application/json", "Content-Encoding": "unknown" }, body: "{}" }, "UNSUPPORTED_MEDIA_TYPE", 415],
] as const) {
  test(`${label} returns a safe parser error`, async (context) => {
    const { url, errors } = await startApp(context);
    const response = await fetch(`${url}/api/example`, init);
    assert.equal(response.status, status);
    const failure = apiFailureSchema.parse(await response.json());
    assert.equal(failure.error.code, code);
    assert.equal(failure.error.details, undefined);
    assert.equal(errors.length, 0);
  });
}

test("async route failures, internal ApiErrors and unexpected validation errors stay private", async (context) => {
  const router = Router();
  const failures = [
    new Error("private database connection string"),
    new ApiError("INTERNAL_ERROR", { message: "private SQL", details: [{ field: "password", message: "secret" }] }),
    { status: 404, message: "private upstream response" },
    z.string().safeParse(1).error,
  ];
  for (const [index, failure] of failures.entries()) {
    router.get(`/failure-${index}`, async () => { await Promise.resolve(); throw failure; });
  }
  router.post("/broken-schema", validateRequest({ body: z.object({ title: z.string().transform(() => { throw failures[0]; }) }) }));
  const { url, errors } = await startApp(context, router);
  for (const index of failures.keys()) {
    const response = await fetch(`${url}/api/failure-${index}`);
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { success: false, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } });
  }
  const brokenSchema = await fetch(`${url}/api/broken-schema`, jsonPost({ title: "Demo" }));
  assert.equal(brokenSchema.status, 500);
  assert.equal(apiFailureSchema.parse(await brokenSchema.json()).error.code, "INTERNAL_ERROR");
  assert.deepEqual(errors, [...failures, failures[0]]);
});

test("an error after headers are sent is delegated without sending a second envelope", async (context) => {
  const router = Router();
  const failure = new ApiError("CONFLICT");
  router.get("/started", (_request, response, next) => {
    response.write("partial");
    next(failure);
  });
  const { app, url, errors } = await startApp(context, router);
  const tailHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
    void _next; // Express recognizes error middleware by its four arguments.
    assert.equal(error, failure);
    response.end("-delegated");
  };
  app.use(tailHandler);
  const response = await fetch(`${url}/api/started`);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "partial-delegated");
  assert.equal(errors.length, 0);
});
