/* BLEUMING.EXE: GLITCH//GIRL — authored Pixel Plaza platform adventure. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.GlitchAdventure = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  const WIDTH = 1980;
  const HEIGHT = 480;
  const PLAYER = { width: 22, height: 32, speed: 3.45, gravity: 0.52, jump: -10.7 };
  const COLLECTIBLES = [
    { id: 'plaza-star', x: 236, y: 335, name: 'Plaza star', secret: false },
    { id: 'arcade-ticket', x: 560, y: 390, name: 'Arcade ticket', secret: false },
    { id: 'echo-flower', x: 738, y: 278, name: 'Echo flower', secret: false },
    { id: 'memory-shard', x: 990, y: 292, name: 'Memory shard', secret: true },
    { id: 'sky-sticker', x: 1576, y: 310, name: 'Sky sticker', secret: false }
  ];

  function createRun(saved, options) {
    const data = saved && typeof saved === 'object' ? saved : {};
    const replay = !!(options && options.replay);
    const checkpoint = replay ? 0 : [0, 850, 1290].includes(data.checkpoint) ? data.checkpoint : 0;
    const collected = Array.isArray(data.collected) ? [...new Set(data.collected.filter(id => COLLECTIBLES.some(item => item.id === id)))] : [];
    const solved = replay ? {} : Object.assign({}, data.solved && typeof data.solved === 'object' ? data.solved : {});
    return {
      x: checkpoint, y: 388, vx: 0, vy: 0, grounded: false, coyoteMs: 0, jumpBufferMs: 0, jumpHeld: false,
      reality: 'normal', checkpoint, collected, solved, gateOpen: !replay && !!data.gateOpen,
      replay: replay || !!data.completed,
      encounterChoice: replay ? '' : (typeof data.encounterChoice === 'string' ? data.encounterChoice : ''),
      completed: !!data.completed, bestSeconds: Number.isFinite(data.bestSeconds) ? data.bestSeconds : null,
      timeMs: 0, cameraX: 0, encounterDone: replay ? false : !!data.encounterChoice,
      toast: 'Pixel Plaza: reach the flickering sign. Press Q to shift reality.', toastMs: 4800,
      nihiMood: 'curious', nihiLine: replay || data.completed ? 'The sign changed its colors while you were gone. Let’s try another route.' : 'This street has two versions. I can hear the other one humming.',
      hintsShown: {},
      lastPuzzleAt: 0, resetting: false, ending: false, paused: false, shiftFlash: 0, shiftTint: '#89fff2'
    };
  }

  function platform(id, x, y, w, h, phase, needsGate) { return { id, x, y, w, h, phase: phase || 'both', needsGate: !!needsGate }; }
  const STATIC_PLATFORMS = [
    platform('plaza-floor-a', 0, 420, 270, 60),
    platform('plaza-floor-b', 480, 420, 200, 60),
    platform('plaza-floor-c', 840, 420, 270, 60),
    platform('plaza-floor-d', 1290, 420, 170, 60),
    platform('plaza-floor-e', 1640, 420, 340, 60),
    platform('glitch-bridge', 286, 372, 119, 14, 'glitch'),
    platform('elevator-normal', 610, 365, 104, 16, 'normal'),
    platform('elevator-glitch', 610, 314, 104, 16, 'glitch'),
    platform('terminal-bridge', 1107, 372, 190, 14, 'glitch', true),
    platform('skywalk', 1488, 350, 160, 14, 'glitch', true),
    platform('route-boundary', 1460, 402, 182, 18, 'both', true),
    platform('route-redirect', 1460, 392, 182, 18, 'glitch', true)
  ];
  const BARRIERS = [ { id: 'reality-gate', x: 780, y: 220, w: 22, h: 200, phase: 'normal' } ];

  function activePlatforms(run) {
    return STATIC_PLATFORMS.filter(item => {
      if (item.id === 'route-boundary' && run.encounterChoice !== 'boundary') return false;
      if (item.id === 'route-redirect' && run.encounterChoice !== 'redirect') return false;
      if (item.id === 'skywalk' && run.encounterChoice !== 'ask') return false;
      return (item.phase === 'both' || item.phase === run.reality) && (!item.needsGate || run.gateOpen);
    });
  }
  function activeBarriers(run) { return BARRIERS.filter(item => item.phase === run.reality); }
  function realityCanSupport(run, x, y) {
    return activePlatforms(run).some(p => x + PLAYER.width > p.x && x < p.x + p.w && Math.abs(y + PLAYER.height - p.y) < 5);
  }
  function setToast(run, message, duration) { run.toast = message; run.toastMs = duration || 2400; }
  function shift(run) {
    const oldReality = run.reality;
    run.reality = oldReality === 'normal' ? 'glitch' : 'normal';
    run.shiftFlash = 230;
    run.shiftTint = run.reality === 'glitch' ? '#89fff2' : '#f7a7ef';
    if (run.grounded) {
      const oldSupport = STATIC_PLATFORMS.find(p => (p.id === 'elevator-normal' || p.id === 'elevator-glitch') && run.x + PLAYER.width > p.x && run.x < p.x + p.w && Math.abs(run.y + PLAYER.height - p.y) < 5);
      if (oldSupport && oldSupport.phase !== run.reality) {
        const newSupport = STATIC_PLATFORMS.find(p => p.id === (run.reality === 'glitch' ? 'elevator-glitch' : 'elevator-normal'));
        run.y = newSupport.y - PLAYER.height;
      }
    }
    setToast(run, `${run.reality.toUpperCase()} reality — the geometry changed.`, 1650);
    run.nihiMood = 'excited';
    return run.reality;
  }

  function near(run, targetX, range) { return Math.abs(run.x + PLAYER.width / 2 - targetX) <= (range || 58); }
  function nearbyInteraction(run) {
    if (!run.gateOpen && near(run, 1080)) return 'terminal';
    if (!run.encounterDone && near(run, 1458)) return 'encounter';
    if (near(run, 1880)) return 'portal';
    return '';
  }
  function interact(run) {
    const target = nearbyInteraction(run);
    if (target === 'terminal') {
      run.gateOpen = true;
      run.solved.terminal = true;
      setToast(run, 'ARCADE ROUTER ONLINE. Shift to GLITCH to reveal its bridge.', 3800);
      run.nihiMood = 'happy';
      run.nihiLine = 'The router remembers the old shortcut. The bridge is only visible in GLITCH.';
      return { type: 'terminal', message: run.toast };
    }
    if (target === 'encounter') return { type: 'encounter' };
    if (target === 'portal') return { type: 'portal' };
    return null;
  }
  const ENCOUNTER_CHOICES = {
    boundary: { route: 'plaza', line: 'Mira looks at Rae, then the room. “You’re right. Let’s leave comments about bodies out of it.” The plaza route opens.' },
    ask: { route: 'skywalk', line: 'Rae asks for the quieter arcade skywalk. Mira steps aside, and the hidden route appears in GLITCH.' },
    redirect: { route: 'arcade', line: 'Rae asks for a subject change. Mira follows their lead and hands over a spare arcade ticket.' }
  };
  function chooseEncounter(run, choiceId) {
    const result = ENCOUNTER_CHOICES[choiceId];
    if (!result || run.encounterDone) return null;
    run.encounterChoice = choiceId;
    run.encounterDone = true;
    run.solved.encounter = true;
    run.gateOpen = true;
    if (choiceId === 'redirect' && !run.collected.includes('arcade-ticket')) run.collected.push('arcade-ticket');
    setToast(run, result.line, 5000);
    run.nihiLine = choiceId === 'ask' ? 'Rae picked the skywalk. It is a good route.' : 'The room feels different now. Let’s see what opens.';
    run.nihiMood = 'supportive';
    return result;
  }
  function hint(run) {
    let id, line;
    if (run.timeMs < 5000) { id='wait';line='Take a moment to look around first. Ask me again whenever you want a hint.'; }
    else if (run.x < 430 && !run.solved.bridge) { id='bridge';line='The missing street has another shape. Press Q to make the GLITCH bridge solid.'; }
    else if (run.x < 870 && !run.solved.lift) { id='lift';line='The lift climbs in GLITCH. The tall firewall only blocks the NORMAL street.'; }
    else if (run.x < 1300 && !run.solved.router) { id='router';line=run.gateOpen?(run.reality==='glitch'?'The router bridge is visible in this reality. Jump from the lit terminal path.':'The router bridge is in GLITCH. Shift, then jump onto it.'):'The arcade router is near that blinking terminal. Press E there, then shift if the bridge is not visible.'; }
    else if (!run.encounterDone) { id='encounter';line='Mira and Rae are near the arcade entrance. Press E when you get close.'; }
    else { id='portal';line='Follow the lit plaza path to the portal at the far end.'; }
    run.hintsShown[id]=(run.hintsShown[id]||0)+1;run.nihiMood='curious';run.nihiLine=line;setToast(run,`NIHI HINT · ${line}`,4200);
    return {id,line};
  }
  function collectNearby(run) {
    const found = [];
    for (const item of COLLECTIBLES) {
      if (run.collected.includes(item.id)) continue;
      const dx = run.x + PLAYER.width / 2 - item.x;
      const dy = run.y + PLAYER.height / 2 - item.y;
      if (Math.hypot(dx, dy) < 25) {
        run.collected.push(item.id); found.push(item);
        run.nihiMood = 'happy';
        run.nihiLine = item.secret ? 'A hidden memory shard! The gallery has a new piece.' : `${item.name}! I’m putting it somewhere safe.`;
        setToast(run, item.secret ? 'SECRET FOUND — Memory shard added to your gallery.' : `${item.name} collected.`, 2500);
      }
    }
    return found;
  }
  function solveByProgress(run) {
    const events=[];
    if (run.x > 420 && !run.solved.bridge) { run.solved.bridge = true; setToast(run, 'PUZZLE 1 CLEAR — the shifted bridge carried you across.', 2300);run.nihiMood='happy';run.nihiLine='The street was there after all. Nice timing on that shift.';events.push('bridge'); }
    if (run.x > 870 && !run.solved.lift) { run.solved.lift = true; setToast(run, 'PUZZLE 2 CLEAR — the arcade lift changed height with reality.', 2600);run.nihiMood='excited';run.nihiLine='The lift changed with the world. I knew it was listening.';events.push('lift'); }
    if (run.x > 1300 && run.gateOpen && !run.solved.router) { run.solved.router = true; setToast(run, 'PUZZLE 3 CLEAR — the router bridge is open.', 2500);run.nihiMood='happy';run.nihiLine='Router bridge restored. The plaza is starting to remember.';events.push('router'); }
    if (run.x > 1650 && run.encounterDone && run.encounterChoice === 'ask' && !run.solved.skywalk) { run.solved.skywalk = true; events.push('skywalk'); }
    return events;
  }
  function respawn(run) {
    run.x = run.checkpoint; run.y = 388; run.vx = 0; run.vy = 0; run.grounded = false;
    run.coyoteMs = 0; run.jumpBufferMs = 0; run.jumpHeld = false; run.reality = 'normal'; run.nihiMood = 'concerned';
    run.nihiLine = 'Back at the last signal post. We can try that jump again.';
    setToast(run, 'Signal post restored. Collected keepsakes are safe.', 3000);
    return { type: 'respawn' };
  }
  function update(run, input, dt) {
    if (!run || run.paused || run.ending) return [];
    const events = [];
    const frame = Math.min(2, Math.max(0, dt / 16.667));
    const ms = Math.min(50, Math.max(0, dt));
    run.timeMs += ms;
    run.toastMs = Math.max(0, run.toastMs - ms);
    run.shiftFlash = Math.max(0, run.shiftFlash - ms);
    if (input.shift) { shift(run); events.push({ type: 'shift', reality: run.reality }); }
    if (input.hint) events.push({ type: 'hint', ...hint(run) });
    if (input.interact) { const event = interact(run); if (event) events.push(event); }
    if (input.choice) { const choice = chooseEncounter(run, input.choice); if (choice) events.push({ type: 'choice', choice: input.choice, route: choice.route }); }
    if (input.jump && !run.jumpHeld) run.jumpBufferMs = 115;
    else run.jumpBufferMs = Math.max(0, run.jumpBufferMs - ms);
    run.jumpHeld = !!input.jump;

    const direction = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    run.vx = direction * PLAYER.speed * frame;
    const nextX = Math.max(0, Math.min(WIDTH - PLAYER.width, run.x + run.vx));
    const hitsBarrier = activeBarriers(run).some(w => nextX + PLAYER.width > w.x && nextX < w.x + w.w && run.y + PLAYER.height > w.y && run.y < w.y + w.h);
    run.x = hitsBarrier ? run.x : nextX;
    run.coyoteMs = run.grounded ? 105 : Math.max(0, run.coyoteMs - ms);
    if (run.jumpBufferMs > 0 && run.coyoteMs > 0) {
      run.vy = PLAYER.jump; run.grounded = false; run.coyoteMs = 0; run.jumpBufferMs = 0; events.push({ type: 'jump' });
    }
    const oldBottom = run.y + PLAYER.height;
    run.vy = Math.min(13, run.vy + PLAYER.gravity * frame);
    run.y += run.vy * frame;
    run.grounded = false;
    if (run.vy >= 0) {
      for (const p of activePlatforms(run)) {
        const overlap = run.x + PLAYER.width > p.x && run.x < p.x + p.w;
        if (overlap && oldBottom <= p.y + 4 && run.y + PLAYER.height >= p.y) {
          run.y = p.y - PLAYER.height; run.vy = 0; run.grounded = true; break;
        }
      }
    }
    if (run.y > HEIGHT + 32) events.push(respawn(run));
    const found = collectNearby(run);
    found.forEach(item => events.push({ type: 'collect', item }));
    if (run.x > 850 && run.checkpoint < 850) { run.checkpoint = 850; events.push({ type: 'checkpoint', x: 850 }); setToast(run, 'Checkpoint saved at the arcade entrance.', 2600); }
    if (run.x > 1290 && run.checkpoint < 1290) { run.checkpoint = 1290; events.push({ type: 'checkpoint', x: 1290 }); setToast(run, 'Checkpoint saved at the signal router.', 2600); }
    solveByProgress(run).forEach(puzzle=>events.push({type:'puzzle',puzzle}));
    run.cameraX = Math.max(0, Math.min(WIDTH - 640, run.x - 640 * 0.36));
    if (run.x > 1905 && run.encounterDone && run.gateOpen) { run.ending = true; run.completed = true; run.bestSeconds = run.bestSeconds === null ? Math.floor(run.timeMs / 1000) : Math.min(run.bestSeconds, Math.floor(run.timeMs / 1000));run.nihiMood='excited';run.nihiLine='Pixel Plaza is back in tune. That was a very good adventure.'; events.push({ type: 'complete', seconds: Math.floor(run.timeMs / 1000) }); }
    return events;
  }

  function draw(ctx, run, options) {
    if (!ctx || !run) return;
    const reduced = !!(options && options.reducedMotion);
    const t = reduced ? 0 : run.timeMs / 1000;
    const reality = run.reality;
    const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    if (reality === 'glitch') { sky.addColorStop(0, '#242052'); sky.addColorStop(.66, '#673c9a'); sky.addColorStop(1, '#f18abd'); }
    else { sky.addColorStop(0, '#34275f'); sky.addColorStop(.65, '#583b89'); sky.addColorStop(1, '#25214d'); }
    ctx.fillStyle = sky; ctx.fillRect(0, 0, 640, HEIGHT);
    // Distant pixel skyline and sign glow.
    for (let i = 0; i < 17; i++) {
      const x = ((i * 151 - run.cameraX * .18) % 760 + 760) % 760 - 70;
      const h = 72 + (i * 29 % 92);
      ctx.fillStyle = i % 2 ? '#40336d' : '#4b3375'; ctx.fillRect(x, 318 - h, 72, h + 105);
      ctx.fillStyle = i % 3 ? '#7b5aaa' : '#db72bc';
      for (let wy = 0; wy < h; wy += 20) for (let wx = 8; wx < 64; wx += 17) if ((i + wy + wx) % 3) ctx.fillRect(x + wx, 330 - h + wy, 5, 8);
    }
    ctx.fillStyle = '#ffcbf4'; ctx.font = '10px monospace'; ctx.fillText(run.replay ? 'WELCOME BACK' : 'PIXEL PLAZA', 28, 63);
    ctx.fillStyle = '#81edf1'; ctx.fillRect(36, 74, 48, 4); ctx.fillRect(40, 82, 40, 2);
    ctx.save(); ctx.translate(-Math.round(run.cameraX), 0);
    const platforms = activePlatforms(run);
    for (const p of platforms) {
      const hiddenRoute = p.id === 'skywalk';
      ctx.fillStyle = p.phase === 'glitch' ? (reality === 'glitch' ? '#75f3ee' : '#574478') : '#413563';
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = p.phase === 'glitch' ? '#f7a7ef' : '#f5b7dc'; ctx.fillRect(p.x, p.y, p.w, 3);
      for (let px = p.x + 5; px < p.x + p.w - 3; px += 13) { ctx.fillStyle = '#fff4f2'; ctx.fillRect(px, p.y + 6, 4, 2); }
      if (hiddenRoute && reality !== 'glitch') ctx.globalAlpha = .35;
    }
    for (const wall of activeBarriers(run)) {
      ctx.fillStyle = '#ff77bd'; ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
      ctx.fillStyle = '#ffe2fa'; for (let y = wall.y + 5; y < wall.y + wall.h; y += 15) ctx.fillRect(wall.x + 6, y, 10, 4);
    }
    ctx.globalAlpha = 1;
    // Pixel Plaza awnings.
    for (const shop of [{ x: 115, label: 'BYTE BOUTIQUE', c: '#ef88be' }, { x: 465, label: 'SAVE POINT', c: '#7de2e5' }, { x: 890, label: 'MEMORY ARCADE', c: '#be8bfc' }, { x: 1295, label: 'PIXEL CAFE', c: '#ffcf78' }]) {
      ctx.fillStyle = '#211d45'; ctx.fillRect(shop.x, 377, 92, 42); ctx.fillStyle = shop.c; ctx.fillRect(shop.x - 4, 370, 100, 12); ctx.fillStyle = '#fff4f2'; ctx.font = '6px monospace'; ctx.fillText(shop.label, shop.x + 3, 396); ctx.fillStyle = '#7770a6'; ctx.fillRect(shop.x + 12, 403, 20, 16); ctx.fillRect(shop.x + 54, 403, 22, 16);
    }
    // Console and conversational encounter props.
    ctx.fillStyle = '#191731'; ctx.fillRect(1060, 378, 35, 42); ctx.fillStyle = run.gateOpen ? '#76ffe2' : '#ed8cff'; ctx.fillRect(1067, 385, 21, 10); ctx.fillStyle = '#fff'; ctx.fillRect(1071, 389, 3, 3); ctx.fillRect(1081, 389, 3, 3);
    if (!run.encounterDone) { drawPerson(ctx, 1442, 388, '#ff9bc9', '#55325f'); drawPerson(ctx, 1480, 388, '#98e8e9', '#343458'); }
    else { drawPerson(ctx, 1460, 388, run.encounterChoice === 'ask' ? '#98e8e9' : '#ffc6df', '#343458'); }
    // Portal, with encounter required to open it.
    ctx.fillStyle = '#211b49'; ctx.fillRect(1890, 342, 54, 78); ctx.fillStyle = run.encounterDone ? '#80f5e7' : '#8a739e'; ctx.fillRect(1897, 350, 40, 70); ctx.fillStyle = run.encounterDone ? '#ffd879' : '#514668'; ctx.fillRect(1906, 358, 22, 58);
    for (const item of COLLECTIBLES) if (!run.collected.includes(item.id)) {
      const bob = reduced ? 0 : Math.sin(t * 4 + item.x) * 3;
      ctx.fillStyle = item.secret ? '#f9dd74' : '#75f3ee'; ctx.fillRect(item.x - 7, item.y - 7 + bob, 14, 14); ctx.fillStyle = '#fff'; ctx.fillRect(item.x - 2, item.y - 5 + bob, 4, 4); ctx.fillStyle = '#45356c'; ctx.fillRect(item.x - 2, item.y + 1 + bob, 4, 4);
    }
    drawNihi(ctx, Math.max(run.x - 38, 8), run.y + 6, run.nihiMood, t, reduced);
    if (!reduced || Math.floor(t * 10) % 2 === 0) drawHero(ctx, run.x, run.y, run.vx);
    ctx.restore();
    // Reality indicator and subtle scanlines.
    ctx.fillStyle = reality === 'glitch' ? '#89fff2' : '#f2b3df'; ctx.fillRect(12, 91, reality === 'glitch' ? 114 : 102, 24);
    ctx.fillStyle = '#221b40'; ctx.font = 'bold 10px monospace'; ctx.fillText(reality === 'glitch' ? 'Q  GLITCH SHIFT' : 'Q  NORMAL SPACE', 18, 107);
    if (run.shiftFlash > 0 && !reduced) { ctx.fillStyle = run.shiftTint;ctx.globalAlpha=Math.min(.14,run.shiftFlash/1700);ctx.fillRect(0,0,640,HEIGHT);ctx.globalAlpha=1; }
    if (!reduced) { ctx.fillStyle = 'rgba(12,8,28,.13)'; for (let y = 0; y < HEIGHT; y += 5) ctx.fillRect(0, y, 640, 1); }
  }
  function drawHero(ctx, x, y, vx) {
    ctx.fillStyle = '#211b37'; ctx.fillRect(Math.round(x + 2), Math.round(y + 2), 18, 29);
    ctx.fillStyle = '#ffd8c9'; ctx.fillRect(Math.round(x + 5), Math.round(y + 4), 13, 11);
    ctx.fillStyle = '#38284c'; ctx.fillRect(Math.round(x + (vx < 0 ? 7 : 13)), Math.round(y + 8), 2, 2);
    ctx.fillStyle = '#ff7fbc'; ctx.fillRect(Math.round(x + 3), Math.round(y + 16), 17, 11);
    ctx.fillStyle = '#7de5e6'; ctx.fillRect(Math.round(x + 4), Math.round(y + 27), 6, 5); ctx.fillRect(Math.round(x + 14), Math.round(y + 27), 6, 5);
    ctx.fillStyle = '#ffd879'; ctx.fillRect(Math.round(x + 4), Math.round(y + 1), 5, 3); ctx.fillRect(Math.round(x + 10), Math.round(y), 7, 3);
  }
  function drawNihi(ctx, x, y, mood, t, reduced) {
    const bob = reduced ? 0 : Math.sin(t * 5) * 2;
    x = Math.round(x); y = Math.round(y + bob);
    ctx.fillStyle = '#251d48'; ctx.fillRect(x + 2, y + 5, 24, 21);
    ctx.fillStyle = mood === 'happy' || mood === 'excited' ? '#fff1aa' : '#f7e8ff'; ctx.fillRect(x + 4, y + 5, 20, 18);
    ctx.fillStyle = '#f7e8ff'; ctx.fillRect(x + 2, y + 1, 7, 7); ctx.fillRect(x + 19, y + 1, 7, 7);
    ctx.fillStyle = '#36234a'; ctx.fillRect(x + 8, y + 11, 3, 3); ctx.fillRect(x + 17, y + 11, 3, 3);
    ctx.fillStyle = '#d88bad'; ctx.fillRect(x + 13, y + 17, 3, 2);
    if (mood === 'excited') { ctx.fillStyle = '#fff3a1'; ctx.fillRect(x + 25, y + 3, 4, 4); }
  }
  function drawPerson(ctx, x, y, shirt, hair) {
    ctx.fillStyle = '#201b36'; ctx.fillRect(x + 2, y + 4, 20, 31);
    ctx.fillStyle = hair; ctx.fillRect(x + 4, y + 3, 15, 14);
    ctx.fillStyle = '#f5d5c5'; ctx.fillRect(x + 6, y + 6, 12, 11);
    ctx.fillStyle = '#332848'; ctx.fillRect(x + 8, y + 11, 2, 2); ctx.fillRect(x + 15, y + 11, 2, 2);
    ctx.fillStyle = shirt; ctx.fillRect(x + 3, y + 17, 18, 13); ctx.fillStyle = '#ead2fb'; ctx.fillRect(x + 4, y + 30, 6, 5); ctx.fillRect(x + 14, y + 30, 6, 5);
  }

  function gallery(saved) {
    const found = new Set(Array.isArray(saved && saved.collected) ? saved.collected : []);
    return COLLECTIBLES.map(item => ({ ...item, unlocked: found.has(item.id) }));
  }
  function canComplete(run) { return run.x > 1905 && run.encounterDone && run.gateOpen; }
  function snapshot(run) {
    return { checkpoint: run.checkpoint, collected: [...run.collected], solved: { ...run.solved }, gateOpen: run.gateOpen,
      encounterChoice: run.encounterChoice, completed: run.completed, bestSeconds: run.bestSeconds };
  }
  return { WIDTH, HEIGHT, PLAYER, COLLECTIBLES, ENCOUNTER_CHOICES, STATIC_PLATFORMS, BARRIERS, createRun, activePlatforms, activeBarriers, shift, nearbyInteraction,
    interact, chooseEncounter, hint, collectNearby, update, draw, gallery, canComplete, snapshot };
});
