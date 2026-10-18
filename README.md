# 🌸 Bleuming — A Y2K Pixel-Art Women's Wellbeing Game

> *"You don't have to be the same as everyone else to deserve care."*

**Bleuming** is a cozy, indie pixel-art exploration and companion game built with authentic early-2000s Y2K nostalgia (bubblegum pink, lavender, retro window frames, sparkle effects, and digital pet charm). 

Designed for hackathons, game showcases, and thoughtful education, **Bleuming** connects heartwarming gameplay with women's physical and emotional wellbeing—specifically addressing **PCOS/PCOD bodily signals**, **postpartum emotional overwhelm**, and **sensory grounding during times of anxiety**.

---

## 🎮 How to Play Locally (Instant Setup)

Bleuming has **zero dependencies, no build steps, and no external npm packages**. It is 100% offline and self-contained with a built-in procedural Web Audio synthesizer.

### Method 1: Direct in Browser
Double-click `index.html` or drag it into any modern web browser (Chrome, Edge, Firefox, Safari).

### Method 2: Local Python Server (Recommended)
Open your terminal in the game folder and run:
```bash
# Using Python 3:
python -m http.server 8000
```
Then navigate to: `http://localhost:8000`

---

## 🕹️ Controls

| Action | Keyboard Key |
| :--- | :--- |
| **Walk Up / Down / Left / Right** | `W` `A` `S` `D` or `Arrow Keys` |
| **Examine / Interact** | `E` or `Space` or `Enter` |
| **Pocket Notes / Health Journal** | `J` or click the `📖` button |
| **Toggle Cozy 8-Bit Audio** | `M` or click the `🔊` button |
| **Close Modal / Escape** | `Esc` |

---

## 🌸 Core Game Loop & Health Experiences

### 1. Companion Nihi & The Faded Garden
- Meet **Nihi**, an expressive magical creature companion with 3 animated expressions (`happy`, `thoughtful`, and `concerned`).
- Nihi hovers alongside you, offering non-judgmental guidance and reacting to your choices.
- The garden begins quiet and faded with wilted flora and dense woodland fog.

### 2. Experience A: The Changing Garden (PCOS / Hormonal Awareness)
- **Objective:** Collect the 3 healing flora (*Dewdrop Crystal*, *Calming Chamomile*, and *Sunstone Sprout*) scattered on the stone garden paths.
- **The Shifting Mirror:** Visit the ornate mirror in the northwest grove. A garden spirit expresses distress over irregular cycles, skin changes, sudden fatigue, and self-comparison.
- **Compassionate Dialogue:** Learn that physical sensations are communicative signals rather than failures, and that PCOS is diverse rather than uniform.
- **Interactive Mini-Game (Dr. Visit Question Builder):** Choose 3 clear, neutral, empowering questions to bring to a healthcare provider. The questions are saved to your in-game Pocket Journal!
- **World Transformation:** The mirror glows clear, and surrounding flowerbeds burst into full bloom with vibrant pink and gold petals!

### 3. Experience B: The Tired Moon (Postpartum Wellbeing)
- **Objective:** Head to the cozy lavender cottage veranda with the warm rocking chair.
- **Meeting Maya:** Speak with Maya, an exhausted new parent carrying the weight of hormonal drops, sleep disruption, and the false guilt that feeling overwhelmed makes her a "bad caregiver."
- **Compassionate Dialogue:** Understand that postpartum depression/anxiety is a recognized, treatable medical condition—not a personal flaw.
- **Interactive Mini-Game (Support Message Builder):** Practice drafting a realistic, gentle message to a trusted friend, partner, or doctor asking for practical help (meals, rest, or medical check-in).
- **World Transformation:** Golden window light warms the cottage, baby lullaby chimes ring, and hearts float into the evening sky.

### 4. Experience C: The Foggy Forest (Emotional Grounding)
- **Objective:** Guide Nihi into the eastern thicket, which is shrouded in dense, dynamic, swirling mist.
- **Managing Overwhelm:** When Nihi feels panic rising, choose to pause rather than force through anxiety.
- **Interactive Mini-Game (5-4-3-2-1 Sensory Grounding & Calming Breath):**
  - Follow the breathing bubble (*Breathe in... Breathe out...*).
  - Tap 3 pastel colors, 2 soothing tactile sensations, and 1 kind self-affirmation.
- **World Transformation:** The mist smoothly rolls back and vanishes, revealing the sunlit grove and the ancient Heart Blossom!

### 5. Finale: The Bleuming Ceremony
- When all 3 journeys are complete, the entire garden radiates with animated sparkles and blooming flowers.
- Nihi and the player celebrate together.
- A final reflection screen summarizes your achievements and provides continued access to your Pocket Notes.

---

## 🩺 Health, Safety & Medical Boundaries

Bleuming adheres strictly to compassionate health education standards:
- **No Diagnostics:** The game never diagnoses PCOS, postpartum depression, or mental health disorders.
- **No False Cures:** It explicitly emphasizes that rest, positive thinking, or herbal tea do not replace medical care.
- **Anti-Shame:** No calorie trackers, weight ratings, or productivity penalties.
- **Encourages Professional Partnership:** Demonstrates that seeking help and preparing clear questions for licensed healthcare providers is an act of empowerment.

---

## 🎨 Technical & Aesthetic Highlights

- **Pure HTML5 / CSS3 / JavaScript:** No third-party engines or external dependencies.
- **Canvas 2D Procedural Pixel Engine:** Native 640x480 resolution with custom pixel-art sprites, 4-directional walk cycles, dynamic particle emitters, and animated water/fog shaders.
- **Synthesized Web Audio API:** Retro 8-bit chimes, footstep taps, dialog typewriter blips, bloom fanfares, and an optional generative pastel lullaby chord loop.
- **Y2K Retro Window Shell:** Early-2000s desktop pet styling, 3D beveled borders, sticker titlebars, and heart controls.

