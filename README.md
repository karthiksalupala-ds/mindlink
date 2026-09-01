# MindLink

**Shared Brain between Human & AI**

Live collaborative thinking canvas — Explore, Debate, Decide.
With **Groq** (text + voice), free **images**, **WebMCP**, and a premium neural UI.

## Setup

```bash
cp .env.example .env.local
# Add GROQ_API_KEY from https://console.groq.com
npm install
npm run dev
```

Open http://localhost:3000

## Features

- Explore & Debate modes
- NVIDIA-style animated network background
- Premium neural thinking loader
- Dark glass thought cards + glow connections
- Per-thought image (Pollinations) & voice (Groq TTS)
- WebMCP tools for agents

## Models (Groq)

Uses `openai/gpt-oss-20b`, `openai/gpt-oss-120b`, `qwen/qwen3.6-27b`, `qwen/qwen3.8-27b` with automatic fallback + mock thoughts.

MIT · WebMCP Challenge
