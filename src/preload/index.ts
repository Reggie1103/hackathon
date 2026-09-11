import { contextBridge, ipcRenderer } from "electron";

import type { AudioTranscriptionUpdate, SovereignAgentApi } from "../shared/contracts.js";

const api: SovereignAgentApi = {
  startCustomerAudioStream: () => ipcRenderer.invoke("support:start-audio-stream"),
  appendCustomerAudioStream: (input) => ipcRenderer.invoke("support:append-audio-stream", input),
  finishCustomerAudioStream: (streamId) =>
    ipcRenderer.invoke("support:finish-audio-stream", streamId),
  cancelCustomerAudioStream: (streamId) =>
    ipcRenderer.invoke("support:cancel-audio-stream", streamId),
  onAudioTranscriptionUpdate: (listener) => {
    const handler = (_event: Electron.IpcRendererEvent, update: AudioTranscriptionUpdate) => {
      listener(update);
    };
    ipcRenderer.on("support:transcription-update", handler);
    return () => ipcRenderer.removeListener("support:transcription-update", handler);
  },
  processCustomerUtterance: (input) => ipcRenderer.invoke("support:customer-turn", input),
  prepareCustomerResponse: (input) => ipcRenderer.invoke("support:prepare-response", input),
  runtimeInfo: () => ipcRenderer.invoke("support:runtime-info"),
  closeSession: () => ipcRenderer.invoke("support:close-session"),
};

contextBridge.exposeInMainWorld("sovereignAgent", api);
