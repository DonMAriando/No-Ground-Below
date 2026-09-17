# ROADMAP

## Fase 0 — Prototype de control
**Incluida en este ZIP.**

Objetivo:
- comprobar si el ancla es divertida;
- comprobar si una gran caída genera deseo de reintentar y no solamente frustración.

No invertir todavía en arte definitivo.

### Métricas de playtest
Preguntar:
1. ¿Entendiste el control sin explicación verbal?
2. ¿Sentiste que el ancla hacía lo que esperabas?
3. ¿Recordás un momento donde te “salvaste”?
4. Después de una caída grande, ¿quisiste reintentar?
5. ¿Qué movimiento descubriste por tu cuenta?

---

## Fase 1 — Feel 0.2

Prioridad absoluta:
- mejorar colisiones;
- cadena con segmentos físicos/Verlet;
- superficies con normales correctas;
- agarre por punta del ancla;
- mejor transmisión de momentum;
- controller support;
- freeze-frame de 30–50 ms en impactos fuertes;
- cámara dinámica.

Criterio de salida:
10 testers pueden describir al menos una técnica avanzada que descubrieron sin tutorial.

---

## Fase 2 — Vertical Slice

Construir ~350 m definitivos:
- Fondo;
- Restos;
- parte del Astillero.

Agregar:
- arte 2.5D;
- SFX reales;
- música;
- narrador grabado;
- menú;
- settings;
- remapeo;
- accessibility;
- analytics locales de caídas.

Publicar demo privada.

---

## Fase 3 — Demo pública itch.io

Contenido:
- ~450–600 m;
- 30–60 minutos para primer jugador;
- un gran setpiece;
- final temporal.

Necesario:
- página itch;
- GIFs;
- trailer corto;
- formulario de feedback;
- build Windows + Web si rendimiento lo permite.

Objetivo:
encontrar clips y lenguaje orgánico de jugadores (“el barco”, “la antena”, “el maldito vidrio”).

---

## Fase 4 — Steam

- Steamworks;
- achievements;
- cloud save solo para settings/stats;
- leaderboards de speedrun;
- demo;
- página con trailer y screenshots;
- crash reporting;
- gamepad completo.

No agregar checkpoints al modo principal por presión de wishlist.

---

## Fase 5 — Contenido completo

Construir las 7 zonas.
Cada zona debe tener:
- 1 concepto mecánico;
- 1 lugar icónico;
- 1 caída memorable;
- 1 ruta avanzada;
- 1 recuperación posible.

---

## Fase 6 — Polish

- ghost runs;
- practice desbloqueable tras primer clear;
- speedrun timer;
- subtítulos completos;
- opciones para reducir flashes/shake;
- mezcla de audio;
- traducciones;
- QA de física a 30/60/120/144 Hz.

---

## Tecnología recomendada

### Ahora
HTML5 Canvas + JavaScript sin dependencias.

Ventajas:
- iteración instantánea;
- compartir link;
- cero setup;
- ideal para probar mecánica.

### Si el concepto funciona
**Godot 4** es una excelente opción para llevarlo a producción:
- física 2D;
- editor de niveles;
- export PC/Web;
- tooling liviano;
- control total del juego.

Unity también es viable, especialmente si decidimos 3D/2.5D pesado, pero para este diseño Godot reduce complejidad.

---

## Backlog inmediato

1. Hacer 10 runs del prototipo.
2. Ajustar `stiffness`, gravedad, largo de cadena y reel speed.
3. Construir un solo obstáculo “imposible” y probar si se vuelve dominable.
4. Grabar 5 minutos de gameplay.
5. Identificar movimientos emergentes.
6. Recién entonces diseñar el mapa final.
