import { contextBridge, ipcRenderer } from "electron";

import type { SovereignAgentApi } from "../shared/contracts.js";

const api: SovereignAgentApi = {
  transcribeCustomerAudio: (audio) => ipcRenderer.invoke("support:transcribe-audio", audio),
  processCustomerUtterance: (input) => ipcRenderer.invoke("support:customer-turn", input),
  prepareCustomerResponse: (input) => ipcRenderer.invoke("support:prepare-response", input),
  runtimeInfo: () => ipcRenderer.invoke("support:runtime-info"),
  closeSession: () => ipcRenderer.invoke("support:close-session"),
};

contextBridge.exposeInMainWorld("sovereignAgent", api);
