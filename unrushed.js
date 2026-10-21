/* The Unrushed World: a quiet, deterministic environmental puzzle. No bots, timers, streaks, or fail states. */
(function (root) {
  'use strict';
  const SAVE_KEY = 'bleuming_unrushed_v1';
  const COLS = 18, ROWS = 11, TILE = 32;
  const WALLS = [];
  for (let y = 1; y <= 9; y++) {
    if (y !== 5) WALLS.push([8, y]);
    if (y !== 3) WALLS.push([12, y]);
  }
  const GATES = [{x:8,y:5,phase:'flow'},{x:12,y:3,phase:'still'}];
  const FRAGMENTS = [{x:4,y:2,id:'first-light'},{x:10,y:8,id:'soft-glow'},{x:15,y:2,id:'far-star'}];
  const START = {x:2,y:8};
  const EXIT = {x:16,y:8};
  const WALL_SET = new Set(WALLS.map(([x,y])=>x+','+y));
  const GATE_MAP = new Map(GATES.map(g=>[g.x+','+g.y,g]));
  const FRAGMENT_MAP = new Map(FRAGMENTS.map(f=>[f.x+','+f.y,f]));
  const clamp = (n,min,max)=>Math.max(min,Math.min(max,n));
  function isBlocked(x,y,phase) {
    if(x<0||y<0||x>=COLS||y>=ROWS) return true;
    if(WALL_SET.has(x+','+y)) return true;
    const gate=GATE_MAP.get(x+','+y);
    return !!gate && gate.phase!==phase;
  }
  function createState(saved) {
    const state={x:START.x,y:START.y,phase:'still',collected:[],solved:false};
    try {
      const old=JSON.parse(saved||'null');
      if(old && Number.isInteger(old.x)&&Number.isInteger(old.y)&&old.x>=0&&old.x<COLS&&old.y>=0&&old.y<ROWS&&['still','flow'].includes(old.phase)) {
        state.x=old.x;state.y=old.y;state.phase=old.phase;
        state.collected=Array.isArray(old.collected)?old.collected.filter(id=>FRAGMENTS.some(f=>f.id===id)):[];
        state.solved=old.solved===true;
        if(isBlocked(state.x,state.y,state.phase)){state.x=START.x;state.y=START.y;state.phase='still';}
      }
    } catch (_) {}
    return state;
  }
  function move(state,dx,dy) {
    if(state.solved) return state;
    const x=state.x+dx,y=state.y+dy;
    if(!isBlocked(x,y,state.phase)){state.x=x;state.y=y;}
    const fragment=FRAGMENT_MAP.get(state.x+','+state.y);
    if(fragment&&!state.collected.includes(fragment.id))state.collected.push(fragment.id);
    if(state.x===EXIT.x&&state.y===EXIT.y&&state.collected.length===FRAGMENTS.length)state.solved=true;
    return state;
  }
  function shift(state) {
    if(state.solved)return state;
    const next=state.phase==='still'?'flow':'still';
    if(!isBlocked(state.x,state.y,next))state.phase=next;
    return state;
  }
  function reset() {return {x:START.x,y:START.y,phase:'still',collected:[],solved:false};}
  function render(target,onExit) {
    destroy();
    mount=target;exitCallback=onExit||null;
    const state=createState(root.localStorage?root.localStorage.getItem(SAVE_KEY):null);
    mount.innerHTML=`
      <section class="unrushed-shell">
        <div class="unrushed-topline"><div><div class="unrushed-eyebrow">A SMALL WORLD, AT YOUR PACE</div><h1>The Unrushed World</h1><p>Nothing is chasing you. Find three lights, change the world gently, and discover the way through.</p></div><button class="unrushed-exit" data-uw="exit">← Desktop</button></div>
        <div class="unrushed-stage">
          <div class="unrushed-stage-bar"><span id="uw-phase-label">STILL WORLD</span><span id="uw-fragment-count">LIGHTS 0 / 3</span></div>
          <canvas id="uw-canvas" width="576" height="352" tabindex="0" role="application" aria-label="The Unrushed World puzzle. Use arrow keys or WASD to move, and Space to shift the world."></canvas>
          <div class="unrushed-controls"><div class="uw-dpad" aria-label="Movement controls"><button data-move="0,-1" aria-label="Move up">↑</button><button data-move="-1,0" aria-label="Move left">←</button><button data-move="0,1" aria-label="Move down">↓</button><button data-move="1,0" aria-label="Move right">→</button></div><div class="uw-actions"><button class="uw-shift" data-uw="shift">✧ Shift world <kbd>SPACE</kbd></button><button data-uw="reset">Restart puzzle</button></div></div>
        </div>
        <div class="unrushed-bottom"><p id="uw-message" aria-live="polite">A bridge appears in the Flow World. Another listens to Stillness.</p><p>Move: arrows / WASD · Shift: Space · Reset: R</p></div>
        <div class="unrushed-end hidden" id="uw-ending"><div class="unrushed-eyebrow">YOU FOUND YOUR WAY</div><h2>Nothing had to be rushed.</h2><p>The path opened when you found your own rhythm. You can stay here, wander a little longer, or leave whenever you're ready.</p><div><button data-uw="continue">Wander again</button><button data-uw="exit">Return to desktop</button></div></div>
      </section>`;
    canvas=mount.querySelector('#uw-canvas');ctx=canvas.getContext('2d');gameState=state;running=true;
    canvas.addEventListener('click',focusCanvas);
    mount.addEventListener('click',handleClick);
    keyHandler=handleKey;root.addEventListener('keydown',keyHandler);
    draw();afterAction();canvas.focus({preventScroll:true});
  }
  let mount=null,canvas=null,ctx=null,gameState=null,exitCallback=null,keyHandler=null,running=false;
  function focusCanvas(){if(canvas)canvas.focus({preventScroll:true});}
  function save(){try{root.localStorage.setItem(SAVE_KEY,JSON.stringify(gameState));}catch(_){}}
  function handleKey(e){
    if(!running||!mount||!mount.isConnected)return;
    if(e.target&&e.target.closest&&e.target.closest('button,input,textarea,select'))return;
    const key=e.key.toLowerCase();
    const dirs={arrowup:[0,-1],w:[0,-1],arrowdown:[0,1],s:[0,1],arrowleft:[-1,0],a:[-1,0],arrowright:[1,0],d:[1,0]};
    if(dirs[key]){e.preventDefault();step(...dirs[key]);}
    else if(key===' '||key==='spacebar'){e.preventDefault();shift(gameState);afterAction();}
    else if(key==='r'){e.preventDefault();gameState=reset();afterAction('The puzzle is reset. Nothing lost—try another route.');}
    else if(key==='escape'){e.preventDefault();if(exitCallback)exitCallback();}
  }
  function handleClick(e){
    const btn=e.target.closest('[data-uw],[data-move]');
    if(!btn)return;
    if(btn.dataset.move){const [dx,dy]=btn.dataset.move.split(',').map(Number);step(dx,dy);focusCanvas();return;}
    if(btn.dataset.uw==='shift'){shift(gameState);afterAction();focusCanvas();}
    if(btn.dataset.uw==='reset'){gameState=reset();afterAction('The puzzle is reset. Nothing lost—try another route.');focusCanvas();}
    if(btn.dataset.uw==='continue'){gameState=reset();afterAction('A fresh little puzzle. There is no right pace.');focusCanvas();}
    if(btn.dataset.uw==='exit'&&exitCallback)exitCallback();
  }
  function step(dx,dy){if(!running)return;move(gameState,dx,dy);afterAction();focusCanvas();}
  function afterAction(customMessage){
    save();draw();
    const count=gameState.collected.length;
    const phase=gameState.phase==='still'?'STILL WORLD':'FLOW WORLD';
    const label=mount.querySelector('#uw-phase-label');if(label)label.textContent=phase;
    const counter=mount.querySelector('#uw-fragment-count');if(counter)counter.textContent='LIGHTS '+count+' / 3';
    const msg=mount.querySelector('#uw-message');
    if(msg)msg.textContent=customMessage||(gameState.solved?'You found all three lights. The path is open.':gameState.x===EXIT.x&&gameState.y===EXIT.y&&count<3?'The doorway is quiet for now. There are still lights to find.':count===3?'All three lights are with you. Find the open doorway.':gameState.phase==='flow'?'In Flow, the first bridge welcomes you.':'In Stillness, the second bridge opens. Try changing worlds when a path is closed.');
    const ending=mount.querySelector('#uw-ending');if(ending)ending.classList.toggle('hidden',!gameState.solved);
    if(gameState.solved&&canvas)canvas.setAttribute('aria-label','Puzzle complete. You can wander again or return to desktop.');
  }
  function draw(){
    if(!ctx||!gameState)return;
    const w=canvas.width,h=canvas.height;
    ctx.clearRect(0,0,w,h);
    const bg=ctx.createLinearGradient(0,0,w,h);
    if(gameState.phase==='still'){bg.addColorStop(0,'#20254d');bg.addColorStop(.55,'#45436f');bg.addColorStop(1,'#bd8bb5');}
    else {bg.addColorStop(0,'#123b57');bg.addColorStop(.55,'#397c91');bg.addColorStop(1,'#a8d9cf');}
    ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
    // A quiet star field with slow, nonessential twinkles.
    for(let i=0;i<44;i++){const x=(i*83+17)%w,y=(i*47+13)%h;ctx.globalAlpha=.22+((i%4)*.12);ctx.fillStyle=i%3===0?'#fff1bf':'#fff';ctx.fillRect(x,y,2,2);}
    ctx.globalAlpha=1;
    // Tile floor: softly patterned, with no flashing or urgent animation.
    for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
      const px=x*TILE,py=y*TILE;
      ctx.fillStyle=(x+y)%2===0?'rgba(255,255,255,.035)':'rgba(20,20,60,.05)';ctx.fillRect(px,py,TILE,TILE);
      ctx.strokeStyle='rgba(255,255,255,.055)';ctx.strokeRect(px+.5,py+.5,TILE-1,TILE-1);
    }
    // Static stone walls.
    for(const [x,y] of WALLS){ctx.fillStyle='#343454';ctx.fillRect(x*TILE+2,y*TILE+2,TILE-4,TILE-4);ctx.fillStyle='#6e6c98';ctx.fillRect(x*TILE+5,y*TILE+5,TILE-10,5);ctx.fillStyle='rgba(13,16,42,.45)';ctx.fillRect(x*TILE+5,y*TILE+14,TILE-10,12);}
    // Phase gates change actual collision and appearance.
    for(const gate of GATES){const open=gate.phase===gameState.phase;const x=gate.x*TILE,y=gate.y*TILE;
      ctx.fillStyle=open?'rgba(255,255,255,.10)':'rgba(255,226,177,.85)';ctx.fillRect(x+4,y+3,TILE-8,TILE-6);
      if(!open){ctx.fillStyle=gameState.phase==='still'?'#f6c8e4':'#bcecff';ctx.fillRect(x+8,y+5,TILE-16,TILE-10);ctx.fillStyle='#fff';ctx.fillRect(x+14,y+8,4,4);}
      else{ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.strokeRect(x+7,y+6,TILE-14,TILE-12);}
    }
    // Starting island and destination.
    ctx.fillStyle='#d7b9ee';ctx.fillRect(START.x*TILE+5,START.y*TILE+5,22,22);ctx.fillStyle='#fff0fb';ctx.fillRect(START.x*TILE+10,START.y*TILE+10,12,12);
    const ex=EXIT.x*TILE,ey=EXIT.y*TILE;
    ctx.fillStyle=gameState.collected.length===FRAGMENTS.length?'#ffe7a4':'rgba(255,231,164,.35)';ctx.fillRect(ex+3,ey+3,26,26);
    ctx.strokeStyle='#fff3c9';ctx.lineWidth=2;ctx.strokeRect(ex+7,ey+7,18,18);
    ctx.fillStyle='#493b69';ctx.font='bold 12px monospace';ctx.textAlign='center';ctx.fillText('↗',ex+16,ey+20);
    for(const f of FRAGMENTS){if(gameState.collected.includes(f.id))continue;const cx=f.x*TILE+16,cy=f.y*TILE+16;
      ctx.fillStyle='#fff0b2';ctx.beginPath();ctx.moveTo(cx,cy-10);ctx.lineTo(cx+4,cy-3);ctx.lineTo(cx+11,cy);ctx.lineTo(cx+4,cy+4);ctx.lineTo(cx,cy+11);ctx.lineTo(cx-4,cy+4);ctx.lineTo(cx-11,cy);ctx.lineTo(cx-4,cy-3);ctx.closePath();ctx.fill();
      ctx.fillStyle='#fff';ctx.fillRect(cx-2,cy-4,4,4);
    }
    // Player: simple original pixel character, no external assets required.
    const px=gameState.x*TILE,py=gameState.y*TILE;
    ctx.fillStyle='rgba(22,19,49,.25)';ctx.fillRect(px+7,py+25,19,4);
    ctx.fillStyle='#f7c5e2';ctx.fillRect(px+8,py+5,16,15);ctx.fillStyle='#5b426f';ctx.fillRect(px+9,py+7,14,9);
    ctx.fillStyle='#fff';ctx.fillRect(px+12,py+10,3,3);ctx.fillRect(px+18,py+10,3,3);
    ctx.fillStyle='#f5a9cf';ctx.fillRect(px+6,py+20,20,8);ctx.fillStyle='#fff0fb';ctx.fillRect(px+11,py+21,10,4);
    ctx.fillStyle='#ffe6ad';ctx.fillRect(px+17,py+2,4,4);
    ctx.textAlign='left';ctx.fillStyle='rgba(255,255,255,.82)';ctx.font='10px monospace';ctx.fillText(gameState.phase==='still'?'STILLNESS':'FLOW',10,16);
    if(gameState.solved){ctx.fillStyle='rgba(19,20,49,.38)';ctx.fillRect(0,0,w,h);ctx.fillStyle='#fff5d5';ctx.textAlign='center';ctx.font='bold 20px monospace';ctx.fillText('THE PATH IS OPEN',w/2,h/2);}
  }
  function destroy(){
    running=false;
    if(mount&&keyHandler)root.removeEventListener('keydown',keyHandler);
    if(mount)mount.removeEventListener('click',handleClick);
    if(canvas)canvas.removeEventListener('click',focusCanvas);
    mount=null;canvas=null;ctx=null;gameState=null;exitCallback=null;keyHandler=null;
  }
  root.UnrushedWorld={render,destroy,createState,move,shift,isBlocked,reset,constants:{COLS,ROWS,TILE,WALLS,GATES,FRAGMENTS,START,EXIT}};
  if(typeof module!=='undefined'&&module.exports)module.exports=root.UnrushedWorld;
})(typeof window!=='undefined'?window:globalThis);
