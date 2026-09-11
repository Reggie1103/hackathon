export interface RagEvaluationCase {
  id: string;
  customerTextEn: string;
  referenceTranslationEs: string;
  intent: string;
  expectedCriticalEntities: string[];
  expectedDocumentId: string | null;
  expectedDecision: "supported" | "abstained";
  approvedResponseEs: string;
}

const caseData: Array<[string, string, string, string, string[], string | null, "supported" | "abstained", string]> = [
  ["RAG-01", "My internet disconnects every 10 minutes and ticket 1001 reports a red modem light.", "Mi internet se desconecta cada 10 minutos y el ticket 1001 reporta una luz roja en el módem.", "cortes periódicos", ["10", "1001"], "NET-001", "supported", "Para el ticket 1001, confirme la luz roja y escale si continúa por más de 10 minutos."],
  ["RAG-02", "How do I safely restart modem model AX20 after case 1002?", "¿Cómo reinicio de forma segura el módem modelo AX20 después del caso 1002?", "reinicio seguro", ["1002"], "NET-002", "supported", "Para el caso 1002, reinicie el módem AX20 siguiendo el procedimiento seguro."],
  ["RAG-03", "The LOS light is red and fiber cable F-03 is loose in incident 1003.", "La luz LOS está roja y el cable de fibra F-03 está flojo en el incidente 1003.", "fibra LOS", ["F-03", "1003"], "NET-003", "supported", "No manipule el cable F-03; programe revisión para el incidente 1003."],
  ["RAG-04", "Wi-Fi signal does not reach room 4 with router R4, case 1004.", "La señal Wi-Fi no llega a la habitación 4 con el router R4, caso 1004.", "alcance Wi-Fi", ["4", "1004"], "NET-004", "supported", "Para el caso 1004, acerque el router R4 a la habitación 4."],
  ["RAG-05", "I forgot my Wi-Fi password for network 5G-1005 and need to change it.", "Olvidé mi contraseña Wi-Fi para la red 5G-1005 y necesito cambiarla.", "credenciales Wi-Fi", ["1005"], "NET-005", "supported", "Verifique identidad antes de cambiar la clave de la red 5G-1005."],
  ["RAG-06", "I pay for 500 Mbps but wired test on ticket 1006 shows only 80 Mbps.", "Pago 500 Mbps pero la prueba por cable del ticket 1006 muestra solo 80 Mbps.", "velocidad inferior", ["500", "1006", "80"], "NET-006", "supported", "Para el ticket 1006, mida por cable: el plan es 500 Mbps y el resultado fue 80 Mbps."],
  ["RAG-07", "Is scheduled maintenance planned today for zone Z-07, reference 1007?", "¿Hay mantenimiento programado hoy para la zona Z-07, referencia 1007?", "mantenimiento", ["Z-07", "1007"], "NET-007", "supported", "Revise el estado de la zona Z-07 para la referencia 1007."],
  ["RAG-08", "Remote tests are complete and I need a technical visit for ticket 1008.", "Las pruebas remotas están completas y necesito una visita técnica para el ticket 1008.", "visita técnica", ["1008"], "NET-008", "supported", "Agende la visita técnica para el ticket 1008."],
  ["RAG-09", "Service failed after a storm on circuit C-09, incident 1009.", "El servicio falló después de una tormenta en el circuito C-09, incidente 1009.", "daño por tormenta", ["C-09", "1009"], "NET-009", "supported", "Priorice la inspección del circuito C-09 para el incidente 1009."],
  ["RAG-10", "Only laptop L10 cannot connect; the other 2 devices work, case 1010.", "Solo la laptop L10 no conecta; los otros 2 dispositivos funcionan, caso 1010.", "un dispositivo", ["2", "1010"], "NET-010", "supported", "Para el caso 1010, revise la conexión de la laptop L10; los otros 2 equipos sí funcionan."],
  ["RAG-11", "No phone or computer in house H11 has internet, incident 1011.", "Ningún teléfono ni computadora de la casa H11 tiene internet, incidente 1011.", "sin servicio total", ["NEGATION", "1011"], "NET-011", "supported", "Para el incidente 1011, confirme que ningún equipo de la casa H11 tiene servicio."],
  ["RAG-12", "I have high ping and lag in online game G12, ticket 1012.", "Tengo ping alto y lag en el juego en línea G12, ticket 1012.", "latencia", ["G12", "1012"], "NET-012", "supported", "Ejecute la prueba de latencia para el ticket 1012 en el juego G12."],
  ["RAG-13", "I want to upgrade plan P13 and know the price, quote 1013.", "Quiero subir al plan P13 y conocer el precio, cotización 1013.", "cambio de plan", ["P13", "1013"], "NET-013", "supported", "Ofrezca las opciones del plan P13 para la cotización 1013."],
  ["RAG-14", "My bill has a charge for modem M14 that I returned, ticket 1014.", "Mi factura tiene un cargo por el módem M14 que devolví, ticket 1014.", "cargo de módem", ["M14", "1014"], "NET-014", "supported", "Revise la devolución del módem M14 en el ticket 1014."],
  ["RAG-15", "Modem shows error E105 and red light does not blink, incident 1015.", "El módem presenta el error E105 y la luz roja no parpadea, incidente 1015.", "error E105", ["E105", "NEGATION", "1015"], "NET-015", "supported", "Confirme la luz WAN. Si E105 continúa, escale el incidente 1015."],
  ["RAG-16", "Equipment Q16 is very hot and smells burned, case 1016.", "El equipo Q16 está muy caliente y huele a quemado, caso 1016.", "seguridad eléctrica", ["Q16", "1016"], "NET-018", "supported", "Desconecte el equipo Q16 y escale el caso 1016 por seguridad."],
  ["RAG-17", "Modem W17 got wet and has visible physical damage, incident 1017.", "El módem W17 se mojó y tiene daño físico visible, incidente 1017.", "daño físico", ["W17", "1017"], "NET-019", "supported", "No encienda el módem W17; programe revisión para el incidente 1017."],
  ["RAG-18", "Issue X18 is unknown and no documented procedure applies, case 1018.", "El problema X18 es desconocido y no existe un procedimiento aplicable, caso 1018.", "sin procedimiento", ["X18", "NEGATION", "1018"], "NET-020", "supported", "Escalone el caso 1018 porque no existe un procedimiento para X18."],
  ["RAG-19", "I need to buy 2 airline tickets for tomorrow, reference 1019.", "Necesito comprar 2 boletos de avión para mañana, referencia 1019.", "fuera de dominio vuelos", ["2", "1019"], null, "abstained", "No hay una respuesta empresarial aprobada para la referencia 1019."],
  ["RAG-20", "What medicine should I take for headache level 20, case 1020?", "¿Qué medicamento debo tomar para dolor de cabeza nivel 20, caso 1020?", "fuera de dominio salud", ["20", "1020"], null, "abstained", "No hay una respuesta empresarial aprobada para el caso 1020."],
];

export const ragEvaluationCases: RagEvaluationCase[] = caseData.map(([
  id, customerTextEn, referenceTranslationEs, intent, expectedCriticalEntities, expectedDocumentId, expectedDecision, approvedResponseEs,
]) => ({ id, customerTextEn, referenceTranslationEs, intent, expectedCriticalEntities, expectedDocumentId, expectedDecision, approvedResponseEs }));
