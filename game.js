/**
 * BLEUMING — Game Engine v3.0 (Art-Directed Indie Adventure)
 * Features:
 * - 16-bit Handcrafted Pixel Art Map Rendering with Blooming World States
 * - True Sprite Sheet Animations (Player 4-dir walk/idle, Nihi 5 states, in-world NPCs)
 * - Restrained Ambient Particles (Drifting petals, golden fireflies, ripple effects)
 * - Concise, Human Dialogue & Storybook Field Journal System
 */

// ============================================================================
// 1. CONSTANTS & CONFIGURATION
// ============================================================================
const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 480;

// Palettes
const PALETTE = {
  cream: '#FFF4DF',
  sage: '#9BBE91',
  forest: '#41694E',
  blush: '#F3A7C6',
  berry: '#D95D91',
  lavender: '#B7A7E8',
  blue: '#A9D6EF',
  outline: '#493044',
  gold: '#E9C878'
};

// ============================================================================
// 2. GAME STATE
// ============================================================================
const state = {
  screen: 'title', // 'title', 'playing', 'dialogue', 'modal', 'ending'
  player: {
    x: 270,
    y: 360,
    width: 20,
    height: 28,
    speed: 2.3,
    dir: 'down', // 'down', 'up', 'left', 'right'
    frame: 0,
    animTimer: 0,
    isMoving: false
  },
  nihi: {
    x: 295,
    y: 350,
    targetX: 295,
    targetY: 350,
    stateIndex: 0, // 0: Idle, 1: Happy, 2: Concerned, 3: Thoughtful, 4: Cheering
    frame: 0,
    animTimer: 0,
    floatAngle: 0
  },
  npcs: {
    saffron: { x: 122, y: 102, active: true },
    maya: { x: 508, y: 65, active: true }
  },
  keys: {
    up: false,
    down: false,
    left: false,
    right: false
  },
  inventory: {
    items: [] // ['dewdrop', 'chamomile', 'sunstone']
  },
  quests: {
    current: 'meet_nihi', // 'meet_nihi', 'collect_flora', 'mirror_pcos', 'postpartum_house', 'foggy_forest', 'all_complete'
    mirrorPcosDone: false,
    postpartumDone: false,
    forestDone: false,
    forestClearingAlpha: 0.0 // 0.0 to 1.0 (sunbeams fade in)
  },
  activeInteractable: null,
  ambientParticles: [],
  assetsLoaded: false
};

// ============================================================================
// 3. ASSET LOADER (Maps & Sprite Sheets)
// ============================================================================
const assets = {
  mapBase: new Image(),
  mapBloom: new Image(),
  playerSheet: new Image(),
  nihiSheet: new Image(),
  npcSheet: new Image()
};

let loadedCount = 0;
const totalAssets = 5;
let gameLoopStarted = false;

function isImageReady(image) {
  return image.complete && image.naturalWidth > 0;
}

function loadGameAssets(onComplete) {
  const completed = new Set();
  const checkDone = (img) => {
    if (completed.has(img)) return;
    completed.add(img);
    loadedCount++;
    if (loadedCount >= totalAssets) {
      state.assetsLoaded = true;
      if (onComplete) onComplete();
    }
  };

  [assets.mapBase,assets.mapBloom,assets.playerSheet,assets.nihiSheet,assets.npcSheet].forEach(function(img){
    img.onload = () => checkDone(img);
    img.onerror = () => { console.error('Bleuming asset failed; drawing procedural fallback:', img.src); checkDone(img); };
  });

  assets.mapBase.src = 'assets/map_base.png';
  assets.mapBloom.src = 'assets/map_blooming.png';
  assets.playerSheet.src = 'assets/player_sprites.png';
  assets.nihiSheet.src = 'assets/nihi_sprites.png';
  assets.npcSheet.src = 'assets/npc_sprites.png';
}

// In-world Collectibles
const floraCollectibles = [
  {
    id: 'dewdrop',
    name: 'Dewdrop Crystal',
    icon: '🌸',
    x: 95,
    y: 180,
    color: '#A9D6EF',
    collected: false,
    lore: 'A cool morning dewdrop. A gentle prompt to notice your physical sensations today.'
  },
  {
    id: 'chamomile',
    name: 'Calming Chamomile',
    icon: '🌿',
    x: 235,
    y: 330,
    color: '#FFF4DF',
    collected: false,
    lore: 'Wild sweet chamomile. Rest is a natural requirement for your body, not an award to earn.'
  },
  {
    id: 'sunstone',
    name: 'Sunstone Sprout',
    icon: '✨',
    x: 430,
    y: 200,
    color: '#F3A7C6',
    collected: false,
    lore: 'A warm blossom that shines regardless of how quiet the garden gets. You deserve unconditional care.'
  }
];

// Interactive Landmarks & Characters
const interactables = [
  {
    id: 'saffron',
    x: 110,
    y: 100,
    radius: 36,
    prompt: '[E] Talk to Saffron at the Mirror',
    onInteract: () => handleSaffronInteraction()
  },
  {
    id: 'maya',
    x: 512,
    y: 75,
    radius: 36,
    prompt: '[E] Visit Maya on the Cottage Porch',
    onInteract: () => handleMayaInteraction()
  },
  {
    id: 'forest',
    x: 580,
    y: 270,
    radius: 40,
    prompt: '[E] Step into the Misty Thicket',
    onInteract: () => handleForestInteraction()
  },
  {
    id: 'fountain',
    x: 300,
    y: 225,
    radius: 34,
    prompt: '[E] Listen to Fountain Ripples',
    onInteract: () => handleFountainInteraction()
  },
  {
    id: 'bench',
    x: 360,
    y: 185,
    radius: 28,
    prompt: '[E] Sit with Nihi',
    onInteract: () => handleBenchInteraction()
  }
];

// ============================================================================
// 4. CANVAS RENDERING ENGINE
// ============================================================================
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// Draw Player from Sprite Sheet
function drawPlayerSprite(px, py, dir, frame) {
  if (!isImageReady(assets.playerSheet)) { drawFallbackCharacter(px, py, '#F3A7C6', 'player'); return; }
  const dirRows = { down: 0, up: 1, left: 2, right: 3 };
  const row = dirRows[dir] || 0;
  const col = frame % 3;

  const sx = col * 24;
  const sy = row * 32;

  // Draw sprite from 72x128 sheet
  ctx.drawImage(
    assets.playerSheet,
    sx, sy, 24, 32,
    Math.round(px - 12), Math.round(py - 24), 24, 32
  );
}

// Draw Nihi from Sprite Sheet
function drawNihiSprite(nx, ny, stateIndex, frame, floatAngle) {
  if (!isImageReady(assets.nihiSheet)) { drawFallbackCharacter(nx, ny, '#B7A7E8', 'nihi'); return; }
  const bob = Math.sin(floatAngle) * 3;
  const col = frame % 2;
  const row = Math.min(4, Math.max(0, stateIndex));

  const sx = col * 32;
  const sy = row * 32;

  ctx.drawImage(
    assets.nihiSheet,
    sx, sy, 32, 32,
    Math.round(nx - 16), Math.round(ny - 20 + bob), 32, 32
  );
}

// Draw NPCs from Sprite Sheet
function drawNPCs() {
  const showSaffron=selectedJourneys.includes('pcos_pcod') || state.quests.current==='mirror_pcos';
  const showMaya=selectedJourneys.includes('postpartum') || state.quests.current==='postpartum_house';
  if (!showSaffron && !showMaya) return;
  if (!isImageReady(assets.npcSheet)) {
    if(showSaffron) drawFallbackCharacter(state.npcs.saffron.x, state.npcs.saffron.y, '#D95D91', 'S');
    if(showMaya) drawFallbackCharacter(state.npcs.maya.x, state.npcs.maya.y, '#A9D6EF', 'M');
    return;
  }
  // Saffron (x=0 to 32 on sheet)
  if(showSaffron) ctx.drawImage(assets.npcSheet, 0, 0, 32, 48, Math.round(state.npcs.saffron.x - 16), Math.round(state.npcs.saffron.y - 28), 32, 48);
  // Maya (x=32 to 64 on sheet)
  if(showMaya) ctx.drawImage(assets.npcSheet, 32, 0, 32, 48, Math.round(state.npcs.maya.x - 16), Math.round(state.npcs.maya.y - 28), 32, 48);
}

function drawFallbackCharacter(x, y, color, label) {
  ctx.fillStyle = '#493044'; ctx.fillRect(Math.round(x-8), Math.round(y-15), 16, 22);
  ctx.fillStyle = color; ctx.fillRect(Math.round(x-7), Math.round(y-14), 14, 20);
  ctx.fillStyle = '#FFF4DF'; ctx.fillRect(Math.round(x-5), Math.round(y-12), 3, 3); ctx.fillRect(Math.round(x+2), Math.round(y-12), 3, 3);
  ctx.fillStyle = '#493044'; ctx.font = '8px sans-serif'; ctx.fillText(label, Math.round(x-3), Math.round(y+2));
}

function drawFallbackGarden() {
  ctx.fillStyle='#9BBE91'; ctx.fillRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
  for(let y=5;y<CANVAS_HEIGHT;y+=12) for(let x=(y%24?4:10);x<CANVAS_WIDTH;x+=14){
    ctx.fillStyle=((x+y)%3===0)?'rgba(65,105,78,.16)':'rgba(255,244,223,.18)'; ctx.fillRect(x,y,2,2);
  }
  ctx.lineCap='round'; ctx.strokeStyle='#FFF0D5'; ctx.lineWidth=40;
  ctx.beginPath(); ctx.moveTo(95,130); ctx.lineTo(230,220); ctx.lineTo(340,220); ctx.lineTo(505,250); ctx.moveTo(280,220); ctx.lineTo(280,420); ctx.stroke();
  ctx.strokeStyle='#D9C5A8'; ctx.lineWidth=2; ctx.stroke();
  ctx.fillStyle='#91CFE0'; ctx.strokeStyle='#493044'; ctx.lineWidth=4;
  ctx.beginPath();ctx.ellipse(177,350,49,34,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.fillStyle='#B7A7E8';ctx.fillRect(70,78,56,40);ctx.fillStyle='#F3A7C6';ctx.beginPath();ctx.moveTo(64,78);ctx.lineTo(98,52);ctx.lineTo(132,78);ctx.fill();
  ctx.fillStyle='#493044';ctx.fillRect(276,206,48,38);ctx.fillStyle='#A9D6EF';ctx.beginPath();ctx.ellipse(300,220,18,10,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  [[40,80],[185,46],[398,70],[594,90],[54,268],[572,365],[420,421],[105,420]].forEach(([x,y])=>{
    ctx.fillStyle='#493044';ctx.fillRect(x-4,y+5,8,13);ctx.fillStyle='#41694E';ctx.beginPath();ctx.arc(x,y,22,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#9BBE91';ctx.fillRect(x-9,y-5,5,5);ctx.fillRect(x+5,y-12,5,5);
  });
  [[70,170],[390,175],[435,300],[245,390],[340,350],[520,210]].forEach(([x,y],i)=>{
    ctx.fillStyle=['#F3A7C6','#FFF4DF','#B7A7E8'][i%3];ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fill();
  });
}

// Draw Collectibles
function drawCollectibles() {
  const time = Date.now() * 0.005;
  floraCollectibles.forEach(item => {
    if (item.collected) return;
    const bob = Math.sin(time + item.x) * 3;

    // Soft aura
    ctx.fillStyle = 'rgba(255, 244, 223, 0.45)';
    ctx.beginPath();
    ctx.arc(item.x, item.y + bob, 12, 0, Math.PI * 2);
    ctx.fill();

    // Sprout circle
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.arc(item.x, item.y + bob, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.outline;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Glint
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(item.x - 2, item.y + bob - 3, 2, 2);
  });
}

// Subtle Ambient Particles: Drifting Cherry Blossoms & Golden Fireflies
function initAmbientParticles() {
  for (let i = 0; i < 24; i++) {
    state.ambientParticles.push({
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * CANVAS_HEIGHT,
      vx: -0.3 - Math.random() * 0.4,
      vy: 0.2 + Math.random() * 0.3,
      size: Math.random() > 0.4 ? 2.5 : 1.5,
      type: Math.random() > 0.35 ? 'petal' : 'firefly',
      phase: Math.random() * Math.PI * 2
    });
  }
}

function updateAndDrawAmbientParticles() {
  const time = Date.now() * 0.002;
  state.ambientParticles.forEach(p => {
    p.x += p.vx + Math.sin(time + p.phase) * 0.2;
    p.y += p.vy;

    if (p.x < -10) p.x = CANVAS_WIDTH + 10;
    if (p.y > CANVAS_HEIGHT + 10) p.y = -10;

    if (p.type === 'petal') {
      ctx.fillStyle = PALETTE.blush;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.size * 1.5, p.size, 0.4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Shimmering firefly / dust mote
      const glow = (Math.sin(time * 3 + p.phase) + 1) * 0.5;
      ctx.fillStyle = `rgba(233, 200, 120, ${0.4 + glow * 0.5})`;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
  });
}

// Restrained Woodland Light in the Forest Thicket (No white blobs!)
function drawForestThicketAtmosphere() {
  if (state.quests.forestDone) {
    // Sunbeams breaking through
    ctx.save();
    ctx.fillStyle = 'rgba(255, 244, 223, 0.12)';
    ctx.beginPath();
    ctx.moveTo(560, 0);
    ctx.lineTo(640, 0);
    ctx.lineTo(620, 480);
    ctx.lineTo(540, 480);
    ctx.fill();
    ctx.restore();
    return;
  }

  // Gentle woodland mist: subtle gradient & tiny soft sparkles (NOT giant white circles!)
  ctx.save();
  const grad = ctx.createLinearGradient(540, 0, 640, 0);
  grad.addColorStop(0, 'rgba(169, 214, 239, 0)');
  grad.addColorStop(0.5, 'rgba(183, 167, 232, 0.18)');
  grad.addColorStop(1, 'rgba(169, 214, 239, 0.35)');
  ctx.fillStyle = grad;
  ctx.fillRect(530, 180, 110, 240);
  ctx.restore();
}

// ============================================================================
// 5. COLLISION & MOVEMENT (Smooth Keyboard Movement)
// ============================================================================
function checkMapObstacle(x, y) {
  // Map boundary
  if (x < 42 || x > CANVAS_WIDTH - 42 || y < 50 || y > CANVAS_HEIGHT - 35) {
    return true;
  }

  // Saffron's Mirror Structure (x: 75 to 118, y: 70 to 110)
  if (x >= 75 && x <= 118 && y >= 70 && y <= 110) return true;

  // Pond Water (x: 132 to 228, y: 312 to 388)
  if (x >= 132 && x <= 228 && y >= 312 && y <= 388) return true;

  // Central Fountain Pedestal (x: 275 to 325, y: 205 to 238)
  if (x >= 275 && x <= 325 && y >= 205 && y <= 238) return true;

  // Cedar Bench (x: 345 to 378, y: 172 to 192)
  if (x >= 345 && x <= 378 && y >= 172 && y <= 192) return true;

  // Cottage Walls (x: 460 to 570, y: 40 to 92)
  if (x >= 460 && x <= 570 && y >= 40 && y <= 92) return true;

  // Trees clumps
  const treeTrunks = [
    [35, 45], [180, 42], [280, 45], [370, 50], [600, 50],
    [30, 140], [32, 230], [38, 340], [40, 440], [120, 460], [210, 465],
    [360, 460], [460, 455], [560, 460], [610, 140], [605, 400]
  ];
  for (const [tx, ty] of treeTrunks) {
    if (Math.hypot(x - tx, y - ty) < 18) return true;
  }

  return false;
}

function updatePlayerMovement() {
  if (state.screen !== 'playing') {
    state.player.isMoving = false;
    return;
  }

  let dx = 0;
  let dy = 0;

  if (state.keys.up) { dy -= state.player.speed; state.player.dir = 'up'; }
  if (state.keys.down) { dy += state.player.speed; state.player.dir = 'down'; }
  if (state.keys.left) { dx -= state.player.speed; state.player.dir = 'left'; }
  if (state.keys.right) { dx += state.player.speed; state.player.dir = 'right'; }

  if (dx !== 0 && dy !== 0) {
    dx *= 0.7071;
    dy *= 0.7071;
  }

  state.player.isMoving = (dx !== 0 || dy !== 0);

  if (state.player.isMoving) {
    state.player.animTimer++;
    if (state.player.animTimer % 16 === 0) {
      state.player.frame = (state.player.frame + 1) % 3;
      window.soundEngine.playFootstep();
    }

    // Horizontal check
    if (dx !== 0 && !checkMapObstacle(state.player.x + dx, state.player.y)) {
      state.player.x += dx;
    }
    // Vertical check
    if (dy !== 0 && !checkMapObstacle(state.player.x, state.player.y + dy)) {
      state.player.y += dy;
    }
  } else {
    state.player.frame = 0;
  }
}

// Nihi Companion Smooth Following Dynamics
function updateNihi() {
  state.nihi.floatAngle += 0.04;
  state.nihi.animTimer++;
  if (state.nihi.animTimer % 20 === 0) {
    state.nihi.frame = (state.nihi.frame + 1) % 2;
  }

  if (state.screen === 'playing') {
    let offsetX = -26;
    let offsetY = -6;
    if (state.player.dir === 'left') offsetX = 28;
    if (state.player.dir === 'right') offsetX = -28;
    if (state.player.dir === 'up') offsetY = 24;
    if (state.player.dir === 'down') offsetY = -24;

    state.nihi.targetX = state.player.x + offsetX;
    state.nihi.targetY = state.player.y + offsetY;

    const distX = state.nihi.targetX - state.nihi.x;
    const distY = state.nihi.targetY - state.nihi.y;
    const dist = Math.hypot(distX, distY);

    if (dist > 3) {
      state.nihi.x += distX * 0.09;
      state.nihi.y += distY * 0.09;
    }
  }
}

// Collectibles Check
function checkCollectibles() {
  floraCollectibles.forEach(item => {
    if (item.collected) return;
    if (Math.hypot(state.player.x - item.x, state.player.y - item.y) < 22) {
      item.collected = true;
      state.inventory.items.push(item);
      window.soundEngine.playPickup();
      updateInventoryHUD();
      showItemPickupDialogue(item);
    }
  });
}

// Proximity to Interactables
function updateInteractables() {
  let found = null;
  for (const obj of interactables) {
    if ((obj.id === 'saffron' && !selectedJourneys.includes('pcos_pcod') && state.quests.current!=='mirror_pcos')
      || (obj.id === 'maya' && !selectedJourneys.includes('postpartum') && state.quests.current!=='postpartum_house')
      || (obj.id === 'forest' && !selectedJourneys.includes('emotional_wellbeing') && state.quests.current!=='foggy_forest')) continue;
    if (Math.hypot(state.player.x - obj.x, state.player.y - obj.y) <= obj.radius) {
      found = obj;
      break;
    }
  }

  // Also check if near Nihi
  if (!found && Math.hypot(state.player.x - state.nihi.x, state.player.y - state.nihi.y) <= 32) {
    found = {
      id: 'nihi',
      prompt: '[E] Talk to Nihi',
      onInteract: () => handleNihiDirectDialogue()
    };
  }

  state.activeInteractable = found;

  const promptEl = document.getElementById('interaction-prompt');
  const promptText = document.getElementById('prompt-text');
  if (found && state.screen === 'playing') {
    promptEl.classList.remove('hidden');
    promptText.textContent = found.prompt.replace('[E] ', '');
  } else {
    promptEl.classList.add('hidden');
  }
}

// ============================================================================
// 6. DIALOGUE SYSTEM (Punchy, Human, Readable)
// ============================================================================
const dialogueEl = document.getElementById('dialogue-box');
const dialogueTextEl = document.getElementById('dialogue-text');
const dialogueChoicesEl = document.getElementById('dialogue-choices');
const speakerTagEl = document.getElementById('speaker-name');
const portraitImgEl = document.getElementById('dialogue-portrait-img');

function setDialoguePortrait(speaker, expression = 'happy') {
  if (speaker === 'Saffron') {
    portraitImgEl.src = 'assets/portrait_saffron.jpg';
  } else if (speaker === 'Maya') {
    portraitImgEl.src = 'assets/portrait_maya.jpg';
  } else if (expression === 'concerned') {
    portraitImgEl.src = 'assets/nihi_concerned.jpg';
  } else {
    portraitImgEl.src = 'assets/nihi_happy.jpg';
  }
}

function showDialogue(node, speaker = 'Nihi', expression = 'happy') {
  state.screen = 'dialogue';
  dialogueEl.classList.remove('hidden');
  speakerTagEl.textContent = speaker;
  setDialoguePortrait(speaker, expression);

  // Set Nihi's visual state to match
  if (expression === 'concerned') state.nihi.stateIndex = 2;
  else if (expression === 'thoughtful') state.nihi.stateIndex = 3;
  else state.nihi.stateIndex = 1;

  dialogueTextEl.textContent = node.text;
  dialogueChoicesEl.innerHTML = '';

  window.soundEngine.playDialogueBlip();

  if (node.choices && node.choices.length > 0) {
    node.choices.forEach(choice => {
      const btn = document.createElement('button');
      btn.className = 'dialogue-choice-btn';
      btn.textContent = choice.text;
      btn.onclick = () => {
        window.soundEngine.playSelect();
        if (choice.action) choice.action();
        if (choice.next) {
          showDialogue(choice.next, choice.speaker || speaker, choice.expression || expression);
        } else {
          closeDialogue();
        }
      };
      dialogueChoicesEl.appendChild(btn);
    });
  } else {
    const btn = document.createElement('button');
    btn.className = 'dialogue-choice-btn';
    btn.textContent = 'Continue 🌸';
    btn.onclick = () => {
      window.soundEngine.playSelect();
      if (node.onEnd) node.onEnd();
      closeDialogue();
    };
    dialogueChoicesEl.appendChild(btn);
  }
}

function closeDialogue() {
  dialogueEl.classList.add('hidden');
  state.screen = 'playing';
  state.nihi.stateIndex = 0; // Return to idle
  checkQuestProgressAfterDialogue();
}

function showItemPickupDialogue(item) {
  state.nihi.stateIndex = 1;
  showDialogue(
    {
      text: `You found the ${item.name}! "${item.lore}"`,
      choices: [
        {
          text: 'Place it into your pocket ✨',
          action: () => {
            if (state.inventory.items.length >= 3 && state.quests.current === 'collect_flora') {
              if(selectedJourneys.includes('pcos_pcod')) {
                state.quests.current = 'mirror_pcos';
                updateQuestHUD('Visit Saffron at the Mirror', 'Take your gathered finds to the northwest grove.');
              } else {
                state.quests.current = 'free_explore';
                updateQuestHUD('Garden Explorer', 'Wander, collect, and discover at your own pace.');
              }
            }
          }
        }
      ]
    },
    'Pocket Find',
    'happy'
  );
}

function startIntroDialogue() {
  showDialogue(
    {
      text: '"Hey there! You found me! The garden has been quiet and faded for a while. Will you walk with me and help listen to what it needs?"',
      choices: [
        {
          text: '"I\'d love to walk with you, Nihi."',
          expression: 'happy',
          next: {
            text: '"Wonderful! Let\'s start by gathering 3 little flora sprouts along the stone paths. They\'re scattered near the pond and corners."',
            choices: [
              {
                text: '"Let\'s go find them!"',
                action: () => {
                  state.quests.current = 'collect_flora';
                  updateQuestHUD('Find 3 Garden Flora', 'Search along the stone paths and pond edges.');
                }
              }
            ]
          }
        },
        {
          text: '"What happened to the flowers?"',
          expression: 'concerned',
          next: {
            text: '"People got so used to ignoring their own exhaustion. When we push through everything without resting, the flowers wilt too."',
            choices: [
              {
                text: '"That makes total sense. Let\'s explore."',
                action: () => {
                  state.quests.current = 'collect_flora';
                  updateQuestHUD('Find 3 Garden Flora', 'Search along the stone paths and pond edges.');
                }
              }
            ]
          }
        }
      ]
    },
    'Nihi',
    'happy'
  );
}

function handleNihiDirectDialogue() {
  if (state.quests.current === 'meet_nihi') {
    startIntroDialogue();
  } else if (state.quests.current === 'collect_flora') {
    showDialogue(
      {
        text: `"You've found ${state.inventory.items.length}/3 sprouts so far! Check near the stone paths and blue pond. Zero rush!"`,
        choices: [{ text: '"Got it, exploring now!"' }]
      },
      'Nihi',
      'happy'
    );
  } else if (state.quests.current === 'mirror_pcos') {
    showDialogue(
      {
        text: '"Saffron is waiting by the Shifting Mirror in the top-left grove. She looks like she could really use a friendly listener."',
        choices: [{ text: '"Let\'s visit Saffron."' }]
      },
      'Nihi',
      'happy'
    );
  } else if (state.quests.current === 'postpartum_house') {
    showDialogue(
      {
        text: '"Maya is over on the lavender cottage porch. She just put the baby down and looks completely exhausted."',
        choices: [{ text: '"Let\'s check in on Maya."' }]
      },
      'Nihi',
      'concerned'
    );
  } else if (state.quests.current === 'foggy_forest') {
    showDialogue(
      {
        text: '"The eastern thicket feels so hazy. My heart is beating a little fast... but we can do a calm grounding breath together."',
        choices: [{ text: '"We\'ve got this, Nihi."' }]
      },
      'Nihi',
      'concerned'
    );
  } else {
    showDialogue(
      {
        text: '"Look at the garden—it\'s in full bloom! Thanks for reminding everyone that you don\'t have to be like anyone else to deserve care."',
        choices: [{ text: '"I\'m so proud of our garden."' }]
      },
      'Nihi',
      'happy'
    );
  }
}

// ============================================================================
// 7. STORY INTERACTIONS (Saffron, Maya, Forest)
// ============================================================================
function handleSaffronInteraction() {
  if (state.quests.current === 'collect_flora') {
    showDialogue(
      {
        text: '"Hey there! The mirror is still dormant. Once we gather 3 healing flora sprouts, Saffron and the mirror will awaken!"',
        choices: [{ text: '"Right, let\'s finish collecting!"' }]
      },
      'Nihi',
      'thoughtful'
    );
    return;
  }

  if (state.quests.mirrorPcosDone) {
    showDialogue(
      {
        text: '"Look at the roses blooming around the mirror! Having my questions written down makes me feel so much calmer about my doctor visit. Check Chapter 1 in the Field Journal anytime!"',
        speaker: 'Saffron',
        choices: [
          { text: '📖 Open Field Journal', action: () => openJournalToChapter('ch-pcos') },
          { text: 'Smile warmly at Saffron 🌸' }
        ]
      },
      'Saffron',
      'happy'
    );
    return;
  }

  // Active PCOS Scene
  showDialogue(
    {
      text: '"Hey... sorry, I was just staring at this mirror. Some months my period skips, my skin breaks out, and I\'m exhausted by noon. Then people tell me to \'just drink spearmint tea\' and it makes me want to scream."',
      speaker: 'Saffron',
      choices: [
        {
      text: '"That advice sounds frustrating. You deserve to have your concerns heard."',
          expression: 'happy',
          next: {
            text: '"Exactly. Changes like these can have different causes, and I do not want to guess. I would like to write down what I have noticed and ask a healthcare professional."',
            speaker: 'Saffron',
            choices: [
              {
                text: '📖 Open Field Journal & Prepare Doctor Questions',
                action: () => {
                  completePcosQuest();
                  openJournalToChapter('ch-pcos');
                }
              }
            ]
          }
        },
        {
          text: '"It\'s completely valid to feel fed up when your body feels unpredictable."',
          expression: 'concerned',
          next: {
            text: '"Thank you. It feels so isolating when you are second-guessing your own body. Having clean questions ready makes a world of difference."',
            speaker: 'Saffron',
            choices: [
              {
                text: '📖 Save Questions to Field Journal',
                action: () => {
                  completePcosQuest();
                  openJournalToChapter('ch-pcos');
                }
              }
            ]
          }
        }
      ]
    },
    'Saffron',
    'concerned'
  );
}

function completePcosQuest() {
  state.quests.mirrorPcosDone = true;
  state.quests.current = selectedJourneys.includes('postpartum') ? 'postpartum_house'
    : selectedJourneys.includes('emotional_wellbeing') ? 'foggy_forest' : 'free_explore';
  state.nihi.stateIndex = 4; // Cheering!

  window.soundEngine.playBloomFanfare();
  updateQuestHUD(state.quests.current === 'postpartum_house' ? 'Visit Maya on the Cottage Porch' : 'Garden Explorer',
    state.quests.current === 'postpartum_house' ? 'Head northeast to the lavender cottage.' : 'Wander, collect, and discover at your own pace.');
}

function handleMayaInteraction() {
  if (state.quests.postpartumDone) {
    showDialogue(
      {
        text: '"A friend just dropped off dinner and watched the crib while I slept! Thank you for reminding me that asking for help protects both of us. Check Chapter 2 in the Field Journal anytime!"',
        speaker: 'Maya',
        choices: [
          { text: '📖 Open Field Journal', action: () => openJournalToChapter('ch-postpartum') },
          { text: 'Rest peacefully for a moment 💖' }
        ]
      },
      'Maya',
      'happy'
    );
    return;
  }

  // Active Postpartum Scene
  showDialogue(
    {
      text: '"Hi... shh, the baby just dozed off. Honestly? I\'m hanging on by a thread. Everyone tells me \'cherish every second!\', but I cried in the shower for an hour this morning. I felt so ashamed."',
      speaker: 'Maya',
      choices: [
        {
          text: '"Feeling this way does not make you a bad parent. You deserve support, and you can tell someone you trust how hard this feels."',
          expression: 'concerned',
          next: {
            text: '"Hearing that made my shoulders drop an inch. I was terrified that admitting this meant I was a bad mother. Friends text \'let me know if you need anything\', but I never know what to ask."',
            speaker: 'Maya',
            choices: [
              {
                text: '📖 Open Field Journal & Practical Delegation Board',
                action: () => {
                  completePostpartumQuest();
                  openJournalToChapter('ch-postpartum');
                }
              }
            ]
          }
        },
        {
          text: '"You are carrying an enormous physical & emotional weight alone. That is too much."',
          expression: 'happy',
          next: {
            text: '"It really is. Sleep deprivation makes every thought feel like an avalanche. Let\'s pick two real things someone can do for me today."',
            speaker: 'Maya',
            choices: [
              {
                text: '📖 Open Postpartum Care Guide in Journal',
                action: () => {
                  completePostpartumQuest();
                  openJournalToChapter('ch-postpartum');
                }
              }
            ]
          }
        }
      ]
    },
    'Maya',
    'concerned'
  );
}

function completePostpartumQuest() {
  state.quests.postpartumDone = true;
  state.quests.current = selectedJourneys.includes('emotional_wellbeing') ? 'foggy_forest' : 'free_explore';
  state.nihi.stateIndex = 4; // Cheering!

  window.soundEngine.playBloomFanfare();
  updateQuestHUD(state.quests.current === 'foggy_forest' ? 'Explore the Misty Thicket' : 'Garden Explorer',
    state.quests.current === 'foggy_forest' ? 'Head east to the woodland path.' : 'Wander, collect, and discover at your own pace.');
}

function handleForestInteraction() {
  if (state.quests.forestDone) {
    showDialogue(
      {
        text: '"Sunbeams are shining through the trees! The Heart Blossom is in full bloom. You can review the 5-4-3-2-1 grounding guide in Chapter 3 anytime!"',
        choices: [
          { text: '📖 Open Field Journal', action: () => openJournalToChapter('ch-grounding') },
          { text: 'Breathe the crisp woodland air 🌸' }
        ]
      },
      'Nihi',
      'happy'
    );
    return;
  }

  showDialogue(
    {
      text: '"Whoa... the path feels hazy. My chest feels tight and my head is spinning. Can we just stop moving for a second?"',
      choices: [
        {
          text: '"Take all the time you need, Nihi. We do not have to push through panic."',
          expression: 'concerned',
          next: {
            text: '"Phew... thank you. Let\'s do a simple 5-4-3-2-1 sensory grounding check together."',
            choices: [
              {
                text: '🌿 Begin Sensory Grounding Exercise',
                action: () => openGroundingModal()
              }
            ]
          }
        },
        {
          text: '"Feel your feet on the path. The fog is just passing weather."',
          expression: 'happy',
          next: {
            text: '"Yeah... passing weather. A slow breath will help center us."',
            choices: [
              {
                text: '🌿 Start Grounding & Breath',
                action: () => openGroundingModal()
              }
            ]
          }
        }
      ]
    },
    'Nihi',
    'concerned'
  );
}

// 5-4-3-2-1 Grounding Mini-Game
let groundingStep = 0;
const groundingSteps = [
  {
    title: 'Step 1: Notice 3 Soft Colors You Can See',
    hint: 'Click 3 pastel colors to anchor your eyes in the present.',
    targetTaps: 3,
    items: [
      { icon: '🌸', label: 'Pastel Pink' },
      { icon: '🌿', label: 'Sage Mint' },
      { icon: '✨', label: 'Sun Gold' },
      { icon: '💧', label: 'Baby Blue' }
    ]
  },
  {
    title: 'Step 2: Notice 2 Gentle Physical Sensations',
    hint: 'Tap 2 comforting physical feelings to re-enter your body.',
    targetTaps: 2,
    items: [
      { icon: '🍃', label: 'Cool Breeze' },
      { icon: '🧣', label: 'Warm Sweater' },
      { icon: '🪨', label: 'Solid Path' },
      { icon: '💖', label: 'Gentle Heartbeat' }
    ]
  },
  {
    title: 'Step 3: Acknowledge 1 Kind Thought for Yourself',
    hint: 'Pick the affirmation that feels safest right now.',
    targetTaps: 1,
    items: [
      { icon: '🕊️', label: '"I am safe right now."' },
      { icon: '🌱', label: '"I am allowed to rest."' },
      { icon: '⭐', label: '"I don\'t have to be perfect."' },
      { icon: '🌸', label: '"I deserve care."' }
    ]
  }
];

let currentStepTaps = 0;

function openGroundingModal() {
  state.screen = 'modal';
  const modal = document.getElementById('modal-grounding');
  modal.classList.remove('hidden');

  groundingStep = 0;
  loadGroundingStep(groundingStep);
}

function loadGroundingStep(stepIndex) {
  const step = groundingSteps[stepIndex];
  currentStepTaps = 0;

  document.getElementById('grounding-step-title').textContent = step.title;
  document.getElementById('grounding-instruction').textContent = step.hint;
  document.getElementById('btn-finish-grounding').classList.add('hidden');

  window.soundEngine.playGroundingBell(stepIndex + 1);

  const grid = document.getElementById('grounding-grid');
  grid.innerHTML = '';

  step.items.forEach(item => {
    const tile = document.createElement('div');
    tile.className = 'ground-tile';
    tile.innerHTML = `
      <span>${item.icon}</span>
      <span class="ground-tile-label">${item.label}</span>
    `;
    tile.onclick = () => {
      if (tile.classList.contains('tapped')) return;
      tile.classList.add('tapped');
      currentStepTaps++;
      window.soundEngine.playTone(400 + currentStepTaps * 120, 0.15, 'sine', 0.1);

      if (currentStepTaps >= step.targetTaps) {
        if (groundingStep < groundingSteps.length - 1) {
          setTimeout(() => {
            groundingStep++;
            loadGroundingStep(groundingStep);
          }, 600);
        } else {
          document.getElementById('grounding-instruction').textContent =
            'Look... your shoulders dropped, your breath is steady, and the mist is clearing.';
          document.getElementById('btn-finish-grounding').classList.remove('hidden');
        }
      }
    };
    grid.appendChild(tile);
  });
}

function completeGroundingQuest() {
  document.getElementById('modal-grounding').classList.add('hidden');
  state.quests.forestDone = true;
  state.quests.current = 'all_complete';
  state.nihi.stateIndex = 4; // Cheering!

  window.soundEngine.playBloomFanfare();

  showDialogue(
    {
      text: '"The mist cleared! When we paused and checked in with our senses, the panic couldn\'t hold on anymore. Look at the garden—it\'s completely glowing in full bloom!"',
      choices: [
        {
          text: '✨ Celebrate the Finale! ✨',
          action: () => triggerGameFinale()
        }
      ]
    },
    'Nihi',
    'happy'
  );
}

function handleFountainInteraction() {
  window.soundEngine.playTone(520, 0.4, 'sine', 0.08);
  showDialogue(
    {
      text: '"Water droplets sparkle against the stones. Water never rushes to be somewhere else. It is okay to move at your own natural pace."',
      choices: [{ text: '"That\'s really peaceful."' }]
    },
    'Garden Fountain',
    'happy'
  );
}

function handleBenchInteraction() {
  window.soundEngine.playGroundingBell(2);
  showDialogue(
    {
      text: '"You and Nihi sit quietly on the cedar bench. The scent of warm chamomile fills the air. There is nothing you have to prove right now. You are doing enough."',
      choices: [{ text: 'Breathe softly for a moment 💖' }]
    },
    'Cedar Bench',
    'happy'
  );
}

function triggerGameFinale() {
  state.screen = 'ending';
  document.getElementById('screen-milestone').classList.remove('hidden');
  window.soundEngine.playBloomFanfare();
}

// ============================================================================
// 8. FIELD JOURNAL CONTROLS (Illustrated Storybook Hub)
// ============================================================================
const chapterHeroData = {
  'ch-pcos': {
    src: 'assets/scene_mirror.jpg',
    caption: "Chapter 1: Saffron's Changing Mirror Grove"
  },
  'ch-postpartum': {
    src: 'assets/scene_nursery.jpg',
    caption: "Chapter 2: Maya's Cottage Porch & Nursery"
  },
  'ch-grounding': {
    src: 'assets/scene_forest.jpg',
    caption: 'Chapter 3: The Enchanted Woodland Path'
  },
  'ch-saved': {
    src: 'assets/ending_scene.jpg',
    caption: 'Chapter 4: Your Prepared Notes & Care Plan'
  }
};

function setupJournal() {
  const navBtns = document.querySelectorAll('.j-nav-btn');
  navBtns.forEach(btn => {
    btn.onclick = () => {
      window.soundEngine.playSelect();
      const chapterId = btn.dataset.chapter;
      openJournalToChapter(chapterId);
    };
  });

  document.getElementById('close-modal-journal').onclick = closeJournal;
  document.getElementById('btn-close-journal').onclick = closeJournal;
}

function openJournalToChapter(chapterId) {
  if ((chapterId === 'ch-pcos' && !selectedJourneys.includes('pcos_pcod'))
    || (chapterId === 'ch-postpartum' && !selectedJourneys.includes('postpartum'))
    || (chapterId === 'ch-grounding' && !selectedJourneys.includes('emotional_wellbeing'))) chapterId='ch-discoveries';
  state.screen = 'modal';
  const modal = document.getElementById('modal-journal');
  modal.classList.remove('hidden');

  // Update nav buttons
  document.querySelectorAll('.j-nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.chapter === chapterId);
  });

  // Update chapter panes
  document.querySelectorAll('.journal-chapter').forEach(c => {
    c.classList.toggle('active', c.id === chapterId);
  });

  // Update hero illustration
  const heroInfo = chapterHeroData[chapterId];
  if (heroInfo) {
    document.getElementById('journal-hero-img').src = heroInfo.src;
    document.getElementById('journal-hero-caption').textContent = heroInfo.caption;
  }
}

function toggleJournal() {
  window.soundEngine.playSelect();
  const modal = document.getElementById('modal-journal');
  if (modal.classList.contains('hidden')) {
    openJournalToChapter('ch-pcos');
  } else {
    closeJournal();
  }
}

function closeJournal() {
  document.getElementById('modal-journal').classList.add('hidden');
  if (state.screen === 'modal') state.screen = 'playing';
}

function updateQuestHUD(title, sub) {
  document.getElementById('hud-quest-title').textContent = title;
  document.getElementById('hud-quest-sub').textContent = sub;
}

function updateInventoryHUD() {
  for (let idx = 0; idx < 6; idx++) {
    const slot = document.getElementById(`slot-${idx}`);
    if (slot) {
      slot.textContent = '·';
      slot.classList.add('empty');
      slot.classList.remove('collected');
      slot.title = '';
    }
  }
  state.inventory.items.forEach((item, idx) => {
    const slot = document.getElementById(`slot-${idx}`);
    if (slot) {
      slot.textContent = item.icon;
      slot.classList.remove('empty');
      slot.classList.add('collected');
      slot.title = item.name;
    }
  });
}

function checkQuestProgressAfterDialogue() {
  if (state.quests.current === 'collect_flora' && state.inventory.items.length >= 3) {
    if(selectedJourneys.includes('pcos_pcod')) {
      state.quests.current = 'mirror_pcos';
      updateQuestHUD('Visit Saffron at the Mirror', 'Take your gathered finds to the northwest grove.');
    } else {
      state.quests.current = 'free_explore';
      updateQuestHUD('Garden Explorer', 'Wander, collect, and discover at your own pace.');
    }
  }
}

// ============================================================================
// 9. INPUT & EVENT LISTENERS
// ============================================================================
function setupInput() {
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (!document.getElementById('modal-journal').classList.contains('hidden')) {
        closeJournal();
        return;
      }
      if (!document.getElementById('modal-grounding').classList.contains('hidden')) {
        document.getElementById('modal-grounding').classList.add('hidden');
        state.screen = 'playing';
        return;
      }
      return;
    }

    if (e.key === 'j' || e.key === 'J') {
      if (window.BLEUMING_HUB_MODE) return;
      toggleJournal();
      return;
    }

    if (e.key === 'm' || e.key === 'M') {
      toggleMuteAudio();
      return;
    }

    if (state.screen === 'dialogue') {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'e' || e.key === 'E') {
        const choiceBtns = dialogueChoicesEl.querySelectorAll('.dialogue-choice-btn');
        if (choiceBtns.length === 1) {
          choiceBtns[0].click();
        }
      }
      return;
    }

    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') state.keys.up = true;
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') state.keys.down = true;
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') state.keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') state.keys.right = true;

    if (e.key === 'e' || e.key === 'E' || e.key === ' ' || e.key === 'Enter') {
      if (state.screen === 'playing' && state.activeInteractable) {
        state.activeInteractable.onInteract();
      }
    }
  });

  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') state.keys.up = false;
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') state.keys.down = false;
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') state.keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') state.keys.right = false;
  });

  // Title Buttons
  const startOrContinue = () => {
    window.soundEngine.ensureContext();
    window.soundEngine.playSelect();
    window.soundEngine.startBgm();
    if (!hasSavedJourney && !state.world.preferencesChosen) openJourneyScreen();
    else closeJourneyScreen();
  };
  document.getElementById('btn-start-game').onclick = startOrContinue;
  document.getElementById('btn-continue-game').onclick = startOrContinue;

  document.getElementById('btn-milestone-continue').onclick = () => {
    document.getElementById('screen-milestone').classList.add('hidden');
    state.screen = 'playing';
    updateQuestHUD('Free Exploration', 'The garden is in full bloom. Stroll peacefully.');
  };

  document.getElementById('btn-milestone-journal').onclick = () => {
    openJournalToChapter('ch-saved');
  };

  document.getElementById('btn-sound-toggle').onclick = toggleMuteAudio;
  document.getElementById('btn-journal-toggle').onclick = toggleJournal;
  const fullScreenButton=document.getElementById('btn-fullscreen');
  fullScreenButton.onclick=async()=>{
    try {
      if(document.fullscreenElement) await document.exitFullscreen();
      else await document.querySelector('.main-window').requestFullscreen();
    } catch(error){ console.error('Full screen is unavailable in this browser.',error); }
  };
  const prefsButton=document.getElementById('btn-journey-settings');
  if(prefsButton) prefsButton.onclick=openJourneyScreen;
  document.getElementById('btn-journey-preferences').onclick=openJourneyScreen;

  document.getElementById('btn-window-close').onclick = () => {
    window.soundEngine.playTone(300, 0.1);
    alert('Bleuming is running in cozy mode! You can continue strolling or resting anytime.');
  };

  document.getElementById('close-modal-grounding').onclick = () => {
    document.getElementById('modal-grounding').classList.add('hidden');
    state.screen = 'playing';
  };
  document.getElementById('btn-finish-grounding').onclick = completeGroundingQuest;
}

function toggleMuteAudio() {
  const isSoundOn = window.soundEngine.toggleMute();
  const btn = document.getElementById('btn-sound-toggle');
  const status = document.getElementById('status-music-state');
  if (isSoundOn) {
    btn.textContent = '🔊';
    status.textContent = 'Audio: On (M to mute)';
  } else {
    btn.textContent = '🔇';
    status.textContent = 'Audio: Muted';
  }
}

// ============================================================================
// 10. MAIN GAME LOOP (60 FPS with Y-Sorted Depth)
// ============================================================================
function gameLoop() {
  if (!canvas || !ctx) return;
  try {
  updatePlayerMovement();
  updateNihi();
  checkCollectibles();
  updateInteractables();

  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 1. Draw Map (Base or Blooming state based on quest progress)
  const activeMap = (state.quests.mirrorPcosDone && state.quests.forestDone)
      ? assets.mapBloom
      : assets.mapBase;
  if (isImageReady(activeMap)) {
    ctx.drawImage(activeMap, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  } else {
    drawFallbackGarden();
  }

  // 2. Draw Collectibles
  drawCollectibles();

  // 3. Draw NPCs
  drawNPCs();

  // 4. Draw Characters Y-sorted
  if (state.player.y < state.nihi.y) {
    drawPlayerSprite(state.player.x, state.player.y, state.player.dir, state.player.frame);
    drawNihiSprite(state.nihi.x, state.nihi.y, state.nihi.stateIndex, state.nihi.frame, state.nihi.floatAngle);
  } else {
    drawNihiSprite(state.nihi.x, state.nihi.y, state.nihi.stateIndex, state.nihi.frame, state.nihi.floatAngle);
    drawPlayerSprite(state.player.x, state.player.y, state.player.dir, state.player.frame);
  }

  // 5. Draw Atmospheric Effects (Gentle woodland light & Drifting petals, NO white blobs)
  drawForestThicketAtmosphere();
  updateAndDrawAmbientParticles();
  } catch (error) {
    console.error('Bleuming frame failed; next frame will retry.', error);
    ctx.setTransform(1,0,0,1,0,0);
    ctx.fillStyle = '#9BBE91'; ctx.fillRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
    ctx.fillStyle = '#493044'; ctx.font = '14px sans-serif'; ctx.fillText('Garden is recovering…', 220, 240);
  } finally { requestAnimationFrame(gameLoop); }
}

// Start Game Engine
// ============================================================================
// PERSISTENCE, DAILY ADVENTURES, QUEST ENGINE, AI (Bleuming 3.0)
// ============================================================================

const SAVE_KEY = 'bleuming_save_v1';
const JOURNEYS_KEY = 'bleuming_journey_preferences_v1';
const journeyOptions = [
  ['pcos_pcod','PCOS & PCOD Awareness','Body signals, symptom awareness, and questions for a healthcare professional.'],
  ['postpartum','Postpartum Wellbeing','Recovery, asking for support, and difficult emotions after childbirth.'],
  ['emotional_wellbeing','Emotional Wellbeing','Everyday overwhelm, grounding, and supportive conversations.'],
  ['body_image','Body Image & Self-Compassion','Stories about comparison, acceptance, and self-kindness.'],
  ['physical_wellbeing','Everyday Physical Wellbeing','Movement, rest, and flexible routines without weight or calorie goals.'],
  ['cozy_adventures','Just Cozy Adventures','Exploration, collecting, puzzles, crafting, and magical mysteries.']
];
let selectedJourneys = [];
function loadJourneyPreferences(){
  try { selectedJourneys = JSON.parse(localStorage.getItem(JOURNEYS_KEY) || '[]'); if(!Array.isArray(selectedJourneys)) selectedJourneys=[]; }
  catch(error){ console.error('Could not load journey preferences.', error); selectedJourneys=[]; }
}
function saveJourneyPreferences(){
  selectedJourneys = Array.from(document.querySelectorAll('[data-journey]:checked')).map(el=>el.dataset.journey);
  state.world.preferencesChosen=true;
  try { localStorage.setItem(JOURNEYS_KEY, JSON.stringify(selectedJourneys)); }
  catch(error){ console.error('Could not save journey preferences.', error); }
  closeJourneyScreen();
}
function openJourneyScreen(){
  const overlay=document.getElementById('screen-journeys');
  if(!overlay) return;
  const grid=document.getElementById('journey-cards'); grid.innerHTML='';
  journeyOptions.forEach(([id,title,description])=>{
    const label=document.createElement('label'); label.className='journey-card';
    const input=document.createElement('input'); input.type='checkbox'; input.dataset.journey=id; input.checked=selectedJourneys.includes(id);
    const copy=document.createElement('span'); copy.innerHTML='<strong>'+title+'</strong><small>'+description+'</small>';
    label.append(input,copy); grid.appendChild(label);
  });
  overlay.classList.remove('hidden'); state.screen='onboarding';
}
function closeJourneyScreen(){
  document.getElementById('screen-journeys').classList.add('hidden');
  document.getElementById('screen-title').classList.add('hidden');
  document.getElementById('game-hud').classList.remove('hidden'); state.screen='playing';
  state.world.newSave=false; hasSavedJourney=true; saveGame();
  if(!state.world.introSeen){ state.world.introSeen=true; setTimeout(startIntroDialogue,250); }
}
let hasSavedJourney = false;
state.world = state.world || {
  day: 1,
  relationship: 0,
  recentActivities: [],
  discovered: [],
  plants: {},
  newSave: true
};

function saveGame() {
  try {
    const payload = {
      player: { x: state.player.x, y: state.player.y },
      inventory: state.inventory.items.map(function(i){return i.id;}),
      quests: {
        current: state.quests.current,
        mirrorPcosDone: state.quests.mirrorPcosDone,
        postpartumDone: state.quests.postpartumDone,
        forestDone: state.quests.forestDone
      },
      floraCollected: floraCollectibles.map(function(f){return f.collected;}),
      world: state.world,
      daily: state.dailyAdventures || []
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    } catch(e) { console.error('Could not save Bleuming progress.', e); }
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);
    if (d.player) { state.player.x = d.player.x; state.player.y = d.player.y; }
    if (Array.isArray(d.floraCollected)) d.floraCollected.forEach(function(c,i){ if(floraCollectibles[i]) floraCollectibles[i].collected = !!c; });
    const savedInventory = Array.isArray(d.inventory) ? d.inventory : [];
    state.inventory.items = savedInventory
      .filter(function(id, index){ return typeof id === 'string' && savedInventory.indexOf(id) === index; })
      .map(function(id){ return floraCollectibles.find(function(item){ return item.id === id; }); })
      .filter(Boolean);
    updateInventoryHUD();
    if (d.quests) {
      state.quests.current = d.quests.current || state.quests.current;
      state.quests.mirrorPcosDone = !!d.quests.mirrorPcosDone;
      state.quests.postpartumDone = !!d.quests.postpartumDone;
      state.quests.forestDone = !!d.quests.forestDone;
    }
    if (d.world) state.world = Object.assign(state.world, d.world);
    if (Array.isArray(d.daily)) state.dailyAdventures = d.daily;
    const hasJourneyProgress = state.quests.current !== 'meet_nihi'
      || state.inventory.items.length > 0
      || state.quests.mirrorPcosDone
      || state.quests.postpartumDone
      || state.quests.forestDone;
    return state.world.newSave === false || hasJourneyProgress;
  } catch(e) { console.error('Could not load Bleuming save.', e); return false; }
}

const questEngine = {
  active: [],
  completed: [],
  start: function(q) { this.active.push(Object.assign({status:'active'}, q)); saveGame(); },
  complete: function(id) {
    const i = this.active.findIndex(function(q){return q.id===id;});
    if (i>=0){ const q=this.active.splice(i,1)[0]; q.status='completed'; this.completed.push(q); saveGame(); }
  },
  abandon: function(id){ const i = this.active.findIndex(function(q){return q.id===id;}); if(i>=0){ this.active.splice(i,1); saveGame(); } }
};

const DAILY_TEMPLATES = [
  { id:'mystery_light', title:'A Strange Light Beneath the Pond', type:'mystery', desc:'Investigate the shimmering light under the pond stones.', location:'pond', objectives:['Examine pond','Collect dewdrop'], reward:'dewdrop' },
  { id:'hidden_door', title:'The Hidden Greenhouse Door', type:'exploration', desc:'Find the tiny door behind the old greenhouse.', location:'greenhouse', objectives:['Find door','Open it'], reward:'charm' },
  { id:'new_flower', title:'A Flower of Unknown Color', type:'garden', desc:'Discover the flower blooming in a new color.', location:'garden', objectives:['Find flower'], reward:'seed' },
  { id:'lost_letters', title:'Misplaced Letters', type:'collection', desc:'Help a character find their lost letters.', location:'cottage', objectives:['Find 3 letters'], reward:'note' },
  { id:'storm_path', title:'Path After the Storm', type:'exploration', desc:'A new path appears after the storm.', location:'forest', objectives:['Walk the path'], reward:'map' }
];

function generateDailyAdventures() {
  const day = state.world.day || 1;
  const rng = function(seed) { let x = Math.sin(seed)*10000; return x - Math.floor(x); };
  const recent = state.world.recentActivities || [];
  const pool = DAILY_TEMPLATES.filter(function(t){ return recent.indexOf(t.id) === -1; });
  const chosen = [];
  let seed = day * 9973;
  const available = (pool.length >= 3 ? pool : DAILY_TEMPLATES).slice();
  for (let i=0;i<3 && i<available.length;i++){
    const idx = Math.floor(rng(seed+i)*available.length);
    const t = available.splice(idx, 1)[0];
    chosen.push(Object.assign({}, t));
  }
  state.dailyAdventures = chosen;
  state.world.recentActivities = chosen.map(function(c){return c.id;}).concat(recent).slice(0,8);
  saveGame();
  return chosen;
}

window.aiClient = {
  async request(path, payload) {
    try {
      const r = await fetch(path, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      if (!r.ok) throw new Error('http_'+r.status);
      return await r.json();
    } catch(e) { console.warn('Nihi service is unavailable; using local dialogue.', e); return null; }
  },
  async talkToNihi(message, context) {
    const data = await this.request('/api/nihi', {
      messages: [
        { role:'user', content: 'Context: ' + JSON.stringify(context) + '\nMessage: ' + message }
      ],
      max_tokens: 75
    });
    if (data && typeof data.content === 'string') return data.content.trim().split(/\s+/).slice(0,45).join(' ');
    return fallbackNihiReply(message, context);
  },
  async getOptionalSuggestion(request, context) {
    const data = await this.request('/api/nihi', {
      messages: [
        { role:'user', content: 'Give one or two concrete, optional, non-medical suggestions. Never diagnose. Ask one short clarifying question if needed.\nContext: ' + JSON.stringify(context) + '\nRequest: ' + request }
      ],
      max_tokens: 160
    });
    if (data && typeof data.content === 'string') return data.content.trim().split(/\s+/).slice(0,65).join(' ');
    return fallbackSuggestion(request);
  }
};

function fallbackNihiReply(message, context) {
  const m = (message||'').toLowerCase();
  if (m.indexOf('help')!==-1 || m.indexOf('overwhelm')!==-1) return 'I am here with you. Want to take a slow breath together, or stroll to the pond for a moment?';
  if (m.indexOf('discover')!==-1 || m.indexOf('found')!==-1) return 'Ooh, a new discovery! Tell me more — I love hearing about garden finds.';
  return 'That is lovely to hear. The garden feels a little brighter when you share things with me.';
}
function fallbackSuggestion(request) {
  return 'Here is one gentle idea: take a short, unhurried stroll and notice three small details you enjoy. You can skip this anytime — no pressure.';
}

const origShowDialogue = showDialogue;
showDialogue = function(node, speaker, expression) {
  if (speaker === 'Nihi' && node && Array.isArray(node.choices)) {
    const hasAdvice = node.choices.some(function(c){ return c.text && c.text.indexOf('Little Something')!==-1; });
    if (!hasAdvice) {
      node.choices = node.choices.concat([{
        text: '🌸 A Little Something for Today',
        action: function() {
          const req = prompt('What would you like a gentle suggestion about? (e.g. feeling overwhelmed, rest, body image)');
          if (req) {
            window.aiClient.getOptionalSuggestion(req, { day: state.world.day, inventory: state.inventory.items.map(function(i){return i.id;}) }).then(function(reply) {
              showDialogue({ text: reply, choices:[{text:'Thank you, Nihi'}] }, 'Nihi', 'happy');
            });
          }
        }
      }]);
    }
  }
  return origShowDialogue(node, speaker, expression);
};

setInterval(function(){ if(!window.BLEUMING_HUB_MODE) saveGame(); }, 5000);

window.addEventListener('load', function() {
  setTimeout(function() {
    if (window.BLEUMING_HUB_MODE) return;
    hasSavedJourney = loadGame();
    loadJourneyPreferences();
    if(hasSavedJourney){
      document.getElementById('btn-start-game').classList.add('hidden');
      document.getElementById('btn-continue-game').classList.remove('hidden');
      document.getElementById('continue-day').textContent=state.world.day||1;
    }
    if (!state.dailyAdventures || !state.dailyAdventures.length) generateDailyAdventures();
    saveGame();
  }, 100);
}, { once: true });

window.addEventListener('load', () => {
  setupInput();
  setupJournal();
  initAmbientParticles();
  loadGameAssets(() => { state.assetsLoaded = true; });
  if (!window.BLEUMING_HUB_MODE && !gameLoopStarted) { gameLoopStarted = true; requestAnimationFrame(gameLoop); }
  document.getElementById('btn-journey-settings').onclick=openJourneyScreen;
  document.getElementById('btn-journey-save').onclick=saveJourneyPreferences;
  document.getElementById('btn-journey-skip').onclick=()=>{ selectedJourneys=[]; saveJourneyPreferences(); };
  document.getElementById('btn-journey-clear').onclick=()=>{
    selectedJourneys=[];
    try { localStorage.removeItem(JOURNEYS_KEY); }
    catch(error){ console.error('Could not clear saved journey preferences.',error); }
    document.querySelectorAll('[data-journey]').forEach(input=>{ input.checked=false; });
  };
});
