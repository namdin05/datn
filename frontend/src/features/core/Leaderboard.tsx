import { useEffect, useRef, useState } from 'react';
import type { LeaderboardEntry, RealtimeAuth, SessionChanged } from '@qforge/shared';
import { realtimeLabel, subscribeSession } from '../../lib/realtime';
import type { RealtimeStatus } from '../../lib/realtime';

export function LeaderboardTable({ entries, highlight, answered }: { entries: LeaderboardEntry[]; highlight?: string; answered?: Map<string, boolean> }) {
  return <div className="card table-wrap"><table className="leaderboard"><thead><tr><th>Hạng</th><th>Học viên</th><th>Điểm</th><th>Đúng</th>{answered && <th>Câu hiện tại</th>}</tr></thead><tbody>
    {entries.map(e => <tr key={e.participantId} className={e.participantId === highlight ? 'me' : undefined}><td className="rank">#{e.rank}</td><td>{e.nickname}{e.participantId === highlight && ' (bạn)'}</td><td className="pin-text">{e.score}</td><td>{e.correct}</td>{answered && <td>{answered.get(e.participantId) ? 'Đã trả lời' : 'Chưa trả lời'}</td>}</tr>)}
  </tbody></table>{!entries.length && <p className="empty">Chưa có học viên.</p>}</div>;
}

export function RealtimeBadge({ status }: { status: RealtimeStatus }) {
  return <p className={`realtime-status ${status}`} role="status"><span className="online-dot" />{realtimeLabel[status]}</p>;
}

// Subscribes while mounted. Handlers may change every render; the socket does not.
export function useSessionRealtime(key: string | undefined, getAuth: () => Promise<RealtimeAuth>, onChange: (change: SessionChanged | null) => void, onRevoked?: () => void) {
  const [status, setStatus] = useState<RealtimeStatus>('connecting');
  const latest = useRef({ getAuth, onChange, onRevoked });
  useEffect(() => { latest.current = { getAuth, onChange, onRevoked }; });
  useEffect(() => {
    if (!key) return;
    return subscribeSession(() => latest.current.getAuth(), {
      onChange: change => latest.current.onChange(change),
      onStatus: setStatus,
      onRevoked: () => latest.current.onRevoked?.(),
    });
  }, [key]);
  return status;
}
