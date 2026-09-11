# Guion de demostración — cinco minutos

## Antes de grabar

1. Ejecutar `npm run doctor` y mostrar todos los requisitos en `PASS`.
2. Ejecutar una vez las pruebas de humo para dejar los modelos descargados.
3. Abrir la aplicación con `npm run dev` sin `QVAC_RUNTIME_MODE=demo`.
4. Confirmar que la insignia superior dice `QVAC LOCAL`.
5. Cerrar navegadores o servicios que puedan sugerir inferencia remota.

## 0:00–0:35 — Problema empresarial

Explicar que un agente en Panamá atiende en español, recibe una llamada en inglés y además debe encontrar el procedimiento correcto entre muchos documentos. Hoy puede transferir la llamada, buscar manualmente o enviar voz y conocimiento privado a varios servicios en la nube.

## 0:35–1:00 — Arquitectura local

Mostrar la franja `EN → ES → EVIDENCE → ES → EN`. Aclarar que `@qvac/sdk` ejecuta ASR, traducción y RAG en la laptop; el agente conserva la decisión final.

## 1:00–1:45 — Audio y TranslatePsy

Pulsar **Grabar voz del cliente** y decir:

> My modem shows error E one zero five and the red light does not blink.

Detener la grabación. Mostrar la transcripción inglesa, el identificador `PARAKEET_UNIFIED_0_6B_Q4_0` y su latencia. Pulsar **Procesar turno** y mostrar la traducción española junto al nombre `BERGAMOT_EN_ES`.

## 1:45–2:45 — RAG y Evidence Gate

Mostrar que aparecen `NET-015 Código E105` y `NET-001 Interrupciones periódicas y luz roja`, con versión, vigencia, puntuación y fragmento. Explicar que el procedimiento antiguo `NET-016` puede aparecer entre los vecinos del vector, pero la regla determinista lo excluye por vencimiento.

Mostrar `Supported Guidance` y sus referencias. Aclarar que la guía es extractiva y no inventa pasos con conocimiento general.

## 2:45–3:35 — Respuesta bidireccional

Usar la respuesta:

> Confirme la luz WAN. Si el código E105 continúa después de reiniciar el módem, transfiera el caso a soporte técnico.

Pulsar **Traducir y validar**. Mostrar ambas versiones, `BERGAMOT_ES_EN` y `Critical Data Lock · VALID`. Explicar que la respuesta solo se habilita después de revisión humana.

## 3:35–4:15 — Fallos responsables

Cambiar en la versión simulada de una prueba `E105` por `E150` y mostrar el caso automatizado o la salida de `npm test`: Critical Data Lock bloquea la confirmación.

Introducir una consulta fuera del dominio y mostrar `Abstention`. Explicar que una traducción correcta no significa que la empresa tenga una solución respaldada.

## 4:15–4:40 — Zero retention

Pulsar **Cerrar sesión · Zero retention**. Mostrar que audio, transcripción, traducciones, evidencia y respuesta desaparecen. Aclarar que la app elimina los WAV/WebM temporales en un bloque `finally`, incluso cuando ASR falla.

## 4:40–5:00 — Evidencia medible

Mostrar `artifacts/evaluation/rag-evaluation.json`:

- 20 casos.
- 88.9 % Precision@1 en casos con respuesta.
- 100 % de abstención en casos fuera del dominio.
- RAG caliente de 7–15 ms en esta ejecución.

Cerrar con el valor: un agente monolingüe puede comprender, encontrar evidencia y responder con datos privados procesados en el dispositivo.
