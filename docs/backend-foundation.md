# S03 — Backend foundation

Nhánh triển khai: `feat/backend-foundation`. Hộp phụ trách BE; Bảo dùng contract dưới đây để nối FE. Nam/Lâm tích hợp realtime sau khi FE/BE hoàn thành.

## Phạm vi hiện tại

Đã có Express/TypeScript, HTTP server, env validation, CORS, giới hạn JSON 100kb, response helpers, validation middleware, error middleware và bộ HTTP tests. Đã ghép DB/read APIs và FE foundation của team. `/health` giữ nguyên response để trang FE `/setup` tiếp tục dùng được.

S04 cung cấp PostgreSQL pool, migrations/seeds và repositories. `/ready` chạy `SELECT 1`, trả 200 theo `readyResponseSchema` hoặc 503 `DB_UNAVAILABLE`; chỉ xác nhận kết nối DB, không kiểm tra đầy đủ schema/seed. `/health` chỉ xác nhận HTTP server đang sống. API đọc đã có dưới `/api/dev` và `/api/rooms`; auth và API ghi nghiệp vụ chưa có. API Teacher phát triển không mount trong production.

## Response chung cho FE và BE

Thành công dùng `sendSuccess(response, data)`; mặc định HTTP 200, có thể chọn 201 khi tạo mới hoặc 202 khi nhận xử lý:

```json
{
  "success": true,
  "data": { "title": "Demo" }
}
```

Lỗi dùng envelope cố định:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Request data is invalid.",
    "details": [
      {
        "source": "body",
        "field": "options.0.text",
        "message": "Option text is required."
      }
    ]
  }
}
```

`details` có thể không tồn tại. `source` là `body`, `params` hoặc `query`, và có thể không tồn tại với lỗi nghiệp vụ. `field` là đường dẫn field, dùng chỉ số mảng bắt đầu từ 0; `$` nghĩa là lỗi ở toàn bộ object, chẳng hạn thiếu body hoặc có key ngoài strict schema. Thông báo validation trong ví dụ chỉ minh họa; thông báo thật theo schema đã khai báo.

FE dùng `error.code` để quyết định cách xử lý; dùng `details` để gắn lỗi vào form và `message` làm thông báo chung. Không dựa vào nguyên văn thông báo để viết logic. `shared/src/api.ts` export `ApiResponse<T>`, `ApiFailure`, `ApiErrorCode`, `ValidationIssue`, `apiFailureSchema` và `createApiResponseSchema(dataSchema)` cho kiểm tra response runtime. Shared chứa dữ liệu công khai, không chứa Express, credentials hoặc DB entity nội bộ.

| HTTP | Code | Ý nghĩa |
|---|---|---|
| 400 | INVALID_INPUT | Dữ liệu không đúng request schema |
| 400 | INVALID_JSON | JSON không hợp lệ |
| 401 | UNAUTHORIZED | Chưa có identity hợp lệ |
| 403 | FORBIDDEN | Identity không có quyền thực hiện |
| 404 | NOT_FOUND | Không có endpoint hoặc resource |
| 409 | CONFLICT | Thao tác không hợp lệ ở trạng thái hiện tại |
| 413 | PAYLOAD_TOO_LARGE | Body vượt giới hạn |
| 415 | UNSUPPORTED_MEDIA_TYPE | Charset/encoding của JSON không được hỗ trợ |
| 500 | INTERNAL_ERROR | Lỗi nội bộ ngoài dự kiến |
| 503 | DB_UNAVAILABLE | DB chưa cấu hình hoặc không đáp ứng readiness query |

Code 401/403 mới là quy ước response; middleware xác thực/phân quyền sẽ được xây ở S07. Chưa có enforcement quyền cho API nghiệp vụ vì các API đó chưa tồn tại.

## Thêm một route có validation

Ví dụ để áp dụng khi xây Quiz API; route này **chưa được mount trong ứng dụng**:

```ts
import { Router } from "express";
import { z } from "zod";
import { sendSuccess } from "../common/response.js";
import { validateRequest } from "../middleware/validate.js";
import type { ValidatedRequestHandler } from "../middleware/validate.js";

const router = Router();
const schemas = {
  params: z.object({ id: z.uuid() }),
  body: z.strictObject({ title: z.string().trim().min(1).max(200) }),
  query: z.object({ page: z.coerce.number().int().positive().default(1) }),
};

const handler: ValidatedRequestHandler<typeof schemas> = async (_request, response) => {
  const { body, params, query } = response.locals.validated;
  // Gọi service bằng body.title, params.id, query.page đã được kiểm tra.
  sendSuccess(response, { title: body.title, id: params.id, page: query.page });
};

router.post("/quizzes/:id", validateRequest(schemas), handler);
export { router };
```

Khai báo schema cho từng phần mà endpoint cần. Middleware dùng `safeParseAsync`, hỗ trợ refinement/transform bất đồng bộ. Các issue từ body/params/query được gom vào một response 400; controller chỉ chạy khi tất cả phần đã khai báo đều hợp lệ.

Đọc dữ liệu từ `response.locals.validated`, không đọc lại raw input để gọi service. `.trim()`, `.default()` và `.coerce` chỉ tác động lên parsed output. Express 5 có getter cho `request.query`; middleware không ghi đè nó. `ValidatedRequestHandler<typeof schemas>` giúp TypeScript biết title là string và page là number.

Với request body cần tránh field thừa, dùng `z.strictObject`. Query/params trong ví dụ dùng `z.object`, nên field ngoài schema không được đưa vào parsed output. Chọn chính sách này theo từng endpoint. `z.coerce.number()` tuân theo chuyển đổi số của JavaScript; thêm ràng buộc phù hợp hoặc kiểm tra chuỗi trước khi convert nếu endpoint yêu cầu định dạng hẹp hơn.

`createApp` nhận một options object: `createApp(config, { db, apiRouter: router, errorLogger })`; các phần đều tùy chọn. Server, DB runner và smoke DB của FE đã dùng interface này. `app.ts` mount custom router dưới `/api`, cùng DB routes của team. Thứ tự middleware: CORS → JSON parser → health/ready/API routes → 404 → error handler. Không đăng ký API sau middleware 404.

API đọc dùng `validateRequest` cho GUID/PIN: sai định dạng trả 400 `INVALID_INPUT` với params field details; không tìm thấy resource trả 404 `NOT_FOUND`. Không dùng lại `INVALID_ID`/`INVALID_PIN` từ checkpoint cũ. Giữ quy tắc PIN 1–12 chữ số hiện tại của team; độ dài demo cuối cùng vẫn cần chốt ở contract nghiệp vụ.

## Lỗi nghiệp vụ và lỗi nội bộ

Service có thể báo một lỗi đã dự kiến:

```ts
throw new ApiError("CONFLICT", {
  message: "Session has already finished.",
});
```

`ApiError` gắn code với HTTP status cố định. Error middleware serialize các field công khai qua `sendFailure`. Controller thường dùng `sendSuccess`; để lỗi đi tới error middleware thay vì tự tạo response lỗi riêng ở từng route.

Express 5 chuyển rejection của Promise **được trả về bởi handler** tới error middleware. Dùng `async`/`await` cho route và middleware; không bỏ Promise chạy ngầm nếu cần HTTP request nhận lỗi. Callback/timer nằm ngoài Promise của handler phải tự chuyển lỗi tới `next` khi phù hợp.

Lỗi JSON sai/oversize/unsupported encoding được chuyển thành 400/413/415. Lỗi readiness `DB_UNAVAILABLE` được giữ ở HTTP 503. Các lỗi chưa biết, kể cả raw `ZodError` phát sinh trong logic nội bộ, trả 500 với thông báo chung và log lỗi gốc ở BE. Chỉ validation middleware chuyển lỗi request schema thành `INVALID_INPUT`. Ngay cả `ApiError("INTERNAL_ERROR")` có message riêng cũng được che ở HTTP response. Khi headers đã gửi, handler chuyển tiếp lỗi cho Express xử lý, tránh gửi response lần hai.

`message`/`details` của lỗi 4xx được coi là nội dung công khai do lập trình viên chủ động cung cấp. Không đưa SQL, token, password, stack hoặc raw input vào chúng; không đưa các giá trị này vào custom Zod messages. Middleware không tự lọc nội dung tùy chỉnh.

## Quy ước module cho bước nghiệp vụ

Khi bắt đầu Quiz/Session, tạo module theo nhu cầu thực tế:

```text
backend/src/modules/quizzes/
  quiz.schemas.ts      request schemas
  quiz.routes.ts       URL, middleware, chuyển input/output HTTP
  quiz.service.ts      nghiệp vụ và quyền sở hữu
  quiz.repository.ts   truy vấn DB
```

Luồng cho nghiệp vụ mới: route → service → repository. Route lấy identity và parsed input, gọi service rồi `sendSuccess`; service nhận tham số bình thường, không nhận Express request/response; repository phụ trách đọc/ghi DB. Lớp service có thể dùng lại khi Nam/Lâm gắn Socket.IO. DTO/gateway hoàn chỉnh sẽ chốt ở S06. Module API đọc phát triển hiện có của team vẫn query DB trong route; chưa tách thành business services trong lượt tích hợp S03 này. Chưa tạo các module rỗng.

## Kiểm tra

Từ root repo:

```sh
npm test
npm run check
```

`npm test` build shared rồi chạy tests của các workspace: Node test runner cho `backend/test/*.test.ts` và smoke FE. Tests BE mở HTTP server ở cổng ngẫu nhiên, gửi request thật và đóng server sau mỗi test. Router mẫu chỉ tồn tại trong test fixture; integration tests DB routes dùng mocked pool query, không kết nối DB thật hoặc cần `.env`. `tsconfig.test.json` kiểm tra kiểu của source và tests; build production chỉ chứa source.

`npm run check` chạy lint, typecheck, tests và build shared/BE/FE. GitHub CI gọi script này. 27 tests BE bao gồm 17 tests nền HTTP ban đầu và 10 tests readiness/DB routes: 503, param validation trước query, room không tồn tại, room metadata/status, production route gating và DB error masking. Smoke FE kiểm tra UI demo/components và health loading/error/retry. Chưa thay thế tests trên DB thật hoặc luồng demo nghiệp vụ.
