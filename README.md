# Bleuming.exe — Y2K Pet Adventure

Bleuming.exe is a dependency-free pixel-art game built on the project's existing Canvas 2D renderer. The retro desktop hub includes Nihi, a CD library, two side-scrolling platform worlds, rhythm and memory mini-games, a collectible album, room and character cosmetics, settings, and local saves. Real Talk adds three replayable, branching social-skill scenes to the hub. The existing game assets and audio synthesizer are reused; no new runtime dependency or framework migration is required.

## Run locally

```bash
python -m http.server 8000
```

Open `http://localhost:8000`. No package installation or build step is needed. Core gameplay works offline.

## Controls

- Desktop navigation: mouse, Tab, Enter, or Space
- Platform levels: WASD or arrow keys to move; Space or Up to jump
- Pause a level: Pause button or Escape
- Sound and fullscreen: buttons in the desktop header
- Real Talk: inspect a scene, then choose a response. Tab and Enter work with the keyboard.

## Saves and privacy

Progress, worlds, collectibles, best times, cosmetics, room choices, and preferences are stored in this browser's local storage. There is no authentication or cross-device sync. Settings can reset preferences or delete the local profile. The optional wellbeing pause does not collect or send responses. Health-story choices are local and off by default; the optional story journal opens only chapters the player selected. CD personalization and AI chat have separate opt-ins. Level suggestions send the selected world and gameplay preferences. AI chat sends a player message and limited, confirmed game context only after the player enables AI chat and chooses to send a message. Chat text is not saved in the game profile. AI responses are not professional medical advice. Without consent or a configured server, Nihi uses authored local replies.
Real Talk completion and replay counts use a separate local storage key. Scene choices and observations stay in memory for that run and are not saved or transmitted. The scenes are fictional practice, not therapy, diagnosis, or personal care advice.

## Optional Vercel AI functions

- `api/nihi.js` serves concise, player-initiated Nihi dialogue.
- `api/personalize-level.js` returns schema-validated suggestions constrained to authored CD layouts, supported themes, and challenge levels.

Configure `OPENAI_API_KEY` (or `AI_API_KEY`) as a **server-side Vercel environment variable** to enable these functions. Never put a key in browser JavaScript. Without a key or network, authored worlds and local dialogue remain available.

## Files

- `game.js` — legacy garden systems, audio controls, and backward-compatible old save handling.
- `hub.js` — new desktop hub, CD level data/validation, platform physics, mini-games, Nihi, and profile persistence.
- `real-talk.js` — validated, data-driven scene graph, branching state transitions, replay, and local unlocks.
- `tests/real-talk.test.js` — Node tests for scene transitions and branches (`node --test tests/real-talk.test.js`).
- `index.html`, `style.css`, `hub.css`, `realtalk.css` — game shell, hub, onboarding, HUD, and responsive styles.
- `audio.js` — procedural Web Audio music and effects.
- `api/` — optional server-side AI endpoints.
- `assets/` — existing maps, sprites, portraits, and title art.
