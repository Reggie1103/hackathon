# Recuperar Evidence vigente para la consulta traducida

## Objetivo

Indexar la colección ficticia en español y mostrar hasta tres fuentes vigentes relacionadas con cada consulta.

## Valor visible

El agente pasa de comprender el idioma a encontrar el procedimiento empresarial aplicable con fuente y versión verificables.

## Alcance

- Añadir 20 `Knowledge Document` ficticios con estado y vigencia.
- Ingerir y consultar la colección mediante RAG de QVAC en la ruta real.
- Filtrar documentos inactivos o vencidos con una regla determinista.
- Mostrar título, versión, vigencia, fragmento y puntuación.
- Añadir casos con respuesta, sin respuesta y solo documento vencido.

## Criterios de aceptación

- La consulta sobre desconexiones y luz roja devuelve el artículo correcto en primer lugar.
- Un documento vencido nunca puede respaldar la guía.
- La pantalla presenta máximo tres resultados y destaca el principal.
- Los datos pueden reinicializarse de forma reproducible.

## Dependencia

Bloqueado por #3, el turno bilingüe.

## Referencia

Spec #1.
