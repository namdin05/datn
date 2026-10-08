import type { ReactNode } from 'react';
import { Card } from './ui/card';
import { Icon } from './Icon';

export function PageState({ title, description, children, kind = 'empty' }: { title: string; description?: string; children?: ReactNode; kind?: 'empty' | 'error' | 'loading' }) {
  return <Card className={`page-state ${kind}`} role={kind === 'error' ? 'alert' : kind === 'loading' ? 'status' : undefined} aria-busy={kind === 'loading'}>
    {kind === 'loading' ? <span className="button-spinner" aria-hidden="true" /> : <Icon name={kind === 'error' ? '⊗' : '▤'} />}
    <h2>{title}</h2>{description && <p>{description}</p>}{children && <div className="page-state-actions">{children}</div>}
  </Card>;
}
