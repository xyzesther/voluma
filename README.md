# Voluma

An AI-powered architectural visualization tool that transforms 2D floor plans into photorealistic top-down 3D renders.

## What It Does

Upload a floor plan image and Voluma uses Google Gemini 2.5 Flash (via the Puter AI platform) to generate a clean, photorealistic top-down 3D render — preserving exact geometry, adding realistic materials, furniture, and lighting. The visualizer page shows a before/after comparison slider so you can inspect the transformation in detail.

## Tech Stack

- **Framework**: React 19 + React Router v7 (SSR)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **AI**: Puter.js `puter.ai.txt2img` — Gemini 2.5 Flash image generation
- **Auth & Storage**: Puter.js (sign-in, static hosting, Worker API)
- **Image Comparison**: react-compare-slider

## Routes

| Route | Description |
|---|---|
| `/` | Landing page — upload a floor plan, view recent projects |
| `/visualizer/:id` | Project viewer — rendered output, before/after slider, export |

## Getting Started

### Prerequisites

- A [Puter](https://puter.com) account (required for auth and storage)
- A Puter Worker deployed to handle project persistence (see `.env.example`)

### Installation

```bash
npm install
```

### Environment

Copy `.env.example` and fill in your Puter Worker URL:

```bash
cp .env.example .env.local
```

```env
VITE_PUTER_WORKER_URL=https://your-puter-worker.puter.work
```

### Development

```bash
npm run dev
```

App runs at `http://localhost:5173`.

### Production Build

```bash
npm run build
npm start
```

## Upload Constraints

- **Accepted formats**: JPG, PNG, WebP
- **Max file size**: 50MB

## Project Structure

```
app/
  routes/
    home.tsx          # Landing page + upload flow
    visualizer.$id.tsx # Render viewer + export
components/
  Navbar.tsx
  Upload.tsx          # Drag-and-drop upload with progress
  ui/Button.tsx
lib/
  ai.action.ts        # Gemini image generation via Puter AI
  puter.action.ts     # Project CRUD via Puter Workers
  puter.hosting.ts    # Static image hosting via Puter
  constants.ts        # Prompts, limits, timing constants
```
