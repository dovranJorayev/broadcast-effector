import { fork } from "effector";
import { Provider as ScopeProvider } from "effector-react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import "./main.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

const scope = fork();

createRoot(rootElement).render(
  <StrictMode>
    <ScopeProvider value={scope}>
      <App />
    </ScopeProvider>
  </StrictMode>
);
