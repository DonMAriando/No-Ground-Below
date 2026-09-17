(() => {
"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const ui = {
  start: document.getElementById("start"),
  play: document.getElementById("play"),
  pause: document.getElementById("pause"),
  resume: document.getElementById("resume"),
  retry: document.getElementById("retry"),
  altitude: document.getElementById("altitude"),
  best: document.getElementById("best"),
  zone: document.getElementById("zone"),
  timer: document.getElementById("timer"),
  timerWrap: document.getElementById("timerWrap"),
  narrator: document.getElementById("narrator"),
  hint: document.getElementById("hint"),
  win: document.getElementById("win"),
  winStats: document.getElementById("winStats"),
  again: document.getElementById("again"),
  fallBanner: document.getElementById("fallBanner"),
  landmark: document.getElementById("landmark"),
  toast: document.getElementById("toast"),
  pauseStats: document.getElementById("pauseStats"),
  optAudio: document.getElementById("optAudio"),
  optVoice: document.getElementById("optVoice"),
  optShake: document.getElementById("optShake"),
};

const TAU = Math.PI * 2;
const WORLD_W = 1180;
const WORLD_H = 7200;
const START_Y = 6970;
const GOAL_Y = 245;
const PX_PER_M = 5.4;

let W = innerWidth, H = innerHeight, dpr = Math.min(devicePixelRatio || 1, 2);
let started = false, paused = false, won = false;
let last = performance.now(), elapsed = 0, titleT = 0;
let camY = START_Y - H * 0.65, camZoom = 1, shake = 0, hitstop = 0;
let audioOn = true, voiceOn = false, shakeOn = true;
let bestAlt = +(localStorage.getItem("ngb_best") || 0);
let hasWonOnce = localStorage.getItem("ngb_won") === "1";
let maxAltThisRun = 0, fallStartAlt = 0, wasFalling = false, biggestFall = 0;
let grabs = 0, recoveries = 0, messageTimer = 0, lastMessage = "", lastZone = "";
let firstGrab = false, firstSlip = false, firstBigFall = false;
let landmarkTimer = 0, toastTimer = 0, fallBannerTimer = 0;

const mouse = { x: W * .5, y: H * .45, down: false, justDown: false, justUp: false };
const padAim = { x: 0, y: -120, active: false };
let padStartHeld = false;

const settings = JSON.parse(localStorage.getItem("ngb_settings") || "{}");
if (typeof settings.audio === "boolean") audioOn = settings.audio;
if (typeof settings.voice === "boolean") voiceOn = settings.voice;
if (typeof settings.shake === "boolean") shakeOn = settings.shake;
ui.optAudio.checked = audioOn;
ui.optVoice.checked = voiceOn;
ui.optShake.checked = shakeOn;

const unlocked = new Set(JSON.parse(localStorage.getItem("ngb_ach") || "[]"));

const ZONES = [
  {min: 0, max: 150, name: "EL FONDO", sky:"#101816", fog:"#070c0a"},
  {min: 150, max: 330, name: "LOS RESTOS", sky:"#1c1512", fog:"#0e0a09"},
  {min: 330, max: 560, name: "EL ASTILLERO", sky:"#141c28", fog:"#0a1016"},
  {min: 560, max: 790, name: "LA CIUDAD COLGADA", sky:"#1a1c26", fog:"#0e1016"},
  {min: 790, max: 1030, name: "LAS ANTENAS", sky:"#1c1d2a", fog:"#101018"},
  {min: 1030, max: 1220, name: "EL HIELO NEGRO", sky:"#1c2836", fog:"#101820"},
  {min: 1220, max: 9999, name: "LA CAMPANA", sky:"#2a3342", fog:"#161c24"},
];

const LANDMARKS = [
  {y: 6910, name: "EL MUELLE"},
  {y: 6765, name: "EL ANDAMIO"},
  {y: 5380, name: "LA ESCALERA"},
  {y: 5288, name: "EL CARTEL"},
  {y: 4688, name: "LA GRÚA"},
  {y: 4510, name: "LA PROA"},
  {y: 3190, name: "LA VENTANA"},
  {y: 1900, name: "EL SALTO DE FE"},
  {y: 990, name: "EL TORNILLO"},
  {y: 245, name: "LA CAMPANA"},
];

const platforms = [];
function add(x, y, w, h, type="metal", tag="", look="beam") {
  platforms.push({x, y, w, h, type, tag, look});
}

function buildWorld() {
  platforms.length = 0;

  // —— EL FONDO: muelle, andamio ancho, agua ——
  add(0, 7050, WORLD_W, 180, "metal", "", "plank");
  add(140, 7022, 24, 28, "metal", "", "pole");
  add(340, 7022, 24, 28, "metal", "", "pole");
  add(40, 6910, 430, 42, "metal", "muelle", "plank");
  add(200, 6878, 18, 32, "metal", "", "pole");
  add(280, 6765, 560, 34, "metal", "", "plank");
  add(280, 6680, 22, 85, "metal", "", "pole");
  add(818, 6680, 22, 85, "metal", "", "pole");
  add(780, 6620, 200, 26, "metal", "", "plank");
  add(980, 6500, 140, 26, "metal", "", "plank");
  add(620, 6405, 210, 22, "glass");
  add(240, 6310, 280, 30, "metal", "", "plank");
  add(60, 6195, 220, 28, "metal", "", "plank");

  // —— LOS RESTOS: chatarra, L, escalera, cartel ——
  add(70, 6075, 120, 64, "metal", "", "crate");
  add(210, 6055, 170, 22, "metal", "", "beam");
  add(720, 5920, 240, 24, "metal", "", "beam");
  add(470, 5860, 20, 200, "metal", "", "pole");
  add(470, 5860, 110, 18, "metal", "", "beam");
  add(250, 5785, 200, 22, "glass");
  add(80, 5600, 22, 160, "metal", "", "pole");
  add(80, 5600, 190, 20, "metal", "", "beam");
  add(340, 5520, 70, 16, "metal", "", "plank");
  add(400, 5492, 70, 16, "metal", "", "plank");
  add(460, 5464, 70, 16, "metal", "", "plank");
  add(520, 5436, 70, 16, "metal", "", "plank");
  add(580, 5408, 70, 16, "metal", "", "plank");
  add(640, 5380, 90, 16, "metal", "", "plank");
  add(500, 5288, 270, 20, "metal", "cartel", "sign");
  add(500, 5288, 16, 90, "metal", "", "pole");
  add(754, 5288, 16, 90, "metal", "", "pole");
  add(900, 5180, 160, 24, "metal", "", "beam");
  add(620, 5088, 220, 24, "metal", "", "beam");

  // —— EL ASTILLERO: contenedores, grúa, casco, la proa ——
  add(50, 4988, 130, 72, "metal", "", "crate");
  add(50, 4916, 130, 72, "metal", "", "crate");
  add(50, 4844, 130, 56, "metal", "", "crate");
  add(760, 4920, 300, 28, "metal", "", "hull");
  add(800, 4795, 100, 18, "metal", "", "hull");
  add(250, 4688, 24, 300, "metal", "", "crane");
  add(250, 4688, 420, 22, "metal", "", "crane");
  add(940, 4688, 100, 18, "metal", "", "hull");
  add(800, 4575, 100, 18, "metal", "", "hull");
  add(540, 4510, 500, 26, "metal", "proa", "hull");
  add(800, 4380, 100, 18, "metal", "", "hull");
  add(300, 4380, 180, 24, "metal", "", "beam");
  add(860, 4300, 80, 18, "glass");
  add(80, 4240, 170, 24, "metal", "", "beam");
  add(940, 4210, 100, 18, "metal", "", "hull");
  add(1010, 4080, 22, 430, "metal", "", "mast");
  add(980, 4080, 90, 18, "metal", "", "hull");
  add(360, 4100, 180, 24, "metal", "", "beam");
  add(90, 3960, 200, 24, "metal", "", "beam");
  add(120, 3820, 210, 26, "metal", "", "beam");
  add(90, 3700, 220, 28, "metal", "", "beam");

  // La Ciudad Colgada
  add(55, 3560, 355, 28, "metal");
  add(490, 3460, 280, 26, "metal");
  add(870, 3350, 230, 24, "metal");
  add(700, 3190, 160, 22, "glass", "ventana");
  add(668, 3180, 14, 44, "metal");
  add(878, 3180, 14, 44, "metal");
  add(435, 3090, 185, 24, "metal");
  add(150, 2990, 190, 25, "metal");
  add(70, 2800, 310, 26, "metal");
  add(470, 2680, 250, 24, "metal");
  add(800, 2550, 270, 26, "metal");

  // Las Antenas
  add(910, 2390, 170, 24, "metal");
  add(690, 2280, 130, 20, "glass");
  add(430, 2180, 165, 22, "metal");
  add(170, 2070, 170, 22, "metal");
  add(70, 1900, 250, 24, "metal", "fe");
  add(390, 1790, 155, 20, "glass");
  add(600, 1680, 150, 22, "metal");
  add(825, 1570, 190, 24, "metal");

  // El Hielo Negro
  add(700, 1400, 350, 22, "ice");
  add(980, 1388, 16, 16, "metal");
  add(425, 1280, 190, 22, "metal");
  add(150, 1170, 190, 22, "ice");
  add(168, 1158, 14, 14, "metal");
  add(75, 990, 270, 22, "metal", "tornillo");
  add(430, 900, 210, 22, "ice");
  add(520, 888, 14, 14, "metal");
  add(720, 800, 310, 22, "metal");
  add(920, 630, 170, 22, "ice");
  add(650, 515, 190, 22, "metal");
  add(365, 430, 175, 22, "metal");
  add(120, 350, 175, 22, "metal");

  add(460, 245, 280, 24, "goal");
}
buildWorld();

const player = { x: 210, y: START_Y, vx: 0, vy: 0, r: 31, rot: 0, vr: 0 };
const anchor = {
  x: 300, y: START_Y - 40, vx: 0, vy: 0, r: 13, rot: 0,
  attached: false, ax: 0, ay: 0, surface: null, rope: 105
};
const particles = [];
const snow = Array.from({length: 70}, () => ({x: Math.random()*WORLD_W, y: Math.random()*WORLD_H, s: .4+Math.random()*1.6, v: 12+Math.random()*28}));

function resetChain() {}

function reset() {
  player.x = 210; player.y = START_Y; player.vx = player.vy = 0; player.rot = player.vr = 0;
  anchor.x = 300; anchor.y = START_Y - 40; anchor.vx = anchor.vy = 0;
  anchor.attached = false; anchor.surface = null; anchor.rope = 105; anchor.rot = 0;
  camY = START_Y - H * .65; camZoom = 1; won = false; elapsed = 0;
  maxAltThisRun = 0; biggestFall = 0; grabs = 0; recoveries = 0;
  firstGrab = firstSlip = firstBigFall = false; wasFalling = false; fallStartAlt = 0;
  particles.length = 0; resetChain();
  ui.win.classList.add("hidden");
  ui.fallBanner.classList.remove("show");
  if (started) say("Otra vez desde abajo. Qué lugar tan familiar.", 2.7, false);
}

function resize() {
  W = innerWidth; H = innerHeight; dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.floor(W * dpr); canvas.height = Math.floor(H * dpr);
  canvas.style.width = W + "px"; canvas.style.height = H + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener("resize", resize); resize();

function altitude(y = player.y) {
  return Math.max(0, Math.round((START_Y - y) / PX_PER_M));
}
function currentZone(a = altitude()) {
  return ZONES.find(z => a >= z.min && a < z.max) || ZONES[ZONES.length - 1];
}
function worldMouse() {
  if (padAim.active) return { x: player.x + padAim.x, y: player.y + padAim.y };
  return { x: mouse.x + (WORLD_W - W) * .5, y: mouse.y + camY };
}

function saveSettings() {
  localStorage.setItem("ngb_settings", JSON.stringify({audio: audioOn, voice: voiceOn, shake: shakeOn}));
}

canvas.addEventListener("mousemove", e => {
  mouse.x = e.clientX; mouse.y = e.clientY; padAim.active = false;
});
canvas.addEventListener("mousedown", e => {
  if (e.button === 0) { mouse.down = true; mouse.justDown = true; initAudio(); }
});
addEventListener("mouseup", e => {
  if (e.button === 0) { mouse.down = false; mouse.justUp = true; }
});
canvas.addEventListener("contextmenu", e => e.preventDefault());
addEventListener("keydown", e => {
  const k = (e.key || e.code || "").toLowerCase();
  if (!k) return;
  if (k === "r" && started && !paused) reset();
  if (k === "m") setAudio(!audioOn);
  if (k === "v") setVoice(!voiceOn);
  if (k === "escape" && started && !won) { e.preventDefault(); togglePause(); }
});

ui.play.onclick = () => {
  started = true; document.body.classList.add("playing");
  camY = player.y - H * .61; camZoom = 1;
  ui.start.classList.add("hidden"); initAudio(); startAmbience();
  ui.landmark.textContent = "EL MUELLE"; ui.landmark.classList.add("show"); landmarkTimer = 4;
  say("Arriba hay una campana. Vos tenés un ancla. Parece suficiente.", 4.5, true);
};
ui.again.onclick = () => reset();
ui.resume.onclick = () => togglePause(false);
ui.retry.onclick = () => { togglePause(false); reset(); };
ui.optAudio.onchange = () => setAudio(ui.optAudio.checked);
ui.optVoice.onchange = () => setVoice(ui.optVoice.checked);
ui.optShake.onchange = () => { shakeOn = ui.optShake.checked; saveSettings(); };

function setAudio(v) {
  audioOn = v; ui.optAudio.checked = v; saveSettings();
  if (audioOn) { initAudio(); startAmbience(); }
  else stopAmbience();
}
function setVoice(v) {
  voiceOn = v; ui.optVoice.checked = v; saveSettings();
  if (!voiceOn && "speechSynthesis" in window) speechSynthesis.cancel();
}
function togglePause(force) {
  paused = typeof force === "boolean" ? force : !paused;
  ui.pause.classList.toggle("hidden", !paused);
  if (paused) {
    const t = formatTime(elapsed);
    ui.pauseStats.textContent = `Altura ${altitude()} m · mejor ${bestAlt} m · ${t} · caídas graves ${recoveries}`;
  }
}

let actx = null, drone = null, drone2 = null, windGain = null, droneGain = null, noiseSrc = null;
function initAudio() {
  if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
  if (actx.state === "suspended") actx.resume();
}
function makeNoiseBuffer() {
  const n = actx.sampleRate * 2, buf = actx.createBuffer(1, n, actx.sampleRate), d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < n; i++) { last = (last + 0.02 * (Math.random()*2-1)) / 1.02; d[i] = last * 4; }
  return buf;
}
function startAmbience() {
  if (!audioOn) return;
  initAudio(); if (!actx || drone) return;
  drone = actx.createOscillator(); drone2 = actx.createOscillator();
  drone.type = "sine"; drone2.type = "triangle";
  drone.frequency.value = 46; drone2.frequency.value = 92.4;
  droneGain = actx.createGain(); droneGain.gain.value = 0.028;
  drone.connect(droneGain); drone2.connect(droneGain); droneGain.connect(actx.destination);
  const noise = actx.createBufferSource(); noise.buffer = makeNoiseBuffer(); noise.loop = true;
  const filter = actx.createBiquadFilter(); filter.type = "bandpass"; filter.frequency.value = 380; filter.Q.value = 0.6;
  windGain = actx.createGain(); windGain.gain.value = 0.012;
  noise.connect(filter); filter.connect(windGain); windGain.connect(actx.destination);
  drone.start(); drone2.start(); noise.start(); noiseSrc = noise;
}
function stopAmbience() {
  try { drone && drone.stop(); drone2 && drone2.stop(); noiseSrc && noiseSrc.stop(); } catch (_) {}
  drone = drone2 = noiseSrc = windGain = droneGain = null;
}
function setAmbience(alt) {
  if (!droneGain || !windGain || !actx) return;
  const t = actx.currentTime;
  const nearTop = clamp(alt / 1450, 0, 1);
  const inBell = alt > 1260;
  droneGain.gain.setTargetAtTime(inBell ? 0.004 : 0.02 + nearTop * 0.018, t, .4);
  windGain.gain.setTargetAtTime(0.01 + nearTop * 0.05, t, .5);
  drone.frequency.setTargetAtTime(42 + nearTop * 18, t, .8);
}
function tone(freq, dur, type, vol, slide) {
  if (!audioOn) return;
  initAudio(); if (!actx) return;
  const t = actx.currentTime, osc = actx.createOscillator(), g = actx.createGain();
  osc.type = type; osc.frequency.setValueAtTime(freq, t);
  if (slide) osc.frequency.exponentialRampToValueAtTime(slide, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
  osc.connect(g); g.connect(actx.destination); osc.start(t); osc.stop(t + dur + .02);
}
function clang(intensity=1) {
  tone(160 + Math.random()*80, .22, "triangle", Math.min(.16, .03*intensity), 58);
  tone(420 + Math.random()*60, .09, "square", Math.min(.04, .01*intensity), 180);
}
function thud(intensity=1) {
  tone(78, .16, "sine", Math.min(.2, .04*intensity), 34);
}
function icePing() { tone(740, .12, "sine", .05, 220); }
function glassTick() { tone(980, .08, "triangle", .04, 400); }
function bellHit() {
  tone(220, 3.2, "sine", .12, 110);
  tone(330, 2.6, "triangle", .06, 165);
  tone(440, 2.0, "sine", .04, 220);
}
function creak(intensity) {
  if (intensity < 1.4) return;
  tone(90 + Math.random()*40, .08, "sawtooth", Math.min(.03, intensity*0.008), 50);
}

function speak(text) {
  if (!voiceOn || !("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "es-AR"; u.rate = .92; u.pitch = .82; u.volume = .8;
  speechSynthesis.speak(u);
}
function say(text, seconds=3, voiced=true) {
  if (text === lastMessage && messageTimer > 0) return;
  lastMessage = text; messageTimer = seconds;
  ui.narrator.textContent = text; ui.narrator.classList.add("show");
  if (voiced) speak(text);
}

function clamp(v,a,b){ return Math.max(a, Math.min(b,v)); }
function len(x,y){ return Math.hypot(x,y); }
function lerp(a,b,t){ return a + (b-a)*t; }

function burst(x, y, n, color, speed=180) {
  for (let i = 0; i < n && particles.length < 420; i++) {
    const a = Math.random() * TAU, s = Math.random() * speed;
    particles.push({x, y, vx: Math.cos(a)*s, vy: Math.sin(a)*s - 40, life: .35+Math.random()*.5, max: .7, color, r: 1+Math.random()*2.4});
  }
}

function nearestPointRect(px, py, r) {
  return {x: clamp(px, r.x, r.x+r.w), y: clamp(py, r.y, r.y+r.h)};
}

function resolveCircleRect(body, rect, restitution=.12, friction=.82) {
  const q = nearestPointRect(body.x, body.y, rect), dx = body.x-q.x, dy = body.y-q.y;
  const d2 = dx*dx+dy*dy, rr = body.r*body.r;
  if (d2 >= rr) return null;
  let d = Math.sqrt(d2), nx = 0, ny = -1;
  if (d > 0.0001) { nx = dx/d; ny = dy/d; }
  else {
    const left = Math.abs(body.x-rect.x), right = Math.abs(body.x-(rect.x+rect.w));
    const top = Math.abs(body.y-rect.y), bottom = Math.abs(body.y-(rect.y+rect.h));
    const m = Math.min(left, right, top, bottom);
    if (m === left) { nx = -1; ny = 0; }
    else if (m === right) { nx = 1; ny = 0; }
    else if (m === bottom) { nx = 0; ny = 1; }
  }
  const pen = body.r - (d || 0);
  body.x += nx*pen; body.y += ny*pen;
  const vn = body.vx*nx + body.vy*ny;
  if (vn < 0) {
    body.vx -= (1+restitution)*vn*nx;
    body.vy -= (1+restitution)*vn*ny;
    if (Math.abs(ny) > .55) body.vx *= friction; else body.vy *= friction;
  }
  return {x: q.x, y: q.y, nx, ny, impact: Math.abs(vn)};
}

function tryAttach(contact, rect) {
  if (!mouse.down || anchor.attached || !contact) return;
  if (rect.type === "glass" || rect.type === "ice") {
    if (rect.type === "glass") glassTick(); else icePing();
    burst(contact.x, contact.y, 6, rect.type === "ice" ? "#cfe8f6" : "#b7d4de", 90);
    if (!firstSlip) { firstSlip = true; say("Eso brilla demasiado como para confiarle tu vida.", 3.2, true); }
    return;
  }
  anchor.attached = true; anchor.ax = contact.x; anchor.ay = contact.y; anchor.surface = rect;
  anchor.x = anchor.ax; anchor.y = anchor.ay; anchor.vx = anchor.vy = 0;
  anchor.rope = clamp(len(player.x-anchor.x, player.y-anchor.y), 86, 215);
  grabs++;
  if (!firstGrab) { firstGrab = true; say("Bien. Ahora el problema es que estás colgando de ahí.", 3.1, true); }
  clang(2.6);
  if (shakeOn) shake = Math.max(shake, 3);
  hitstop = Math.max(hitstop, 0.038);
  burst(contact.x, contact.y, 14, "#e4d7b0", 220);
}

function detach() {
  if (!anchor.attached) return;
  const dx = anchor.x-player.x, dy = anchor.y-player.y, l = Math.max(1, len(dx,dy));
  const tangentVx = (-dy/l) * player.vr * 28;
  const tangentVy = ( dx/l) * player.vr * 28;
  anchor.attached = false; anchor.surface = null;
  anchor.vx = player.vx + tangentVx;
  anchor.vy = player.vy + tangentVy;
}

function pollGamepad() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  let pad = null;
  for (const p of pads) if (p) { pad = p; break; }
  if (!pad) return;
  const lx = Math.abs(pad.axes[0]) > .18 ? pad.axes[0] : 0;
  const ly = Math.abs(pad.axes[1]) > .18 ? pad.axes[1] : 0;
  const rx = Math.abs(pad.axes[2]) > .18 ? pad.axes[2] : 0;
  const ry = Math.abs(pad.axes[3]) > .18 ? pad.axes[3] : 0;
  const ax = rx || lx, ay = ry || ly;
  if (ax || ay) {
    padAim.active = true;
    padAim.x = clamp(padAim.x + ax * 22, -240, 240);
    padAim.y = clamp(padAim.y + ay * 22, -240, 240);
  }
  const grab = pad.buttons[7]?.pressed || pad.buttons[0]?.pressed || pad.buttons[5]?.pressed;
  if (grab && !mouse.down) mouse.justDown = true;
  if (!grab && mouse.down && padAim.active) mouse.justUp = true;
  if (padAim.active) mouse.down = !!grab;
  const start = !!(pad.buttons[9]?.pressed || pad.buttons[8]?.pressed);
  if (start && !padStartHeld && started && !won) togglePause();
  padStartHeld = start;
}

function physics(dt) {
  const substeps = 4, sdt = dt / substeps;
  for (let s = 0; s < substeps; s++) {
    const wm = worldMouse();

    player.vy += 1100 * sdt;
    player.vx *= Math.pow(.996, sdt*60);
    player.vy *= Math.pow(.999, sdt*60);

    if (anchor.attached) {
      anchor.x = anchor.ax; anchor.y = anchor.ay; anchor.vx = anchor.vy = 0;
      const toHook = len(wm.x - anchor.x, wm.y - anchor.y);
      if (mouse.down && toHook < anchor.rope * 0.62) {
        anchor.rope = Math.max(86, anchor.rope - 46 * sdt);
      }

      // Mouse is the swing / lever. This is the game.
      const pullX = wm.x - player.x, pullY = wm.y - player.y;
      player.vx += pullX * 12.5 * sdt;
      player.vy += pullY * 12.5 * sdt;
      player.vx -= (wm.x - anchor.x) * 2.4 * sdt;
      player.vy -= (wm.y - anchor.y) * 2.4 * sdt;

      const dx = player.x - anchor.x, dy = player.y - anchor.y, d = Math.max(.001, len(dx,dy));
      if (d > anchor.rope) {
        const nx = dx/d, ny = dy/d, excess = d - anchor.rope;
        player.x -= nx * excess * .94; player.y -= ny * excess * .94;
        const outward = player.vx*nx + player.vy*ny;
        if (outward > 0) { player.vx -= nx*outward*.92; player.vy -= ny*outward*.92; }
        player.vx -= nx * excess * 8 * sdt; player.vy -= ny * excess * 8 * sdt;
        if (excess > 8) creak(excess);
      }
      if (mouse.justUp) detach();
    } else {
      anchor.vy += 930 * sdt;
      let dxm = wm.x - player.x, dym = wm.y - player.y, dm = Math.max(1, len(dxm,dym));
      const targetR = clamp(dm, 65, 225);
      const tx = player.x + dxm/dm*targetR, ty = player.y + dym/dm*targetR;
      const stiffness = mouse.down ? 26 : 18;
      anchor.vx += (tx - anchor.x) * stiffness * sdt;
      anchor.vy += (ty - anchor.y) * stiffness * sdt;
      anchor.vx *= Math.pow(.93, sdt*60);
      anchor.vy *= Math.pow(.93, sdt*60);

      const dx = anchor.x - player.x, dy = anchor.y - player.y, d = Math.max(1, len(dx,dy));
      const maxR = 232;
      if (d > maxR) {
        const nx = dx/d, ny = dy/d, excess = d - maxR;
        anchor.x -= nx*excess; anchor.y -= ny*excess;
        const out = anchor.vx*nx + anchor.vy*ny;
        if (out > 0) { anchor.vx -= nx*out*.9; anchor.vy -= ny*out*.9; }
        player.vx += nx*excess*6*sdt; player.vy += ny*excess*6*sdt;
      }
      const spd = len(anchor.vx, anchor.vy);
      if (spd > 40) anchor.rot = Math.atan2(anchor.vy, anchor.vx);
      else {
        const want = Math.atan2(wm.y - anchor.y, wm.x - anchor.x);
        anchor.rot = lerp(anchor.rot, want, 1 - Math.pow(.2, sdt*60));
      }
    }

    player.x += player.vx * sdt; player.y += player.vy * sdt;
    if (!anchor.attached) { anchor.x += anchor.vx * sdt; anchor.y += anchor.vy * sdt; }

    if (player.x - player.r < 0) { player.x = player.r; player.vx = Math.abs(player.vx)*.25; }
    if (player.x + player.r > WORLD_W) { player.x = WORLD_W - player.r; player.vx = -Math.abs(player.vx)*.25; }
    if (anchor.x - anchor.r < 0) { anchor.x = anchor.r; anchor.vx = Math.abs(anchor.vx)*.3; }
    if (anchor.x + anchor.r > WORLD_W) { anchor.x = WORLD_W - anchor.r; anchor.vx = -Math.abs(anchor.vx)*.3; }

    const tip = { x: anchor.x + Math.cos(anchor.rot)*10, y: anchor.y + Math.sin(anchor.rot)*10, r: 9, vx: anchor.vx, vy: anchor.vy };

    for (const p of platforms) {
      const skipPlayer = anchor.attached && p === anchor.surface;
      const pf = p.type === "ice" ? .985 : .82;
      const pr = p.type === "ice" ? .08 : .13;
      const pc = skipPlayer ? null : resolveCircleRect(player, p, pr, pf);
      if (pc && pc.impact > 170) {
        thud(clamp(pc.impact/150, 1, 4));
        if (shakeOn) shake = Math.max(shake, clamp(pc.impact/90, 1, 8));
        if (pc.impact > 320) hitstop = Math.max(hitstop, 0.045);
        burst(pc.x, pc.y, 8, "#8a9098", 140);
      }
      if (!anchor.attached) {
        const body = p.type === "ice" ? anchor : tip;
        body.vx = anchor.vx; body.vy = anchor.vy;
        const rest = p.type === "ice" ? .72 : .28;
        const fr = p.type === "ice" ? .99 : .88;
        const ac = resolveCircleRect(body, p, rest, fr);
        if (ac) {
          if (body !== anchor) { anchor.x += body.x - (anchor.x + Math.cos(anchor.rot)*10); anchor.y += body.y - (anchor.y + Math.sin(anchor.rot)*10); }
          else { anchor.x = body.x; anchor.y = body.y; }
          anchor.vx = body.vx; anchor.vy = body.vy;
          if (ac.impact > 120) {
            clang(clamp(ac.impact/120, 1, 4));
            if (shakeOn) shake = Math.max(shake, 1.5);
          }
          tryAttach(ac, p);
        }
      }
    }

    if (anchor.attached && anchor.surface) {
      const n = Math.atan2(player.y - anchor.y, player.x - anchor.x);
      anchor.rot = n;
    }

    player.vr += player.vx * .0008;
    if (anchor.attached) {
      const dx = anchor.x - player.x, dy = anchor.y - player.y;
      player.vr += (dx*player.vy - dy*player.vx) * 0.0000022;
    }
    player.vr *= .985; player.rot += player.vr * sdt;

    if (player.y > WORLD_H + 400) reset();
  }

  mouse.justDown = false; mouse.justUp = false;
}

function unlock(id, name, desc) {
  if (unlocked.has(id)) return;
  unlocked.add(id);
  localStorage.setItem("ngb_ach", JSON.stringify([...unlocked]));
  ui.toast.innerHTML = `<span class="k">LOGRO DESBLOQUEADO</span><span class="n">${name}</span><span class="d">${desc}</span>`;
  ui.toast.classList.add("show");
  toastTimer = 3.4;
  clang(1.4);
}

function updateNarration(dt) {
  messageTimer -= dt;
  if (messageTimer <= 0) ui.narrator.classList.remove("show");
  toastTimer -= dt;
  if (toastTimer <= 0) ui.toast.classList.remove("show");
  landmarkTimer -= dt;
  if (landmarkTimer <= 0) ui.landmark.classList.remove("show");
  fallBannerTimer -= dt;
  if (fallBannerTimer <= 0) ui.fallBanner.classList.remove("show");

  const a = altitude(), z = currentZone(a);
  if (z.name !== lastZone) {
    if (lastZone) {
      const lines = {
        "LOS RESTOS": "Los restos de otros intentos. No preguntes de quién.",
        "EL ASTILLERO": "Todo esto alguna vez flotó. Vos, por ahora, no.",
        "LA CIUDAD COLGADA": "Una ciudad construida por gente que odiaba las escaleras.",
        "LAS ANTENAS": "Acá arriba el viento empieza a opinar.",
        "EL HIELO NEGRO": "El hielo no sostiene promesas. Tampoco anclas.",
        "LA CAMPANA": "Ya la ves. Eso suele ser cuando uno se pone nervioso."
      };
      if (lines[z.name]) say(lines[z.name], 4.2, true);
    }
    lastZone = z.name;
    if (z.name === "LAS ANTENAS") unlock("antenas", "Sin mirar abajo", "Alcanzá Las Antenas.");
    if (z.name === "LA CAMPANA") unlock("hielo", "Frío", "Superá El Hielo Negro.");
  }

  for (const lm of LANDMARKS) {
    if (Math.abs(player.y - lm.y) < 70) {
      if (ui.landmark.textContent !== lm.name) {
        ui.landmark.textContent = lm.name;
        ui.landmark.classList.add("show");
        landmarkTimer = 3.2;
      }
    }
  }

  maxAltThisRun = Math.max(maxAltThisRun, a);
  if (a > bestAlt) {
    bestAlt = a; localStorage.setItem("ngb_best", bestAlt);
    if (a > 40 && a % 50 < 2) say("Nunca habías estado acá.", 2.4, false);
  }
  if (player.vy > 360 && !wasFalling) { wasFalling = true; fallStartAlt = a; }
  if (wasFalling && player.vy < 90) {
    const drop = fallStartAlt - a;
    if (drop > 45) {
      biggestFall = Math.max(biggestFall, drop);
      recoveries++;
      if (drop >= 50) unlock("scratch", "Primer rasguño", "Caé más de 50 m.");
      if (drop >= 150 && a > 20) unlock("recover", "No fue tan grave", "Recuperate de una caída de 150 m.");
      if (a < 30 && fallStartAlt > 500) unlock("again", "Otra vez vos", "Volvé al Fondo después de superar 500 m.");
      ui.fallBanner.textContent = `−${Math.round(drop)} m`;
      ui.fallBanner.classList.add("show");
      fallBannerTimer = 1.6;
      const big = drop > 180;
      if (big && !firstBigFall) {
        firstBigFall = true;
        say(`Eso fueron ${Math.round(drop)} metros. Técnicamente, conocés mejor el mapa.`, 4.4, true);
      } else if (drop > 160) {
        say("No voy a decir nada.", 2.8, true);
      } else {
        const lines = [
          `${Math.round(drop)} metros. Podría haber sido peor.`,
          "Ese lugar de abajo te extrañaba.",
          "La gravedad sigue funcionando. Confirmado.",
          "La próxima vez parecía más fácil desde arriba."
        ];
        say(lines[(Math.random()*lines.length)|0], 3.4, true);
      }
    }
    wasFalling = false;
  }

  if (player.y < GOAL_Y + 12 && !won) {
    won = true;
    localStorage.setItem("ngb_won", "1"); hasWonOnce = true;
    ui.timerWrap.classList.remove("hidden");
    unlock("clear", "Una sola dirección", "Terminá el juego.");
    if (!voiceOn) unlock("silence", "Silencio", "Terminá con el narrador desactivado.");
    bellHit();
    const t = formatTime(elapsed);
    ui.winStats.textContent = `Altura: ${a} m · Tiempo: ${t} · Caída más larga: ${Math.round(biggestFall)} m`;
    say("No había nada arriba. Pero ahora sabés que podías hacerlo.", 5, true);
    setTimeout(() => ui.win.classList.remove("hidden"), 1100);
  }
}

function formatTime(sec) {
  const s = Math.floor(sec), mm = Math.floor(s/60), ss = (s%60).toString().padStart(2,"0");
  return `${mm}:${ss}`;
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt; p.vy += 420*dt; p.x += p.vx*dt; p.y += p.vy*dt; p.vx *= .98;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function update(dt) {
  pollGamepad();
  if (!started || won || paused) return;
  if (hitstop > 0) { hitstop -= dt; mouse.justDown = false; return; }

  elapsed += dt;
  physics(dt);
  updateNarration(dt);
  updateParticles(dt);
  setAmbience(altitude());

  const spd = len(player.vx, player.vy);
  const falling = player.vy > 280;
  const targetZoom = falling ? lerp(1, 0.84, clamp(spd/1600, 0, 1)) : lerp(camZoom, 1, .08);
  camZoom += (targetZoom - camZoom) * (1 - Math.pow(.02, dt));

  const look = falling ? 0.38 : 0.61;
  const target = player.y - H * look;
  const follow = falling ? (1 - Math.pow(.00005, dt)) : (1 - Math.pow(.0008, dt));
  camY += (target - camY) * follow;
  camY = clamp(camY, 0, WORLD_H - H);

  const a = altitude(), z = currentZone(a);
  ui.altitude.textContent = a + " m";
  ui.best.textContent = bestAlt + " m";
  ui.zone.textContent = z.name;
  ui.timer.textContent = formatTime(elapsed);
  if (hasWonOnce) ui.timerWrap.classList.remove("hidden");
  ui.hint.textContent = anchor.attached
    ? "CLAVADA · mouse para palanca · mouse al ancla para recoger"
    : (mouse.down ? "BUSCANDO AGARRE…" : "mové el ancla · click al tocar metal");

  if (wasFalling) {
    const drop = Math.max(0, fallStartAlt - a);
    if (drop > 25) {
      ui.fallBanner.textContent = `−${Math.round(drop)} m`;
      ui.fallBanner.classList.add("show");
      fallBannerTimer = 0.2;
    }
  }
}

function ox() { return (W - WORLD_W) * .5; }

function drawBackground() {
  const a = started ? altitude() : Math.max(0, Math.round((START_Y - (camY + H*.5)) / PX_PER_M));
  const z = currentZone(a);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, z.sky); g.addColorStop(1, z.fog);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  ctx.save(); ctx.globalAlpha = .08 + clamp(a/2000, 0, .08);
  ctx.fillStyle = "#dce6f0";
  for (let i = 0; i < 40; i++) {
    const sx = ((i * 97) % W);
    const sy = ((i * 53) - camY * 0.04) % H;
    ctx.fillRect(sx, sy, 1.2, 1.2);
  }
  ctx.restore();

  // dust motes
  const mote = z.name === "LOS RESTOS" ? "rgba(210,140,70,.18)" : z.name === "EL FONDO" ? "rgba(120,190,150,.12)" : "rgba(200,210,220,.14)";
  ctx.save(); ctx.fillStyle = mote;
  for (let i = 0; i < 24; i++) {
    const mx = (i * 137 + titleT * 8) % W;
    const my = ((i * 89) - camY * 0.12 + titleT * 10) % H;
    ctx.globalAlpha = .06 + (i % 5) * .02;
    ctx.beginPath(); ctx.arc(mx, my, 1.2 + (i%3)*.4, 0, TAU); ctx.fill();
  }
  ctx.restore();

  if (camY < 1400) {
    ctx.save(); ctx.globalAlpha = .28; ctx.fillStyle = "#dce4eb";
    ctx.beginPath(); ctx.arc(W*.76, 90 + camY*.04, 58, 0, TAU); ctx.fill();
    ctx.globalAlpha = .08;
    ctx.beginPath(); ctx.arc(W*.76, 90 + camY*.04, 90, 0, TAU); ctx.fill();
    ctx.restore();
  }

  // distant ribs
  ctx.save(); ctx.globalAlpha = .1; ctx.strokeStyle = "#c5d0db"; ctx.lineWidth = 1;
  const off = (camY * .06) % 96;
  for (let y = -120 - off; y < H + 120; y += 96) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y + 22); ctx.stroke();
  }
  ctx.restore();

  // vignette
  const vg = ctx.createRadialGradient(W/2, H*.45, H*.2, W/2, H*.5, H*.85);
  vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.38)");
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
}

function roundRect(x, y, w, h, r) {
  const rr = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x+rr, y);
  ctx.arcTo(x+w, y, x+w, y+h, rr);
  ctx.arcTo(x+w, y+h, x, y+h, rr);
  ctx.arcTo(x, y+h, x, y, rr);
  ctx.arcTo(x, y, x+w, y, rr);
  ctx.closePath();
}

function drawSilhouettes() {
  const x0 = ox();
  ctx.save();
  ctx.translate(x0, -camY);

  // shaft walls — the tower you climb inside
  const wallL = ctx.createLinearGradient(-80, 0, 70, 0);
  wallL.addColorStop(0, "#0a0c10"); wallL.addColorStop(1, "#171c24");
  ctx.fillStyle = wallL; ctx.fillRect(-220, 0, 290, WORLD_H);
  const wallR = ctx.createLinearGradient(1110, 0, 1280, 0);
  wallR.addColorStop(0, "#171c24"); wallR.addColorStop(1, "#0a0c10");
  ctx.fillStyle = wallR; ctx.fillRect(1110, 0, 290, WORLD_H);

  ctx.fillStyle = "rgba(0,0,0,.35)";
  for (let y = 40; y < WORLD_H; y += 52) {
    ctx.fillRect(-210, y, 270, 1);
    ctx.fillRect(1120, y, 270, 1);
  }
  ctx.fillStyle = "rgba(180,190,200,.08)";
  for (let y = 80; y < WORLD_H; y += 160) {
    ctx.beginPath(); ctx.arc(40, y, 3, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(1140, y, 3, 0, TAU); ctx.fill();
  }
  // sparse warm lights
  for (let y = 400; y < WORLD_H; y += 520) {
    ctx.fillStyle = "rgba(210,150,70,.12)";
    ctx.fillRect(28, y, 8, 18);
    ctx.fillRect(1144, y + 160, 8, 18);
  }

  // zone stain on the shaft
  ctx.fillStyle = "rgba(36,90,70,.14)";
  ctx.fillRect(-220, 6160, 290, 1100); ctx.fillRect(1110, 6160, 290, 1100);
  ctx.fillStyle = "rgba(130,62,28,.14)";
  ctx.fillRect(-220, 5190, 290, 980); ctx.fillRect(1110, 5190, 290, 980);
  ctx.fillStyle = "rgba(40,70,110,.12)";
  ctx.fillRect(-220, 3940, 290, 1260); ctx.fillRect(1110, 3940, 290, 1260);

  // pipes
  ctx.strokeStyle = "#2a313a"; ctx.lineWidth = 8;
  ctx.beginPath(); ctx.moveTo(18, 200); ctx.lineTo(18, WORLD_H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(1162, 80); ctx.lineTo(1162, WORLD_H); ctx.stroke();

  // —— EL FONDO: water, pilings, nets ——
  const water = ctx.createLinearGradient(0, 7080, 0, 7200);
  water.addColorStop(0, "rgba(40,90,80,.45)"); water.addColorStop(1, "rgba(8,18,16,.85)");
  ctx.fillStyle = water; ctx.fillRect(-220, 7088, WORLD_W + 440, 140);
  ctx.strokeStyle = "rgba(120,200,170,.22)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-220, 7088); ctx.lineTo(WORLD_W+220, 7088); ctx.stroke();
  ctx.fillStyle = "#1a2420";
  for (const px of [90, 250, 520, 780, 1040]) {
    ctx.fillRect(px, 6780, 28, 320);
    ctx.fillStyle = "rgba(50,110,80,.2)"; ctx.fillRect(px-2, 6980, 32, 120);
    ctx.fillStyle = "#1a2420";
  }
  ctx.strokeStyle = "rgba(180,200,190,.28)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(80, 6910); ctx.quadraticCurveTo(200, 7040, 340, 6910); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(40, 6765); ctx.lineTo(40, 6910); ctx.stroke();
  ctx.fillStyle = "rgba(220,80,70,.55)";
  ctx.beginPath(); ctx.arc(160, 6888, 16, 0, TAU); ctx.fill();
  ctx.strokeStyle = "#f2f2f2"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(160, 6888, 16, 0, TAU); ctx.stroke();
  ctx.fillStyle = "rgba(230,170,70,.2)";
  ctx.beginPath(); ctx.arc(90, 6720, 18, 0, TAU); ctx.fill();
  ctx.fillRect(86, 6738, 8, 28);

  // —— LOS RESTOS: car, billboard, junk ——
  ctx.fillStyle = "#2a211c";
  ctx.fillRect(210, 6070, 170, 38);
  ctx.fillRect(238, 6040, 96, 32);
  ctx.fillStyle = "#1a1410";
  ctx.beginPath(); ctx.arc(240, 6110, 14, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(350, 6110, 14, 0, TAU); ctx.fill();
  ctx.fillStyle = "#3a2a22";
  ctx.fillRect(498, 5308, 274, 118);
  ctx.fillStyle = "#6a4a32";
  ctx.fillRect(512, 5322, 246, 90);
  ctx.fillStyle = "rgba(230,210,180,.4)";
  ctx.font = "700 22px Barlow, sans-serif";
  ctx.fillText("SE ALQUILA", 548, 5374);
  ctx.font = "600 12px Barlow, sans-serif";
  ctx.fillText("no preguntar por las escaleras", 548, 5396);
  ctx.fillStyle = "#2c221c";
  ctx.fillRect(40, 5680, 70, 160);
  ctx.fillRect(980, 5400, 90, 220);
  ctx.fillStyle = "rgba(230,150,60,.16)";
  ctx.fillRect(478, 5840, 14, 18);

  // —— EL ASTILLERO: ship, crane house, containers paint ——
  ctx.fillStyle = "#1a222c";
  ctx.beginPath();
  ctx.moveTo(740, 5020); ctx.lineTo(1140, 4980); ctx.lineTo(1125, 3920);
  ctx.lineTo(980, 3840); ctx.lineTo(760, 3920); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "rgba(140,90,50,.22)";
  for (let y = 3960; y < 4960; y += 46) ctx.fillRect(790, y, 300, 3);
  ctx.fillStyle = "rgba(28,34,42,.95)";
  for (let y = 4000; y < 4900; y += 70) {
    ctx.beginPath(); ctx.arc(980, y, 11, 0, TAU); ctx.fill();
    ctx.strokeStyle = "rgba(200,210,220,.18)"; ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.fillStyle = "#2a2414";
  ctx.fillRect(210, 4920, 90, 70);
  ctx.fillStyle = "rgba(200,170,60,.35)";
  ctx.fillRect(218, 4930, 74, 12);
  ctx.fillStyle = "rgba(200,210,220,.22)"; ctx.font = "700 22px Barlow, sans-serif";
  ctx.save(); ctx.translate(900, 4480); ctx.rotate(-Math.PI/2); ctx.fillText("VIGÍA", 0, 0); ctx.restore();
  ctx.strokeStyle = "rgba(180,170,120,.35)"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(274, 4708); ctx.lineTo(274, 4988); ctx.stroke();

  ctx.fillStyle = "rgba(180,70,40,.45)"; ctx.font = "800 18px Barlow, sans-serif";
  ctx.fillText("04", 88, 4960);
  ctx.fillStyle = "rgba(40,90,120,.45)";
  ctx.fillText("17", 88, 4888);

  // hanging city
  const buildings = [
    [40, 2580, 160, 1100], [220, 2720, 140, 960], [480, 2640, 200, 1080],
    [820, 2500, 180, 1180], [1020, 2780, 120, 820]
  ];
  for (const [bx, by, bw, bh] of buildings) {
    ctx.fillStyle = "#1a1e28"; ctx.fillRect(bx, by, bw, bh);
    for (let wy = by + 24; wy < by + bh - 20; wy += 28) {
      for (let wx = bx + 12; wx < bx + bw - 10; wx += 22) {
        const lit = ((wx * 13 + wy * 7) % 17) > 13;
        ctx.fillStyle = lit ? "rgba(230,175,90,.38)" : "rgba(80,100,120,.1)";
        ctx.fillRect(wx, wy, 10, 14);
      }
    }
  }

  // antennas
  ctx.strokeStyle = "#3a4252"; ctx.lineWidth = 5;
  const towers = [[180, 1480, 980], [540, 1520, 920], [900, 1440, 1100]];
  for (const [tx, ty, th] of towers) {
    ctx.beginPath(); ctx.moveTo(tx, ty+th); ctx.lineTo(tx, ty); ctx.stroke();
    ctx.lineWidth = 2;
    for (let y = ty; y < ty+th; y += 48) {
      ctx.beginPath(); ctx.moveTo(tx-16, y); ctx.lineTo(tx+16, y); ctx.stroke();
    }
    ctx.fillStyle = "#c43b3b"; ctx.beginPath(); ctx.arc(tx, ty, 5, 0, TAU); ctx.fill();
    ctx.lineWidth = 5;
  }

  // ice masses
  ctx.fillStyle = "rgba(160,200,225,.16)";
  ctx.beginPath(); ctx.moveTo(40, 1450); ctx.lineTo(280, 1380); ctx.lineTo(320, 1520); ctx.lineTo(60, 1560); ctx.fill();
  ctx.beginPath(); ctx.moveTo(780, 980); ctx.lineTo(1120, 860); ctx.lineTo(1160, 1100); ctx.lineTo(800, 1180); ctx.fill();

  ctx.restore();
}

function chainAttach() {
  const c = Math.cos(player.rot), s = Math.sin(player.rot);
  return { x: player.x + s * 32, y: player.y - c * 32 };
}

function chainPoints() {
  const a = chainAttach();
  const dx = anchor.x - a.x, dy = anchor.y - a.y;
  const d = Math.max(1, len(dx, dy));
  const extra = anchor.attached ? Math.max(0, anchor.rope - d) : 20;
  const sag = clamp(8 + extra * 0.42, 8, 38);
  const n = clamp(Math.round(d / 10), 12, 40);
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push({
      x: a.x + dx * t,
      y: a.y + dy * t + Math.sin(Math.PI * t) * sag
    });
  }
  return pts;
}

function drawChain() {
  const pts = chainPoints();
  if (pts.length < 2) return;
  const taut = anchor.attached;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.strokeStyle = "#07090b";
  ctx.lineWidth = 11;
  ctx.stroke();
  ctx.strokeStyle = taut ? "#cfc6a4" : "#9aa4ad";
  ctx.lineWidth = 7;
  ctx.stroke();
  ctx.strokeStyle = taut ? "#f0e8cc" : "#d5dce2";
  ctx.lineWidth = 2.4;
  ctx.stroke();

  for (let i = 0; i < pts.length - 1; i++) {
    const p = pts[i], q = pts[i + 1];
    const ang = Math.atan2(q.y - p.y, q.x - p.x);
    const mx = (p.x + q.x) * .5, my = (p.y + q.y) * .5;
    ctx.save();
    ctx.translate(mx, my);
    ctx.rotate(ang);
    ctx.strokeStyle = taut ? "#ebe3c6" : "#e8eef3";
    ctx.fillStyle = taut ? "#8a8168" : "#5c656c";
    ctx.lineWidth = 1.6;
    if (i % 2 === 0) {
      roundRect(-8, -3.6, 16, 7.2, 3);
      ctx.fill(); ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.ellipse(0, 0, 3.6, 6.2, 0, 0, TAU);
      ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
}

function drawDiverBell() {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.rot);

  ctx.fillStyle = "rgba(0,0,0,.32)";
  ctx.beginPath(); ctx.ellipse(0, 30, 22, 6, 0, 0, TAU); ctx.fill();

  ctx.strokeStyle = "#e4ebf0";
  ctx.lineWidth = 3.4;
  ctx.beginPath(); ctx.arc(0, -32, 7.5, 0, TAU); ctx.stroke();
  ctx.fillStyle = "#2c333a";
  ctx.fillRect(-3.5, -26, 7, 10);
  ctx.strokeStyle = "#c5ced4"; ctx.lineWidth = 1.5;
  ctx.strokeRect(-3.5, -26, 7, 10);

  const body = ctx.createLinearGradient(-28, -26, 28, 28);
  body.addColorStop(0, "#b4bec6");
  body.addColorStop(.35, "#5a646c");
  body.addColorStop(.7, "#2c333a");
  body.addColorStop(1, "#15191d");
  ctx.fillStyle = body;
  ctx.strokeStyle = "#d5dde3";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-17, -20);
  ctx.quadraticCurveTo(0, -34, 17, -20);
  ctx.quadraticCurveTo(27, -6, 24, 10);
  ctx.lineTo(31, 22);
  ctx.quadraticCurveTo(0, 32, -31, 22);
  ctx.lineTo(-24, 10);
  ctx.quadraticCurveTo(-27, -6, -17, -20);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  ctx.fillStyle = "#1e242a";
  ctx.beginPath(); ctx.ellipse(0, 23, 31, 7, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = "#c9d1d7"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(0, 23, 31, 7, 0, 0, TAU); ctx.stroke();

  ctx.fillStyle = "rgba(150,78,38,.32)";
  ctx.beginPath(); ctx.ellipse(-11, 8, 7, 13, .35, 0, TAU); ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,.18)";
  ctx.beginPath(); ctx.ellipse(12, -6, 5, 9, -.2, 0, TAU); ctx.fill();

  ctx.fillStyle = "#cfd8de";
  const rivets = [[-15,-10],[15,-10],[-21,6],[21,6],[-14,18],[14,18],[0,21]];
  for (const [rx, ry] of rivets) {
    ctx.beginPath(); ctx.arc(rx, ry, 2.1, 0, TAU); ctx.fill();
  }

  ctx.fillStyle = "#1a2026";
  ctx.beginPath(); ctx.arc(0, -1, 14, 0, TAU); ctx.fill();
  ctx.strokeStyle = "#e7eef3"; ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = "#8b939a"; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(0, -1, 16.2, 0, TAU); ctx.stroke();

  const glass = ctx.createRadialGradient(-4, -6, 1, 0, -1, 12);
  glass.addColorStop(0, "rgba(90,120,140,.45)");
  glass.addColorStop(.55, "rgba(18,28,34,.85)");
  glass.addColorStop(1, "#070a0d");
  ctx.fillStyle = glass;
  ctx.beginPath(); ctx.arc(0, -1, 12, 0, TAU); ctx.fill();

  ctx.fillStyle = "#05070a";
  ctx.beginPath(); ctx.arc(0, -5.2, 4.4, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, 3.6, 7.2, 7.4, 0, 0, Math.PI); ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,.4)";
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(0, -1, 12, -2.5, -1.05); ctx.stroke();

  ctx.restore();
}

function drawAnchor() {
  ctx.save();
  ctx.translate(anchor.x, anchor.y);
  ctx.rotate(anchor.rot + Math.PI/2);
  const metal = anchor.attached ? "#e8d7a6" : "#c5ccd3";
  ctx.fillStyle = metal;
  ctx.strokeStyle = "#f2f5f7";
  ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.arc(0, -12, 7, 0, TAU); ctx.stroke();
  ctx.fillRect(-4, -14, 8, 28);
  ctx.strokeRect(-4, -14, 8, 28);
  ctx.beginPath();
  ctx.moveTo(-22, 6); ctx.quadraticCurveTo(-18, 24, 0, 22);
  ctx.quadraticCurveTo(18, 24, 22, 6); ctx.lineTo(13, 11);
  ctx.quadraticCurveTo(9, 16, 4, 16); ctx.lineTo(4, -2);
  ctx.lineTo(-4, -2); ctx.lineTo(-4, 16);
  ctx.quadraticCurveTo(-9, 16, -13, 11); ctx.closePath();
  ctx.fill(); ctx.stroke();
  if (anchor.attached) {
    ctx.globalAlpha = .28 + Math.sin(elapsed * 10) * .08;
    ctx.beginPath(); ctx.arc(0, 8, 28, 0, TAU); ctx.stroke();
  }
  ctx.restore();
}

function drawWorld() {
  const x0 = ox();
  ctx.save();
  ctx.translate(x0, -camY);

  if (bestAlt > 0) {
    const by = START_Y - bestAlt * PX_PER_M;
    ctx.save(); ctx.globalAlpha = .14; ctx.strokeStyle = "#fff"; ctx.setLineDash([10, 16]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, by); ctx.lineTo(WORLD_W, by); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.font = "600 11px Barlow, sans-serif";
    ctx.fillText("MEJOR  " + bestAlt + " m", 24, by - 8);
    ctx.restore();
  }

  for (const p of platforms) {
    if (p.y + p.h < camY - 90 || p.y > camY + H + 90) continue;
    if (p.type === "glass") {
      ctx.fillStyle = "rgba(155,205,225,.16)"; ctx.strokeStyle = "rgba(200,235,245,.5)";
      ctx.fillRect(p.x, p.y, p.w, p.h); ctx.strokeRect(p.x+.5, p.y+.5, p.w-1, p.h-1);
      ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.fillRect(p.x+6, p.y+3, p.w*.4, 4);
    } else if (p.type === "ice") {
      ctx.fillStyle = "rgba(120,170,205,.3)"; ctx.strokeStyle = "rgba(190,225,245,.55)";
      ctx.fillRect(p.x, p.y, p.w, p.h); ctx.strokeRect(p.x+.5, p.y+.5, p.w-1, p.h-1);
      ctx.save(); ctx.globalAlpha = .3; ctx.strokeStyle = "#dff5ff";
      for (let x = p.x+18; x < p.x+p.w; x += 34) {
        ctx.beginPath(); ctx.moveTo(x, p.y+2); ctx.lineTo(x+12, p.y+p.h-2); ctx.stroke();
      }
      ctx.restore();
    } else if (p.type === "goal") {
      ctx.fillStyle = "#c7c0a6"; ctx.fillRect(p.x, p.y, p.w, p.h);
      const glow = ctx.createRadialGradient(p.x+p.w/2, p.y-150, 10, p.x+p.w/2, p.y-140, 280);
      glow.addColorStop(0, "rgba(235,220,170,.18)"); glow.addColorStop(1, "rgba(235,220,170,0)");
      ctx.fillStyle = glow; ctx.fillRect(p.x-80, p.y-320, p.w+160, 340);
      ctx.strokeStyle = "#d8d0b8"; ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(p.x+70, p.y); ctx.lineTo(p.x+70, p.y-228);
      ctx.lineTo(p.x+p.w-70, p.y-228); ctx.lineTo(p.x+p.w-70, p.y);
      ctx.stroke();
      ctx.beginPath(); ctx.arc(p.x+p.w/2, p.y-155, 52, 0, TAU); ctx.stroke();
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(p.x+p.w/2, p.y-155, 38, .2, Math.PI-.2); ctx.stroke();
    } else {
      const look = p.look || "beam";
      if (look === "plank") {
        ctx.fillStyle = "#3d342c"; ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = "#6a5b4a";
        for (let x = p.x; x < p.x+p.w; x += 28) ctx.fillRect(x+1, p.y+2, 24, p.h-4);
        ctx.fillStyle = "rgba(255,230,180,.1)"; ctx.fillRect(p.x, p.y, p.w, 2);
      } else if (look === "crate") {
        const col = ((p.x + p.y) | 0) % 2 === 0 ? "#6b2e24" : "#2c4a5c";
        ctx.fillStyle = col; ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.lineWidth = 2;
        ctx.strokeRect(p.x+.5, p.y+.5, p.w-1, p.h-1);
        ctx.strokeStyle = "rgba(0,0,0,.25)";
        for (let x = p.x+10; x < p.x+p.w; x += 14) {
          ctx.beginPath(); ctx.moveTo(x, p.y+2); ctx.lineTo(x, p.y+p.h-2); ctx.stroke();
        }
        ctx.fillStyle = "rgba(255,255,255,.12)"; ctx.fillRect(p.x, p.y, p.w, 3);
      } else if (look === "hull") {
        const grad = ctx.createLinearGradient(p.x, p.y, p.x, p.y+p.h);
        grad.addColorStop(0, "#8a9098"); grad.addColorStop(1, "#2a333c");
        ctx.fillStyle = grad; ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = "rgba(160,90,40,.28)"; ctx.fillRect(p.x, p.y+p.h-4, p.w, 4);
        ctx.fillStyle = "rgba(0,0,0,.35)";
        for (let x = p.x+12; x < p.x+p.w-6; x += 22) {
          ctx.beginPath(); ctx.arc(x, p.y+p.h*.5, 2.2, 0, TAU); ctx.fill();
        }
      } else if (look === "crane") {
        ctx.fillStyle = "#b8a24a"; ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = "#4a3f18"; ctx.fillRect(p.x, p.y, p.w, 3);
        ctx.fillStyle = "rgba(0,0,0,.25)";
        for (let i = p.x+8; i < p.x+p.w; i += 18) ctx.fillRect(i, p.y+4, 3, Math.max(4, p.h-8));
      } else if (look === "sign") {
        ctx.fillStyle = "#5a3e2a"; ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = "#c4a06a"; ctx.fillRect(p.x+4, p.y+3, p.w-8, Math.max(4, p.h-6));
      } else if (look === "pole" || look === "mast") {
        const grad = ctx.createLinearGradient(p.x, 0, p.x+p.w, 0);
        grad.addColorStop(0, "#2a3036"); grad.addColorStop(.4, "#8b949c"); grad.addColorStop(1, "#1c2126");
        ctx.fillStyle = grad; ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = "rgba(255,255,255,.15)"; ctx.fillRect(p.x+1, p.y, 2, p.h);
      } else {
        const grad = ctx.createLinearGradient(p.x, p.y, p.x, p.y+p.h);
        grad.addColorStop(0, "#a7b0b8"); grad.addColorStop(.18, "#505861"); grad.addColorStop(1, "#232a31");
        ctx.fillStyle = grad; ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = "rgba(255,255,255,.12)"; ctx.fillRect(p.x, p.y, p.w, 2);
        ctx.fillStyle = "rgba(0,0,0,.28)";
        for (let x = p.x+16; x < p.x+p.w-8; x += 42) {
          ctx.beginPath(); ctx.arc(x, p.y+p.h*.55, 2.6, 0, TAU); ctx.fill();
        }
        if (p.h > 40) {
          ctx.fillStyle = "rgba(0,0,0,.15)";
          for (let y = p.y+12; y < p.y+p.h; y += 22) ctx.fillRect(p.x, y, p.w, 1);
        }
      }
    }
  }

  // snow in ice band
  const a = started ? altitude() : 0;
  if (a > 900 || (!started && camY < 1600)) {
    ctx.fillStyle = "rgba(210,230,245,.35)";
    for (const s of snow) {
      const sy = (s.y + titleT * s.v) % 1600;
      if (sy > 300 && sy < 1600) ctx.fillRect(s.x, sy, s.s, s.s*3);
    }
  }

  // chain + player + anchor
  drawChain();
  drawDiverBell();
  drawAnchor();

  // particles
  for (const p of particles) {
    ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.r, p.r);
  }
  ctx.globalAlpha = 1;

  ctx.restore();
}

function render() {
  ctx.save();
  if (shake > 0 && shakeOn && started) {
    ctx.translate((Math.random()-.5)*shake, (Math.random()-.5)*shake);
    shake *= .88; if (shake < .1) shake = 0;
  }
  if (started) {
    ctx.translate(W/2, H/2); ctx.scale(camZoom, camZoom); ctx.translate(-W/2, -H/2);
  }
  drawBackground();
  drawSilhouettes();
  if (!started || started) drawWorld();
  ctx.restore();
}

function loop(t) {
  const dt = Math.min(.028, (t-last)/1000 || .016); last = t;
  if (!started) {
    titleT += dt;
    const span = START_Y - 180;
    camY = clamp(START_Y - H*.45 - ((titleT * 36) % span), 0, WORLD_H - H);
  }
  update(dt); render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
resetChain();
ui.best.textContent = bestAlt + " m";
if (hasWonOnce) ui.timerWrap.classList.remove("hidden");
})();
