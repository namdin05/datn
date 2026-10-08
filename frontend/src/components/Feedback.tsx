import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from './ui/button';

export function notifySuccess(message: string) {
  window.dispatchEvent(new CustomEvent('qforge-toast', { detail: message }));
}

export function ActionButton({ children, onClick, disabled = false, className = 'button' }: { children: ReactNode; onClick: () => void | Promise<void>; disabled?: boolean; className?: string }) {
  const [pending, setPending] = useState(false);
  const running = useRef(false);
  async function run() {
    if (running.current || disabled) return;
    running.current = true;
    setPending(true);
    try {
      // Give the browser a frame to paint feedback before running the action.
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      await onClick();
    } finally { running.current = false; setPending(false); }
  }
  return <Button className={className} disabled={disabled || pending} aria-busy={pending} onClick={() => { void run(); }}>{pending && <span className="button-spinner" aria-hidden="true" />}{pending ? 'Đang xử lý…' : children}</Button>;
}
