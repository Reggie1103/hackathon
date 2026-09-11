# Traducir la respuesta del agente y proteger Critical Entities

## Objetivo

Permitir que el agente prepare una respuesta en español, revise la traducción al inglés y solo la confirme cuando códigos, números, fechas, cantidades, identificadores, modelos y negaciones se conserven.

## Valor visible

Completa la comunicación bidireccional y reduce el riesgo de alterar datos que cambian la solución.

## Alcance

- Implementar `prepareCustomerResponse`.
- Extraer y comparar Critical Entities con reglas deterministas.
- Mostrar ambas versiones y diferencias.
- Bloquear confirmación hasta editar y revalidar.
- Guardar la decisión del agente sin enviar automáticamente la respuesta.

## Criterios de aceptación

- Una respuesta válida puede confirmarse tras revisión humana.
- Cambiar `E105`, `15 GB`, una fecha o una negación produce bloqueo visible.
- Corregir el texto y revalidar elimina el bloqueo.
- Los 20 casos conservan o bloquean todas las entidades esperadas.

## Dependencia

Bloqueado por #5, Evidence Gate.

## Referencia

Spec #1.
