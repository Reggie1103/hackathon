# Guion hablado para la demo

Duración aproximada: 4 minutos y 30 segundos. Habla despacio y muestra la pantalla mientras lees el texto.

## Antes de iniciar

1. Abre PowerShell en la carpeta del proyecto.
2. Ejecuta `npm run dev`.
3. Espera a que arriba a la derecha aparezca `QVAC LOCAL`.
4. Maximiza la ventana de la aplicación.
5. Inicia la grabación con `Win + Alt + R`.

## 0:00 — Presentación

**Di esto:**

> Hola. Este es QVAC Sovereign Agent, un copiloto para centros de atención al cliente. Su objetivo es ayudar a un agente que trabaja en español a atender de forma segura a un cliente que habla inglés, sin enviar la conversación a una IA en la nube.

**Muestra:** la parte superior de la app y el indicador `QVAC LOCAL`.

## 0:20 — Cómo funciona

**Di esto:**

> El flujo es inglés a español, búsqueda de evidencia empresarial, respuesta en español y traducción final al inglés. Todo el procesamiento principal ocurre localmente con QVAC y `@qvac/sdk`.

**Muestra:** la tarjeta que dice `EN → ES → EVIDENCE → ES → EN`.

## 0:40 — Caso realista

**Di esto:**

> Imaginemos que un cliente llama porque su módem muestra el error E105 y la luz roja no parpadea. El agente puede ver el mensaje original en inglés y no pierde el contexto del cliente.

**Haz esto:** deja este texto en el campo de cliente:

```text
My modem shows error E105 and the red light does not blink.
```

Haz clic en **Procesar turno**.

## 1:10 — Traducción y evidencia

**Di esto:**

> TranslatePsy traduce el caso al español localmente. Después, el sistema busca solamente en la base documental de la empresa. Aquí se muestran documentos activos, su versión, vigencia y el fragmento que justifica la recomendación.

**Muestra:** la traducción del panel izquierdo y las tarjetas del panel central.

**Di esto:**

> La guía no inventa una solución: cada paso está respaldado por una fuente identificable, por ejemplo NET-001 y NET-015.

**Muestra:** `SUPPORTED GUIDANCE` y las citas.

## 1:55 — Respuesta segura

**Di esto:**

> El agente redacta o ajusta una respuesta en español. Antes de que se envíe, TranslatePsy la devuelve al inglés y Critical Data Lock comprueba que códigos, números y negaciones no hayan cambiado.

**Haz esto:** deja este texto en la respuesta del agente:

```text
Confirme la luz WAN. Si el código E105 continúa después de reiniciar el módem, transfiera el caso a soporte técnico.
```

Haz clic en **Traducir y validar**.

**Di esto:**

> En este caso el código E105 se preservó y el bloqueo de datos críticos es válido. Sin embargo, la confirmación siempre es humana: la aplicación no responde automáticamente al cliente.

Haz clic en **Confirmar respuesta**.

## 2:45 — Caso sin respuesta: abstención

**Di esto:**

> Ahora probemos un caso fuera del conocimiento de la empresa. Esta es una parte importante: cuando no hay evidencia, el sistema debe abstenerse, no adivinar.

**Haz esto:** reemplaza el texto del cliente por:

```text
What medicine should I take for a headache?
```

Haz clic en **Procesar turno**.

**Di esto:**

> Evidence Gate se cierra porque esta consulta no pertenece a la base de soporte de internet. La aplicación muestra Abstention y bloquea la respuesta. El agente debe escalar el caso en lugar de inventar una recomendación.

**Muestra:** el mensaje de abstención y el botón de respuesta deshabilitado.

## 3:35 — Privacidad y cierre

**Di esto:**

> Por último, Zero Retention Mode elimina el contenido de la sesión al cerrarla: audio temporal, transcripciones y traducciones. Solo se permiten métricas agregadas y categorías anónimas.

Haz clic en **Cerrar sesión · Zero retention**.

## 3:55 — Cierre final

**Di esto:**

> QVAC Sovereign Agent combina atención bilingüe, modelos pequeños locales, evidencia empresarial verificable y control humano. El repositorio incluye el código abierto, los 20 casos de evaluación y las métricas reproducibles. Gracias.

Detén la grabación con `Win + Alt + R`.

## Lista de verificación antes de entregar

- El video dura menos de cinco minutos.
- Se ve `QVAC LOCAL` antes de iniciar el caso.
- Se muestra una traducción, evidencia, guía y validación de E105.
- Se muestra una abstención fuera del dominio.
- Se muestra el cierre Zero Retention.
- No aparecen datos reales de clientes, credenciales ni ventanas de terminal.
