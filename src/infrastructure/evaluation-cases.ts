export interface RagEvaluationCase {
  id: string;
  query: string;
  expectedDocumentId: string | null;
}

export const ragEvaluationCases: RagEvaluationCase[] = [
  { id: "RAG-01", query: "El internet se desconecta cada diez minutos y la luz del módem se pone roja.", expectedDocumentId: "NET-001" },
  { id: "RAG-02", query: "¿Cómo reinicio el módem de forma segura sin dañar la conexión?", expectedDocumentId: "NET-002" },
  { id: "RAG-03", query: "La luz LOS está roja y parece que el cable de fibra está flojo.", expectedDocumentId: "NET-003" },
  { id: "RAG-04", query: "La señal Wi-Fi casi no llega a la habitación del fondo.", expectedDocumentId: "NET-004" },
  { id: "RAG-05", query: "Olvidé la contraseña de mi red Wi-Fi y quiero cambiarla.", expectedDocumentId: "NET-005" },
  { id: "RAG-06", query: "Pago 500 Mbps pero la prueba por cable solo marca 80 Mbps.", expectedDocumentId: "NET-006" },
  { id: "RAG-07", query: "¿Hay mantenimiento programado hoy en mi zona?", expectedDocumentId: "NET-007" },
  { id: "RAG-08", query: "Ya hicimos las pruebas remotas y necesito agendar una visita técnica.", expectedDocumentId: "NET-008" },
  { id: "RAG-09", query: "Nos quedamos sin servicio después de la tormenta y los rayos.", expectedDocumentId: "NET-009" },
  { id: "RAG-10", query: "Solo mi laptop no conecta; los demás dispositivos navegan bien.", expectedDocumentId: "NET-010" },
  { id: "RAG-11", query: "Ningún teléfono ni computadora de la casa tiene internet.", expectedDocumentId: "NET-011" },
  { id: "RAG-12", query: "Tengo ping alto y lag cuando juego en línea.", expectedDocumentId: "NET-012" },
  { id: "RAG-13", query: "Quiero cambiar mi plan por uno de mayor velocidad y conocer el precio.", expectedDocumentId: "NET-013" },
  { id: "RAG-14", query: "Mi factura tiene un cargo por un módem que ya devolví.", expectedDocumentId: "NET-014" },
  { id: "RAG-15", query: "El módem presenta el código de error E105.", expectedDocumentId: "NET-015" },
  { id: "RAG-16", query: "El equipo está muy caliente y huele a quemado.", expectedDocumentId: "NET-018" },
  { id: "RAG-17", query: "El módem se mojó y tiene daño físico visible.", expectedDocumentId: "NET-019" },
  { id: "RAG-18", query: "El problema es desconocido y no existe un procedimiento aplicable.", expectedDocumentId: "NET-020" },
  { id: "RAG-19", query: "Necesito comprar boletos de avión para viajar mañana.", expectedDocumentId: null },
  { id: "RAG-20", query: "¿Qué medicamento debo tomar para el dolor de cabeza?", expectedDocumentId: null }
];
