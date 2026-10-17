# 004 · Bulles por dentro y nuevo plan

- Fecha: 2026-10-16
- Fase: 2 · Diseño técnico
- Origen: resultados de los dos agentes lanzados en la entrada 003 (sin prompt nuevo del usuario).

## Respuesta del agente

Ya está el análisis de Bulles: confirma la hipótesis y lo amplía. El detalle completo está en `docs/referencia/bulles-teardown.md`.

**Cómo está hecho**
- **Stack:** Nuxt con Vue 3.5 y Pinia, three.js r180 sin envoltorios, GSAP 3.13, Howler, Tailwind 4 y DatoCMS.
- **Escena:** todo pasa en un único canvas 3D a pantalla completa; la interfaz en HTML va por encima. La intro es un vuelo de cámara de unos 5 segundos sobre una isla con un árbol, con voz y subtítulos, y se puede saltar.
- **Burbujas:** 12 burbujas en un carrusel que se arrastra con inercia. Cada una es una esfera que ondula, con brillo en el borde y un dibujo adentro. Al pasar el mouse se forma una onda; al hacer clic, una distorsión a pantalla completa te lleva adentro.
- **Su punto débil:** las burbujas no son accesibles por teclado ni con lector de pantalla, no hay modo de menos movimiento y la carga no tiene alternativa si algo falla.

**Plan rehecho:** 7 tareas sobre ese mismo stack, en `odd/tasks/landing-itec.md`:
1. Nuxt con una máquina de estados (inicio → intro → burbujas → detalle).
2. La escena 3D con su cámara.
3. El carrusel de burbujas con sus shaders.
4. El interior de cada burbuja con la información de la propuesta.
5. Sonido y accesibilidad.
6. Verificación.

El contenido real que ya relevamos se reutiliza tal cual.

**Pregunta:** ¿qué se ve dentro de cada burbuja? En Bulles son dibujos de los alumnos.
