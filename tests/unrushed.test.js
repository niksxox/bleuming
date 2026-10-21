const test = require('node:test');
const assert = require('node:assert/strict');
const game = require('../unrushed.js');

test('phase gates change passability without a timer or fail state', () => {
  assert.equal(game.isBlocked(8,5,'still'), true);
  assert.equal(game.isBlocked(8,5,'flow'), false);
  assert.equal(game.isBlocked(12,3,'flow'), true);
  assert.equal(game.isBlocked(12,3,'still'), false);
});

test('movement cannot pass through stone walls', () => {
  const state=game.reset();state.x=7;state.y=4;
  game.move(state,1,0);
  assert.equal(state.x,7);
  assert.equal(state.y,4);
});

test('world shifting is refused if the player would be inside a closed gate', () => {
  const state=game.reset();state.x=8;state.y=5;state.phase='flow';
  game.shift(state);
  assert.equal(state.phase,'flow');
});

test('collectibles are collected once and exit only solves after all three', () => {
  const state=game.reset();state.x=3;state.y=2;
  game.move(state,1,0);
  game.move(state,0,0);
  assert.deepEqual(state.collected,['first-light']);
  assert.equal(state.solved,false);
});

test('reset returns a fresh, uncompleted state', () => {
  const state=game.reset();state.collected.push('first-light');state.solved=true;
  const fresh=game.reset();
  assert.deepEqual(fresh,{x:2,y:8,phase:'still',collected:[],solved:false});
});
