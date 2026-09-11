# Probar el runtime local y TranslatePsy en el hardware objetivo

## Objetivo

Entregar una ruta de texto reproducible que cargue `@qvac/sdk`, traduzca una frase inglés → español y otra español → inglés con TranslatePsy, y guarde identificador de modelo, variante, cuantización y latencias reales.

## Valor visible

Demuestra que TranslatePsy, pieza central del producto, corre localmente en la PC de la demo antes de invertir tiempo en la interfaz completa.

## Alcance

- Crear el proyecto Electron + React + TypeScript con QVAC en el proceso principal.
- Añadir un diagnóstico de Node, Vulkan, espacio y `ffmpeg`.
- Instalar `@qvac/sdk` y enumerar/seleccionar paquetes compatibles de TranslatePsy-EuroNano.
- Ejecutar ambas direcciones ES ↔ EN desde una prueba de humo explícita.
- Registrar errores accionables y métricas reales sin afirmar éxito cuando se use un adaptador simulado.

## Criterios de aceptación

- `npm run doctor` informa los prerrequisitos y falla si falta uno obligatorio.
- `npm run smoke:translate` intenta la inferencia real y escribe un registro JSONL.
- Los nombres reales de modelo y cuantización aparecen en la documentación.
- Ningún servicio remoto de IA participa en la inferencia.
- Existe un modo determinista para desarrollar la interfaz, marcado claramente como demo y excluido de métricas oficiales.

## Validación

- Pruebas de contrato de la salida del diagnóstico.
- Ejecución del diagnóstico en el HP Victus.
- Evidencia del resultado real o del bloqueo exacto de descarga/carga del modelo.

## Referencia

Spec #1.
