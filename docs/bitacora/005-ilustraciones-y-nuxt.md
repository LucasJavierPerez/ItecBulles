# 005 · Ilustraciones en las burbujas y arranque de la construcción

- Fecha: 2026-10-16
- Fase: 2 · Construcción

> genera ilustraciones sobre las fotos actuales

## Decisión D-08

Cada burbuja muestra una ilustración hecha a partir de las fotos del sitio oficial del iTec, en el lugar de los dibujos de alumnos que usa Bulles.

En este entorno no hay un modelo de generación de imágenes. Por eso las ilustraciones salen de un script reproducible (`scripts/illustrate.mjs`, con sharp). Toma cada foto oficial, la reduce a la paleta de Bulles, le suma trazos de contorno tipo tinta y una textura de papel. Se guarda la fuente de cada foto.

## Acciones de la sesión

1. D-08 registrada en Engram y en `odd/tasks/landing-itec.md`, que suma la tarea T8 (ilustraciones), ubicada antes de T4 (burbujas).
2. T2 delegada a un agente escritor: migración a Nuxt, store Pinia `ui` (inicio → intro → burbujas → detalle) con tests primero y tokens de Tailwind con la paleta de Bulles.

## Respuesta del agente

T2 y T8 están terminadas y subidas a GitHub.

**T2: el proyecto pasó a Nuxt 4**
- Tiene el store de estados (inicio → intro → burbujas → detalle), la paleta de Bulles en Tailwind y una primera pantalla de inicio.
- Pasan 26 tests y el build.

**T8: hay 11 ilustraciones, una por propuesta**
- Cada ilustración sale de una foto del sitio oficial y se guarda la fuente de cada foto.
- El script es reproducible: dos corridas dan archivos idénticos.

**Mi lectura del resultado:** se parecen más a una foto con filtro de posterizado que a un dibujo.
- Se leen bien: marketing, turismo e ingreso.
- Quedan ruidosas: iTec Labs, mecatrónica, portal de trabajo y capacitación.
- Tres burbujas muestran el mismo edificio, porque sus páginas no tienen otra foto.
- iTec Labs reutiliza la foto de Software, porque su página solo muestra el logo.

¿Seguimos con este estilo y lo pulimos al final, o lo ajusto ahora antes de la escena 3D?
