import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Icon } from './Icon';

export function Brand() { return <a href="/" className="brand"><span className="brand-mark"><Icon name="◇" /></span>QForge</a>; }
export function Badge({ children, tone = '' }: { children: ReactNode; tone?: string }) { return <span className={`badge ${tone}`}>{children}</span>; }
export function PublicHeader() { return <header className="public-header"><Brand /><nav><Link to="/join">Tham gia bằng PIN</Link><Link className="button small" to="/login">Giảng viên</Link></nav></header>; }
export function ErrorMessage({ message }: { message: string }) { return message ? <p className="error" role="alert">{message}</p> : null; }
export function Footer() { return <footer>© 2026 QForge · Cùng học, cùng tiến bộ.</footer>; }
