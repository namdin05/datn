# QForge — Demo workspace

Code demo được tổ chức trong một npm workspace:

```text
frontend/       React + Vite + TypeScript + Tailwind + Router
backend/        Express + TypeScript, REST API
shared/         Public DTO và Zod response schemas
database/       SQL/schema hiện có; migrations/seed ở bước tiếp theo
docs/           Baseline, tiến độ setup và tài liệu database
landing_page/   Trang tài liệu nghiên cứu hiện có
```

Hộp/Bảo hoàn thiện FE/BE; Nam/Lâm gắn realtime sau bàn giao. Business services và FE gateway ở các bước tiếp theo sẽ tách khỏi transport để dùng lại khi nối socket.

## Chạy local

Yêu cầu Node **24.13.0**, npm **11.6.2**; các version được kiểm tra ở checkpoint setup hiện tại. Nếu dùng nvm:

```sh
nvm install
nvm use
npm install --global npm@11.6.2
```

Trong root repo `datn/`:

```sh
npm ci
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
npm run dev
```

- FE: `http://127.0.0.1:5173`.
- Trang kiểm tra kết nối: `http://127.0.0.1:5173/setup`; nhấn **Kiểm tra kết nối**.
- BE liveness: `http://127.0.0.1:3002/health`.

`npm run dev` build shared lần đầu, sau đó watch shared/BE/FE cùng lúc. Khi một process dừng, các process còn lại cũng dừng. `dev:fe` hoặc `dev:be` chạy riêng app tương ứng và shared watcher.

## Kiểm tra và build

```sh
npm run check
npm run start:be
```

`check` chạy lint, typecheck, 17 HTTP tests cho BE và build shared → BE → FE. `npm test` chạy riêng tests sau khi build shared; không cần DB. `start:be` chạy BE đã build; `preview:fe` serve FE build ở cổng 4173. Khi kiểm tra kết nối bằng preview, thêm origin `http://127.0.0.1:4173` vào `backend/.env` và restart BE.

BE đọc `backend/.env`. FE đọc `frontend/.env`; restart Vite khi đổi env. Dùng `HOST=0.0.0.0` và PORT do hosting cấp khi deploy BE; cấu hình FRONTEND_ORIGINS theo URL FE thật. FE dùng VITE_API_URL của BE khi build. Chỉ public config được đặt trong VITE_*; .env thật được Git ignore.

Nếu cổng 3002/5173 đã được dùng, dừng process cũ hoặc đổi cổng; cập nhật API URL/origin tương ứng. Shared output không commit; các lệnh dev/build/check ở root tự build package này. Cài dependency từ root bằng `npm install <package> -w @qforge/frontend` hoặc workspace BE/shared tương ứng.

## Checkpoint hiện tại

- Workspace, scripts, shared response contract, Express health/error handling và React routes ban đầu đã được dựng. S03 bổ sung ApiError, response helpers và Zod validation cho body/params/query.
- Teacher/Student pages hiện là placeholder. `/setup` là trang kiểm tra dành cho development.
- Chưa kết nối DB, chưa có authentication, Quiz/Session API, gateway nghiệp vụ, migration/seed runner hoặc Socket.IO.
- `/health` chỉ kiểm tra HTTP server sống, **không xác nhận database sẵn sàng**. `/ready` sẽ được thêm khi có DB.
- [CI của checkpoint workspace](https://github.com/namdin05/datn/actions/runs/37551753291) đã pass. CI gọi `npm run check`, nay có thêm HTTP tests; thay đổi S03 chưa được push nên chưa có kết quả CI cho S03.

Đọc [hướng dẫn S03: response, validation và module BE](docs/backend-foundation.md), [baseline và các điểm cần xác nhận](docs/mvp-decisions.md) và [checkpoint triển khai](docs/setup-progress.md). Bước tiếp theo: DB foundation (S04) và FE components (S05), sau đó DTO/auth theo lựa chọn được chốt.

## Các file config cần đọc khi bắt đầu

| File | Vai trò |
|---|---|
| [package.json](package.json) | Workspaces, scripts, dependencies và phiên bản môi trường được phép |
| [.nvmrc](.nvmrc) | Phiên bản Node đã chọn; dùng với nvm install/nvm use |
| [.npmrc](.npmrc) | Bật kiểm tra engines khi cài dependencies |
| [.editorconfig](.editorconfig) | Thống nhất UTF-8, LF, indent 2 spaces và quy ước lưu file |
| [eslint.config.mjs](eslint.config.mjs) | Quy tắc lint cho TS/React/Node và phạm vi file được kiểm tra |
| [.github/workflows/ci.yml](.github/workflows/ci.yml) | GitHub chạy npm ci và npm run check khi push/PR |

Commit source code, config dùng chung, lockfile, `.env.example` và tài liệu nhóm. Giữ `.env` thật, credentials, node_modules, dist, logs và ghi chú cá nhân ở local. `.npmrc` hiện chỉ có `engine-strict=true`; token registry nếu cần phải được cấu hình riêng, không ghi vào file repo.

## Tài liệu nghiên cứu trước demo

Phần dưới lưu mô tả trang knowledge/proposal trước đây; scope QForge demo theo baseline ở trên. Các đường dẫn trang web nằm trong `landing_page/`.

# Intelligent Assessment — Knowledge page

Trang tài liệu nội bộ tiếng Việt, diễn giải từ đặc tả `proposal-spec.md`.

## Proposal tổng hợp nghiên cứu

Trang `proposal/index.html` tổng hợp bốn báo cáo thành viên, đối chiếu brief và phương án điều chỉnh phân công trong repo. Nội dung gồm cơ sở nghiên cứu, ma trận giải pháp liên quan, phạm vi, phương pháp, kiến trúc dữ liệu, yêu cầu, kế hoạch thực nghiệm và các quyết định cần thống nhất. Đây là đề xuất để thẩm định, chưa phải kết quả thực nghiệm hoặc phạm vi đã phê duyệt.

Bản proposal 1.1 xác định giảng viên là người dùng chính và sinh viên là đối tượng thụ hưởng theo quyết định của chủ đồ án. Nguyên mẫu tập trung không gian giảng viên; cá nhân hóa là công cụ đề xuất, duyệt và xuất bộ luyện tập. Dữ liệu bài làm được nhập theo mẫu CSV hoặc thu nhận qua OMR. Cổng sinh viên, phòng thi trực tuyến, tự luyện, bảng tiến độ và cổng phúc khảo không thuộc phạm vi hiện tại. Đánh giá sử dụng tập trung nhiệm vụ của giảng viên; thí điểm hiệu quả học tập là phần bổ sung. Sổ tay v0.2 và báo cáo nguồn phản ánh phạm vi trước điều chỉnh; proposal là tài liệu tham chiếu cho phạm vi hiện tại.

Mở `/proposal/` trên máy chủ local hoặc `proposal/index.html` trực tiếp. Trang dùng `proposal/styles.css` và `proposal/app.js`, hỗ trợ màn hình nhỏ, mục lục và nút in báo cáo. Bốn báo cáo gốc được lưu nguyên trạng tại `proposal/sources/` để các trích dẫn nội bộ hoạt động cả trên GitHub Pages.

## Cấu trúc

```
.
├── index.html          # tổng quan, vai trò, research, phạm vi, câu hỏi cần chốt
├── app.js              # dữ liệu 20 module và hành vi điều hướng
├── styles.css          # giao diện desktop, tablet, mobile
├── proposal-spec.md    # đặc tả gốc (dùng để đối chiếu / tải về)
├── revision-notes.md   # ghi chú thay đổi v0.2
├── research-assignment/
│   ├── index.html      # phân công research theo thành viên + đánh giá mức độ phù hợp
│   └── brief.md        # brief phân công gốc
└── .nojekyll           # để GitHub Pages serve file nguyên bản, không qua Jekyll
```

Các nhãn là phạm vi đề xuất, không phải trạng thái triển khai. Cập nhật nội dung và `proposal-spec.md` khi đặc tả thay đổi.

## Chạy local

Mở `index.html` trực tiếp bằng trình duyệt, hoặc:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Sau đó mở http://127.0.0.1:4173.

## Xuất bản bằng GitHub Pages

Static site thuần HTML/CSS/JS, publish trực tiếp từ branch `main`:

1. Settings → Pages.
2. Build and deployment → Source: **Deploy from a branch**.
3. Branch: **main**, Folder: **/(root)** → Save.

Mỗi lần push lên `main`, GitHub Pages sẽ tự cập nhật trang tại https://namdin05.github.io/testing-demo/.

Trang phân công research: https://namdin05.github.io/testing-demo/research-assignment/
