# Especificación: QVAC Sovereign Agent

## Problema

Un agente de atención que trabaja en español recibe una consulta en inglés. Aunque la empresa tenga el procedimiento correcto, el agente puede transferir la llamada porque no comprende al cliente o no encuentra el conocimiento aplicable. El cliente espera más, la empresa utiliza una cola bilingüe escasa y la conversación puede terminar enviada a varios proveedores externos de IA.

El producto debe permitir una atención bilingüe completa y respaldada por documentación empresarial mediante inferencia local. La demo utilizará soporte ficticio de internet residencial en Panamá y debe seguir siendo útil cuando se desconecten las APIs externas de IA.

## Resultado esperado

El agente ve la transcripción original en inglés, su traducción al español, hasta tres fuentes vigentes y una `Supported Guidance` breve. Después redacta o elige una respuesta en español, revisa la traducción al inglés y la confirma. Si falta evidencia o cambia una entidad crítica, el sistema se abstiene o bloquea la respuesta.

## Usuarios y valor medible

### Agente

Resuelve consultas en inglés sin abandonar su escritorio ni conocer todos los procedimientos. Mediremos tiempo hasta encontrar el procedimiento, correcciones y decisiones de aceptar, editar o escalar.

### Supervisor

Observa categorías de `Knowledge Gap`, calidad por caso y métricas agregadas sin conservar conversaciones en Zero-Retention Mode.

### Administrador de conocimiento

Puede identificar el documento, versión, vigencia y fragmento que respaldaron una guía.

### Empresa

Puede comparar el flujo contra búsqueda manual en los mismos 20 casos: tiempo de atención, transferencias evitables y costo de inferencia. La demo no afirmará ahorro hasta medirlo.

## Historias de usuario

### Comprender una consulta en inglés

Como agente que trabaja en español, quiero ver el original y la traducción de una intervención estable para entender al cliente y detectar posibles errores.

**Criterios de aceptación**

- El original nunca queda oculto.
- TranslatePsy ejecuta inglés → español mediante `@qvac/sdk` en la ruta real.
- La pantalla distingue estado provisional, estable, traduciendo y listo.
- Un fallo produce un estado recuperable y conserva el original.

### Encontrar conocimiento vigente

Como agente, quiero recibir evidencia de la base interna relacionada con la consulta traducida para aplicar el procedimiento correcto.

**Criterios de aceptación**

- La consulta RAG se ejecuta en español.
- Cada resultado muestra título, versión, vigencia y fragmento.
- Se excluyen documentos vencidos o inactivos antes de decidir la guía.
- La interfaz presenta un máximo de tres fuentes y destaca la principal.

### Recibir Supported Guidance verificable

Como agente, quiero una guía breve basada en las fuentes para responder con rapidez sin confundir texto generado con política empresarial.

**Criterios de aceptación**

- Cada paso de la guía referencia al menos una fuente mostrada.
- El modo extractivo sigue funcionando si falla la generación local.
- Sin evidencia suficiente aparece `Abstention`, su motivo y la opción de escalar.
- El modelo no completa una solución desde conocimiento general cuando Evidence Gate se cierra.

### Proteger datos críticos

Como agente, quiero saber si un código, número, fecha, cantidad, identificador, modelo o negación cambió para no comunicar una instrucción peligrosa.

**Criterios de aceptación**

- Critical Data Lock compara los textos antes de habilitar confirmación.
- Una diferencia muestra los valores y bloquea la respuesta.
- El agente puede editar y volver a validar, pero no ignorar silenciosamente el bloqueo.
- Los 20 casos conservan o bloquean el 100 % de sus entidades críticas esperadas.

### Responder en inglés

Como agente, quiero redactar en español y revisar la traducción al inglés para responder al cliente sin depender de un compañero bilingüe.

**Criterios de aceptación**

- TranslatePsy ejecuta español → inglés mediante `@qvac/sdk` en la ruta real.
- Se muestran ambas versiones antes de confirmar.
- La confirmación siempre es humana en el MVP.
- La salida obligatoria es texto; TTS queda como ampliación.

### Cerrar una sesión sin conservar contenido

Como responsable de seguridad, quiero que audio, transcripciones y traducciones desaparezcan al cerrar la sesión, conservando solo métricas agregadas y una categoría anónima.

**Criterios de aceptación**

- El cierre limpia memoria de sesión y archivos temporales conocidos.
- La interfaz confirma la aplicación de la política.
- El registro exportado no contiene texto, audio ni identificadores del cliente.
- La documentación distingue inferencia local de telefonía o CRM remotos.

## Flujo principal

1. El agente abre la aplicación y espera que los componentes obligatorios estén listos.
2. Selecciona una colección ficticia de soporte de internet residencial.
3. El cliente habla inglés o se carga un audio de demostración.
4. QVAC produce una intervención estable en inglés.
5. TranslatePsy la traduce al español.
6. Critical Data Lock valida las entidades de la intervención.
7. El flujo busca en documentos españoles mediante RAG local.
8. Evidence Gate devuelve `Supported Guidance` con citas o `Abstention`.
9. El agente escribe o selecciona una respuesta en español.
10. TranslatePsy la traduce al inglés y Critical Data Lock vuelve a validar.
11. El agente confirma el texto para el cliente.
12. Al cerrar, Zero-Retention Mode limpia el contenido y exporta métricas permitidas.

## Casos de fallo obligatorios

- Consulta sin respuesta en la colección: abstención y escalación.
- Única coincidencia en documento vencido: abstención.
- Traducción que pierde `no`, cambia `E105` o modifica una cantidad: bloqueo.
- QVAC no puede cargar un componente: estado de error con diagnóstico, sin fingir que el flujo es local.
- Generador local no disponible: evidencia y guía extractiva siguen visibles.
- Cierre de sesión después de un error: política de retención sigue ejecutándose.

## Alcance del MVP

- Escritorio Windows con Electron, React y TypeScript.
- Inglés del cliente y español del agente.
- Transcripción del canal del cliente solamente.
- TranslatePsy en ambas direcciones.
- 20 documentos ficticios en español y 20 casos de evaluación.
- RAG integrado de QVAC para el prototipo.
- Evidence Gate, Critical Data Lock y Zero-Retention Mode.
- Respuesta de texto revisada por el agente.
- Registro JSONL de carga, latencia, TTFT, tokens y throughput cuando el componente los reporte.

## Fuera del alcance

- Integración real con PBX, CCaaS o CRM.
- Separación de dos hablantes desde audio mezclado.
- Respuesta automática al cliente.
- Más de dos idiomas.
- Modificación de cuentas o facturación.
- Afirmaciones de certificación empresarial.

## Arquitectura y límites

La aplicación seguirá ADR 0001 y ADR 0002. Todas las operaciones principales de IA y RAG se ejecutarán localmente con `@qvac/sdk`. Electron main alojará el runtime; preload expondrá IPC tipado; React mostrará los estados.

El dominio dependerá de un puerto `LocalAiGateway` con operaciones de transcripción, traducción, recuperación y síntesis respaldada. El adaptador QVAC implementará el puerto. Las reglas de vigencia, entidades, Evidence Gate y retención serán deterministas.

## Fronteras de prueba acordadas

La prueba de comportamiento principal invocará `processCustomerUtterance` con una intervención estable y observará un resultado completo visible para el agente: original, traducción, evidencia, guía o abstención y bloqueos. Otra frontera pública, `prepareCustomerResponse`, observará traducción, validación y posibilidad de confirmar.

Las pruebas usarán un `LocalAiGateway` determinista. Esto permite comprobar decisiones de producto sin probar los detalles internos de QVAC. Una prueba de humo manual y separada cargará los modelos reales y generará un registro de rendimiento; sus resultados no se sustituirán con números simulados.

## Datos de demostración

Los 20 documentos cubrirán diagnóstico de cortes, luces del módem, reinicio, cableado, alcance Wi-Fi, credenciales, visita técnica, mantenimiento programado, planes y escalación. Se incluirán versiones activas, vencidas y documentos deliberadamente insuficientes.

Cada caso de evaluación tendrá audio o texto en inglés, traducción de referencia, intención, entidades críticas, fuente correcta, resultado esperado y respuesta aprobada. Los casos incluirán ruido, habla rápida, ambigüedad, negaciones, códigos y preguntas sin respuesta.

## Métricas y umbrales iniciales

- `Precision@1` de recuperación: al menos 85 % en 20 casos.
- Entidades críticas: 100 % conservadas o bloqueadas.
- Evidencia visible: menos de tres segundos desde una intervención estable, después de precargar modelos.
- Citas válidas: 100 % de los pasos presentados como Supported Guidance.
- Flujo: una conversación completa sin APIs externas de IA.

También se registrarán carga de modelo, prompt o entrada, conteo de tokens cuando aplique, TTFT, throughput, latencia de traducción, latencia RAG y latencia total. Los umbrales se revisarán únicamente con mediciones reales.

## Hardware y prerrequisitos conocidos

- HP Victus 15-fa0xxx, Windows 11 Home 64-bit.
- Intel i5-12450H, 8 núcleos y 12 procesadores lógicos.
- 15.7 GB de RAM.
- NVIDIA RTX 3050 Laptop GPU de 4 GB.
- Vulkan 1.4.325 disponible en la GPU NVIDIA.
- Node 22.17.0 y npm 10.9.2.
- 77.8 GB libres durante la verificación.
- `ffmpeg` pendiente de instalación antes del tramo de micrófono.

## Decisiones pendientes de verificación técnica

- Variante y paquetes exactos de TranslatePsy-EuroNano.
- Modelo ASR que entregue mejor latencia/calidad en esta máquina.
- Modelo de embeddings disponible y suficientemente pequeño.
- Conveniencia de un modelo generativo local frente a plantilla extractiva para el primer demo.
- Umbral numérico de Evidence Gate calibrado con los 20 casos.

Estas decisiones no cambian el comportamiento del producto. El primer ticket las resolverá con evidencia del hardware y registrará los identificadores honestos en el repositorio.

## Definición de terminado

Otra persona puede clonar el repositorio, instalar dependencias, obtener los modelos declarados, indexar el dataset, ejecutar los 20 casos y completar una conversación. Puede inspeccionar las fuentes, reproducir las métricas, provocar una abstención y un bloqueo de Critical Data Lock, y verificar que el flujo principal no llama a una API externa de IA.
