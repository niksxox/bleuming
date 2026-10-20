/* Bleuming.exe hub and reusable CD-platformer. Keeps the existing Canvas 2D engine. */
window.BLEUMING_HUB_MODE = true;
(function () {
  'use strict';
  const SAVE_KEY = 'bleuming_exe_profile_v1';
  const canvas = document.getElementById('game-canvas');
  const gameCtx = canvas.getContext('2d');
  const hub = document.getElementById('bleuming-hub');
  const content = document.getElementById('hub-content');
  const petCanvas = document.getElementById('pet-preview');
  const petCtx = petCanvas.getContext('2d');
  const levelUI = document.getElementById('level-ui');
  const levelModal = document.getElementById('level-modal');
  const BASE_PROFILE = {
    version: 1, unlockedWorlds: ['petalbyte'], completed: [], inventory: [],
    bests: {}, relationship: 0, companionPromptSeen: false, companionPromptDisabled: false, preferences: { theme: 'sugar', activities: ['platform', 'memory', 'rhythm'], difficulty: 'relaxed', story: [], wellbeing: false, aiPersonalization: false, aiChat: false },
    equipped: { nihi: 'none', player: 'pink', wallpaper: 'sugar' },
    cosmetics: ['pink'], room: { decor: ['starter-poster'] }, memoryBest: 0, rhythmBest: 0
  };
  let profile = loadProfile();
  let firstBoot = false;
  try { firstBoot=!localStorage.getItem(SAVE_KEY); } catch (_) { firstBoot=false; }
  let page = 'home';
  let mode = 'hub';
  let lastTime = 0;
  let hubTime = 0;
  let level = null;
  let player = null;
  let cameraX = 0;
  let levelFrame = 0;
  let lastCheckpoint = 0;
  let currentWorldId = '';
  let nihiReaction = 0;
  let rhythm = null;
  let memory = null;
  let currentActivity = 'platform';
  let levelRequestToken = 0;
  let groundingStep = 0;
  const keys = Object.create(null);

  const WORLD_TEMPLATES = {
    petalbyte: {
      worldId: 'petalbyte', theme: 'sugar', layoutId: 'petalbyte_run', title: 'Petalbyte Woods', difficulty: 'relaxed',
      narrativeIntro: 'A star signal is blinking between the flowers. Nihi is already chasing it.', reward: 'petal-bow',
      width: 1780, spawn: { x: 46, y: 382 }, goal: { x: 1690, y: 380, w: 42, h: 60 }, required: 6,
      platforms: [[0,430,1780,50],[180,365,112,16],[365,320,105,16],[585,365,116,16],[790,310,110,16],[1018,360,116,16],[1230,300,116,16],[1450,360,110,16]],
      collectibles: [[133,386],[235,321],[414,276],[640,321],[842,266],[1070,316],[1285,256],[1500,316]],
      hazards: [[300,416,35,14],[535,416,38,14],[950,416,38,14],[1170,416,40,14],[1395,416,38,14]], checkpoints: [620,1160]
    },
    moonmall: {
      worldId: 'moonmall', theme: 'moon', layoutId: 'moonmall_hops', title: 'Moon Mall After Hours', difficulty: 'standard',
      narrativeIntro: 'The mall lights are asleep. Collect the little moon-beads to wake the neon signs.', reward: 'moon-crown',
      width: 1980, spawn: { x: 44, y: 382 }, goal: { x: 1880, y: 378, w: 44, h: 62 }, required: 7,
      platforms: [[0,430,1980,50],[145,365,105,16],[330,305,115,16],[535,365,108,16],[755,305,110,16],[980,350,112,16],[1190,285,110,16],[1408,350,110,16],[1630,300,112,16]],
      collectibles: [[90,386],[190,321],[375,261],[580,321],[800,261],[1024,306],[1235,241],[1452,306],[1670,256]],
      hazards: [[270,416,37,14],[478,416,40,14],[705,416,39,14],[912,416,38,14],[1130,416,42,14],[1350,416,38,14],[1575,416,42,14]], checkpoints: [680,1280]
    }
  };
  const THEMES = {
    sugar: { sky1: '#d6f1ed', sky2: '#fff0ce', ground: '#7da976', accent: '#f19ac2', platform: '#f8dcb4', outline: '#493044' },
    moon: { sky1: '#8b86c9', sky2: '#e3bbdc', ground: '#514b82', accent: '#ffe184', platform: '#b7c4ff', outline: '#302541' },
    neon: { sky1: '#555b9c', sky2: '#e69acf', ground: '#556d8e', accent: '#8ff3e1', platform: '#f8c4e6', outline: '#302541' },
    mint: { sky1: '#c4efdc', sky2: '#eef3c4', ground: '#6a9e84', accent: '#f4a8c8', platform: '#f7e4ad', outline: '#493044' },
    lavender: { sky1: '#cbc4f5', sky2: '#f4d6ed', ground: '#716c9f', accent: '#ffe28f', platform: '#fff0ce', outline: '#493044' }
  };
  const ACTIVITY_LABELS = { platform: 'Platform worlds', memory: 'Pattern puzzles', rhythm: 'Rhythm games', collecting: 'Collecting & albums' };
  const lines = {
    hello: ['The desktop smells like warm plastic and one tiny adventure.', 'I put a sticker on the portal. It is load-bearing. Probably.', 'Ready when you are. I have been practicing my dramatic entrance.'],
    boop: ['Boop received. Nihi.exe has become 4% more sparkly.', 'That was my snoot! I shall boop you back. In spirit.', 'A perfect boop. I am saving it to my invisible scrapbook.'],
    collect: ['Ooh, a shiny! Into the album it goes.', 'My little signal is doing a happy wiggle!', 'Treasure acquired. My pockets are mostly imaginary.']
  };

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function loadProfile() {
    try {
      const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
      if (!raw || raw.version !== 1) {
        const migrated=clone(BASE_PROFILE);
        try {
          const legacy=JSON.parse(localStorage.getItem('bleuming_save_v1')||'null');
          const prior=Array.isArray(legacy?.inventory)?legacy.inventory:[];
          const found=prior.filter(id=>['dewdrop','chamomile','sunstone'].includes(id)).length;
          for(let i=0;i<found;i++)migrated.inventory.push('star-fragment');
          migrated.relationship=Number.isFinite(legacy?.world?.relationship)?Math.max(0,Math.min(999,legacy.world.relationship)):0;
        } catch (_) { /* Ignore malformed legacy data and keep the safe defaults. */ }
        return migrated;
      }
      const p = clone(BASE_PROFILE);
      p.unlockedWorlds = Array.isArray(raw.unlockedWorlds) ? raw.unlockedWorlds.filter(x => ['petalbyte','moonmall'].includes(x)) : p.unlockedWorlds;
      if (!p.unlockedWorlds.includes('petalbyte')) p.unlockedWorlds.unshift('petalbyte');
      p.completed = Array.isArray(raw.completed) ? raw.completed.filter(x => ['petalbyte','moonmall'].includes(x)) : [];
      p.inventory = Array.isArray(raw.inventory) ? raw.inventory.filter(x => ['star-fragment','moon-bead'].includes(x)).slice(0,100) : [];
      p.bests = {};
      if(raw.bests&&typeof raw.bests==='object')for(const id of ['petalbyte','moonmall'])if(Number.isFinite(raw.bests[id])&&raw.bests[id]>=0)p.bests[id]=Math.min(99999,Math.floor(raw.bests[id]));
      p.relationship = Number.isFinite(raw.relationship) ? Math.max(0,Math.min(999,raw.relationship)) : 0;
      p.companionPromptSeen=!!raw.companionPromptSeen;p.companionPromptDisabled=!!raw.companionPromptDisabled;
      p.preferences = Object.assign(p.preferences, raw.preferences && typeof raw.preferences === 'object' ? raw.preferences : {});
      if (!['sugar','moon','neon','mint','lavender'].includes(p.preferences.theme)) p.preferences.theme='sugar';
      if (!['relaxed','standard','challenge'].includes(p.preferences.difficulty)) p.preferences.difficulty='relaxed';
      p.preferences.activities = Array.isArray(p.preferences.activities) ? p.preferences.activities.filter(x=>Object.hasOwn(ACTIVITY_LABELS,x)) : clone(BASE_PROFILE.preferences.activities);
      p.preferences.story = Array.isArray(p.preferences.story) ? p.preferences.story.filter(x=>['friendship','mysteries','self-expression','wellbeing','pcos-pcod','postpartum'].includes(x)) : [];
      p.preferences.wellbeing = !!p.preferences.wellbeing;
      p.preferences.aiPersonalization = !!p.preferences.aiPersonalization;
      p.preferences.aiChat = !!p.preferences.aiChat;
      p.cosmetics = Array.isArray(raw.cosmetics) ? Array.from(new Set(['pink',...raw.cosmetics.filter(x=>['mint','lavender','petal-bow','pixel-visor','moon-crown','star-clip'].includes(x))])) : p.cosmetics;
      if(raw.equipped&&typeof raw.equipped==='object'){
        p.equipped.player=['pink','mint','lavender'].includes(raw.equipped.player)?raw.equipped.player:'pink';
        p.equipped.nihi=['none','petal-bow','pixel-visor','moon-crown','star-clip'].includes(raw.equipped.nihi)&&(['none'].includes(raw.equipped.nihi)||p.cosmetics.includes(raw.equipped.nihi))?raw.equipped.nihi:'none';
        p.equipped.wallpaper=THEMES[raw.equipped.wallpaper]?raw.equipped.wallpaper:p.preferences.theme;
      }
      p.room={decor:Array.isArray(raw.room?.decor)?Array.from(new Set(raw.room.decor.filter(x=>['starter-poster','petal-poster','moon-lamp','rhythm-trophy'].includes(x)))):['starter-poster']};
      p.memoryBest = Number.isInteger(raw.memoryBest) ? Math.max(0,Math.min(3,raw.memoryBest)) : 0;
      p.rhythmBest = Number.isInteger(raw.rhythmBest) ? Math.max(0,Math.min(12,raw.rhythmBest)) : 0;
      return p;
    } catch (error) { console.error('Saved game data was unreadable; starting a safe new local profile.', error); return clone(BASE_PROFILE); }
  }
  function save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(profile)); document.getElementById('hub-save-status').textContent='Saved on this device'; }
    catch (error) { console.error('Bleuming could not save this device profile.', error); document.getElementById('hub-save-status').textContent='Save unavailable'; }
  }
  function status(message) { document.getElementById('hub-status-message').textContent=message; }
  function choose(list) { return list[Math.floor(Math.random()*list.length)]; }
  let nihiExpression='idle';
  const NIHI_ROWS={idle:0,playful:1,happy:1,supportive:2,curious:3,calm:3,excited:4};
  function say(line,expression='happy') { document.getElementById('hub-pet-line').textContent=line;nihiExpression=expression;nihiReaction=130; }
  function awardBond(amount) { const before=profile.relationship;profile.relationship=Math.min(999,profile.relationship+amount);if(before<5&&profile.relationship>=5)unlock('star-clip');save();return before<5&&profile.relationship>=5; }
  function hasActivity(id) { return profile.preferences.activities.includes(id); }
  function showModal(html) { document.getElementById('hub-modal-content').innerHTML=html; document.getElementById('hub-modal').classList.remove('hidden'); }
  function closeModal() { document.getElementById('hub-modal').classList.add('hidden'); }
  function showGroundingStep() {
    const steps=[['Look around softly','Notice three colors or tiny details nearby. Nothing needs to change.'],['Listen for a moment','Notice two sounds, near or far. You can keep your eyes open.'],['Feel supported','Notice one comfortable point of contact, like your feet on the floor.']];
    if(groundingStep>=steps.length){closeModal();groundingStep=0;status('Tiny pause complete. No notes were saved or shared.');return;}
    const [title,copy]=steps[groundingStep];showModal(`<div class="hub-eyebrow">OPTIONAL LITTLE PAUSE • NOTHING IS RECORDED</div><h2 class="hub-heading">${title}</h2><p class="hub-subtitle">${copy}</p><div class="hub-action-row"><button class="hub-card-button lavender" data-action="grounding-close">Skip</button><button class="hub-card-button" data-action="grounding-next">${groundingStep===2?'Done':'Next'}</button></div>`);
  }
  function showCompanionChoices() {
    profile.companionPromptSeen=true;save();
    showModal(`<div class="hub-eyebrow">A TINY DESKTOP HELLO</div><h2 class="hub-heading">Hey, you’re here. What sounds good?</h2><p class="hub-subtitle">No mood check, no explanation needed. Pick a thing or close this window.</p><div class="hub-choice-list"><button class="hub-choice" data-action="choice-play"><strong>▶ Let’s play</strong><span>Jump into a CD or quick arcade round.</span></button><button class="hub-choice" data-action="choice-calm"><strong>☁ Something calm</strong><span>Wander through a quiet, goal-free pixel meadow.</span></button><button class="hub-choice" data-action="choice-talk"><strong>♡ Let’s talk</strong><span>Chat with Nihi. You can leave any time.</span></button><button class="hub-choice" data-action="choice-encourage"><strong>✦ A little encouragement</strong><span>Open a small, dismissible note.</span></button><button class="hub-choice" data-action="choice-explore"><strong>⌂ Just let me explore</strong><span>Close this and keep browsing your desktop.</span></button></div><label class="hub-pref hub-prompt-optout"><input type="checkbox" id="companion-prompt-disable" ${profile.companionPromptDisabled?'checked':''}><span>Don’t show this hello automatically again</span></label>`);
  }
  function maybeShowCompanionChoices() { if(!profile.companionPromptSeen&&!profile.companionPromptDisabled)showCompanionChoices(); }
  function showEncouragement(index) {
    const cards=['You are allowed to take things one step at a time.','Your worth is not measured by how much you finish.','You do not have to feel confident to deserve kindness.','Rest is not a reward you have to earn.'];
    const i=((index||0)%cards.length+cards.length)%cards.length;
    showModal(`<div class="hub-eyebrow">A NOTE FROM THE DESKTOP</div><h2 class="hub-heading">${cards[i]}</h2><p class="hub-subtitle">Just a note. Nothing to do with it.</p><div class="hub-action-row"><button class="hub-card-button lavender" data-action="encourage-next" data-index="${i+1}">Another note</button><button class="hub-card-button mint" data-action="choice-explore">Back to the desktop</button></div>`);
  }
  function startCalm() {
    closeModal();mode='calm';state.screen='calm';calmX=0;
    hub.classList.add('hidden');document.getElementById('desktop-container').inert=true;
    document.body.classList.add('calm-mode');
    document.getElementById('calm-ui').classList.remove('hidden');
    document.getElementById('calm-sound').textContent=window.soundEngine.isMuted?'♫ Sound off':'♫ Sound on';
    window.soundEngine.ensureContext();window.soundEngine.startBgm();say('A quiet meadow. We can wander, or simply look around.','calm');
  }
  let calmX=0;
  function drawCalm() {
    const g=gameCtx;g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,640,480);
    const sky=g.createLinearGradient(0,0,0,480);sky.addColorStop(0,'#b9d8ef');sky.addColorStop(.65,'#f1d8ec');sky.addColorStop(1,'#fff0d2');g.fillStyle=sky;g.fillRect(0,0,640,480);
    for(let i=0;i<12;i++){const x=((i*101-calmX*.12)%740+740)%740-50,y=70+(i*43)%115;g.fillStyle='rgba(255,255,255,.44)';g.beginPath();g.ellipse(x,y,35,9,0,0,Math.PI*2);g.fill();}
    g.fillStyle='#a6c5aa';g.beginPath();g.moveTo(0,350);for(let x=0;x<=640;x+=32)g.lineTo(x,330+Math.sin((x+calmX*.15)*.012)*23);g.lineTo(640,480);g.lineTo(0,480);g.fill();
    g.fillStyle='#709681';g.beginPath();g.moveTo(0,395);for(let x=0;x<=640;x+=24)g.lineTo(x,380+Math.sin((x+calmX*.32)*.017)*18);g.lineTo(640,480);g.lineTo(0,480);g.fill();
    for(let i=0;i<30;i++){const x=((i*83-calmX*.55)%700+700)%700-30,y=345+(i*37)%110;g.fillStyle=['#f4c0da','#f7e6a7','#d8cbf5'][i%3];g.fillRect(x,y,4,4);g.fillRect(x+1,y-3,2,3);}
    const animTime=reducedMotion()?0:hubTime;
    for(let i=0;i<8;i++){const x=(i*87+Math.sin(animTime*.025+i)*18+640)%640,y=170+(i*31)%130+Math.sin(animTime*.03+i)*8;g.fillStyle='rgba(255,250,194,.82)';g.fillRect(x,y,3,3);}
    drawGameNihi(g,Math.max(20,Math.min(600,calmX+280)),310,THEMES.sugar);
  }

  function renderPet() {
    document.getElementById('hub-grounding').classList.toggle('hidden',!profile.preferences.wellbeing);
    document.getElementById('hub-mood').textContent=profile.relationship>=5?'✦ besties':'✦ curious';
    petCtx.clearRect(0,0,96,96); petCtx.imageSmoothingEnabled=false;
    petCtx.fillStyle='#fff3d8';petCtx.fillRect(0,73,96,23);
    const img=assets.nihiSheet;
    if (img && isImageReady(img)) {
      const row=nihiReaction>0?(NIHI_ROWS[nihiExpression]||0):0;
      petCtx.drawImage(img,(Math.floor(hubTime/28)%2)*32,row*32,32,32,32,22+(reducedMotion()?0:Math.round(Math.sin(hubTime*.07)*2)),40,40,40);
      if(nihiReaction>0)nihiReaction--;else nihiExpression='idle';
    } else {
      petCtx.fillStyle='#493044';petCtx.beginPath();petCtx.ellipse(48,55,21,17,0,0,Math.PI*2);petCtx.fill();
      petCtx.fillStyle='#f7e9ff';petCtx.beginPath();petCtx.ellipse(48,53,19,15,0,0,Math.PI*2);petCtx.fill();
      petCtx.fillStyle='#493044';petCtx.fillRect(41,50,3,3);petCtx.fillRect(52,50,3,3);petCtx.fillRect(47,56,3,2);
    }
    if(profile.equipped.nihi==='petal-bow') { petCtx.fillStyle='#e77fb1';petCtx.fillRect(57,35,8,3);petCtx.fillRect(61,32,4,8); }
    if(profile.equipped.nihi==='moon-crown') { petCtx.fillStyle='#ffe184';petCtx.fillRect(40,27,16,4);petCtx.fillRect(43,22,4,7);petCtx.fillRect(49,24,4,5); }
    if(profile.equipped.nihi==='star-clip') { petCtx.fillStyle='#ffe184';petCtx.font='14px sans-serif';petCtx.fillText('✦',58,40); }
    if(profile.equipped.nihi==='pixel-visor') { petCtx.fillStyle='#9de9f5';petCtx.fillRect(37,47,22,5);petCtx.fillStyle='#493044';petCtx.fillRect(40,49,5,2);petCtx.fillRect(51,49,5,2); }
  }

  function renderHubPage(nextPage) {
    page=nextPage||page;
    document.querySelectorAll('.hub-nav [data-screen]').forEach(btn=>btn.classList.toggle('selected',btn.dataset.screen===page));
    const titles={home:'My desktop',worlds:'CD player',minigames:'Mini games',realtalk:'Real Talk',album:'Collectible album',room:'Customize room',settings:'Settings & preferences'};
    document.getElementById('hub-window-title').textContent=titles[page]||titles.home;
    document.getElementById('hub-controls-hint').innerHTML=page==='realtalk'?'Click a response · <kbd>TAB</kbd> + <kbd>ENTER</kbd> also works':'<kbd>WASD</kbd> move <kbd>SPACE</kbd> jump';
    if(page==='home') renderHome();
    if(page==='worlds') renderWorlds();
    if(page==='minigames') renderMinigames();
    if(page==='realtalk'&&window.RealTalk) window.RealTalk.render(content,()=>renderHubPage('home'));
    if(page==='album') renderAlbum();
    if(page==='room') renderRoom();
    if(page==='settings') renderSettings();
    renderPet();
  }
  function renderHome() {
    const unlocked=profile.unlockedWorlds.length;
    content.innerHTML=`<section class="hub-hero"><div class="hub-hero-copy"><div class="hub-eyebrow">YOUR COMPUTER IS FEELING MAGICAL</div><h1>Welcome to Bleuming.exe</h1><p>Pick a CD, meet a new world, and bring home a little treasure. Nihi is on the desktop. (They have admin privileges.)</p><div class="hub-action-row"><button class="hub-card-button" data-action="open-worlds">▶ Put a CD in</button><button class="hub-card-button lavender" data-action="resume">↻ ${profile.completed.length?'Play again':'Quick play'}</button></div></div></section>
      <div class="hub-card-grid"><article class="hub-card"><div class="hub-eyebrow">CD LIBRARY</div><h3>${unlocked} ${unlocked===1?'world':'worlds'} unlocked</h3><p>${profile.completed.length} adventures completed · ${profile.inventory.length} keepsakes in your album</p><button class="hub-card-button lavender" data-action="open-worlds">Browse discs</button></article><article class="hub-card"><div class="hub-eyebrow">A FRIENDLY HELLO</div><h3>Hey, you’re here. What sounds good?</h3><p>Play, wander, talk, or keep exploring your desktop. No mood check needed.</p><button class="hub-card-button mint" data-action="open-companion-menu">Ask Nihi</button></article></div>
      <section class="rt-home-prompt"><div><div class="hub-eyebrow">NEW PLAYABLE MODE</div><h2>Real Talk</h2><p>Try different ways through a tricky social moment. Choices shape the next scene, and every path can be replayed.</p></div><button class="hub-card-button" data-action="navigate" data-page="realtalk">Enter Real Talk →</button></section>
      <h2 class="hub-section-title">RECENT SIGNALS</h2><div class="hub-card"><p>${profile.completed.length?`You have cleared ${profile.completed.map(worldTitle).join(' and ')}. Your next disc is ready.`:'The CD player has two worlds in its collection. The moon disc unlocks when you clear Petalbyte Woods.'}</p></div>`;
  }
  function worldTitle(id) { return id==='moonmall'?'Moon Mall After Hours':'Petalbyte Woods'; }
  function renderWorlds() {
    content.innerHTML=`<div class="hub-eyebrow">CD PLAYER • INSERT A DISC TO PLAY</div><h1 class="hub-heading">Choose your little world</h1><p class="hub-subtitle">Each CD has a full level, a clear finish, and a reward. You can replay any unlocked disc.</p><div class="hub-worlds">${['petalbyte','moonmall'].map(id=>{const w=WORLD_TEMPLATES[id],open=profile.unlockedWorlds.includes(id),done=profile.completed.includes(id);return `<button class="hub-world-card ${id==='moonmall'?'moon':''} ${open?'':'locked'}" data-action="play-world" data-world="${id}" ${open?'':'disabled aria-disabled="true"'}><span class="disc-label">${id==='petalbyte'?'CD 01':'CD 02'} · ${done?'CLEARED':'READY'}</span><h3>${w.title}</h3><p>${id==='petalbyte'?'Hop across flower decks, dodge the sleepy brambles, and gather six stars.':'A neon night platform run among quiet storefronts and moon-beads.'}</p>${open?`<span class="hub-card-button">${done?'Replay world':'Play world'} →</span>`:'<span class="hub-lock">🔒 Clear CD 01 to unlock</span>'}</button>`}).join('')}</div><h2 class="hub-section-title">WORLD SETUP</h2><p class="hub-tiny-note">Current style: ${profile.preferences.theme} · Difficulty: ${profile.preferences.difficulty}${profile.preferences.aiPersonalization?' · AI suggestions enabled':''}. Edit these in Settings.</p>`;
  }
  function renderMinigames() {
    content.innerHTML=`<div class="hub-eyebrow">TWO LITTLE ARCADE CABINETS</div><h1 class="hub-heading">Choose a quick game</h1><p class="hub-subtitle">Short, replayable rounds. Scores are personal bests, with no daily streaks or pressure.</p><div class="hub-card-grid"><article class="hub-card"><div style="font-size:28px">♫ ✨</div><h3>Starlight Sync</h3><p>Tap on the pulse as the signal crosses the center. Catch eight beats to earn a pixel visor.</p><p>Best: ${profile.rhythmBest} / 12</p><button class="hub-card-button" data-action="rhythm">Play rhythm round</button></article><article class="hub-card"><div style="font-size:28px">▦ ♡</div><h3>Copycat Constellation</h3><p>Watch a pattern of glowing tiles, then repeat it. Clear three rounds to find a star clip.</p><p>Best round: ${profile.memoryBest} / 3</p><button class="hub-card-button lavender" data-action="memory">Play pattern game</button></article></div>`;
  }
  function renderAlbum() {
    const itemCounts={};profile.inventory.forEach(i=>itemCounts[i]=(itemCounts[i]||0)+1);
    const keepsakes=[['star-fragment','✦','Star fragments'],['moon-bead','●','Moon beads']];
    const items=keepsakes.map(([id,icon,title])=>`<div class="hub-card"><div style="font-size:28px">${icon}</div><h3>${title}</h3><p>${itemCounts[id]||0} collected</p></div>`).join('');
    const worlds=profile.completed.map(worldTitle).join(', ')||'No cleared worlds yet';
    content.innerHTML=`<div class="hub-eyebrow">YOUR SAVED FINDS</div><h1 class="hub-heading">A pocket full of pixels</h1><p class="hub-subtitle">World progress: ${worlds}. This album stays on this device.</p><div class="hub-card-grid">${items}</div><h2 class="hub-section-title">EQUIPPED LOOKS</h2><div class="hub-card"><p>Player: ${profile.equipped.player} · Nihi: ${profile.equipped.nihi} · Wallpaper: ${profile.equipped.wallpaper}</p><button class="hub-card-button lavender" data-action="navigate" data-page="room">Change your room</button></div>`;
  }
  function renderRoom() {
    const playerOptions=[['pink','Bubblegum jacket','pink'],['mint','Mint jacket','mint'],['lavender','Lavender jacket','lavender']];
    const nihiOptions=[['none','No accessory','none'],['petal-bow','Petal bow','petal-bow'],['pixel-visor','Pixel visor','pixel-visor'],['star-clip','Star clip','star-clip'],['moon-crown','Moon crown','moon-crown']].filter(([id])=>id==='none'||profile.cosmetics.includes(id));
    content.innerHTML=`<div class="hub-eyebrow">YOUR ROOM, YOUR RULES</div><h1 class="hub-heading">Decorate the desktop</h1><p class="hub-subtitle">A few palettes and keepsakes, unlocked through play. No purchases, packs, or timers.</p><h2 class="hub-section-title">WALLPAPER</h2><div>${Object.keys(THEMES).map(t=>`<button class="hub-pill ${profile.equipped.wallpaper===t?'equipped':''}" data-action="wallpaper" data-theme="${t}">✦ ${t}</button>`).join('')}</div><h2 class="hub-section-title">PLAYER JACKET</h2><div>${playerOptions.map(([id,name])=>`<button class="hub-pill ${profile.equipped.player===id?'equipped':''}" data-action="player-cosmetic" data-cosmetic="${id}">◈ ${name}</button>`).join('')}</div><h2 class="hub-section-title">NIHI ACCESSORY</h2><div>${nihiOptions.map(([id,name])=>`<button class="hub-pill ${profile.equipped.nihi===id?'equipped':''}" data-action="pet-cosmetic" data-cosmetic="${id}">${name}</button>`).join('')}</div><h2 class="hub-section-title">ROOM DECOR</h2><div class="hub-card"><p>Current shelf: ${profile.room.decor.map(decorTitle).join(' · ')||'empty shelf'}</p><p class="hub-tiny-note">Clear worlds and arcade rounds to find more decorations.</p></div>`;
  }
  function decorTitle(id){return ({'starter-poster':'Starter poster','petal-poster':'Petalbyte poster','moon-lamp':'Moon lamp','rhythm-trophy':'Rhythm trophy'})[id]||id;}
  function renderSettings() {
    const topics=[['friendship','Friendship & boundaries'],['mysteries','Magical mysteries'],['self-expression','Self-expression'],['wellbeing','Gentle wellbeing stories'],['pcos-pcod','PCOS/PCOD story (optional)'],['postpartum','Postpartum story (optional)']];
    content.innerHTML=`<div class="hub-eyebrow">EDIT ANYTIME • SKIP ANYTHING</div><h1 class="hub-heading">Settings & preferences</h1><p class="hub-subtitle">Your choices tune the experience. They do not label you or track how you feel.</p><div class="hub-preference-grid"><div class="hub-card"><h3>Visual theme</h3><div class="hub-form-row"><label for="pref-theme">Desktop palette</label><select id="pref-theme">${Object.keys(THEMES).map(x=>`<option value="${x}" ${profile.preferences.theme===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="hub-form-row"><label for="pref-difficulty">Challenge level</label><select id="pref-difficulty"><option value="relaxed" ${profile.preferences.difficulty==='relaxed'?'selected':''}>Relaxed</option><option value="standard" ${profile.preferences.difficulty==='standard'?'selected':''}>Standard</option><option value="challenge" ${profile.preferences.difficulty==='challenge'?'selected':''}>Challenge</option></select></div><label class="hub-pref"><input type="checkbox" id="pref-reduced" ${localStorage.getItem('bleuming_reduced_motion')==='true'?'checked':''}><span>Reduce motion and flashes</span></label></div>
      <div class="hub-card"><h3>Favorite activities</h3>${Object.entries(ACTIVITY_LABELS).map(([id,label])=>`<label class="hub-pref"><input type="checkbox" data-activity="${id}" ${profile.preferences.activities.includes(id)?'checked':''}><span>${label}</span></label>`).join('')}</div>
      <div class="hub-card"><h3>Story interests <span class="hub-live-dot"></span></h3>${topics.map(([id,label])=>`<label class="hub-pref"><input type="checkbox" data-story="${id}" ${profile.preferences.story.includes(id)?'checked':''}><span>${label}</span></label>`).join('')}</div>
      <div class="hub-card"><h3>Optional personalization</h3><label class="hub-pref"><input type="checkbox" id="pref-wellbeing" ${profile.preferences.wellbeing?'checked':''}><span>Include the optional gentle pause and wellbeing stories. No health disclosures are needed.</span></label><label class="hub-pref"><input type="checkbox" id="pref-ai" ${profile.preferences.aiPersonalization?'checked':''}><span>Allow AI to suggest a supported world theme and challenge when I choose a CD. Only the selected world and gameplay preferences are sent.</span></label><label class="hub-pref"><input type="checkbox" id="pref-ai-chat" ${profile.preferences.aiChat?'checked':''}><span>Separately allow AI replies in Nihi chat. When I send a message, it and limited confirmed game context go to the configured AI service. Messages are not saved in my game profile.</span></label><label class="hub-pref"><input type="checkbox" id="pref-prompt" ${!profile.companionPromptDisabled?'checked':''}><span>Allow the one-time Nihi choice hello on a future launch.</span></label><p class="hub-tiny-note">Health-story choices stay on this device and are not sent to AI. You can skip them. AI features require a configured server; the game works without them.</p></div></div>
      <h2 class="hub-section-title">OPTIONAL STORY JOURNAL</h2><p class="hub-tiny-note">Health chapters appear only for topics you select above. The notes are educational, not diagnosis or medical advice.</p><button class="hub-card-button lavender" data-action="open-story-journal">Open optional story journal</button>
      <div class="hub-action-row" style="margin-top:14px"><button class="hub-card-button" data-action="save-settings">Save preferences</button><button class="hub-card-button lavender" data-action="reset-preferences">Skip/reset preferences</button><button class="hub-card-button lavender" data-action="clear-save">Delete local profile</button></div><h2 class="hub-section-title">LOCAL SAVE</h2><p class="hub-tiny-note">Progress, cosmetics, and preferences live in this browser only. There is no account or cloud sync.</p>`;
  }
  function showFirstSetup() {
    showModal(`<div class="hub-eyebrow">QUICK DESKTOP SETUP</div><h2 class="hub-heading">Pick your play style</h2><p class="hub-subtitle">A few optional choices help shape the desktop. Skip any of them, change them later, or jump straight into the game.</p><div class="hub-form-row"><label for="first-theme">Color mood</label><select id="first-theme"><option value="sugar">Bubblegum garden</option><option value="moon">Moonlit lavender</option><option value="neon">Neon dream</option><option value="mint">Minty morning</option><option value="lavender">Lavender sky</option></select></div><div class="hub-form-row"><label for="first-difficulty">Challenge</label><select id="first-difficulty"><option value="relaxed">Relaxed</option><option value="standard">Standard</option><option value="challenge">Challenge</option></select></div><h3>Activities you like</h3><div class="hub-preference-grid">${Object.entries(ACTIVITY_LABELS).map(([id,label])=>`<label class="hub-pref"><input type="checkbox" data-first-activity="${id}" checked><span>${label}</span></label>`).join('')}</div><h3 class="hub-section-title">Story interests (optional)</h3><div class="hub-preference-grid">${[['friendship','Friendship & boundaries'],['mysteries','Magical mysteries'],['self-expression','Self-expression']].map(([id,label])=>`<label class="hub-pref"><input type="checkbox" data-first-story="${id}"><span>${label}</span></label>`).join('')}</div><label class="hub-pref" style="margin-top:8px"><input type="checkbox" id="first-wellbeing"><span>Include optional wellbeing stories (no personal health details needed).</span></label><label class="hub-pref" style="margin-top:8px"><input type="checkbox" id="first-ai"><span>Allow AI to suggest a supported CD theme and challenge. If enabled, only the selected CD and gameplay theme, difficulty, activities, and non-health story interests are sent to the configured AI service. Wellbeing choices stay on this device.</span></label><label class="hub-pref" style="margin-top:8px"><input type="checkbox" id="first-ai-chat"><span>Separately allow AI replies in Nihi chat. Each message and limited confirmed game context will be sent to the configured service. Messages are not saved.</span></label><p class="hub-tiny-note">No account required. Choices and progress stay in this browser. These are preferences, not labels.</p><div class="hub-action-row"><button class="hub-card-button lavender" data-action="skip-setup">Skip for now</button><button class="hub-card-button" data-action="finish-setup">Save & play</button></div>`);
  }
  function finishSetup(skip) {
    if(!skip){
      profile.preferences.theme=document.getElementById('first-theme').value;profile.equipped.wallpaper=profile.preferences.theme;
      profile.preferences.difficulty=document.getElementById('first-difficulty').value;
      profile.preferences.activities=Array.from(document.querySelectorAll('[data-first-activity]:checked')).map(x=>x.dataset.firstActivity);
      profile.preferences.story=Array.from(document.querySelectorAll('[data-first-story]:checked')).map(x=>x.dataset.firstStory);
      profile.preferences.wellbeing=document.getElementById('first-wellbeing').checked;
      profile.preferences.aiPersonalization=document.getElementById('first-ai').checked;
      profile.preferences.aiChat=document.getElementById('first-ai-chat').checked;
    }
    firstBoot=false;save();applyTheme(profile.preferences.theme);closeModal();renderHubPage('home');status('Ready when you are. Put a CD in to play.');if(!profile.companionPromptSeen&&!profile.companionPromptDisabled)setTimeout(maybeShowCompanionChoices,200);
  }
  function saveSettings() {
    profile.preferences.theme=document.getElementById('pref-theme').value;profile.equipped.wallpaper=profile.preferences.theme;
    profile.preferences.difficulty=document.getElementById('pref-difficulty').value;
    profile.preferences.activities=Array.from(document.querySelectorAll('[data-activity]:checked')).map(x=>x.dataset.activity);
    profile.preferences.story=Array.from(document.querySelectorAll('[data-story]:checked')).map(x=>x.dataset.story);
    profile.preferences.wellbeing=document.getElementById('pref-wellbeing').checked;
    profile.preferences.aiPersonalization=document.getElementById('pref-ai').checked;
    profile.preferences.aiChat=document.getElementById('pref-ai-chat').checked;
    const allowPrompt=document.getElementById('pref-prompt').checked;
    if(allowPrompt&&profile.companionPromptDisabled)profile.companionPromptSeen=false;
    profile.companionPromptDisabled=!allowPrompt;
    try { localStorage.setItem('bleuming_reduced_motion',document.getElementById('pref-reduced').checked?'true':'false'); }
    catch(error){ console.warn('Reduced-motion setting could not be saved.',error); }
    document.body.classList.toggle('reduce-motion',reducedMotion());
    applyTheme(profile.preferences.theme); save(); renderHubPage('settings'); status('Preferences saved. You can change them whenever you like.');
  }
  function resetPreferences() { profile.preferences=clone(BASE_PROFILE.preferences); save(); applyTheme('sugar'); renderHubPage('settings'); status('Preferences reset. Your progress and collection are unchanged.'); }
  function applyTheme(theme) { const t=THEMES[theme]||THEMES.sugar; hub.style.setProperty('--wallpaper',t.sky1); hub.style.background=`radial-gradient(ellipse at 80% 8%,rgba(255,255,255,.9),transparent 29%),linear-gradient(145deg,${t.sky1},${t.sky2} 58%,#f2d2eb)`; }
  function reducedMotion() { try { return localStorage.getItem('bleuming_reduced_motion')==='true'; } catch (_) { return false; } }

  function validateLevel(candidate) {
    if(!candidate||!['petalbyte','moonmall'].includes(candidate.worldId)||!['petalbyte_run','moonmall_hops'].includes(candidate.layoutId)) return false;
    const source=WORLD_TEMPLATES[candidate.worldId];
    if(candidate.layoutId!==source.layoutId||!Number.isFinite(candidate.width)||candidate.width!==source.width) return false;
    if(!Array.isArray(candidate.platforms)||!Array.isArray(candidate.collectibles)||!Array.isArray(candidate.hazards)||!Array.isArray(candidate.checkpoints)) return false;
    const inBounds=(x,y,w,h)=>[x,y,w,h].every(Number.isFinite)&&x>=0&&y>=0&&w>0&&h>0&&x+w<=candidate.width&&y+h<=480;
    if(!candidate.platforms.every(p=>inBounds(...p))) return false;
    if(!candidate.hazards.every(h=>inBounds(...h))) return false;
    if(!candidate.collectibles.every(c=>Number.isFinite(c[0])&&Number.isFinite(c[1])&&c[0]>=0&&c[0]<candidate.width&&c[1]>=30&&c[1]<430&&candidate.platforms.some(p=>c[0]>=p[0]-60&&c[0]<=p[0]+p[2]+60&&c[1]<=p[1]+10&&p[1]-c[1]<=145))) return false;
    if(!candidate.checkpoints.every(x=>Number.isFinite(x)&&x>0&&x<candidate.width)) return false;
    return inBounds(candidate.goal.x,candidate.goal.y,candidate.goal.w,candidate.goal.h)&&candidate.required>=1&&candidate.required<=candidate.collectibles.length;
  }
  function difficultySettings(difficulty) { return difficulty==='challenge'?{speed:3.25,jump:-10.8,gravity:.58,required:7}:difficulty==='standard'?{speed:3.4,jump:-10.6,gravity:.52,required:6}:{speed:3.65,jump:-10.2,gravity:.48,required:5}; }
  async function requestPersonalization(worldId) {
    const token=++levelRequestToken;
    status(profile.preferences.aiPersonalization?'Asking Nihi for a world variation…':'Loading your CD…');
    if(!profile.preferences.aiPersonalization) return {worldId,theme:profile.preferences.theme,difficulty:profile.preferences.difficulty,narrativeIntro:localIntro(worldId)};
    try {
      const response=await fetch('/api/personalize-level',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({worldId,theme:profile.preferences.theme,difficulty:profile.preferences.difficulty,activities:profile.preferences.activities.slice(0,4),storyInterests:profile.preferences.story.filter(x=>['friendship','mysteries','self-expression'].includes(x))})});
      if(!response.ok) throw new Error('personalization_http_'+response.status);
      const data=await response.json();
      if(token!==levelRequestToken) return null;
      if(!['sugar','moon','neon','mint','lavender'].includes(data.theme)||!['relaxed','standard','challenge'].includes(data.difficulty)||['relaxed','standard','challenge'].indexOf(data.difficulty)>['relaxed','standard','challenge'].indexOf(profile.preferences.difficulty)||data.layoutId!==WORLD_TEMPLATES[worldId].layoutId||typeof data.narrativeIntro!=='string'||data.narrativeIntro.length>120) throw new Error('invalid_personalization_schema');
      return data;
    } catch(error) { console.warn('AI level suggestion unavailable; using the authored CD layout.',error); return {worldId,theme:profile.preferences.theme,difficulty:profile.preferences.difficulty,narrativeIntro:localIntro(worldId)}; }
  }
  function localIntro(worldId) { if(profile.preferences.story.includes('friendship'))return 'Nihi saved you the best spot on the path. Let us wander together.';if(profile.preferences.story.includes('self-expression'))return 'The world is full of colors that do not match. Perfect.';if(profile.preferences.story.includes('mysteries'))return 'A curious signal is hiding somewhere ahead. Shall we find it?';return WORLD_TEMPLATES[worldId].narrativeIntro; }
  async function startWorld(worldId) {
    if(!profile.unlockedWorlds.includes(worldId)) return;
    const suggestion=await requestPersonalization(worldId); if(!suggestion) return;
    let candidate=clone(WORLD_TEMPLATES[worldId]);
    candidate.theme=suggestion.theme; candidate.difficulty=suggestion.difficulty;
    if(suggestion.narrativeIntro) candidate.narrativeIntro=suggestion.narrativeIntro;
    candidate.required=difficultySettings(candidate.difficulty).required;
    if(!validateLevel(candidate)) { console.error('CD level failed validation; loading the known-good authored level.');candidate=clone(WORLD_TEMPLATES[worldId]); }
    currentWorldId=worldId;level=candidate;mode='level';state.screen='cd-level';levelFrame=0;cameraX=0;lastCheckpoint=level.spawn.x;
    const d=difficultySettings(level.difficulty);
    player={x:level.spawn.x,y:level.spawn.y,w:22,h:30,vx:0,vy:0,speed:d.speed,jump:d.jump,gravity:d.gravity,grounded:false,invulnerable:0,stars:[],lastSafeX:level.spawn.x};
    level.collectibles.forEach((c,i)=>player.stars.push({id:i,x:c[0],y:c[1],collected:false}));
    hub.classList.add('hidden');document.getElementById('desktop-container').inert=false;levelUI.classList.remove('hidden');levelModal.classList.add('hidden');
    document.getElementById('level-world-title').textContent=level.title;
    document.getElementById('level-objective').textContent=`Find ${level.required} signal stars`;
    document.getElementById('level-count').textContent='✦ 0 / '+level.required;
    document.getElementById('level-toast').textContent=level.narrativeIntro||'Find the signal stars and reach the portal.';
    state.screen='cd-level';window.soundEngine.ensureContext();window.soundEngine.startBgm();
    save();say('The portal is open! Let’s see what this CD has for us.','playful');status('The CD is spinning up…');
  }
  function finishLevel() {
    if(player.stars.filter(s=>s.collected).length<level.required) { document.getElementById('level-toast').textContent=`The portal needs ${level.required} stars. You have ${player.stars.filter(s=>s.collected).length}.`;return; }
    mode='hub';state.screen='hub';document.getElementById('desktop-container').inert=true;levelUI.classList.add('hidden');
    if(!profile.completed.includes(currentWorldId))profile.completed.push(currentWorldId);
    if(currentWorldId==='petalbyte'&&!profile.unlockedWorlds.includes('moonmall'))profile.unlockedWorlds.push('moonmall');
    if(currentWorldId==='petalbyte')unlock('petal-bow');
    if(currentWorldId==='moonmall')unlock('moon-crown');
    awardBond(2);
    const time=Math.floor(levelFrame/60);profile.bests[currentWorldId]=Math.min(profile.bests[currentWorldId]||9999,time);
    profile.room.decor=Array.from(new Set(profile.room.decor.concat(currentWorldId==='petalbyte'?'petal-poster':'moon-lamp')));
    save();hub.classList.remove('hidden');renderHubPage('home');
    document.getElementById('hub-mood').textContent='✦ proud';say(`Level clear! ${worldTitle(currentWorldId)} is in your album. Nihi did a victory wiggle.`);window.soundEngine.playBloomFanfare();
    status(`CD cleared in ${time}s. A new keepsake is waiting in Customize room.`);
  }
  function unlock(item) { if(!profile.cosmetics.includes(item)){profile.cosmetics.push(item);profile.inventory.push(item==='moon-crown'?'moon-bead':'star-fragment');} }
  function returnToHub() { mode='hub';state.screen='hub';document.getElementById('desktop-container').inert=true;hub.classList.remove('hidden');levelUI.classList.add('hidden');levelModal.classList.add('hidden');renderHubPage('home');save(); }
  function restartLevel() { if(!level)return; const id=currentWorldId;startWorld(id); }
  function respawn() { player.x=lastCheckpoint;player.y=level.spawn.y;player.vx=0;player.vy=0;player.invulnerable=70;cameraX=Math.max(0,player.x-220);document.getElementById('level-toast').textContent='Checkpoint! The portal is still waiting.'; }
  function updateLevel(dt) {
    levelFrame++;const seconds=Math.min(dt/16.667,2);
    const left=keys.ArrowLeft||keys.a||keys.A,right=keys.ArrowRight||keys.d||keys.D;
    player.vx=(right?1:0)-(left?1:0);player.vx*=player.speed*seconds;
    let oldX=player.x;player.x=Math.max(0,Math.min(level.width-player.w,player.x+player.vx));
    for(const p of level.platforms)if(player.y+player.h>p[1]+3&&player.y<p[1]+p[3]&&player.x+player.w>p[0]&&player.x<p[0]+p[2]) {player.x=oldX;break;}
    if((keys[' ']||keys.Space||keys.ArrowUp||keys.w||keys.W)&&player.grounded&&!keys.jumpLatch){player.vy=player.jump;player.grounded=false;keys.jumpLatch=true;window.soundEngine.playTone(520,.08,'square',.025);}
    if(!(keys[' ']||keys.Space||keys.ArrowUp||keys.w||keys.W))keys.jumpLatch=false;
    const oldBottom=player.y+player.h;player.vy=Math.min(13,player.vy+player.gravity*seconds);player.y+=player.vy*seconds;player.grounded=false;
    if(player.vy>=0)for(const p of level.platforms){if(oldBottom<=p[1]+4&&player.y+player.h>=p[1]&&player.x+player.w>p[0]&&player.x<p[0]+p[2]){player.y=p[1]-player.h;player.vy=0;player.grounded=true;break;}}
    if(player.invulnerable>0)player.invulnerable--;
    if(player.y>500)respawn();
    const foot=player.y+player.h;
    for(const h of level.hazards)if(player.invulnerable===0&&player.x+player.w>h[0]+3&&player.x<h[0]+h[2]-3&&foot>h[1]-6&&player.y<h[1]+h[3]){respawn();break;}
    level.checkpoints.forEach(x=>{if(player.x>=x&&x>lastCheckpoint){lastCheckpoint=x;player.lastSafeX=x;document.getElementById('level-toast').textContent='Checkpoint saved. Keep going!';}});
    for(const s of player.stars)if(!s.collected&&Math.hypot(player.x+11-s.x,player.y+15-s.y)<25){s.collected=true;profile.inventory.push(currentWorldId==='moonmall'?'moon-bead':'star-fragment');const milestone=awardBond(1);if(milestone)say('We are besties now! I have a tiny star clip for your room.');else say(choose(lines.collect),'curious');document.getElementById('level-count').textContent=`✦ ${player.stars.filter(x=>x.collected).length} / ${level.required}`;window.soundEngine.playPickup();save();}
    if(player.x+player.w>level.goal.x&&foot>level.goal.y&&player.y<level.goal.y+level.goal.h)finishLevel();
    cameraX=Math.max(0,Math.min(level.width-canvas.width,player.x-canvas.width*.38));
  }
  function drawLevel() {
    const t=THEMES[level.theme]||THEMES.sugar,g=gameCtx;g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,640,480);
    const sky=g.createLinearGradient(0,0,0,480);sky.addColorStop(0,t.sky1);sky.addColorStop(1,t.sky2);g.fillStyle=sky;g.fillRect(0,0,640,480);
    for(let i=0;i<11;i++){const x=((i*183-cameraX*.24)%790+790)%790-80,y=65+(i*37)%120;g.fillStyle='rgba(255,255,255,.48)';g.fillRect(x,y,24,6);g.fillRect(x+6,y-5,13,15);}
    g.save();g.translate(-Math.round(cameraX),0);
    for(const p of level.platforms){g.fillStyle=t.ground;g.fillRect(...p);g.fillStyle=t.accent;g.fillRect(p[0],p[1],p[2],5);for(let x=p[0]+6;x<p[0]+p[2];x+=17){g.fillStyle='rgba(255,255,255,.15)';g.fillRect(x,p[1]+9,5,2);}}
    for(const h of level.hazards){g.fillStyle='#493044';g.fillRect(h[0],h[1]+7,h[2],7);g.fillStyle='#e989ae';for(let x=h[0]+2;x<h[0]+h[2]-2;x+=9){g.beginPath();g.moveTo(x,h[1]+9);g.lineTo(x+5,h[1]);g.lineTo(x+9,h[1]+9);g.fill();}}
    for(const s of player.stars)if(!s.collected){const pulse=reducedMotion()?1:1+Math.sin(hubTime*.11+s.id)*.12;g.save();g.translate(s.x,s.y);g.scale(pulse,pulse);g.fillStyle=t.accent;g.strokeStyle=t.outline;g.lineWidth=1.5;g.beginPath();for(let i=0;i<10;i++){const r=i%2?5:11,a=-Math.PI/2+i*Math.PI/5;const x=Math.cos(a)*r,y=Math.sin(a)*r;i?g.lineTo(x,y):g.moveTo(x,y);}g.closePath();g.fill();g.stroke();g.restore();}
    level.checkpoints.forEach(x=>{g.fillStyle='#493044';g.fillRect(x,375,3,55);g.fillStyle=lastCheckpoint>=x?t.accent:'#fff';g.beginPath();g.moveTo(x+3,378);g.lineTo(x+25,386);g.lineTo(x+3,395);g.fill();});
    g.fillStyle='#493044';g.fillRect(level.goal.x,level.goal.y,level.goal.w,level.goal.h);g.fillStyle='#d9b3f5';g.fillRect(level.goal.x+6,level.goal.y+7,level.goal.w-12,level.goal.h-7);g.fillStyle=t.accent;g.beginPath();g.arc(level.goal.x+level.goal.w/2,level.goal.y+30,8,0,Math.PI*2);g.fill();
    drawGameNihi(g,player.x-26,player.y+7,t);
    if(Math.floor(levelFrame/7)%2===0||player.invulnerable%8<4)drawPlayer(g,player.x,player.y,t);
    g.restore();
    g.fillStyle='rgba(255,255,255,.2)';for(let i=0;i<25;i++){const x=(i*79+hubTime*.35)%640;g.fillRect(x,(i*47+hubTime*.22)%480,2,2);}
  }
  function drawPlayer(g,x,y,t) { const outfit=profile.equipped.player;const shirt=outfit==='mint'?'#8fcbb1':outfit==='lavender'?'#aa9add':'#ef91b9';g.fillStyle=t.outline;g.fillRect(Math.round(x+3),Math.round(y+2),16,14);g.fillStyle='#ffe0c4';g.fillRect(Math.round(x+5),Math.round(y+4),12,10);g.fillStyle='#493044';g.fillRect(Math.round(x+7),Math.round(y+7),2,2);g.fillRect(Math.round(x+14),Math.round(y+7),2,2);g.fillStyle=shirt;g.fillRect(Math.round(x+2),Math.round(y+16),18,10);g.fillStyle='#493044';g.fillRect(Math.round(x+3),Math.round(y+26),6,4);g.fillRect(Math.round(x+13),Math.round(y+26),6,4); }
  function drawGameNihi(g,x,y,t) { const img=assets.nihiSheet;if(img&&isImageReady(img)){const row=nihiReaction>0?(NIHI_ROWS[nihiExpression]||0):0;g.drawImage(img,(Math.floor(hubTime/28)%2)*32,row*32,32,32,Math.round(x),Math.round(y+(reducedMotion()?0:Math.sin(hubTime*.08)*2)),27,27);if(nihiReaction>0)nihiReaction--;else nihiExpression='idle';}else{g.fillStyle='#f6e6ff';g.beginPath();g.ellipse(x+13,y+14,13,11,0,0,Math.PI*2);g.fill();g.fillStyle='#493044';g.fillRect(x+9,y+12,2,2);g.fillRect(x+17,y+12,2,2);} }

  function startRhythm() { mode='rhythm';state.screen='minigame';const period=900;rhythm={started:performance.now()+period/2,period,beats:12,hits:0,attempts:0,lastBeat:-1,ended:false};showModal(`<div class="hub-eyebrow">ARCADE • TIMING</div><h2 class="hub-heading">Starlight Sync</h2><p class="hub-subtitle">Tap <kbd>SPACE</kbd> or click when the signal reaches the center. Catch eight of twelve beats.</p><div class="hub-rhythm-meter"><div class="hub-rhythm-marker"></div></div><p id="rhythm-count" style="text-align:center;font:10px var(--font-pixel)">✦ 0 / 12 · on beat 0</p><div style="text-align:center;margin-top:18px"><button class="hub-card-button" data-action="rhythm-tap">Tap the beat</button> <button class="hub-card-button lavender" data-action="exit-minigame">Back</button></div>`); }
  function rhythmTap() { if(!rhythm||rhythm.ended)return;const now=performance.now()-rhythm.started;if(now<0)return;const beat=Math.round(now/rhythm.period),delta=reducedMotion()?0:Math.abs(now-beat*rhythm.period);if(beat<=rhythm.lastBeat)return;rhythm.lastBeat=beat;rhythm.attempts++;if(delta<180)rhythm.hits++;const out=document.getElementById('rhythm-count');if(out)out.textContent=`✦ ${rhythm.attempts} / 12 · on beat ${rhythm.hits}`;if(rhythm.attempts>=rhythm.beats){rhythm.ended=true;profile.rhythmBest=Math.max(profile.rhythmBest,rhythm.hits);if(rhythm.hits>=8)unlock('pixel-visor');if(rhythm.hits>=10)profile.room.decor=Array.from(new Set(profile.room.decor.concat('rhythm-trophy')));save();showModal(`<div class="hub-eyebrow">ROUND COMPLETE</div><h2 class="hub-heading">${rhythm.hits>=8?'Signal synchronized!':'Nice little jam.'}</h2><p class="hub-subtitle">You caught ${rhythm.hits} of ${rhythm.attempts} taps.${rhythm.hits>=8?' A pixel visor is yours!':''}</p><button class="hub-card-button" data-action="rhythm">Play again</button> <button class="hub-card-button lavender" data-action="back-arcade">Arcade menu</button>`);}}
  function startMemory() { mode='memory';state.screen='minigame';memory={round:1,sequence:[],input:[],locked:true,best:0};showModal(`<div class="hub-eyebrow">ARCADE • PATTERN</div><h2 class="hub-heading">Copycat Constellation</h2><p id="memory-instruction" class="hub-subtitle">Watch the pattern…</p><div id="memory-grid" class="hub-memory-grid">${Array.from({length:16},(_,i)=>`<button data-tile="${i}" aria-label="Star tile ${i+1}">✦</button>`).join('')}</div><p style="text-align:center"><button class="hub-card-button lavender" data-action="exit-minigame">Leave game</button></p>`);advanceMemory(); }
  function advanceMemory() { if(!memory)return;if(memory.round>3){profile.memoryBest=Math.max(profile.memoryBest,3);unlock('star-clip');profile.room.decor=Array.from(new Set(profile.room.decor.concat('rhythm-trophy')));save();showModal(`<div class="hub-eyebrow">THREE ROUNDS CLEAR</div><h2 class="hub-heading">Constellation complete!</h2><p class="hub-subtitle">You earned a star clip for Nihi. It is ready in Customize room.</p><button class="hub-card-button" data-action="memory">Play again</button> <button class="hub-card-button lavender" data-action="back-arcade">Arcade menu</button>`);return;}memory.sequence=Array.from({length:memory.round+2},()=>Math.floor(Math.random()*16));memory.input=[];memory.locked=true;const label=document.getElementById('memory-instruction');if(label)label.textContent=`Round ${memory.round}: watch ${memory.sequence.length} stars…`;let i=0;const flash=()=>{if(mode!=='memory'||!memory)return;document.querySelectorAll('[data-tile]').forEach(b=>b.classList.remove('revealed'));if(i>=memory.sequence.length){memory.locked=false;label.textContent='Your turn! Repeat the pattern.';return;}const b=document.querySelector(`[data-tile="${memory.sequence[i]}"]`);if(b)b.classList.add('revealed');setTimeout(()=>{if(b)b.classList.remove('revealed');i++;setTimeout(flash,180);},440);};setTimeout(flash,350); }
  function memoryTap(tile) { if(!memory||memory.locked)return;const b=document.querySelector(`[data-tile="${tile}"]`);if(b){b.classList.add('revealed');setTimeout(()=>b.classList.remove('revealed'),220);}memory.input.push(tile);const idx=memory.input.length-1;if(memory.input[idx]!==memory.sequence[idx]){memory.locked=true;document.getElementById('memory-instruction').textContent='Close! Watch that one again.';setTimeout(advanceMemory,700);return;}if(memory.input.length===memory.sequence.length){memory.locked=true;memory.round++;document.getElementById('memory-instruction').textContent='Lovely! Next constellation…';setTimeout(advanceMemory,650);} }
  function exitMini() { mode='hub';state.screen='hub';memory=null;rhythm=null;closeModal();renderHubPage('minigames'); }

  let chatHistory=[];
  let storyJournalOpen=false;
  let previousLegacyJourneys=[];
  function openStoryJournal() {
    previousLegacyJourneys=selectedJourneys.slice();
    selectedJourneys=[];
    if(profile.preferences.story.includes('pcos-pcod'))selectedJourneys.push('pcos_pcod');
    if(profile.preferences.story.includes('postpartum'))selectedJourneys.push('postpartum');
    if(profile.preferences.wellbeing||profile.preferences.story.includes('wellbeing'))selectedJourneys.push('emotional_wellbeing');
    storyJournalOpen=true;hub.classList.add('hidden');document.getElementById('desktop-container').inert=false;document.body.classList.add('story-journal-mode');
    const chapter=selectedJourneys.includes('pcos_pcod')?'ch-pcos':selectedJourneys.includes('postpartum')?'ch-postpartum':selectedJourneys.includes('emotional_wellbeing')?'ch-grounding':'ch-discoveries';
    openJournalToChapter(chapter);
  }
  function leaveStoryJournal() {
    if(!storyJournalOpen)return;
    closeJournal();selectedJourneys=previousLegacyJourneys;storyJournalOpen=false;document.body.classList.remove('story-journal-mode');document.getElementById('desktop-container').inert=true;hub.classList.remove('hidden');state.screen='hub';renderHubPage('settings');
  }
  function chatWithNihi() {
    chatHistory=[];
    const quick=['I had a rough day.','I’m feeling overwhelmed.','I need a distraction.','I want a little encouragement.','I just want to chat.'];
    showModal(`<div class="hub-eyebrow">NIHI.EXE • OPTIONAL CHAT</div><h2 class="hub-heading">What’s on your mind?</h2><p class="hub-tiny-note">No need to explain. Your messages are not saved. ${profile.preferences.aiChat?'AI replies are enabled: each message and a small amount of confirmed game context will be sent to the configured service. AI is not professional medical advice.':'Local replies only. Turn on optional AI in Settings to use the configured service.'}</p><div class="hub-chat-log" id="hub-chat-log" aria-live="polite"><p class="hub-chat-nhi">Nihi: Hi! We can chat, play, or just sit with the pixel clouds.</p></div><div class="hub-quick-prompts">${quick.map((q,i)=>`<button class="hub-pill" data-action="chat-preset" data-preset="${i}">${q}</button>`).join('')}</div><form class="hub-chat-form" id="hub-chat-form"><label class="sr-only" for="hub-chat-input">Message Nihi</label><input id="hub-chat-input" maxlength="500" autocomplete="off" placeholder="Write a message if you like…"><button class="hub-card-button" type="submit">Send</button></form><button class="hub-card-button lavender" data-action="choice-explore">Close chat</button>`);
    return;
  }
  async function sendChat(message) {
    message=(message||'').trim().slice(0,500);if(!message)return;
    const log=document.getElementById('hub-chat-log');if(!log)return;
    const userLine=document.createElement('p');userLine.className='hub-chat-user';userLine.textContent=`You: ${message}`;log.appendChild(userLine);
    const low=message.toLowerCase();let reply,viaAI=false,localSafety=false,localDistress=false;
    const immediateRisk=/\b(?:i(?:'m| am)?\s+(?:going to|about to|will|might)\s+(?:kill|hurt|harm)\s+myself|i have a plan to (?:kill|hurt|harm) myself|i (?:can't|cannot) keep myself safe|i am in immediate danger)\b/.test(low);
    const distressSignal=/\b(?:suicid\w*|want to die|wish i was dead|kill myself|hurt myself|harm myself|end my life)\b/.test(low);
    const negated=/\b(?:not|never|don.t|dont|do not)\s+(?:(?:want|plan)\s+to\s+)?(?:kill myself|hurt myself|harm myself|die|suicid\w*|end my life)\b/.test(low);
    if(immediateRisk&&!negated){localSafety=true;reply='I’m sorry this feels so urgent. Please contact your local emergency number now, or tell someone you trust and ask them to stay with you. If you can, move away from anything you could use to hurt yourself. Nihi is a game companion, so a real person can help keep you safe.';}
    else if(distressSignal&&!negated){localDistress=true;reply='I’m really sorry this feels so painful. You deserve support from a real person—could you contact someone you trust now? If you might act on these thoughts or cannot stay safe, contact your local emergency service.';}
    else if(profile.preferences.aiChat) {
      const context={location:mode==='level'?currentWorldId:'desktop',unlockedWorlds:profile.unlockedWorlds.slice(),confirmedCollectedThisLevel:mode==='level'&&player?player.stars.filter(s=>s.collected).length:0};
      const transcript=chatHistory.slice(-4).map(x=>({role:x.role,content:x.content}));transcript.push({role:'user',content:'Game context (confirmed): '+JSON.stringify(context)+'\nPlayer message: '+message});
      const data=await window.aiClient.request('/api/nihi',{messages:transcript,max_tokens:100});
      if(!document.body.contains(log))return;
      viaAI=!!(data&&typeof data.content==='string'&&data.content.trim());
      reply=viaAI?data.content.trim().split(/\s+/).slice(0,45).join(' '):localChatReply(message);
      chatHistory.push({role:'user',content:message},{role:'assistant',content:reply});
    } else reply=localChatReply(message);
    const nihiLine=document.createElement('p');nihiLine.className='hub-chat-nhi';nihiLine.textContent=`${localSafety?'Nihi (safety reply): ':localDistress?'Nihi (support reply): ':profile.preferences.aiChat?(viaAI?'Nihi (AI): ':'Nihi (local fallback): '):'Nihi: '}${reply}`;log.appendChild(nihiLine);log.scrollTop=log.scrollHeight;say(reply,localSafety||localDistress||/overwhelm|rough day|hard day|stress|anxious|sad|tired/.test(low)?'supportive':'playful');status(localSafety?'Safety reply shown locally; your message was not sent.':localDistress?'Support reply shown locally; your message was not sent.':profile.preferences.aiChat?(viaAI?'AI reply received. Messages are not saved in your game profile.':'AI unavailable; Nihi answered locally. Messages are not saved.'):'Local reply from Nihi. Nothing was sent anywhere.');
  }
  function localChatReply(message) {
    const m=message.toLowerCase();
    if(/overwhelm|rough day|hard day|stress|anxious|sad|tired/.test(m))return 'That sounds like a lot to hold. We can talk a little, find a distraction, or leave it here—your call.';
    if(/distraction|play|game|bored/.test(m))return 'I can recommend a CD or an arcade round. I promise the pixels are very distractible.';
    if(/encourag|confidence|worth|deserve/.test(m))return 'You do not have to finish everything to deserve a little kindness. That is the whole note.';
    if(/star|collect|found|world|level|cd/.test(m))return `Your album has ${profile.inventory.length} keepsakes, and ${profile.completed.length} cleared ${profile.completed.length===1?'world':'worlds'}. Want to find another?`;
    return 'I’m listening. Want to tell me more, or should we find something fun to do?';
  }
  function handleAction(button) {
    const action=button.dataset.action;
    if(action==='navigate')return renderHubPage(button.dataset.page);
    if(action==='open-companion-menu')return showCompanionChoices();
    if(action==='choice-play'){
      closeModal();
      if(hasActivity('platform'))return startWorld(profile.completed.includes('moonmall')?'moonmall':'petalbyte');
      if(hasActivity('memory'))return startMemory();
      if(hasActivity('rhythm'))return startRhythm();
      return renderHubPage('worlds');
    }
    if(action==='choice-calm')return startCalm();
    if(action==='choice-talk')return chatWithNihi();
    if(action==='open-story-journal')return openStoryJournal();
    if(action==='choice-encourage')return showEncouragement(0);
    if(action==='choice-explore'){const opt=document.getElementById('companion-prompt-disable');if(opt&&opt.checked)profile.companionPromptDisabled=true;chatHistory=[];save();closeModal();return;}
    if(action==='encourage-next')return showEncouragement(Number(button.dataset.index)||0);
    if(action==='chat-preset')return sendChat(['I had a rough day.','I’m feeling overwhelmed.','I need a distraction.','I want a little encouragement.','I just want to chat.'][Number(button.dataset.preset)]);
    if(action==='calm-back'){mode='hub';state.screen='hub';document.body.classList.remove('calm-mode');document.getElementById('calm-ui').classList.add('hidden');hub.classList.remove('hidden');document.getElementById('desktop-container').inert=true;return renderHubPage('home');}
    if(action==='calm-sound'){const on=window.soundEngine.toggleMute();button.textContent=on?'♫ Sound on':'♫ Sound off';return;}
    if(action==='open-worlds')return renderHubPage('worlds');
    if(action==='pet'){const milestone=awardBond(1);return say(milestone?'Five friendly boops! That is best-friend territory.':choose(lines.boop),'playful');}
    if(action==='chat')return chatWithNihi();
    if(action==='grounding'){groundingStep=0;return showGroundingStep();}
    if(action==='grounding-next'){groundingStep++;return showGroundingStep();}
    if(action==='grounding-close'){groundingStep=0;return closeModal();}
    if(action==='play-world')return startWorld(button.dataset.world);
    if(action==='resume')return startWorld(profile.completed.includes('moonmall')?'moonmall':'petalbyte');
    if(action==='save-settings')return saveSettings();
    if(action==='reset-preferences')return resetPreferences();
    if(action==='clear-save'){if(!confirm('Clear this Bleuming.exe profile, including unlocked worlds, keepsakes, preferences, and cosmetics? This cannot be undone.'))return;[SAVE_KEY,'bleuming_save_v1','bleuming_journey_preferences_v1','bleuming_reduced_motion','bleuming_real_talk_v1'].forEach(key=>localStorage.removeItem(key));location.reload();return;}
    if(action==='wallpaper'){profile.equipped.wallpaper=button.dataset.theme;save();applyTheme(button.dataset.theme);say('A fresh wallpaper! The desktop has a new mood.','excited');return renderHubPage('room');}
    if(action==='player-cosmetic'){profile.equipped.player=button.dataset.cosmetic;save();say('That jacket looks ready for an adventure.','excited');return renderHubPage('room');}
    if(action==='pet-cosmetic'){profile.equipped.nihi=button.dataset.cosmetic;save();say('New look! I am extremely photogenic in pixels.','excited');renderPet();return renderHubPage('room');}
    if(action==='rhythm'){say('Arcade time! I have my pixel dancing shoes.','playful');return startRhythm();}
    if(action==='rhythm-tap')return rhythmTap();
    if(action==='memory'){say('A pattern puzzle! I will try not to blink.','curious');return startMemory();}
    if(action==='exit-minigame')return exitMini();
    if(action==='back-arcade'){mode='hub';state.screen='hub';rhythm=null;memory=null;closeModal();return renderHubPage('minigames');}
    if(action==='close-modal'){if(firstBoot)return finishSetup(true);const opt=document.getElementById('companion-prompt-disable');if(opt&&opt.checked)profile.companionPromptDisabled=true;save();return closeModal();}
    if(action==='skip-setup')return finishSetup(true);
    if(action==='finish-setup')return finishSetup(false);
    if(action==='sound'){const isOn=window.soundEngine.toggleMute();button.textContent=isOn?'♫ Sound':'♫ Muted';return;}
    if(action==='fullscreen'){if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen().catch(e=>console.warn('Fullscreen unavailable.',e));return;}
    if(action==='pause'){levelModal.classList.remove('hidden');document.getElementById('level-modal-title').textContent='Take a breather';document.getElementById('level-modal-copy').textContent='Your progress is saved as you play. Resume whenever you are ready.';return;}
    if(action==='resume-level'){levelModal.classList.add('hidden');return;}
    if(action==='restart-level'){levelModal.classList.add('hidden');return restartLevel();}
    if(action==='leave-level'){levelModal.classList.add('hidden');return returnToHub();}
    if(action==='memory-tile')return memoryTap(Number(button.dataset.tile));
  }

  hub.addEventListener('click',event=>{const screen=event.target.closest('[data-screen]');if(screen){renderHubPage(screen.dataset.screen);return;}const rt=event.target.closest('[data-rt]');if(rt&&page==='realtalk'&&window.RealTalk&&window.RealTalk.handle(content,rt))return;const btn=event.target.closest('[data-action]');if(btn)handleAction(btn);});
  document.getElementById('hub-modal').addEventListener('click',event=>{const btn=event.target.closest('[data-action]');if(btn)handleAction(btn);const tile=event.target.closest('[data-tile]');if(tile)memoryTap(Number(tile.dataset.tile));});
  document.getElementById('hub-modal').addEventListener('submit',event=>{if(event.target.id==='hub-chat-form'){event.preventDefault();const input=document.getElementById('hub-chat-input');const message=input.value;input.value='';sendChat(message);}});
  document.getElementById('hub-modal').addEventListener('change',event=>{if(event.target.id==='companion-prompt-disable'){profile.companionPromptDisabled=event.target.checked;save();}});
  document.getElementById('modal-journal').addEventListener('click',event=>{if(event.target.closest('#close-modal-journal,#btn-close-journal'))setTimeout(leaveStoryJournal,0);});
  window.addEventListener('keydown',event=>{if(storyJournalOpen&&event.key==='Escape')setTimeout(leaveStoryJournal,0);});
  document.getElementById('calm-ui').addEventListener('click',event=>{const btn=event.target.closest('[data-action]');if(btn)handleAction(btn);});
  levelUI.addEventListener('click',event=>{const btn=event.target.closest('[data-action]');if(btn)handleAction(btn);});
  levelModal.addEventListener('click',event=>{const btn=event.target.closest('[data-action]');if(btn)handleAction(btn);});
  window.addEventListener('keydown',event=>{
    keys[event.key]=true;
    if(mode==='level'&&(event.key===' '||event.key==='ArrowUp'||event.key==='ArrowDown'))event.preventDefault();
    if(mode==='rhythm'&&(event.key===' '||event.key==='Enter')){event.preventDefault();rhythmTap();}
    if(event.key==='Escape'&&mode==='level'){levelModal.classList.toggle('hidden');}
    if(event.key==='Escape'&&mode==='calm')handleAction({dataset:{action:'calm-back'}});
  });
  window.addEventListener('keyup',event=>{keys[event.key]=false;});
  function engineLoop(now) { requestAnimationFrame(engineLoop);const dt=lastTime?Math.min(50,now-lastTime):16.667;lastTime=now;hubTime+=dt/16.667;
    if(mode==='level'&&level&&!levelModal.classList.contains('hidden'))return;
    if(mode==='level'&&level){updateLevel(dt);drawLevel();}
    else if(mode==='calm'){if(keys.ArrowLeft||keys.a||keys.A)calmX=Math.max(0,calmX-1.1);if(keys.ArrowRight||keys.d||keys.D)calmX=Math.min(260,calmX+1.1);drawCalm();}
    else if(mode==='hub'){renderPet();}
  }

  window.addEventListener('load',()=>{
    document.getElementById('screen-title').classList.add('hidden');
    document.getElementById('game-hud').classList.add('hidden');
    hub.classList.remove('hidden');state.screen='hub';document.getElementById('desktop-container').inert=true;document.body.classList.toggle('reduce-motion',reducedMotion());applyTheme(profile.equipped.wallpaper||profile.preferences.theme);renderHubPage('home');
    if(firstBoot)showFirstSetup();else if(!profile.companionPromptSeen&&!profile.companionPromptDisabled)setTimeout(maybeShowCompanionChoices,500);
    requestAnimationFrame(engineLoop);
  },{once:true});
})();
