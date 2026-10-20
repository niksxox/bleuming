# Bleuming.exe — The Unrushed World MVP

Bleuming now includes **The Unrushed World**, a quiet surreal environmental puzzle prototype built into the existing desktop hub.

## Play locally

```bash
python -m http.server 8000
```

Open `http://localhost:8000`. No package installation or build step is needed.

## The Unrushed World controls

- Move: arrow keys or WASD
- Shift between Stillness and Flow: Space
- Restart the puzzle: R or the Restart button
- Return to desktop: Escape or the Desktop button
- Touch players can use the on-screen directional pad and Shift button.

## Design principles

- No AI chatbot in the new game flow.
- No timers, streaks, lives, punishments, or daily obligations.
- One small environmental puzzle with phase-dependent gates, three light fragments, and a clear stopping point.
- Puzzle state is saved locally in this browser; no account or network connection is needed.
- This is a calming game design experiment, not a mental-health treatment or a claim of clinical benefit.

## Testing

Run the repository's existing Real Talk tests and the Unrushed logic tests with Node:

```bash
node --test tests/real-talk.test.js tests/unrushed.test.js
```

The new logic tests cover phase gates, collision, safe phase shifts, collectible handling, and reset behavior.
