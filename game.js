/**
 * BLEUMING — Main Game Engine
 * A Y2K Cozy Pixel-Art Women's Wellbeing Exploration Game
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
    speed: 2.4,
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
    expression: 'happy', // 'happy', 'thoughtful', 'concerned'
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
    fogDissolved: 0.0 // 0.0 (dense) to 1.0 (completely clear)
  },
  savedQuestions: [],
  selectedSupportMessage: '',
  activeInteractable: null,
  particles: [],
  bloomAnimationTimer: 0
};

// ============================================================================
// 3. MAP DATA (20 Cols x 15 Rows)
// ============================================================================
// TILE Types: 0=Grass, 1=Path, 2=Water, 3=Fence, 4=Tree, 5=Rock,
//             6=Faded Flower, 8=Mirror, 9=House, 10=Bench, 11=Fountain
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
    lore: 'A crystal holding morning dew. Reminds you to honor physical hydration & bodily sensations.'
  },
  {
    id: 'chamomile',
    name: 'Calming Chamomile',
    icon: '🌿',
    tileX: 10,
    tileY: 10,
    color: '#fff3a8',
    collected: false,
    lore: 'A gentle soothing sprout. Teaches that rest and emotional support are natural necessities.'
  },
  {
    id: 'sunstone',
    name: 'Sunstone Sprout',
    icon: '✨',
    tileX: 14,
    tileY: 3,
    color: '#ff9ec7',
    collected: false,
    lore: 'A warm blossom that shines regardless of how quiet the garden gets. You deserve unconditional care.'
  }
];

// Interactive Locations & NPCs
const interactables = [
  {
    id: 'mirror',
    tileX: 3,
    tileY: 3,
    prompt: 'Examine Shifting Mirror',
    onInteract: () => handleMirrorInteraction()
  },
  {
    id: 'house',
    tileX: 13,
    tileY: 4,
    prompt: 'Visit Porch of the Tired Moon',
    onInteract: () => handleHouseInteraction()
  },
  {
    id: 'forest',
    tileX: 18,
    tileY: 10,
    prompt: 'Explore Misty Thicket',
    onInteract: () => handleForestInteraction()
  },
  {
    id: 'fountain',
    tileX: 9,
    tileY: 7,
    prompt: 'Listen to Garden Fountain',
    onInteract: () => handleFountainInteraction()
  },
  {
    id: 'bench',
    tileX: 10,
    tileY: 3,
    prompt: 'Sit & Breathe with Nihi',
    onInteract: () => handleBenchInteraction()
  }
];

// ============================================================================
// 4. CANVAS RENDERING ENGINE & PROCEDURAL SPRITES
// ============================================================================
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// Draw Player Character (Cute Y2K pastel explorer)
function drawPlayer(x, y, dir, frame, isMoving) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));

  // Shadow
  ctx.fillStyle = 'rgba(55, 27, 52, 0.28)';
  ctx.beginPath();
  ctx.ellipse(11, 26, 9, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  const bob = isMoving ? Math.sin(frame * 0.4) * 1.5 : 0;

  // Legs / Boots
  ctx.fillStyle = '#422040'; // Deep plum boots
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

  // Dress / Skirt (Cute Bubblegum Pink with cream lace)
  ctx.fillStyle = '#ff8ebb';
  ctx.fillRect(5, 14 + bob, 12, 8);
  ctx.fillStyle = '#fffcf2';
  ctx.fillRect(5, 21 + bob, 12, 2);

  // Torso / Sweater (Pastel Lavender with Heart Brooch)
  ctx.fillStyle = '#cdb4db';
  ctx.fillRect(6, 9 + bob, 10, 6);
  // Heart
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

  // Head / Skin
  ctx.fillStyle = '#ffdfba';
  ctx.fillRect(6, 2 + bob, 10, 8);

  // Hair (Warm Brown Bob with Y2K bangs & Pink clip)
  ctx.fillStyle = '#7a4329';
  if (dir === 'up') {
    // Back of head
    ctx.fillRect(5, 0 + bob, 12, 10);
    // Hair clip
    ctx.fillStyle = '#ff659c';
    ctx.fillRect(13, 3 + bob, 3, 3);
  } else {
    // Bangs & Sides
    ctx.fillRect(5, 0 + bob, 12, 4);
    ctx.fillRect(4, 3 + bob, 3, 6);
    ctx.fillRect(15, 3 + bob, 3, 6);

    // Hair Ribbon / Clip
    ctx.fillStyle = '#ff659c';
    ctx.fillRect(13, 1 + bob, 3, 3);

    // Eyes
    ctx.fillStyle = '#371b34';
    if (dir === 'down') {
      ctx.fillRect(8, 5 + bob, 2, 2);
      ctx.fillRect(12, 5 + bob, 2, 2);
      // Soft Blush
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

// Draw Companion Nihi (Magical bouncy pastel creature with 3 expressions)
function drawNihi(x, y, expression, floatAngle) {
  ctx.save();
  const floatOffset = Math.sin(floatAngle) * 3;
  ctx.translate(Math.round(x), Math.round(y + floatOffset));

  // Shadow
  ctx.fillStyle = 'rgba(55, 27, 52, 0.22)';
  ctx.beginPath();
  ctx.ellipse(12, 22 - floatOffset, 9, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Little Sprout / Leaf Antenna
  ctx.fillStyle = '#7dbb84';
  ctx.fillRect(11, -4, 2, 5);
  ctx.beginPath();
  ctx.arc(14, -4, 3, 0, Math.PI * 2);
  ctx.fill();

  // Fluffy Ears
  ctx.fillStyle = '#ffc2d1';
  ctx.beginPath();
  ctx.ellipse(5, 3, 3, 5, -0.3, 0, Math.PI * 2);
  ctx.ellipse(19, 3, 3, 5, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Body (Round, soft pearlescent cream-pink)
  ctx.fillStyle = '#ffe5ec';
  ctx.beginPath();
  ctx.arc(12, 11, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#52304d';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Blushing cheeks
  ctx.fillStyle = '#ff8fa3';
  ctx.fillRect(6, 12, 3, 2);
  ctx.fillRect(15, 12, 3, 2);

  // Eyes & Expressions
  ctx.fillStyle = '#422040';
  if (expression === 'happy') {
    // Happy crescent eyes ^ ^
    ctx.fillRect(8, 8, 2, 1);
    ctx.fillRect(9, 7, 1, 1);
    ctx.fillRect(14, 8, 2, 1);
    ctx.fillRect(15, 7, 1, 1);
    // Cute smile
    ctx.fillRect(11, 12, 2, 2);
    // Little sparkle nearby
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(22, 0, 2, 2);
  } else if (expression === 'thoughtful') {
    // Large round curious eyes with gleam
    ctx.fillRect(8, 7, 2, 3);
    ctx.fillRect(14, 7, 2, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(8, 7, 1, 1);
    ctx.fillRect(14, 7, 1, 1);
    // Small dot mouth
    ctx.fillStyle = '#422040';
    ctx.fillRect(11, 12, 2, 1);
  } else if (expression === 'concerned') {
    // Soft worried eyes
    ctx.fillRect(8, 8, 3, 2);
    ctx.fillRect(13, 8, 3, 2);
    // Lowered eyebrows
    ctx.fillRect(7, 6, 3, 1);
    ctx.fillRect(14, 6, 3, 1);
    // Wavy soft mouth
    ctx.fillRect(10, 13, 4, 1);
  }

  ctx.restore();
}

// Draw Portrait for Dialogue Box
function drawPortrait(expression) {
  const pCanvas = document.getElementById('dialogue-portrait');
  const pCtx = pCanvas.getContext('2d');
  pCtx.clearRect(0, 0, 64, 64);
  pCtx.imageSmoothingEnabled = false;

  // Soft gradient backdrop
  const grad = pCtx.createLinearGradient(0, 0, 0, 64);
  grad.addColorStop(0, '#ffd6e0');
  grad.addColorStop(1, '#cdb4db');
  pCtx.fillStyle = grad;
  pCtx.fillRect(0, 0, 64, 64);

  // Big Nihi portrait
  pCtx.save();
  pCtx.translate(32, 36);
  pCtx.scale(2.2, 2.2);
  drawNihi(-12, -12, expression, 0);
  pCtx.restore();
}

// Draw Tileset
function drawTile(col, row, type) {
  const px = col * TILE_SIZE;
  const py = row * TILE_SIZE;

  switch (type) {
    case TILE.GRASS:
      // Soft sage pastel grass
      ctx.fillStyle = '#a6cfa8';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      // Subtle grass detail
      ctx.fillStyle = '#97c299';
      ctx.fillRect(px + 6, py + 8, 2, 3);
      ctx.fillRect(px + 20, py + 18, 3, 2);
      ctx.fillRect(px + 14, py + 24, 2, 2);
      break;

    case TILE.PATH:
      // Warm cobblestone path
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
      // Shimmering baby blue pond
      ctx.fillStyle = '#8ecae6';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      // Ripples
      const wave = Math.sin(Date.now() * 0.003 + col + row) * 2;
      ctx.fillStyle = '#bde0fe';
      ctx.fillRect(px + 4, py + 8 + wave, 10, 2);
      ctx.fillRect(px + 16, py + 20 - wave, 12, 2);
      // Lily pad
      if ((col + row) % 2 === 0) {
        ctx.fillStyle = '#639366';
        ctx.beginPath();
        ctx.arc(px + 14, py + 14, 5, 0, Math.PI * 1.8);
        ctx.fill();
        ctx.fillStyle = '#ff8ebb';
        ctx.fillRect(px + 13, py + 13, 2, 2);
      }
      break;

    case TILE.TREE:
      // Soft mystical sage trees
      ctx.fillStyle = '#a6cfa8';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      // Trunk
      ctx.fillStyle = '#7a4931';
      ctx.fillRect(px + 12, py + 16, 8, 16);
      // Foliage layers
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
      ctx.fillStyle = '#c5c9ce';
      ctx.beginPath();
      ctx.ellipse(px + 14, py + 16, 7, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      break;

    case TILE.FLOWER_FADED:
      // Before quest: faded, drooping flowers
      ctx.fillStyle = '#a6cfa8';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      if (state.quests.mirrorPcosDone) {
        // In full bloom!
        drawBloomingFlowerTile(px, py, col, row);
      } else {
        // Drooping faded blossom
        ctx.fillStyle = '#7a967c';
        ctx.fillRect(px + 15, py + 16, 2, 10);
        ctx.fillStyle = '#c9b1bd'; // Faded lavender
        ctx.beginPath();
        ctx.arc(px + 14, py + 18, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      break;

    case TILE.MIRROR:
      // The Shifting Ornate Mirror
      ctx.fillStyle = '#a6cfa8';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      // Gilded stand
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(px + 10, py + 22, 12, 8);
      ctx.fillRect(px + 8, py + 28, 16, 4);
      // Mirror Frame
      ctx.fillStyle = '#e8b948';
      ctx.fillRect(px + 6, py + 2, 20, 22);
      // Shifting glass reflection
      const shift = Math.sin(Date.now() * 0.002) * 0.5 + 0.5;
      const rGrad = ctx.createLinearGradient(px + 8, py + 4, px + 24, py + 22);
      rGrad.addColorStop(0, `rgba(255, 182, 193, ${0.7 + shift * 0.2})`);
      rGrad.addColorStop(0.5, `rgba(205, 180, 219, ${0.7 + shift * 0.2})`);
      rGrad.addColorStop(1, `rgba(189, 224, 254, ${0.7 + shift * 0.2})`);
      ctx.fillStyle = rGrad;
      ctx.fillRect(px + 8, py + 4, 16, 18);
      // Star gleam
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 10, py + 6, 2, 2);
      break;

    case TILE.HOUSE:
      // Lavender cottage
      ctx.fillStyle = '#a6cfa8';
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      // Walls
      ctx.fillStyle = '#d8b4e2';
      ctx.fillRect(px, py + 8, TILE_SIZE, TILE_SIZE - 8);
      // Roof tiles
      ctx.fillStyle = '#ff758f';
      ctx.fillRect(px, py, TILE_SIZE, 8);
      // Warm glowing window
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
      // Center water spout
      const spoutHeight = Math.sin(Date.now() * 0.006) * 3 + 6;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 15, py + 16 - spoutHeight, 3, spoutHeight);
      break;
  }
}

// Blooming Flower Garden Tile (When quests complete)
function drawBloomingFlowerTile(px, py, col, row) {
  // Stem & Leaves
  ctx.fillStyle = '#4f8553';
  ctx.fillRect(px + 15, py + 14, 2, 14);
  ctx.fillRect(px + 11, py + 20, 5, 2);
  ctx.fillRect(px + 17, py + 18, 5, 2);

  // Vibrant Blossom (Pink / Rose / Butter Yellow)
  const flowerColor = (col + row) % 2 === 0 ? '#ff659c' : '#ffd166';
  ctx.fillStyle = flowerColor;
  ctx.beginPath();
  ctx.arc(px + 16, py + 11, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fffcf2';
  ctx.beginPath();
  ctx.arc(px + 16, py + 11, 3, 0, Math.PI * 2);
  ctx.fill();

  // Floating sparkle chance
  if (Math.random() < 0.04) {
    addSparkle(px + 10 + Math.random() * 12, py + 6 + Math.random() * 8, flowerColor);
  }
}

// Draw Floating Collectibles
function drawCollectible(item) {
  if (item.collected) return;
  const px = item.tileX * TILE_SIZE;
  const py = item.tileY * TILE_SIZE;
  const bob = Math.sin(Date.now() * 0.005 + item.tileX) * 4;

  // Glowing halo
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.beginPath();
  ctx.arc(px + 16, py + 16 + bob, 14, 0, Math.PI * 2);
  ctx.fill();

  // Item icon background
  ctx.fillStyle = item.color;
  ctx.beginPath();
  ctx.arc(px + 16, py + 16 + bob, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#52304d';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Cute item glint
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(px + 13, py + 13 + bob, 3, 3);
}

// Particle System
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

// Dynamic Fog Shader for the Foggy Forest
function drawFoggyForestOverlay() {
  if (state.quests.fogDissolved >= 1.0) return;

  const fogStrength = 1.0 - state.quests.fogDissolved;
  const time = Date.now() * 0.001;

  ctx.save();
  // Fog covers the right side: columns 15 to 19
  const fogStartX = 14 * TILE_SIZE;
  const fogWidth = CANVAS_WIDTH - fogStartX;

  const fogGrad = ctx.createLinearGradient(fogStartX - 20, 0, CANVAS_WIDTH, 0);
  fogGrad.addColorStop(0, 'rgba(230, 240, 250, 0)');
  fogGrad.addColorStop(0.3, `rgba(215, 230, 245, ${0.5 * fogStrength})`);
  fogGrad.addColorStop(1, `rgba(220, 235, 250, ${0.88 * fogStrength})`);

  ctx.fillStyle = fogGrad;
  ctx.fillRect(fogStartX - 20, 0, fogWidth + 20, CANVAS_HEIGHT);

  // Swirling mist clouds
  ctx.fillStyle = `rgba(255, 255, 255, ${0.35 * fogStrength})`;
  for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
    const driftX = Math.sin(time + y * 0.1) * 16;
    ctx.beginPath();
    ctx.ellipse(fogStartX + 50 + driftX, y + 20, 60, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(fogStartX + 120 - driftX, y + 30, 50, 20, 0, 0, Math.PI * 2);
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
  // Solid obstacles: Tree, Rock, Water, Mirror, House
  return (
    tile === TILE.TREE ||
    tile === TILE.ROCK ||
    tile === TILE.WATER ||
    tile === TILE.MIRROR ||
    tile === TILE.HOUSE
  );
}

function checkObstacleCollision(newX, newY) {
  // Player bounding box (inset for natural depth)
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
      if (isSolidTile(c, r)) {
        return true;
      }
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

  // Normalize diagonal speed
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

    // Try horizontal move
    if (dx !== 0 && !checkObstacleCollision(state.player.x + dx, state.player.y)) {
      state.player.x += dx;
    }
    // Try vertical move
    if (dy !== 0 && !checkObstacleCollision(state.player.x, state.player.y + dy)) {
      state.player.y += dy;
    }
  }

  // Keep player inside map boundaries
  state.player.x = Math.max(TILE_SIZE, Math.min(state.player.x, (MAP_COLS - 2) * TILE_SIZE));
  state.player.y = Math.max(TILE_SIZE, Math.min(state.player.y, (MAP_ROWS - 2) * TILE_SIZE));
}

// Update Companion Nihi AI (Smooth following with playful offset)
function updateNihiAI() {
  state.nihi.floatAngle += 0.04;

  if (state.screen === 'playing') {
    // Nihi hovers slightly behind the player based on direction
    let offsetX = -24;
    let offsetY = -8;
    if (state.player.dir === 'left') offsetX = 28;
    if (state.player.dir === 'right') offsetX = -28;
    if (state.player.dir === 'up') offsetY = 24;
    if (state.player.dir === 'down') offsetY = -24;

    state.nihi.targetX = state.player.x + offsetX;
    state.nihi.targetY = state.player.y + offsetY;

    // Smooth lerp towards target
    const distX = state.nihi.targetX - state.nihi.x;
    const distY = state.nihi.targetY - state.nihi.y;
    const dist = Math.hypot(distX, distY);

    if (dist > 4) {
      state.nihi.x += distX * 0.08;
      state.nihi.y += distY * 0.08;
    }
  }
}

// Check Collectibles Proximity
function checkCollectiblesPickup() {
  const playerCenterX = state.player.x + state.player.width / 2;
  const playerCenterY = state.player.y + state.player.height / 2;

  floraCollectibles.forEach((item, index) => {
    if (item.collected) return;
    const itemCenterX = item.tileX * TILE_SIZE + TILE_SIZE / 2;
    const itemCenterY = item.tileY * TILE_SIZE + TILE_SIZE / 2;

    const dist = Math.hypot(playerCenterX - itemCenterX, playerCenterY - itemCenterY);
    if (dist < 26) {
      item.collected = true;
      state.inventory.items.push(item);
      window.soundEngine.playPickup();

      // Burst sparkles
      for (let s = 0; s < 12; s++) {
        addSparkle(itemCenterX, itemCenterY, item.color);
      }

      updateInventoryHUD();
      showItemPickupDialogue(item);
    }
  });
}

// Check Nearby Interactables & Prompt
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

  // Also check if near Nihi
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
// 6. DIALOGUE & INTERACTIVE STORYLINE SYSTEM
// ============================================================================
const dialogueEl = document.getElementById('dialogue-box');
const dialogueTextEl = document.getElementById('dialogue-text');
const dialogueChoicesEl = document.getElementById('dialogue-choices');
const speakerTagEl = document.getElementById('speaker-name');

let currentDialogueTree = null;
let currentDialogueNode = null;

function showDialogue(node, speaker = 'Nihi', expression = 'thoughtful') {
  state.screen = 'dialogue';
  dialogueEl.classList.remove('hidden');
  speakerTagEl.textContent = speaker;
  drawPortrait(expression);
  state.nihi.expression = expression;

  currentDialogueNode = node;
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
    btn.textContent = 'Continue (Press Space or Click) 🌸';
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
  state.nihi.expression = 'happy';
  showDialogue(
    {
      text: `Found ${item.name}! "${item.lore}"`,
      choices: [
        {
          text: 'Place gently in pocket ✨',
          action: () => {
            if (state.inventory.items.length >= 3 && state.quests.current === 'collect_flora') {
              state.quests.current = 'mirror_pcos';
              updateQuestHUD('Visit the Shifting Mirror', 'Take your 3 gathered flora to the ornate mirror.');
            }
          }
        }
      ]
    },
    'Pocket Find',
    'happy'
  );
}

// Meet Nihi Initial Intro
function startIntroDialogue() {
  showDialogue(
    {
      text: 'Nihi looks up with curious eyes: "Hello, traveler! The garden has felt so quiet lately... some flowers have faded and the paths feel heavy. Will you help me explore and listen to what the garden is saying?"',
      choices: [
        {
          text: '"I\'d love to walk with you, Nihi."',
          expression: 'happy',
          next: {
            text: 'Nihi sparkles: "Thank you! Let\'s begin by exploring the garden paths and collecting 3 special flora sprouts scattered around."',
            choices: [
              {
                text: '"Let\'s look around!"',
                action: () => {
                  state.quests.current = 'collect_flora';
                  updateQuestHUD('Collect 3 Garden Flora', 'Search the garden for the Dewdrop, Chamomile & Sunstone sprouts.');
                }
              }
            ]
          }
        },
        {
          text: '"What do you mean by \'listening\'?"',
          expression: 'thoughtful',
          next: {
            text: 'Nihi nods gently: "Our bodies and feelings are always sending quiet signals. Sometimes we ignore them or judge ourselves. Here, we practice listening with patience."',
            choices: [
              {
                text: '"That sounds like a relief. Let\'s explore."',
                action: () => {
                  state.quests.current = 'collect_flora';
                  updateQuestHUD('Collect 3 Garden Flora', 'Search the garden for the Dewdrop, Chamomile & Sunstone sprouts.');
                }
              }
            ]
          }
        }
      ]
    },
    'Nihi',
    'thoughtful'
  );
}

// Direct Talk with Nihi
function handleNihiDirectDialogue() {
  if (state.quests.current === 'meet_nihi') {
    startIntroDialogue();
  } else if (state.quests.current === 'collect_flora') {
    const left = 3 - state.inventory.items.length;
    showDialogue(
      {
        text: `Nihi checks your pocket: "You've gathered ${state.inventory.items.length}/3 flora! Look around the stone paths and quiet corners. Take your time, there is no rush at all."`,
        choices: [{ text: '"I\'ll keep looking!"' }]
      },
      'Nihi',
      'happy'
    );
  } else if (state.quests.current === 'mirror_pcos') {
    showDialogue(
      {
        text: 'Nihi looks toward the ornate glass: "The Shifting Mirror in the northwest grove is shimmering. It seems to reflect our feelings about our bodies."',
        choices: [{ text: '"Let\'s visit the mirror."' }]
      },
      'Nihi',
      'thoughtful'
    );
  } else if (state.quests.current === 'postpartum_house') {
    showDialogue(
      {
        text: 'Nihi looks toward the lavender cottage: "The porch of the Tired Moon looks so cozy, yet so tired. Let\'s check in on the new parent resting there."',
        choices: [{ text: '"Let\'s head over gently."' }]
      },
      'Nihi',
      'concerned'
    );
  } else if (state.quests.current === 'foggy_forest') {
    showDialogue(
      {
        text: 'Nihi gently holds your hand: "The eastern forest is wrapped in mist. My chest feels a little fluttery... but we can do a grounding breath together."',
        choices: [{ text: '"We\'re in this together, Nihi."' }]
      },
      'Nihi',
      'concerned'
    );
  } else {
    showDialogue(
      {
        text: 'Nihi beams with warmth: "The entire garden is bleuming! Thank you for reminding everyone that you don\'t have to be like anyone else to deserve care."',
        choices: [{ text: '"I\'m so glad we did this, Nihi."' }]
      },
      'Nihi',
      'happy'
    );
  }
}

// ============================================================================
// 7. HEALTH-RELATED STORY EXPERIENCES
// ============================================================================

// ----------------------------------------------------------------------------
// EXPERIENCE A: The Changing Garden — PCOS / Hormonal Awareness
// ----------------------------------------------------------------------------
function handleMirrorInteraction() {
  if (state.quests.current === 'collect_flora') {
    showDialogue(
      {
        text: 'The ornate mirror reflects soft, hazy waves. Nihi whispers: "The mirror is dormant right now. It looks like it will awaken once we gather 3 healing flora from the garden paths!"',
        choices: [{ text: '"Understood! Let\'s collect the flora first."' }]
      },
      'Shifting Mirror',
      'thoughtful'
    );
    return;
  }

  if (state.quests.mirrorPcosDone) {
    showDialogue(
      {
        text: 'The mirror shines with clear, peaceful light. Roses bloom around its frame. "You helped someone replace harsh self-criticism with patient, practical doctor questions."',
        choices: [{ text: 'Gaze into the clear reflection ✨' }]
      },
      'Shifting Mirror',
      'happy'
    );
    return;
  }

  // Active PCOS Quest Scene
  showDialogue(
    {
      text: 'As you place the 3 flora near the mirror, the glass reflects a troubled garden spirit looking frustrated: "My body keeps shifting... unpredictable cycles, sudden exhaustion, skin flare-ups. I keep comparing myself to others and feeling like my body is broken."',
      choices: [
        {
          text: '"Your body isn\'t broken; it is sending you signals."',
          expression: 'thoughtful',
          next: {
            text: 'The spirit breathes deeply: "Really? It feels so lonely when everyone acts like their cycles and energy are effortless clockwork."',
            choices: [
              {
                text: '"PCOS and hormonal rhythms are diverse. No two bodies are identical."',
                expression: 'happy',
                next: {
                  text: 'The spirit nods with relief: "I want to speak with a healthcare provider, but I always freeze and don\'t know what to ask. Could you help me prepare a question card?"',
                  choices: [
                    {
                      text: '✨ Help prepare Doctor Visit Questions ✨',
                      action: () => openDoctorQuestionsModal()
                    }
                  ]
                }
              }
            ]
          }
        },
        {
          text: '"It\'s completely understandable to feel frustrated when changes happen."',
          expression: 'concerned',
          next: {
            text: 'The spirit looks relieved: "Thank you for validating that. Sometimes people give superficial advice like \'just drink green tea\', which makes me feel unheard."',
            choices: [
              {
                text: '"Real medical support starts with taking your real symptoms seriously."',
                next: {
                  text: 'The spirit smiles softly: "Can we prepare a list of clear, neutral questions to bring to my doctor?"',
                  choices: [
                    {
                      text: '✨ Open Doctor Visit Question Builder ✨',
                      action: () => openDoctorQuestionsModal()
                    }
                  ]
                }
              }
            ]
          }
        }
      ]
    },
    'Garden Spirit',
    'concerned'
  );
}

// Doctor Questions Mini-Game Modal Setup
const pcosQuestionsPool = [
  {
    id: 'cycle',
    title: 'Irregular Rhythm & Cycle Timing',
    desc: '"Could we investigate hormonal panels or ultrasound to understand why my cycles fluctuate?"'
  },
  {
    id: 'fatigue',
    title: 'Persistent Energy Dips & Insulin Sensitivity',
    desc: '"I notice deep fatigue after meals. Could we evaluate metabolic markers or glucose response?"'
  },
  {
    id: 'skin_hair',
    title: 'Androgen Signals (Acne & Hair Changes)',
    desc: '"Are there hormonal or dermatological treatments suited specifically for my androgen levels?"'
  },
  {
    id: 'tracking',
    title: 'Effective Symptom Tracking Without Stress',
    desc: '"What specific 3 signals should I log over 2 months that will be most useful for our next visit?"'
  }
];

let selectedQuestionIds = [];

function openDoctorQuestionsModal() {
  state.screen = 'modal';
  const modal = document.getElementById('modal-questions');
  modal.classList.remove('hidden');

  selectedQuestionIds = [];
  const container = document.getElementById('questions-checklist');
  container.innerHTML = '';

  pcosQuestionsPool.forEach(q => {
    const item = document.createElement('div');
    item.className = 'question-check-item';
    item.dataset.id = q.id;
    item.innerHTML = `
      <div class="question-check-box"></div>
      <div class="question-text-group">
        <div class="question-text-title">${q.title}</div>
        <div class="question-text-desc">${q.desc}</div>
      </div>
    `;
    item.onclick = () => toggleQuestionPick(q.id, item);
    container.appendChild(item);
  });

  updateQuestionSaveButton();
}

function toggleQuestionPick(id, el) {
  window.soundEngine.playSelect();
  if (selectedQuestionIds.includes(id)) {
    selectedQuestionIds = selectedQuestionIds.filter(x => x !== id);
    el.classList.remove('selected');
    el.querySelector('.question-check-box').textContent = '';
  } else {
    if (selectedQuestionIds.length < 3) {
      selectedQuestionIds.push(id);
      el.classList.add('selected');
      el.querySelector('.question-check-box').textContent = '✓';
    }
  }
  updateQuestionSaveButton();
}

function updateQuestionSaveButton() {
  const btn = document.getElementById('btn-save-questions');
  const count = document.getElementById('question-pick-count');
  count.textContent = `${selectedQuestionIds.length}/3 Selected`;
  btn.disabled = (selectedQuestionIds.length < 2);
}

function completePcosQuest() {
  document.getElementById('modal-questions').classList.add('hidden');
  state.quests.mirrorPcosDone = true;
  state.quests.current = 'postpartum_house';

  // Save selected questions into Journal
  state.savedQuestions = selectedQuestionIds.map(id => pcosQuestionsPool.find(q => q.id === id));
  renderSavedQuestionsInJournal();

  window.soundEngine.playBloomFanfare();

  // Burst flowers and sparkles!
  for (let i = 0; i < 30; i++) {
    addSparkle(3 * TILE_SIZE + Math.random() * 64, 3 * TILE_SIZE + Math.random() * 64, '#ff659c');
  }

  showDialogue(
    {
      text: 'The Shifting Mirror glows with soft pastel clarity! Surrounding flower beds burst into radiant pink and rose blossoms. The spirit beams: "Having my questions written down makes me feel ready and respected. Thank you!"',
      choices: [
        {
          text: '"You deserve answers without guilt. Take good care!"',
          action: () => {
            updateQuestHUD(
              'Visit the Porch of the Tired Moon',
              'Walk southeast to the cozy lavender cottage with the warm lantern.'
            );
          }
        }
      ]
    },
    'Garden Spirit',
    'happy'
  );
}

// ----------------------------------------------------------------------------
// EXPERIENCE B: The Tired Moon — Postpartum Wellbeing
// ----------------------------------------------------------------------------
function handleHouseInteraction() {
  if (!state.quests.mirrorPcosDone) {
    showDialogue(
      {
        text: 'The cottage porch has a soft rocking chair and a sleeping nursery chime. "A new mother is resting inside. Let\'s attend to the Shifting Mirror first before stopping by."',
        choices: [{ text: '"Let\'s visit the mirror first."' }]
      },
      'Porch of Tired Moon',
      'thoughtful'
    );
    return;
  }

  if (state.quests.postpartumDone) {
    showDialogue(
      {
        text: 'The cottage window glows with warm golden light. A small cup of chamomile tea rests on the veranda table beside a warm note: "Thank you for reminding me that asking for help is an act of love."',
        choices: [{ text: 'Smile at the peaceful cottage 💖' }]
      },
      'Porch of Tired Moon',
      'happy'
    );
    return;
  }

  // Active Postpartum Scene
  showDialogue(
    {
      text: 'On the porch, a new parent named Maya sits with tired eyes and a soft rocking crib: "Everyone tells me this should be the happiest time of my life... but I feel overwhelmed, exhausted, and sometimes an empty sadness I can\'t explain. I feel so guilty for struggling."',
      choices: [
        {
          text: '"Postpartum depression and overwhelm are medical realities, not personal failures."',
          expression: 'concerned',
          next: {
            text: 'Maya looks up, eyes tearing up with relief: "I was terrified that feeling this way meant I was a bad mother. Hearing that it\'s medical and treatable lifts a huge boulder off my shoulders."',
            choices: [
              {
                text: '"Caregivers deserve care too. Reaching out is protective, not weak."',
                next: {
                  text: 'Maya touches her phone hesitantly: "My partner and family keep saying \'let me know if you need anything\', but I never know what to text without feeling burdensome. Could you help me draft a simple message?"',
                  choices: [
                    {
                      text: '💌 Help draft a gentle support message',
                      action: () => openPostpartumModal()
                    }
                  ]
                }
              }
            ]
          }
        },
        {
          text: '"You are carrying so much right now. Your feelings deserve warmth and listening."',
          expression: 'thoughtful',
          next: {
            text: 'Maya breathes: "Thank you. Sleep deprivation combined with hormone shifts has made everything so fragile. I want to ask for support today."',
            choices: [
              {
                text: '💌 Open Support Message Builder',
                action: () => openPostpartumModal()
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

const postpartumPresets = [
  {
    id: 'practical',
    title: 'Tangible Household Help',
    text: '"Hi! Things have felt really heavy and exhausting today. Could someone drop off a warm meal or watch the baby for an hour so I can take a shower and rest?"'
  },
  {
    id: 'emotional',
    title: 'Quiet Emotional Check-in',
    text: '"Hi... I\'m having a hard time emotionally right now. I don\'t need advice, just a trusted friend to sit with me and listen without judgment."'
  },
  {
    id: 'doctor',
    title: 'Scheduling Medical / Postpartum Check',
    text: '"Hello clinic, I would like to schedule a postpartum follow-up to discuss emotional wellbeing and postpartum depression screening with my doctor."'
  }
];

function openPostpartumModal() {
  state.screen = 'modal';
  const modal = document.getElementById('modal-postpartum');
  modal.classList.remove('hidden');

  const container = document.getElementById('message-presets');
  container.innerHTML = '';

  postpartumPresets.forEach((p, idx) => {
    const btn = document.createElement('button');
    btn.className = `msg-preset-btn ${idx === 0 ? 'active' : ''}`;
    btn.textContent = p.title;
    btn.onclick = () => {
      window.soundEngine.playSelect();
      container.querySelectorAll('.msg-preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('message-preview-text').textContent = p.text;
      state.selectedSupportMessage = p.text;
    };
    container.appendChild(btn);
  });

  state.selectedSupportMessage = postpartumPresets[0].text;
  document.getElementById('message-preview-text').textContent = postpartumPresets[0].text;
}

function completePostpartumQuest() {
  document.getElementById('modal-postpartum').classList.add('hidden');
  state.quests.postpartumDone = true;
  state.quests.current = 'foggy_forest';

  window.soundEngine.playBloomFanfare();

  // Burst floating hearts
  for (let h = 0; h < 16; h++) {
    addSparkle(13 * TILE_SIZE + Math.random() * 40, 4 * TILE_SIZE + Math.random() * 30, '#ff4d6d');
  }

  showDialogue(
    {
      text: 'Maya smiles softly as the message is sent: "A friend just replied with so much love—they\'re bringing dinner and taking the evening shift. Thank you for reminding me that I am allowed to be cared for."',
      choices: [
        {
          text: '"You are doing wonderfully. Rest gently, Maya."',
          action: () => {
            updateQuestHUD(
              'Journey to the Foggy Forest',
              'Head east into the misty woods to help Nihi navigate emotional overwhelm.'
            );
          }
        }
      ]
    },
    'Maya',
    'happy'
  );
}

// ----------------------------------------------------------------------------
// EXPERIENCE C: The Foggy Forest — Emotional Grounding & Overwhelm
// ----------------------------------------------------------------------------
function handleForestInteraction() {
  if (!state.quests.postpartumDone) {
    showDialogue(
      {
        text: 'Thick, swirling mist blankets the forest path. Nihi steps back: "The mist is too dense right now. Let\'s check on the cottage porch first before we venture into the thicket."',
        choices: [{ text: '"Good idea, let\'s visit Maya first."' }]
      },
      'Misty Thicket',
      'thoughtful'
    );
    return;
  }

  if (state.quests.forestDone) {
    showDialogue(
      {
        text: 'The forest clearing is illuminated by soft sunbeams! A rare pastel Heart Blossom blooms peacefully in the center where the fog once lingered.',
        choices: [{ text: 'Breathe the fresh, crisp woodland air 🌸' }]
      },
      'Woodland Clearing',
      'happy'
    );
    return;
  }

  // Active Forest Overwhelm Scene
  showDialogue(
    {
      text: 'The mist swirls thicker. Nihi pauses, ears drooping: "Everything feels so hazy and fast... my thoughts are spinning in circles. What if we make a mistake? What if I get stuck in this fog forever?"',
      choices: [
        {
          text: '"Let\'s stop right here. We do not have to push through panic."',
          expression: 'concerned',
          next: {
            text: 'Nihi breathes a shaky sigh: "You mean... we can just pause? We don\'t have to force our way through?"',
            choices: [
              {
                text: '"Exactly. Let\'s ground our senses together with 5-4-3-2-1."',
                next: {
                  text: 'Nihi nods gently: "Yes, please. Guide me through it."',
                  choices: [
                    {
                      text: '🌿 Begin Sensory Grounding Exercise 🌿',
                      action: () => openGroundingModal()
                    }
                  ]
                }
              }
            ]
          }
        },
        {
          text: '"Feel your feet on the path. The fog is just weather; it will pass."',
          expression: 'thoughtful',
          next: {
            text: 'Nihi blinks softly: "It helps to remember that feelings are like passing weather. Can we do a slow breath together?"',
            choices: [
              {
                text: '🌿 Start Grounding & Calming Breath',
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

// 5-4-3-2-1 Sensory Grounding Mini-Game
let groundingStep = 0;
const groundingSteps = [
  {
    title: 'Step 1: Notice 3 Soft Colors You Can See',
    hint: 'Click 3 pastel flowers to gently bring your focus back to the present moment.',
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
    hint: 'Tap 2 comforting textures (soft breeze, warm sweater).',
    targetTaps: 2,
    items: [
      { icon: '🍃', label: 'Cool Breeze' },
      { icon: '🧣', label: 'Warm Sweater' },
      { icon: '🪨', label: 'Firm Ground' },
      { icon: '💖', label: 'Steady Heartbeat' }
    ]
  },
  {
    title: 'Step 3: Acknowledge 1 Kind Thought for Yourself',
    hint: 'Select the supportive affirmation that honors your pace.',
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
          // Finished all 3 steps!
          document.getElementById('grounding-instruction').textContent =
            'Wonderful... your nervous system feels centered, and the fog is beginning to lift.';
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

  // Smooth fog clearing animation
  let dissolveInterval = setInterval(() => {
    state.quests.fogDissolved += 0.05;
    if (state.quests.fogDissolved >= 1.0) {
      state.quests.fogDissolved = 1.0;
      clearInterval(dissolveInterval);
    }
  }, 40);

  window.soundEngine.playBloomFanfare();

  // Burst rainbow sparkles across right side
  for (let s = 0; s < 40; s++) {
    addSparkle(
      15 * TILE_SIZE + Math.random() * (5 * TILE_SIZE),
      Math.random() * CANVAS_HEIGHT,
      '#a5d8ff'
    );
  }

  showDialogue(
    {
      text: 'The dense fog dissolves into golden sunbeams! Nihi smiles with sparkling eyes: "My chest feels open again. When we paused and noticed the world around us, the panic didn\'t control us anymore. Look—the entire garden is radiant!"',
      choices: [
        {
          text: '✨ Celebrate with Nihi! ✨',
          action: () => triggerGameFinale()
        }
      ]
    },
    'Nihi',
    'happy'
  );
}

// ----------------------------------------------------------------------------
// MISC COZY INTERACTIONS: Fountain & Bench
// ----------------------------------------------------------------------------
function handleFountainInteraction() {
  window.soundEngine.playTone(520, 0.4, 'sine', 0.08);
  showDialogue(
    {
      text: 'The water ripples musically against smooth river stones. Droplets sparkle in the sun. Nihi murmurs: "Water doesn\'t rush, yet it reaches everywhere. It\'s okay to move at your own pace."',
      choices: [{ text: '"A lovely reminder."' }]
    },
    'Garden Fountain',
    'thoughtful'
  );
}

function handleBenchInteraction() {
  window.soundEngine.playGroundingBell(2);
  showDialogue(
    {
      text: 'You sit down beside Nihi on the smooth cedar bench. A gentle breeze carries the scent of sweet chamomile. There is nothing you have to achieve in this moment. You are doing enough.',
      choices: [{ text: 'Rest peacefully for a moment 💖' }]
    },
    'Cedar Bench',
    'happy'
  );
}

// ----------------------------------------------------------------------------
// 8. FINALE & ENDING SCREEN
// ----------------------------------------------------------------------------
function triggerGameFinale() {
  state.screen = 'ending';
  document.getElementById('screen-ending').classList.remove('hidden');
  window.soundEngine.playBloomFanfare();

  // Draw celebration canvas
  const cCanvas = document.getElementById('ending-celebration-canvas');
  const cCtx = cCanvas.getContext('2d');
  cCtx.clearRect(0, 0, 200, 90);
  cCtx.imageSmoothingEnabled = false;

  // Background
  const grad = cCtx.createLinearGradient(0, 0, 0, 90);
  grad.addColorStop(0, '#ffe5ec');
  grad.addColorStop(1, '#cdb4db');
  cCtx.fillStyle = grad;
  cCtx.fillRect(0, 0, 200, 90);

  // Draw player & Nihi hugging/standing together
  cCtx.save();
  cCtx.translate(70, 30);
  drawPlayer(0, 0, 'down', 0, false);
  drawNihi(32, 0, 'happy', 0);
  cCtx.restore();

  // Sparkles
  cCtx.fillStyle = '#ff659c';
  cCtx.fillRect(30, 25, 4, 4);
  cCtx.fillRect(155, 30, 4, 4);
  cCtx.fillStyle = '#ffd166';
  cCtx.fillRect(45, 60, 3, 3);
  cCtx.fillRect(140, 55, 3, 3);
}

// ============================================================================
// 9. HUD, INVENTORY & JOURNAL MANAGEMENT
// ============================================================================
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
  // Check if all collectibles found
  if (state.quests.current === 'collect_flora' && state.inventory.items.length >= 3) {
    state.quests.current = 'mirror_pcos';
    updateQuestHUD('Visit the Shifting Mirror', 'Take your 3 gathered flora to the ornate mirror.');
  }
}

function renderSavedQuestionsInJournal() {
  const container = document.getElementById('saved-questions-list');
  if (state.savedQuestions.length === 0) {
    container.innerHTML = '<em>No questions saved yet. Complete the Mirror interaction in the garden!</em>';
    return;
  }

  let html = '<ul style="padding-left: 16px; margin-top: 6px;">';
  state.savedQuestions.forEach(q => {
    html += `<li style="margin-bottom: 6px;"><strong>${q.title}:</strong><br><span style="color: #6f4c6a;">${q.desc}</span></li>`;
  });
  html += '</ul>';

  if (state.selectedSupportMessage) {
    html += `<div style="margin-top: 10px; border-top: 1px dashed #d5c4e3; padding-top: 8px;"><strong>Saved Support Message:</strong><br><span style="color: #6f4c6a;">${state.selectedSupportMessage}</span></div>`;
  }

  container.innerHTML = html;
}

// Setup Journal Tabs
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
// 10. EVENT LISTENERS & INPUT HANDLING
// ============================================================================
function setupInput() {
  window.addEventListener('keydown', e => {
    // If modal or ending is active, let mouse/ESC handle
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

    // Dialogue progression with Space or Enter
    if (state.screen === 'dialogue') {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'e' || e.key === 'E') {
        const choiceBtns = dialogueChoicesEl.querySelectorAll('.dialogue-choice-btn');
        if (choiceBtns.length === 1) {
          choiceBtns[0].click();
        }
      }
      return;
    }

    // Movement
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') state.keys.up = true;
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') state.keys.down = true;
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') state.keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') state.keys.right = true;

    // Interaction
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

    // Start introductory dialogue with Nihi
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

  // Replay Button on Ending Screen
  document.getElementById('btn-replay').onclick = () => {
    document.getElementById('screen-ending').classList.add('hidden');
    state.screen = 'playing';
    updateQuestHUD('Free Exploration', 'The garden is completely in bloom. Stroll and enjoy peace.');
  };

  document.getElementById('btn-ending-journal').onclick = () => {
    toggleJournalModal();
  };

  // Titlebar controls
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

  // Modals Close buttons
  document.getElementById('close-modal-questions').onclick = () => {
    document.getElementById('modal-questions').classList.add('hidden');
    state.screen = 'playing';
  };
  document.getElementById('btn-save-questions').onclick = () => {
    completePcosQuest();
  };

  document.getElementById('close-modal-postpartum').onclick = () => {
    document.getElementById('modal-postpartum').classList.add('hidden');
    state.screen = 'playing';
  };
  document.getElementById('btn-send-support').onclick = () => {
    completePostpartumQuest();
  };

  document.getElementById('close-modal-grounding').onclick = () => {
    document.getElementById('modal-grounding').classList.add('hidden');
    state.screen = 'playing';
  };
  document.getElementById('btn-finish-grounding').onclick = () => {
    completeGroundingQuest();
  };

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
// 11. TITLE SCREEN PREVIEW ANIMATION
// ============================================================================
function drawTitlePreview() {
  const previewCanvas = document.getElementById('title-preview-canvas');
  if (!previewCanvas) return;
  const pCtx = previewCanvas.getContext('2d');
  pCtx.clearRect(0, 0, 160, 80);
  pCtx.imageSmoothingEnabled = false;

  // Background
  pCtx.fillStyle = '#fceef6';
  pCtx.fillRect(0, 0, 160, 80);

  // Soft grass mound
  pCtx.fillStyle = '#b5d8b7';
  pCtx.beginPath();
  pCtx.ellipse(80, 75, 70, 20, 0, 0, Math.PI * 2);
  pCtx.fill();

  // Draw player & Nihi
  pCtx.save();
  pCtx.translate(45, 30);
  drawPlayer(0, 0, 'down', Date.now() * 0.003, false);
  drawNihi(38, 0, 'happy', Date.now() * 0.003);
  pCtx.restore();

  // Decorative sparkles
  pCtx.fillStyle = '#ff8ebb';
  pCtx.fillRect(20, 20, 3, 3);
  pCtx.fillRect(135, 25, 3, 3);
}

// ============================================================================
// 12. MAIN GAME LOOP (60 FPS)
// ============================================================================
function gameLoop() {
  // 1. Update Game Physics & States
  updatePlayerMovement();
  updateNihiAI();
  checkCollectiblesPickup();
  updateInteractables();

  // 2. Clear & Render Map Tiles
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  for (let r = 0; r < MAP_ROWS; r++) {
    for (let c = 0; c < MAP_COLS; c++) {
      drawTile(c, r, defaultMap[r][c]);
    }
  }

  // 3. Render Collectibles
  floraCollectibles.forEach(item => drawCollectible(item));

  // 4. Render Characters in Y-sorted depth
  if (state.player.y < state.nihi.y) {
    drawPlayer(state.player.x, state.player.y, state.player.dir, state.player.frame, state.player.isMoving);
    drawNihi(state.nihi.x, state.nihi.y, state.nihi.expression, state.nihi.floatAngle);
  } else {
    drawNihi(state.nihi.x, state.nihi.y, state.nihi.expression, state.nihi.floatAngle);
    drawPlayer(state.player.x, state.player.y, state.player.dir, state.player.frame, state.player.isMoving);
  }

  // 5. Render Fog Shader & Sparkle Particles
  drawFoggyForestOverlay();
  updateAndDrawParticles();

  // 6. Title preview animation loop if on title
  if (state.screen === 'title') {
    drawTitlePreview();
  }

  requestAnimationFrame(gameLoop);
}

// ============================================================================
// 13. INITIALIZATION ON LOAD
// ============================================================================
window.addEventListener('load', () => {
  setupInput();
  setupJournalTabs();
  drawTitlePreview();
  requestAnimationFrame(gameLoop);
});

