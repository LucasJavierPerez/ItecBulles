# 007 · Fotos reales en las burbujas y el árbol al centro

- Fecha: 2026-10-16
- Fase: 2 · Construcción (ajustes por revisión del usuario)

> las imagenes de las burbujas no se entienden, tal vez las imagenes reales son mejores, cuando paso del arbol a la burbuja baja, y el arbol no lo veo mas... me gustaria que las burbujas queden mas arriba, asi cuando las recorro, el arbol gire al medio

## Acciones de la sesión

1. Nuevas tareas en `odd/tasks/landing-itec.md`: T9 (fotos reales en las burbujas) y T10 (composición: burbujas más arriba, árbol visible que gira al recorrerlas).
2. T9 y T10 delegadas a un agente escritor.

## Respuesta del agente

Listo, los dos cambios están hechos y subidos.

**Fotos reales:** las burbujas ahora muestran las fotos del sitio oficial, recortadas para que no aparezca el texto de los encabezados. Se les subió un poco el contraste, porque varias fotos del sitio tienen un velo blanco encima. Dos fotos son chicas en el original (Capacitación e iTec Labs) y se ven algo suaves.

**Árbol al centro:** la isla con el árbol queda siempre en el medio de la pantalla y las burbujas pasan arriba, en una fila delante del árbol. Al arrastrar, la isla gira: da una vuelta completa por cada vuelta del carrusel.

**Verificación:** pasan 205 tests y el build. En las capturas de escritorio y celular el árbol se ve en el centro y gira después de arrastrar. Capturas en `docs/bitacora/capturas/t10-*.jpg`.

**Detalle a mirar:** en los bordes de la pantalla las burbujas se juntan de a dos y se superponen un poco, por la curva que tienen en los extremos.

Probalo con `npm run dev`. ¿Cómo se siente el giro del árbol al recorrer las burbujas?
