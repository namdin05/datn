import { useState } from "react";
import { Link } from "react-router";
import { fetchHealth } from "../../lib/api";
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { PageState } from '../../components/PageState';

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
    <Card className="setup-panel max-w-2xl space-y-6">
      <div className="space-y-3">
        <p className="eyebrow">Kiểm tra môi trường phát triển</p>
        <h1>Kết nối FE ↔ BE</h1>
        <p className="description">Kiểm tra kết nối HTTP giữa frontend và backend. Kết nối database được kiểm tra riêng tại endpoint /ready của backend.</p>
      </div>
      <PageState kind={status === 'loading' ? 'loading' : status === 'offline' ? 'error' : 'empty'} title={status === 'online' ? 'API sẵn sàng' : status === 'offline' ? 'Không thể kết nối API' : status === 'loading' ? 'Đang kiểm tra' : 'Chưa kiểm tra kết nối'} description={message} />
      <div className="flex flex-wrap items-center gap-4">
        <Button disabled={status === "loading"} aria-busy={status === 'loading'} onClick={() => { void checkConnection(); }}>
          {status === "loading" ? "Đang kiểm tra…" : "Kiểm tra kết nối"}
        </Button>
        <Button variant="secondary" asChild><Link to="/">Về trang chủ</Link></Button>
      </div>
    </Card>
  );
}
