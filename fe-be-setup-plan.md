# QForge — Plan setup FE/BE và phân công Hộp/Bảo

Ngày lập: **07/10/2026**, giờ Việt Nam. Mốc demo theo Jira: **15/10/2026**.

Trạng thái: **Plan đã điều chỉnh theo phân công người dùng xác nhận**; lịch và estimate là đề xuất, chưa phải quyết định đã được leader duyệt hay ticket đã tạo trên Jira. Tài liệu này lập kế hoạch; chưa triển khai code hoặc thay đổi database.

## 1. Phạm vi và ranh giới bàn giao

**Phân công mới do Hộp xác nhận trong chat:** Hộp và Bảo hoàn thiện **FE + BE** trước; **Nam và Lâm gắn realtime sau khi nhận bàn giao**. Phân công này thay thế phần plan trước giao realtime cho Hộp và FE nghiệp vụ cho Nam/Lâm.

- **Hộp:** repo/tooling, backend REST, auth, business services, session state, answer/scoring, report, deploy backend và CI.
- **Bảo:** frontend đầy đủ cho demo, nối REST, setup DB/data layer ban đầu và phối hợp Duy về migrations/seed.
- **Nam + Lâm:** Socket.IO phía server/client, realtime lobby, đồng bộ câu hỏi/progress, reconnect/snapshot và kiểm tra realtime sau bàn giao.
- **Duy:** phối hợp schema, migrations/seed và review các bổ sung DB. Plan không tự chuyển toàn bộ trách nhiệm DB của Duy sang Bảo.

Hai bạn bàn giao một flow **chạy bằng REST với dữ liệu DB thật**: Teacher login → Create/Edit Quiz → Publish → Host → Student Join → Teacher Start/Next → Student Submit → Finish → Result/Report. Giai đoạn trước realtime, người dùng dùng nút tải/cập nhật state để kiểm tra các tab; chưa có đồng bộ tự động. UI nghiệp vụ và service đã hoàn chỉnh để Nam/Lâm thêm transport realtime vào đúng điểm nối.

Mốc đề xuất:

1. **07–08/10:** nền FE/BE/DB và contract.
2. **09–11/10:** hoàn thiện FE/BE nghiệp vụ; bàn giao cuối **11/10**.
3. **12–13/10:** Nam/Lâm gắn realtime; Hộp/Bảo hỗ trợ contract và sửa lỗi FE/BE.
4. **14–15/10:** kiểm tra tích hợp, deploy, rehearsal và demo.

Nguồn Jira:

- [Phân chia công việc](../Jira/Phân%20chia%20công%20việc%20để%20demo%20đồ%20án.md): vai trò ban đầu và deadline 15/10; nhiệm vụ được cập nhật theo xác nhận trực tiếp trong chat.
- [Spec demo](../Jira/%5BSPEC%5D%20Thông%20tin%20demo.md): stack, các màn và rule 4 options/1 correct, scoring 100/0.
- [Guideline realtime](../Jira/Guideline%20Socket%20for%20QForge.md): Teacher điều khiển session; server giữ state; reconnect qua snapshot.
- [Research Socket.IO](../Jira/Research%20Socket.IO.md): tài liệu tham khảo cho Nam/Lâm.

Đã đối chiếu checkout `datn/main` tại commit `2b8a8ec` và `origin/PoC/realtime`. Main có SQL/tài liệu DB; PoC có client/server JavaScript và state trong RAM. Chưa chạy lại kiểm tra của tác giả PoC trong lần lập plan này. Tài liệu này chỉ lập kế hoạch; chưa triển khai code, tạo ticket Jira hoặc thay đổi database.

## 2. Cấu trúc và cách chuẩn bị cho realtime

```text
datn/
├── frontend/src/
│   ├── app/                 # router, providers, Teacher/Student layouts
│   ├── components/ui/
│   ├── features/            # auth, quizzes, live-session, results
│   └── lib/                 # env, HTTP client, session gateway
├── backend/src/
│   ├── app.ts               # Express app
│   ├── server.ts            # HTTP bootstrap; Nam/Lâm attach Socket.IO sau
│   ├── config/              # env, db
│   ├── middleware/          # auth, validation, errors
│   └── modules/             # route → service → repository
├── shared/src/              # public DTO, Zod schemas, contract types
├── database/                # schema hiện có, migrations, seed
├── docs/                    # API, integration contract, setup, handover
├── landing_page/
├── .github/workflows/
├── package.json             # private; npm workspaces
└── package-lock.json
```

- Npm workspaces cho FE/BE/shared; lockfile chung. Root scripts: dev/dev:fe/dev:be/build/lint/typecheck/test/db:migrate/db:seed; shared build trước các app. Pin Node/npm sau khi cả hai máy chạy được.
- Backend business service không phụ thuộc Express request hay Socket.IO socket. Nhận actor đã xác thực và input; kiểm tra quyền, validate, transaction, trả DTO/state. Nam/Lâm gọi lại cùng service từ socket handler, không viết lại scoring/answer/session logic.
- Sau khi transaction thành công, service cung cấp state/result cần thiết cho adapter phát event. Contract ghi rõ điểm nối cho start/next/submit/finish; socket adapter do Nam/Lâm triển khai. Không broadcast trước khi dữ liệu được lưu.
- FE có `sessionGateway` cho create/join/start/next/submit/finish/getSnapshot. Bảo viết REST implementation trước; components không gọi transport trực tiếp. Nam/Lâm thêm socket adapter/subscriptions và cập nhật state theo cùng DTO.
- Snapshot reducer hoặc hàm applySnapshot dùng chung cho response REST và socket snapshot. Trước bàn giao, nút cập nhật state gọi REST snapshot để test; không cần tự dựng thêm hệ polling.
- Shared chỉ chứa contract công khai; tách TeacherQuestion/PublicQuestion, không đưa đáp án đúng/secret vào bundle Student.
- Data access đề xuất SQL qua `pg` để tận dụng schema; S04 xác nhận với Duy. Nếu nhóm đã chốt ORM thì dùng lựa chọn đó, tránh hai data layer.
- Hộp tạo root scaffold trước; Bảo phụ trách frontend/DB setup, Hộp phụ trách BE core. Dependency thêm đúng workspace; phối hợp root lockfile/config.
- Branch theo task, ví dụ `codex/setup-foundation`, `codex/frontend-quiz-editor`, `codex/backend-session`; PR nhỏ vào main. FE/BE realtime được tích hợp sau mốc bàn giao.

Tham khảo [npm workspaces](https://docs.npmjs.com/cli/v11/using-npm/workspaces/) cho package linking và workspace scripts.

## 3. Chốt contract sớm, gắn realtime sau

**Nam/Lâm chưa cần gắn realtime ngay, nhưng cần cùng chốt contract trong 07–08/10.** Chờ đến khi FE/BE hoàn tất mới trao đổi event/state sẽ gây sửa lại UI/service.

| Chủ đề | Khác biệt đã thấy | Baseline đề xuất | Người chốt/phối hợp |
|---|---|---|---|
| Auth Teacher | Phân công role selection; spec Supabase Auth | Supabase Auth với Teacher account chuẩn bị sẵn. Nếu Nam chốt chọn role, BE cấp identity demo; không chỉ tin role FE | Hộp + Nam, Bảo nối UI |
| Session status | API/PoC ACTIVE; DB IN_PROGRESS | API/shared WAITING → ACTIVE → FINISHED; repository mapping | Hộp + Bảo |
| Question | Spec 4/1; DB 2–5 và nhiều đúng | Validate đúng 4 options, 1 correct ở service; mapping DB MULTIPLE_CHOICE | Hộp + Bảo/Duy |
| Join/gameplay | DB docs student-paced, join active | Join mới khi WAITING; Teacher next; resume identity cũ khi ACTIVE | Hộp + Nam/Lâm |
| PIN | PoC hex; DB numeric | PIN 6 chữ số dạng string; unique với session còn hiệu lực | Hộp |
| Scoring | DB docs có speed bonus | 100/0, một attempt, timer/shuffle OFF; accuracy-points tách riêng | Hộp + Bảo/Duy |
| Current question/resume | DB thiếu current-question state và credential | Bổ sung current question/stateVersion, participant token hash/expiry; DB state do BE service quản lý | Hộp thiết kế; Bảo/Duy migrations; Nam/Lâm dùng lại |
| Event names/transport | PoC room/quiz/player; guideline session/student | Chốt event/payload và actions nào dùng REST/socket trong integration contract | Nam/Lâm + Hộp/Bảo |
| Quiz đang host | Cần câu hỏi ổn định trong session | Demo khóa sửa/xóa khi có live session; cần snapshot/versioning nếu nhóm muốn edit-running | Hộp + Nam |
| Unanswered/accuracy | Spec chưa nói rõ | incorrect = đã trả lời sai; thêm unanswered; accuracy = correct/total × 100 | Hộp + Bảo/Nam |

Auth mapping cũng cần chốt: bảng users hiện chưa thể hiện liên kết Supabase Auth; dùng UUID tương ứng hoặc auth_user_id unique. BE verify token và map actor đúng users; Nam/Lâm tái sử dụng verifier khi gắn socket. Tham khảo [Supabase JWT docs](https://supabase.com/docs/guides/auth/jwts).

## 4. Backlog setup — 07–08/10

Estimate là giờ làm tập trung của owner, chưa tính chờ quyền truy cập/review. Không tính Socket.IO implementation vào task Hộp/Bảo.

| ID | Task | Owner | Estimate | Phụ thuộc | Acceptance criteria |
|---|---|---|---|---|---|
| S01 | Scope và integration contract v1 | Hộp | 1–2h | Nam/Lâm/Duy phối hợp | Có quyết định auth, rule demo, state DTO, service/gateway interface và event draft; điểm chưa chốt được ghi rõ |
| S02 | Root workspace, scripts, conventions | Hộp | 1–2h | Thống nhất folder | FE/BE/shared stubs, root lockfile/scripts/gitignore/version pin; install thành công |
| S03 | BE foundation | Hộp | 2–3h | S02 | Express/TS, HTTP server, env validation, CORS, validation/error middleware, health/ready; chưa cần Socket.IO |
| S04 | DB connection, migrations, seed, repository skeleton | Bảo | 3–4h | S02; Duy hỗ trợ | BE query được DB; migration tracking; seed Teacher + quiz 5 câu; chạy seed lại không nhân đôi; credentials chỉ ở BE |
| S05 | FE foundation | Bảo | 3–4h | S02 | React/Vite/TS, Tailwind/shadcn, Router; Teacher/Student layout responsive; routes; component/loading/error/empty states |
| S06 | Shared DTO và REST client/session gateway | Hộp chốt; Bảo nối FE | Hộp 1–2h; Bảo 1–2h | S01/S03/S05 | Shared build được; FE HTTP wrapper và REST session gateway; áp dụng snapshot; FE gọi health/API smoke thành công |
| S07 | Auth/identity FE–BE | Hộp; Bảo nối login | Hộp 2–3h; Bảo 1–2h | S01/S03/S04/S05 | Teacher login/logout, protected routes, BE verify/map identity; participant credential contract; không cần socket handshake |
| S08 | CI và onboarding README | Hộp | 1–2h | S03–S07 | npm ci/lint/typecheck/build pass; env examples; migrate/seed/run docs; clone sạch trên máy Bảo chạy được |

Env bàn giao: FE API URL và Supabase URL/publishable key nếu dùng Auth; BE PORT, frontend origins, DB connection, auth/token config. Socket URL/config do Nam/Lâm bổ sung khi tích hợp. Không để DB password/server secret trong VITE_*; onboarding ghi tên biến và cách nhận access, không chép secret.

## 5. Backlog FE/BE hoàn chỉnh — 09–11/10

**Hộp tập trung business backend; Bảo tập trung frontend nghiệp vụ.** Bảo chỉ giữ phần DB setup/migration cần thiết, phối hợp Duy, không đồng thời nhận toàn bộ Quiz/Report BE như plan cũ.

| ID | Task | Owner | Estimate | Phụ thuộc | Acceptance criteria |
|---|---|---|---|---|---|
| C01 | Quiz/Question CRUD + Publish BE | Hộp | 4–6h | S04/S06/S07 | Ownership; CRUD transaction; đúng 4/1; publish chặn quiz rỗng/invalid; lock edit khi đang live |
| C02 | Session/PIN/Join + credential BE | Hộp | 3–4h | C01 publish, S04/S07 | Host quiz published; PIN unique numeric; Student join WAITING; identity được cấp đúng; attach/resume không tạo participant mới |
| C03 | Live-state migration và repositories | Bảo | 2–3h | S01/S04; Hộp định nghĩa state; Duy review | Current question/stateVersion, token hash/expiry, attempt và answer repositories phù hợp contract; migrations có tracking |
| C04 | Session lifecycle + snapshot REST | Hộp | 3–4h | C02/C03 | Start/next/finish service; chỉ host; transition hợp lệ; lưu state/attempt; snapshot theo quyền; action lặp không chuyển sai state |
| C05 | Answer transaction + Scoring BE | Hộp | 3–4h | C03/C04 | Validate actor/câu/option; answer + option + score atomic; unique chống race; retry không cộng lại; 100/0 |
| C06 | Result/Report BE | Hộp | 2–3h | C05 | Finalize idempotent; correct/incorrect/unanswered/accuracy thống nhất; result/report đọc lại từ DB, đúng quyền |
| F01 | Teacher Quiz list/editor/publish UI | Bảo | 4–6h | S05/S06; DTO trước, C01 để nối thật | List/create/edit/delete; editor 4 options/1 correct; publish; loading/error/empty, server errors hiển thị đúng |
| F02 | Teacher Host/Lobby/Control UI | Bảo | 3–4h | S05/S06; C02/C04 để nối thật | Host, hiển thị PIN/participants, start/next/finish, answer progress từ REST snapshot; nút cập nhật state trước realtime |
| F03 | Student Join/Lobby/Question/Submit UI | Bảo | 4–6h | S05/S06; C02/C04/C05 để nối thật | PIN+nickname; waiting; mobile question/radio options; submit pending/success/error; không cho UI chọn lại sau lưu; refresh lấy snapshot |
| F04 | Student Result/Teacher Report UI | Bảo | 2–3h | S05/S06; C06 để nối thật | Hiển thị metric/danh sách đúng; đọc lại kết quả qua REST; không lộ report cho Student |
| H01 | Kiểm tra REST E2E và bàn giao Nam/Lâm | Hộp + Bảo | 2–3h/người | C01–C06, F01–F04 | Flow thật trên DB; Teacher + 2 Student; contract/gateway/service docs và example payload; clean build/CI pass; checklist bàn giao đạt |

FE làm trước theo DTO đã chốt bằng fixture đúng schema; khi nghiệm thu phải nối API thật và bỏ fixture khỏi đường chạy demo. Hộp ưu tiên merge endpoint từng phần để Bảo nối dần, không đợi BE hoàn tất hết mới bàn giao API.

Ước lượng toàn bộ đến H01: **Hộp khoảng 27–40h**, **Bảo khoảng 25–37h**, chưa tính vòng sửa lớn hoặc chờ access. Mốc cuối 11/10 cần khoảng 6–8h/người/ngày ở giai đoạn đầu. Nếu lịch thực tế ít hơn, báo sớm để Nam/Lâm hỗ trợ UI/DB hoặc giảm polish; không âm thầm lùi tích hợp realtime đến sát 15/10.

## 6. API và điểm nối cho Nam/Lâm

Các endpoint là đề xuất, chưa phải API đã tồn tại.

| REST API | Quyền/service | Owner |
|---|---|---|
| GET /health, GET /ready; GET /api/me | Health; Teacher identity | Hộp |
| GET/POST /api/quizzes; GET/PATCH/DELETE /api/quizzes/:quizId | Teacher sở hữu | Hộp |
| POST /api/quizzes/:quizId/questions; PATCH/DELETE /api/questions/:questionId | Teacher sở hữu | Hộp |
| POST /api/quizzes/:quizId/publish | Validate quiz trước publish | Hộp |
| POST /api/sessions; POST /api/sessions/join | Host tạo; Student PIN+nickname | Hộp |
| POST /api/sessions/:id/start, /next, /finish | Host gọi chung SessionService | Hộp |
| POST /api/sessions/:id/answers | Participant gọi AnswerService | Hộp |
| GET /api/sessions/:id/snapshot | Theo identity; PublicQuestion + hasAnswered + stateVersion | Hộp |
| GET /api/sessions/:id/result; GET /api/sessions/:id/report | Kết quả mình; report host | Hộp |

Envelope: `{ success: true, data }` hoặc `{ success: false, error: { code, message } }`; HTTP status phù hợp. Chốt lỗi INVALID_PIN, SESSION_NOT_WAITING, FORBIDDEN, QUESTION_NOT_ACTIVE, ALREADY_ANSWERED, SESSION_EXPIRED.

**Business methods Hộp bàn giao:** createSession, joinSession, startSession, nextQuestion, submitAnswer, finishSession, getSnapshot, getResult, getReport, verifyTeacher/verifyParticipant. Tên cụ thể có thể đổi nhưng actor/input/output và error contract phải rõ.

**Gateway Bảo bàn giao:** các actions tương ứng, một hàm applySnapshot và UI states pending/accepted/error/disconnected-ready. Nam/Lâm thay/nối adapter live actions và subscription, không sửa toàn bộ screens.

**Event draft để Nam/Lâm chốt:** session:join/start/finish/sync; question:next/changed; answer:submit/progress; participant:joined/disconnected; session:started/snapshot/finished; student:result; session:report. Nam/Lâm chịu trách nhiệm handshake auth, rooms, listener cleanup, ack/timeout, emit đúng audience, reconnect và socket client state.

Create/join REST đã tạo session/participant thì socket attach không tạo lần hai. REST và socket cùng gọi service chống trùng; không cho hai implementation update state riêng. Nam/Lâm lựa chọn actions giữ REST + socket broadcast hay chuyển sang socket commands ngay khi chốt contract, bảo đảm một nguồn business logic.

Socket reconnect không tự bảo đảm ứng dụng phục hồi mọi state; snapshot/retry theo identity là phần Nam/Lâm nghiệm thu. Tham khảo [Socket.IO delivery guarantees](https://socket.io/docs/v4/delivery-guarantees/).

## 7. Checklist bàn giao FE/BE cuối 11/10

- [ ] Clone sạch → install → env → migrate/seed → dev/build theo README thành công; CI xanh.
- [ ] Teacher login, CRUD quiz, publish, host; Student join bằng PIN trên UI thật.
- [ ] Start/next/submit/finish chạy đúng qua REST. Tab khác bấm cập nhật state nhận đúng snapshot; chưa yêu cầu tự đồng bộ.
- [ ] Submit đồng thời/retry không nhân answer/score; option/câu/quyền sai bị từ chối.
- [ ] Refresh giữ Teacher/participant identity và hydrate snapshot; BE không tin participantId trần.
- [ ] Result/report đúng DB; Student chỉ thấy mình, Teacher chỉ thấy session mình.
- [ ] PublicQuestion không có đáp án đúng; secrets không vào FE bundle.
- [ ] Seed fixture nghiệm thu: quiz 5 câu, một Student đúng 3/sai 1/bỏ 1 → score 300, correct 3, incorrect 1, unanswered 1, accuracy 60% theo baseline.
- [ ] API docs, sample payload, service interfaces, gateway interface, enum/state mapping và env examples được bàn giao.
- [ ] Nam/Lâm xác nhận chạy được baseline REST và hiểu điểm attach socket; danh sách known issues được ghi rõ.

Sau bàn giao, Hộp/Bảo tiếp tục sửa BE/FE và hỗ trợ integration; không tự giao ngược socket implementation cho Hộp.

## 8. Task realtime của Nam/Lâm sau bàn giao

Phần dưới là ranh giới phối hợp, owner chung **Nam + Lâm**; hai bạn tự chia chi tiết nội bộ, plan này không áp đặt ai lead socket client/server.

| ID | Task | Owner | Điều kiện bắt đầu | Acceptance |
|---|---|---|---|---|
| R01 | Socket server adapter/auth/rooms | Nam + Lâm | H01; service/auth contract | Xác thực dùng verifier BE; room đúng quyền; event chỉ phát sau save thành công |
| R02 | Socket client adapter/subscriptions | Nam + Lâm | H01; gateway/DTO | Cắm vào UI có sẵn; cleanup listeners; ack/timeout; connection state |
| R03 | Lobby/question/progress/finish realtime | Nam + Lâm | R01/R02 | Teacher + 2 Student tự đồng bộ, không cần nút cập nhật; không nhân participant/answer; result/report đúng audience |
| R04 | Reconnect/sync và test realtime | Nam + Lâm | R03 | Refresh/mất mạng restore snapshot/identity/hasAnswered; host resume; lỡ finish event vẫn lấy được REST result |

Hộp hỗ trợ business-service/auth/transaction; Bảo hỗ trợ UI/gateway/DB DTO. Nếu realtime cần thêm migration, Nam/Lâm nêu contract và Hộp/Bảo/Duy phối hợp, không tạo state DB riêng cho PoC.

## 9. Lịch, deploy và kiểm tra cuối

| Ngày | Hộp | Bảo | Nam/Lâm và mốc kiểm chứng |
|---|---|---|---|
| 07/10 | S01–S03 | S05; bắt đầu S04 với Duy | Review contract, chưa gắn realtime |
| 08/10 | S06–S08, auth | S04/S06/S07 | Nền REST chạy; chốt điểm nối socket |
| 09/10 | C01/C02; cấp endpoint dần | F01, C03 | FE quiz editor nối BE thật |
| 10/10 | C04/C05 | F02/F03 | Host/join/start/next/submit qua REST |
| 11/10 | C06; H01 | F04; H01 | Nhận baseline FE/BE hoàn chỉnh cuối ngày |
| 12/10 | Hỗ trợ service/auth; deploy BE | Hỗ trợ gateway/UI; deploy FE/seed | R01/R02, bắt đầu R03 |
| 13/10 | Sửa BE integration | Sửa FE/data integration | R03/R04; full realtime flow trên URL thật |
| 14/10 | Logs/config/bugfix; freeze feature | Report/seed/mobile/bugfix | Cả nhóm integration test + rehearsal |
| 15/10 | Kiểm tra môi trường/demo support | Chuẩn bị dữ liệu/demo support | Demo Create → Publish → Host → Join → Play → Submit → Result → Report |

Deploy nền REST sớm nếu đã có access; đến khi Nam/Lâm gắn realtime phải kiểm tra WebSocket/CORS trên hosting thật. Hộp chủ trì cấu hình BE; Bảo chủ trì FE. Build monorepo phải build shared trước; kiểm tra frontend deep-link fallback và env API URL. Socket config do Nam/Lâm bổ sung và cùng kiểm tra.

Demo đề xuất một BE instance. DB lưu business state/kết quả, socket connection mapping do Nam/Lâm quản lý. Resume sau mất mạng/refresh bắt buộc ở R04; resume sau BE restart là kiểm tra bổ sung và phải ghi limitation nếu chưa đạt. Không chạy migration phá dữ liệu trong startup/deploy.

Tests ưu tiên: Hộp test publish/ownership/transaction/session lifecycle trên DB test; Bảo kiểm tra UI REST flow; H01 chạy Teacher + 2 Student dùng cập nhật snapshot thủ công. Nam/Lâm test socket integration/reconnect; cuối 13–14/10 chạy Playwright full flow tự đồng bộ. DB test tách DB demo; Postman collection giúp debug và bàn giao.

Nếu chậm tiến độ, cắt polish/timer/shuffle/leaderboard/multiple-attempts; dùng account Teacher chuẩn bị sẵn. Giữ CRUD/publish, core session/answer/report, chống submit trùng và contract snapshot. Realtime/reconnect vẫn là trách nhiệm Nam/Lâm trước nghiệm thu demo.
