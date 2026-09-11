import type {
  CriticalEntityState,
  CustomerTurnInput,
  CustomerTurnResult,
  Evidence,
  LocalAiGateway,
  PreparedCustomerResponse,
  SupportedGuidance,
} from "../shared/contracts.ts";

export const DEFAULT_EVIDENCE_THRESHOLD = 0.5;
export const DEFAULT_RELATIVE_EVIDENCE_MARGIN = 0.05;

const CUSTOMER_RESPONSE_TEMPLATES: Record<string, string> = {
  "NET-001": "Gracias por informarnos. ¿Podría confirmar si la luz roja permanece encendida o parpadea y decirme el código que muestra el módem?",
  "NET-002": "Vamos a reiniciar el módem de forma segura. Desconéctelo de la energía durante 30 segundos, vuelva a conectarlo y espere hasta cinco minutos mientras se estabilizan las luces.",
  "NET-003": "Por seguridad, no doble ni retire el cable de fibra. Revise visualmente el conector y dígame si la luz LOS permanece roja para escalar el caso.",
  "NET-004": "Comparemos la cobertura: pruebe la señal junto al módem y después en la habitación afectada. Con ese resultado podremos determinar si necesita reubicar el equipo o usar un repetidor.",
  "NET-005": "Con gusto le ayudaré a cambiar la contraseña de su Wi-Fi. Para proteger su cuenta, primero validaré su identidad; después le indicaré paso a paso cómo actualizar el nombre o la contraseña de la red.",
  "NET-006": "Hagamos una medición confiable. Conecte un solo equipo por cable Ethernet y comparta los resultados de descarga, subida y latencia.",
  "NET-007": "Voy a verificar si existe mantenimiento programado en su zona y cuál es la ventana vigente antes de atribuirle la interrupción.",
  "NET-008": "Como las verificaciones remotas ya terminaron, podemos programar una visita técnica. Confirmemos la fecha, la franja horaria y un teléfono de contacto.",
  "NET-009": "Lamento la interrupción. Primero revisaré si existe un incidente en su zona; por seguridad, no manipule cableado exterior después de la tormenta.",
  "NET-010": "Como los demás equipos sí navegan, trabajaremos únicamente con el dispositivo afectado. Olvide la red Wi-Fi en ese equipo y vuelva a conectarlo.",
  "NET-011": "Como ningún dispositivo tiene conexión, revisemos la energía del módem, las luces WAN y si existe una incidencia en su zona antes de reiniciarlo.",
  "NET-012": "Para revisar la latencia, haga una prueba por cable sin descargas simultáneas y comparta el ping y el servidor utilizado por el juego.",
  "NET-013": "Puedo explicarle las opciones de mayor velocidad, su precio y la fecha efectiva. Antes de realizar un cambio necesitaremos validar su identidad y obtener su confirmación.",
  "NET-014": "Voy a revisar el inventario asociado a su cuenta. Si conserva el comprobante de devolución del equipo, podremos escalar el cargo al área de facturación.",
  "NET-015": "El código E105 corresponde a un fallo de autenticación. Confirme el estado de la luz WAN; si el código continúa después del reinicio, escalaré el caso con el código exacto.",
  "NET-018": "Por seguridad, desconecte el equipo únicamente si puede hacerlo sin riesgo y no realice más pruebas eléctricas. Escalaré el caso de inmediato.",
  "NET-019": "No abra ni intente reparar el módem. Documentaremos el daño visible y coordinaremos una evaluación del equipo.",
  "NET-020": "No encuentro un procedimiento vigente que resuelva este caso. Registraré la categoría y lo escalaré para evitar darle una instrucción incorrecta.",
};

const CODE_OR_NUMBER = /\b(?:[A-Za-z]{1,6}-?\d{2,}|\d+(?:[.,]\d+)?)\b/g;
const NEGATION_EN = /\b(?:no|not|never|without)\b/i;
const NEGATION_ES = /\b(?:no|nunca|jamás|sin)\b/i;

export function extractCriticalEntities(text: string): string[] {
  const values = [...text.matchAll(CODE_OR_NUMBER)].map((match) =>
    match[0].replace(",", ".").toUpperCase(),
  );
  if (NEGATION_EN.test(text) || NEGATION_ES.test(text)) values.push("NEGATION");
  return [...new Set(values)].sort();
}

export function compareCriticalEntities(source: string, translated: string): CriticalEntityState {
  const sourceEntities = extractCriticalEntities(source);
  const translatedEntities = extractCriticalEntities(translated);
  const missing = sourceEntities.filter((entity) => !translatedEntities.includes(entity));
  const unexpected = translatedEntities.filter((entity) => !sourceEntities.includes(entity));

  return missing.length || unexpected.length
    ? { kind: "blocked", missing, unexpected }
    : { kind: "valid", entities: sourceEntities };
}

function isUsableEvidence(evidence: Evidence, now: Date, threshold: number): boolean {
  const effectiveAt = new Date(`${evidence.effectiveAt}T00:00:00Z`);
  const expiresAt = evidence.expiresAt
    ? new Date(`${evidence.expiresAt}T23:59:59Z`)
    : null;

  return (
    evidence.status === "active" &&
    evidence.score >= threshold &&
    effectiveAt <= now &&
    (!expiresAt || expiresAt >= now)
  );
}

function buildExtractiveGuidance(evidence: Evidence[]): SupportedGuidance {
  const primaryEvidence = evidence[0];
  return {
    summary: "Guía respaldada por documentación vigente.",
    steps: evidence.map((item) => ({
      text: item.excerpt,
      sourceDocumentId: item.documentId,
    })),
    customerDraft:
      CUSTOMER_RESPONSE_TEMPLATES[primaryEvidence.documentId] ??
      `Gracias por informarnos. ${primaryEvidence.excerpt}`,
  };
}

export async function processCustomerUtterance(
  input: CustomerTurnInput,
  gateway: LocalAiGateway,
  evidenceThreshold = DEFAULT_EVIDENCE_THRESHOLD,
): Promise<CustomerTurnResult> {
  const translation = await gateway.translate(input.text, "en", "es");
  const criticalEntityState = compareCriticalEntities(input.text, translation.text);

  if (criticalEntityState.kind === "blocked") {
    return {
      kind: "blocked",
      originalText: input.text,
      translatedText: translation.text,
      translation,
      evidence: [],
      guidance: null,
      criticalEntityState,
    };
  }

  const now = input.now ?? new Date();
  const usableEvidence = (await gateway.search(translation.text, 12))
    .filter((item) => isUsableEvidence(item, now, evidenceThreshold))
    .sort((left, right) => right.score - left.score);
  const strongestScore = usableEvidence[0]?.score;
  const evidence = usableEvidence
    .filter(
      (item) => strongestScore !== undefined && strongestScore - item.score <= DEFAULT_RELATIVE_EVIDENCE_MARGIN,
    )
    .slice(0, 3);

  if (evidence.length === 0) {
    return {
      kind: "abstained",
      originalText: input.text,
      translatedText: translation.text,
      translation,
      evidence: [],
      guidance: null,
      criticalEntityState,
      abstentionReason: "No hay evidencia vigente suficiente.",
    };
  }

  return {
    kind: "supported",
    originalText: input.text,
    translatedText: translation.text,
    translation,
    evidence,
    guidance: buildExtractiveGuidance(evidence),
    criticalEntityState,
  };
}

export async function prepareCustomerResponse(
  input: { text: string },
  gateway: LocalAiGateway,
  turnDecision: CustomerTurnResult["kind"] | null,
): Promise<PreparedCustomerResponse> {
  const translation = await gateway.translate(input.text, "es", "en");
  const criticalEntityState = compareCriticalEntities(input.text, translation.text);

  const evidenceState = turnDecision === "supported" ? "supported" : "blocked";
  const blockedReason =
    evidenceState === "blocked"
      ? "Evidence Gate está cerrado. Procese una consulta con evidencia vigente antes de confirmar."
      : undefined;

  return {
    agentText: input.text,
    customerText: translation.text,
    translation,
    criticalEntityState,
    evidenceState,
    blockedReason,
    canConfirm: evidenceState === "supported" && criticalEntityState.kind === "valid",
  };
}
