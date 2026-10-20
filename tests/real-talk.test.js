const test = require('node:test');
const assert = require('node:assert/strict');
const saved = new Map();
global.localStorage = {
  getItem: key => saved.has(key) ? saved.get(key) : null,
  setItem: (key, value) => saved.set(key, value),
  removeItem: key => saved.delete(key)
};
const game = require('../real-talk.js');

test('all three scenarios validate and begin with only the first unlocked', () => {
  game.validate();
  assert.deepEqual(game.scenarioList().map(({ id, unlocked }) => [id, unlocked]), [
    ['body-image', true], ['overload', false], ['inner-voice', false]
  ]);
});

test('finishing a scenario permanently unlocks the next and remains replayable', () => {
  assert.equal(game.completeScenario('overload'), false);
  assert.equal(game.completeScenario('body-image'), true);
  assert.equal(game.scenarioList()[1].unlocked, true);
  assert.equal(game.scenarioList()[0].completed, true);
  const stored = JSON.parse(saved.get('bleuming_real_talk_v1'));
  assert.deepEqual(stored.completed, ['body-image']);
  assert.equal(game.completeScenario('body-image'), true);
  assert.equal(game.scenarioList()[0].unlocked, true);
  delete require.cache[require.resolve('../real-talk.js')];
  const reloaded = require('../real-talk.js');
  assert.equal(reloaded.scenarioList()[1].unlocked, true);
});

test('the interactive opening requires observation and stores its effects', () => {
  let state = game.freshState('body-image', 0);
  assert.equal(game.advance(state), state);
  state = game.applyObservation(state, 'notice');
  assert.equal(state.flags.noticedRowan, true);
  const updated = game.advance(state);
  assert.equal(updated.nodeId, 'response');
  assert.equal(updated.history[0].choiceId, '$continue');
});

test('body-image choices change the following scene and can reach distinct endings', () => {
  let seen = game.freshState('body-image', 0);
  seen = game.advance(game.applyObservation(seen, 'notice'));
  const direct = game.applyChoice(seen, 'boundary');
  assert.equal(direct.nodeId, 'boundary_seen');
  const clarified = game.applyChoice(direct, 'clarify');
  assert.equal(clarified.nodeId, '$end');
  assert.equal(clarified.flags.outcome, 'boundary-clarified');

  let unseen = game.freshState('body-image', 0);
  unseen = game.advance(game.applyObservation(unseen, 'listen'));
  const otherContext = game.applyChoice(unseen, 'boundary');
  assert.equal(otherContext.nodeId, 'boundary_unseen');
  assert.equal(game.applyChoice(otherContext, 'clarify').flags.outcome, 'boundary-clarified');
});

test('the body-image scenario can be played to two different conclusions', () => {
  let direct = game.freshState('body-image', 0);
  direct = game.advance(game.applyObservation(direct, 'notice'));
  direct = game.applyChoice(direct, 'boundary');
  direct = game.applyChoice(direct, 'clarify');
  assert.equal(direct.complete, true);
  assert.equal(direct.flags.outcome, 'boundary-clarified');

  let privatePath = game.freshState('body-image', 0);
  privatePath = game.advance(game.applyObservation(privatePath, 'notice'));
  privatePath = game.applyChoice(privatePath, 'redirect');
  privatePath = game.applyChoice(privatePath, 'listen');
  privatePath = game.applyChoice(privatePath, 'rejoin');
  assert.equal(privatePath.complete, true);
  assert.equal(privatePath.flags.outcome, 'rejoin-together');
  assert.notEqual(privatePath.flags.outcome, direct.flags.outcome);
});

test('inspection affects later dialogue and replay starts with clean temporary state', () => {
  let state = game.freshState('body-image', 0);
  state = game.advance(game.applyObservation(state, 'listen'));
  state = game.applyChoice(state, 'boundary');
  const replay = game.freshState('body-image', 1, true);
  assert.equal(replay.nodeId, 'arrival');
  assert.deepEqual(replay.flags, {});
  assert.deepEqual(replay.observations, []);
  assert.equal(replay.variant, true);
  assert.equal(state.nodeId, 'boundary_unseen');
});

test('optional alternate context changes authored dialogue without using generated content', () => {
  for (const id of ['body-image', 'overload', 'inner-voice']) {
    const node = game.scenarios[id].nodes.response;
    const regular = typeof node.text === 'function' ? node.text({ flags: {}, variant: false }) : node.text;
    const alternate = typeof node.text === 'function' ? node.text({ flags: {}, variant: true }) : node.text;
    assert.notEqual(alternate, regular, `${id}: alternate context should change the authored scene`);
  }
});

test('every selectable choice in each scenario leads to a valid next node', () => {
  for (const [id, scenario] of Object.entries(game.scenarios)) {
    const first = game.freshState(id, 0);
    const arrival = scenario.nodes.arrival;
    let prepared = first;
    if (arrival.interaction) {
      prepared = game.applyObservation(prepared, arrival.interactions[0].id);
      prepared = game.advance(prepared);
    }
    const pending = [prepared];
    const visited = new Set();
    while (pending.length) {
      const state = pending.pop();
      const key = `${state.nodeId}:${JSON.stringify(state.flags)}`;
      if (visited.has(key) || state.complete) continue;
      visited.add(key);
      const node = scenario.nodes[state.nodeId];
      assert.ok(node, `${id}: missing node ${state.nodeId}`);
      for (const choice of node.choices || []) {
        const next = game.applyChoice(state, choice.id);
        assert.notEqual(next, state, `${id}/${state.nodeId}: action ${choice.id} was ignored`);
        assert.ok(next.nodeId === '$end' || scenario.nodes[next.nodeId], `${id}: invalid target ${next.nodeId}`);
        pending.push(next);
      }
    }
    assert.ok(visited.size > 1, `${id}: no branching path was reachable`);
  }
});
