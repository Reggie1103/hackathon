# Guion de demo — QVAC Sovereign Agent

Duración objetivo: 4 minutos y 40 segundos. Formato: grabación de pantalla a 1080p, sin música; voz en español y subtítulos opcionales. La demo usa datos ficticios de soporte de internet residencial en Panamá.

## Preparación antes de grabar

1. Abre PowerShell en la carpeta del repositorio y ejecuta `npm run dev`.
2. Espera el indicador `QVAC LOCAL`. No grabes durante `PREPARANDO QVAC`.
3. Maximiza la ventana. Mantén la consulta inicial de ejemplo: `My modem shows error E105 and the red light does not blink.`
4. Cierra aplicaciones, notificaciones y datos personales. La demostración no debe mostrar credenciales, rutas privadas ni la consola.
5. Para grabar en Windows, abre Xbox Game Bar con `Win + G` y usa el botón de grabar, o inicia/detén con `Win + Alt + R`.

## Recorrido con tiempos y narrativa

### 0:00–0:20 — Problema y propuesta

Con la app visible, di:

> En un call center de Panamá, un agente puede atender a un cliente que habla inglés sin enviar su conversación a una IA en la nube. QVAC Sovereign Agent traduce, busca evidencia local y exige revisión humana antes de responder.

Señala la franja superior: `EN → ES → EVIDENCE → ES → EN` y el estado `QVAC LOCAL`.

### 0:20–0:45 — Privacidad y ejecución local

Di:

> La ruta de IA corre en este dispositivo con `@qvac/sdk`: TranslatePsy para las dos traducciones, RAG local para documentos empresariales y Parakeet para audio. No utilizamos una API externa de IA para este turno.

No navegues fuera de la app. El indicador local y el texto de la franja dan la evidencia visual suficiente.

### 0:45–1:30 — Transcripción en vivo y traducción

Haz clic en **Iniciar transcripción en vivo** y di en inglés: `My modem shows error E one zero five and the red light does not blink.` Mientras hablas, señala cómo aparece el texto provisional. Haz clic en **Detener intervención** y después en **Procesar turno**. Cuando aparezca la tarjeta de traducción, di:

> Parakeet recibe PCM en fragmentos y transcribe mientras el cliente habla. Al detener la intervención fija el texto; después TranslatePsy lo presenta en español sin enviar el audio a una API externa.

Señala que `E105` y la negación permanecen visibles en ambos idiomas.

### 1:30–2:20 — Evidence Gate y guía respaldada

Muestra las tarjetas del panel central y di:

> La búsqueda se hace sobre la consulta en español y solo admite documentos activos, vigentes y que superan el umbral de evidencia. Aquí tenemos el procedimiento principal, su versión, vigencia y fragmento. La guía inferior es extractiva y cita cada documento; no inventa un procedimiento.

Señala `Supported Guidance` y las referencias `NET-…`.

### 2:20–3:10 — Respuesta y Critical Data Lock

En la columna derecha usa la respuesta preparada o escribe:

`Confirme la luz WAN. Si el código E105 continúa después de reiniciar el módem, transfiera el caso a soporte técnico.`

Haz clic en **Traducir y validar**. Luego di:

> El agente redacta en español y revisa la versión en inglés. Critical Data Lock compara códigos, números y negaciones. Como E105 se preservó, la respuesta queda válida, pero solo una persona puede confirmarla.

Haz clic en **Confirmar respuesta** y muestra el cambio a `Respuesta confirmada por el agente`.

### 3:10–3:55 — Abstención segura

Reemplaza la consulta del cliente por:

`What medicine should I take for a headache?`

Haz clic en **Procesar turno**. Cuando aparezca la abstención, di:

> Cuando no hay un procedimiento empresarial vigente, Evidence Gate se cierra. La aplicación muestra Abstention y bloquea la traducción de una respuesta para el cliente. El producto prefiere escalar antes que improvisar.

### 3:55–4:25 — Zero retention

Haz clic en **Cerrar sesión · Zero retention**. Di:

> Al cerrar, se invalida el trabajo en curso, se limpian audio temporal, transcripciones y traducciones de la sesión. Solo pueden permanecer métricas agregadas y una categoría anónima del problema.

Muestra los campos vacíos y el aviso de sesión cerrada.

### 4:25–4:40 — Cierre

Di:

> El resultado es atención bilingüe privada, respaldada por conocimiento empresarial y preparada para hardware de consumo. El repositorio incluye los 20 casos, métricas y pasos para reproducir esta demo.

Termina la grabación. Antes de publicar, revisa que dure menos de cinco minutos, que no muestre información real y que se vean `QVAC LOCAL`, las fuentes y el bloqueo de abstención.
