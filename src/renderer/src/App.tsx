import { useEffect, useRef, useState } from "react";

import type {
  CustomerTurnResult,
  PreparedCustomerResponse,
  RuntimeInfo,
} from "../../shared/contracts.js";

const SAMPLE =
  "My modem shows error E105 and the red light does not blink.";

function buildEvidenceDraft(turn: CustomerTurnResult): string {
  if (turn.kind !== "supported" || !turn.guidance) return "";
  const steps = turn.guidance.steps.slice(0, 2).map((step) => step.text).join(" ");
  return `Gracias por informarnos. ${steps}`;
}

export function App() {
  const [customerText, setCustomerText] = useState(SAMPLE);
  const [agentText, setAgentText] = useState("");
  const [turn, setTurn] = useState<CustomerTurnResult | null>(null);
  const [response, setResponse] = useState<PreparedCustomerResponse | null>(null);
  const [busy, setBusy] = useState<"turn" | "response" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [runtime, setRuntime] = useState<RuntimeInfo | null>(null);
  const [recording, setRecording] = useState(false);
  const [transcriptionNote, setTranscriptionNote] = useState<string | null>(null);
  const [audioState, setAudioState] = useState<"idle" | "provisional" | "stabilizing" | "stable">("idle");
  const [confirmed, setConfirmed] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const sessionGenerationRef = useRef(0);
  const discardRecordingRef = useRef(false);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const info = await window.sovereignAgent.runtimeInfo();
        if (!active) return;
        setRuntime(info);
        if (info.status === "error") setError(info.error ?? "QVAC no pudo prepararse.");
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : String(cause));
      }
    };
    void refresh();
    const interval = window.setInterval(() => void refresh(), 1_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const isCurrentSession = (generation: number) => generation === sessionGenerationRef.current;
  const runtimeReady = runtime?.status === "ready";

  const processTurn = async () => {
    const generation = sessionGenerationRef.current;
    setBusy("turn");
    setError(null);
    setResponse(null);
    setConfirmed(false);
    try {
      const result = await window.sovereignAgent.processCustomerUtterance({ text: customerText });
      if (!isCurrentSession(generation)) return;
      setTurn(result);
      setAgentText(buildEvidenceDraft(result));
      setAudioState("stable");
    } catch (cause) {
      if (isCurrentSession(generation)) setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      if (isCurrentSession(generation)) setBusy(null);
    }
  };

  const toggleRecording = async () => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
      setRecording(false);
      setAudioState("stabilizing");
      return;
    }

    setError(null);
    setTranscriptionNote(null);
    setAudioState("provisional");
    const generation = sessionGenerationRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!isCurrentSession(generation)) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      const recorder = new MediaRecorder(stream);
      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        const generation = sessionGenerationRef.current;
        const discarded = discardRecordingRef.current;
        discardRecordingRef.current = false;
        if (discarded) {
          streamRef.current?.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
          recorderRef.current = null;
          chunksRef.current = [];
          return;
        }
        setBusy("turn");
        try {
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
          const transcription = await window.sovereignAgent.transcribeCustomerAudio(
            await blob.arrayBuffer(),
          );
          if (!isCurrentSession(generation)) return;
          setCustomerText(transcription.text);
          setTranscriptionNote(`${transcription.modelName} · ${transcription.latencyMs} ms`);
          setAudioState("stable");
        } catch (cause) {
          if (isCurrentSession(generation)) setError(cause instanceof Error ? cause.message : String(cause));
        } finally {
          streamRef.current?.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
          recorderRef.current = null;
          chunksRef.current = [];
          if (isCurrentSession(generation)) setBusy(null);
        }
      };
      recorder.start();
      setRecording(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  };

  const closeSession = async () => {
    sessionGenerationRef.current += 1;
    discardRecordingRef.current = true;
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    await window.sovereignAgent.closeSession();
    setCustomerText("");
    setAgentText("");
    setTurn(null);
    setResponse(null);
    setError(null);
    setRecording(false);
    setBusy(null);
    setAudioState("idle");
    setConfirmed(false);
    setTranscriptionNote("Sesión cerrada: audio, transcripción y traducciones eliminados.");
  };

  const prepareResponse = async () => {
    const generation = sessionGenerationRef.current;
    setBusy("response");
    setError(null);
    setConfirmed(false);
    try {
      const result = await window.sovereignAgent.prepareCustomerResponse({ text: agentText });
      if (isCurrentSession(generation)) setResponse(result);
    } catch (cause) {
      if (isCurrentSession(generation)) setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      if (isCurrentSession(generation)) setBusy(null);
    }
  };

  return (
    <main>
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark">QV</div>
          <strong>QVAC</strong>
          <span>Sovereign Agent</span>
        </div>
        <label className="global-search" aria-label="Buscar en la base de conocimiento">
          <span>⌕</span>
          <input placeholder="Buscar caso, código o documento" />
        </label>
        <div className={`runtime ${runtime?.mode ?? "loading"} ${runtime?.status ?? "loading"}`}>
          <span className="pulse" />
          {!runtime || runtime.status === "loading"
            ? "PREPARANDO QVAC"
            : runtime.status === "error"
              ? "QVAC ERROR"
              : runtime.mode === "qvac" ? "QVAC LOCAL" : "DEMO MODE"}
        </div>
      </header>

      <nav className="product-nav" aria-label="Navegación del producto">
        <span className="active">Atención en vivo</span>
        <span>Base de conocimiento</span>
        <span>Evaluaciones</span>
        <span>Métricas locales</span>
        <span>Configuración</span>
      </nav>

      <section className="workflow-intro">
        <div>
          <p className="eyebrow">PRIVATE EDGE INTELLIGENCE</p>
          <h1>Atención bilingüe, con evidencia.</h1>
          <p>Entiende al cliente en inglés, trabaja en español y confirma cada respuesta con conocimiento vigente de la empresa.</p>
        </div>
        <div className="flow-summary">
          <strong>EN → ES → EVIDENCE → ES → EN</strong>
          <span>{runtime?.disclosure ?? "Verificando el runtime local…"}</span>
        </div>
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
          <button className={`record ${recording ? "active" : ""}`} onClick={toggleRecording} disabled={busy !== null || !runtimeReady}>
            {recording ? "Detener y transcribir" : "Grabar voz del cliente"}
          </button>
          {audioState !== "idle" && <small className="transcription-note">{audioState === "provisional" ? "Audio provisional: capturando la intervención." : audioState === "stabilizing" ? "Estabilizando audio antes de transcribir." : "Intervención estable y lista para traducir."}</small>}
          {transcriptionNote && <small className="transcription-note">{transcriptionNote}</small>}
          <textarea id="customer" value={customerText} onChange={(event) => { setCustomerText(event.target.value); setAudioState("stable"); setConfirmed(false); }} />
          <button className="primary" onClick={processTurn} disabled={busy !== null || !customerText.trim() || !runtimeReady}>
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
          <textarea id="agent" value={agentText} onChange={(event) => { setAgentText(event.target.value); setConfirmed(false); }} />
          {turn?.kind !== "supported" && <div className="abstention"><strong>Evidence Gate cerrado</strong><p>Primero procesa una consulta respaldada por evidencia vigente.</p></div>}
          <button className="secondary" onClick={prepareResponse} disabled={busy !== null || !agentText.trim() || !runtimeReady || turn?.kind !== "supported"}>
            {busy === "response" ? "Validando…" : "Traducir y validar"}
          </button>

          {response && (
            <div className="customer-response">
              <div className="card-label"><span>RESPUESTA PARA EL CLIENTE</span><b>EN</b></div>
              <p>{response.customerText}</p>
              <div className={response.canConfirm ? "lock valid" : "lock blocked"}>
                {response.canConfirm ? "Critical Data Lock · VALID" : "Critical Data Lock · BLOCKED"}
              </div>
              {!response.canConfirm && <small className="transcription-note">{response.blockedReason ?? "Revise las entidades críticas antes de confirmar."}</small>}
              <button className="confirm" disabled={!response.canConfirm || confirmed} onClick={() => setConfirmed(true)}>{confirmed ? "Respuesta confirmada por el agente" : "Confirmar respuesta"}</button>
            </div>
          )}
        </section>
      </div>

      <footer className="footer"><span>Inference stays on this device</span><span>Agent confirmation required</span><button onClick={closeSession}>Cerrar sesión · Zero retention</button></footer>
    </main>
  );
}
