import "./styles/globals.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { SentryLogger } from "@lib/logger/sentry";
import { router } from "@/lib/router";
import { Toaster } from "@/components/common/toaster";
import { ClerkProvider } from "@clerk/react";
import { config } from "@/lib/config/config";

SentryLogger.init(router);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={config.VITE_CLERK_PUBLISHABLE_KEY}>
      <App />
      <Toaster />
    </ClerkProvider>
  </React.StrictMode>,
);
