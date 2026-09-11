# Rendimiento y reproducibilidad

## Hardware medido

- HP Victus 15-fa0xxx.
- Windows 11 Home 64-bit.
- Intel i5-12450H, 8 núcleos y 12 procesadores lógicos.
- 15.7 GB RAM.
- NVIDIA RTX 3050 Laptop GPU, 4 GB.
- Vulkan 1.4.325.
- Node 22.17.0 y npm 10.9.2.

## Metodología

Todas las entradas son ficticias. Las pruebas se ejecutaron mediante `@qvac/sdk` 0.19.0 sin APIs externas de inferencia. La descarga inicial usa el registro de modelos de QVAC; las ejecuciones posteriores utilizan la caché local.

Los archivos JSONL conservan intentos fallidos durante el desarrollo porque permiten reproducir problemas operativos como el timeout inicial y la reinserción de IDs RAG. Ningún registro contiene datos de un cliente real.

## Traducción

`npm run smoke:translate` carga cada dirección por separado y registra modelo, entrada, salida, carga, latencia, tokens y throughput. Bergamot no informó `timeToFirstToken` en las llamadas no streaming; se considera `N/A`, no cero.

| Dirección | Carga inicial | Inferencia | Tokens | Throughput |
|---|---:|---:|---:|---:|
| EN → ES | 16,846 ms | 509 ms | 24 | 50.26 tokens/s |
| ES → EN | 8,418 ms | 387 ms | 12 | 32.74 tokens/s |

## RAG

`npm run smoke:rag` descarga EmbeddingGemma Q4, genera embeddings de 20 documentos y ejecuta una consulta. La primera preparación completa tardó 80,071 ms e incluyó descarga, carga, embeddings e inicialización. Después de la descarga, la indexación y carga completas bajaron a pocos segundos; las consultas calientes medidas en la evaluación tardaron 7–15 ms.

`npm run evaluate:rag` ejecuta 20 casos. Hay 18 preguntas empresariales con documento esperado y dos fuera del dominio que deben producir abstención.

- Umbral de Evidence Gate: 0.50.
- Precision@1: 16/18 = 88.9 %.
- Exactitud de abstención: 2/2 = 100 %.
- Fallos conocidos: una consulta sobre desconexiones prefirió el reinicio seguro; una consulta sobre todos los dispositivos prefirió el artículo de un solo dispositivo.

El dataset es pequeño. Estas cifras sirven como evidencia reproducible del prototipo y no estiman rendimiento en producción.

## ASR

`npm run smoke:asr` genera un WAV con voz sintética local, lo convierte a PCM mono 16 kHz y lo transcribe con Parakeet Unified Q4.

- Duración del audio: aproximadamente 4.7 s.
- Latencia de transcripción: 890 ms después de cargar el modelo.
- Referencia: “My modem shows error E one zero five and the red light does not blink.”
- Resultado: “My modem shows error E105 and the red light does not blink.”

## Flujo completo

`npm run smoke:flow` ejecuta EN → ES → RAG → ES → EN con modelos ya descargados. La ejecución de referencia tardó 7,450 ms incluyendo la carga en frío de los tres modelos involucrados. Después de precarga, la traducción y búsqueda quedan en el orden de cientos y decenas de milisegundos respectivamente.

La síntesis final fue extractiva y determinista; no tiene tokens, TTFT ni throughput de generación. Esos campos se documentan como `N/A` porque el MVP no carga un LLM generativo.
