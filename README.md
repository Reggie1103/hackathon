# QVAC Sovereign Agent

Copiloto local y verificable para agentes de atención al cliente. Transcribe llamadas en vivo, recupera conocimiento empresarial relevante y muestra material de apoyo con fuentes, sin enviar la inferencia de IA a servicios externos.

El repositorio mantiene dos variantes del producto:

- [PROJECT_TRANSLATEPSY.md](./PROJECT_TRANSLATEPSY.md): propuesta recomendada, bilingüe y elegible para el reto QVAC Psy.
- [PROJECT.md](./PROJECT.md): propuesta monolingüe de referencia, sin traducción.

## Estado

- Idea validada mediante debate adversarial.
- Alcance recomendado: atención bilingüe español–inglés con TranslatePsy.
- La variante monolingüe se conserva para comparar alcance, rendimiento y riesgo.
- Repositorio conectado a GitHub y preparado para el flujo de especificación e implementación.
- GitHub Issues está configurado como gestor de especificaciones y tareas.

## Flujo de trabajo previsto

1. `grill-with-docs`: resolver decisiones abiertas y documentarlas.
2. `to-spec`: convertir las decisiones en una especificación técnica.
3. `to-tickets`: dividir la especificación en entregas verticales.
4. `implement`: construir cada entrega con pruebas apropiadas.
5. `code-review`: revisar el resultado contra la especificación y los estándares.
