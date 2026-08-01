import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./AppRoutes.jsx";
import { ProgressProvider } from "./lib/ProgressContext.jsx";
import "./styles/responsive-tokens.css";
import "./styles/theme.css";
import "./styles/lantern-ui.css";
import "./index.css";

/* `/` is the HelloChinese-style route map (Phase 1). The old, fully working
   game stays reachable at /classic - it keeps its own independent progress
   store (utils/storage.js) and never touches ProgressContext, so the two
   experiences don't interfere with each other. vercel.json rewrites every
   path back to index.html so a refresh on these deep links doesn't 404 in
   production; see AppRoutes.jsx for the lazy-loading/transition setup. */
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ProgressProvider>
        <AppRoutes />
      </ProgressProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
