# 006 · Construcción completa y prueba en navegador

- Fecha: 2026-10-16
- Fase: 2 · Construcción

> dale, avisame cuando termine

Se interpretó como: seguir con la escena 3D y pulir el estilo de las ilustraciones al final.

## Acciones de la sesión

1. T3 a T6 delegadas, una por vez, a agentes escritores: escena 3D, burbujas, detalle de cada propuesta, sonido y accesibilidad. Cada tarea tiene tests escritos antes que el código y su commit.
2. T7: prueba del build de producción en Chrome sin ventana (playwright + WebGL por software) en escritorio, celular y movimiento reducido. La pestaña automatizada de Chrome queda oculta y no anima, por eso se usó este camino.
3. La primera pasada encontró 5 problemas de diseño. Los corrigió un escritor (`b7cc0ae`) y la segunda pasada salió limpia.
4. Capturas en `docs/bitacora/capturas/`.

## Respuesta del agente

Terminé: la landing está construida y subida a la rama `feat/landing-itec`.

**Qué hace**
- **Inicio:** una isla con un árbol en 3D sobre el cielo de Bulles y el botón "Descubrir las propuestas".
- **Intro:** un vuelo de cámara de 5 segundos que se puede saltar.
- **Burbujas:** 11 burbujas con las ilustraciones adentro. Se arrastran con inercia; al pasar el mouse hacen una onda y al hacer clic te llevan adentro.
- **Detalle:** la información real de cada propuesta, el botón "Quiero + Info", el WhatsApp y el enlace al sitio oficial. Se puede pasar a la propuesta anterior o siguiente, o volver con Esc.
- **Sonido:** ambiente y efectos generados por nosotros, con botón para silenciar.
- **Accesibilidad:** lista navegable con teclado, botón "Reducir movimiento" (versión sin 3D) e información práctica siempre visible abajo.

**Verificación:** pasan 187 tests y el build. En la prueba en navegador el recorrido completo funciona en escritorio, en celular y con movimiento reducido.

**No verificado todavía:** que el sonido se escuche, cómo se siente el arrastre con una placa de video real, y lectores de pantalla.

**Pendiente:**
- Pulir el estilo de las ilustraciones.
- Confirmar D-02, D-03, D-05 y D-06.
- Abrir el PR a `main`, cuando decidas.
