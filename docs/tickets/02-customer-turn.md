# Mostrar un turno bilingüe completo al agente

## Objetivo

Permitir que el agente introduzca o cargue una intervención en inglés y vea el original, su traducción al español y el estado del procesamiento en la aplicación de escritorio.

## Valor visible

Un agente hispanohablante puede comprender una consulta inglesa mediante el mismo contrato que utilizará el audio.

## Alcance

- Implementar el flujo público `processCustomerUtterance`.
- Definir `LocalAiGateway` y adaptadores determinista/QVAC.
- Exponer IPC tipado mediante preload.
- Crear los estados Preparando, Traduciendo, Listo y Error recuperable.
- Mantener el texto original visible.

## Criterios de aceptación

- La entrada “My modem shows error E105” muestra original y traducción.
- Un fallo de traducción no borra el original y permite reintentar.
- El renderer no tiene acceso directo a Node.js.
- Las pruebas observan el resultado público y no detalles internos del SDK.

## Dependencia

Bloqueado por #2, la prueba del runtime local y TranslatePsy.

## Referencia

Spec #1.
