import { StrictMode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { App } from "./App";
import { PortalAuthProvider } from "./lib/auth/PortalAuthContext";
import { portalQueryClient } from "./lib/query";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={portalQueryClient}>
      <BrowserRouter>
        <PortalAuthProvider>
          <App />
        </PortalAuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
