// src/main.tsx - COMPLETE UPDATED VERSION

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { WagmiProvider } from "wagmi";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import App from "./App.tsx";
import PlaybackPage from "./components/PlaybackPage.tsx"; // Import the new component
import { config } from "./wagmi.ts";

import "./index.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            {/* Main recording app */}
            <Route path="/" element={<App />} />
            
            {/* Playback route for shared audio */}
            <Route path="/play/:audioId" element={<PlaybackPage />} />
            
            {/* Fallback route */}
            <Route path="*" element={<App />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
);