import { useEffect, useRef, useState } from "react";

import type {
  CustomerTurnResult,
  PreparedCustomerResponse,
} from "../../shared/contracts.js";

const SAMPLE =
  "My modem shows error E105 and the red light does not blink.";
const RESPONSE =
  "Confirme la luz WAN. Si el código E105 continúa después de reiniciar el módem, transfiera el caso a soporte técnico.";

export function App() {
  const [customerText, setCustomerText] = useState(SAMPLE);
  const [agentText, setAgentText] = useState(RESPONSE);
  const [turn, setTurn] = useState<CustomerTurnResult | null>(null);
  const [response, setResponse] = useState<PreparedCustomerResponse | null>(null);
  const [busy, setBusy] = useState<"turn" | "response" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [runtime, setRuntime] = useState<{ mode: "qvac" | "demo"; disclosure: string } | null>(null);
  const [recording, setRecording] = useState(false);
  const [transcriptionNote, setTranscriptionNote] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    void window.sovereignAgent.runtimeInfo().then(setRuntime);
  }, []);

  const processTurn = async () => {
    setBusy("turn");
    setError(null);
    setResponse(null);
    try {
      setTurn(await window.sovereignAgent.processCustomerUtterance({ text: customerText }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(null);
    }
  };

  const toggleRecording = async () => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
      setRecording(false);
      return;
    }

    setError(null);
    setTranscriptionNote(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        setBusy("turn");
        try {
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
          const transcription = await window.sovereignAgent.transcribeCustomerAudio(
            await blob.arrayBuffer(),
          );
          setCustomerText(transcription.text);
          setTranscriptionNote(`${transcription.modelName} · ${transcription.latencyMs} ms`);
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : String(cause));
        } finally {
          streamRef.current?.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
          recorderRef.current = null;
          chunksRef.current = [];
          setBusy(null);
        }
      };
      recorder.start();
      setRecording(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  };

  const closeSession = async () => {
    recorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    await window.sovereignAgent.closeSession();
    setCustomerText("");
    setAgentText("");
    setTurn(null);
    setResponse(null);
    setError(null);
    setTranscriptionNote("Sesión cerrada: audio, transcripción y traducciones eliminados.");
  };

  const prepareResponse = async () => {
    setBusy("response");
    setError(null);
    try {
      setResponse(await window.sovereignAgent.prepareCustomerResponse({ text: agentText }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(null);
    }
  };

  return (
    <main>
      <header className="topbar">
        <div className="brand-mark">QV</div>
        <div>
          <p className="eyebrow">PRIVATE EDGE INTELLIGENCE</p>
          <h1>QVAC Sovereign Agent</h1>
        </div>
        <div className={`runtime ${runtime?.mode ?? "loading"}`}>
          <span className="pulse" />
          {runtime ? (runtime.mode === "qvac" ? "QVAC LOCAL" : "DEMO MODE") : "PREPARANDO"}
        </div>
      </header>

      <section className="trust-strip">
        <strong>EN → ES → EVIDENCE → ES → EN</strong>
        <span>{runtime?.disclosure ?? "Verificando el runtime local…"}</span>
      </section>

      {error && <div className="error-banner">{error}</div>}

      <div className="workspace">
        <section className="conversation panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">LIVE CUSTOMER TURN</p>
              <h2>Cliente · English</h2>
            </div>
            <span className="language">EN</span>
          </div>

          <label htmlFor="customer">Intervención original</label>
          <button className={`record ${recording ? "active" : ""}`} onClick={toggleRecording} disabled={busy !== null}>
            {recording ? "Detener y transcribir" : "Grabar voz del cliente"}
          </button>
          {transcriptionNote && <small className="transcription-note">{transcriptionNote}</small>}
          <textarea id="customer" value={customerText} onChange={(event) => setCustomerText(event.target.value)} />
          <button className="primary" onClick={processTurn} disabled={busy !== null || !customerText.trim()}>
            {busy === "turn" ? "Traduciendo localmente…" : "Procesar turno"}
          </button>

          {turn && (
            <div className="translation-card">
              <div className="card-label"><span>TRADUCCIÓN PARA EL AGENTE</span><b>ES</b></div>
              <p>{turn.translatedText}</p>
              <small>{turn.translation.modelName} · {turn.translation.latencyMs} ms</small>
            </div>
          )}

          {turn?.criticalEntityState.kind === "blocked" && (
            <div className="blocked-card">
              <strong>Revisión requerida</strong>
              <span>Faltan: {turn.criticalEntityState.missing.join(", ") || "—"}</span>
              <span>Inesperadas: {turn.criticalEntityState.unexpected.join(", ") || "—"}</span>
            </div>
          )}
        </section>

        <section className="evidence panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">EVIDENCE GATE</p>
              <h2>Conocimiento empresarial</h2>
            </div>
            <span className={`decision ${turn?.kind ?? "waiting"}`}>{turn?.kind ?? "ESPERANDO"}</span>
          </div>

          {!turn && <div className="empty">Procesa una intervención para buscar evidencia vigente.</div>}
          {turn?.kind === "abstained" && <div className="abstention"><strong>Abstention</strong><p>{turn.abstentionReason}</p></div>}
          {turn?.evidence.map((item, index) => (
            <article className="evidence-card" key={item.documentId}>
              <div><b>0{index + 1}</b><span>{Math.round(item.score * 100)}% match</span></div>
              <h3>{item.title}</h3>
              <p>{item.excerpt}</p>
              <footer>{item.documentId} · v{item.version} · vigente hasta {item.expiresAt ?? "sin vencimiento"}</footer>
            </article>
          ))}

          {turn?.guidance && (
            <div className="guidance">
              <p className="eyebrow">SUPPORTED GUIDANCE</p>
              <ol>
                {turn.guidance.steps.map((step) => <li key={`${step.sourceDocumentId}-${step.text}`}>{step.text} <sup>{step.sourceDocumentId}</sup></li>)}
              </ol>
            </div>
          )}
        </section>

        <section className="response panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">HUMAN IN THE LOOP</p>
              <h2>Respuesta del agente</h2>
            </div>
            <span className="language">ES → EN</span>
          </div>
          <label htmlFor="agent">Redacta o ajusta en español</label>
          <textarea id="agent" value={agentText} onChange={(event) => setAgentText(event.target.value)} />
          <button className="secondary" onClick={prepareResponse} disabled={busy !== null || !agentText.trim()}>
            {busy === "response" ? "Validando…" : "Traducir y validar"}
          </button>

          {response && (
            <div className="customer-response">
              <div className="card-label"><span>RESPUESTA PARA EL CLIENTE</span><b>EN</b></div>
              <p>{response.customerText}</p>
              <div className={response.canConfirm ? "lock valid" : "lock blocked"}>
                {response.canConfirm ? "Critical Data Lock · VALID" : "Critical Data Lock · BLOCKED"}
              </div>
              <button className="confirm" disabled={!response.canConfirm}>Confirmar respuesta</button>
            </div>
          )}
        </section>
      </div>

      <footer className="footer"><span>Inference stays on this device</span><span>Agent confirmation required</span><button onClick={closeSession}>Cerrar sesión · Zero retention</button></footer>
    </main>
  );
}
