# 003 · Landing, Engram unificado y Bulles como referencia central

- Fecha: 2026-10-16
- Fase: 1 · Definición → 2 · Diseño

## Prompt A

> al repo subi todo el codigo que generemos. unifica engram, la idea es hacer la landing de itec, con la informacion que provee, con el diseño planteado

## Respuesta del agente (A)

- **Engram unificado:** todo quedó en el proyecto `itecbulles`. El comando de merge de Engram rechazó juntar los dos proyectos porque los nombres son muy distintos, así que copié la memoria a mano y borré el proyecto viejo (es un borrado recuperable). Además fijé el nombre en `.engram/config.json` para que no vuelva a cambiar.
- **Repo:** subí la bitácora a `main` (commit `9ce1a89 docs: add project log`). Dejé fuera del repo `.atl/` y `.engram/`, que son configuración local de las herramientas. La primera vez que intenté subirlos, el sistema me frenó por privacidad: contienen rutas de tu máquina.
- **Landing:** creé el plan en `odd/tasks/landing-itec.md`, con 5 tareas y en la rama `feat/landing-itec`. Un agente la está construyendo ahora con Vite, JavaScript sin framework y tests con Vitest. Primero junta el contenido real de cada página del iTec y no inventa datos.

Para no frenar, asumí que el botón principal es "Quiero + Info" (el formulario actual) y que WhatsApp queda como contacto secundario. Lo anoté como decisión pendiente D-06; si preferís otra cosa, lo cambio.

## Prompt B

> Fundamental: el diseño, tecnologia, experiencia en el uso de https://experience.projetbulles.com/.

## Respuesta del agente (B)

Cambio de rumbo aplicado:

- **Frené la construcción:** el agente que armaba la landing termina solo el modelo de contenido real del iTec (sirve con cualquier tecnología) y no sigue con la interfaz.
- **Estudio a fondo de Bulles:** lancé un agente que descarga y analiza el código de la página (librerías, shaders, rutas, audio) e intenta recorrer la experiencia completa en el navegador, con capturas en cada paso.
- **Hipótesis a verificar:** Bulles usa Nuxt (Vue), WebGL y Howler.js para el audio. Si se confirma, la landing usa el mismo stack.

Cuando lleguen los dos resultados rehago el plan de interfaz (T2–T4) sobre lo que encontremos y te lo muestro antes de construir.
