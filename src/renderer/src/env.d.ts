/// <reference types="vite/client" />

import type { SovereignAgentApi } from "../../shared/contracts.js";

declare global {
  interface Window {
    sovereignAgent: SovereignAgentApi;
  }
}

export {};
