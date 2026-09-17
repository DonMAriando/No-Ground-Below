# NO GROUND BELOW — Game Design Document

## 1. High concept

Un juego de escalada física brutalmente simple.

El jugador controla una cápsula de hierro con una sola herramienta: un ancla unida por cadena. Todo el movimiento nace de esa relación entre **peso, pivote, tensión, inercia y momento de liberación**.

**Tagline:** *Subir es opcional. Caer es inevitable.*

**Promesa:** en 20 segundos entendés qué hacer; después de horas todavía estás aprendiendo qué sos capaz de hacer.

---

## 2. Los pilares

### 2.1 Una herramienta, infinitos movimientos
El ancla no es un “grapple hook” automático. Es un objeto físico.

Puede:
- golpear;
- rebotar;
- enganchar;
- deslizarse;
- hacer palanca;
- quedar mal colocada;
- cambiar el centro de giro;
- generar impulso;
- salvar una caída por centímetros.

### 2.2 El jugador mejora; el personaje no
No hay:
- stats;
- stamina;
- perks;
- upgrades;
- mejores anclas;
- doble salto;
- checkpoints canónicos.

Todo lo que cambia entre minuto 1 y minuto 100 es la persona que está jugando.

### 2.3 La caída es contenido
Perder altura no es una pantalla de Game Over.

El jugador sigue jugando durante la caída. Puede recuperar el control, agarrarse de algo conocido, convertir una catástrofe en una salvada y generar momentos memorables.

### 2.4 Difícil pero legible
La física tiene que ser consistente. El jugador puede odiar lo que pasó, pero debe poder comprenderlo.

Regla de diseño:

> “Me equivoqué” es aceptable. “El juego hizo cualquier cosa” no.

### 2.5 Hecho para ser visto
Cada zona tiene:
- siluetas reconocibles;
- lugares con nombre informal;
- saltos que generan clips;
- caídas largas;
- recuperaciones espectaculares;
- momentos donde el narrador sabe callarse.

---

## 3. Fantasía y lore

Nunca se explica del todo.

El mundo parece haber sido construido verticalmente con los restos de algo que alguna vez estuvo al nivel del mar.

Barcos aparecen incrustados en edificios.
Grúas apuntan al vacío.
Antenas nacen desde departamentos.
El hielo existe donde no debería.

El protagonista está dentro de una vieja **campana de lastre**. No sabemos por qué.

La cadena no puede soltarse de la cápsula.

En la cima hay una campana enorme.

El narrador afirma que “arriba está la salida”.

Cuando el jugador llega descubre que no hay puerta, ascensor ni rescate.

Solo puede tocar la campana.

Y eso basta.

La historia no trata de escapar. Trata de descubrir por qué seguimos subiendo cuando nadie nos prometió nada.

---

## 4. Personaje

Nombre interno: **THE WEIGHT / EL PESO**.

Nunca muestra cara.
Nunca habla.

Forma:
- campana/cápsula oxidada;
- abertura negra central;
- pequeñas marcas de golpes;
- cadena fijada directamente a la carcasa.

La falta de identidad permite que el jugador se proyecte sobre él.

---

## 5. Herramienta: el ancla

### Acción 1 — apuntar
El mouse define hacia dónde intentás colocar el ancla.

### Acción 2 — agarrar
Mantener click prepara el ancla para morder una superficie válida.

### Acción 3 — recoger
Si está agarrada y mantenés click, la cadena se acorta.

### Acción 4 — soltar
Soltar click libera el ancla.

No existe botón de salto.

### Skill ceiling buscado

Principiante:
- se cuelga;
- recoge;
- alcanza la siguiente plataforma.

Intermedio:
- pendulea;
- suelta con inercia;
- recupera caídas.

Avanzado:
- catapultas;
- slingshots;
- cambios de pivote;
- golpes deliberados del ancla;
- rebotes sobre hielo;
- rutas alternativas.

Experto:
- atraviesa zonas enteras sin detenerse.

---

## 6. Superficies

### Hierro
Agarre confiable. Principal lenguaje del juego.

### Hormigón roto
Agarre parcial: solo aristas o elementos metálicos expuestos.

### Vidrio
El ancla impacta y resbala.

### Hielo negro
Casi cero fricción. Rebota y destruye la confianza del jugador.

### Cable / tubo
Puntos pequeños pero extremadamente útiles para jugadores precisos.

### Objetos móviles
Grúas, carteles, contenedores colgantes. No deben depender de RNG: siempre parten igual.

---

## 7. Mapa

El mapa principal es una sola columna continua. Sin cargas.

Objetivo aproximado de release: **1.300–1.500 m** verticales.

### Zona 1 — EL FONDO (0–150 m)
Tutorial sin cartel de tutorial.

Enseña:
- mover ancla;
- clavar;
- recoger;
- soltar;
- primera caída pequeña.

Setpiece: una estructura metálica ancha que permite practicar sin perder demasiado.

### Zona 2 — LOS RESTOS (150–330 m)
Chatarra urbana y objetos familiares.

Enseña:
- diagonales;
- pivotes;
- soltar con impulso.

Primer lugar desde el cual se puede caer hasta casi el inicio.

### Zona 3 — EL ASTILLERO (330–560 m)
Barco clavado verticalmente, grúas y contenedores.

Enseña:
- péndulos largos;
- superficies estrechas;
- movimiento lateral.

Setpiece central: **La Proa**. El jugador queda colgado debajo de un barco y debe lanzarse sobre la cubierta vertical.

### Zona 4 — LA CIUDAD COLGADA (560–790 m)
Departamentos, balcones, escaleras, carteles.

Enseña:
- precisión;
- rutas múltiples;
- recovery.

Setpiece: **La Ventana**, una abertura muy fácil de alcanzar y muy difícil de abandonar bien.

### Zona 5 — LAS ANTENAS (790–1.030 m)
Estructuras finas, espacio abierto, mucho vacío.

Enseña:
- conservar momentum;
- microajustes;
- confiar en movimientos largos.

Momento streamer: **El Salto de Fe**, una transferencia larga con caída de cientos de metros debajo.

### Zona 6 — EL HIELO NEGRO (1.030–1.260 m)
El lenguaje conocido se rompe.

El ancla no se fija al hielo.

Hay que:
- rebotarla;
- buscar pequeños tornillos y vigas;
- usar la cápsula como masa;
- combinar superficies.

Debe sentirse injusto durante 30 segundos y después perfectamente lógico.

### Zona 7 — LA CAMPANA (1.260–1.450 m)
Silencio.
Casi nada de música.
Pocas plataformas.

El jugador ve la meta permanentemente.

Los últimos 30 metros son técnicamente simples.

El enemigo es el pulso.

---

## 8. Dificultad

Curva:

1. comprensión;
2. confianza;
3. primera gran pérdida;
4. dominio parcial;
5. falsa seguridad;
6. hielo;
7. silencio final.

No aumentar dificultad agregando velocidad artificial ni inputs extra.

La dificultad sale de:
- geometría;
- consecuencias;
- distancia entre agarres;
- calidad de superficie;
- necesidad de conservar momentum.

---

## 9. Narrador

Voz:
- tranquila;
- seca;
- observadora;
- jamás grita;
- jamás insulta;
- jamás explica controles después del inicio.

No se burla todo el tiempo.

El silencio es una herramienta.

Principio:

> Cuanto peor la caída, menos palabras necesita.

El narrador comenta:
- primer agarre;
- ingreso a una zona;
- caídas de 50/100/200+ metros;
- repetición del mismo error;
- acercamiento al récord;
- llegada.

Ver `NARRATOR.md`.

---

## 10. Arte

### Dirección
Industrial melancólico.

Paleta:
- acero;
- carbón;
- óxido;
- azul nocturno;
- luz cálida muy escasa.

No usar UI colorida.
No usar partículas arcade.
No usar números flotantes.

### Cámara
2D / 2.5D lateral.
Zoom muy sutil según velocidad.
La cámara acompaña la caída: nunca protege al jugador ocultándole cuánto perdió.

### Animación
La gracia está en la física.
El personaje casi no necesita animaciones tradicionales.

---

## 11. Audio

### Música
Ambient mínima.

Capas:
- drone grave;
- viento;
- resonancia metálica;
- tonos lejanos de campana.

La música gana armónicos con la altura, pero no “celebra”.

En La Campana, la música desaparece casi por completo.

### SFX prioritarios
- golpe del ancla;
- cadena tensándose;
- raspado;
- cuerpo golpeando metal;
- vidrio;
- hielo;
- campana final.

El jugador debería reconocer por sonido si el agarre fue bueno.

---

## 12. UX

HUD:
- altura actual;
- mejor altura;
- nombre de zona.

Opcional después del primer finish:
- cronómetro;
- speedrun splits;
- contador de grandes caídas.

No minimapa.

No barra de stamina.

---

## 13. Guardado

Modo principal:
- recuerda mejor altura;
- no guarda posición.

Cerrar el juego significa volver a empezar.

Después de terminar por primera vez se habilita:
- Practice Mode por zonas;
- Speedrun Mode;
- Ghost del mejor recorrido.

La experiencia canónica siempre sigue siendo sin checkpoints.

---

## 14. Secretos

### Radios rotas
Pequeños receptores en lugares absurdos. Al golpearlos reproducen segundos de transmisiones antiguas.

### “No era por acá”
Ruta lateral extremadamente difícil que termina en un cartel sin recompensa.

### La cadena vieja
En una cavidad se ve otra cápsula oxidada con una cadena rota.

### Campanas pequeñas
Cinco escondidas. Tocarlas todas cambia solamente una línea del narrador al final.

Ningún secreto mejora al personaje.

---

## 15. Final

El jugador alcanza la gran campana.

Debe usar su propia ancla para golpearla.

El sonido dura varios segundos.

Pantalla negra.

Texto:

**NO HABÍA NADA ARRIBA.**

Pausa.

**PERO AHORA SABÉS QUE PODÍAS HACERLO.**

Créditos.

Después de los créditos aparece:

**R — otra vez**

---

## 16. Rejugabilidad

- speedrun;
- rutas alternativas;
- ghost personal;
- daily seeded “Scrap Tower” separado del mapa canónico;
- estadísticas de caídas;
- achievements;
- modos sin narrador / con narrador;
- workshop de mapas en una fase posterior.

Nunca introducir progresión que facilite el mapa principal.

---

## 17. Achievements

- **Primer rasguño** — caé más de 50 m.
- **No fue tan grave** — recuperate de una caída de 150 m sin tocar el fondo.
- **Otra vez vos** — volvé al Fondo después de superar 500 m.
- **Sin mirar abajo** — alcanzá Las Antenas.
- **Frío** — superá El Hielo Negro.
- **Una sola dirección** — terminá el juego.
- **No aprendiste nada** — empezá otra run dentro de los 30 segundos posteriores a terminar.
- **Silencio** — terminá con narrador desactivado.
- **Campanero** — encontrá las cinco campanas pequeñas.

---

## 18. Duración objetivo

Primer finish:
- 2 a 6 horas para un jugador medio;
- potencialmente mucho más.

Jugador experto:
- 15–30 minutos.

Speedrunner:
- objetivo de diseño: rutas por debajo de 10 minutos deben ser posibles sin glitches.

---

## 19. Comercial

Producto premium pequeño.
Nada de energía, skins con stats o monetización intrusiva.

Lanzamiento ideal:
1. itch.io demo;
2. Steam demo;
3. streamers pequeños/medianos;
4. Steam Next Fest si timing aplica;
5. release.

El trailer debe mostrar primero una gran salvada y después una caída desastrosa.

---

## 20. La pregunta que decide el proyecto

Antes de construir 1.500 metros de nivel:

**¿Mover, clavar, recoger y soltar el ancla se siente tan bien que queremos hacerlo durante horas?**

Si la respuesta es no, se itera la física.

No se arregla con contenido.
