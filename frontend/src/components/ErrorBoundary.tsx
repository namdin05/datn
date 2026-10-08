import { Component } from 'react';
import type { ReactNode } from 'react';
import { PageState } from './PageState';
import { Button } from './ui/button';

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <main className="setup-container"><PageState kind="error" title="Không thể hiển thị trang" description="Hãy tải lại trang để thử lại."><Button onClick={() => window.location.reload()}>Tải lại trang</Button></PageState></main>;
    return this.props.children;
  }
}
