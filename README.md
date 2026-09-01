# MindLink

**Shared Brain between Human & AI**

Live collaborative thinking canvas — Explore, Debate, Decide.  
With **Groq** (text + voice), free **images**, and **WebMCP** tools.

---

## Setup

```bash
cp .env.example .env.local
# Add GROQ_API_KEY from https://console.groq.com
npm install
npm run dev
```

Open http://localhost:3000

Without `GROQ_API_KEY` the app still works with smart mock thoughts.

---

## Features

- Explore mode — structured thoughts (risk, opportunity, insight…)
- **Debate mode** — Optimist vs Pessimist on the same canvas
- Per-thought **image** (Pollinations, free)
- Per-thought **voice** (Groq TTS when key is set)
- Expand / Challenge / Lock Decision
- WebMCP tools for agents

---

## Env

| Key | Required | Purpose |
|-----|----------|---------|
| `GROQ_API_KEY` | Recommended | Thinking + TTS |
| `OPENROUTER_API_KEY` | Optional | Backup |
| `HF_TOKEN` | Optional | Better images later |

Never commit `.env.local`.

---

## Demo

1. Pick **Explore** or **Debate**
2. Enter a hard question
3. Watch thoughts appear
4. Generate image / play voice on a card
5. Lock decision

---

MIT · WebMCP Challenge
