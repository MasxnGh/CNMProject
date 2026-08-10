import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./styles/theme.css";
import { GameProvider } from "./state/GameContext.jsx";
import { RunProvider } from "./state/RunContext.jsx";
import { BurstProvider } from "./state/BurstContext.jsx";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <GameProvider>
        <RunProvider>
          <BurstProvider>
            <App />
          </BurstProvider>
        </RunProvider>
      </GameProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
