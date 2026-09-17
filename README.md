# NO GROUND BELOW

**Demo 0.2 — physics climbing / “Foddian”**

> Subir es opcional. Caer es inevitable.

## Qué es

Estás atrapado dentro de una campana de hierro. Tu única herramienta es un ancla unida a una cadena. No hay salto, ni mejoras, ni checkpoints.

Subís haciendo palanca. Caés. Volvés a subir.

## Ejecutar

Para jugar en local, abrí la carpeta `dist` y dale doble click a **JUGAR.bat**.

También sirve abrir `index.html` en Chrome/Edge/Firefox, o:

```bash
py -3 -m http.server 8080
```

y andá a `http://localhost:8080`.

Para regenerar el build: `powershell -File build-dist.ps1`

## Controles

- **Mouse** — mover el ancla. Si está clavada, balancearte.
- **Mantener click** — clavar en metal. Acercá el mouse al ancla para recoger cadena.
- **Soltar** — liberar.
- **R** — reiniciar · **Esc** — pausa · **V** — voz · **M** — audio
- **Gamepad** — palanca apunta, gatillo agarra, Start pausa

## Qué hay en este build

- palanca y péndulo de verdad (el mouse mueve el peso, no solo el gancho)
- cadena Verlet, hitstop y cámara que sigue la caída
- 7 zonas con siluetas: muelle, restos, astillero, ciudad, antenas, hielo, campana
- vidrio que resbala, hielo que rebota, metal que muerde
- narrador, logros locales, mejor altura persistente
- audio ambiental que cambia con la altura
- menú, pausa, settings, gamepad

## Diseño

- `GAME_DESIGN.md` — visión
- `NARRATOR.md` — voz
- `ROADMAP.md` — prototype → Steam
