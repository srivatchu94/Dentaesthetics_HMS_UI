import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { TokenExpiryProvider } from "./context/TokenExpiryContext";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <TokenExpiryProvider>
        <App />
      </TokenExpiryProvider>
    </BrowserRouter>
  </React.StrictMode>
);
