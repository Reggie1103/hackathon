# ADR 0002: Ejecutar QVAC detrás del proceso principal de Electron

- **Estado:** aceptada
- **Fecha:** 2026-09-10

## Contexto

El prototipo necesita acceso local a micrófono, archivos, modelos y aceleración Vulkan, pero la interfaz debe poder evolucionar y probarse sin cargar modelos en cada prueba. También debe impedir que el renderer obtenga acceso general a Node.js o al sistema de archivos.

La documentación oficial de QVAC presenta Electron, React y TypeScript como una ruta compatible y coloca `@qvac/sdk` en el proceso principal de Electron.

## Decisión

Construir la aplicación de escritorio con Electron, React y TypeScript.

- El proceso principal alojará el adaptador de `@qvac/sdk`, la carga de modelos, RAG, métricas y la política de retención.
- Un preload expondrá operaciones tipadas y limitadas mediante IPC.
- El renderer solo manejará estado e interacción de la interfaz; no tendrá acceso directo a Node.js.
- El flujo público `processCustomerUtterance` será la principal frontera de prueba. Las pruebas de comportamiento usarán un adaptador determinista que implemente el mismo contrato que QVAC.
- Las verificaciones del SDK, Vulkan y modelos reales vivirán en pruebas de humo explícitas que no bloquearán las pruebas rápidas.

## Consecuencias

La arquitectura coincide con el entorno de escritorio y mantiene la integración nativa fuera de la interfaz. Se puede desarrollar y probar el flujo antes de descargar todos los modelos.

El proyecto asume la complejidad de empaquetar binarios y modelos para Windows. IPC pasa a ser una frontera de seguridad y debe validar todas las entradas. Las métricas obtenidas con adaptadores de prueba no cuentan como métricas de rendimiento del reto; estas deben capturarse con modelos reales.

## Alternativas consideradas

### Aplicación web en navegador

Reduce el empaquetado, pero complica el acceso uniforme al runtime nativo, archivos y modelos en Windows.

### Servidor Node local con interfaz web

Es viable, pero añade gestión de puertos y procesos. Electron ofrece un proceso principal integrado y una ruta oficial de QVAC para el hackathon.
