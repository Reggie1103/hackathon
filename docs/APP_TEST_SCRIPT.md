# Guía manual para probar la aplicación

Usa esta guía antes de grabar el video. Cada prueba tiene un resultado esperado; si no aparece, toma una captura y anota el paso.

## Preparación

1. Abre PowerShell en la carpeta del proyecto.
2. Ejecuta `npm run dev`.
3. Espera a que el estado superior derecho cambie de `PREPARANDO QVAC` a `QVAC LOCAL`.
4. Si aparece `QVAC ERROR`, no continúes: toma una captura del mensaje.

## Prueba 1 — Flujo principal con evidencia

**Objetivo:** comprobar traducción, RAG, Evidence Gate, guía y respuesta humana.

1. En **Intervención original**, pega:

   ```text
   My modem shows error E105 and the red light does not blink.
   ```

2. Haz clic en **Procesar turno**.

**Debe ocurrir:**

- Aparece una traducción en español que conserva `E105` y la negación “no”.
- El estado central muestra `SUPPORTED`.
- Ves hasta tres fuentes con título, versión, vigencia y código `NET-…`.
- Ves `SUPPORTED GUIDANCE` con citas a esas fuentes.

3. En **Respuesta del agente**, pega:

   ```text
   Confirme la luz WAN. Si el código E105 continúa después de reiniciar el módem, transfiera el caso a soporte técnico.
   ```

4. Haz clic en **Traducir y validar**.

**Debe ocurrir:**

- Aparece la respuesta traducida al inglés.
- El recuadro dice `Critical Data Lock · VALID`.
- El botón **Confirmar respuesta** está habilitado.

5. Haz clic en **Confirmar respuesta**.

**Debe ocurrir:** el botón cambia a `Respuesta confirmada por el agente`.

## Prueba 2 — Abstención cuando no existe conocimiento

**Objetivo:** comprobar que la app no inventa una respuesta fuera del dominio de telecomunicaciones.

1. Reemplaza la intervención del cliente por:

   ```text
   What medicine should I take for a headache?
   ```

2. Haz clic en **Procesar turno**.

**Debe ocurrir:**

- El panel central muestra `ABSTAINED` y el motivo de la abstención.
- En el panel derecho aparece `Evidence Gate cerrado`.
- **Traducir y validar** queda deshabilitado.

Este resultado es correcto: la app debe pedir escalación antes que responder sobre medicina.

## Prueba 3 — Cierre seguro de sesión

**Objetivo:** comprobar Zero Retention Mode.

1. Ejecuta primero la Prueba 1 para que haya traducción, fuentes y respuesta visibles.
2. Haz clic en **Cerrar sesión · Zero retention** abajo.

**Debe ocurrir:**

- Se vacían los dos campos de texto.
- Desaparecen traducción, evidencia, guía y respuesta final.
- Aparece el mensaje: `Sesión cerrada: audio, transcripción y traducciones eliminados.`

## Prueba 4 — Audio local (opcional)

**Objetivo:** comprobar captura y transcripción local.

1. Haz clic en **Grabar voz del cliente** y permite el acceso al micrófono.
2. Di en inglés: `My modem shows error E one zero five and the red light does not blink.`
3. Haz clic en **Detener y transcribir**.

**Debe ocurrir:**

- Ves el estado de audio provisional y después estable.
- El campo de cliente se llena con la transcripción en inglés.
- Puedes ejecutar la Prueba 1 desde **Procesar turno**.

## Resultado de la prueba

La aplicación está lista para la demo si pasan las tres primeras pruebas. Registra este resumen:

| Prueba | Resultado |
|---|---|
| Flujo con E105 y evidencia | Pasa / Falla |
| Abstención médica | Pasa / Falla |
| Zero Retention | Pasa / Falla |
| Micrófono y ASR local | Pasa / Falla / No probado |
