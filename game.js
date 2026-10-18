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

function loadGameAssets(onComplete) {
  const checkDone = () => {
    loadedCount++;
    if (loadedCount >= totalAssets) {
      state.assetsLoaded = true;
      if (onComplete) onComplete();
    }
  };

  assets.mapBase.onload = checkDone;
  assets.mapBloom.onload = checkDone;
  assets.playerSheet.onload = checkDone;
  assets.nihiSheet.onload = checkDone;
  assets.npcSheet.onload = checkDone;

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
  if (!state.assetsLoaded) return;
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
  if (!state.assetsLoaded) return;
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
  if (!state.assetsLoaded) return;
  // Saffron (x=0 to 32 on sheet)
  ctx.drawImage(assets.npcSheet, 0, 0, 32, 48, Math.round(state.npcs.saffron.x - 16), Math.round(state.npcs.saffron.y - 28), 32, 48);
  // Maya (x=32 to 64 on sheet)
  ctx.drawImage(assets.npcSheet, 32, 0, 32, 48, Math.round(state.npcs.maya.x - 16), Math.round(state.npcs.maya.y - 28), 32, 48);
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
              state.quests.current = 'mirror_pcos';
              updateQuestHUD('Visit Saffron at the Mirror', 'Take your 3 gathered flora to the northwest grove.');
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
          text: '"That unsolicited advice is so dismissive. Your symptoms are medical, not a failure."',
          expression: 'happy',
          next: {
            text: '"Right?! People act like our cycles are effortless clockwork, but PCOS affects insulin, hormones, everything. I want to talk to my doctor, but I always freeze up in the clinic."',
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
  state.quests.current = 'postpartum_house';
  state.nihi.stateIndex = 4; // Cheering!

  window.soundEngine.playBloomFanfare();
  updateQuestHUD(
    'Visit Maya on the Cottage Porch',
    'Head northeast to the lavender cottage where a new parent is resting.'
  );
}

function handleMayaInteraction() {
  if (!state.quests.mirrorPcosDone) {
    showDialogue(
      {
        text: 'The porch is quiet. Nihi whispers: "Maya is resting with the baby right now. Let\'s check in on Saffron at the mirror first!"',
        choices: [{ text: '"Let\'s visit Saffron first."' }]
      },
      'Nihi',
      'thoughtful'
    );
    return;
  }

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
          text: '"Postpartum depression is a medical hormonal drop, Maya. It has zero to do with your love."',
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
  state.quests.current = 'foggy_forest';
  state.nihi.stateIndex = 4; // Cheering!

  window.soundEngine.playBloomFanfare();
  updateQuestHUD(
    'Step into the Misty Thicket',
    'Head east to the woodland path with Nihi.'
  );
}

function handleForestInteraction() {
  if (!state.quests.postpartumDone) {
    showDialogue(
      {
        text: 'The thicket path is quiet. Nihi steps back: "Let\'s check on Maya at the cottage porch first before we walk into the thicket."',
        choices: [{ text: '"Good idea, let\'s visit Maya."' }]
      },
      'Nihi',
      'thoughtful'
    );
    return;
  }

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
  document.getElementById('screen-ending').classList.remove('hidden');
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
    state.quests.current = 'mirror_pcos';
    updateQuestHUD('Visit Saffron at the Mirror', 'Take your 3 gathered flora to the northwest grove.');
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
  document.getElementById('btn-start-game').onclick = () => {
    window.soundEngine.ensureContext();
    window.soundEngine.playSelect();
    window.soundEngine.startBgm();

    document.getElementById('screen-title').classList.add('hidden');
    document.getElementById('game-hud').classList.remove('hidden');
    state.screen = 'playing';

    setTimeout(() => {
      startIntroDialogue();
    }, 300);
  };

  document.getElementById('btn-open-journal-title').onclick = () => {
    openJournalToChapter('ch-pcos');
  };

  document.getElementById('btn-replay').onclick = () => {
    document.getElementById('screen-ending').classList.add('hidden');
    state.screen = 'playing';
    updateQuestHUD('Free Exploration', 'The garden is in full bloom. Stroll peacefully.');
  };

  document.getElementById('btn-ending-journal').onclick = () => {
    openJournalToChapter('ch-saved');
  };

  document.getElementById('btn-sound-toggle').onclick = toggleMuteAudio;
  document.getElementById('btn-journal-toggle').onclick = toggleJournal;

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
  updatePlayerMovement();
  updateNihi();
  checkCollectibles();
  updateInteractables();

  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 1. Draw Map (Base or Blooming state based on quest progress)
  if (state.assetsLoaded) {
    const activeMap = (state.quests.mirrorPcosDone && state.quests.forestDone)
      ? assets.mapBloom
      : assets.mapBase;
    ctx.drawImage(activeMap, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
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

  requestAnimationFrame(gameLoop);
}

// Start Game Engine
window.addEventListener('load', () => {
  setupInput();
  setupJournal();
  initAmbientParticles();
  loadGameAssets(() => {
    requestAnimationFrame(gameLoop);
  });
});
