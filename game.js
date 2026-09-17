(() => {
"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const ui = {
  start: document.getElementById("start"),
  play: document.getElementById("play"),
  altitude: document.getElementById("altitude"),
  best: document.getElementById("best"),
  zone: document.getElementById("zone"),
  narrator: document.getElementById("narrator"),
  hint: document.getElementById("hint"),
  win: document.getElementById("win"),
  winStats: document.getElementById("winStats"),
  again: document.getElementById("again"),
};

const TAU = Math.PI * 2;
const WORLD_W = 1180;
const WORLD_H = 7200;
const START_Y = 6970;
const GOAL_Y = 245;
const PX_PER_M = 5.4;

let W = innerWidth, H = innerHeight, dpr = Math.min(devicePixelRatio || 1, 2);
let started = false, won = false, last = performance.now(), elapsed = 0;
let camY = START_Y - H * 0.65, shake = 0, audioOn = true, voiceOn = false;
let bestAlt = +(localStorage.getItem("ngb_best") || 0);
let maxAltThisRun = 0, lastSafeAlt = 0, fallStartAlt = 0, wasFalling = false;
let messageTimer = 0, lastMessage = "", lastZone = "";
let firstGrab = false, firstSlip = false, firstBigFall = false;

const mouse = { x: W * .5, y: H * .45, down: false, justDown: false, justUp: false };

const ZONES = [
  {min: 0, max: 150, name: "EL FONDO", sky:"#0b0e14"},
  {min: 150, max: 330, name: "LOS RESTOS", sky:"#111722"},
  {min: 330, max: 560, name: "EL ASTILLERO", sky:"#151b25"},
  {min: 560, max: 790, name: "LA CIUDAD COLGADA", sky:"#1a1c24"},
  {min: 790, max: 1030, name: "LAS ANTENAS", sky:"#20202a"},
  {min: 1030, max: 1260, name: "EL HIELO NEGRO", sky:"#202936"},
  {min: 1260, max: 9999, name: "LA CAMPANA", sky:"#2d3340"},
];

const platforms = [];
function add(x,y,w,h,type="metal", label="") { platforms.push({x,y,w,h,type,label}); }

// Ground / tutorial
add(0, 7050, WORLD_W, 180, "metal");
add(60, 6900, 300, 34, "metal");
add(430, 6810, 240, 28, "metal");
add(755, 6690, 230, 30, "metal");
add(925, 6535, 190, 26, "metal");
add(650, 6400, 230, 26, "glass");
add(355, 6290, 245, 28, "metal");
add(90, 6150, 210, 28, "metal");

// The remains
add(360, 6015, 500, 24, "metal");
add(855, 5890, 180, 26, "metal");
add(620, 5740, 190, 24, "metal");
add(280, 5630, 220, 24, "glass");
add(80, 5480, 230, 28, "metal");
add(370, 5340, 180, 26, "metal");
add(640, 5220, 300, 24, "metal");
add(940, 5070, 170, 24, "metal");

// Shipyard
add(700, 4910, 360, 30, "metal");
add(480, 4760, 150, 24, "metal");
add(170, 4680, 245, 26, "metal");
add(70, 4500, 165, 24, "glass");
add(330, 4390, 240, 28, "metal");
add(650, 4260, 180, 22, "metal");
add(870, 4140, 220, 26, "metal");
add(690, 3970, 155, 22, "glass");
add(390, 3890, 210, 26, "metal");
add(105, 3760, 220, 28, "metal");

// Hanging city
add(55, 3560, 355, 28, "metal");
add(490, 3460, 280, 26, "metal");
add(870, 3350, 230, 24, "metal");
add(700, 3190, 160, 22, "glass");
add(435, 3090, 185, 24, "metal");
add(150, 2990, 190, 25, "metal");
add(70, 2800, 310, 26, "metal");
add(470, 2680, 250, 24, "metal");
add(800, 2550, 270, 26, "metal");

// Antennas
add(910, 2390, 170, 24, "metal");
add(690, 2280, 130, 20, "glass");
add(430, 2180, 165, 22, "metal");
add(170, 2070, 170, 22, "metal");
add(70, 1900, 250, 24, "metal");
add(390, 1790, 155, 20, "glass");
add(600, 1680, 150, 22, "metal");
add(825, 1570, 190, 24, "metal");

// Black ice
add(700, 1400, 350, 22, "ice");
add(425, 1280, 190, 22, "metal");
add(150, 1170, 190, 22, "ice");
add(75, 990, 270, 22, "metal");
add(430, 900, 210, 22, "ice");
add(720, 800, 310, 22, "metal");
add(920, 630, 170, 22, "ice");
add(650, 515, 190, 22, "metal");
add(365, 430, 175, 22, "metal");
add(120, 350, 175, 22, "metal");

// Goal
add(460, 245, 280, 24, "goal");

const player = {
  x: 210, y: START_Y, vx: 0, vy: 0, r: 31, rot: 0, vr: 0
};
const anchor = {
  x: 300, y: START_Y-40, vx: 0, vy: 0, r: 16,
  attached: false, ax: 0, ay: 0, surface: null, rope: 105
};

function reset() {
  player.x = 210; player.y = START_Y; player.vx = player.vy = 0; player.rot = player.vr = 0;
  anchor.x = 300; anchor.y = START_Y-40; anchor.vx = anchor.vy = 0; anchor.attached = false; anchor.surface = null; anchor.rope = 105;
  camY = START_Y - H*.65; won = false; elapsed = 0; maxAltThisRun = 0; lastSafeAlt = 0;
  firstGrab = firstSlip = firstBigFall = false; wasFalling = false; fallStartAlt = 0;
  ui.win.classList.add("hidden");
  say("Otra vez desde abajo. Qué lugar tan familiar.", 2.7, false);
}

function resize() {
  W = innerWidth; H = innerHeight; dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.floor(W*dpr); canvas.height = Math.floor(H*dpr);
  canvas.style.width = W+"px"; canvas.style.height = H+"px";
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
addEventListener("resize", resize); resize();

function altitude() {
  return Math.max(0, Math.round((START_Y - player.y) / PX_PER_M));
}
function currentZone(a=altitude()) {
  return ZONES.find(z => a >= z.min && a < z.max) || ZONES[ZONES.length-1];
}
function worldMouse() {
  return { x: mouse.x + (WORLD_W - W)*.5, y: mouse.y + camY };
}

canvas.addEventListener("mousemove", e => { mouse.x=e.clientX; mouse.y=e.clientY; });
canvas.addEventListener("mousedown", e => {
  if (e.button===0) { mouse.down=true; mouse.justDown=true; initAudio(); }
});
addEventListener("mouseup", e => {
  if (e.button===0) { mouse.down=false; mouse.justUp=true; }
});
canvas.addEventListener("contextmenu", e => e.preventDefault());
addEventListener("keydown", e => {
  if (e.key.toLowerCase()==="r") reset();
  if (e.key.toLowerCase()==="m") { audioOn=!audioOn; say(audioOn?"Audio activado.":"Silencio. También sirve.",1.8,false); }
  if (e.key.toLowerCase()==="v") { voiceOn=!voiceOn; say(voiceOn?"Voy a acompañarte. No prometo ayudar.":"Me callo. Por ahora.",2.2,true); }
});

ui.play.onclick = () => { started=true; ui.start.classList.add("hidden"); initAudio(); say("Arriba hay una campana. Vos tenés un ancla. Parece suficiente.", 4.5, true); };
ui.again.onclick = () => reset();

let actx = null;
function initAudio() {
  if (!audioOn) return;
  if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
  if (actx.state === "suspended") actx.resume();
}
function clang(intensity=1) {
  if (!audioOn) return;
  initAudio(); if (!actx) return;
  const t=actx.currentTime, osc=actx.createOscillator(), gain=actx.createGain();
  osc.type="triangle"; osc.frequency.setValueAtTime(150+Math.random()*70,t);
  osc.frequency.exponentialRampToValueAtTime(65,t+.18);
  gain.gain.setValueAtTime(Math.min(.17, .035*intensity),t);
  gain.gain.exponentialRampToValueAtTime(.001,t+.22);
  osc.connect(gain); gain.connect(actx.destination); osc.start(t); osc.stop(t+.23);
}
function thud(intensity=1) {
  if (!audioOn) return;
  initAudio(); if (!actx) return;
  const t=actx.currentTime, osc=actx.createOscillator(), gain=actx.createGain();
  osc.type="sine"; osc.frequency.setValueAtTime(80,t); osc.frequency.exponentialRampToValueAtTime(38,t+.12);
  gain.gain.setValueAtTime(Math.min(.22,.04*intensity),t); gain.gain.exponentialRampToValueAtTime(.001,t+.15);
  osc.connect(gain); gain.connect(actx.destination); osc.start(t); osc.stop(t+.16);
}
function speak(text) {
  if (!voiceOn || !("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "es-AR"; u.rate=.92; u.pitch=.82; u.volume=.8;
  speechSynthesis.speak(u);
}
function say(text, seconds=3, voiced=true) {
  if (text===lastMessage && messageTimer>0) return;
  lastMessage=text; messageTimer=seconds; ui.narrator.textContent=text; ui.narrator.classList.add("show");
  if (voiced) speak(text);
}

function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
function len(x,y){ return Math.hypot(x,y); }

function nearestPointRect(px,py,r) {
  return {x: clamp(px,r.x,r.x+r.w), y: clamp(py,r.y,r.y+r.h)};
}

function resolveCircleRect(body, rect, restitution=.12, friction=.82) {
  const q=nearestPointRect(body.x,body.y,rect), dx=body.x-q.x, dy=body.y-q.y;
  const d2=dx*dx+dy*dy, rr=body.r*body.r;
  if (d2>=rr) return null;
  let d=Math.sqrt(d2), nx=0, ny=-1;
  if (d>0.0001) { nx=dx/d; ny=dy/d; }
  else {
    const left=Math.abs(body.x-rect.x), right=Math.abs(body.x-(rect.x+rect.w));
    const top=Math.abs(body.y-rect.y), bottom=Math.abs(body.y-(rect.y+rect.h));
    const m=Math.min(left,right,top,bottom);
    if (m===left){nx=-1;ny=0;} else if(m===right){nx=1;ny=0;} else if(m===bottom){nx=0;ny=1;}
  }
  const pen=body.r-(d||0);
  body.x += nx*pen; body.y += ny*pen;
  const vn=body.vx*nx+body.vy*ny;
  if(vn<0){
    body.vx -= (1+restitution)*vn*nx;
    body.vy -= (1+restitution)*vn*ny;
    if(Math.abs(ny)>.55) body.vx*=friction; else body.vy*=friction;
  }
  return {x:q.x,y:q.y,nx,ny,impact:Math.abs(vn)};
}

function tryAttach(contact, rect) {
  if (!mouse.down || anchor.attached || !contact) return;
  if (rect.type==="glass" || rect.type==="ice") {
    if (!firstSlip) { firstSlip=true; say("Eso brilla demasiado como para confiarle tu vida.",3.2,true); }
    return;
  }
  anchor.attached=true; anchor.ax=contact.x; anchor.ay=contact.y; anchor.surface=rect;
  anchor.x=anchor.ax; anchor.y=anchor.ay; anchor.vx=anchor.vy=0;
  anchor.rope = clamp(len(player.x-anchor.x,player.y-anchor.y), 54, 215);
  if (!firstGrab) { firstGrab=true; say("Bien. Ahora el problema es que estás colgando de ahí.",3.1,true); }
  clang(2.6); shake=Math.max(shake,3);
}

function detach() {
  if(!anchor.attached) return;
  const dx=anchor.x-player.x, dy=anchor.y-player.y, l=Math.max(1,len(dx,dy));
  anchor.attached=false; anchor.surface=null;
  anchor.vx = player.vx + (-dy/l)*player.vr*22;
  anchor.vy = player.vy + ( dx/l)*player.vr*22;
}

function physics(dt) {
  const substeps=3, sdt=dt/substeps;
  for(let s=0;s<substeps;s++){
    const wm=worldMouse();

    player.vy += 1100*sdt;
    player.vx *= Math.pow(.996, sdt*60);
    player.vy *= Math.pow(.999, sdt*60);

    if(anchor.attached){
      anchor.x=anchor.ax; anchor.y=anchor.ay; anchor.vx=anchor.vy=0;
      if(mouse.down) anchor.rope = Math.max(48, anchor.rope - 70*sdt);
      const dx=player.x-anchor.x, dy=player.y-anchor.y, d=Math.max(.001,len(dx,dy));
      if(d>anchor.rope){
        const nx=dx/d, ny=dy/d, excess=d-anchor.rope;
        player.x -= nx*excess*.92; player.y -= ny*excess*.92;
        const outward=player.vx*nx+player.vy*ny;
        if(outward>0){ player.vx-=nx*outward*.94; player.vy-=ny*outward*.94; }
        player.vx -= nx*excess*7*sdt; player.vy -= ny*excess*7*sdt;
      }
      if(mouse.justUp) detach();
    } else {
      anchor.vy += 930*sdt;

      let dxm=wm.x-player.x, dym=wm.y-player.y, dm=Math.max(1,len(dxm,dym));
      const targetR=clamp(dm, 65, 225);
      const tx=player.x+dxm/dm*targetR, ty=player.y+dym/dm*targetR;
      const stiffness=mouse.down?22:17;
      anchor.vx += (tx-anchor.x)*stiffness*sdt;
      anchor.vy += (ty-anchor.y)*stiffness*sdt;
      anchor.vx *= Math.pow(.94,sdt*60);
      anchor.vy *= Math.pow(.94,sdt*60);

      const dx=anchor.x-player.x, dy=anchor.y-player.y, d=Math.max(1,len(dx,dy));
      const maxR=232;
      if(d>maxR){
        const nx=dx/d, ny=dy/d, excess=d-maxR;
        anchor.x-=nx*excess; anchor.y-=ny*excess;
        const out=anchor.vx*nx+anchor.vy*ny;
        if(out>0){anchor.vx-=nx*out*.9;anchor.vy-=ny*out*.9;}
        player.vx += nx*excess*5*sdt; player.vy += ny*excess*5*sdt;
      }
    }

    player.x += player.vx*sdt; player.y += player.vy*sdt;
    if(!anchor.attached){ anchor.x += anchor.vx*sdt; anchor.y += anchor.vy*sdt; }

    // World side boundaries
    if(player.x-player.r<0){player.x=player.r;player.vx=Math.abs(player.vx)*.25;}
    if(player.x+player.r>WORLD_W){player.x=WORLD_W-player.r;player.vx=-Math.abs(player.vx)*.25;}
    if(anchor.x-anchor.r<0){anchor.x=anchor.r;anchor.vx=Math.abs(anchor.vx)*.3;}
    if(anchor.x+anchor.r>WORLD_W){anchor.x=WORLD_W-anchor.r;anchor.vx=-Math.abs(anchor.vx)*.3;}

    for(const p of platforms){
      const pf = p.type==="ice" ? .985 : .82;
      const pr = p.type==="ice" ? .06 : .13;
      const pc=resolveCircleRect(player,p,pr,pf);
      if(pc && pc.impact>170){ thud(clamp(pc.impact/150,1,4)); shake=Math.max(shake,clamp(pc.impact/90,1,8)); }
      if(!anchor.attached){
        const ac=resolveCircleRect(anchor,p,p.type==="ice"?.7:.3,p.type==="ice"?.99:.88);
        if(ac){
          if(ac.impact>120){clang(clamp(ac.impact/120,1,4)); shake=Math.max(shake,1.5);}
          tryAttach(ac,p);
        }
      }
    }

    // approximate rotation from horizontal motion and rope torque
    player.vr += player.vx*.0008;
    if(anchor.attached){
      const dx=anchor.x-player.x, dy=anchor.y-player.y;
      player.vr += (dx*player.vy-dy*player.vx)*0.000002;
    }
    player.vr*=.985; player.rot += player.vr*sdt;

    // Fail-safe only below world floor.
    if(player.y>WORLD_H+400) reset();
  }

  mouse.justDown=false; mouse.justUp=false;
}

function updateNarration(dt) {
  messageTimer-=dt;
  if(messageTimer<=0) ui.narrator.classList.remove("show");

  const a=altitude(), z=currentZone(a);
  if(z.name!==lastZone){
    if(lastZone){
      const lines={
        "LOS RESTOS":"Los restos de otros intentos. No preguntes de quién.",
        "EL ASTILLERO":"Todo esto alguna vez flotó. Vos, por ahora, no.",
        "LA CIUDAD COLGADA":"Una ciudad construida por gente que odiaba las escaleras.",
        "LAS ANTENAS":"Acá arriba el viento empieza a opinar.",
        "EL HIELO NEGRO":"El hielo no sostiene promesas. Tampoco anclas.",
        "LA CAMPANA":"Ya la ves. Eso suele ser cuando uno se pone nervioso."
      };
      if(lines[z.name]) say(lines[z.name],4.2,true);
    }
    lastZone=z.name;
  }

  maxAltThisRun=Math.max(maxAltThisRun,a);
  if(a>bestAlt){bestAlt=a; localStorage.setItem("ngb_best",bestAlt);}
  if(player.vy>360 && !wasFalling){ wasFalling=true; fallStartAlt=a; }
  if(wasFalling && player.vy<90){
    const drop=fallStartAlt-a;
    if(drop>45){
      const big = drop>180;
      if(big && !firstBigFall){firstBigFall=true; say(`Eso fueron ${Math.round(drop)} metros. Técnicamente, conocés mejor el mapa.`,4.4,true);}
      else {
        const lines=[
          `${Math.round(drop)} metros. Podría haber sido peor.`,
          "Ese lugar de abajo te extrañaba.",
          "No voy a decir nada.",
          "La gravedad sigue funcionando. Confirmado.",
          "La próxima vez parecía más fácil desde arriba."
        ];
        say(lines[(Math.random()*lines.length)|0],3.4,true);
      }
    }
    wasFalling=false;
  }
  lastSafeAlt=a;

  if(player.y < GOAL_Y+10 && !won){
    won=true;
    const seconds=Math.floor(elapsed), mm=Math.floor(seconds/60), ss=(seconds%60).toString().padStart(2,"0");
    ui.winStats.textContent=`Altura: ${a} m · Tiempo: ${mm}:${ss}`;
    say("No había nada arriba. Pero ahora sabés que podías hacerlo.",5,true);
    setTimeout(()=>ui.win.classList.remove("hidden"),900);
  }
}

function update(dt){
  if(!started || won) return;
  elapsed += dt;
  physics(dt);
  updateNarration(dt);

  const target=player.y-H*.61;
  camY += (target-camY)*(1-Math.pow(.0008,dt));
  camY=clamp(camY,0,WORLD_H-H);

  const a=altitude(), z=currentZone(a);
  ui.altitude.textContent=a+" m";
  ui.best.textContent=bestAlt+" m";
  ui.zone.textContent=z.name;
  ui.hint.textContent = anchor.attached ? "AGARRADO · mantené click para recoger cadena" : (mouse.down ? "BUSCANDO AGARRE…" : "mové el ancla · mantené click al tocar metal");
}

function drawBackground() {
  const a=altitude(), z=currentZone(a);
  const g=ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,z.sky); g.addColorStop(1,"#07090d");
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);

  // distant vertical ribs
  ctx.save(); ctx.globalAlpha=.13; ctx.strokeStyle="#c5d0db"; ctx.lineWidth=1;
  const off=((camY*.07)%90);
  for(let y=-100-off;y<H+100;y+=90){ ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y+18);ctx.stroke(); }
  ctx.restore();

  // moon near top
  if(camY<900){
    ctx.save(); ctx.globalAlpha=.25; ctx.fillStyle="#dce4eb";
    ctx.beginPath(); ctx.arc(W*.77,120+camY*.05,52,0,TAU); ctx.fill(); ctx.restore();
  }
}

function drawWorld() {
  const ox=(W-WORLD_W)*.5;
  const sy=-camY;

  ctx.save();
  ctx.translate(ox,sy);

  // best-alt ghost line
  if(bestAlt>0){
    const by=START_Y-bestAlt*PX_PER_M;
    ctx.save(); ctx.globalAlpha=.12; ctx.strokeStyle="#ffffff"; ctx.setLineDash([12,14]); ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(0,by);ctx.lineTo(WORLD_W,by);ctx.stroke(); ctx.restore();
  }

  // structures and platforms
  for(const p of platforms){
    if(p.y+p.h<camY-80 || p.y>camY+H+80) continue;
    if(p.type==="glass"){
      ctx.fillStyle="rgba(155,205,225,.18)"; ctx.strokeStyle="rgba(200,235,245,.45)";
      ctx.fillRect(p.x,p.y,p.w,p.h); ctx.strokeRect(p.x+.5,p.y+.5,p.w-1,p.h-1);
    } else if(p.type==="ice"){
      ctx.fillStyle="rgba(120,170,205,.28)"; ctx.strokeStyle="rgba(190,225,245,.5)";
      ctx.fillRect(p.x,p.y,p.w,p.h); ctx.strokeRect(p.x+.5,p.y+.5,p.w-1,p.h-1);
      ctx.save();ctx.globalAlpha=.28;ctx.strokeStyle="#dff5ff";
      for(let x=p.x+20;x<p.x+p.w;x+=38){ctx.beginPath();ctx.moveTo(x,p.y+3);ctx.lineTo(x+14,p.y+p.h-3);ctx.stroke();}
      ctx.restore();
    } else if(p.type==="goal"){
      ctx.fillStyle="#c7c0a6"; ctx.fillRect(p.x,p.y,p.w,p.h);
      ctx.fillStyle="rgba(235,225,190,.14)"; ctx.fillRect(p.x-40,p.y-260,p.w+80,260);
      ctx.strokeStyle="#d8d0b8";ctx.lineWidth=5;
      ctx.beginPath();ctx.moveTo(p.x+70,p.y);ctx.lineTo(p.x+70,p.y-220);ctx.lineTo(p.x+p.w-70,p.y-220);ctx.lineTo(p.x+p.w-70,p.y);ctx.stroke();
      ctx.beginPath();ctx.arc(p.x+p.w/2,p.y-160,46,0,TAU);ctx.stroke();
    } else {
      const grad=ctx.createLinearGradient(p.x,p.y,p.x,p.y+p.h);
      grad.addColorStop(0,"#69717a");grad.addColorStop(.16,"#3b424b");grad.addColorStop(1,"#1c2229");
      ctx.fillStyle=grad;ctx.fillRect(p.x,p.y,p.w,p.h);
      ctx.fillStyle="rgba(255,255,255,.1)";ctx.fillRect(p.x,p.y,p.w,2);
      ctx.fillStyle="rgba(0,0,0,.22)";
      for(let x=p.x+18;x<p.x+p.w-10;x+=46){ctx.beginPath();ctx.arc(x,p.y+p.h*.55,3,0,TAU);ctx.fill();}
    }
  }

  // chain
  ctx.save();
  ctx.strokeStyle=anchor.attached?"#d7d5c8":"#9aa1a8"; ctx.lineWidth=4; ctx.lineCap="round";
  ctx.beginPath();
  const segments=18;
  for(let i=0;i<=segments;i++){
    const t=i/segments;
    const x=player.x+(anchor.x-player.x)*t;
    const sag=anchor.attached ? Math.sin(Math.PI*t)*Math.min(18,Math.abs(anchor.rope-len(player.x-anchor.x,player.y-anchor.y))*.4) : Math.sin(Math.PI*t)*10;
    const y=player.y+(anchor.y-player.y)*t+sag;
    if(i===0)ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.stroke();
  ctx.restore();

  // player bell/capsule
  ctx.save(); ctx.translate(player.x,player.y); ctx.rotate(player.rot);
  const pg=ctx.createRadialGradient(-10,-13,5,0,0,40);
  pg.addColorStop(0,"#8b9298");pg.addColorStop(.4,"#454c53");pg.addColorStop(1,"#171c21");
  ctx.fillStyle=pg;ctx.strokeStyle="#aeb3b6";ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(-26,-22);ctx.quadraticCurveTo(-34,3,-29,26);ctx.lineTo(29,26);ctx.quadraticCurveTo(34,3,26,-22);ctx.quadraticCurveTo(0,-38,-26,-22);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle="#0c1014";ctx.beginPath();ctx.arc(0,-7,10,0,TAU);ctx.fill();
  ctx.strokeStyle="rgba(255,255,255,.15)";ctx.beginPath();ctx.moveTo(-20,18);ctx.lineTo(20,18);ctx.stroke();
  ctx.restore();

  // anchor
  ctx.save();ctx.translate(anchor.x,anchor.y);
  ctx.fillStyle=anchor.attached?"#d8caa4":"#8e969d";ctx.strokeStyle="#e2e5e7";ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(0,-8,7,0,TAU);ctx.stroke();
  ctx.fillRect(-4,-12,8,28);
  ctx.beginPath();ctx.moveTo(-22,4);ctx.quadraticCurveTo(-18,22,0,20);ctx.quadraticCurveTo(18,22,22,4);ctx.lineTo(14,9);ctx.quadraticCurveTo(10,14,4,14);ctx.lineTo(4,-2);ctx.lineTo(-4,-2);ctx.lineTo(-4,14);ctx.quadraticCurveTo(-10,14,-14,9);ctx.closePath();ctx.fill();ctx.stroke();
  if(anchor.attached){ctx.globalAlpha=.25;ctx.beginPath();ctx.arc(0,8,25,0,TAU);ctx.stroke();}
  ctx.restore();

  ctx.restore();
}

function render(){
  ctx.save();
  if(shake>0){
    ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
    shake*=.88; if(shake<.1)shake=0;
  }
  drawBackground(); drawWorld();
  ctx.restore();

  if(!started){
    // nothing
  }
}

function loop(t){
  const dt=Math.min(.028,(t-last)/1000 || .016); last=t;
  update(dt); render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

ui.best.textContent=bestAlt+" m";
})();