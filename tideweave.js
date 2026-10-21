/* Tideweave: a small, self-contained Canvas arcade game. */
(function () {
  'use strict';
  const W = 720, H = 360;
  let frame = 0, raf = 0, active = false, paused = false, strokes = [], motes = [], gates = [], score = 0;
  let canvas, ctx, host, onExit, pointerDown = false, lastSpawn = 0;
  const colors = ['#ff9fc8', '#a9f1df', '#ffe29d', '#c2b3ff'];
  function mote(x, y, color) { return { x, y, vx: (Math.random() - .5) * 1.2, vy: (Math.random() - .5) * 1.2, r: 4 + Math.random() * 2, color, phase: Math.random() * 6.28 }; }
  function start(parent, exit) {
    stop(false); host = parent; onExit = exit; score = 0; frame = 0; paused = false; strokes = [];
    host.innerHTML = `<div class="hub-eyebrow">ARCADE · TIDEWEAVE</div><h2 class="hub-heading">Shape the current</h2><p class="hub-subtitle">Drag to draw a ribbon. It bends nearby motes. Undo a line or pause whenever you like.</p><canvas class="tideweave-canvas" width="720" height="360" aria-label="Drifting motes and gates. Drag to draw current ribbons."></canvas><div class="tideweave-toolbar"><span id="tideweave-count">✦ ${score} passages</span><span><button class="hub-card-button lavender" data-tide="undo">Undo ribbon</button> <button class="hub-card-button" data-tide="pause">Pause</button> <button class="hub-card-button mint" data-tide="exit">Leave</button></span></div><p class="tideweave-hint">Mouse or touch: draw · Escape: pause · Nothing is lost when you leave</p>`;
    canvas = host.querySelector('canvas'); ctx = canvas.getContext('2d');
    motes = Array.from({ length: 18 }, (_, i) => mote(90 + Math.random() * (W - 180), 45 + Math.random() * (H - 90), colors[i % colors.length]));
    gates = [{ x: 14, y: 125, h: 72, phase: 0 }, { x: W - 14, y: 240, h: 72, phase: 2.8 }];
    canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
    host.addEventListener('click', actions); window.addEventListener('keydown', keys); active = true; tick();
  }
  function point(e) { const r = canvas.getBoundingClientRect(); return { x: (e.clientX-r.left)*W/r.width, y: (e.clientY-r.top)*H/r.height }; }
  function down(e) { if (paused) return; e.preventDefault(); pointerDown = true; canvas.setPointerCapture(e.pointerId); const p = point(e); strokes.push([p]); if (strokes.length > 5) strokes.shift(); }
  function move(e) { if (!pointerDown || paused) return; const p = point(e), line = strokes[strokes.length-1], prev = line[line.length-1]; if (Math.hypot(p.x-prev.x,p.y-prev.y)>7) { line.push(p); if(line.length>28)line.splice(1,1); } }
  function up() { pointerDown = false; }
  function actions(e) { const b=e.target.closest('[data-tide]'); if(!b)return; if(b.dataset.tide==='undo')strokes.pop(); if(b.dataset.tide==='pause'){paused=!paused;b.textContent=paused?'Resume':'Pause';} if(b.dataset.tide==='exit')stop(true); }
  function keys(e) { if(!active)return; if(e.key==='Escape'){e.preventDefault();paused=!paused;const b=host.querySelector('[data-tide="pause"]');if(b)b.textContent=paused?'Resume':'Pause';} }
  function tick() { if(!active)return; if(!paused) { frame++; update(); } draw(); raf=requestAnimationFrame(tick); }
  function update() {
    for(const m of motes){
      m.phase+=.025; m.vx+=Math.sin(frame*.008+m.phase)*.006; m.vy+=Math.cos(frame*.007+m.phase)*.006;
      for(const line of strokes) for(let i=1;i<line.length;i++) { const a=line[i-1],b=line[i],dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((m.x-a.x)*dx+(m.y-a.y)*dy)/l2)),qx=a.x+t*dx,qy=a.y+t*dy,dist=Math.hypot(m.x-qx,m.y-qy); if(dist<68&&dist>1){const f=(1-dist/68)*.022;m.vx+=(-dy/Math.sqrt(l2))*f;m.vy+=(dx/Math.sqrt(l2))*f;} }
      m.vx=Math.max(-1.7,Math.min(1.7,m.vx));m.vy=Math.max(-1.7,Math.min(1.7,m.vy));m.x+=m.vx;m.y+=m.vy;
      if(m.y<18||m.y>H-18)m.vy*=-.85;
      if(m.x<22&&Math.abs(m.y-gates[0].y)<gates[0].h/2){m.x=W-34;m.y=gates[1].y+(Math.random()-.5)*gates[1].h*.7;score++;}
      else if(m.x>W-22&&Math.abs(m.y-gates[1].y)<gates[1].h/2){m.x=34;m.y=gates[0].y+(Math.random()-.5)*gates[0].h*.7;score++;}
      if(m.x<20||m.x>W-20)m.vx*=-.8;
    }
    if(frame-lastSpawn>320&&motes.length<30){motes.push(mote(W/2+(Math.random()-.5)*100,H/2+(Math.random()-.5)*80,colors[Math.floor(Math.random()*colors.length)]));lastSpawn=frame;}
    const label=host.querySelector('#tideweave-count');if(label)label.textContent=`✦ ${score} passages · ${motes.length} motes`;
  }
  function draw() {
    ctx.fillStyle='#18233e';ctx.fillRect(0,0,W,H);
    for(let i=0;i<48;i++){ctx.fillStyle=i%3?'rgba(220,226,255,.17)':'rgba(255,225,157,.35)';ctx.fillRect((i*149+frame*.12)%W,(i*83)%H,2,2);}
    gates.forEach((g,i)=>{ctx.fillStyle='rgba(180,166,255,.12)';ctx.fillRect(i?W-28:0,g.y-g.h/2,28,g.h);ctx.strokeStyle=i?'#a9f1df':'#ff9fc8';ctx.lineWidth=3;ctx.strokeRect(i?W-21:7,g.y-g.h/2+4,14,g.h-8);});
    strokes.forEach(line=>{if(line.length<2)return;ctx.beginPath();line.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='rgba(194,179,255,.16)';ctx.lineWidth=19;ctx.stroke();ctx.strokeStyle='#d6c8ff';ctx.lineWidth=3;ctx.stroke();});
    for(const m of motes){ctx.fillStyle=m.color;ctx.beginPath();ctx.arc(m.x,m.y,m.r+Math.sin(frame*.05+m.phase)*.7,0,Math.PI*2);ctx.fill();ctx.fillStyle='rgba(255,255,255,.5)';ctx.fillRect(m.x-1,m.y-1,2,2);}
    if(paused){ctx.fillStyle='rgba(10,14,32,.52)';ctx.fillRect(0,0,W,H);ctx.fillStyle='#fff';ctx.font='18px sans-serif';ctx.textAlign='center';ctx.fillText('Paused · resume whenever you like',W/2,H/2);}
  }
  function stop(callExit) { active=false;cancelAnimationFrame(raf);window.removeEventListener('keydown',keys);if(host)host.removeEventListener('click',actions);if(canvas){canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);}const cb=onExit;onExit=null;if(callExit&&cb)cb(); }
  window.Tideweave={start,stop};
})();
