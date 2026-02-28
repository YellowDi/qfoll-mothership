# Qifeng Tech Website

A brand website built with Vue 3 + Vite, showcasing company info, case studies, and news.

## Overview

- **Brand & Products**: Home, case studies, product pages (Yun Gui Bao, Water Environment Monitoring)
- **Content Hub**: News feed, article details, with Mermaid diagrams, KaTeX math, and syntax highlighting
- **Other Pages**: Contact, pricing, careers, design specs

## Tech Stack

| Category | Tech |
|----------|------|
| Framework | Vue 3 (Composition API) |
| Build | Vite 7 |
| Router | Vue Router 4 |
| Styling | Tailwind CSS 4 |
| Content | Markdown + custom frontmatter |
| Rendering | markdown-it, Mermaid, highlight.js, KaTeX |
| Images | vite-imagetools, vite-plugin-image-optimizer |

## Project Structure

```
src/
├── components/     # Shared components (HeaderBar, CoverImage, ContentListRow, etc.)
├── composables/    # Composition logic (theme, detail page interactions, speech synthesis, etc.)
├── content/        # Markdown content
│   ├── projects/   # Case studies
│   └── news/       # News articles
├── data/           # Content parsing and metadata (projects.js, news.js, contentParserShared.js)
├── layouts/        # Layouts (AppLayout)
├── router/         # Route config
├── styles/         # Global styles and Markdown typography
├── views/          # Page views
├── App.vue
├── main.js
└── style.css
```

## Requirements

- Node.js 18+
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
| `pnpm build` | Production build |
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

After `pnpm build`, static output goes to `dist/` and can be deployed to any static host.

## License

Private project. Do not distribute without authorization.
