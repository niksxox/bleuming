/* Real Talk: authored, replayable social-skill scenes for the Bleuming desktop. */
(function (root) {
  'use strict';

  const SAVE_KEY = 'bleuming_real_talk_v1';
  const ORDER = ['body-image', 'overload', 'inner-voice'];
  const END = '$end';
  const scenarios = {
    'body-image': {
      id: 'body-image', title: 'The Comment at the Party', short: 'Body-image pressure', setting: 'A rooftop get-together', skill: 'Boundaries and responding to stigma',
      cast: [['Mira', 'speaker'], ['Rowan', 'friend']],
      nodes: {
        arrival: { phase: '01 • READ THE ROOM', speaker: 'Scene', text: 'Music hums under the string lights. Mira glances at Rowan and says, “You look so much better now that you’ve lost weight.” The comment lands in the middle of the group conversation.', interaction: true, interactions: [
          { id: 'notice', label: 'Notice Rowan’s expression', result: 'Rowan gives a small, uncertain smile and looks toward the open balcony door.', set: { noticedRowan: true } },
          { id: 'listen', label: 'Listen to Mira’s tone', result: 'Mira sounds pleased with herself; she may mean this as praise.', set: { readMira: true } },
          { id: 'space', label: 'Check the space around you', result: 'The group is close together, but the balcony is quiet and easy to reach.', set: { sawExit: true } }
        ], continue: { label: 'Choose how to enter', next: 'response' } },
        response: { phase: '02 • YOUR TURN', speaker: 'Mira', text: s => s.variant ? 'A few people are listening now. Mira repeats the comment, waiting for a reaction.' : 'The conversation pauses for a beat. Rowan keeps their eyes on the table.', choices: [
          { id: 'boundary', label: '“Let’s not comment on people’s bodies.”', detail: 'Set a direct boundary in the group.', set: { route: 'boundary' }, next: [{ when: { noticedRowan: true }, node: 'boundary_seen' }, { fallback: true, node: 'boundary_unseen' }] },
          { id: 'personal', label: '“That’s personal. We don’t know how Rowan feels about it.”', detail: 'Name the impact without guessing Rowan’s feelings.', set: { route: 'personal' }, next: 'personal_reply' },
          { id: 'redirect', label: 'Change the subject, then check in privately.', detail: 'Lower the public pressure and make room for a private conversation.', set: { route: 'redirect' }, next: 'private_check' },
          { id: 'leave', label: 'Step outside and give the moment space.', detail: 'Leave the interaction without taking on the whole group.', set: { route: 'leave' }, next: 'outside' },
          { id: 'ask', label: 'Ask Rowan, “Want me to say something, or leave it?”', detail: 'Let Rowan guide what support looks like.', set: { route: 'ask' }, next: 'ask_rowan' }
        ] },
        boundary_seen: { phase: '03 • THE ROOM RESPONDS', speaker: 'Mira', text: 'Mira blinks. “Oh. I thought it was a compliment.” Rowan looks up; there is a little more room to speak now.', choices: [
          { id: 'clarify', label: '“I get that. Body comments can still feel complicated.”', detail: 'Leave room for intent and impact to differ.', set: { outcome: 'boundary-clarified' }, next: END },
          { id: 'hold', label: '“I still want us to leave body comments out.”', detail: 'Keep the limit clear, even if the conversation feels awkward.', set: { outcome: 'boundary-held' }, next: END },
          { id: 'checkin', label: 'Turn to Rowan and ask what they would prefer.', detail: 'Shift the next step back to the person affected.', set: { outcome: 'rowan-guides' }, next: 'rowan_choice' }
        ] },
        boundary_unseen: { phase: '03 • THE ROOM RESPONDS', speaker: 'Mira', text: s => s.flags.readMira ? 'Mira looks surprised. “I meant it kindly.” A couple of people look down at their cups; Rowan has not joined in.' : 'Mira looks surprised. “I meant it kindly.” The group goes quiet, and Rowan has not joined in.', choices: [
          { id: 'clarify', label: '“I hear you. I’d still rather we skip body comments.”', detail: 'Acknowledge intent and restate your limit.', set: { outcome: 'boundary-clarified' }, next: END },
          { id: 'pause', label: 'Let the pause sit, then check on Rowan.', detail: 'You do not have to manage everyone’s reaction.', set: { outcome: 'quiet-checkin' }, next: 'rowan_choice' }
        ] },
        personal_reply: { phase: '03 • THE ROOM RESPONDS', speaker: 'Rowan', text: '“Thanks for saying that,” Rowan says. Mira shifts her weight. “I wasn’t trying to be rude.” The group is waiting to see where the conversation goes.', choices: [
          { id: 'intent', label: '“I know. We can move on without discussing Rowan’s body.”', detail: 'Recognize intent while changing the subject.', set: { outcome: 'move-on' }, next: END },
          { id: 'support', label: 'Ask Rowan if they would like a quieter check-in.', detail: 'Offer support without requiring an answer in front of everyone.', set: { outcome: 'quiet-checkin' }, next: 'rowan_choice' }
        ] },
        private_check: { phase: '03 • A QUIETER MOMENT', speaker: 'Rowan', text: 'Near the balcony, Rowan says, “I didn’t know what to say. I don’t want the whole night to turn into this.”', choices: [
          { id: 'listen', label: '“That makes sense. Want company, a subject change, or space?”', detail: 'Offer a few options and let Rowan choose.', set: { outcome: 'rowan-guides' }, next: 'rowan_choice' },
          { id: 'return', label: '“We can just go back when you’re ready.”', detail: 'Keep the moment small and leave the timing to Rowan.', set: { outcome: 'rejoin-together' }, next: END }
        ] },
        outside: { phase: '03 • OUTSIDE THE CONVERSATION', speaker: 'Scene', text: 'The balcony is quieter. A moment later, Rowan joins you. They say, “I wanted a break too. I’m not sure whether I want to talk about it.”', choices: [
          { id: 'space', label: '“We don’t have to talk. Want to stay out here?”', detail: 'Offer company without making a conversation mandatory.', set: { outcome: 'shared-space' }, next: END },
          { id: 'ask', label: '“Would you like to head back together, or stay here?”', detail: 'Let Rowan choose what happens next.', set: { outcome: 'rowan-guides' }, next: 'rowan_choice' }
        ] },
        ask_rowan: { phase: '03 • CHECKING IN', speaker: 'Rowan', text: 'Rowan says, “Could you help change the subject? I don’t want to explain anything.” Mira looks a little unsure, but listens.', choices: [
          { id: 'change', label: 'Offer a new topic to the group, then check back later.', detail: 'Follow Rowan’s request and leave the door open.', set: { outcome: 'requested-redirect' }, next: END },
          { id: 'quiet', label: 'Invite Rowan to step outside with you.', detail: 'Make a quieter option available.', set: { outcome: 'shared-space' }, next: END }
        ] },
        rowan_choice: { phase: '04 • WHAT NEXT?', speaker: 'Rowan', text: 'Rowan thinks for a moment. “I’d like to head back, but could we talk about literally anything else?”', choices: [
          { id: 'rejoin', label: 'Go back together and start a different conversation.', detail: 'Continue the evening on Rowan’s terms.', set: { outcome: 'rejoin-together' }, next: END },
          { id: 'stay', label: 'Stay outside together a little longer.', detail: 'Take more space from the group for now.', set: { outcome: 'shared-space' }, next: END }
        ] },
        '$end': { phase: 'SCENE COMPLETE', speaker: 'Scene', text: 'The gathering keeps moving. People may respond differently in real life; the scene has no single perfect line.', ending: true, reflection: 'You explored a possible response while leaving room for context, choice, and safety.' }
      }
    },
    'overload': {
      id: 'overload', title: 'The Overload', short: 'Competing demands', setting: 'A shared project room', skill: 'Communicating limits, prioritizing, and seeking support', cast: [['Jules', 'friend'], ['Ari', 'organizer']],
      nodes: {
        arrival: { phase: '01 • CHECK THE REQUESTS', speaker: 'Scene', text: 'Jules is preparing a community night. Ari asks for help with posters, another teammate needs a ride, and the venue wants a final headcount by noon.', interaction: true, interactions: [
          { id: 'deadline', label: 'Inspect the venue message', result: 'The headcount is due today; the posters can be updated tomorrow.', set: { knowsDeadline: true } },
          { id: 'jules', label: 'Check in with Jules', result: 'Jules has been juggling all three requests since breakfast.', set: { noticedLoad: true } },
          { id: 'tasks', label: 'Lay out the three requests', result: 'There are three separate tasks, and only one has a deadline today.', set: { mappedTasks: true } }
        ], continue: { label: 'Talk through the requests', next: 'response' } },
        response: { phase: '02 • YOUR TURN', speaker: 'Ari', text: s => s.variant ? '“Could you do the posters and the ride? We just learned the venue needs the headcount by noon.”' : '“Could you do the posters and the ride? Jules is already handling the headcount.”', choices: [
          { id: 'agree', label: '“Sure, I’ll do both.”', detail: 'Agree for now; see how the requests unfold.', set: { route: 'agree' }, next: 'agreed' },
          { id: 'clarify', label: '“Which part has to happen before noon?”', detail: 'Clarify urgency before deciding.', set: { route: 'clarify' }, next: [{ when: { knowsDeadline: true }, node: 'clarified_known' }, { fallback: true, node: 'clarified_unknown' }] },
          { id: 'share', label: '“Can someone else take the ride while I check the headcount?”', detail: 'Ask the group to share the load.', set: { route: 'share' }, next: 'shared' },
          { id: 'limit', label: '“I can take one task, not both. Let me check what fits.”', detail: 'Set a limit while keeping options open.', set: { route: 'limit' }, next: 'boundary' },
          { id: 'later', label: '“I can’t decide this minute. Can I reply after lunch?”', detail: 'Postpone the decision and set a time to respond.', set: { route: 'later' }, next: 'postpone' }
        ] },
        agreed: { phase: '03 • THE PLAN SHIFTS', speaker: 'Jules', text: 'The ride takes longer than expected. Ari messages: “Could you also update the headcount?” Jules notices you looking at the schedule.', choices: [
          { id: 'renegotiate', label: '“I can’t add the headcount. Who can pick it up?”', detail: 'Revisit the agreement when the requests change.', set: { outcome: 'renegotiated' }, next: END },
          { id: 'ask', label: 'Ask Jules which task can wait until tomorrow.', detail: 'Make the deadline part of the next decision.', set: { outcome: 'prioritized' }, next: 'jules_plan' },
          { id: 'continue', label: 'Keep going on the tasks you accepted.', detail: 'See the first plan through as agreed.', set: { outcome: 'all-in' }, next: END }
        ] },
        clarified_known: { phase: '03 • PRIORITIES', speaker: 'Ari', text: '“The headcount is due at noon. Posters can wait, and we found another driver.” Ari offers to handle the venue call.', choices: [
          { id: 'one', label: 'Take the headcount while Ari calls the venue.', detail: 'Divide the time-sensitive work.', set: { outcome: 'shared-plan' }, next: END },
          { id: 'limit', label: 'Say you can review the headcount, but not own it.', detail: 'Contribute within a clear limit.', set: { outcome: 'bounded-plan' }, next: END }
        ] },
        clarified_unknown: { phase: '03 • PRIORITIES', speaker: 'Ari', text: 'Ari checks the messages. “The headcount is due at noon. Posters can wait, and we found another driver.”', choices: [
          { id: 'one', label: 'Help Jules finish the headcount together.', detail: 'Share the urgent task.', set: { outcome: 'shared-plan' }, next: END },
          { id: 'limit', label: 'Say what you can take on after lunch.', detail: 'Keep the timing and scope manageable.', set: { outcome: 'bounded-plan' }, next: END }
        ] },
        shared: { phase: '03 • PEOPLE JOIN IN', speaker: 'Jules', text: 'A teammate takes the ride. Jules says the headcount is the hardest part because a few replies are missing.', choices: [
          { id: 'pair', label: 'Offer to check replies together for ten minutes.', detail: 'Make a small, shared plan.', set: { outcome: 'shared-plan' }, next: END },
          { id: 'limit', label: 'Ask Ari to own the headcount while you pause.', detail: 'Make the remaining need visible to the organizer.', set: { outcome: 'delegated' }, next: END }
        ] },
        boundary: { phase: '03 • SETTING A LIMIT', speaker: 'Ari', text: 'Ari asks which task you could do. Jules offers to check the headcount with Ari if someone else can take posters.', choices: [
          { id: 'poster', label: 'Take the posters and set a time to finish them.', detail: 'Choose one task with a clear scope.', set: { outcome: 'bounded-plan' }, next: END },
          { id: 'urgent', label: 'Offer ten minutes on the headcount instead.', detail: 'Choose the time-sensitive task in a smaller way.', set: { outcome: 'shared-plan' }, next: END }
        ] },
        postpone: { phase: '03 • A PAUSE TO DECIDE', speaker: 'Ari', text: 'After lunch, Ari has found another driver. The headcount is still due soon, and Jules has two unanswered messages.', choices: [
          { id: 'help', label: 'Ask Jules what would help most with the deadline.', detail: 'Decide with current information.', set: { outcome: 'prioritized' }, next: 'jules_plan' },
          { id: 'decline', label: 'Say you can’t take on a task today.', detail: 'Give a clear answer once you know your limit.', set: { outcome: 'declined' }, next: END }
        ] },
        jules_plan: { phase: '04 • MAKE A SMALL PLAN', speaker: 'Jules', text: '“Could you sit with me while I send the last messages? I can handle the posters tomorrow.” Ari offers to take the venue call.', choices: [
          { id: 'yes', label: 'Agree to the short check-in, then stop there.', detail: 'Set a modest, defined scope.', set: { outcome: 'bounded-plan' }, next: END },
          { id: 'adjust', label: 'Suggest another person join for the messages.', detail: 'Share the task across the group.', set: { outcome: 'shared-plan' }, next: END }
        ] },
        '$end': { phase: 'SCENE COMPLETE', speaker: 'Scene', text: 'The project finds a next step, though the workload may still need another conversation.', ending: true, reflection: 'You tried a way to clarify, share, limit, accept, or postpone the requests.' }
      }
    },
    'inner-voice': {
      id: 'inner-voice', title: 'The Inner Voice', short: 'A mistake and the story after it', setting: 'A tiny community radio booth', skill: 'Self-compassion and flexible thinking', cast: [['Sam', 'friend'], ['Dev', 'teammate']],
      nodes: {
        arrival: { phase: '01 • SEE WHAT HAPPENED', speaker: 'Scene', text: 'Sam accidentally sends an unfinished audio clip to the event channel. They whisper, “I ruin everything.” Dev is reading the message and has not replied yet.', interaction: true, interactions: [
          { id: 'facts', label: 'Inspect the message', result: 'The clip is incomplete, but the channel lets Sam replace it with the final version.', set: { sawFix: true } },
          { id: 'sam', label: 'Notice Sam’s reaction', result: 'Sam is embarrassed and worried the team will think they are unreliable.', set: { noticedSam: true } },
          { id: 'dev', label: 'Check what Dev is doing', result: 'Dev is still setting up equipment and has not reacted to the clip.', set: { checkedDev: true } }
        ], continue: { label: 'Respond to Sam', next: 'response' } },
        response: { phase: '02 • YOUR TURN', speaker: 'Sam', text: s => s.variant ? '“The whole event channel saw that unfinished clip. I ruin everything. I should never send anything again.”' : '“I ruin everything. I should never send anything again.”', choices: [
          { id: 'separate', label: '“One unfinished clip is a mistake, not your whole story.”', detail: 'Separate this event from Sam’s identity.', set: { route: 'separate' }, next: 'separate_reply' },
          { id: 'pause', label: '“Want a minute before deciding what to do?”', detail: 'Pause before reacting or fixing anything.', set: { route: 'pause' }, next: 'pause_reply' },
          { id: 'perspective', label: '“Would it help to ask Dev what they need?”', detail: 'Invite a trusted teammate’s perspective.', set: { route: 'perspective' }, next: 'dev_reply' },
          { id: 'repeat', label: 'Echo the thought: “I ruin everything.”', detail: 'Stay with the first reaction and see where it leads.', set: { route: 'repeat' }, next: 'repeat_reply' }
        ] },
        separate_reply: { phase: '03 • WHAT SAM TRIES', speaker: 'Sam', text: 'Sam looks at the clip again. “It’s one bad send, I guess. I still feel awful.”', choices: [
          { id: 'repair', label: 'Ask whether Sam wants to replace the clip together.', detail: 'Offer practical help without dismissing the feeling.', set: { outcome: 'repair-with-support' }, next: END },
          { id: 'time', label: 'Give Sam a moment before deciding on a fix.', detail: 'Let the emotion and next step take different amounts of time.', set: { outcome: 'pause-and-return' }, next: END }
        ] },
        pause_reply: { phase: '03 • AFTER A PAUSE', speaker: 'Sam', text: s => s.flags.sawFix ? 'After a minute, Sam notices the replace button. “I can resend it, but I’m still embarrassed.”' : 'After a minute, Dev says the clip can be replaced. Sam is still embarrassed, but the next step is clearer.', choices: [
          { id: 'replace', label: 'Replace the clip, then take a short break.', detail: 'Address the mistake and leave room to recover.', set: { outcome: 'repair-with-pause' }, next: END },
          { id: 'ask', label: 'Ask Dev to check the replacement with Sam.', detail: 'Make the next step collaborative.', set: { outcome: 'repair-with-support' }, next: END }
        ] },
        dev_reply: { phase: '03 • ANOTHER PERSPECTIVE', speaker: 'Dev', text: 'Dev says, “I just need the final clip before sound check. This happens sometimes; can I help you replace it?” Sam looks relieved, but not suddenly cheerful.', choices: [
          { id: 'accept', label: 'Ask Dev to help replace the clip.', detail: 'Accept a concrete offer of support.', set: { outcome: 'repair-with-support' }, next: END },
          { id: 'solo', label: 'Thank Dev and replace it at your own pace.', detail: 'Use the information while keeping the task yours.', set: { outcome: 'repair-solo' }, next: END }
        ] },
        repeat_reply: { phase: '03 • THE THOUGHT LOOPS', speaker: 'Sam', text: '“Yeah. I shouldn’t even try to fix it.” Sam closes the editor. Dev still has not replied.', choices: [
          { id: 'pause', label: 'Pause the conversation and come back to the problem later.', detail: 'Let this moment end without forcing a positive thought.', set: { outcome: 'pause-and-return' }, next: END },
          { id: 'ask', label: 'Ask Dev what the event needs, without judging Sam.', detail: 'Bring in practical information when Sam is ready.', set: { outcome: 'perspective-later' }, next: 'dev_reply' }
        ] },
        '$end': { phase: 'SCENE COMPLETE', speaker: 'Scene', text: 'The clip can be corrected. Sam’s feelings may take longer to settle, and the story leaves that open.', ending: true, reflection: 'You explored how a pause, a practical repair, or another perspective can change what happens after a mistake.' }
      }
    }
  };

  function validate() {
    ORDER.forEach(id => {
      const s = scenarios[id];
      if (!s || s.id !== id || !s.nodes.arrival) throw new Error('Invalid Real Talk scenario: ' + id);
      Object.keys(s.nodes).forEach(nodeId => {
        const node = s.nodes[nodeId];
        if (nodeId !== END && !node.ending && !Array.isArray(node.choices) && !node.interaction) throw new Error('Node has no action: ' + id + '/' + nodeId);
        (node.choices || []).forEach(choice => {
          const targets = Array.isArray(choice.next) ? choice.next.map(rule => rule.node) : [choice.next];
          targets.forEach(target => { if (target !== END && !s.nodes[target]) throw new Error('Unknown transition: ' + id + '/' + target); });
        });
        if (node.continue && node.continue.next !== END && !s.nodes[node.continue.next]) throw new Error('Unknown transition: ' + id + '/' + node.continue.next);
      });
    });
  }
  validate();

  function freshState(id, run, variant) { return { scenarioId: id, nodeId: 'arrival', flags: {}, observations: [], history: [], run: run || 0, variant: !!variant, complete: false }; }
  function resolveNext(next, flags) {
    if (!Array.isArray(next)) return next;
    for (const rule of next) {
      if (rule.fallback) return rule.node;
      const ok = Object.keys(rule.when || {}).every(key => flags[key] === rule.when[key]);
      if (ok) return rule.node;
    }
    throw new Error('No matching transition rule');
  }
  function applyChoice(state, choiceId) {
    if (!state || state.complete) return state;
    const scenario = scenarios[state.scenarioId];
    const node = scenario && scenario.nodes[state.nodeId];
    const choice = node && (node.choices || []).find(item => item.id === choiceId);
    if (!choice) return state;
    const flags = Object.assign({}, state.flags, choice.set || {});
    const nodeId = resolveNext(choice.next, flags);
    return { ...state, flags, nodeId, history: state.history.concat([{ nodeId: state.nodeId, choiceId }]), complete: nodeId === END };
  }
  function applyObservation(state, observationId) {
    const scenario = scenarios[state && state.scenarioId];
    const node = scenario && scenario.nodes[state.nodeId];
    const item = node && (node.interactions || []).find(entry => entry.id === observationId);
    if (!item || state.observations.includes(observationId)) return state;
    return { ...state, flags: Object.assign({}, state.flags, item.set || {}), observations: state.observations.concat(observationId) };
  }
  function advance(state) {
    const node = scenarios[state && state.scenarioId]?.nodes[state.nodeId];
    if (!node || !node.continue || (node.interaction && !state.observations.length)) return state;
    const next = node.continue.next;
    return { ...state, nodeId: next, history: state.history.concat([{ nodeId: state.nodeId, choiceId: '$continue' }]) };
  }
  function sanitizeSave(raw) {
    const done = raw && Array.isArray(raw.completed) ? ORDER.filter(id => raw.completed.includes(id)) : [];
    const runs = {};
    ORDER.forEach(id => { runs[id] = Math.max(0, Math.min(999, Math.floor(Number(raw && raw.runs && raw.runs[id]) || 0))); });
    return { completed: done, runs };
  }
  let progress = { completed: [], runs: Object.fromEntries(ORDER.map(id => [id, 0])) };
  try { progress = sanitizeSave(JSON.parse(root.localStorage.getItem(SAVE_KEY) || 'null')); } catch (_) { /* Private browsing or malformed data: the scenes remain playable. */ }
  function persist() { try { root.localStorage.setItem(SAVE_KEY, JSON.stringify(progress)); } catch (_) { /* Saving is optional; gameplay remains available. */ } }
  function isUnlocked(id) { const index = ORDER.indexOf(id); return index >= 0 && (index === 0 || progress.completed.includes(ORDER[index - 1])); }
  function scenarioList() { return ORDER.map(id => ({ id, title: scenarios[id].title, short: scenarios[id].short, setting: scenarios[id].setting, skill: scenarios[id].skill, unlocked: isUnlocked(id), completed: progress.completed.includes(id), runs: progress.runs[id] })); }
  function completeScenario(id) { if (!scenarios[id] || !isUnlocked(id)) return false; if (!progress.completed.includes(id)) { progress.completed.push(id); persist(); } return true; }

  let mountPoint = null, onExit = null, active = null, selectedId = null, variationEnabled = false, busy = false;
  const escapeHtml = value => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  function render(target, exit) { mountPoint = target; onExit = exit; active = null; selectedId = null; busy = false; renderMenu(); }
  function renderMenu() {
    const cards = scenarioList().map(item => `<button class="rt-case ${item.unlocked ? '' : 'is-locked'}" data-rt="choose-scenario" data-id="${item.id}" ${item.unlocked ? '' : 'disabled'}><span class="rt-case-top"><span>${item.unlocked ? item.completed ? 'REPLAYABLE' : 'READY' : 'LOCKED'}</span><span>${item.completed ? `${item.runs} plays` : 'NO TIMER'}</span></span><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.short)} · ${escapeHtml(item.setting)}</span><span class="rt-case-skill">Try: ${escapeHtml(item.skill)}</span></button>`).join('');
    mountPoint.innerHTML = `<section class="rt-shell"><div class="rt-heading-row"><div><div class="hub-eyebrow">A PLAYABLE SOCIAL SIMULATOR</div><h1 class="hub-heading">Real Talk</h1><p class="hub-subtitle">Try a response, see how this fictional scene changes, and replay to explore another path. There is no score or perfect answer.</p></div><button class="hub-card-button lavender" data-rt="exit">← Back to desktop</button></div><div class="rt-disclaimer">Fictional skill practice. This is not therapy, a diagnosis, or personal care advice. Real people and situations vary.</div><button class="rt-variation-toggle ${variationEnabled ? 'is-on' : ''}" data-rt="toggle-variation" aria-pressed="${variationEnabled}">${variationEnabled ? '✓ Alternate context on' : '◇ Try an alternate context'} <small>Changes some scene details; available in every replay.</small></button><div class="rt-case-grid">${cards}</div><div class="rt-footnote">Progress and completed scenes save on this device. No personal stories or responses are collected.</div></section>`;
  }
  function begin(id, variant = variationEnabled) {
    if (!isUnlocked(id) || !scenarios[id]) return;
    const run = progress.runs[id]; progress.runs[id] = Math.min(999, run + 1); persist();
    selectedId = id; active = freshState(id, run, variant); busy = false; renderScene();
  }
  function renderScene() {
    if (!active || !mountPoint) return renderMenu();
    const scenario = scenarios[active.scenarioId], node = scenario.nodes[active.nodeId];
    if (!node) { active = null; return renderMenu(); }
    const text = typeof node.text === 'function' ? node.text({ flags: active.flags, variant: active.variant }) : node.text;
    const characterMarkup = scenario.cast.map(([name, type], i) => `<div class="rt-character rt-${type} ${node.speaker === name ? 'is-speaking' : ''}" aria-label="${escapeHtml(name)}"><div class="rt-pixel-person"><span class="rt-hair"></span><span class="rt-face"><i></i><i></i><b></b></span><span class="rt-body"></span></div><span class="rt-nameplate">${escapeHtml(name)}</span></div>`).join('');
    let choices = '';
    if (node.interaction) {
      const done = active.observations.length > 0;
      choices = `<div class="rt-interact-label">CLICK TO LOOK AROUND <span>${active.observations.length}/${node.interactions.length} noticed</span></div><div class="rt-observation-row">${node.interactions.map(item => `<button class="rt-observation ${active.observations.includes(item.id) ? 'is-seen' : ''}" data-rt="observe" data-id="${item.id}" ${active.observations.includes(item.id) ? 'disabled' : ''}>${escapeHtml(item.label)}</button>`).join('')}</div>${active.observations.length ? `<p class="rt-observation-result" aria-live="polite">${escapeHtml(node.interactions.find(item => item.id === active.observations[active.observations.length - 1]).result)}</p>` : '<p class="rt-hint">Look around first. Your observations can change a later reaction.</p>'}<button class="hub-card-button rt-continue" data-rt="continue" ${done ? '' : 'disabled'}>${escapeHtml(node.continue.label)} →</button>`;
    } else if (node.ending) {
      const scenarioIndex = ORDER.indexOf(active.scenarioId), nextId = ORDER[scenarioIndex + 1];
      const newlyDone = !progress.completed.includes(active.scenarioId);
      completeScenario(active.scenarioId);
      choices = `<p class="rt-reflection">${escapeHtml(node.reflection)}</p><div class="rt-outcome"><span>PATH THIS TIME</span><strong>${escapeHtml((active.flags.outcome || 'scene-complete').replace(/-/g, ' '))}</strong><small>Different choices can lead to different conversations. None is scored.</small></div><div class="hub-action-row"><button class="hub-card-button" data-rt="replay">↻ Replay this scene</button>${nextId && isUnlocked(nextId) ? `<button class="hub-card-button lavender" data-rt="next">Play ${escapeHtml(scenarios[nextId].title)} →</button>` : nextId ? `<span class="rt-unlock-note">Next scene unlocked on the desktop.</span>` : ''}<button class="hub-card-button mint" data-rt="menu">Choose another scene</button></div>`;
      if (newlyDone && nextId) setTimeout(() => { if (selectedId === active?.scenarioId && mountPoint) { const note = mountPoint.querySelector('.rt-unlock-note'); if (note) note.textContent = `${scenarios[nextId].title} unlocked · choose another scene`; } }, 0);
    } else {
      choices = `<div class="rt-choice-list">${(node.choices || []).map((choice, index) => `<button class="rt-choice" data-rt="choice" data-id="${choice.id}" ${busy ? 'disabled' : ''}><span class="rt-choice-number">${index + 1}</span><span><strong>${escapeHtml(choice.label)}</strong><small>${escapeHtml(choice.detail)}</small></span><span class="rt-choice-arrow">↗</span></button>`).join('')}</div>`;
    }
    const expression = node.speaker === scenario.cast[0][0] ? 'focused' : node.speaker === scenario.cast[1][0] ? 'uncertain' : 'neutral';
    mountPoint.innerHTML = `<section class="rt-shell rt-playing"><div class="rt-play-top"><button class="hub-card-button lavender" data-rt="menu">← Scene selection</button><div><div class="hub-eyebrow">${escapeHtml(node.phase)}</div><h1 class="rt-play-title">${escapeHtml(scenario.title)}</h1></div><button class="rt-replay-quiet" data-rt="replay" title="Restart from the beginning">↻ Replay</button></div><div class="rt-scene rt-scene-${active.scenarioId}"><div class="rt-room-window"><i></i><i></i><i></i></div><div class="rt-room-sign">${escapeHtml(scenario.setting.toUpperCase())}</div><div class="rt-stage"><div class="rt-pixel-person rt-player" aria-label="You"><span class="rt-hair"></span><span class="rt-face"><i></i><i></i><b></b></span><span class="rt-body"></span><span class="rt-nameplate">YOU</span></div>${characterMarkup}<span class="rt-floor-rug"></span><span class="rt-stage-spark rt-spark-one">✦</span><span class="rt-stage-spark rt-spark-two">✧</span></div><div class="rt-scene-location">${escapeHtml(scenario.setting)} <span>•</span> ${escapeHtml(node.speaker)}</div><div class="rt-dialogue"><div class="rt-speaker-icon rt-expression-${expression}"><span></span></div><div class="rt-dialogue-copy"><span class="rt-speaker-name">${escapeHtml(node.speaker)}</span><p aria-live="polite">${escapeHtml(text)}</p></div></div></div><div class="rt-skill-line"><span>SCENE SKILL</span><strong>${escapeHtml(scenario.skill)}</strong><span class="rt-context-tag">${active.variant ? 'A slightly different group context' : 'A small social gathering'}</span></div><div class="rt-actions">${choices}</div><p class="rt-variation-note">Fictional outcomes vary with context, relationship, and safety. You can leave or replay any time.</p></section>`;
  }
  function handle(target, button) {
    if (!button || !button.dataset.rt || !mountPoint || !mountPoint.contains(button)) return false;
    const action = button.dataset.rt;
    if (action === 'exit') { active = null; if (onExit) onExit(); else renderMenu(); return true; }
    if (action === 'menu') { active = null; renderMenu(); return true; }
    if (action === 'toggle-variation') { variationEnabled = !variationEnabled; renderMenu(); return true; }
    if (action === 'choose-scenario') { begin(button.dataset.id); return true; }
    if (action === 'observe' && active) { active = applyObservation(active, button.dataset.id); renderScene(); return true; }
    if (action === 'continue' && active) { active = advance(active); renderScene(); return true; }
    if (action === 'choice' && active && !busy) { busy = true; const next = applyChoice(active, button.dataset.id); if (next === active) { busy = false; return true; } active = next; busy = false; renderScene(); return true; }
    if (action === 'replay' && selectedId) { begin(selectedId, active ? active.variant : variationEnabled); return true; }
    if (action === 'next' && selectedId) { const nextId = ORDER[ORDER.indexOf(selectedId) + 1]; if (nextId) begin(nextId); return true; }
    return false;
  }

  root.RealTalk = { render, handle, scenarios, validate, freshState, applyChoice, applyObservation, advance, resolveNext, completeScenario, getProgress: () => JSON.parse(JSON.stringify(progress)), scenarioList };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.RealTalk;
})(typeof window !== 'undefined' ? window : globalThis);
