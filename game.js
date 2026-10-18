/**
 * BLEUMING — Main Game Engine v2.0
 * Authentic Y2K Cozy Pixel-Art Women's Wellbeing Game
 * With dedicated PCOS/PCOD & Postpartum Experiences and Real Pixel Art Assets
 */

// ============================================================================
// 1. GAME CONSTANTS & CONFIGURATION
// ============================================================================
const TILE_SIZE = 32;
const MAP_COLS = 20;
const MAP_ROWS = 15;
const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 480;

// Tile Type Identifiers
const TILE = {
  GRASS: 0,
  PATH: 1,
  WATER: 2,
  FENCE: 3,
  TREE: 4,
  ROCK: 5,
  FLOWER_FADED: 6,
  FLOWER_BLOOM: 7,
  MIRROR: 8,
  HOUSE: 9,
  BENCH: 10,
  FOUNTAIN: 11
};

// ============================================================================
// 2. GAME STATE MANAGEMENT
// ============================================================================
const state = {
  screen: 'title', // 'title', 'playing', 'dialogue', 'modal', 'ending'
  player: {
    x: 6 * TILE_SIZE,
    y: 7 * TILE_SIZE,
    width: 22,
    height: 28,
    speed: 2.5,
    dir: 'down', // 'down', 'up', 'left', 'right'
    frame: 0,
    animTimer: 0,
    isMoving: false
  },
  nihi: {
    x: 7.5 * TILE_SIZE,
    y: 7 * TILE_SIZE,
    targetX: 7.5 * TILE_SIZE,
    targetY: 7 * TILE_SIZE,
    expression: 'happy', // 'happy', 'concerned'
    floatAngle: 0,
    speed: 2.0
  },
  keys: {
    up: false,
    down: false,
    left: false,
    right: false,
    interact: false
  },
  inventory: {
    items: [] // ['dewdrop', 'chamomile', 'sunstone']
  },
  quests: {
    current: 'meet_nihi', // 'meet_nihi', 'collect_flora', 'mirror_pcos', 'postpartum_house', 'foggy_forest', 'all_complete'
    mirrorPcosDone: false,
    postpartumDone: false,
    forestDone: false,
    fogDissolved: 0.0 // 0.0 (dense) to 1.0 (clear)
  },
  savedPcosQuestions: [
    "Can we check my LH/FSH ratio and order a pelvic ultrasound?",
    "Could we run a fasting insulin & glucose test for metabolic sensitivity?"
  ],
  savedPpdTasks: [
    "Drop off dinner on Tuesday (no hosting, just drop off).",
    "Watch the baby for 2 hours so I can sleep."
  ],
  activeInteractable: null,
  particles: []
};

// ============================================================================
// 3. MAP DATA (20 Cols x 15 Rows)
// ============================================================================
const defaultMap = [
  [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  [4, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 9, 9, 9, 0, 0, 4, 4, 4],
  [4, 0, 6, 6, 0, 0, 1, 0, 1, 0, 0, 0, 9, 9, 9, 0, 0, 4, 4, 4],
  [4, 0, 6, 8, 0, 0, 1, 0, 1, 0, 10, 0, 0, 1, 0, 0, 0, 0, 4, 4],
  [4, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 4, 4],
  [4, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 4],
  [4, 1, 0, 0, 0, 0, 1, 0, 11, 11, 0, 0, 0, 1, 1, 1, 1, 0, 0, 4],
  [4, 1, 0, 5, 0, 0, 1, 0, 11, 11, 0, 0, 0, 1, 0, 0, 1, 0, 0, 4],
  [4, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 4],
  [4, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 6, 6, 4],
  [4, 0, 0, 1, 0, 2, 2, 0, 1, 0, 6, 6, 0, 0, 0, 0, 1, 6, 6, 4],
  [4, 0, 6, 1, 0, 2, 2, 0, 1, 0, 6, 6, 0, 0, 5, 0, 1, 0, 0, 4],
  [4, 0, 6, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 4],
  [4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4],
  [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]
];

// In-world Collectibles
const floraCollectibles = [
  {
    id: 'dewdrop',
    name: 'Dewdrop Crystal',
    icon: '🌸',
    tileX: 2,
    tileY: 4,
    color: '#a5d8ff',
    collected: false,
    lore: 'Morning dew. A reminder to check in with what your body is feeling today.'
  },
  {
    id: 'chamomile',
    name: 'Calming Chamomile',
    icon: '🌿',
    tileX: 10,
    tileY: 10,
    color: '#fff3a8',
    collected: false,
    lore: 'Gentle chamomile sprout. Rest is a bodily requirement, not a reward to earn.'
  },
  {
    id: 'sunstone',
    name: 'Sunstone Sprout',
    icon: '✨',
    tileX: 14,
    tileY: 3,
    color: '#ff9ec7',
    collected: false,
    lore: 'Warm sunlight sprout. You do not have to look like anyone else to deserve care.'
  }
];

// Interactive Locations & NPCs
const interactables = [
  {
    id: 'mirror',
    tileX: 3,
    tileY: 3,
    prompt: 'Examine Saffron & the Shifting Mirror',
    onInteract: () => handleMirrorInteraction()
  },
  {
    id: 'house',
    tileX: 13,
    tileY: 4,
    prompt: 'Visit Maya on the Cottage Porch',
    onInteract: () => handleHouseInteraction()
  },
  {
    id: 'forest',
    tileX: 18,
    tileY: 10,
    prompt: 'Enter the Misty Thicket',
    onInteract: () => handleForestInteraction()
  },
  {
    id: 'fountain',
    tileX: 9,
    tileY: 7,
    prompt: 'Listen to Fountain Ripples',
    onInteract: () => handleFountainInteraction()
  },
  {
    id: 'bench',
    tileX: 10,
    tileY: 3,
    prompt: 'Sit with Nihi',
    onInteract: () => handleBenchInteraction()
  }
];

// ============================================================================
// 4. CANVAS RENDERING ENGINE & PIXEL SPRITES
// ============================================================================
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// Draw Player Character (Cozy pastel adventurer)
function drawPlayer(x, y, dir, frame, isMoving) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));

  // Shadow
  ctx.fillStyle = 'rgba(55, 27, 52, 0.28)';
  ctx.beginPath();
  ctx.ellipse(11, 26, 9, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  const bob = isMoving ? Math.sin(frame * 0.4) * 1.5 : 0;

  // Boots
  ctx.fillStyle = '#422040';
  if (dir === 'left' || dir === 'right') {
    const legOffset = isMoving ? Math.sin(frame * 0.4) * 3 : 0;
    ctx.fillRect(7 + legOffset, 21, 4, 6);
    ctx.fillRect(12 - legOffset, 21, 4, 6);
  } else {
    const legL = isMoving ? Math.sin(frame * 0.4) * 2 : 0;
    const legR = isMoving ? -Math.sin(frame * 0.4) * 2 : 0;
    ctx.fillRect(6, 21 + legL, 4, 6);
    ctx.fillRect(12, 21 + legR, 4, 6);
  }

  // Pink skirt
  ctx.fillStyle = '#ff8ebb';
  ctx.fillRect(5, 14 + bob, 12, 8);
  ctx.fillStyle = '#fffcf2';
  ctx.fillRect(5, 21 + bob, 12, 2);

  // Lavender sweater
  ctx.fillStyle = '#cdb4db';
  ctx.fillRect(6, 9 + bob, 10, 6);
  ctx.fillStyle = '#ff4d6d';
  ctx.fillRect(10, 11 + bob, 2, 2);

  // Arms
  ctx.fillStyle = '#cdb4db';
  if (dir === 'left') {
    ctx.fillRect(4, 10 + bob, 3, 5);
  } else if (dir === 'right') {
    ctx.fillRect(15, 10 + bob, 3, 5);
  } else {
    ctx.fillRect(4, 10 + bob, 2, 5);
    ctx.fillRect(16, 10 + bob, 2, 5);
  }

  // Head
  ctx.fillStyle = '#ffdfba';
  ctx.fillRect(6, 2 + bob, 10, 8);

  // Hair
  ctx.fillStyle = '#7a4329';
  if (dir === 'up') {
    ctx.fillRect(5, 0 + bob, 12, 10);
    ctx.fillStyle = '#ff659c';
    ctx.fillRect(13, 3 + bob, 3, 3);
  } else {
    ctx.fillRect(5, 0 + bob, 12, 4);
    ctx.fillRect(4, 3 + bob, 3, 6);
    ctx.fillRect(15, 3 + bob, 3, 6);

    ctx.fillStyle = '#ff659c';
    ctx.fillRect(13, 1 + bob, 3, 3);

    ctx.fillStyle = '#371b34';
    if (dir === 'down') {
      ctx.fillRect(8, 5 + bob, 2, 2);
      ctx.fillRect(12, 5 + bob, 2, 2);
      ctx.fillStyle = '#ff9ec7';
      ctx.fillRect(7, 7 + bob, 2, 1);
      ctx.fillRect(13, 7 + bob, 2, 1);
    } else if (dir === 'left') {
      ctx.fillRect(7, 5 + bob, 2, 2);
      ctx.fillStyle = '#ff9ec7';
      ctx.fillRect(6, 7 + bob, 2, 1);
    } else if (dir === 'right') {
      ctx.fillRect(13, 5 + bob, 2, 2);
      ctx.fillStyle = '#ff9ec7';
      ctx.fillRect(14, 7 + bob, 2, 1);
    }
  }

  ctx.restore();
}

// Draw Companion Nihi (Cute pixel companion)
function drawNihi(x, y, expression, floatAngle) {
  ctx.save();
  const floatOffset = Math.sin(floatAngle) * 3;
  ctx.translate(Math.round(x), Math.round(y + floatOffset));

  // Shadow
  ctx.fillStyle = 'rgba(55, 27, 52, 0.22)';
  ctx.beginPath();
  ctx.ellipse(12, 22 - floatOffset, 9, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Sprout
  ctx.fillStyle = '#7dbb84';
  ctx.fillRect(11, -4, 2, 5);
  ctx.beginPath();
  ctx.arc(14, -4, 3, 0, Math.PI * 2);
  ctx.fill();

  // Ears
  ctx.fillStyle = '#ffc2d1';
  ctx.beginPath();
  ctx.ellipse(5, 3, 3, 5, -0.3, 0, Math.PI * 2);
  ctx.ellipse(19, 3, 3, 5, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = '#ffe5ec';
  ctx.beginPath();
  ctx.arc(12, 11, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#52304d';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Cheeks
  ctx.fillStyle = '#ff8fa3';
  ctx.fillRect(6, 12, 3, 2);
  ctx.fillRect(15, 12, 3, 2);

  // Eyes
  ctx.fillStyle = '#422040';
  if (expression === 'happy') {
    ctx.fillRect(8, 8, 2, 1);
    ctx.fillRect(9, 7, 1, 1);
    ctx.fillRect(14, 8, 2, 1);
    ctx.fillRect(15, 7, 1, 1);
    ctx.fillRect(11, 12, 2, 2);
  } else {
    ctx.fillRect(8, 8, 3, 2);
    ctx.fillRect(13, 8, 3, 2);
    ctx.fillRect(10, 13, 4, 1);
  }

  ctx.restore();
}

// Draw Tileset
function drawTile(col, row, type) {
  const px = col * TILE_SIZE;
  const py = row * TILE_SIZE;

  switch (type) {
    case TILE.GRASS:
      ctx.fillStyle = '#a6cfa8';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#97c299';
      ctx.fillRect(px + 6, py + 8, 2, 3);
      ctx.fillRect(px + 20, py + 18, 3, 2);
      break;

    case TILE.PATH:
      ctx.fillStyle = '#f5e8d0';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#e6d3b4';
      ctx.fillRect(px + 2, py + 2, 12, 10);
      ctx.fillRect(px + 16, py + 8, 14, 10);
      ctx.fillRect(px + 4, py + 16, 12, 12);
      ctx.fillStyle = '#52304d';
      ctx.fillRect(px, py, 1, TILE_SIZE);
      break;

    case TILE.WATER:
      ctx.fillStyle = '#8ecae6';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      const wave = Math.sin(Date.now() * 0.003 + col + row) * 2;
      ctx.fillStyle = '#bde0fe';
      ctx.fillRect(px + 4, py + 8 + wave, 10, 2);
      ctx.fillRect(px + 16, py + 20 - wave, 12, 2);
      if ((col + row) % 2 === 0) {
        ctx.fillStyle = '#639366';
        ctx.beginPath();
        ctx.arc(px + 14, py + 14, 5, 0, Math.PI * 1.8);
        ctx.fill();
      }
      break;

    case TILE.TREE:
      ctx.fillStyle = '#a6cfa8';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#7a4931';
      ctx.fillRect(px + 12, py + 16, 8, 16);
      ctx.fillStyle = '#578e5c';
      ctx.beginPath();
      ctx.arc(px + 16, py + 12, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#78aa7c';
      ctx.beginPath();
      ctx.arc(px + 14, py + 10, 9, 0, Math.PI * 2);
      ctx.fill();
      break;

    case TILE.ROCK:
      ctx.fillStyle = '#a6cfa8';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#9aa0a6';
      ctx.beginPath();
      ctx.ellipse(px + 16, py + 18, 12, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      break;

    case TILE.FLOWER_FADED:
      ctx.fillStyle = '#a6cfa8';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      if (state.quests.mirrorPcosDone) {
        drawBloomingFlowerTile(px, py, col, row);
      } else {
        ctx.fillStyle = '#7a967c';
        ctx.fillRect(px + 15, py + 16, 2, 10);
        ctx.fillStyle = '#c9b1bd';
        ctx.beginPath();
        ctx.arc(px + 14, py + 18, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      break;

    case TILE.MIRROR:
      ctx.fillStyle = '#a6cfa8';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(px + 10, py + 22, 12, 8);
      ctx.fillRect(px + 8, py + 28, 16, 4);
      ctx.fillStyle = '#e8b948';
      ctx.fillRect(px + 6, py + 2, 20, 22);
      const shift = Math.sin(Date.now() * 0.002) * 0.5 + 0.5;
      const rGrad = ctx.createLinearGradient(px + 8, py + 4, px + 24, py + 22);
      rGrad.addColorStop(0, `rgba(255, 182, 193, ${0.7 + shift * 0.2})`);
      rGrad.addColorStop(1, `rgba(189, 224, 254, ${0.7 + shift * 0.2})`);
      ctx.fillStyle = rGrad;
      ctx.fillRect(px + 8, py + 4, 16, 18);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 10, py + 6, 2, 2);
      break;

    case TILE.HOUSE:
      ctx.fillStyle = '#a6cfa8';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#d8b4e2';
      ctx.fillRect(px, py + 8, TILE_SIZE, TILE_SIZE - 8);
      ctx.fillStyle = '#ff758f';
      ctx.fillRect(px, py, TILE_SIZE, 8);
      ctx.fillStyle = '#fff3a8';
      ctx.fillRect(px + 8, py + 14, 14, 12);
      ctx.fillStyle = '#52304d';
      ctx.strokeRect(px + 8, py + 14, 14, 12);
      break;

    case TILE.BENCH:
      ctx.fillStyle = '#a6cfa8';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#b08968';
      ctx.fillRect(px + 4, py + 12, 24, 6);
      ctx.fillRect(px + 6, py + 18, 3, 10);
      ctx.fillRect(px + 23, py + 18, 3, 10);
      break;

    case TILE.FOUNTAIN:
      ctx.fillStyle = '#a6cfa8';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#bde0fe';
      ctx.beginPath();
      ctx.arc(px + 16, py + 16, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#52304d';
      ctx.lineWidth = 2;
      ctx.stroke();
      const spoutHeight = Math.sin(Date.now() * 0.006) * 3 + 6;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 15, py + 16 - spoutHeight, 3, spoutHeight);
      break;
  }
}

function drawBloomingFlowerTile(px, py, col, row) {
  ctx.fillStyle = '#4f8553';
  ctx.fillRect(px + 15, py + 14, 2, 14);
  ctx.fillRect(px + 11, py + 20, 5, 2);

  const flowerColor = (col + row) % 2 === 0 ? '#ff659c' : '#ffd166';
  ctx.fillStyle = flowerColor;
  ctx.beginPath();
  ctx.arc(px + 16, py + 11, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fffcf2';
  ctx.beginPath();
  ctx.arc(px + 16, py + 11, 3, 0, Math.PI * 2);
  ctx.fill();

  if (Math.random() < 0.03) {
    addSparkle(px + 10 + Math.random() * 12, py + 6 + Math.random() * 8, flowerColor);
  }
}

function drawCollectible(item) {
  if (item.collected) return;
  const px = item.tileX * TILE_SIZE;
  const py = item.tileY * TILE_SIZE;
  const bob = Math.sin(Date.now() * 0.005 + item.tileX) * 4;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.beginPath();
  ctx.arc(px + 16, py + 16 + bob, 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = item.color;
  ctx.beginPath();
  ctx.arc(px + 16, py + 16 + bob, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#52304d';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(px + 13, py + 13 + bob, 3, 3);
}

function addSparkle(x, y, color = '#ffd166') {
  state.particles.push({
    x: x,
    y: y,
    vx: (Math.random() - 0.5) * 1.2,
    vy: -Math.random() * 1.5 - 0.5,
    alpha: 1.0,
    color: color,
    size: Math.random() * 3 + 2,
    life: 30
  });
}

function updateAndDrawParticles() {
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= 1 / p.life;

    if (p.alpha <= 0) {
      state.particles.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
    ctx.restore();
  }
}

function drawFoggyForestOverlay() {
  if (state.quests.fogDissolved >= 1.0) return;

  const fogStrength = 1.0 - state.quests.fogDissolved;
  const time = Date.now() * 0.001;

  ctx.save();
  const fogStartX = 14 * TILE_SIZE;
  const fogWidth = CANVAS_WIDTH - fogStartX;

  const fogGrad = ctx.createLinearGradient(fogStartX - 20, 0, CANVAS_WIDTH, 0);
  fogGrad.addColorStop(0, 'rgba(230, 240, 250, 0)');
  fogGrad.addColorStop(0.3, `rgba(215, 230, 245, ${0.5 * fogStrength})`);
  fogGrad.addColorStop(1, `rgba(220, 235, 250, ${0.88 * fogStrength})`);

  ctx.fillStyle = fogGrad;
  ctx.fillRect(fogStartX - 20, 0, fogWidth + 20, CANVAS_HEIGHT);

  ctx.fillStyle = `rgba(255, 255, 255, ${0.35 * fogStrength})`;
  for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
    const driftX = Math.sin(time + y * 0.1) * 16;
    ctx.beginPath();
    ctx.ellipse(fogStartX + 50 + driftX, y + 20, 60, 24, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ============================================================================
// 5. COLLISION & MOVEMENT LOGIC
// ============================================================================
function isSolidTile(tileCol, tileRow) {
  if (tileCol < 0 || tileCol >= MAP_COLS || tileRow < 0 || tileRow >= MAP_ROWS) {
    return true;
  }
  const tile = defaultMap[tileRow][tileCol];
  return (
    tile === TILE.TREE ||
    tile === TILE.ROCK ||
    tile === TILE.WATER ||
    tile === TILE.MIRROR ||
    tile === TILE.HOUSE
  );
}

function checkObstacleCollision(newX, newY) {
  const boxLeft = newX + 4;
  const boxRight = newX + state.player.width - 4;
  const boxTop = newY + 14;
  const boxBottom = newY + state.player.height;

  const leftCol = Math.floor(boxLeft / TILE_SIZE);
  const rightCol = Math.floor(boxRight / TILE_SIZE);
  const topRow = Math.floor(boxTop / TILE_SIZE);
  const bottomRow = Math.floor(boxBottom / TILE_SIZE);

  for (let r = topRow; r <= bottomRow; r++) {
    for (let c = leftCol; c <= rightCol; c++) {
      if (isSolidTile(c, r)) return true;
    }
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

  if (state.keys.up) {
    dy -= state.player.speed;
    state.player.dir = 'up';
  }
  if (state.keys.down) {
    dy += state.player.speed;
    state.player.dir = 'down';
  }
  if (state.keys.left) {
    dx -= state.player.speed;
    state.player.dir = 'left';
  }
  if (state.keys.right) {
    dx += state.player.speed;
    state.player.dir = 'right';
  }

  if (dx !== 0 && dy !== 0) {
    dx *= 0.7071;
    dy *= 0.7071;
  }

  state.player.isMoving = (dx !== 0 || dy !== 0);

  if (state.player.isMoving) {
    state.player.animTimer++;
    if (state.player.animTimer % 18 === 0) {
      window.soundEngine.playFootstep();
    }
    state.player.frame++;

    if (dx !== 0 && !checkObstacleCollision(state.player.x + dx, state.player.y)) {
      state.player.x += dx;
    }
    if (dy !== 0 && !checkObstacleCollision(state.player.x, state.player.y + dy)) {
      state.player.y += dy;
    }
  }

  state.player.x = Math.max(TILE_SIZE, Math.min(state.player.x, (MAP_COLS - 2) * TILE_SIZE));
  state.player.y = Math.max(TILE_SIZE, Math.min(state.player.y, (MAP_ROWS - 2) * TILE_SIZE));
}

function updateNihiAI() {
  state.nihi.floatAngle += 0.04;

  if (state.screen === 'playing') {
    let offsetX = -24;
    let offsetY = -8;
    if (state.player.dir === 'left') offsetX = 28;
    if (state.player.dir === 'right') offsetX = -28;
    if (state.player.dir === 'up') offsetY = 24;
    if (state.player.dir === 'down') offsetY = -24;

    state.nihi.targetX = state.player.x + offsetX;
    state.nihi.targetY = state.player.y + offsetY;

    const distX = state.nihi.targetX - state.nihi.x;
    const distY = state.nihi.targetY - state.nihi.y;
    const dist = Math.hypot(distX, distY);

    if (dist > 4) {
      state.nihi.x += distX * 0.08;
      state.nihi.y += distY * 0.08;
    }
  }
}

function checkCollectiblesPickup() {
  const playerCenterX = state.player.x + state.player.width / 2;
  const playerCenterY = state.player.y + state.player.height / 2;

  floraCollectibles.forEach(item => {
    if (item.collected) return;
    const itemCenterX = item.tileX * TILE_SIZE + TILE_SIZE / 2;
    const itemCenterY = item.tileY * TILE_SIZE + TILE_SIZE / 2;

    const dist = Math.hypot(playerCenterX - itemCenterX, playerCenterY - itemCenterY);
    if (dist < 26) {
      item.collected = true;
      state.inventory.items.push(item);
      window.soundEngine.playPickup();

      for (let s = 0; s < 12; s++) {
        addSparkle(itemCenterX, itemCenterY, item.color);
      }

      updateInventoryHUD();
      showItemPickupDialogue(item);
    }
  });
}

function updateInteractables() {
  const pCol = Math.floor((state.player.x + state.player.width / 2) / TILE_SIZE);
  const pRow = Math.floor((state.player.y + state.player.height / 2) / TILE_SIZE);

  let found = null;
  for (const obj of interactables) {
    const dist = Math.abs(pCol - obj.tileX) + Math.abs(pRow - obj.tileY);
    if (dist <= 1.8) {
      found = obj;
      break;
    }
  }

  const nihiCol = Math.floor(state.nihi.x / TILE_SIZE);
  const nihiRow = Math.floor(state.nihi.y / TILE_SIZE);
  if (!found && Math.abs(pCol - nihiCol) + Math.abs(pRow - nihiRow) <= 1.5) {
    found = {
      id: 'nihi',
      prompt: 'Talk with Nihi',
      onInteract: () => handleNihiDirectDialogue()
    };
  }

  state.activeInteractable = found;

  const promptEl = document.getElementById('interaction-prompt');
  const promptText = document.getElementById('prompt-text');
  if (found && state.screen === 'playing') {
    promptEl.classList.remove('hidden');
    promptText.textContent = found.prompt;
  } else {
    promptEl.classList.add('hidden');
  }
}

// ============================================================================
// 6. DIALOGUE SYSTEM WITH REAL PIXEL ART PORTRAITS
// ============================================================================
const dialogueEl = document.getElementById('dialogue-box');
const dialogueTextEl = document.getElementById('dialogue-text');
const dialogueChoicesEl = document.getElementById('dialogue-choices');
const speakerTagEl = document.getElementById('speaker-name');
const portraitImgEl = document.getElementById('dialogue-portrait-img');

function setPortraitImage(speaker, expression = 'happy') {
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
  setPortraitImage(speaker, expression);
  state.nihi.expression = expression;

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
  state.nihi.expression = 'happy';
  checkQuestProgressAfterDialogue();
}

function showItemPickupDialogue(item) {
  showDialogue(
    {
      text: `You found the ${item.name}! "${item.lore}"`,
      choices: [
        {
          text: 'Tuck it into your pocket ✨',
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

// Punchy, natural, cozy intro dialogue
function startIntroDialogue() {
  showDialogue(
    {
      text: '"Oh, hey! You can see me? The garden has felt so quiet and faded lately. Will you walk with me and help wake it up?"',
      choices: [
        {
          text: '"I\'d love to walk with you, Nihi."',
          expression: 'happy',
          next: {
            text: '"Yay! Let\'s start by finding 3 little flora sprouts along the stone paths. They\'re scattered around the fountain and corners."',
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
          text: '"Why did the flowers fade?"',
          expression: 'concerned',
          next: {
            text: '"People got so used to ignoring when they were tired or hurting. When we stop listening to our bodies, the flowers wilt too."',
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
        text: `"You've found ${state.inventory.items.length}/3 sprouts so far! Check near the blue pond and stone corners. Zero rush!"`,
        choices: [{ text: '"Got it, looking around!"' }]
      },
      'Nihi',
      'happy'
    );
  } else if (state.quests.current === 'mirror_pcos') {
    showDialogue(
      {
        text: '"Saffron is waiting by the Shifting Mirror in the top-left grove. She looks like she could really use a friendly chat."',
        choices: [{ text: '"Let\'s head over to Saffron."' }]
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
        text: '"The eastern woods are covered in fog. My heart is beating a little fast... but we can do a calm breath together."',
        choices: [{ text: '"We\'ve got this, Nihi."' }]
      },
      'Nihi',
      'concerned'
    );
  } else {
    showDialogue(
      {
        text: '"Look around—the whole garden is bleuming! Thanks for being so kind to everyone today."',
        choices: [{ text: '"I\'m so proud of our garden."' }]
      },
      'Nihi',
      'happy'
    );
  }
}

// ============================================================================
// 7. DEDICATED EXPERIENCE 1: SAFFRON & THE PCOS/PCOD SANCTUARY
// ============================================================================
function handleMirrorInteraction() {
  if (state.quests.current === 'collect_flora') {
    showDialogue(
      {
        text: 'The Shifting Mirror is asleep. Nihi taps your shoulder: "Let\'s find all 3 flora sprouts first to awaken the mirror!"',
        choices: [{ text: '"Right, let\'s finish collecting!"' }]
      },
      'Shifting Mirror',
      'concerned'
    );
    return;
  }

  if (state.quests.mirrorPcosDone) {
    // Re-open PCOS Hub anytime
    openPcosHubModal();
    return;
  }

  // Active PCOS Dialogue (Natural, human, zero AI therapy slop)
  showDialogue(
    {
      text: '"Hey... sorry, I was just staring at this mirror. Some months my cycle just vanishes, my skin breaks out, and I\'m exhausted by noon. Then people tell me to \'just drink spearmint tea\' and it makes me want to scream."',
      speaker: 'Saffron',
      choices: [
        {
          text: '"That unsolicited advice is so frustrating. Your symptoms are medical, not a failure."',
          expression: 'happy',
          next: {
            text: '"Right?! People act like our bodies are predictable clockwork, but PCOS affects insulin, hormones, everything. I want to talk to my doctor, but I always freeze up in the clinic."',
            speaker: 'Saffron',
            choices: [
              {
                text: '"Let\'s write down the exact lab tests & questions so you feel totally ready."',
                action: () => openPcosHubModal()
              }
            ]
          }
        },
        {
          text: '"It\'s completely valid to feel fed up when your body feels unpredictable."',
          expression: 'concerned',
          next: {
            text: '"Thank you. It feels so isolating when you\'re constantly second-guessing your own fatigue. Can we build a clean doctor visit card together?"',
            speaker: 'Saffron',
            choices: [
              {
                text: '🌸 Open PCOS Care Hub & Doctor Prep',
                action: () => openPcosHubModal()
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

function openPcosHubModal() {
  state.screen = 'modal';
  const modal = document.getElementById('modal-pcos-hub');
  modal.classList.remove('hidden');

  setupPcosHubTabs();
  updatePcosGeneratedQuestions();
}

function setupPcosHubTabs() {
  const tabs = document.querySelectorAll('#modal-pcos-hub .hub-tab');
  tabs.forEach(tab => {
    tab.onclick = () => {
      window.soundEngine.playSelect();
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const targetId = tab.dataset.tab;
      document.querySelectorAll('#modal-pcos-hub .hub-tab-pane').forEach(p => p.classList.remove('active'));
      const pane = document.getElementById(targetId);
      if (pane) pane.classList.add('active');
    };
  });

  const checkboxes = document.querySelectorAll('#pcos-symptom-checklist input');
  checkboxes.forEach(cb => {
    cb.onchange = () => {
      window.soundEngine.playSelect();
      updatePcosGeneratedQuestions();
    };
  });
}

function updatePcosGeneratedQuestions() {
  const list = document.getElementById('pcos-generated-questions');
  const checked = document.querySelectorAll('#pcos-symptom-checklist input:checked');
  list.innerHTML = '';
  state.savedPcosQuestions = [];

  checked.forEach(cb => {
    const parentText = cb.parentElement.querySelector('span').textContent;
    const quote = parentText.split(':')[1]?.trim() || parentText;
    state.savedPcosQuestions.push(quote);
    const li = document.createElement('li');
    li.textContent = quote;
    list.appendChild(li);
  });

  if (checked.length === 0) {
    list.innerHTML = '<li><em>Select at least one symptom on the checklist tab!</em></li>';
  }
}

function completePcosQuest() {
  document.getElementById('modal-pcos-hub').classList.add('hidden');
  state.quests.mirrorPcosDone = true;
  state.quests.current = 'postpartum_house';

  window.soundEngine.playBloomFanfare();

  // Flowers burst into bloom!
  for (let i = 0; i < 35; i++) {
    addSparkle(3 * TILE_SIZE + Math.random() * 64, 3 * TILE_SIZE + Math.random() * 64, '#ff659c');
  }

  showDialogue(
    {
      text: '"Look at that—roses are blooming around the mirror! Having my questions written down makes me feel so much calmer about my doctor visit. Thank you!"',
      speaker: 'Saffron',
      choices: [
        {
          text: '"You\'ve got this, Saffron. Take good care!"',
          action: () => {
            updateQuestHUD(
              'Visit Maya at the Cottage Porch',
              'Head southeast to the cottage veranda where a new parent is resting.'
            );
          }
        }
      ]
    },
    'Saffron',
    'happy'
  );
}

// ============================================================================
// 8. DEDICATED EXPERIENCE 2: MAYA & POSTPARTUM DEPRESSION
// ============================================================================
function handleHouseInteraction() {
  if (!state.quests.mirrorPcosDone) {
    showDialogue(
      {
        text: 'The cottage porch is quiet. Nihi whispers: "Maya is resting with the baby right now. Let\'s check in on Saffron at the mirror first!"',
        choices: [{ text: '"Let\'s visit Saffron first."' }]
      },
      'Cottage Porch',
      'concerned'
    );
    return;
  }

  if (state.quests.postpartumDone) {
    // Re-open Postpartum Hub anytime
    openPostpartumHubModal();
    return;
  }

  // Active Postpartum Scene (Human, raw, empathetic)
  showDialogue(
    {
      text: '"Hi... shh, the baby just fell asleep. Honestly? I\'m hanging on by a thread. Everyone tells me \'cherish every second!\', but I cried for two hours in the bathroom this morning. I feel like such an awful mother."',
      speaker: 'Maya',
      choices: [
        {
          text: '"Postpartum depression is a medical hormonal drop, Maya. It has zero to do with your love."',
          expression: 'concerned',
          next: {
            text: '"Hearing that made my shoulders drop an inch. I was terrified that admitting this meant I was failing. Friends keep texting \'let me know if you need anything\', but I don\'t even know what to ask."',
            speaker: 'Maya',
            choices: [
              {
                text: '💌 Open Maternal Care Hub & Task Delegation Board',
                action: () => openPostpartumHubModal()
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
                text: '💌 Build Maya\'s Support Request',
                action: () => openPostpartumHubModal()
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

function openPostpartumHubModal() {
  state.screen = 'modal';
  const modal = document.getElementById('modal-postpartum-hub');
  modal.classList.remove('hidden');

  setupPostpartumHubTabs();
}

function setupPostpartumHubTabs() {
  const tabs = document.querySelectorAll('#modal-postpartum-hub .hub-tab');
  tabs.forEach(tab => {
    tab.onclick = () => {
      window.soundEngine.playSelect();
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const targetId = tab.dataset.tab;
      document.querySelectorAll('#modal-postpartum-hub .hub-tab-pane').forEach(p => p.classList.remove('active'));
      const pane = document.getElementById(targetId);
      if (pane) pane.classList.add('active');
    };
  });

  const chips = document.querySelectorAll('#delegation-board .delegate-chip');
  chips.forEach(chip => {
    chip.onclick = () => {
      window.soundEngine.playSelect();
      chip.classList.toggle('selected');
      updatePpdPreviewText();
    };
  });

  updatePpdPreviewText();
}

function updatePpdPreviewText() {
  const selected = document.querySelectorAll('#delegation-board .delegate-chip.selected');
  const preview = document.getElementById('ppd-message-preview');
  state.savedPpdTasks = [];

  if (selected.length === 0) {
    preview.textContent = '"Hey! I could use some support today—could we talk soon?"';
    return;
  }

  const tasks = [];
  selected.forEach(c => {
    const text = c.dataset.text;
    tasks.push(text);
    state.savedPpdTasks.push(text);
  });

  preview.textContent = `"Hey! Things have been really heavy and exhausting today. Could you help with: ${tasks.join(' And: ')}? It would mean the world."`;
}

function completePostpartumQuest() {
  document.getElementById('modal-postpartum-hub').classList.add('hidden');
  state.quests.postpartumDone = true;
  state.quests.current = 'foggy_forest';

  window.soundEngine.playBloomFanfare();

  // Floating hearts around the cottage
  for (let h = 0; h < 20; h++) {
    addSparkle(13 * TILE_SIZE + Math.random() * 40, 4 * TILE_SIZE + Math.random() * 30, '#ff4d6d');
  }

  showDialogue(
    {
      text: '"A friend just replied—she\'s bringing a warm soup and watching the crib while I sleep! Thank you for reminding me that asking for help protects both of us."',
      speaker: 'Maya',
      choices: [
        {
          text: '"Sleep well, Maya. You are doing great."',
          action: () => {
            updateQuestHUD(
              'Explore the Misty Thicket',
              'Head east into the foggy woods with Nihi.'
            );
          }
        }
      ]
    },
    'Maya',
    'happy'
  );
}

// ============================================================================
// 9. DEDICATED EXPERIENCE 3: FOGGY FOREST & SENSORY GROUNDING
// ============================================================================
function handleForestInteraction() {
  if (!state.quests.postpartumDone) {
    showDialogue(
      {
        text: 'The thicket is wrapped in dense grey mist. Nihi steps back: "Let\'s check on Maya at the cottage porch first before we walk into the thicket."',
        choices: [{ text: '"Good idea, let\'s visit Maya."' }]
      },
      'Misty Thicket',
      'concerned'
    );
    return;
  }

  if (state.quests.forestDone) {
    openGroundingModal();
    return;
  }

  showDialogue(
    {
      text: '"Whoa... the path completely disappeared. My chest feels tight and my head is spinning in circles. Can we just stop moving for a second?"',
      choices: [
        {
          text: '"Take all the time you need, Nihi. We do not have to push through panic."',
          expression: 'concerned',
          next: {
            text: '"Phew... thank you. Let\'s do a simple 5-4-3-2-1 sensory grounding check together."',
            choices: [
              {
                text: '🌿 Begin Sensory Grounding with Nihi',
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

let groundingStep = 0;
const groundingSteps = [
  {
    title: 'Step 1: Notice 3 Soft Colors You Can See',
    hint: 'Click 3 pastel flowers to bring your eyes back to the present moment.',
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
    hint: 'Tap 2 comforting textures to connect with your body.',
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
            'Look... your shoulders dropped, your breath is steady, and the fog is rolling away.';
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

  let dissolveInterval = setInterval(() => {
    state.quests.fogDissolved += 0.05;
    if (state.quests.fogDissolved >= 1.0) {
      state.quests.fogDissolved = 1.0;
      clearInterval(dissolveInterval);
    }
  }, 40);

  window.soundEngine.playBloomFanfare();

  for (let s = 0; s < 40; s++) {
    addSparkle(
      15 * TILE_SIZE + Math.random() * (5 * TILE_SIZE),
      Math.random() * CANVAS_HEIGHT,
      '#a5d8ff'
    );
  }

  showDialogue(
    {
      text: '"The fog lifted! When we paused and checked in with our senses, the panic couldn\'t hold on anymore. Look at the garden—it\'s completely glowing!"',
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

// ============================================================================
// 10. FOUNTAIN & BENCH INTERACTIONS
// ============================================================================
function handleFountainInteraction() {
  window.soundEngine.playTone(520, 0.4, 'sine', 0.08);
  showDialogue(
    {
      text: '"Listen to the water droplets. Water never rushes to be somewhere else. Take things at your own natural pace today."',
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

// ============================================================================
// 11. FINALE & JOURNAL
// ============================================================================
function triggerGameFinale() {
  state.screen = 'ending';
  document.getElementById('screen-ending').classList.remove('hidden');
  window.soundEngine.playBloomFanfare();
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

function renderSavedQuestionsInJournal() {
  const container = document.getElementById('saved-questions-list');
  let html = '';

  if (state.savedPcosQuestions.length > 0) {
    html += '<div style="margin-bottom: 10px;"><strong>🌸 Saffron\'s PCOS Doctor Prep:</strong><ul style="padding-left: 16px; margin-top: 4px;">';
    state.savedPcosQuestions.forEach(q => {
      html += `<li style="margin-bottom: 4px; color: #422040;">${q}</li>`;
    });
    html += '</ul></div>';
  }

  if (state.savedPpdTasks.length > 0) {
    html += '<div style="margin-top: 10px; border-top: 1px dashed #d5c4e3; padding-top: 8px;"><strong>🌙 Maya\'s Support Requests:</strong><ul style="padding-left: 16px; margin-top: 4px;">';
    state.savedPpdTasks.forEach(t => {
      html += `<li style="margin-bottom: 4px; color: #422040;">${t}</li>`;
    });
    html += '</ul></div>';
  }

  if (!html) {
    html = '<em>Complete the Shifting Mirror & Cottage Porch scenes to generate your custom cards!</em>';
  }

  container.innerHTML = html;
}

function setupJournalTabs() {
  const tabs = document.querySelectorAll('.j-tab');
  tabs.forEach(tab => {
    tab.onclick = () => {
      window.soundEngine.playSelect();
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const targetId = tab.dataset.tab;
      document.querySelectorAll('.journal-tab-pane').forEach(p => p.classList.remove('active'));
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add('active');
    };
  });
}

// ============================================================================
// 12. INPUT HANDLING & EVENT LISTENERS
// ============================================================================
function setupInput() {
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeAllModals();
      return;
    }

    if (e.key === 'j' || e.key === 'J') {
      toggleJournalModal();
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

  document.getElementById('btn-start-game').onclick = () => {
    window.soundEngine.ensureContext();
    window.soundEngine.playSelect();
    window.soundEngine.startBgm();

    document.getElementById('screen-title').classList.add('hidden');
    document.getElementById('game-hud').classList.remove('hidden');
    state.screen = 'playing';

    setTimeout(() => {
      startIntroDialogue();
    }, 400);
  };

  document.getElementById('btn-read-info').onclick = () => {
    window.soundEngine.playSelect();
    document.getElementById('modal-about').classList.remove('hidden');
  };

  document.getElementById('close-modal-about').onclick = () => {
    document.getElementById('modal-about').classList.add('hidden');
  };
  document.getElementById('btn-about-ok').onclick = () => {
    document.getElementById('modal-about').classList.add('hidden');
  };

  document.getElementById('btn-replay').onclick = () => {
    document.getElementById('screen-ending').classList.add('hidden');
    state.screen = 'playing';
    updateQuestHUD('Free Exploration', 'The garden is completely in bloom. Stroll and enjoy peace.');
  };

  document.getElementById('btn-ending-journal').onclick = () => {
    toggleJournalModal();
  };

  document.getElementById('btn-sound-toggle').onclick = () => {
    toggleMuteAudio();
  };

  document.getElementById('btn-journal-toggle').onclick = () => {
    toggleJournalModal();
  };

  document.getElementById('btn-window-close').onclick = () => {
    window.soundEngine.playTone(300, 0.1);
    alert('Bleuming is running in cozy mode! You can continue playing or resting anytime.');
  };

  // PCOS Hub Buttons
  document.getElementById('close-modal-pcos').onclick = () => {
    document.getElementById('modal-pcos-hub').classList.add('hidden');
    state.screen = 'playing';
  };
  document.getElementById('btn-save-pcos').onclick = () => {
    completePcosQuest();
  };

  // Postpartum Hub Buttons
  document.getElementById('close-modal-postpartum').onclick = () => {
    document.getElementById('modal-postpartum-hub').classList.add('hidden');
    state.screen = 'playing';
  };
  document.getElementById('btn-save-ppd').onclick = () => {
    completePostpartumQuest();
  };

  // Grounding Buttons
  document.getElementById('close-modal-grounding').onclick = () => {
    document.getElementById('modal-grounding').classList.add('hidden');
    state.screen = 'playing';
  };
  document.getElementById('btn-finish-grounding').onclick = () => {
    completeGroundingQuest();
  };

  // Journal Close
  document.getElementById('close-modal-journal').onclick = () => {
    document.getElementById('modal-journal').classList.add('hidden');
    if (state.screen === 'modal') state.screen = 'playing';
  };
}

function toggleMuteAudio() {
  const isSoundOn = window.soundEngine.toggleMute();
  const btn = document.getElementById('btn-sound-toggle');
  const status = document.getElementById('status-music-state');
  if (isSoundOn) {
    btn.textContent = '🔊';
    status.textContent = 'Audio: On';
  } else {
    btn.textContent = '🔇';
    status.textContent = 'Audio: Muted';
  }
}

function toggleJournalModal() {
  window.soundEngine.playSelect();
  const modal = document.getElementById('modal-journal');
  if (modal.classList.contains('hidden')) {
    modal.classList.remove('hidden');
    renderSavedQuestionsInJournal();
  } else {
    modal.classList.add('hidden');
  }
}

function closeAllModals() {
  document.querySelectorAll('.game-modal').forEach(m => m.classList.add('hidden'));
  if (state.screen === 'modal') state.screen = 'playing';
}

// ============================================================================
// 13. MAIN GAME LOOP (60 FPS)
// ============================================================================
function gameLoop() {
  updatePlayerMovement();
  updateNihiAI();
  checkCollectiblesPickup();
  updateInteractables();

  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  for (let r = 0; r < MAP_ROWS; r++) {
    for (let c = 0; c < MAP_COLS; c++) {
      drawTile(c, r, defaultMap[r][c]);
    }
  }

  floraCollectibles.forEach(item => drawCollectible(item));

  if (state.player.y < state.nihi.y) {
    drawPlayer(state.player.x, state.player.y, state.player.dir, state.player.frame, state.player.isMoving);
    drawNihi(state.nihi.x, state.nihi.y, state.nihi.expression, state.nihi.floatAngle);
  } else {
    drawNihi(state.nihi.x, state.nihi.y, state.nihi.expression, state.nihi.floatAngle);
    drawPlayer(state.player.x, state.player.y, state.player.dir, state.player.frame, state.player.isMoving);
  }

  drawFoggyForestOverlay();
  updateAndDrawParticles();

  requestAnimationFrame(gameLoop);
}

window.addEventListener('load', () => {
  setupInput();
  setupJournalTabs();
  requestAnimationFrame(gameLoop);
});
