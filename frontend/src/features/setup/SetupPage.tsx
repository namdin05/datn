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
    setMessage("Đang gọi máy chủ…");
    try {
      const response = await fetchHealth();
      setStatus("online");
      setMessage(`Đã kết nối ${response.data.service}.`);
    } catch {
      setStatus("offline");
      setMessage("Không kết nối được máy chủ. Kiểm tra máy chủ backend và biến VITE_API_URL, rồi thử lại.");
    }
  }

  return (
    <Card className="setup-panel max-w-2xl space-y-6">
      <div className="space-y-3">
        <p className="eyebrow">Kiểm tra môi trường phát triển</p>
        <h1>Kết nối giao diện ↔ máy chủ</h1>
        <p className="description">Kiểm tra kết nối HTTP giữa giao diện và máy chủ. Kết nối cơ sở dữ liệu được kiểm tra riêng tại đường dẫn /ready của máy chủ.</p>
      </div>
      <PageState kind={status === 'loading' ? 'loading' : status === 'offline' ? 'error' : 'empty'} title={status === 'online' ? 'Máy chủ sẵn sàng' : status === 'offline' ? 'Không thể kết nối máy chủ' : status === 'loading' ? 'Đang kiểm tra' : 'Chưa kiểm tra kết nối'} description={message} />
      <div className="flex flex-wrap items-center gap-4">
        <Button disabled={status === "loading"} aria-busy={status === 'loading'} onClick={() => { void checkConnection(); }}>
          {status === "loading" ? "Đang kiểm tra…" : "Kiểm tra kết nối"}
        </Button>
        <Button variant="secondary" asChild><Link to="/">Về trang chủ</Link></Button>
      </div>
    </Card>
  );
}
