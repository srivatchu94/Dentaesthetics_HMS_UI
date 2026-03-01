import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { TokenExpiryProvider } from "./context/TokenExpiryContext";
import "./index.css";

if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    console.error("🧨 GLOBAL ERROR:", event.message, event.error || event);
    const existing = Array.isArray(window.__hmsRuntimeLogs) ? window.__hmsRuntimeLogs : [];
    window.__hmsRuntimeLogs = [
      ...existing.slice(-99),
      {
        time: new Date().toISOString(),
        type: "error",
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno
      }
    ];
  });

  window.addEventListener("unhandledrejection", (event) => {
    console.error("🧨 UNHANDLED PROMISE REJECTION:", event.reason);
    const existing = Array.isArray(window.__hmsRuntimeLogs) ? window.__hmsRuntimeLogs : [];
    window.__hmsRuntimeLogs = [
      ...existing.slice(-99),
      {
        time: new Date().toISOString(),
        type: "unhandledrejection",
        reason: String(event.reason)
      }
    ];
  });
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <TokenExpiryProvider>
        <App />
      </TokenExpiryProvider>
    </BrowserRouter>
  </React.StrictMode>
);
