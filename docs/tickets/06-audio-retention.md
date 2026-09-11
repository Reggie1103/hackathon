# Capturar audio del cliente y aplicar Zero-Retention Mode

## Objetivo

Aceptar una grabación o micrófono del cliente, estabilizar una intervención en inglés y limpiar todo el contenido al cerrar la sesión.

## Valor visible

Convierte la demostración de texto en un flujo de call center y hace verificable la promesa de privacidad local.

## Alcance

- Instalar/documentar `ffmpeg`.
- Integrar ASR QVAC para inglés, empezando por archivo y añadiendo micrófono.
- Mostrar parciales sin ejecutar RAG hasta una intervención estable.
- Limpiar audio, transcripción y traducciones al cerrar incluso después de errores.
- Conservar únicamente métricas agregadas y categoría anónima.

## Criterios de aceptación

- Un audio inglés produce una intervención estable y entra al flujo existente.
- Los parciales no disparan una guía prematura.
- Cerrar la sesión elimina memoria y temporales conocidos.
- El registro exportado no contiene audio, texto ni identificadores.

## Dependencia

Bloqueado por #6, la respuesta bilingüe protegida.

## Referencia

Spec #1.
