# NO GROUND BELOW

**Prototype 0.1 — physics climbing / “Foddian” game**

> Subir es opcional. Caer es inevitable.

## Qué es

NO GROUND BELOW es un juego de escalada física de una sola mecánica: estás atrapado dentro de una cápsula/campana de hierro y tu única herramienta es un ancla unida a una cadena.

No hay salto. No hay doble salto. No hay mejoras. No hay checkpoints en el modo principal.

El jugador aprende a:

- mover el ancla con el mouse;
- clavarla en superficies válidas;
- recoger cadena;
- balancearse;
- hacer palanca;
- aprovechar el peso de la cápsula;
- soltar en el momento exacto;
- sobrevivir a errores que pueden costar cientos de metros.

La meta es una campana suspendida en la parte superior del mundo.

## Ejecutar

No requiere instalación.

1. Abrí `index.html` en Chrome/Edge/Firefox.
2. Click en **EMPEZAR A SUBIR**.
3. Jugá.

Para servirlo localmente:

```bash
python -m http.server 8080
```

y abrí `http://localhost:8080`.

## Controles

- **Mover mouse:** posicionar/balancear el ancla.
- **Mantener click izquierdo:** intentar clavar el ancla cuando toca metal; si ya está clavada, recoger cadena.
- **Soltar click:** liberar.
- **R:** reiniciar.
- **V:** activar/desactivar voz del narrador usando Speech Synthesis del navegador.
- **M:** audio.

## Qué incluye el prototipo

- física del cuerpo;
- ancla dinámica;
- cadena limitada;
- agarre/release/reel;
- superficies metálicas;
- vidrio no agarrable;
- hielo con rebote y poca fricción;
- 7 zonas verticales;
- altura y récord persistente con `localStorage`;
- narrador reactivo a zonas y caídas;
- efectos de audio procedurales con WebAudio;
- final jugable;
- cero assets externos.

## Archivos de diseño

- `GAME_DESIGN.md`: visión completa del juego.
- `NARRATOR.md`: personalidad, reglas y banco de frases.
- `ROADMAP.md`: camino de prototype → demo → Steam/itch build.

## Estado

Este build busca contestar una sola pregunta: **¿es divertido dominar el ancla?**

Antes de agregar arte, historia, leaderboards o contenido, hay que iterar el “feel” de esa mecánica.
