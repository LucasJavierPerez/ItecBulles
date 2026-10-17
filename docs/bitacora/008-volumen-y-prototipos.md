# 008 · Control de volumen y prototipos del centro

- Fecha: 2026-10-16
- Fase: 2 · Construcción (ajustes por revisión del usuario)

> se podria poner para que se pueda bajar el volumen del sonido?

> me gustaria que me hagas 3 prototipos para cambiar el arbol del medio... estoy pensando como una opcion el edificio del itec

## Acciones de la sesión

1. T11 (volumen) delegada a un agente escritor: panel con deslizador y botón de silencio, verificado en navegador sin ventana.
2. T12 (prototipos) delegada después de T11, para no tener dos escritores en el mismo código. Tres centros intercambiables con `?centro=`.
3. Lienzo de comparación publicado: https://claude.ai/artifact/LBGEXv9Hb3o3oryPZiWAN9
4. Capturas en `docs/bitacora/capturas/*-overworld.jpg`.

## Respuesta del agente

Los tres prototipos están listos, junto con el control de volumen. Los podés comparar en este lienzo: https://claude.ai/artifact/LBGEXv9Hb3o3oryPZiWAN9

**Volumen:** el botón "Sonido" abre un panel con un deslizador de 0 a 100 % y un botón para silenciar. Funciona con teclado y queda guardado para la próxima visita.

**Prototipos** (en vivo con `npm run dev` + `?centro=…`):
1. **Edificio iTec** (`?centro=edificio`): la fachada real en low-poly, con la piedra, la chapa verde, las ventanas, las letras iTec con el punto rojo, la puerta y el 783. Es el más reconocible. En el inicio queda detrás del título y le quita lectura, y en celular la etiqueta de la burbuja roza el techo.
2. **Árbol de circuitos** (`?centro=circuitos`): un chip en la base, ramas doradas y nodos de colores que laten.
3. **La i de iTec** (`?centro=isotipo`): una "i" con el punto rojo y cinco íconos de carreras orbitando alrededor. En pantalla queda chica.

Pasan 236 tests y el build. El árbol sigue siendo el centro por defecto hasta que elijas.

¿Con cuál nos quedamos?
