# Plan 2 — Signature Layer Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Owner preference: no separate per-task review (see Global Constraints).

**Goal:** Add the parts that make the portfolio distinctive and shareable: YOLO-style detection boxes on hover/focus, generated SVG visuals for every project, project filter tabs, a working Formspree contact form, a sitemap + robots.txt, and a build-time Open Graph share image.

**Architecture:** Everything stays static and framework-free. Deterministic "randomness" (detection scores, visual variation) comes from a seeded PRNG in `src/lib/seeded.ts`, so every build produces identical output. The detection box is a pure-CSS `.detect` component driven by `data-detect-label` / `data-detect-score` attributes. Project visuals are small `.astro` SVG components selected by project cluster. The filter tabs and contact form are progressive enhancements: without JS, all projects show and the form still posts to Formspree. The OG image is rendered at build time by a prerendered endpoint (`satori` → SVG → `@resvg/resvg-js` → PNG).

**Tech Stack:** Astro 7, Tailwind CSS v4, TypeScript (strict), `@astrojs/sitemap`, `satori`, `@resvg/resvg-js`, `@fontsource/space-grotesk` + `@fontsource/jetbrains-mono` (static `.woff` files for the OG renderer only), Formspree.

**Spec:** `docs/portfolio-revamp.md` (sections 3.2–3.5 and 6). **Builds on:** Plan 1 (merged to `main` at `f623dae`).

## Global Constraints

- Project root: `C:\Users\jaysu\Desktop\ME\Jay-Portfolio\portfolio_astro`. Work on a new branch `plan-2-signature` created from `main`.
- Astro 7.x, Tailwind v4 via `@tailwindcss/vite`, no React/UI framework (React arrives in Plan 3).
- **No phone number anywhere**: pages, meta tags, JSON-LD, OG image.
- Atomic Loops content = only what's in `docs/resume.txt`. Visuals are abstract/fictional; no real documents, client names or screenshots.
- Accent `#FF7A1A` (dark) / `#B54708` (light). New error color token: `#FF6B6B` (dark) / `#B42318` (light).
- Responsive rules from Plan 1 still hold: no fixed heights on content, no fixed aspect ratios on cards with text (decorative SVG visuals may keep their own 16:9 viewBox), long strings wrap, no horizontal page scroll at 320px.
- All motion respects `prefers-reduced-motion` (already enforced globally in `global.css`).
- Everything must work without JavaScript: all projects visible, form posts natively to Formspree.
- The site URL lives only in `astro.config.mjs` (`site`). Use `Astro.site` / the endpoint `site` argument everywhere else.
- Formspree endpoint: `https://formspree.io/f/xovegole` (same form as the old Flutter site), stored once in `src/config/site.ts`.
- **Owner preferences (execution):** no separate review step per task. For each task: implement from this plan, run `npm run check` (the only allowed verification command), commit with the message given, and give the owner a one-line update. No automated tests, no `npm run dev`/`build`/`preview`/deploy. After Task 6, do one final review of the whole branch (`main..HEAD`, excluding `package-lock.json`) against this plan and the spec, fix real issues in a single commit, then **ask the owner** to run, or approve running, `npm run build` once. Task 6 adds build-time code that `astro check` cannot fully validate. Merge into `main` only with owner approval.

## File Structure

```
src/
├── lib/
│   ├── seeded.ts                    NEW  createRandom(seed), detectionScore(seed)
│   └── og-image.ts                  NEW  renderOgImage(): PNG bytes for the share image
├── components/
│   ├── visuals/
│   │   ├── ProjectVisual.astro      NEW  picks a visual by cluster
│   │   ├── DocumentVisual.astro     NEW  document + OCR boxes → JSON
│   │   ├── VisionVisual.astro       NEW  tool silhouettes with detection boxes
│   │   ├── AgentsVisual.astro       NEW  plan → call_llm → validate → output graph
│   │   └── SystemsVisual.astro      NEW  image batch → ONNX lanes → results store
│   └── sections/
│       ├── Projects.astro           MOD  detection box, visual, filter tabs
│       ├── MoreWork.astro           MOD  detection box on archive rows
│       ├── Contact.astro            MOD  detection box on citation, new layout with form
│       └── ContactForm.astro        NEW  Formspree form (progressive enhancement)
├── pages/
│   ├── robots.txt.ts                NEW  robots.txt with sitemap URL from `site`
│   └── og.png.ts                    NEW  prerendered share image endpoint
├── layouts/BaseLayout.astro         MOD  sitemap link, OG/Twitter image meta
├── config/site.ts                   MOD  contactFormEndpoint, ogImage
└── styles/global.css                MOD  .detect component, danger color token
public/robots.txt                    DEL  replaced by the endpoint
astro.config.mjs                     MOD  sitemap integration, resvg SSR externals
```

---

### Task 1: Seeded helpers and the detection-box motif

**Files:**
- Create: `src/lib/seeded.ts`
- Modify: `src/styles/global.css`, `src/components/sections/Projects.astro`, `src/components/sections/MoreWork.astro`, `src/components/sections/Contact.astro`

**Interfaces:**
- Produces: `createRandom(seed: string): () => number` (values in [0, 1)), `detectionScore(seed: string): string` (e.g. `"0.97"`, always 0.91–0.99). CSS class `.detect`, which reads `data-detect-label` and `data-detect-score` from the same element.

- [ ] **Step 0: Create the branch**

```bash
git checkout main && git checkout -b plan-2-signature
```

- [ ] **Step 1: Create `src/lib/seeded.ts`**

```ts
function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (const char of seed) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Deterministic PRNG (mulberry32) so every build renders identical visuals and scores. */
export function createRandom(seed: string): () => number {
  let state = hashSeed(seed);
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = state;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

/** Decorative "confidence" between 0.91 and 0.99, stable for a given seed. */
export function detectionScore(seed: string): string {
  const random = createRandom(`score:${seed}`);
  return (0.91 + Math.floor(random() * 9) / 100).toFixed(2);
}
```

- [ ] **Step 2: Add the `.detect` component to `src/styles/global.css`**

Insert this block inside `@layer components { ... }`, directly after the `.hero-grid { ... }` rule and before the `[data-theme="dark"] .theme-icon-moon` rule:

```css
  .detect {
    position: relative;
  }

  .detect::before {
    content: "";
    position: absolute;
    inset: -1px;
    pointer-events: none;
    background:
      linear-gradient(var(--accent) 0 0) top left / 14px 2px,
      linear-gradient(var(--accent) 0 0) top left / 2px 14px,
      linear-gradient(var(--accent) 0 0) top right / 14px 2px,
      linear-gradient(var(--accent) 0 0) top right / 2px 14px,
      linear-gradient(var(--accent) 0 0) bottom left / 14px 2px,
      linear-gradient(var(--accent) 0 0) bottom left / 2px 14px,
      linear-gradient(var(--accent) 0 0) bottom right / 14px 2px,
      linear-gradient(var(--accent) 0 0) bottom right / 2px 14px;
    background-repeat: no-repeat;
    opacity: 0;
    transition: opacity 150ms, inset 150ms;
  }

  .detect::after {
    content: attr(data-detect-label) " " attr(data-detect-score);
    content: attr(data-detect-label) " " attr(data-detect-score) / "";
    position: absolute;
    left: -6px;
    bottom: calc(100% + 6px);
    padding: 0.125rem 0.375rem;
    background-color: var(--accent);
    color: var(--accent-fg);
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    line-height: 1.3;
    letter-spacing: 0.04em;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transform: translateY(4px);
    transition: opacity 150ms, transform 150ms;
  }

  .detect:hover::before,
  .detect:focus-within::before {
    opacity: 1;
    inset: -6px;
  }

  .detect:hover::after,
  .detect:focus-within::after {
    opacity: 1;
    transform: none;
  }
```

The second `content` declaration uses the alt-text syntax (`/ ""`) so screen readers skip the decorative label. Browsers without support keep the first declaration.

- [ ] **Step 3: Replace `src/components/sections/Projects.astro`**

The detection label sits *outside* the card's top edge, so the grid gap grows from `gap-6` to `gap-8` to leave room for it.

```astro
---
import Section from '../layout/Section.astro';
import ExternalLink from '../ui/ExternalLink.astro';
import { clusterLabels, profile } from '../../content/profile';
import { detectionScore } from '../../lib/seeded';
---

<Section id="projects" label="case studies" title="Projects">
  <ul class="grid gap-8 md:grid-cols-2">
    {
      profile.projects.map((project) => (
        <li
          id={`project-${project.slug}`}
          data-cluster={project.cluster}
          data-detect-label="case_study"
          data-detect-score={detectionScore(project.slug)}
          class="detect flex min-w-0 flex-col rounded-md border border-line bg-surface p-6 [overflow-wrap:anywhere] sm:p-8"
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

- [ ] **Step 4: Replace `src/components/sections/MoreWork.astro`**

Rows grow from `py-5` to `py-6` so the label above a hovered row doesn't touch the previous row's text.

```astro
---
import Section from '../layout/Section.astro';
import ExternalLink from '../ui/ExternalLink.astro';
import { profile } from '../../content/profile';
import { detectionScore } from '../../lib/seeded';
---

<Section id="more-work" label="more work" title="More work">
  <ul class="divide-y divide-line border-y border-line">
    {
      profile.archive.map((item) => (
        <li>
          <ExternalLink
            href={item.href}
            data-detect-label="archive_item"
            data-detect-score={detectionScore(item.title)}
            class="detect group grid gap-2 py-6 sm:grid-cols-[1fr_auto] sm:items-baseline sm:gap-10"
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

- [ ] **Step 5: Wrap the citation block in `src/components/sections/Contact.astro`**

The `<pre>` scrolls horizontally (`overflow-x-auto`), which would clip its own pseudo-elements, so the detection box goes on a wrapper `div`.

Add to the frontmatter imports:

```ts
import { detectionScore } from '../../lib/seeded';
```

Replace:

```astro
      <pre class="overflow-x-auto rounded-md border border-line bg-surface p-5 font-mono text-sm leading-relaxed sm:p-6"><code>{citation}</code></pre>
```

with:

```astro
      <div class="detect rounded-md" data-detect-label="citation" data-detect-score={detectionScore('citation')}>
        <pre class="overflow-x-auto rounded-md border border-line bg-surface p-5 font-mono text-sm leading-relaxed sm:p-6"><code>{citation}</code></pre>
      </div>
```

- [ ] **Step 6: Check and commit**

Run `npm run check`. Expected: 0 errors. Then:

```bash
git add src && git commit -m "feat: add detection-box hover and focus motif"
```

---

### Task 2: Generated project visuals

**Files:**
- Create: `src/components/visuals/DocumentVisual.astro`, `VisionVisual.astro`, `AgentsVisual.astro`, `SystemsVisual.astro`, `ProjectVisual.astro`
- Modify: `src/components/sections/Projects.astro`

**Interfaces:**
- Consumes: `createRandom`, `detectionScore` (Task 1); `ProjectCluster` (`src/content/types.ts`).
- Produces: `<ProjectVisual cluster: ProjectCluster seed: string />`, a decorative 16:9 SVG (`aria-hidden`). Each cluster visual takes `{ seed: string }`.

All visuals use `viewBox="0 0 320 180"`, Tailwind `fill-*`/`stroke-*` theme classes (never `var()` inside SVG presentation attributes), and `font-mono` for SVG text.

- [ ] **Step 1: Create `src/components/visuals/DocumentVisual.astro`**

```astro
---
import { createRandom } from '../../lib/seeded';

interface Props {
  seed: string;
}

const { seed } = Astro.props;
const random = createRandom(seed);

const textLines = Array.from({ length: 9 }, (_, index) => ({
  y: 38 + index * 13,
  width: 44 + Math.round(random() * 60),
}));
const detectedLines = new Set([1, 4 + Math.floor(random() * 2), 7]);
const jsonRows = ['"doc_type": "invoice"', '"vendor": "…"', '"line_items": [ … ]', '"total": …'];
---

<svg viewBox="0 0 320 180" class="block h-auto w-full">
  <rect x="24" y="16" width="128" height="148" rx="3" class="fill-surface stroke-line" />
  <rect x="36" y="25" width="42" height="6" rx="1" class="fill-muted/60" />
  {
    textLines.map((line, index) => (
      <g>
        <rect x="36" y={line.y} width={line.width} height="4" rx="1" class="fill-muted/40" />
        {detectedLines.has(index) && (
          <rect
            x="32"
            y={line.y - 4}
            width={line.width + 8}
            height="12"
            class="fill-none stroke-accent"
            stroke-width="1"
          />
        )}
      </g>
    ))
  }
  <path d="M160 90 h20 m-6 -5 l6 5 l-6 5" class="fill-none stroke-muted" stroke-width="1.5" />
  <g font-size="9" class="font-mono">
    <text x="190" y="50" class="fill-muted">{'{'}</text>
    {
      jsonRows.map((row, index) => (
        <text x="198" y={66 + index * 16} class={index === 0 ? 'fill-accent' : 'fill-muted'}>
          {row}
        </text>
      ))
    }
    <text x="190" y={66 + jsonRows.length * 16} class="fill-muted">{'}'}</text>
  </g>
</svg>
```

- [ ] **Step 2: Create `src/components/visuals/VisionVisual.astro`**

```astro
---
import { createRandom, detectionScore } from '../../lib/seeded';

interface Props {
  seed: string;
}

const { seed } = Astro.props;
const random = createRandom(seed);
const headTop = 46;

const tools = [0, 1, 2].map((slot) => {
  const centerX = 62 + slot * 98;
  const headRadius = 9 + Math.round(random() * 6);
  const handleLength = 46 + Math.round(random() * 34);
  return {
    centerX,
    headRadius,
    handleLength,
    score: detectionScore(`${seed}:${slot}`),
    box: {
      x: centerX - headRadius - 8,
      y: headTop - headRadius - 8,
      width: headRadius * 2 + 16,
      height: headRadius + handleLength + 16,
    },
  };
});
---

<svg viewBox="0 0 320 180" class="block h-auto w-full">
  <line x1="16" y1="150" x2="304" y2="150" class="stroke-line" />
  {
    tools.map((tool) => (
      <g>
        <circle cx={tool.centerX} cy={headTop} r={tool.headRadius} class="fill-none stroke-muted" stroke-width="2.5" />
        <rect
          x={tool.centerX - 4}
          y={headTop + tool.headRadius - 2}
          width="8"
          height={tool.handleLength - tool.headRadius}
          rx="2"
          class="fill-muted/50"
        />
        <rect
          x={tool.box.x}
          y={tool.box.y}
          width={tool.box.width}
          height={tool.box.height}
          class="fill-none stroke-accent"
          stroke-width="1.25"
        />
        <rect x={tool.box.x - 0.6} y={tool.box.y - 12} width="56" height="12" class="fill-accent" />
        <text x={tool.box.x + 3} y={tool.box.y - 3} font-size="8.5" class="fill-accent-fg font-mono">
          tool {tool.score}
        </text>
      </g>
    ))
  }
  <text x="16" y="168" font-size="9" class="fill-muted font-mono">count: {tools.length}</text>
</svg>
```

- [ ] **Step 3: Create `src/components/visuals/AgentsVisual.astro`**

```astro
---
import { createRandom } from '../../lib/seeded';

interface Props {
  seed: string;
}

const { seed } = Astro.props;
const random = createRandom(seed);
const nodeWidth = 60;
const nodeHeight = 28;

const steps = ['plan', 'call_llm', 'validate', 'output'].map((label, index) => ({
  label,
  x: 18 + index * 76,
  y: 66 + Math.round((random() - 0.5) * 24),
}));
const [, callStep, validateStep] = steps;
const connectors = steps.slice(1).map((step, index) => ({ from: steps[index], to: step }));
---

<svg viewBox="0 0 320 180" class="block h-auto w-full">
  {
    connectors.map(({ from, to }) => (
      <g>
        <line
          x1={from.x + nodeWidth}
          y1={from.y + nodeHeight / 2}
          x2={to.x}
          y2={to.y + nodeHeight / 2}
          class="stroke-muted"
          stroke-width="1.5"
        />
        <circle cx={to.x} cy={to.y + nodeHeight / 2} r="2" class="fill-muted" />
      </g>
    ))
  }
  <path
    d={`M${validateStep.x + nodeWidth / 2} ${validateStep.y} C ${validateStep.x + nodeWidth / 2} ${validateStep.y - 32}, ${callStep.x + nodeWidth / 2} ${callStep.y - 32}, ${callStep.x + nodeWidth / 2} ${callStep.y}`}
    class="fill-none stroke-muted"
    stroke-width="1"
    stroke-dasharray="3 3"
  />
  <text
    x={(validateStep.x + callStep.x) / 2 + nodeWidth / 2}
    y={Math.min(validateStep.y, callStep.y) - 30}
    font-size="8"
    text-anchor="middle"
    class="fill-muted font-mono"
  >
    retry
  </text>
  {
    steps.map((step) => (
      <g>
        <rect
          x={step.x}
          y={step.y}
          width={nodeWidth}
          height={nodeHeight}
          rx="3"
          class={step === validateStep ? 'fill-surface stroke-accent' : 'fill-surface stroke-line'}
          stroke-width="1.25"
        />
        <text
          x={step.x + nodeWidth / 2}
          y={step.y + 17}
          font-size="9"
          text-anchor="middle"
          class={step === validateStep ? 'fill-accent font-mono' : 'fill-fg font-mono'}
        >
          {step.label}
        </text>
      </g>
    ))
  }
  <path
    d={`M${validateStep.x + 18} ${validateStep.y + 46} l5 5 l10 -10`}
    class="fill-none stroke-accent"
    stroke-width="2"
  />
  <text x={validateStep.x + 38} y={validateStep.y + 50} font-size="8" class="fill-muted font-mono">schema</text>
</svg>
```

- [ ] **Step 4: Create `src/components/visuals/SystemsVisual.astro`**

```astro
---
import { createRandom } from '../../lib/seeded';

interface Props {
  seed: string;
}

const { seed } = Astro.props;
const random = createRandom(seed);
const laneStart = 122;
const laneLength = 76;

const batch = Array.from({ length: 6 }, (_, index) => ({
  x: 20 + (index % 2) * 30,
  y: 40 + Math.floor(index / 2) * 34,
  processed: random() > 0.45,
}));
const lanes = [0, 1, 2].map((lane) => ({
  y: 66 + lane * 26,
  progress: 0.35 + random() * 0.6,
}));
---

<svg viewBox="0 0 320 180" class="block h-auto w-full">
  {
    batch.map((tile) => (
      <rect
        x={tile.x}
        y={tile.y}
        width="24"
        height="24"
        rx="2"
        class={tile.processed ? 'fill-accent/25 stroke-accent' : 'fill-surface stroke-line'}
      />
    ))
  }
  <path d="M82 90 h20 m-6 -5 l6 5 l-6 5" class="fill-none stroke-muted" stroke-width="1.5" />
  <rect x="110" y="40" width="100" height="100" rx="4" class="fill-surface stroke-line" />
  <text x="160" y="56" font-size="9" text-anchor="middle" class="fill-muted font-mono">onnx · batch</text>
  {
    lanes.map((lane) => (
      <g>
        <line x1={laneStart} y1={lane.y} x2={laneStart + laneLength} y2={lane.y} class="stroke-line" stroke-width="3" />
        <line
          x1={laneStart}
          y1={lane.y}
          x2={laneStart + laneLength * lane.progress}
          y2={lane.y}
          class="stroke-accent"
          stroke-width="3"
        />
      </g>
    ))
  }
  <path d="M218 90 h20 m-6 -5 l6 5 l-6 5" class="fill-none stroke-muted" stroke-width="1.5" />
  <path d="M250 60 v60 a25 7 0 0 0 50 0 v-60" class="fill-surface stroke-line" />
  <ellipse cx="275" cy="60" rx="25" ry="7" class="fill-surface stroke-line" />
  <text x="275" y="146" font-size="9" text-anchor="middle" class="fill-muted font-mono">results</text>
</svg>
```

- [ ] **Step 5: Create `src/components/visuals/ProjectVisual.astro`**

```astro
---
import type { ProjectCluster } from '../../content/types';
import AgentsVisual from './AgentsVisual.astro';
import DocumentVisual from './DocumentVisual.astro';
import SystemsVisual from './SystemsVisual.astro';
import VisionVisual from './VisionVisual.astro';

interface Props {
  cluster: ProjectCluster;
  seed: string;
}

const { cluster, seed } = Astro.props;

const visualsByCluster = {
  vision: VisionVisual,
  'document-ai': DocumentVisual,
  'llm-agents': AgentsVisual,
  systems: SystemsVisual,
} satisfies Record<ProjectCluster, unknown>;

const Visual = visualsByCluster[cluster];
---

<div aria-hidden="true" class="overflow-hidden rounded border border-line bg-bg">
  <Visual seed={seed} />
</div>
```

- [ ] **Step 6: Replace `src/components/sections/Projects.astro`**

The visual is the first child of each card; the cluster label below it moves from no margin to `mt-6`.

```astro
---
import Section from '../layout/Section.astro';
import ExternalLink from '../ui/ExternalLink.astro';
import ProjectVisual from '../visuals/ProjectVisual.astro';
import { clusterLabels, profile } from '../../content/profile';
import { detectionScore } from '../../lib/seeded';
---

<Section id="projects" label="case studies" title="Projects">
  <ul class="grid gap-8 md:grid-cols-2">
    {
      profile.projects.map((project) => (
        <li
          id={`project-${project.slug}`}
          data-cluster={project.cluster}
          data-detect-label="case_study"
          data-detect-score={detectionScore(project.slug)}
          class="detect flex min-w-0 flex-col rounded-md border border-line bg-surface p-6 [overflow-wrap:anywhere] sm:p-8"
        >
          <ProjectVisual cluster={project.cluster} seed={project.slug} />
          <p class="mt-6 font-mono text-xs uppercase tracking-wider text-muted">
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

- [ ] **Step 7: Check and commit**

Run `npm run check`. Expected: 0 errors. Then:

```bash
git add src && git commit -m "feat: add generated SVG visuals for projects"
```

---

### Task 3: Project filter tabs

**Files:**
- Modify: `src/components/sections/Projects.astro` (final content below)

**Interfaces:**
- Consumes: `clusterLabels`, `ProjectCluster`, card attributes `data-cluster` (existing).
- Produces: a filter bar `[data-project-filters]` (hidden until JS runs), buttons with `data-filter="all" | ProjectCluster` and `aria-pressed`, a visually hidden live region `[data-filter-status]`, and the list `[data-project-list]`.

- [ ] **Step 1: Replace `src/components/sections/Projects.astro`**

```astro
---
import Section from '../layout/Section.astro';
import ExternalLink from '../ui/ExternalLink.astro';
import ProjectVisual from '../visuals/ProjectVisual.astro';
import type { ProjectCluster } from '../../content/types';
import { clusterLabels, profile } from '../../content/profile';
import { detectionScore } from '../../lib/seeded';

const clusters = Object.keys(clusterLabels) as ProjectCluster[];
const filters = [
  { value: 'all', label: 'All', count: profile.projects.length },
  ...clusters.map((cluster) => ({
    value: cluster,
    label: clusterLabels[cluster],
    count: profile.projects.filter((project) => project.cluster === cluster).length,
  })),
].filter((filter) => filter.count > 0);
---

<Section id="projects" label="case studies" title="Projects">
  <div data-project-filters hidden role="group" aria-label="Filter projects by area" class="mb-10 flex flex-wrap gap-2">
    {
      filters.map((filter) => (
        <button
          type="button"
          data-filter={filter.value}
          aria-pressed={filter.value === 'all' ? 'true' : 'false'}
          class="min-h-10 rounded border border-line px-3 py-2 font-mono text-xs uppercase tracking-wider text-muted transition-colors hover:border-accent hover:text-fg aria-pressed:border-accent aria-pressed:text-accent"
        >
          {filter.label} <span class="opacity-60">{filter.count}</span>
        </button>
      ))
    }
  </div>
  <p data-filter-status role="status" aria-live="polite" class="sr-only"></p>

  <ul data-project-list class="grid gap-8 md:grid-cols-2">
    {
      profile.projects.map((project) => (
        <li
          id={`project-${project.slug}`}
          data-cluster={project.cluster}
          data-detect-label="case_study"
          data-detect-score={detectionScore(project.slug)}
          class="detect flex min-w-0 flex-col rounded-md border border-line bg-surface p-6 [overflow-wrap:anywhere] sm:p-8"
        >
          <ProjectVisual cluster={project.cluster} seed={project.slug} />
          <p class="mt-6 font-mono text-xs uppercase tracking-wider text-muted">
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

<script>
  function initProjectFilters(filterGroup: HTMLElement) {
    const buttons = [...filterGroup.querySelectorAll<HTMLButtonElement>('[data-filter]')];
    const cards = [...document.querySelectorAll<HTMLElement>('[data-project-list] > [data-cluster]')];
    const status = document.querySelector<HTMLElement>('[data-filter-status]');

    const applyFilter = (value: string) => {
      let visibleCount = 0;
      for (const card of cards) {
        const matches = value === 'all' || card.dataset.cluster === value;
        card.hidden = !matches;
        if (matches) visibleCount += 1;
      }
      for (const button of buttons) {
        button.setAttribute('aria-pressed', String(button.dataset.filter === value));
      }
      if (status) status.textContent = `Showing ${visibleCount} project${visibleCount === 1 ? '' : 's'}.`;
    };

    for (const button of buttons) {
      button.addEventListener('click', () => applyFilter(button.dataset.filter ?? 'all'));
    }
    filterGroup.hidden = false;
  }

  const filterGroup = document.querySelector<HTMLElement>('[data-project-filters]');
  if (filterGroup) initProjectFilters(filterGroup);
</script>
```

- [ ] **Step 2: Check and commit**

Run `npm run check`. Expected: 0 errors. Then:

```bash
git add src && git commit -m "feat: add project filter tabs"
```

---

### Task 4: Formspree contact form

**Files:**
- Create: `src/components/sections/ContactForm.astro`
- Modify: `src/config/site.ts`, `src/styles/global.css`, `src/components/sections/Contact.astro` (final content below)

**Interfaces:**
- Consumes: `site.contactFormEndpoint` (added here), `profile.email`, `detectionScore`.
- Produces: `<ContactForm />` (no props): `<form data-contact-form>` that posts natively to Formspree without JS, and via `fetch` with `Accept: application/json` when JS is available. Color utilities `text-danger` / `border-danger`.

- [ ] **Step 1: Add the endpoint to `src/config/site.ts`**

Add this property directly after `description` (before `nav`):

```ts
  contactFormEndpoint: 'https://formspree.io/f/xovegole',
```

- [ ] **Step 2: Add the danger color token to `src/styles/global.css`**

In the `:root, [data-theme="dark"]` block, add after `--accent-fg: #0b0d0f;`:

```css
  --danger: #ff6b6b;
```

In the `[data-theme="light"]` block, add after `--accent-fg: #ffffff;`:

```css
  --danger: #b42318;
```

In `@theme inline { ... }`, add after `--color-accent-fg: var(--accent-fg);`:

```css
  --color-danger: var(--danger);
```

- [ ] **Step 3: Create `src/components/sections/ContactForm.astro`**

```astro
---
import { site } from '../../config/site';
import { profile } from '../../content/profile';

const labelClass = 'font-mono text-xs uppercase tracking-wider text-muted';
const fieldClass =
  'mt-2 block w-full rounded border border-line bg-bg px-3 py-2.5 text-base text-fg placeholder:text-muted/70 focus:border-accent';
---

<form action={site.contactFormEndpoint} method="POST" data-contact-form class="grid gap-5">
  <div>
    <label for="contact-name" class={labelClass}>Name</label>
    <input id="contact-name" name="name" type="text" required maxlength="100" autocomplete="name" class={fieldClass} />
  </div>
  <div>
    <label for="contact-email" class={labelClass}>Email</label>
    <input
      id="contact-email"
      name="email"
      type="email"
      required
      maxlength="200"
      autocomplete="email"
      class={fieldClass}
    />
  </div>
  <div>
    <label for="contact-message" class={labelClass}>Message</label>
    <textarea
      id="contact-message"
      name="message"
      required
      minlength="10"
      maxlength="5000"
      rows="6"
      class:list={[fieldClass, 'resize-y']}></textarea>
  </div>
  <div class="hidden" aria-hidden="true">
    <label for="contact-gotcha">Leave this field empty</label>
    <input id="contact-gotcha" name="_gotcha" type="text" tabindex="-1" autocomplete="off" />
  </div>
  <input type="hidden" name="_subject" value="New message from portfolio" />
  <div class="flex flex-wrap items-center gap-x-5 gap-y-3">
    <button type="submit" data-submit class="btn-primary">Send message</button>
    <p class="text-sm text-muted [overflow-wrap:anywhere]">
      or email <a href={`mailto:${profile.email}`} class="text-accent underline-offset-4 hover:underline">{profile.email}</a>
    </p>
  </div>
  <p
    data-form-status
    role="status"
    aria-live="polite"
    class="min-h-5 text-sm data-[tone=error]:text-danger data-[tone=success]:text-accent"
  >
  </p>
</form>

<script>
  type FormspreeErrorPayload = { errors?: { message?: string }[] };

  function initContactForm(form: HTMLFormElement) {
    const submitButton = form.querySelector<HTMLButtonElement>('[data-submit]');
    const status = form.querySelector<HTMLElement>('[data-form-status]');

    const setStatus = (message: string, tone: 'info' | 'success' | 'error') => {
      if (!status) return;
      status.textContent = message;
      status.dataset.tone = tone;
    };

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (submitButton) submitButton.disabled = true;
      form.setAttribute('aria-busy', 'true');
      setStatus('Sending…', 'info');

      try {
        const response = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' },
        });

        if (response.ok) {
          form.reset();
          setStatus('Thanks, your message was sent.', 'success');
          return;
        }

        const payload: FormspreeErrorPayload = await response.json().catch(() => ({}));
        const details = (payload.errors ?? [])
          .map((error) => error.message)
          .filter(Boolean)
          .join(' ');
        setStatus(
          details
            ? `The message wasn't sent: ${details}`
            : `The message wasn't sent (error ${response.status}). Please email me directly.`,
          'error',
        );
      } catch {
        setStatus("Network error, so the message wasn't sent. Check your connection or email me directly.", 'error');
      } finally {
        if (submitButton) submitButton.disabled = false;
        form.removeAttribute('aria-busy');
      }
    });
  }

  const contactForm = document.querySelector<HTMLFormElement>('[data-contact-form]');
  if (contactForm) initContactForm(contactForm);
</script>
```

- [ ] **Step 4: Replace `src/components/sections/Contact.astro`**

The citation moves under the contact details in the left column, and the form takes the right column.

```astro
---
import Section from '../layout/Section.astro';
import ExternalLink from '../ui/ExternalLink.astro';
import ContactForm from './ContactForm.astro';
import { profile } from '../../content/profile';
import { detectionScore } from '../../lib/seeded';

const citation = `@engineer{patel,
  author   = {${profile.name}},
  role     = {${profile.role}},
  location = {${profile.location}},
  email    = {${profile.email}}
}`;
---

<Section id="contact" label="citation" title="Contact">
  <div class="grid gap-14 lg:grid-cols-12 lg:gap-12">
    <div class="min-w-0 lg:col-span-5">
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

      <figure class="mt-12 min-w-0">
        <div class="detect rounded-md" data-detect-label="citation" data-detect-score={detectionScore('citation')}>
          <pre class="overflow-x-auto rounded-md border border-line bg-surface p-5 font-mono text-sm leading-relaxed sm:p-6"><code>{citation}</code></pre>
        </div>
        <figcaption class="mt-3 font-mono text-xs text-muted">// cite as</figcaption>
      </figure>
    </div>

    <div class="min-w-0 lg:col-span-7">
      <h3 class="font-mono text-xs uppercase tracking-[0.2em] text-muted">
        <span class="text-accent">//</span> send a message
      </h3>
      <div class="mt-6">
        <ContactForm />
      </div>
    </div>
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

- [ ] **Step 5: Check and commit**

Run `npm run check`. Expected: 0 errors. Then:

```bash
git add src && git commit -m "feat: add Formspree contact form with progressive enhancement"
```

---

### Task 5: Sitemap and robots.txt

**Files:**
- Modify: `astro.config.mjs`, `src/layouts/BaseLayout.astro`
- Create: `src/pages/robots.txt.ts`
- Delete: `public/robots.txt`

**Interfaces:**
- Produces: build outputs `sitemap-index.xml` + `sitemap-0.xml` (404 excluded) and `robots.txt` pointing at the sitemap, using `site` from `astro.config.mjs`.

- [ ] **Step 1: Install the integration**

```bash
npm install @astrojs/sitemap
```

Expected: `@astrojs/sitemap` added to `dependencies`. If npm reports a peer-dependency conflict with Astro 7, stop and report it instead of forcing the install.

- [ ] **Step 2: Replace `astro.config.mjs`**

```js
// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://my-portfolio-ec4b7.web.app',
  integrations: [sitemap({ filter: (page) => !/\/404\/?$/.test(page) })],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

- [ ] **Step 3: Replace `public/robots.txt` with an endpoint**

Delete `public/robots.txt` (`git rm public/robots.txt`). A file in `public/` and a page with the same output path would conflict.

Create `src/pages/robots.txt.ts`:

```ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const sitemapUrl = new URL('sitemap-index.xml', site);
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl.href}\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
```

- [ ] **Step 4: Link the sitemap in `src/layouts/BaseLayout.astro`**

Add directly after `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`:

```astro
    <link rel="sitemap" href="/sitemap-index.xml" />
```

- [ ] **Step 5: Check and commit**

Run `npm run check`. Expected: 0 errors. Then:

```bash
git add -A astro.config.mjs package.json package-lock.json src public && git commit -m "feat: add sitemap and robots.txt"
```

---

### Task 6: Build-time Open Graph share image

**Files:**
- Create: `src/lib/og-image.ts`, `src/pages/og.png.ts`
- Modify: `astro.config.mjs`, `src/config/site.ts`, `src/layouts/BaseLayout.astro`

**Interfaces:**
- Consumes: `profile` (`name`, `initials`, `role`, `headline`, `status`), `detectionScore`.
- Produces: `site.ogImage = { path: '/og.png', width: 1200, height: 630 }`, `renderOgImage(): Promise<Uint8Array<ArrayBuffer>>`; build output `/og.png`; OG/Twitter image meta in every page. The layout reads the size from `site.ts` so it never imports the renderer (`satori`/`resvg`/`node:fs`).

- [ ] **Step 1: Install renderer dependencies**

```bash
npm install satori @resvg/resvg-js @fontsource/space-grotesk @fontsource/jetbrains-mono
```

Then confirm these two font files exist (satori reads `.woff`, not `.woff2`):

```bash
ls node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-600-normal.woff node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff
```

If either path is missing, stop and report the actual file names in that folder.

- [ ] **Step 2: Keep the native renderer out of the Vite bundle in `astro.config.mjs`**

Replace the `vite` block with:

```js
  vite: {
    plugins: [tailwindcss()],
    ssr: { external: ['@resvg/resvg-js'] },
    optimizeDeps: { exclude: ['@resvg/resvg-js'] },
  },
```

- [ ] **Step 3: Add the image settings to `src/config/site.ts`**

Add this property directly after `contactFormEndpoint` (before `nav`):

```ts
  ogImage: { path: '/og.png', width: 1200, height: 630 },
```

- [ ] **Step 4: Create `src/lib/og-image.ts`**

```ts
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import { site } from '../config/site';
import { profile } from '../content/profile';
import { detectionScore } from './seeded';

const colors = {
  bg: '#0b0d0f',
  fg: '#e8eaed',
  muted: '#9aa3ad',
  accent: '#ff7a1a',
  accentFg: '#0b0d0f',
};

type OgStyle = Record<string, string | number>;
type OgChildren = string | OgElement | OgElement[];
interface OgElement {
  type: 'div';
  props: { style: OgStyle; children?: OgChildren };
}

function div(style: OgStyle, children?: OgChildren): OgElement {
  return { type: 'div', props: { style, children } };
}

function corner(position: OgStyle): OgElement {
  return div({
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: colors.accent,
    borderStyle: 'solid',
    borderWidth: 0,
    ...position,
  });
}

function buildTree(): OgElement {
  return div(
    {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: 72,
      backgroundColor: colors.bg,
      color: colors.fg,
      fontFamily: 'Space Grotesk',
    },
    [
      div({ display: 'flex', fontFamily: 'JetBrains Mono', fontSize: 26, color: colors.muted }, [
        div({ color: colors.accent }, `[${profile.initials}]`),
        div({ marginLeft: 20 }, `${profile.name} · ${profile.role}`),
      ]),
      div({ position: 'relative', display: 'flex', padding: '40px 44px' }, [
        corner({ top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 }),
        corner({ top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 }),
        corner({ bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 }),
        corner({ bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 }),
        div(
          {
            position: 'absolute',
            top: -24,
            left: 0,
            padding: '2px 10px',
            backgroundColor: colors.accent,
            color: colors.accentFg,
            fontFamily: 'JetBrains Mono',
            fontSize: 20,
          },
          `ai_ml_engineer ${detectionScore('og-image')}`,
        ),
        div({ fontSize: 60, fontWeight: 600, lineHeight: 1.1, letterSpacing: -1 }, profile.headline),
      ]),
      div(
        {
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: 'JetBrains Mono',
          fontSize: 22,
          color: colors.muted,
        },
        [div({}, profile.status), div({ color: colors.accent }, 'portfolio')],
      ),
    ],
  );
}

async function loadFonts() {
  const fontsRoot = join(process.cwd(), 'node_modules', '@fontsource');
  const [sans, mono] = await Promise.all([
    readFile(join(fontsRoot, 'space-grotesk', 'files', 'space-grotesk-latin-600-normal.woff')),
    readFile(join(fontsRoot, 'jetbrains-mono', 'files', 'jetbrains-mono-latin-500-normal.woff')),
  ]);
  return [
    { name: 'Space Grotesk', data: sans, weight: 600 as const, style: 'normal' as const },
    { name: 'JetBrains Mono', data: mono, weight: 500 as const, style: 'normal' as const },
  ];
}

export async function renderOgImage(): Promise<Uint8Array<ArrayBuffer>> {
  // satori is typed for React elements; plain { type, props } objects are its documented JSX-free input.
  const tree = buildTree() as unknown as Parameters<typeof satori>[0];
  const { width, height } = site.ogImage;
  const svg = await satori(tree, { width, height, fonts: await loadFonts() });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng();
  return new Uint8Array(png);
}
```

- [ ] **Step 5: Create `src/pages/og.png.ts`**

The file name fixes the output path, so it must match `site.ogImage.path`.

```ts
import type { APIRoute } from 'astro';
import { renderOgImage } from '../lib/og-image';

export const prerender = true;

export const GET: APIRoute = async () => {
  const png = await renderOgImage();
  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
};
```

- [ ] **Step 6: Add image meta to `src/layouts/BaseLayout.astro`**

`site` is already imported. Add after `const canonicalUrl = new URL(Astro.url.pathname, Astro.site);`:

```ts
const ogImageUrl = new URL(site.ogImage.path, Astro.site);
```

Replace:

```astro
    <meta name="twitter:card" content="summary" />
```

with:

```astro
    <meta property="og:image" content={ogImageUrl} />
    <meta property="og:image:width" content={String(site.ogImage.width)} />
    <meta property="og:image:height" content={String(site.ogImage.height)} />
    <meta property="og:image:alt" content={`${profile.name}, ${profile.role}`} />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content={ogImageUrl} />
```

- [ ] **Step 7: Check and commit**

Run `npm run check`. Expected: 0 errors. Then:

```bash
git add astro.config.mjs package.json package-lock.json src && git commit -m "feat: add build-time Open Graph share image"
```

---

### Final step: Whole-branch review and owner verification

- [ ] **Step 1:** Review `main..HEAD` (excluding `package-lock.json`) against this plan and the spec. Fix real issues in one commit: `fix: address plan 2 review findings`.
- [ ] **Step 2:** Ask the owner to run, or approve running, `npm run build`. Expected: 0 `astro check` errors, and `dist/` contains `index.html`, `404.html`, `og.png`, `robots.txt`, `sitemap-index.xml`, `sitemap-0.xml` (without `/404`).
- [ ] **Step 3 (owner, in a browser via `npm run dev` or `npm run preview`):**
  - Hovering or tabbing into a project card, archive row or citation shows orange corner brackets and a label like `case_study 0.97`.
  - Each project card shows a visual matching its area (document, vision, agents, systems) in both themes, and there's no horizontal scroll at 320px.
  - The filter tabs show only matching cards, and "All" restores all 8. With JavaScript disabled, the tabs are hidden and all cards show.
  - Submitting the form with valid data shows "Thanks, your message was sent." and the email arrives (Formspree may ask you to confirm the form the first time).
  - Opening `/og.png` shows the share image.
- [ ] **Step 4:** Merge `plan-2-signature` into `main` only after the owner approves.
