const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const game = require('../glitch-adventure.js');

test('the real desktop entry point links navigation and the Canvas adventure module', () => {
  const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
  const hub=fs.readFileSync(path.join(__dirname,'..','hub.js'),'utf8');
  assert.match(html,/data-screen="adventure"/);
  assert.match(html,/id="game-canvas"[^>]*tabindex="0"/);
  assert.match(html,/src="glitch-adventure\.js"/);
  assert.match(html,/data-hold="jump"/);
  assert.match(hub,/if\(page==='adventure'\) renderAdventurePage\(\)/);
  assert.match(hub,/else if\(mode==='adventure'\)adventureStep\(dt\)/);
});

test('GLITCH SHIFT changes collision platforms and removes the normal firewall', () => {
  const run = game.createRun();
  const normal = game.activePlatforms(run).map(p => [p.id, p.y]);
  assert.equal(normal.some(([id]) => id === 'glitch-bridge'), false);
  assert.equal(game.activeBarriers(run).some(w => w.id === 'reality-gate'), true);
  game.shift(run);
  const glitch = game.activePlatforms(run).map(p => [p.id, p.y]);
  assert.equal(glitch.some(([id]) => id === 'glitch-bridge'), true);
  assert.equal(glitch.some(([id]) => id === 'elevator-glitch'), true);
  assert.equal(game.activeBarriers(run).some(w => w.id === 'reality-gate'), false);
  assert.equal(normal.find(([id]) => id === 'elevator-normal')[1] - glitch.find(([id]) => id === 'elevator-glitch')[1], 51);
});

test('the three authored puzzle gates require different reality changes', () => {
  const run = game.createRun();
  const ids = () => game.activePlatforms(run).map(p => p.id);
  assert.ok(!ids().includes('glitch-bridge'));
  game.shift(run);
  assert.ok(ids().includes('glitch-bridge'));
  assert.ok(!ids().includes('terminal-bridge'));
  run.x = 1080;
  game.shift(run);
  assert.equal(game.interact(run).type, 'terminal');
  assert.ok(!ids().includes('terminal-bridge'));
  game.shift(run);
  assert.ok(ids().includes('terminal-bridge'));
  assert.equal(game.activeBarriers(run).length, 0);
  game.shift(run);
  assert.ok(!ids().includes('terminal-bridge'));
  game.shift(run);
  assert.ok(ids().includes('terminal-bridge'));
});

test('keyboard jump buffering lands on the reality bridge and checkpoints recover', () => {
  const run = game.createRun();
  for (let i = 0; i < 3; i++) game.update(run, {}, 16.667);
  assert.equal(run.grounded, true);
  game.shift(run);
  run.x = 240;
  game.update(run, { right: true, jump: true }, 16.667);
  for (let i = 0; i < 36; i++) game.update(run, { right: true }, 16.667);
  assert.ok(run.x > 285 && run.x < 405);
  assert.ok(run.y < 420 - game.PLAYER.height);
  const checkpointed = game.createRun({ checkpoint: 1290, collected: ['plaza-star'] });
  assert.equal(checkpointed.x, 1290);
  assert.equal(checkpointed.collected.includes('plaza-star'), true);
});

test('terminal interaction opens the router bridge only in GLITCH and unlocks the next checkpoint', () => {
  const run = game.createRun();
  run.x = 1080;
  game.interact(run);
  assert.equal(run.gateOpen, true);
  assert.equal(game.activePlatforms(run).some(p => p.id === 'terminal-bridge'), false);
  game.shift(run);
  assert.equal(game.activePlatforms(run).some(p => p.id === 'terminal-bridge'), true);
  run.x = 1301;
  const events = game.update(run, {}, 16.667);
  assert.ok(events.some(e => e.type === 'checkpoint' && e.x === 1290));
  assert.ok(events.some(e => e.type === 'puzzle' && e.puzzle === 'router'));
});

test('each encounter choice changes the route and carries a distinct consequence', () => {
  const choices = ['boundary', 'ask', 'redirect'];
  const routes = [];
  for (const choice of choices) {
    const run = game.createRun();
    const outcome = game.chooseEncounter(run, choice);
    if (choice !== 'boundary') game.shift(run);
    routes.push(outcome.route);
    assert.equal(run.encounterDone, true);
    assert.equal(run.gateOpen, true);
    assert.ok(game.activePlatforms(run).some(p => p.id.startsWith('route-') || p.id === 'skywalk'));
    assert.notEqual(outcome.line, '');
  }
  assert.deepEqual(routes, ['plaza', 'skywalk', 'arcade']);
  const redirected = game.createRun();
  game.chooseEncounter(redirected, 'redirect');
  assert.ok(redirected.collected.includes('arcade-ticket'));
});

test('collectibles and the best clear survive replay, while temporary puzzle state resets', () => {
  const saved = { checkpoint: 1290, collected: ['memory-shard'], solved: { bridge: true }, gateOpen: true, encounterChoice: 'ask', completed: true, bestSeconds: 91 };
  const continueRun = game.createRun(saved);
  assert.equal(continueRun.x, 1290);
  assert.equal(continueRun.gateOpen, true);
  const replay = game.createRun(saved, { replay: true });
  assert.equal(replay.x, 0);
  assert.equal(replay.gateOpen, false);
  assert.equal(replay.encounterDone, false);
  assert.deepEqual(replay.solved, {});
  assert.deepEqual(replay.collected, ['memory-shard']);
  assert.equal(replay.bestSeconds, 91);
  assert.equal(game.gallery(replay).find(item => item.id === 'memory-shard').unlocked, true);
});

test('the plaza cannot finish until the router and branching encounter are complete', () => {
  const run = game.createRun();
  run.x = 1910;
  assert.equal(game.canComplete(run), false);
  run.gateOpen = true;
  assert.equal(game.canComplete(run), false);
  run.encounterDone = true;
  assert.equal(game.canComplete(run), true);
});

test('a complete first-area route can be cleared with ordinary movement and the authored puzzle sequence', () => {
  const run = game.createRun();
  const tick = (input = {}, count = 1) => { let events=[];for(let i=0;i<count;i++)events.push(...game.update(run,input,16.667));return events; };
  const walkTo = x => { let guard=0;while(run.x<x&&!run.completed&&guard++<700)tick({right:true});assert.ok(guard<700,`could not reach ${x}: x=${run.x}, y=${run.y}, reality=${run.reality}, checkpoint=${run.checkpoint}`); };
  const jumpRight = count => { tick({right:true,jump:true});tick({right:true},count-1); };
  const jumpInPlace = count => { tick({jump:true});tick({},count-1); };
  tick({},3);game.shift(run);walkTo(240);jumpRight(37);assert.equal(run.grounded,true);jumpRight(46);assert.equal(run.grounded,true);
  game.shift(run);walkTo(630);jumpInPlace(38);assert.equal(run.grounded,true);game.shift(run);walkTo(690);jumpRight(50);assert.equal(run.grounded,true);assert.equal(run.reality,'glitch');
  walkTo(1080);assert.equal(game.interact(run).type,'terminal');jumpRight(38);assert.equal(run.grounded,true);jumpRight(46);assert.equal(run.checkpoint,1290);
  walkTo(1415);assert.equal(game.interact(run).type,'encounter');game.chooseEncounter(run,'boundary');jumpRight(40);assert.equal(run.grounded,true);jumpRight(46);assert.equal(run.grounded,true);
  walkTo(1910);assert.equal(run.completed,true);assert.equal(game.canComplete(run),true);
  assert.deepEqual(['bridge','lift','router'].filter(id=>run.solved[id]),['bridge','lift','router']);
});
