# Projet Bulles: análisis técnico y de experiencia

Fuente: experience.projetbulles.com, revisado el 2026-10-16. Evidencia: análisis de ~40 bundles `/_nuxt` (la app vive casi entera en un chunk de 1.5 MB) y prueba en navegador. [V] = verificado en código o en vivo · [I] = inferido.

La experiencia en vivo no pasó del loader: la pestaña automatizada queda en `visibilityState: hidden`, el navegador no ejecuta frames de animación y el sitio no tiene timeout. Lo que sigue al loader sale del código.

## Stack [V]

| Pieza | Versión / evidencia |
|---|---|
| Nuxt + Vue | Vue 3.5.25 |
| Estado | Pinia, store `ui` (`currentStep`, `completedTutorials`, `activeBubbleId`, `introComplete`) |
| i18n | @nuxtjs/i18n (fr/en) |
| 3D | three.js r180 sin wrappers; GLTF, DRACO, KTX2, HDR; EffectComposer |
| Animación | GSAP 3.13.0 |
| Audio | Howler.js |
| Estilos | Tailwind CSS v4.2.1 |
| Contenido | DatoCMS (GraphQL) |
| Sin usar | física (matter, rapier, cannon), Lenis, PIXI, ogl, lottie |

## Arquitectura de render [V]

- Un canvas WebGL a pantalla completa y la UI de Vue en HTML por encima.
- Gestor de escenas con transición de loader de 1050 ms; escena y UI se comunican por eventos (`SHOW_BUBBLE`, `BUBBLE_ENTER`, `TOGGLE_LOADER`…).
- Estados de cámara con nombre (`INTRO_HOME`, `HOME`, `SKY`, `OVERWORLD`) y parallax con el mouse (fuerza .85, suavizado .04).
- Intro: la cámara recorre una curva (`introPath.glb`) durante ~5 s sobre una isla con árbol, nubes y partículas.
- Burbujas: pool de 12 reutilizadas en un carrusel horizontal infinito. Arrastre y rueda con inercia escrita a mano (fricción .92, velocidad máx .4) y curva en los bordes.
- Cada burbuja: esfera deformada con ruido simplex + cáscara con brillo de borde (fresnel) + plano con el dibujo recortado en círculo.
- Hover: onda que se expande desde el punto tocado (GSAP 2.25 s `power4.out`) y sonido. Clic: distorsión de onda a pantalla completa y entrada a la burbuja.
- Interior: skybox de 6 imágenes y de 1 a 12 dibujos, con rotación, vista de detalle y anterior/siguiente.

## Recorrido del usuario

1. Banner de cookies. 2. Loader con gradiente azul → violeta → naranja. 3. Inicio: "Crée ton univers…", botón "Découvrir les bulles", sugerencia de usar auriculares. 4. Intro con voz y subtítulos ("Dans ma tête, …"), omitible. 5. Carrusel de burbujas con tutorial de una sola vez. 6. Interior de la burbuja con su propio tutorial. 7. Formulario de 4 pasos para crear una burbuja (subida de 1 a 12 dibujos).

## Sistema visual [V]

- Paleta: azul `#8da0fb`, violeta `#b88ff4`, lila `#e1e2fe`, amarillo `#fbc77a`, crema `#fffaed`, texto violeta oscuro `#280b3c`, éxito `#56c6a7`, error `#e73333`.
- Cielo: `linear-gradient(108deg, azul 0%, violeta 25%, amarillo 100%)`.
- Burbujas: `#FFD333 #8C00FF #FF94B6 #FF0090`.
- Tipografía: Apfel Grotezk (Regular, Mittel, Fett), interlineados muy cerrados (0.8–1.3).
- Botones píldora, grilla de 12 columnas en escritorio y 5 en celular.
- Easings `cubic-bezier(.32,.94,.6,1)` y `(.4,0,.2,1)`.

## Audio [V]

Ambiente en loop, voz de la intro (fr/en), sonidos de hover, movimiento y clic con varias variantes por acción, mute global, desbloqueo en el primer gesto.

## Problemas a no repetir

- Las burbujas existen solo en WebGL: sin lista en el DOM, sin teclado, sin lector de pantalla.
- No respeta `prefers-reduced-motion`.
- Loader sin timeout ni alternativa.
- Un chunk de 1.5 MB con herramientas de debug (lil-gui, stats.js) en producción.
- Unos 20 mp3, un HDR y modelos GLB se cargan antes de empezar: pesado en celulares.

## Qué replicamos en iTec

1. Canvas three.js a pantalla completa con UI HTML encima, cielo pastel, burbuja con ruido, brillo de borde, imagen interior y onda al pasar el mouse.
2. Carrusel de burbujas con inercia, sin librería de física.
3. Cámara coreografiada con GSAP, intro corta omitible y parallax.
4. Transición con onda al hacer clic y vista de detalle de cada propuesta.
5. Máquina de estados de UI en Pinia y tutoriales de una sola vez.
6. Sonido con Howler, mute y desbloqueo en el primer gesto.
7. Mejoras: lista accesible en el DOM, modo sin movimiento, timeout del loader, carga diferida de audio y modelos, sin debug en producción, calidad reducida en celulares.
