import { Link, NavLink, Route, Routes } from "react-router";
import { SetupPage } from "../features/setup/SetupPage";

function HomePage() {
  return (
    <section className="space-y-8">
      <div className="max-w-2xl space-y-4">
        <p className="eyebrow">Học cùng nhau</p>
        <h1>Từ câu hỏi đến những giờ học thú vị.</h1>
        <p className="description">Tạo bài kiểm tra, tổ chức phiên học và theo dõi kết quả trên QForge.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link className="choice-card" to="/teacher/quizzes">
          <span className="eyebrow">Dành cho giáo viên</span>
          <h2>Không gian giảng dạy</h2>
          <p>Chuẩn bị bài kiểm tra và tổ chức phiên học.</p>
          <span className="card-action">Vào không gian giáo viên →</span>
        </Link>
        <Link className="choice-card" to="/join">
          <span className="eyebrow">Dành cho học sinh</span>
          <h2>Cùng tham gia</h2>
          <p>Tham gia bài kiểm tra bằng mã PIN của giáo viên.</p>
          <span className="card-action">Vào không gian học sinh →</span>
        </Link>
      </div>
    </section>
  );
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <section className="panel space-y-5">
      <h1>{title}</h1>
      <p className="description">Tính năng đang được chuẩn bị. Bạn có thể quay lại trang chủ.</p>
      <Link className="button" to="/">Về trang chủ</Link>
    </section>
  );
}

export function App() {
  return (
    <div className="mx-auto max-w-5xl px-5 sm:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 py-6">
        <Link to="/" className="brand">Q<span>Forge</span></Link>
        <nav aria-label="Điều hướng chính" className="flex gap-5 text-sm">
          <NavLink to="/teacher/quizzes">Giáo viên</NavLink>
          <NavLink to="/join">Học sinh</NavLink>
        </nav>
      </header>
      <main className="py-12 sm:py-16">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/teacher/quizzes" element={<PlaceholderPage title="Bài kiểm tra của tôi" />} />
          <Route path="/join" element={<PlaceholderPage title="Tham gia bài kiểm tra" />} />
          <Route path="/setup" element={<SetupPage />} />
          <Route path="*" element={<PlaceholderPage title="Không tìm thấy trang" />} />
        </Routes>
      </main>
    </div>
  );
}
