# Qifeng Tech Website

A brand website built with React + TypeScript + Vite, showcasing company info, case studies, and news.

## Overview

- **Brand & Products**: Home, case studies, product pages (Yun Gui Bao, Water Environment Monitoring)
- **Content Hub**: News feed, article details, with Mermaid diagrams and syntax highlighting
- **Other Pages**: About (with contact), design specs

## Tech Stack

| Category | Tech |
|----------|------|
| Framework | React 19 + TypeScript |
| Build | Vite 8 (Rolldown) |
| Router | React Router 7 |
| Styling | Tailwind CSS 4 |
| Content | Markdown + custom frontmatter |
| Rendering | markdown-it, Mermaid, highlight.js, DOMPurify |
| Visuals | Hand-written Canvas/WebGL engines (`src/visuals`) |
| Images | vite-imagetools, vite-plugin-image-optimizer |

## Project Structure

```
src/
├── assets/         # Brand images, fonts and product media imported by source
├── composables/    # Framework-agnostic browser logic (inline video, tag links)
├── content/        # Markdown content
│   ├── projects/   # Case studies
│   └── news/       # News articles
├── data/           # Content parsing and metadata (projects.ts, news.ts, contentParserShared.ts, types.ts)
├── react/          # React app: router, layout shell, pages, hooks, providers
├── styles/         # Markdown media and icon-font styles
├── visuals/        # Framework-agnostic Canvas/WebGL engines (ygbPort, dotRipple, roadMap, ...)
└── style.css       # Design tokens, Tailwind base layer
scripts/            # Post-build SPA fallback (404.html)
public/             # Static assets served as-is (project images, icons, water-env video)
```

Standalone debug pages at the repo root (not routed in production): `ygb-hero-prototype.html`, `water-prototype.html`, `ygb-hero-react.html`.

## Requirements

- Node.js 20.19+ or 22.12+ (required by Vite 8)
- pnpm

## Quick Start

```bash
pnpm install
pnpm dev
```

Dev server: `http://localhost:5173`

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Local development |
| `pnpm typecheck` | Type-check with `tsc --noEmit` |
| `pnpm build` | Typecheck, production build, then generate `dist/404.html` |
| `pnpm preview` | Preview build output |

## Content

### Case Studies (`src/content/projects/`)

- One Markdown file per case
- Use frontmatter for title, year, tags, cover image, etc.
- Body supports Markdown, Mermaid, code blocks, and more

### News Articles (`src/content/news/`)

- One Markdown file per article
- Frontmatter: `title`, `publishedAt`, `category`, `lead`, `cover`, `infoTags`, etc.
- Shares the same Markdown rendering pipeline as case studies

Update parsing logic in `src/data/` when adding new frontmatter fields.

## Build & Deploy

After `pnpm build`, static output goes to `dist/` and can be deployed to any static host. `dist/404.html` is a copy of `index.html`, so the host must serve it for unknown paths to make deep links work with React Router.

## License

Private project. Do not distribute without authorization.
