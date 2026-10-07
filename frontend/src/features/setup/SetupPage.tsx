import { useState } from "react";
import { Link } from "react-router";
import { fetchHealth } from "../../lib/api";

export function SetupPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "online" | "offline">("idle");
  const [message, setMessage] = useState("Chưa kiểm tra kết nối.");

  async function checkConnection() {
    setStatus("loading");
    setMessage("Đang gọi API…");
    try {
      const response = await fetchHealth();
      setStatus("online");
      setMessage(`Đã kết nối ${response.data.service}.`);
    } catch {
      setStatus("offline");
      setMessage("Không kết nối được API. Kiểm tra server BE và VITE_API_URL, rồi thử lại.");
    }
  }

  return (
    <section className="panel max-w-2xl space-y-6">
      <div className="space-y-3">
        <p className="eyebrow">Kiểm tra môi trường phát triển</p>
        <h1>Kết nối FE ↔ BE</h1>
        <p className="description">Trang này kiểm tra HTTP API và response contract dùng chung. Database, auth và các màn nghiệp vụ sẽ được triển khai ở các bước tiếp theo.</p>
      </div>
      <p role="status" className={status === "offline" ? "text-red-700" : status === "online" ? "text-emerald-700" : "text-slate-600"}>{message}</p>
      <div className="flex flex-wrap items-center gap-4">
        <button className="button" disabled={status === "loading"} onClick={() => { void checkConnection(); }}>
          {status === "loading" ? "Đang kiểm tra…" : "Kiểm tra kết nối"}
        </button>
        <Link className="text-sm text-slate-600 underline" to="/">Về trang chủ</Link>
      </div>
    </section>
  );
}
