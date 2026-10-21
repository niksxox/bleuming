/* MANYWAYS: Lens-controlled endless arcade game */
(function () {
  'use strict';
  const W = 720, H = 360;
  let frame = 0, raf = 0, active = false, paused = false, mode = 'flow';
  let canvas, ctx, host, onExit;
  const nodes = [], particles = [], connections = [], effects = [];
  let lens = { x: W/2, y: H/2, r: 42, rot: 0, vx: 0, vy: 0, locked: false };
  let pointerDown = false, pointerId = null, seed = 1, score = 0, time = 0;
  const keys = {};
  
  function rng() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
  
  function start(parent, exit, gameMode) {
    stop(false);
    host = parent; onExit = exit; mode = gameMode || 'flow';
    seed = Date.now() & 0xffff;
    frame = 0; time = 0; score = 0;
    nodes.length = 0; particles.length = 0; connections.length = 0; effects.length = 0;
    lens = { x: W/2, y: H/2, r: 42, rot: 0, vx: 0, vy: 0, locked: false };
    paused = false;
    
    generateLayout();
    
    host.innerHTML = `<div class="hub-eyebrow">ARCADE · MANYWAYS</div>
      <h2 class="hub-heading">One world. Many routes.</h2>
      <p class="hub-subtitle">Move the lens to change which paths connect. Guide light through the weave.</p>
      <canvas class="tideweave-canvas" width="720" height="360" tabindex="0" aria-label="Manyways lens arcade game"></canvas>
      <div class="tideweave-toolbar">
        <span id="manyways-info">Mode: ${mode} · Particles: ${particles.length}</span>
        <span>
          <button class="hub-card-button lavender" data-many="rotate">Rotate Lens</button>
          <button class="hub-card-button" data-many="pause">${paused ? 'Resume' : 'Pause'}</button>
          <button class="hub-card-button mint" data-many="exit">Leave</button>
        </span>
      </div>
      <p class="tideweave-hint">Mouse/Touch drag · Q/E rotate · Space pause · Explore many routes</p>`;
    
    canvas = host.querySelector('canvas');
    ctx = canvas.getContext('2d');
    canvas.setAttribute('tabindex', '0');
    
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: true });
    host.addEventListener('click', onActions);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.focus();
    active = true;
    tick();
  }
  
  function generateLayout() {
    nodes.length = 0;
    const count = mode === 'drift' ? 12 : mode === 'flow' ? 18 : 24;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + rng() * 0.3;
      const dist = 60 + rng() * 100;
      const typeRoll = rng();
      let type = 'bend';
      if (typeRoll < 0.35) type = 'bend';
      else if (typeRoll < 0.65) type = 'split';
      else type = 'bridge';
      nodes.push({
        x: W/2 + Math.cos(angle) * dist,
        y: H/2 + Math.sin(angle) * dist * 0.6,
        r: 10 + rng() * 4,
        type,
        angle: rng() * Math.PI * 2,
        rot: 0,
        rotVel: (rng() - 0.5) * 0.01
      });
    }
    
    // Create connections
    connections.length = 0;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d < 90 && rng() < 0.3) {
          connections.push({ a: i, b: j, active: false, base: d });
        }
      }
    }
    
    // Spawn particles
    particles.length = 0;
    const pcount = mode === 'drift' ? 1 : mode === 'flow' ? 2 : 3;
    for (let i = 0; i < pcount; i++) {
      if (nodes.length > 0) {
        particles.push({
          x: nodes[0].x + (rng()-0.5)*20,
          y: nodes[0].y + (rng()-0.5)*20,
          vx: 0, vy: 0,
          node: 0,
          target: -1,
          t: 0,
          color: i === 0 ? '#a9f1df' : i === 1 ? '#ff9fc8' : '#c2b3ff'
        });
      }
    }
  }
  
  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * W / rect.width,
      y: (e.clientY - rect.top) * H / rect.height
    };
  }
  
  function onPointerDown(e) {
    if (paused) return;
    e.preventDefault();
    pointerDown = true;
    pointerId = e.pointerId;
    try { canvas.setPointerCapture(e.pointerId); } catch(ex) {}
    const p = getPos(e);
    const dx = p.x - lens.x, dy = p.y - lens.y;
    if (dx*dx + dy*dy < (lens.r+10)*(lens.r+10)) {
      lens.locked = true;
    } else {
      lens.locked = false;
    }
  }
  
  function onPointerMove(e) {
    if (!pointerDown || paused) return;
    const p = getPos(e);
    if (!lens.locked) {
      lens.vx = (p.x - lens.x) * 0.3;
      lens.vy = (p.y - lens.y) * 0.3;
    }
  }
  
  function onPointerUp(e) {
    pointerDown = false;
    lens.locked = false;
    lens.vx *= 0.5;
    lens.vy *= 0.5;
  }
  
  function onWheel(e) {
    if (paused) return;
    lens.rot += e.deltaY > 0 ? 0.1 : -0.1;
  }
  
  function onActions(e) {
    const b = e.target.closest('[data-many]');
    if (!b) return;
    if (b.dataset.many === 'rotate') lens.rot += 0.3;
    if (b.dataset.many === 'pause') {
      paused = !paused;
      b.textContent = paused ? 'Resume' : 'Pause';
    }
    if (b.dataset.many === 'exit') stop(true);
  }
  
  function onKeyDown(e) {
    if (!active) return;
    keys[e.key.toLowerCase()] = true;
    if (e.key === ' ') {
      e.preventDefault();
      paused = !paused;
      const b = host.querySelector('[data-many="pause"]');
      if (b) b.textContent = paused ? 'Resume' : 'Pause';
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      paused = !paused;
      const b = host.querySelector('[data-many="pause"]');
      if (b) b.textContent = paused ? 'Resume' : 'Pause';
      return;
    }
    if (e.key === 'q') lens.rot -= 0.2;
    if (e.key === 'e') lens.rot += 0.2;
    if (e.key === 'r') {
      // regenerate layout
      generateLayout();
    }
  }
  
  function onKeyUp(e) {
    keys[e.key.toLowerCase()] = false;
  }
  
  function tick() {
    if (!active) return;
    if (!paused) {
      frame++;
      time++;
      update();
    }
    draw();
    raf = requestAnimationFrame(tick);
  }
  
  function update() {
    // Lens movement
    if (!lens.locked) {
      if (keys['arrowleft'] || keys['a']) lens.vx -= 0.8;
      if (keys['arrowright'] || keys['d']) lens.vx += 0.8;
      if (keys['arrowup'] || keys['w']) lens.vy -= 0.8;
      if (keys['arrowdown'] || keys['s']) lens.vy += 0.8;
      lens.x += lens.vx;
      lens.y += lens.vy;
      lens.vx *= 0.85;
      lens.vy *= 0.85;
      lens.x = Math.max(lens.r, Math.min(W - lens.r, lens.x));
      lens.y = Math.max(lens.r, Math.min(H - lens.r, lens.y));
    }
    
    // Update nodes
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].rot += nodes[i].rotVel;
    }
    
    // Update connections based on lens
    for (let c = 0; c < connections.length; c++) {
      const conn = connections[c];
      const na = nodes[conn.a], nb = nodes[conn.b];
      const mx = (na.x + nb.x)/2, my = (na.y + nb.y)/2;
      const dLens = Math.hypot(mx - lens.x, my - lens.y);
      const lensEffect = Math.max(0, 1 - dLens / (lens.r * 2.5));
      conn.active = lensEffect > 0.3 || rng() < 0.01; // some base connectivity
      // Rotate affects connectivity
      if (Math.abs((lens.rot % (Math.PI/2)) - (c % 4)*(Math.PI/8)) < 0.3) {
        conn.active = true;
      }
    }
    
    // Update particles
    for (let p = 0; p < particles.length; p++) {
      const part = particles[p];
      if (part.node >= 0 && part.node < nodes.length) {
        const node = nodes[part.node];
        // Find connected nodes
        const connected = [];
        for (let c = 0; c < connections.length; c++) {
          if (!connections[c].active) continue;
          if (connections[c].a === part.node) connected.push(connections[c].b);
          if (connections[c].b === part.node) connected.push(connections[c].a);
        }
        // Also consider lens proximity
        const dLens = Math.hypot(node.x - lens.x, node.y - lens.y);
        if (dLens < lens.r * 1.5 && connected.length > 0) {
          // Can move along active connection
          if (part.target < 0 || Math.hypot(part.x - nodes[part.target].x, part.y - nodes[part.target].y) < 3) {
            // Pick next target
            if (connected.length > 0) {
              const nextIdx = connected[Math.floor(rng() * connected.length)];
              if (nextIdx !== part.node) {
                part.target = nextIdx;
                part.t = 0;
              }
            }
          }
          if (part.target >= 0 && part.target < nodes.length) {
            part.t += 0.08;
            if (part.t >= 1) {
              part.node = part.target;
              part.target = -1;
              part.t = 0;
              score++;
              // Add effect
              effects.push({ x: part.x, y: part.y, r: 0, maxR: 15, life: 1 });
            } else {
              const from = nodes[part.node];
              const to = nodes[part.target];
              part.x = from.x + (to.x - from.x) * part.t;
              part.y = from.y + (to.y - from.y) * part.t;
            }
          }
        } else {
          // Drift
          part.x += (Math.random()-0.5)*0.5;
          part.y += (Math.random()-0.5)*0.5;
        }
      }
    }
    
    // Update effects
    for (let e = effects.length - 1; e >= 0; e--) {
      effects[e].r += 0.5;
      effects[e].life -= 0.05;
      if (effects[e].life <= 0) effects.splice(e, 1);
    }
    
    // Update UI
    const info = host.querySelector('#manyways-info');
    if (info) info.textContent = `Mode: ${mode} · Particles: ${particles.length} · Score: ${score}`;
    
    // Occasionally add particles in higher modes
    if (mode !== 'drift' && frame % 600 === 0 && particles.length < (mode === 'flow' ? 4 : 6)) {
      if (nodes.length > 0) {
        particles.push({
          x: nodes[Math.floor(rng()*nodes.length)].x,
          y: nodes[Math.floor(rng()*nodes.length)].y,
          vx: 0, vy: 0,
          node: Math.floor(rng()*nodes.length),
          target: -1,
          t: 0,
          color: '#c2b3ff'
        });
      }
    }
  }
  
  function draw() {
    // Background
    ctx.fillStyle = '#0a0e1f';
    ctx.fillRect(0, 0, W, H);
    
    // Stars
    for (let i = 0; i < 40; i++) {
      const x = (i * 137 + frame * 0.05) % W;
      const y = (i * 73) % H;
      ctx.fillStyle = `rgba(200, 210, 255, ${0.3 + Math.sin(frame*0.01 + i)*0.2})`;
      ctx.fillRect(x, y, 1, 1);
    }
    
    // Connections
    for (let c = 0; c < connections.length; c++) {
      if (!connections[c].active) continue;
      const conn = connections[c];
      const na = nodes[conn.a], nb = nodes[conn.b];
      ctx.strokeStyle = 'rgba(169, 241, 223, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(na.x, na.y);
      ctx.lineTo(nb.x, nb.y);
      ctx.stroke();
      // Glow
      ctx.strokeStyle = 'rgba(169, 241, 223, 0.15)';
      ctx.lineWidth = 4;
      ctx.stroke();
    }
    
    // Nodes
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const dLens = Math.hypot(node.x - lens.x, node.y - lens.y);
      const glow = dLens < lens.r * 1.5 ? 0.8 : 0.4;
      
      ctx.save();
      ctx.translate(node.x, node.y);
      ctx.rotate(node.rot);
      
      if (node.type === 'bend') {
        ctx.strokeStyle = `rgba(255, 159, 200, ${glow})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, node.r, 0, Math.PI * 1.5);
        ctx.stroke();
      } else if (node.type === 'split') {
        ctx.strokeStyle = `rgba(194, 179, 255, ${glow})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-node.r, 0);
        ctx.lineTo(node.r * 0.3, -node.r * 0.6);
        ctx.moveTo(-node.r, 0);
        ctx.lineTo(node.r * 0.3, node.r * 0.6);
        ctx.stroke();
      } else if (node.type === 'bridge') {
        ctx.strokeStyle = `rgba(255, 226, 157, ${glow})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-node.r, 0);
        ctx.lineTo(node.r, 0);
        ctx.stroke();
      }
      
      ctx.restore();
      
      // Node core
      ctx.fillStyle = `rgba(220, 226, 255, ${glow})`;
      ctx.beginPath();
      ctx.arc(node.x, node.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Particles
    for (let p = 0; p < particles.length; p++) {
      const part = particles[p];
      ctx.fillStyle = part.color;
      ctx.beginPath();
      ctx.arc(part.x, part.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(part.x - 1, part.y - 1, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Effects
    for (let e = 0; e < effects.length; e++) {
      const eff = effects[e];
      ctx.strokeStyle = `rgba(169, 241, 223, ${eff.life})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(eff.x, eff.y, eff.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Lens
    ctx.save();
    ctx.translate(lens.x, lens.y);
    ctx.rotate(lens.rot);
    
    // Lens ring
    ctx.strokeStyle = 'rgba(169, 241, 223, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, lens.r, 0, Math.PI * 2);
    ctx.stroke();
    
    // Lens glow
    ctx.strokeStyle = 'rgba(169, 241, 223, 0.3)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, 0, lens.r + 2, 0, Math.PI * 2);
    ctx.stroke();
    
    // Lens crosshair
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-lens.r * 0.4, 0);
    ctx.lineTo(lens.r * 0.4, 0);
    ctx.moveTo(0, -lens.r * 0.4);
    ctx.lineTo(0, lens.r * 0.4);
    ctx.stroke();
    
    // Lens segments
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = 'rgba(255, 159, 200, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, lens.r * 0.7, i * Math.PI/2, i * Math.PI/2 + Math.PI/4);
      ctx.stroke();
    }
    
    ctx.restore();
    
    // Pause overlay
    if (paused) {
      ctx.fillStyle = 'rgba(10, 14, 32, 0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 24px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', W/2, H/2 - 10);
      ctx.font = '10px "Quicksand", sans-serif';
      ctx.fillText('Press Space or Resume to continue', W/2, H/2 + 15);
    }
  }
  
  function stop(callExit) {
    active = false;
    cancelAnimationFrame(raf);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    if (canvas) {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
    }
    if (host) host.removeEventListener('click', onActions);
    const cb = onExit;
    onExit = null;
    if (callExit && cb) cb();
  }
  
  window.Manyways = { start, stop };
})();
