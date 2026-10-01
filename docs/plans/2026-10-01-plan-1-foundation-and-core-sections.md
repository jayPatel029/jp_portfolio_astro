# Plan 1 — Foundation & Core Sections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A complete, responsive, accessible single-page Astro site with all of Jay's resume content (hero, impact, about, work, projects, more work, contact), dark/light themes, and sticky navigation. Plain but polished, with no signature animations yet.

**Architecture:** A static Astro 6 site with zero client framework. All content lives in one typed TypeScript file (`src/content/profile.ts`), so a typo fails `astro check`. Sections are small `.astro` components composed in `src/pages/index.astro`. The only client JS is three tiny vanilla scripts: theme toggle, mobile menu + active-section highlight, and copy-email. Theming uses CSS variables switched by `data-theme` on `<html>`, mapped into Tailwind v4 theme tokens.

**Tech Stack:** Astro 6, TypeScript (strict), Tailwind CSS v4 via `@tailwindcss/vite`, Fontsource (self-hosted Space Grotesk + JetBrains Mono), Firebase Hosting (config only; no deploy in this plan).

**Spec:** `docs/portfolio-revamp.md`

## Global Constraints

- Project root: `C:\Users\jaysu\Desktop\ME\Jay-Portfolio\portfolio_astro` (separate git repo, branch `main`).
- Node ≥ 22.12 (installed: 22.14.0). npm 11.
- Astro 7.x (npm `latest` at install time resolved to 7.3.5; the plan was drafted against 6.x and uses only APIs common to both). Tailwind v4 through `@tailwindcss/vite`. **Do not** use the deprecated `@astrojs/tailwind` integration.
- No React or other UI framework in this plan; it arrives in Plan 3 with the hero animation.
- **No phone number anywhere**: not in pages, meta tags or JSON-LD.
- Atomic Loops content = only what is in `docs/resume.txt`. No client names, screenshots or sample documents.
- Accent color: `#FF7A1A` in dark theme, `#B54708` in light theme. (`#D9580A` from the spec was adjusted because it measures ~3.5:1 on the paper background; `#B54708` measures ~4.8:1 and passes WCAG AA for body text.)
- Responsive rules: no fixed heights on content sections, no fixed aspect ratios on cards that contain text, content max width `max-w-6xl` (72rem), long strings must wrap.
- Fonts are self-hosted via Fontsource, with no runtime Google Fonts requests.
- The site URL lives in exactly one place: `site` in `astro.config.mjs`.
- **Owner preferences:** do not write automated tests. Do not run `npm run dev`, `npm run build`, `npm run check` or any other verification command unless the owner asks. The "Manual check" steps below describe what to look at *when asked*. Do not commit unless the owner asks; each task ends with a checkpoint where the owner decides.

## Later Plans (not in scope here)

- **Plan 2 — Signature layer:** detection-box hover/focus motif, generated project visuals, project cluster filter tabs, Formspree contact form, OG share image, sitemap.
- **Plan 3 — Hero inference-pipeline animation** (React island, reduced-motion fallback = the static hero built here).
- **Plan 4 — Cutover & hardening:** Firebase deploy from this repo, responsive test matrix, Lighthouse/a11y pass.

## File Structure

```
portfolio_astro/
├── .firebaserc                     Firebase project alias (same project as the Flutter site)
├── .gitignore
├── astro.config.mjs                Astro config; owns the canonical site URL
├── firebase.json                   Hosting config + cache headers
├── package.json
├── tsconfig.json
├── README.md
├── public/
│   ├── favicon.svg
│   └── robots.txt
└── src/
    ├── config/site.ts              Site title, description, nav items
    ├── content/types.ts            Content type definitions
    ├── content/profile.ts          All resume content (single source of truth)
    ├── styles/global.css           Tailwind import, theme tokens, base + component styles
    ├── layouts/BaseLayout.astro    <html>, <head> meta, JSON-LD, theme bootstrap, skip link
    ├── components/
    │   ├── layout/Container.astro  Max-width wrapper
    │   ├── layout/Section.astro    Section frame: id, "// label", h2
    │   ├── layout/SiteHeader.astro Sticky header, desktop + mobile nav, active section
    │   ├── layout/ThemeToggle.astro
    │   ├── layout/SiteFooter.astro
    │   ├── ui/ExternalLink.astro   <a target=_blank> with rel + screen-reader hint
    │   └── sections/
    │       ├── Hero.astro
    │       ├── Impact.astro
    │       ├── About.astro
    │       ├── Experience.astro
    │       ├── Projects.astro
    │       ├── MoreWork.astro
    │       └── Contact.astro
    └── pages/
        ├── index.astro
        └── 404.astro
```

---

### Task 1: Scaffold the project and tooling

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore`, `firebase.json`, `.firebaserc`, `README.md`, `public/favicon.svg`, `public/robots.txt`

**Interfaces:**
- Produces: npm scripts `dev`, `check`, `build`, `preview`; `Astro.site` = `https://my-portfolio-ec4b7.web.app`.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "portfolio_astro",
  "type": "module",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "check": "astro check",
    "build": "astro check && astro build",
    "preview": "astro preview"
  }
}
```

- [ ] **Step 2: Install dependencies (latest versions via npm)**

Run in the project root:

```bash
npm install astro tailwindcss @tailwindcss/vite @fontsource-variable/space-grotesk @fontsource-variable/jetbrains-mono
npm install -D @astrojs/check typescript
```

Expected: `package.json` gains `dependencies` and `devDependencies`, and `package-lock.json` + `node_modules/` are created. `astro` resolves to 6.x.

- [ ] **Step 3: Create `astro.config.mjs`**

```js
// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://my-portfolio-ec4b7.web.app',
  vite: {
    plugins: [tailwindcss()],
  },
});
```

- [ ] **Step 4: Create `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

- [ ] **Step 5: Create `.gitignore`**

```gitignore
node_modules/
dist/
.astro/
.firebase/
.env
.env.*
npm-debug.log*
.DS_Store
```

- [ ] **Step 6: Create `.firebaserc`**

```json
{
  "projects": {
    "default": "my-portfolio-ec4b7"
  }
}
```

- [ ] **Step 7: Create `firebase.json`**

Firebase applies header rules top to bottom and the **last** match wins, so the long cache for hashed `/_astro/` files must come after the general `no-cache` rule.

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "cleanUrls": true,
    "trailingSlash": false,
    "headers": [
      {
        "source": "**",
        "headers": [{ "key": "Cache-Control", "value": "no-cache" }]
      },
      {
        "source": "/_astro/**",
        "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
      }
    ]
  }
}
```

- [ ] **Step 8: Create `public/favicon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="4" fill="#0b0d0f"/>
  <path d="M9 7H6v18h3M23 7h3v18h-3" stroke="#ff7a1a" stroke-width="2" fill="none"/>
  <text x="16" y="20.5" font-family="monospace" font-size="10" font-weight="700" fill="#e8eaed" text-anchor="middle">JP</text>
</svg>
```

- [ ] **Step 9: Create `public/robots.txt`**

```text
User-agent: *
Allow: /
```

- [ ] **Step 10: Create `README.md`**

```markdown
# portfolio_astro

Personal portfolio of Jay Patel (AI/ML Engineer), built with Astro + Tailwind CSS.

## Commands

| Command           | Action                                  |
| ----------------- | --------------------------------------- |
| `npm install`     | Install dependencies                    |
| `npm run dev`     | Start the dev server at localhost:4321  |
| `npm run check`   | Type-check `.astro` and `.ts` files     |
| `npm run build`   | Type-check, then build to `dist/`       |
| `npm run preview` | Serve the built site locally            |

## Editing content

All text, links, experience and projects live in `src/content/profile.ts`.
The site URL is set once in `astro.config.mjs` (`site`).

## Deploying

Hosting is Firebase (`my-portfolio-ec4b7`, same project as the old Flutter site):

    npm run build
    firebase deploy --only hosting

Design notes and plans are in `docs/`.
```

- [ ] **Step 11: Checkpoint**

Owner reviews the scaffold. Commit only if the owner asks, e.g. `git add -A && git commit -m "chore: scaffold Astro project with Tailwind and Firebase config"`.

---

### Task 2: Design tokens and global styles

**Files:**
- Create: `src/styles/global.css`

**Interfaces:**
- Produces Tailwind color utilities `bg|text|border-{bg,surface,line,fg,muted,accent,accent-fg}`, font utilities `font-sans` / `font-mono`, and CSS classes `.btn-primary`, `.btn-secondary`, `.hero-grid`, `.theme-icon-sun`, `.theme-icon-moon`.

- [ ] **Step 1: Create `src/styles/global.css`**

```css
@import "tailwindcss";

:root,
[data-theme="dark"] {
  --bg: #0b0d0f;
  --surface: #13161a;
  --line: #262b31;
  --fg: #e8eaed;
  --muted: #9aa3ad;
  --accent: #ff7a1a;
  --accent-fg: #0b0d0f;
  color-scheme: dark;
}

[data-theme="light"] {
  --bg: #f4f1ea;
  --surface: #fbf9f4;
  --line: #d9d3c7;
  --fg: #1a1c1e;
  --muted: #5b6168;
  --accent: #b54708;
  --accent-fg: #ffffff;
  color-scheme: light;
}

@theme inline {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-line: var(--line);
  --color-fg: var(--fg);
  --color-muted: var(--muted);
  --color-accent: var(--accent);
  --color-accent-fg: var(--accent-fg);
}

@theme {
  --font-sans: "Space Grotesk Variable", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono Variable", ui-monospace, SFMono-Regular, monospace;
}

@layer base {
  html {
    scroll-behavior: smooth;
    scroll-padding-top: 5rem;
  }

  body {
    background-color: var(--bg);
    color: var(--fg);
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  :focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 3px;
    border-radius: 2px;
  }

  ::selection {
    background-color: var(--accent);
    color: var(--accent-fg);
  }
}

@layer components {
  .btn-primary,
  .btn-secondary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    min-height: 2.75rem;
    border-radius: 0.25rem;
    padding: 0.75rem 1.25rem;
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    transition: color 150ms, background-color 150ms, border-color 150ms, filter 150ms;
  }

  .btn-primary {
    background-color: var(--accent);
    color: var(--accent-fg);
  }

  .btn-primary:hover {
    filter: brightness(1.08);
  }

  .btn-secondary {
    border: 1px solid var(--line);
    color: var(--fg);
  }

  .btn-secondary:hover {
    border-color: var(--accent);
    color: var(--accent);
  }

  .hero-grid {
    background-image:
      linear-gradient(var(--line) 1px, transparent 1px),
      linear-gradient(90deg, var(--line) 1px, transparent 1px);
    background-size: 48px 48px;
    mask-image: radial-gradient(ellipse at 30% 40%, black 0%, transparent 70%);
    opacity: 0.6;
  }

  [data-theme="dark"] .theme-icon-moon,
  [data-theme="light"] .theme-icon-sun {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }

  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 2: Checkpoint**

Owner reviews the tokens. Commit only if asked: `git add src/styles/global.css && git commit -m "feat: add design tokens and global styles"`.

---

### Task 3: Content model and resume data

**Files:**
- Create: `src/content/types.ts`, `src/content/profile.ts`, `src/config/site.ts`

**Interfaces:**
- Produces: `profile: Profile`, `clusterLabels: Record<ProjectCluster, string>` (from `src/content/profile.ts`); `site` with `title`, `description`, `nav` (from `src/config/site.ts`); all types in `src/content/types.ts`.

- [ ] **Step 1: Create `src/content/types.ts`**

```ts
export type ProjectCluster = 'vision' | 'document-ai' | 'llm-agents' | 'systems';

export interface ExternalLinkItem {
  label: string;
  href: string;
}

export interface Education {
  school: string;
  degree: string;
  location: string;
  start: string;
  end: string;
  grade: string;
}

export interface SkillGroup {
  layer: string;
  items: string[];
}

export interface Experience {
  role: string;
  company: string;
  location?: string;
  start: string;
  /** `null` means the role is current. */
  end: string | null;
  /** Model-card framing label shown above the role, e.g. "production". */
  stage: string;
  highlights: string[];
}

export interface Metric {
  value: string;
  label: string;
  source: string;
}

export interface Project {
  slug: string;
  title: string;
  cluster: ProjectCluster;
  origin: string;
  summary: string;
  highlights: string[];
  stack: string[];
  links: ExternalLinkItem[];
}

export interface ArchiveItem {
  title: string;
  description: string;
  stack: string[];
  href: string;
}

export interface Achievement {
  title: string;
  description: string;
}

export interface Profile {
  name: string;
  initials: string;
  role: string;
  headline: string;
  summary: string;
  location: string;
  status: string;
  email: string;
  cvUrl: string;
  socials: ExternalLinkItem[];
  education: Education;
  skills: SkillGroup[];
  experience: Experience[];
  metrics: Metric[];
  projects: Project[];
  archive: ArchiveItem[];
  achievements: Achievement[];
}
```

- [ ] **Step 2: Create `src/content/profile.ts`**

```ts
import type { Profile, ProjectCluster } from './types';

export const clusterLabels: Record<ProjectCluster, string> = {
  vision: 'Vision',
  'document-ai': 'Document AI',
  'llm-agents': 'LLM / Agents',
  systems: 'Systems',
};

export const profile: Profile = {
  name: 'Jay Patel',
  initials: 'JP',
  role: 'AI/ML Engineer',
  headline: 'I make vision and language models work on real documents and real GPUs.',
  summary:
    'AI/ML Engineer with hands-on experience in computer vision, document intelligence, VLMs, and production inference systems. Skilled in Python, deep learning, image retrieval, OCR pipelines, LLM/VLM integration, and model optimization for resource-constrained environments.',
  location: 'Pune, Maharashtra, India',
  status: 'Software Engineer (AI/ML) at Atomic Loops, Pune',
  email: 'jaysunilpatel2002@gmail.com',
  cvUrl: 'https://drive.google.com/file/d/1TQmPepxVTBuhk_NqN-l3z4cDxqezJOUc/view?usp=sharing',
  socials: [
    { label: 'GitHub', href: 'https://github.com/jayPatel029' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/jay-patel-7aa2a3253/' },
  ],
  education: {
    school: 'MIT Academy of Engineering',
    degree: 'B.Tech in Computer Engineering',
    location: 'Pune, Maharashtra',
    start: 'Dec 2021',
    end: 'Jul 2025',
    grade: 'CGPA 7.4',
  },
  skills: [
    { layer: 'Languages', items: ['Python', 'Java'] },
    {
      layer: 'Computer Vision',
      items: ['OpenCV', 'YOLO', 'DINOv2', 'OpenVINO', 'PaddleOCR', 'MobileNetV2'],
    },
    {
      layer: 'ML & Deep Learning',
      items: ['TensorFlow', 'Keras', 'ONNX', 'XGBoost', 'Model Quantization'],
    },
    {
      layer: 'LLM & VLM',
      items: ['Qwen2.5-VL', 'Local VLM Inference', 'Pydantic-AI', 'Prompt Engineering'],
    },
    {
      layer: 'Inference & Systems',
      items: ['Transformers', 'BitsAndBytes', 'Batched Inference', 'Multithreading', 'Parallel Processing'],
    },
    { layer: 'Backend', items: ['Node.js', 'REST APIs', 'JWT Authentication'] },
    {
      layer: 'Data & Infrastructure',
      items: ['BeautifulSoup', 'Dataset Generation', 'OCR Pipelines', 'MySQL', 'MariaDB', 'AWS S3', 'Git'],
    },
  ],
  experience: [
    {
      role: 'Software Engineer (AI/ML)',
      company: 'Atomic Loops',
      location: 'Pune',
      start: 'Aug 2025',
      end: null,
      stage: 'production',
      highlights: [
        'Built a production-grade document intelligence pipeline using PaddleOCR and Qwen2.5-VL 7B, combining image preprocessing, raw OCR extraction, and prompts to transform invoices and manufacturing documents into structured JSON.',
        'Optimized Qwen2.5-VL for constrained GPU environments using 4-bit quantization with BitsAndBytes and Transformers, enabling local VLM inference within approximately 6 GB of GPU memory on a 10 GB GPU.',
        'Developed a fine-grained image similarity search system using DINOv2 embeddings to identify industrial objects and tools with subtle visual differences in shape, component count, and spatial configuration.',
        'Improved fine-grained retrieval by using patch-level embeddings instead of a single CLS-token representation, preserving localized visual features and improving top-match retrieval for visually similar objects.',
        'Built a Python-based image inference service handling image preprocessing, model inference, and result storage, using ONNX batched inference and thread pools to process multiple images concurrently.',
        'Trained and deployed YOLO models for real-time tool detection and counting, optimizing models for accuracy and low-latency inference.',
        'Designed agentic AI pipelines using LLMs and Pydantic-AI for structured outputs, response validation, and multi-step AI workflows.',
      ],
    },
    {
      role: 'Full Stack Developer Intern',
      company: 'Kifayti Health',
      location: 'Bangalore (Remote)',
      start: 'Oct 2024',
      end: 'Jul 2025',
      stage: 'fine-tuning',
      highlights: [
        'Built and optimized backend systems using Node.js and MariaDB, implementing REST APIs and JWT authentication.',
        'Integrated Fitbit (OAuth 2.0) and Google Health SDK for real-time health data synchronization.',
        'Developed automation features using WorkManager and Firebase Cloud Messaging (FCM) for alerts and notifications.',
        'Deployed backend services on a VPS and integrated AWS S3 for secure storage.',
      ],
    },
    {
      role: 'Flutter Developer Intern',
      company: 'Woodesy',
      start: 'Jun 2024',
      end: 'Oct 2024',
      stage: 'warm-up',
      highlights: [
        'Engineered Flutter apps for drivers, users, and vendors.',
        'Led the backend migration to Node.js.',
        'Optimized lazy loading and API integrations, and implemented GetX for state management.',
      ],
    },
  ],
  metrics: [
    {
      value: '7B',
      label: 'parameter VLM (Qwen2.5-VL) running locally on a 10 GB GPU',
      source: 'Document Intelligence Pipeline',
    },
    {
      value: '~6 GB',
      label: 'GPU memory used after 4-bit quantization',
      source: 'Document Intelligence Pipeline',
    },
    {
      value: '94%+',
      label: 'accuracy in QR code forgery detection',
      source: 'QR Code Counterfeit Detection',
    },
    {
      value: '60%+',
      label: 'less manual HR effort through OCR-driven onboarding',
      source: 'AI-Powered Onboarding Automation',
    },
  ],
  projects: [
    {
      slug: 'document-intelligence',
      title: 'Document Intelligence Pipeline',
      cluster: 'document-ai',
      origin: 'Atomic Loops',
      summary: 'Production pipeline that turns invoices and manufacturing documents into structured JSON.',
      highlights: [
        'Combines image preprocessing, raw OCR extraction with PaddleOCR, and prompting Qwen2.5-VL 7B.',
        '4-bit quantization with BitsAndBytes keeps local VLM inference within ~6 GB of GPU memory on a 10 GB GPU.',
      ],
      stack: ['PaddleOCR', 'Qwen2.5-VL 7B', 'Transformers', 'BitsAndBytes', 'Python'],
      links: [],
    },
    {
      slug: 'fine-grained-retrieval',
      title: 'Fine-Grained Image Similarity Search',
      cluster: 'vision',
      origin: 'Atomic Loops',
      summary:
        'Identifies industrial objects and tools that differ only subtly in shape, component count and spatial configuration.',
      highlights: [
        'Built on DINOv2 embeddings.',
        'Patch-level embeddings instead of a single CLS token preserve localized features and improve top-match retrieval for visually similar objects.',
      ],
      stack: ['DINOv2', 'Patch-level embeddings', 'Python'],
      links: [],
    },
    {
      slug: 'tool-detection',
      title: 'Real-Time Tool Detection & Counting',
      cluster: 'vision',
      origin: 'Atomic Loops',
      summary: 'YOLO models trained and deployed to detect and count tools in real time.',
      highlights: ['Optimized for both accuracy and low-latency inference.'],
      stack: ['YOLO', 'Python'],
      links: [],
    },
    {
      slug: 'agentic-pipelines',
      title: 'Agentic AI Pipelines',
      cluster: 'llm-agents',
      origin: 'Atomic Loops',
      summary: 'Multi-step LLM workflows with structured, validated outputs.',
      highlights: ['Pydantic-AI enforces structured outputs and response validation across workflow steps.'],
      stack: ['LLMs', 'Pydantic-AI', 'Python'],
      links: [],
    },
    {
      slug: 'batched-inference-service',
      title: 'Batched Image Inference Service',
      cluster: 'systems',
      origin: 'Atomic Loops',
      summary: 'Python service covering image preprocessing, model inference and result storage.',
      highlights: ['ONNX batched inference and thread pools process multiple images concurrently.'],
      stack: ['ONNX', 'Python', 'Thread pools'],
      links: [],
    },
    {
      slug: 'emotion-recognition',
      title: 'Multi-Modal Emotion Recognition',
      cluster: 'vision',
      origin: 'Major project',
      summary: 'Offline system that classifies user emotions from facial and speech inputs.',
      highlights: [
        'Trained on the FER and RAVDESS datasets.',
        'Combines CNNs and LSTMs with decision-level fusion to improve accuracy across modalities.',
      ],
      stack: ['Python', 'TensorFlow', 'Keras', 'OpenCV'],
      links: [
        {
          label: 'Project files',
          href: 'https://drive.google.com/file/d/13V16cqKzv0VOzFo4fvVet9S08sUplgpe/view?usp=drive_link',
        },
      ],
    },
    {
      slug: 'qr-counterfeit-detection',
      title: 'QR Code Counterfeit Detection',
      cluster: 'vision',
      origin: 'Major project',
      summary: 'CNN-based forgery detection for QR codes.',
      highlights: [
        'Achieved 94%+ accuracy with a MobileNetV2-based CNN.',
        'Benchmarked against HOG, LBP and ORB features with XGBoost.',
      ],
      stack: ['TensorFlow', 'Keras', 'OpenCV', 'XGBoost'],
      links: [{ label: 'Code', href: 'https://github.com/jayPatel029/QR-Code-Authenticaiton-using-ML' }],
    },
    {
      slug: 'onboarding-automation',
      title: 'AI-Powered Onboarding Automation',
      cluster: 'document-ai',
      origin: 'Major project',
      summary: 'Automated document parsing and form-filling for HR onboarding.',
      highlights: [
        'OCR and regex-based extraction cut HR effort by over 60%.',
        'Scalable full-stack platform with a Flutter frontend and Django backend.',
      ],
      stack: ['Flutter', 'Django', 'OCR'],
      links: [
        { label: 'Code', href: 'https://github.com/jayPatel029/Automated-Candidate-Onboarding-System' },
        { label: 'Demo video', href: 'https://www.youtube.com/watch?v=oGSM1IDRRDo' },
      ],
    },
  ],
  archive: [
    {
      title: 'Crypto Trade-Sentiment Analysis',
      description:
        'Historical crypto trades analyzed against the Fear & Greed Index to find patterns in trader behavior and profitability across sentiment phases.',
      stack: ['Python', 'Pandas', 'Matplotlib', 'Seaborn'],
      href: 'https://github.com/jayPatel029/crypto-trade-sentiment-analysis',
    },
    {
      title: 'Credit Card Scraper',
      description:
        'Extracts credit card information from web pages or PDF documents using an LLM (Groq API), with a Streamlit UI.',
      stack: ['Python', 'LLM', 'Streamlit'],
      href: 'https://github.com/jayPatel029/credit_ard_scraper_bh',
    },
  ],
  achievements: [
    {
      title: 'Amazon ML Hackathon',
      description: 'Developed an ML pipeline for entity extraction (OCR + NLP).',
    },
  ],
};
```

- [ ] **Step 3: Create `src/config/site.ts`**

```ts
export const site = {
  title: 'Jay Patel — AI/ML Engineer',
  description:
    'Jay Patel is an AI/ML Engineer working on computer vision, document intelligence, VLMs and production inference systems.',
  nav: [
    { label: 'About', href: '#about' },
    { label: 'Work', href: '#experience' },
    { label: 'Projects', href: '#projects' },
    { label: 'Contact', href: '#contact' },
  ],
} as const;
```

- [ ] **Step 4: Checkpoint**

Owner proofreads `profile.ts` against `docs/resume.txt`. Commit only if asked: `git add src/content src/config && git commit -m "feat: add typed profile content from resume"`.

---

### Task 4: Base layout, layout primitives and page skeleton

**Files:**
- Create: `src/layouts/BaseLayout.astro`, `src/components/layout/Container.astro`, `src/components/layout/Section.astro`, `src/components/ui/ExternalLink.astro`, `src/pages/index.astro`

**Interfaces:**
- Consumes: `site` (`src/config/site.ts`), `profile` (`src/content/profile.ts`), `src/styles/global.css`.
- Produces:
  - `<BaseLayout title?: string description?: string>` with a default slot.
  - `<Container class?: string>` with a default slot.
  - `<Section id: string label: string title: string>` with a default slot; renders `<section id>` with an `h2#{id}-title`.
  - `<ExternalLink href: string ...anchor attributes>` with a default slot.
  - `index.astro` contains `<main id="main" tabindex="-1">`.

- [ ] **Step 1: Create `src/layouts/BaseLayout.astro`**

```astro
---
import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/jetbrains-mono';
import '../styles/global.css';
import { site } from '../config/site';
import { profile } from '../content/profile';

interface Props {
  title?: string;
  description?: string;
}

const { title = site.title, description = site.description } = Astro.props;
const canonicalUrl = new URL(Astro.url.pathname, Astro.site);

const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: profile.name,
  jobTitle: profile.role,
  email: profile.email,
  url: Astro.site?.toString(),
  address: { '@type': 'PostalAddress', addressLocality: 'Pune', addressCountry: 'IN' },
  sameAs: profile.socials.map((social) => social.href),
};
---

<!doctype html>
<html lang="en" data-theme="dark">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonicalUrl} />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content={profile.name} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonicalUrl} />
    <meta name="twitter:card" content="summary" />
    <script is:inline>
      (() => {
        let stored = null;
        try {
          stored = localStorage.getItem('theme');
        } catch {}
        const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
        const theme = stored === 'light' || stored === 'dark' ? stored : prefersLight ? 'light' : 'dark';
        document.documentElement.dataset.theme = theme;
      })();
    </script>
    <script type="application/ld+json" set:html={JSON.stringify(personSchema)} />
  </head>
  <body class="min-h-dvh">
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-fg"
    >
      Skip to content
    </a>
    <slot />
  </body>
</html>
```

- [ ] **Step 2: Create `src/components/layout/Container.astro`**

```astro
---
interface Props {
  class?: string;
}

const { class: className } = Astro.props;
---

<div class:list={['mx-auto w-full max-w-6xl px-5 sm:px-8', className]}>
  <slot />
</div>
```

- [ ] **Step 3: Create `src/components/layout/Section.astro`**

```astro
---
import Container from './Container.astro';

interface Props {
  id: string;
  label: string;
  title: string;
}

const { id, label, title } = Astro.props;
const headingId = `${id}-title`;
---

<section id={id} aria-labelledby={headingId} class="border-t border-line py-20 sm:py-28">
  <Container>
    <p class="font-mono text-xs uppercase tracking-[0.2em] text-accent">// {label}</p>
    <h2 id={headingId} class="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
    <div class="mt-10 sm:mt-14">
      <slot />
    </div>
  </Container>
</section>
```

- [ ] **Step 4: Create `src/components/ui/ExternalLink.astro`**

```astro
---
import type { HTMLAttributes } from 'astro/types';

type Props = HTMLAttributes<'a'> & { href: string };

const { href, ...attributes } = Astro.props;
---

<a href={href} target="_blank" rel="noopener noreferrer" {...attributes}>
  <slot /><span class="sr-only"> (opens in a new tab)</span>
</a>
```

- [ ] **Step 5: Create `src/pages/index.astro` (skeleton; sections are added by later tasks)**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout>
  <main id="main" tabindex="-1" class="outline-none"></main>
</BaseLayout>
```

- [ ] **Step 6: Manual check (only when the owner asks)**

Run `npm run dev` and open `http://localhost:4321`. Expected: an empty dark page with the Space Grotesk font loaded (DevTools → Network shows `.woff2` files served from `/_astro/` or `/@fs/`, with no requests to `fonts.googleapis.com`). Pressing Tab once shows the "Skip to content" link in the top-left corner.

- [ ] **Step 7: Checkpoint**

Commit only if asked: `git add src/layouts src/components src/pages && git commit -m "feat: add base layout and layout primitives"`.

---

### Task 5: Header, navigation and theme toggle

**Files:**
- Create: `src/components/layout/ThemeToggle.astro`, `src/components/layout/SiteHeader.astro`
- Modify: `src/pages/index.astro` (full content below)

**Interfaces:**
- Consumes: `site.nav`, `profile.initials`, `profile.name`, `profile.cvUrl`, `Container`, `ExternalLink`.
- Produces: `<SiteHeader />` (no props) and `<ThemeToggle />` (no props). Nav links carry `data-nav-link`; the active link gets `aria-current="true"`. The header's logo links to `#top`, which `Hero` (Task 6) provides.

- [ ] **Step 1: Create `src/components/layout/ThemeToggle.astro`**

```astro
<button
  type="button"
  data-theme-toggle
  aria-label="Switch to light theme"
  class="inline-flex h-10 w-10 items-center justify-center rounded border border-line text-muted transition-colors hover:border-accent hover:text-accent"
>
  <svg class="theme-icon-sun h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
    <circle cx="12" cy="12" r="4"></circle>
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path>
  </svg>
  <svg class="theme-icon-moon h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
  </svg>
</button>

<script>
  type Theme = 'light' | 'dark';

  const toggles = document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]');

  function currentTheme(): Theme {
    return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
  }

  function oppositeOf(theme: Theme): Theme {
    return theme === 'dark' ? 'light' : 'dark';
  }

  function syncLabels() {
    const label = `Switch to ${oppositeOf(currentTheme())} theme`;
    toggles.forEach((toggle) => toggle.setAttribute('aria-label', label));
  }

  toggles.forEach((toggle) =>
    toggle.addEventListener('click', () => {
      const next = oppositeOf(currentTheme());
      document.documentElement.dataset.theme = next;
      try {
        localStorage.setItem('theme', next);
      } catch {
        // localStorage throws in some private-browsing modes; the theme still applies for this visit.
      }
      syncLabels();
    }),
  );

  syncLabels();
</script>
```

- [ ] **Step 2: Create `src/components/layout/SiteHeader.astro`**

```astro
---
import Container from './Container.astro';
import ThemeToggle from './ThemeToggle.astro';
import ExternalLink from '../ui/ExternalLink.astro';
import { site } from '../../config/site';
import { profile } from '../../content/profile';
---

<header class="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur">
  <Container class="flex h-16 items-center justify-between gap-4">
    <a href="#top" class="font-mono text-sm font-semibold tracking-wider" aria-label={`${profile.name}, back to top`}>
      <span class="text-accent">[</span>{profile.initials}<span class="text-accent">]</span>
    </a>

    <nav aria-label="Primary" class="hidden md:block">
      <ul class="flex items-center gap-1">
        {
          site.nav.map((item) => (
            <li>
              <a
                href={item.href}
                data-nav-link
                class="rounded px-3 py-2 text-sm text-muted transition-colors hover:text-fg aria-[current=true]:text-accent"
              >
                {item.label}
              </a>
            </li>
          ))
        }
      </ul>
    </nav>

    <div class="flex items-center gap-2">
      <ExternalLink
        href={profile.cvUrl}
        class="hidden h-10 items-center rounded border border-line px-3 font-mono text-xs uppercase tracking-wider transition-colors hover:border-accent hover:text-accent sm:inline-flex"
      >
        CV
      </ExternalLink>
      <ThemeToggle />
      <button
        type="button"
        data-menu-button
        aria-expanded="false"
        aria-controls="mobile-nav"
        class="inline-flex h-10 w-10 items-center justify-center rounded border border-line text-muted transition-colors hover:border-accent hover:text-accent md:hidden"
      >
        <span class="sr-only">Menu</span>
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16"></path>
        </svg>
      </button>
    </div>
  </Container>

  <nav id="mobile-nav" aria-label="Primary" data-mobile-nav class="hidden border-t border-line md:hidden">
    <Container>
      <ul class="flex flex-col py-2">
        {
          site.nav.map((item) => (
            <li>
              <a
                href={item.href}
                data-nav-link
                class="block py-3 text-base text-muted transition-colors hover:text-fg aria-[current=true]:text-accent"
              >
                {item.label}
              </a>
            </li>
          ))
        }
        <li class="sm:hidden">
          <ExternalLink href={profile.cvUrl} class="block py-3 text-base text-muted transition-colors hover:text-fg">
            Download CV
          </ExternalLink>
        </li>
      </ul>
    </Container>
  </nav>
</header>

<script>
  const menuButton = document.querySelector<HTMLButtonElement>('[data-menu-button]');
  const mobileNav = document.querySelector<HTMLElement>('[data-mobile-nav]');

  function setMenuOpen(open: boolean) {
    if (!menuButton || !mobileNav) return;
    menuButton.setAttribute('aria-expanded', String(open));
    mobileNav.classList.toggle('hidden', !open);
  }

  menuButton?.addEventListener('click', () => {
    setMenuOpen(menuButton.getAttribute('aria-expanded') !== 'true');
  });

  mobileNav?.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('a')) setMenuOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setMenuOpen(false);
  });

  window.matchMedia('(min-width: 48rem)').addEventListener('change', (event) => {
    if (event.matches) setMenuOpen(false);
  });

  const navLinks = [...document.querySelectorAll<HTMLAnchorElement>('[data-nav-link]')];
  const sectionIds = [...new Set(navLinks.map((link) => link.hash))];
  const observedSections = ['#top', ...sectionIds]
    .map((selector) => document.querySelector<HTMLElement>(selector))
    .filter((section): section is HTMLElement => section !== null);

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const activeHash = `#${entry.target.id}`;
        for (const link of navLinks) {
          if (link.hash === activeHash) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        }
      }
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );

  observedSections.forEach((section) => sectionObserver.observe(section));
</script>
```

- [ ] **Step 3: Replace `src/pages/index.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import SiteHeader from '../components/layout/SiteHeader.astro';
---

<BaseLayout>
  <SiteHeader />
  <main id="main" tabindex="-1" class="outline-none"></main>
</BaseLayout>
```

- [ ] **Step 4: Manual check (only when the owner asks)**

With `npm run dev`:

- At ≥768px: logo, four nav links, CV button and theme toggle are on one row with no horizontal scrollbar.
- At <768px: only the logo, CV (≥640px) and theme/menu buttons show. The menu button opens the panel, and Escape or tapping a link closes it. `aria-expanded` flips between `true` and `false`.
- The theme toggle switches dark ↔ paper. Reloading keeps the choice. With no stored choice, an OS light theme loads the paper mode, and there is no dark flash on reload.

- [ ] **Step 5: Checkpoint**

Commit only if asked: `git add src && git commit -m "feat: add sticky header, mobile menu and theme toggle"`.

---

### Task 6: Hero and Impact sections

**Files:**
- Create: `src/components/sections/Hero.astro`, `src/components/sections/Impact.astro`
- Modify: `src/pages/index.astro` (full content below)

**Interfaces:**
- Consumes: `profile.name`, `profile.role`, `profile.headline`, `profile.status`, `profile.cvUrl`, `profile.metrics`, `Container`, `Section`, `ExternalLink`.
- Produces: `<Hero />` renders `<section id="top">` with `h1#hero-title`. Plan 3 replaces its inner visual with the animation and keeps this markup as the reduced-motion fallback. `<Impact />` renders `<section id="impact">`.

- [ ] **Step 1: Create `src/components/sections/Hero.astro`**

```astro
---
import Container from '../layout/Container.astro';
import ExternalLink from '../ui/ExternalLink.astro';
import { profile } from '../../content/profile';
---

<section id="top" aria-labelledby="hero-title" class="relative overflow-hidden">
  <div aria-hidden="true" class="hero-grid pointer-events-none absolute inset-0"></div>
  <Container class="relative flex min-h-[calc(100svh-4rem)] flex-col justify-center py-20">
    <p class="font-mono text-sm text-muted">
      <span class="text-accent">{profile.name}</span> · {profile.role}
    </p>
    <h1 id="hero-title" class="mt-6 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-6xl lg:text-7xl">
      {profile.headline}
    </h1>
    <div class="mt-10 flex flex-wrap gap-3">
      <ExternalLink href={profile.cvUrl} class="btn-primary">Download CV</ExternalLink>
      <a href="#contact" class="btn-secondary">Contact</a>
    </div>
    <p class="mt-14 flex items-start gap-2 font-mono text-xs uppercase tracking-[0.15em] text-muted">
      <span aria-hidden="true" class="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-accent"></span>
      <span>{profile.status}</span>
    </p>
  </Container>
</section>
```

- [ ] **Step 2: Create `src/components/sections/Impact.astro`**

```astro
---
import Section from '../layout/Section.astro';
import { profile } from '../../content/profile';
---

<Section id="impact" label="evaluation" title="Impact">
  <ul class="grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
    {
      profile.metrics.map((metric) => (
        <li class="flex flex-col bg-bg p-6">
          <p class="font-mono text-4xl font-semibold tracking-tight text-accent sm:text-5xl">{metric.value}</p>
          <p class="mt-3 text-sm leading-relaxed">{metric.label}</p>
          <p class="mt-auto pt-6 font-mono text-xs text-muted">{metric.source}</p>
        </li>
      ))
    }
  </ul>
</Section>
```

- [ ] **Step 3: Replace `src/pages/index.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import SiteHeader from '../components/layout/SiteHeader.astro';
import Hero from '../components/sections/Hero.astro';
import Impact from '../components/sections/Impact.astro';
---

<BaseLayout>
  <SiteHeader />
  <main id="main" tabindex="-1" class="outline-none">
    <Hero />
    <Impact />
  </main>
</BaseLayout>
```

- [ ] **Step 4: Manual check (only when the owner asks)**

- At 320px wide the headline wraps without horizontal scroll and both buttons wrap onto their own lines if needed.
- In landscape phone size (844×390) the hero grows taller than the viewport instead of overflowing; content is never clipped.
- The Impact grid shows 1 column below 640px, 2 columns from 640px and 4 columns from 1024px. Tiles in a row share the same height.

- [ ] **Step 5: Checkpoint**

Commit only if asked: `git add src && git commit -m "feat: add hero and impact sections"`.

---

### Task 7: About and Work sections

**Files:**
- Create: `src/components/sections/About.astro`, `src/components/sections/Experience.astro`
- Modify: `src/pages/index.astro` (full content below)

**Interfaces:**
- Consumes: `profile.summary`, `profile.role`, `profile.location`, `profile.education`, `profile.skills`, `profile.experience`, `Section`.
- Produces: `<About />` → `section#about`; `<Experience />` → `section#experience` (both are nav targets).

- [ ] **Step 1: Create `src/components/sections/About.astro`**

```astro
---
import Section from '../layout/Section.astro';
import { profile } from '../../content/profile';

const currentRole = profile.experience.find((job) => job.end === null);

const facts = [
  { label: 'Role', value: profile.role },
  { label: 'Currently', value: currentRole ? `${currentRole.role}, ${currentRole.company}` : 'Open to opportunities' },
  { label: 'Based in', value: profile.location },
  {
    label: 'Education',
    value: `${profile.education.degree}, ${profile.education.school} (${profile.education.end})`,
  },
];
---

<Section id="about" label="model details" title="About">
  <div class="grid gap-14 lg:grid-cols-12 lg:gap-12">
    <div class="lg:col-span-5">
      <p class="text-lg leading-relaxed">{profile.summary}</p>
      <dl class="mt-10 grid gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-1">
        {
          facts.map((fact) => (
            <div class="border-l border-line pl-4">
              <dt class="font-mono text-xs uppercase tracking-wider text-muted">{fact.label}</dt>
              <dd class="mt-1">{fact.value}</dd>
            </div>
          ))
        }
      </dl>
    </div>

    <div class="lg:col-span-7">
      <h3 class="font-mono text-xs uppercase tracking-[0.2em] text-muted">
        <span class="text-accent">//</span> architecture
      </h3>
      <ol class="mt-4 divide-y divide-line border-y border-line">
        {
          profile.skills.map((group, index) => (
            <li class="grid gap-3 py-4 sm:grid-cols-[11rem_1fr] sm:gap-6">
              <p class="font-mono text-xs uppercase tracking-wider text-muted">
                <span class="text-accent">L{index}</span> {group.layer}
              </p>
              <ul class="flex flex-wrap gap-2" aria-label={group.layer}>
                {group.items.map((item) => (
                  <li class="rounded border border-line px-2.5 py-1 text-sm">{item}</li>
                ))}
              </ul>
            </li>
          ))
        }
      </ol>
    </div>
  </div>
</Section>
```

- [ ] **Step 2: Create `src/components/sections/Experience.astro`**

```astro
---
import Section from '../layout/Section.astro';
import { profile } from '../../content/profile';

const { education } = profile;
---

<Section id="experience" label="training stages" title="Work">
  <ol class="space-y-14 border-l border-line pl-6 sm:pl-10">
    {
      profile.experience.map((job) => (
        <li class="relative">
          <span
            aria-hidden="true"
            class="absolute top-2 -left-[calc(1.5rem+5px)] h-2.5 w-2.5 rotate-45 bg-accent sm:-left-[calc(2.5rem+5px)]"
          />
          <p class="font-mono text-xs uppercase tracking-[0.2em] text-accent">{job.stage}</p>
          <h3 class="mt-2 text-xl font-semibold sm:text-2xl">{job.role}</h3>
          <p class="mt-1 text-muted">
            {job.company}
            {job.location && <span> · {job.location}</span>}
          </p>
          <p class="mt-1 font-mono text-sm text-muted">
            {job.start} – {job.end ?? 'Present'}
          </p>
          <ul class="mt-5 max-w-3xl list-disc space-y-2 pl-5 leading-relaxed text-muted marker:text-accent">
            {job.highlights.map((highlight) => (
              <li>{highlight}</li>
            ))}
          </ul>
        </li>
      ))
    }
    <li class="relative">
      <span
        aria-hidden="true"
        class="absolute top-2 -left-[calc(1.5rem+5px)] h-2.5 w-2.5 rotate-45 border border-accent bg-bg sm:-left-[calc(2.5rem+5px)]"
      ></span>
      <p class="font-mono text-xs uppercase tracking-[0.2em] text-accent">pretraining</p>
      <h3 class="mt-2 text-xl font-semibold sm:text-2xl">{education.degree}</h3>
      <p class="mt-1 text-muted">{education.school} · {education.location}</p>
      <p class="mt-1 font-mono text-sm text-muted">
        {education.start} – {education.end} · {education.grade}
      </p>
    </li>
  </ol>
</Section>
```

- [ ] **Step 3: Replace `src/pages/index.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import SiteHeader from '../components/layout/SiteHeader.astro';
import Hero from '../components/sections/Hero.astro';
import Impact from '../components/sections/Impact.astro';
import About from '../components/sections/About.astro';
import Experience from '../components/sections/Experience.astro';
---

<BaseLayout>
  <SiteHeader />
  <main id="main" tabindex="-1" class="outline-none">
    <Hero />
    <Impact />
    <About />
    <Experience />
  </main>
</BaseLayout>
```

- [ ] **Step 4: Manual check (only when the owner asks)**

- At 320px, "Atomic Loops · Pune" and the date line wrap instead of overflowing, and the timeline diamonds sit centered on the vertical line at both mobile and ≥640px padding.
- Below 640px the skills layer label sits above its chips; from 640px it sits in a left column.
- Clicking "About" or "Work" in the nav scrolls the heading into view below the sticky header (not hidden under it), and the clicked link turns accent-colored.

- [ ] **Step 5: Checkpoint**

Commit only if asked: `git add src && git commit -m "feat: add about and work sections"`.

---

### Task 8: Projects and More work sections

**Files:**
- Create: `src/components/sections/Projects.astro`, `src/components/sections/MoreWork.astro`
- Modify: `src/pages/index.astro` (full content below)

**Interfaces:**
- Consumes: `profile.projects`, `profile.archive`, `profile.achievements`, `clusterLabels`, `Section`, `ExternalLink`.
- Produces: `<Projects />` → `section#projects`, each card `li#project-{slug}` with `data-cluster={cluster}` (Plan 2's filter tabs and detection boxes hook onto these); `<MoreWork />` → `section#more-work`.

- [ ] **Step 1: Create `src/components/sections/Projects.astro`**

```astro
---
import Section from '../layout/Section.astro';
import ExternalLink from '../ui/ExternalLink.astro';
import { clusterLabels, profile } from '../../content/profile';
---

<Section id="projects" label="case studies" title="Projects">
  <ul class="grid gap-6 md:grid-cols-2">
    {
      profile.projects.map((project) => (
        <li
          id={`project-${project.slug}`}
          data-cluster={project.cluster}
          class="flex min-w-0 flex-col rounded-md border border-line bg-surface p-6 [overflow-wrap:anywhere] sm:p-8"
        >
          <p class="font-mono text-xs uppercase tracking-wider text-muted">
            <span class="text-accent">{clusterLabels[project.cluster]}</span> · {project.origin}
          </p>
          <h3 class="mt-3 text-xl font-semibold sm:text-2xl">{project.title}</h3>
          <p class="mt-3 leading-relaxed text-muted">{project.summary}</p>
          <ul class="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted marker:text-accent">
            {project.highlights.map((highlight) => (
              <li>{highlight}</li>
            ))}
          </ul>
          <ul class="mt-6 flex flex-wrap gap-2" aria-label="Tech stack">
            {project.stack.map((tech) => (
              <li class="rounded border border-line px-2 py-0.5 font-mono text-xs">{tech}</li>
            ))}
          </ul>
          {project.links.length > 0 && (
            <div class="mt-auto flex flex-wrap gap-x-6 gap-y-2 pt-6">
              {project.links.map((link) => (
                <ExternalLink
                  href={link.href}
                  class="font-mono text-sm text-accent underline-offset-4 hover:underline"
                >
                  {link.label} <span aria-hidden="true">↗</span>
                </ExternalLink>
              ))}
            </div>
          )}
        </li>
      ))
    }
  </ul>
</Section>
```

- [ ] **Step 2: Create `src/components/sections/MoreWork.astro`**

```astro
---
import Section from '../layout/Section.astro';
import ExternalLink from '../ui/ExternalLink.astro';
import { profile } from '../../content/profile';
---

<Section id="more-work" label="more work" title="More work">
  <ul class="divide-y divide-line border-y border-line">
    {
      profile.archive.map((item) => (
        <li>
          <ExternalLink
            href={item.href}
            class="group grid gap-2 py-5 sm:grid-cols-[1fr_auto] sm:items-baseline sm:gap-10"
          >
            <span class="min-w-0">
              <span class="block font-semibold transition-colors group-hover:text-accent">
                {item.title} <span aria-hidden="true">↗</span>
              </span>
              <span class="mt-1 block text-sm leading-relaxed text-muted">{item.description}</span>
            </span>
            <span class="font-mono text-xs text-muted">{item.stack.join(' · ')}</span>
          </ExternalLink>
        </li>
      ))
    }
  </ul>

  <h3 class="mt-14 font-mono text-xs uppercase tracking-[0.2em] text-muted">
    <span class="text-accent">//</span> achievements
  </h3>
  <ul class="mt-4 space-y-4">
    {
      profile.achievements.map((achievement) => (
        <li class="border-l-2 border-accent pl-4">
          <p class="font-semibold">{achievement.title}</p>
          <p class="mt-1 text-sm text-muted">{achievement.description}</p>
        </li>
      ))
    }
  </ul>
</Section>
```

- [ ] **Step 3: Replace `src/pages/index.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import SiteHeader from '../components/layout/SiteHeader.astro';
import Hero from '../components/sections/Hero.astro';
import Impact from '../components/sections/Impact.astro';
import About from '../components/sections/About.astro';
import Experience from '../components/sections/Experience.astro';
import Projects from '../components/sections/Projects.astro';
import MoreWork from '../components/sections/MoreWork.astro';
---

<BaseLayout>
  <SiteHeader />
  <main id="main" tabindex="-1" class="outline-none">
    <Hero />
    <Impact />
    <About />
    <Experience />
    <Projects />
    <MoreWork />
  </main>
</BaseLayout>
```

- [ ] **Step 4: Manual check (only when the owner asks)**

- The project grid is 1 column below 768px and 2 columns from 768px. Cards grow with their content (no clipping, no "overflow" stripes) at 320, 768, 1024 and 1440px.
- Cards without links (Atomic Loops) show no empty link row.
- Each link opens in a new tab, and screen readers announce "(opens in a new tab)".

- [ ] **Step 5: Checkpoint**

Commit only if asked: `git add src && git commit -m "feat: add projects and more-work sections"`.

---

### Task 9: Contact section, footer and 404 page

**Files:**
- Create: `src/components/sections/Contact.astro`, `src/components/layout/SiteFooter.astro`, `src/pages/404.astro`
- Modify: `src/pages/index.astro` (final content below)

**Interfaces:**
- Consumes: `profile.name`, `profile.role`, `profile.location`, `profile.email`, `profile.socials`, `Section`, `Container`, `ExternalLink`, `BaseLayout`, `SiteHeader`.
- Produces: `<Contact />` → `section#contact` (Plan 2 adds the Formspree form beside the citation block); `<SiteFooter />`; `/404` page.

- [ ] **Step 1: Create `src/components/sections/Contact.astro`**

```astro
---
import Section from '../layout/Section.astro';
import ExternalLink from '../ui/ExternalLink.astro';
import { profile } from '../../content/profile';

const citation = `@engineer{patel,
  author   = {${profile.name}},
  role     = {${profile.role}},
  location = {${profile.location}},
  email    = {${profile.email}}
}`;
---

<Section id="contact" label="citation" title="Contact">
  <div class="grid gap-12 lg:grid-cols-12">
    <div class="lg:col-span-5">
      <p class="text-lg leading-relaxed text-muted">
        Email is the best way to reach me. Happy to talk about computer vision, document AI and inference work.
      </p>
      <p class="mt-6 font-mono text-sm break-all">{profile.email}</p>
      <div class="mt-6 flex flex-wrap gap-3">
        <a href={`mailto:${profile.email}`} class="btn-primary">Email me</a>
        <button type="button" class="btn-secondary" data-copy-email={profile.email}>Copy email</button>
      </div>
      <p role="status" aria-live="polite" class="mt-3 min-h-5 font-mono text-xs text-accent" data-copy-status></p>
      <ul class="mt-8 flex flex-wrap gap-x-6 gap-y-2">
        {
          profile.socials.map((social) => (
            <li>
              <ExternalLink href={social.href} class="font-mono text-sm text-muted transition-colors hover:text-accent">
                {social.label} <span aria-hidden="true">↗</span>
              </ExternalLink>
            </li>
          ))
        }
      </ul>
    </div>

    <figure class="min-w-0 lg:col-span-7">
      <pre class="overflow-x-auto rounded-md border border-line bg-surface p-5 font-mono text-sm leading-relaxed sm:p-6"><code>{citation}</code></pre>
      <figcaption class="mt-3 font-mono text-xs text-muted">// cite as</figcaption>
    </figure>
  </div>
</Section>

<script>
  const copyButton = document.querySelector<HTMLButtonElement>('[data-copy-email]');
  const copyStatus = document.querySelector<HTMLElement>('[data-copy-status]');

  copyButton?.addEventListener('click', async () => {
    const email = copyButton.dataset.copyEmail ?? '';
    try {
      await navigator.clipboard.writeText(email);
      if (copyStatus) copyStatus.textContent = 'Email copied to clipboard.';
    } catch {
      if (copyStatus) copyStatus.textContent = `Couldn't copy automatically. The address is ${email}`;
    }
  });
</script>
```

- [ ] **Step 2: Create `src/components/layout/SiteFooter.astro`**

```astro
---
import Container from './Container.astro';
import { profile } from '../../content/profile';

const builtAt = new Date();
const year = builtAt.getFullYear();
const lastUpdated = builtAt.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
---

<footer class="border-t border-line py-10">
  <Container class="flex flex-col gap-4 font-mono text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
    <p>© {year} {profile.name}</p>
    <p>Built with Astro · Last updated {lastUpdated}</p>
    <a href="#top" class="transition-colors hover:text-accent">Back to top ↑</a>
  </Container>
</footer>
```

- [ ] **Step 3: Create `src/pages/404.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Container from '../components/layout/Container.astro';
---

<BaseLayout title="Page not found — Jay Patel">
  <main id="main" tabindex="-1" class="outline-none">
    <Container class="flex min-h-dvh flex-col justify-center py-20">
      <p class="font-mono text-xs uppercase tracking-[0.2em] text-accent">// 404 · no detections</p>
      <h1 class="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">This page doesn't exist.</h1>
      <p class="mt-4 max-w-xl text-muted">The link may be outdated. Everything lives on the home page.</p>
      <div class="mt-10">
        <a href="/" class="btn-primary">Back to home</a>
      </div>
    </Container>
  </main>
</BaseLayout>
```

- [ ] **Step 4: Replace `src/pages/index.astro` (final for this plan)**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import SiteHeader from '../components/layout/SiteHeader.astro';
import SiteFooter from '../components/layout/SiteFooter.astro';
import Hero from '../components/sections/Hero.astro';
import Impact from '../components/sections/Impact.astro';
import About from '../components/sections/About.astro';
import Experience from '../components/sections/Experience.astro';
import Projects from '../components/sections/Projects.astro';
import MoreWork from '../components/sections/MoreWork.astro';
import Contact from '../components/sections/Contact.astro';
---

<BaseLayout>
  <SiteHeader />
  <main id="main" tabindex="-1" class="outline-none">
    <Hero />
    <Impact />
    <About />
    <Experience />
    <Projects />
    <MoreWork />
    <Contact />
  </main>
  <SiteFooter />
</BaseLayout>
```

- [ ] **Step 5: Manual check (only when the owner asks)**

- `npm run build` finishes with 0 errors from `astro check`, and `dist/` contains `index.html`, `404.html`, `favicon.svg`, `robots.txt` and an `_astro/` folder.
- "Copy email" shows the confirmation text, and pasting gives `jaysunilpatel2002@gmail.com`.
- At 320px the BibTeX block scrolls horizontally inside its own box; the page itself never scrolls sideways.
- A search of `dist/` for `7558` or `+91` returns nothing (no phone number shipped).
- `npm run preview`, then open `/does-not-exist`: the 404 page renders.

- [ ] **Step 6: Checkpoint**

Commit only if asked: `git add src && git commit -m "feat: add contact section, footer and 404 page"`.
