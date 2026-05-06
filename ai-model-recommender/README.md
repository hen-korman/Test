# AI Model Recommender

> Find the perfect AI model for any task — powered by Claude AI, with an Awwwards-level cyberpunk UI.

A visually stunning web app that recommends the best AI model for your specific task from a database of 20+ major models, with real-time Claude-powered reasoning.

---

## Features

- **Smart Recommendations** — Claude Opus 4.7 analyzes your task and filters to find the top 3 models
- **Neural Network Background** — Interactive WebGL-inspired canvas that reacts to mouse movement
- **3D AI Orb** — React Three Fiber animated orb as the hero element
- **Glassmorphism UI** — Frosted glass cards with neon glow effects
- **Framer Motion Animations** — Spring physics on every transition
- **20+ Models** — Anthropic, OpenAI, Google, Meta, Mistral, DeepSeek, xAI, Alibaba, Microsoft
- **Bilingual Reasons** — Hebrew + English recommendation explanations
- **Model Comparison** — Side-by-side battle mode for up to 3 models
- **History Drawer** — Recent searches stored in localStorage
- **"Why not X?"** — Ask Claude why it skipped a specific model
- **Auto-update Script** — Fetches new models from OpenRouter API daily

---

## Setup

### Prerequisites

- Node.js 18+
- pnpm 8+

### Installation

```bash
git clone <repo-url>
cd ai-model-recommender
pnpm install
```

### Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your API key:

```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Get your key at [console.anthropic.com](https://console.anthropic.com).

### Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 + custom CSS |
| Animations | Framer Motion |
| 3D | React Three Fiber + Drei |
| Database | SQLite (better-sqlite3) |
| AI | Anthropic SDK (Claude Opus 4.7) |
| Icons | Lucide React |

---

## Models Database

Pre-seeded with 20+ curated models:

| Provider | Models |
|----------|--------|
| Anthropic | Claude Opus 4.7, Opus 4.6, Sonnet 4.6, Haiku 4.5 |
| OpenAI | GPT-5, o3, o4-mini, GPT-4.1 |
| Google | Gemini 2.5 Pro, Flash, Flash-Lite |
| Meta | Llama 4 Maverick, Scout |
| Mistral | Large 2, Codestral, Small |
| DeepSeek | V3, R1 |
| xAI | Grok 4 |
| Alibaba | Qwen 3 |
| Microsoft | Phi-4 |

Each model includes: capabilities, context window, pricing, benchmarks (MMLU, HumanEval, GPQA), strengths, and weaknesses.

---

## Scripts

```bash
# Seed the database manually
pnpm seed

# Check for new models from OpenRouter
OPENROUTER_API_KEY=sk-or-... pnpm update-models
```

---

## Project Structure

```
/app
  /api
    /recommend/route.ts    # Claude recommendation engine
    /models/route.ts       # Models API
    /why-not/route.ts      # "Why not X?" endpoint
  /compare/page.tsx        # Side-by-side comparison page
  /page.tsx                # Main page
  /layout.tsx
/components
  /ui                      # GlassCard, ModelCard, FilterChips, etc.
  /three                   # NeuralOrb (React Three Fiber)
  NeuralBackground.tsx     # Canvas neural network animation
/lib
  /db.ts                   # SQLite database layer
  /claude.ts               # Anthropic API integration
  /recommender.ts          # Filtering and utility functions
  /types.ts                # TypeScript types
/data
  /models.json             # Model database seed (20+ models)
/scripts
  /update-models.ts        # Auto-update from OpenRouter API
  /seed.ts                 # Database seed script
```

---

## Deployment (Vercel)

```bash
vercel deploy
```

Add `ANTHROPIC_API_KEY` in the Vercel dashboard under Environment Variables.

For daily model updates, add a cron job in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/update-models",
      "schedule": "0 3 * * *"
    }
  ]
}
```

---

## Accessibility

All animations respect `prefers-reduced-motion`. Keyboard navigation supported throughout.

---

## License

MIT
