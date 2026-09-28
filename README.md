# Intelligent Assessment — Knowledge page

Trang tài liệu nội bộ tiếng Việt, diễn giải từ đặc tả `proposal-spec.md`.

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
