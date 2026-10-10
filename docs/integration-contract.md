# QForge — Auth/REST integration contract

Checkpoint 10/10/2026, branch `feat/auth-identity-rest`. User-approved S01 choices are now implemented in shared schemas, BE services and FE. Local checks pass; Supabase project configuration, migration deployment and live account/DB acceptance remain pending.

## Identity

Teacher: Supabase Auth email/password → access JWT → verify via JWKS (ES256/RS256; correct issuer, authenticated audience, expiry and GUID subject) → `users.auth_user_id` unique → server role TEACHER. `/api/me` returns `{id,name,role}`. `creator_id`/`host_id` are derived from this actor. No account auto-promotes itself to Teacher. Legacy HS256 projects require a signing-key migration plan before using this verifier.

Guest: `POST /api/sessions/join` takes `{pin,nickname,requestId}`. A private random UUID requestId makes a lost response retryable. BE derives an opaque credential with HMAC, stores token/request hashes and expiry, and returns `{sessionId,participantId,token,expiresAt}`. FE stores it in sessionStorage. Bearer credential is scoped to that session; participantId/nickname/PIN alone cannot submit. TTL defaults to 24h, with no sliding refresh. A credential can resume ACTIVE or read FINISHED results. DELETE credential revokes it without deleting the report history.

## Business rules

- PIN exactly 6 digits, string; unique across WAITING/IN_PROGRESS. DB IN_PROGRESS maps to API ACTIVE.
- New joins only WAITING. Retry of an existing private join key is accepted while the room is open and token valid.
- Draft may contain empty text/no correct choice; input questions have 4 option objects. Publish/host/start revalidate stored nonblank text, 4 options, exactly 1 correct and points=100.
- Save resets unhosted quiz to DRAFT. Quiz ever hosted is immutable to protect historical answers; create a new quiz to change content.
- One attempt; teacher-paced start/next/finish. Timer/shuffle/speed bonus OFF. Early finish counts all unattempted quiz questions as unanswered.
- Answer records and counters commit atomically. Same question/option retry returns snapshot; changed option conflicts. Scoring is correct*100; incorrect and unanswered are separate; accuracy=correct/total*100, rounded to 2 decimals.
- Public question projection never contains correctness. Results are returned to the participant after FINISHED; report is restricted to host.

## HTTP endpoints

The schemas/types in `shared/src/contracts.ts` are the authoritative payload definitions. Responses use shared success/failure envelopes and structured `details` for validation.

| Actor | Endpoint |
|---|---|
| Public | GET /health, /ready; GET /api/rooms/:pin |
| Teacher | GET /api/me; GET /api/teacher/dashboard; GET /api/teacher/quizzes/:id; GET /api/teacher/sessions/:id |
| Teacher | POST /api/quizzes; GET/PUT/DELETE /api/quizzes/:id; POST /api/quizzes/:id/publish |
| Teacher | POST /api/sessions with quizId; GET /api/sessions/:id/snapshot; POST /api/sessions/:id/actions with action/expectedVersion |
| Guest | POST /api/sessions/join; GET /api/participants/sessions/:id; POST /api/participants/sessions/:id/answers; DELETE /api/participants/sessions/:id/credential |

Teacher uses Supabase Bearer JWT; participant uses opaque Bearer credential. Unknown resource/other owner's resource: 404. Missing/invalid/expired credential: 401. Valid Auth user without Teacher mapping/role: 403. State/version mismatch: 409. Invalid input/publish rule: 400. Missing Auth/guest configuration: 503.

## Backend structure

See [backend architecture](backend-architecture.md). `modules/application.ts` composes feature services: quizzes, sessions, participants, answers and reports. Routes depend on these services; SQL is in typed repositories. Use `createServices(pool, credentials)` to wire a socket adapter; use the same actor/credential verification and service instances.

## Snapshot and adapters

Session snapshot carries sessionId/status/stateVersion/currentPosition/totalQuestions. Participant snapshot adds explicit PublicQuestion, identity, hasAnsweredCurrentQuestion and final personal result. Teacher snapshot adds participants/progress/final results. stateVersion advances with lifecycle actions; participant answers may change at equal version. Clients discard lower-version session state, accept equal-version participant changes, and cancel old reads around submit/route changes.

Teacher actions require expectedVersion. A stale/retried action conflicts, then UI reloads; it cannot advance twice. SessionGateway is the FE transport boundary. Snapshot GET is currently manual; Socket.IO subscriptions can attach here later.

Realtime and leaderboard: see [realtime-leaderboard.md](realtime-leaderboard.md). Snapshots now also carry `phase`, `leaderboardEvery` and `leaderboard`; migration 003 is required.

Socket adapter must reuse `resolveTeacher`, `ParticipantTokens.resolve` and `createServices` và các service theo module. Attach does not repeat join/create participant. Emit after committed service returns, with separate Teacher/Student audiences. `/api/dev/*` remains an explicit local escape hatch (`ENABLE_DEV_ROUTES=true`), is off by default and never mounts in production.

## Database and acceptance

Apply migration 002 through the tracked runner before running these APIs. It adds Auth mapping/live-state/credential fields and permits blank draft text. `/ready` only tests DB connectivity. Seed 002 provides the 5-question 4/1/100-point fixture; old seed 001 is not gameplay acceptance data.

Tests: 34 BE tests plus legacy FE smoke and REST FE smoke run under `npm run check`. Business SQL uses isolated PostgreSQL WASM (PGlite); signature checks use real ES256 tokens/local JWKS. FE smoke exercises HTTP/DB Student submit/refresh/result/revoke. This does not replace live Supabase login, pg multi-connection concurrency, browser/responsive or team onboarding acceptance.

Setup: configure env examples; enable an asymmetric Auth signing key; prepare two Teacher accounts; run db:status/db:migrate; map via `npm run auth:link -w @qforge/backend -- <qforge-id> <supabase-id> [name-for-new-teacher]`. Local A–Z guide is stored outside the team repo at `../docs/local/s01-auth-rest-a-z-2026-10-10.md` (relative to repo root).
