import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { App } from "./app/App";
import { ErrorBoundary } from './components/ErrorBoundary';
import "./styles.css";
import './features/landing/landing.css';

const container = document.getElementById("root");
if (!container) throw new Error("Missing root element.");

createRoot(container).render(
  <StrictMode>
    <BrowserRouter basename={window.location.pathname === '/preview' || window.location.pathname.startsWith('/preview/') ? '/preview' : '/'}><ErrorBoundary><App /></ErrorBoundary></BrowserRouter>
  </StrictMode>,
);
