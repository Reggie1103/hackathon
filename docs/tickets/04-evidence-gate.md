# Entregar Supported Guidance o Abstention mediante Evidence Gate

## Objetivo

Convertir evidencia vigente en una guía breve con citas o abstenerse cuando la colección no respalde una solución.

## Valor visible

El agente puede actuar con rapidez y distinguir claramente un procedimiento respaldado de una pregunta que requiere escalación.

## Alcance

- Implementar Evidence Gate con umbral configurable.
- Crear guía extractiva como comportamiento base.
- Añadir síntesis local opcional con contrato estructurado.
- Vincular cada paso a una fuente visible.
- Registrar `Knowledge Gap` anónimo cuando corresponda.

## Criterios de aceptación

- Una coincidencia vigente suficiente genera `Supported Guidance` con citas.
- Ausencia de evidencia o evidencia vencida genera `Abstention`.
- El fallo del generador conserva la guía extractiva.
- No se completa una solución desde conocimiento general.

## Dependencia

Bloqueado por #4, la recuperación de Evidence.

## Referencia

Spec #1.
