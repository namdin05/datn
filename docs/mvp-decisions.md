# QForge — MVP decisions

Updated 10/10/2026. Hộp approved the proposed Auth/identity/PIN/metrics/draft baseline in chat. Implementation is on `feat/auth-identity-rest`; live deployment/acceptance is pending.

Hộp/Bảo complete FE/BE REST; Nam/Lâm attach realtime afterwards. PostgreSQL/Supabase remains the database; business services remain transport-independent.

| Topic | Implemented choice |
|---|---|
| Teacher auth | Supabase Auth email/password, prepared accounts; JWT verified with asymmetric JWKS ES256/RS256 |
| User mapping | Keep users.id and seeded ownership; unique users.auth_user_id, server-controlled Teacher role |
| Student | Guest PIN/nickname + opaque token, stored as hash; private join retry key; sessionStorage resume |
| PIN | Exactly 6 digits, string; unique while session is open |
| Question | Single choice, exactly 4 options/1 correct on publish/host/start; 100 points |
| Draft | Blank question/option text or no correct answer allowed; input still has 4 option objects |
| Session | API WAITING/ACTIVE/FINISHED; DB ACTIVE maps to IN_PROGRESS |
| Join | New join WAITING only; existing credential resumes ACTIVE/FINISHED until expiry |
| Gameplay | Teacher start/next/finish, one attempt, timer/shuffle/speed bonus OFF |
| Metrics | Incorrect means answered wrong; unanswered separate; accuracy=correct/total quiz questions ×100 |
| Quiz history | Implementation locks edits/deletes after any host, including finished sessions, to preserve reports without versioning |

See [integration contract](integration-contract.md) for endpoints, snapshot/version behavior, validation, token expiry/revocation and realtime reuse. `/preview/*` is still a local mock; main landing links use real REST routes. `/api/dev/*` is opt-in development only and disabled by default.

Configured project URL/public key, migration 002, account mapping, live Supabase login, multi-connection concurrency and Teacher + 2 Student browser flow must be verified before H01. Code/tests are not a claim that these external setup steps have happened.
