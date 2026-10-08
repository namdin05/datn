import type { ReactNode } from 'react';
import { Brand, Badge, Footer } from '../../components/Common';

export function StudentLayout({ name, children }: { name: string; children: ReactNode }) {
  return <><header className="student-header"><Brand /><div><Badge tone="green">● Demo cùng trình duyệt</Badge><span className="avatar">{name[0]}</span><strong>{name}</strong></div></header><main id="main-content" className="student-main">{children}</main><Footer /></>;
}
