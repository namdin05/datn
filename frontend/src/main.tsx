import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { App } from "./app/App";
import { ErrorBoundary } from './components/ErrorBoundary';
import "./styles.css";

const container = document.getElementById("root");
if (!container) throw new Error("Missing root element.");

createRoot(container).render(
  <StrictMode>
    <BrowserRouter><ErrorBoundary><App /></ErrorBoundary></BrowserRouter>
  </StrictMode>,
);
