# 001 · Prompt inicial

- Fecha: 2026-10-16
- Fase: 0 · Descubrimiento

> vamos a iniciar un proyecto nuevo, necesito que utilices las tools de diseño que tengas a disposicion, las de planeamiento, etc. quiero documentar como trabajamos tambien, asi que quiero hacer un artefacto para compartir. este primer prompt tambien guardalo. Proyecto, transformar esto: https://www.itecriocuarto.org.ar/  en algo parecido a esto: https://experience.projetbulles.com/. hay que analizar funcionalidades, UX, usabilidad, contenidos. No vamos a incluir logins

## Acciones de la sesión

1. Prompt guardado en Engram (proyecto `diseñobullets`) y en este archivo.
2. Análisis de ambos sitios con WebFetch y Claude in Chrome (inspección del DOM).
3. Bitácora publicada como artefacto: `docs/bitacora/bitacora.html`.

## Respuesta del agente

Terminé la fase 0 (descubrimiento). Publiqué la bitácora para compartir: https://claude.ai/artifact/AHq3RpEQUZSrB48hCCfE2B

**Qué hice**
- **Tu prompt** quedó guardado en Engram y en `docs/bitacora/001-prompt-inicial.md`. Cada prompt importante va a sumar una entrada numerada.
- **Análisis:** comparé los dos sitios en funcionalidades, UX, usabilidad, contenidos y tecnología. Los leí con WebFetch y abrí Bulles en Chrome para ver qué tecnología usa.
- **Bitácora:** el prompt inicial, cómo trabajamos y con qué herramientas, la comparativa, los problemas del iTec ordenados por gravedad, qué tomar de Bulles y qué no, un primer concepto ("cada propuesta educativa es una burbuja"), las 6 fases del plan y las decisiones.

**Lo más importante que encontré**
- **iTec:** hay tres caminos distintos para inscribirse. Además, el secundario Ada Byron aparece bajo el título "Tecnicaturas de Nivel Superior" y "Trayectos" no lleva a ninguna página.
- **Bulles:** el propio sitio dice que no está adaptado para lectores de pantalla. Por eso propuse que la accesibilidad sea un requisito del proyecto.
- **No pude ver la experiencia de Bulles funcionando:** en Chrome se quedó en la pantalla de carga. Lo que digo sobre Bulles sale del código de la página: un fondo con gradiente animado, audio opcional y una intro que se puede saltar.

La única decisión firme es la tuya: sin logins. Las otras dos (accesibilidad y un único camino de inscripción) están como propuestas hasta que las confirmes. La bitácora es privada: para que otros la vean, compartila desde el menú Share de la página.

Para arrancar la fase 1 (definición): **¿a quién le habla principalmente el sitio nuevo: a los aspirantes a ingresar, a los alumnos actuales o a ambos por igual?**
