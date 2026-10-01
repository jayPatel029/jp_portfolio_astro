# Plan 3 — Hero Inference-Pipeline Animation Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Steps marked 👤 need the owner's approval or action.

**Goal:** Add the signature hero piece from spec 3.2A, an "inference run" panel next to the headline:
1. A scanned resume-style document gets deskewed and scanned.
2. OCR boxes with confidence scores appear over its lines.
3. The extracted JSON (`name`, `role`, `location`, `headline`) types out.
4. The `headline` field lights up, and the real page headline flashes a detection box.

The run takes about 4.2 s. It plays at most once per browser-tab session, can be skipped, and replays on click.

**Architecture:**
- **One Preact island** (`client:load`), `src/components/hero/InferencePipeline.tsx`. A single `elapsed` value (0 → 4200 ms) drives every visual; it's updated from a `requestAnimationFrame` loop. The server-rendered HTML is the **final frame**, which is what no-JS and reduced-motion visitors see.
- **Avoiding a flash of the final frame before the animation starts.** A tiny inline script in the hero runs before the panel is parsed. Only when the intro should play (no reduced-motion preference, not yet played in this session) does it set `<html data-intro="pending">`. CSS hides the panel body while it's pending. The island starts the run and flips the attribute. If the island never loads, a 4 s timeout un-hides the final frame.
- **Nothing is gated behind the animation.** The `<h1>`, CTAs and status line are static HTML and visible immediately, so the largest contentful paint is unaffected.

**Tech Stack:** Astro 7, `@astrojs/preact` 6.x, `preact` **10.x** (the integration's peer range is `^10.6.5`; `preact@11` is out of range), Tailwind v4, TypeScript strict.

**Spec:** `docs/portfolio-revamp.md` sections 3.2A, 3.3 (1), 3.5 and 6 (hero animation adds < 50 KB). **Builds on:** Plans 1, 2 and Plan 4 Tasks 1–3 (deployed to `https://jaypatel-dev-f91cb.web.app`).

## Global Constraints

- Project root: `C:\Users\jaysu\Desktop\ME\Jay-Portfolio\portfolio_astro`. Branch `plan-3-hero` from `main` (after Step 0 below).
- **Preact, not React** (owner decision 2026-10-02, to stay inside the 50 KB hero budget). No `preact/compat`, no other new dependencies.
- In Preact TSX use `class` (not `className`) and **kebab-case SVG attributes** (`stroke-width`, `font-size`). Without `preact/compat`, camelCase SVG props are not converted.
- Colors only via theme classes (`fill-accent`, `stroke-line`, `text-muted` …), never hex values, so both themes work.
- No phone number. The JSON shows only `name`, `role`, `location`, `headline` from `profile.ts`.
- All motion respects `prefers-reduced-motion`: the intro never auto-plays under it. Replay is user-initiated, which is allowed.
- No fixed heights on text containers. The panel's untyped JSON text is rendered `invisible` (not removed), so typing causes no layout shift.
- **Owner preferences (execution):**
  - No separate review step per task.
  - For each task: implement from this plan, run `npm run check`, commit with the given message, append one line to `.superpowers/sdd/progress.md` (new "plan 3" section at the top), and give the owner a one-line update.
  - `npm run build`, `firebase deploy` and merges only with owner approval.
  - No automated tests.
  - One whole-branch review at the end.

## File Structure

```
src/components/hero/InferencePipeline.tsx   NEW  Preact island: panel, timeline, skip/replay
src/components/sections/Hero.astro          MOD  two-column layout, intro gate script, island, h1 detection box
src/styles/global.css                       MOD  [data-detected] flash, [data-intro="pending"] gate
astro.config.mjs                            MOD  preact() integration
tsconfig.json                               MOD  jsx: react-jsx, jsxImportSource: preact
package.json / package-lock.json            MOD  @astrojs/preact, preact@10
```

---

### Task 1: Merge the Plan 4 work and set up Preact

- [ ] **Step 0 (👤 approve): Bring `main` up to date, then branch**

`plan-4-launch` (security headers, README) is deployed but not merged. Merge it first so Plan 3 builds on it. This plan file and the spec/Plan 4 edits are uncommitted on the current branch; commit them on `main`:

```bash
git checkout main
git merge --ff-only plan-4-launch
git add docs
git commit -m "docs: add plan 3 (hero pipeline, Preact) and pause plan 4 before QA"
git push origin main plan-4-launch
git checkout -b plan-3-hero
```

If `git checkout main` refuses because of the uncommitted docs, run `git stash`, do the checkout and merge, then `git stash pop` before `git add docs`.

- [ ] **Step 1: Install**

```bash
npm install @astrojs/preact preact@^10.29.8
```

Expected: both added to `dependencies`, no peer-dependency errors. If npm reports a conflict, stop and report it; don't use `--force` or `--legacy-peer-deps`.

- [ ] **Step 2: Replace `astro.config.mjs`**

```js
// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://jaypatel-dev-f91cb.web.app',
  integrations: [preact(), sitemap({ filter: (page) => !/\/404\/?$/.test(page) })],
  vite: {
    plugins: [tailwindcss()],
    ssr: { external: ['@resvg/resvg-js'] },
    optimizeDeps: { exclude: ['@resvg/resvg-js'] },
  },
});
```

- [ ] **Step 3: Replace `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"],
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "preact"
  }
}
```

- [ ] **Step 4: Check and commit**

Run `npm run check`. Expected: 0 errors. Then:

```bash
git add astro.config.mjs tsconfig.json package.json package-lock.json && git commit -m "chore: add Preact integration for the hero island"
```

---

### Task 2: The `InferencePipeline` island

**Files:**
- Create: `src/components/hero/InferencePipeline.tsx`

**Interfaces:**
- Props: `{ fields: { name: string; role: string; location: string; headline: string } }`.
- The Skip/Replay button is server-rendered `hidden` and shown after hydration, so no-JS visitors never see a dead button.
- Reads `document.documentElement.dataset.intro`. It auto-plays only when that is `'pending'`, then sets it to `'played'` once the first animation frame is rendered.
- At the start of the render stage it sets `data-detected` on `#hero-title` for 1.6 s; Task 3 styles this.

**Timeline (ms):** preprocess 0–700 (deskew −3° → 0°, scan line, lines darken) · ocr 700–1700 (4 boxes fade in, 220 ms apart) · extract 1700–3500 (JSON types out with a caret) · render 3500–4200 (headline field highlighted, page headline flashes) · done.

- [ ] **Step 1: Create `src/components/hero/InferencePipeline.tsx`**

```tsx
import { useEffect, useRef, useState } from 'preact/hooks';

interface PipelineFields {
  name: string;
  role: string;
  location: string;
  headline: string;
}

interface Props {
  fields: PipelineFields;
}

const OCR_START = 700;
const EXTRACT_START = 1700;
const RENDER_START = 3500;
const TOTAL_MS = 4200;
const BOX_STAGGER_MS = 220;
const FADE_MS = 150;
const HEADLINE_FLASH_MS = 1600;

const STAGES = [
  { label: 'preprocess', start: 0 },
  { label: 'ocr', start: OCR_START },
  { label: 'extract', start: EXTRACT_START },
  { label: 'render', start: RENDER_START },
];

const TEXT_LINES = [
  { x: 24, y: 24, width: 110, height: 10 },
  { x: 24, y: 46, width: 80, height: 6 },
  { x: 24, y: 62, width: 64, height: 6 },
  { x: 24, y: 84, width: 260, height: 5 },
  { x: 24, y: 96, width: 236, height: 5 },
  { x: 24, y: 108, width: 250, height: 5 },
  { x: 24, y: 120, width: 140, height: 5 },
];

const OCR_BOXES = [
  { key: 'name', score: '0.99', x: 20, y: 20, width: 118, height: 18 },
  { key: 'role', score: '0.98', x: 20, y: 42, width: 88, height: 14 },
  { key: 'location', score: '0.97', x: 20, y: 58, width: 72, height: 14 },
  { key: 'headline', score: '0.96', x: 20, y: 80, width: 268, height: 26 },
];

function progress(elapsed: number, start: number, duration: number): number {
  return Math.min(Math.max((elapsed - start) / duration, 0), 1);
}

function flashHeadline() {
  const headline = document.getElementById('hero-title');
  if (!headline) return;
  headline.setAttribute('data-detected', '');
  window.setTimeout(() => headline.removeAttribute('data-detected'), HEADLINE_FLASH_MS);
}

export default function InferencePipeline({ fields }: Props) {
  const [elapsed, setElapsed] = useState(TOTAL_MS);
  const [isHydrated, setIsHydrated] = useState(false);
  const frameRef = useRef(0);
  const flashedRef = useRef(false);

  const stop = () => cancelAnimationFrame(frameRef.current);

  const play = () => {
    stop();
    flashedRef.current = false;
    setElapsed(0);
    const startedAt = performance.now();
    const tick = (now: number) => {
      const next = Math.min(now - startedAt, TOTAL_MS);
      setElapsed(next);
      if (!flashedRef.current && next >= RENDER_START) {
        flashedRef.current = true;
        flashHeadline();
      }
      if (next < TOTAL_MS) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
  };

  const skip = () => {
    stop();
    setElapsed(TOTAL_MS);
  };

  useEffect(() => {
    setIsHydrated(true);
    if (document.documentElement.dataset.intro === 'pending') play();
    return stop;
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.intro === 'pending' && elapsed < TOTAL_MS) root.dataset.intro = 'played';
  }, [elapsed]);

  const isDone = elapsed >= TOTAL_MS;
  const isRendering = elapsed >= RENDER_START;
  const isExtracting = elapsed >= EXTRACT_START && !isRendering;
  const deskew = progress(elapsed, 0, OCR_START);
  const rotation = (1 - deskew) * -3;
  const scanY = 8 + deskew * 128;

  const json = JSON.stringify(fields, null, 2);
  const jsonLines = json.split('\n');
  const lineStarts = jsonLines.map((_, index) =>
    jsonLines.slice(0, index).reduce((total, line) => total + line.length + 1, 0),
  );
  const typedCount = Math.floor(progress(elapsed, EXTRACT_START, RENDER_START - EXTRACT_START) * json.length);

  return (
    <figure
      aria-label="Animated illustration: a scanned document goes through OCR and VLM extraction into structured JSON."
      class="min-w-0 rounded-md border border-line bg-surface"
    >
      <div class="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5 font-mono text-xs text-muted">
        <span aria-hidden="true">inference_run.log</span>
        <div class="flex items-center gap-3">
          <span aria-hidden="true" class="tabular-nums">
            {isDone ? 'done' : 'running'} · {(elapsed / 1000).toFixed(1)}s
          </span>
          <button
            type="button"
            hidden={!isHydrated}
            onClick={isDone ? play : skip}
            aria-label={isDone ? 'Replay the pipeline animation' : 'Skip the pipeline animation'}
            class="min-h-8 rounded border border-line px-2.5 font-mono text-xs uppercase tracking-wider text-fg transition-colors hover:border-accent hover:text-accent"
          >
            {isDone ? 'Replay' : 'Skip'}
          </button>
        </div>
      </div>

      <div data-pipeline-body aria-hidden="true" class="p-4 sm:p-5">
        <ol class="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-wider">
          {STAGES.map((stage, index) => {
            const nextStart = STAGES[index + 1]?.start ?? TOTAL_MS;
            const stateClass =
              elapsed >= nextStart ? 'text-fg' : elapsed >= stage.start ? 'text-accent' : 'text-muted/60';
            return (
              <li key={stage.label} class={stateClass}>
                <span class="text-muted">{String(index + 1).padStart(2, '0')}</span> {stage.label}
              </li>
            );
          })}
        </ol>

        <svg viewBox="0 0 320 144" class="mt-4 block h-auto w-full">
          <g transform={`rotate(${rotation.toFixed(2)} 160 72)`}>
            <rect x="8" y="8" width="304" height="128" rx="3" class="fill-bg stroke-line" />
            {TEXT_LINES.map((line, index) => (
              <rect
                key={index}
                x={line.x}
                y={line.y}
                width={line.width}
                height={line.height}
                rx="1"
                opacity={0.25 + deskew * 0.3}
                class="fill-muted"
              />
            ))}
            {OCR_BOXES.map((box, index) => {
              const label = `${box.key} ${box.score}`;
              const labelWidth = label.length * 5.2 + 8;
              const labelAbove = box.key === 'headline';
              const labelX = labelAbove ? box.x + box.width - labelWidth : box.x + box.width + 4;
              const labelY = labelAbove ? box.y - 12 : box.y;
              const highlighted = isRendering && box.key === 'headline';
              return (
                <g key={box.key} opacity={progress(elapsed, OCR_START + index * BOX_STAGGER_MS, FADE_MS)}>
                  <rect
                    x={box.x}
                    y={box.y}
                    width={box.width}
                    height={box.height}
                    stroke-width="1.25"
                    class={highlighted ? 'fill-accent/15 stroke-accent' : 'fill-none stroke-accent'}
                  />
                  <rect x={labelX} y={labelY} width={labelWidth} height="11" class="fill-accent" />
                  <text x={labelX + 4} y={labelY + 8.5} font-size="8.5" class="fill-accent-fg font-mono">
                    {label}
                  </text>
                </g>
              );
            })}
            {elapsed < OCR_START && (
              <line x1="8" x2="312" y1={scanY} y2={scanY} stroke-width="1.5" opacity="0.7" class="stroke-accent" />
            )}
          </g>
        </svg>

        <pre class="mt-4 overflow-hidden whitespace-pre-wrap rounded border border-line bg-bg p-3 font-mono text-[11px] leading-relaxed text-fg [overflow-wrap:anywhere] sm:text-xs">
          {jsonLines.map((line, index) => {
            const lineStart = lineStarts[index] ?? 0;
            const typedInLine = Math.min(Math.max(typedCount - lineStart, 0), line.length);
            const hasCaret = isExtracting && typedCount >= lineStart && typedCount <= lineStart + line.length;
            const isHeadlineLine = line.trimStart().startsWith('"headline"');
            return (
              <span key={index} class={isRendering && isHeadlineLine ? 'bg-accent/15' : undefined}>
                {line.slice(0, typedInLine)}
                {hasCaret && (
                  <span class="relative">
                    <span class="absolute left-0 top-0 h-[1.2em] w-[0.55em] bg-accent" />
                  </span>
                )}
                <span class="invisible">{line.slice(typedInLine)}</span>
                {index < jsonLines.length - 1 ? '\n' : null}
              </span>
            );
          })}
        </pre>
      </div>
    </figure>
  );
}
```

- [ ] **Step 2: Check and commit**

Run `npm run check`. Expected: 0 errors. If it reports that `stroke-width`/`font-size` aren't known props, keep the kebab-case names. Without `preact/compat`, Preact writes prop names to the DOM as-is, so camelCase would render broken SVG. Instead, report the exact error to the owner.

```bash
git add src/components/hero && git commit -m "feat: add inference-pipeline hero island"
```

---

### Task 3: Put the island in the hero

**Files:**
- Modify: `src/styles/global.css`, `src/components/sections/Hero.astro` (full content below)

- [ ] **Step 1: Extend the detection-box rules in `src/styles/global.css`**

Replace:

```css
  .detect:hover::before,
  .detect:focus-within::before {
```

with:

```css
  .detect:hover::before,
  .detect:focus-within::before,
  .detect[data-detected]::before {
```

Replace:

```css
  .detect:hover::after,
  .detect:focus-within::after {
```

with:

```css
  .detect:hover::after,
  .detect:focus-within::after,
  .detect[data-detected]::after {
```

Then add, directly after the `.detect:hover::after, …` rule block (still inside `@layer components`):

```css
  [data-intro="pending"] [data-pipeline-body] {
    visibility: hidden;
  }
```

- [ ] **Step 2: Replace `src/components/sections/Hero.astro`**

The layout becomes copy (7 columns) + panel (5 columns) from `lg`, and stacked below that. The headline steps down one size at `lg`, where it now shares the row. The inline script must stay **directly before** the island, so it runs before the panel is parsed.

```astro
---
import Container from '../layout/Container.astro';
import ExternalLink from '../ui/ExternalLink.astro';
import InferencePipeline from '../hero/InferencePipeline';
import { profile } from '../../content/profile';
import { detectionScore } from '../../lib/seeded';

const pipelineFields = {
  name: profile.name,
  role: profile.role,
  location: profile.location,
  headline: profile.headline,
};
---

<section id="top" aria-labelledby="hero-title" class="relative overflow-hidden">
  <div aria-hidden="true" class="hero-grid pointer-events-none absolute inset-0"></div>
  <Container class="relative grid min-h-[calc(100svh-4rem)] content-center gap-14 py-20 lg:grid-cols-12 lg:items-center lg:gap-10">
    <div class="min-w-0 lg:col-span-7">
      <p class="font-mono text-sm text-muted">
        <span class="text-accent">{profile.name}</span> · {profile.role}
      </p>
      <h1
        id="hero-title"
        data-detect-label="headline"
        data-detect-score={detectionScore('headline')}
        class="detect mt-6 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-6xl lg:text-5xl xl:text-6xl"
      >
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
    </div>

    <div class="min-w-0 lg:col-span-5">
      <script is:inline>
        (() => {
          try {
            const root = document.documentElement;
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            if (sessionStorage.getItem('intro-played')) return;
            sessionStorage.setItem('intro-played', '1');
            root.dataset.intro = 'pending';
            setTimeout(() => {
              if (root.dataset.intro === 'pending') delete root.dataset.intro;
            }, 4000);
          } catch {}
        })();
      </script>
      <InferencePipeline client:load fields={pipelineFields} />
    </div>
  </Container>
</section>
```

- [ ] **Step 3: Check and commit**

Run `npm run check`. Expected: 0 errors. Then:

```bash
git add src && git commit -m "feat: show the inference pipeline in the hero"
```

---

### Final step: Review, build, deploy

- [ ] **Step 1:** Review `main..plan-3-hero` (excluding `package-lock.json`) against this plan and the spec (3.2A, 3.5, 6). Fix real issues in one commit: `fix: address plan 3 review findings`.
- [ ] **Step 2 (👤 approve): Build and measure the hero's JavaScript**

```bash
npm run build
for f in dist/_astro/*.js; do printf "%6d  %s\n" "$(gzip -c "$f" | wc -c)" "$f"; done
```

Expected: 0 check errors. All JS files together are under 50 KB gzipped (expected ≈ 10–15 KB: Preact, the island runtime, the component, and the existing small scripts). Report the total.

- [ ] **Step 3 (👤 approve): Deploy** to the not-yet-announced site so the owner can check it on real devices:

```bash
firebase deploy --only hosting
```

- [ ] **Step 4 (👤 owner, in a browser on `https://jaypatel-dev-f91cb.web.app`):**
  - **First visit in a new tab:** the panel plays once (about 4 s). The headline flashes a `headline 0.9x` box at the end, and there's no flash of the finished panel before it starts.
  - **Reload the same tab:** the panel shows the final frame without playing. Replay plays it again; Skip during a run jumps to the end.
  - **Reduced motion** (DevTools → Rendering → `prefers-reduced-motion: reduce`, in a new tab): final frame, no auto-play.
  - **JavaScript disabled:** final frame is visible and there's no Replay button (it only appears once the island has loaded).
  - **Layout:** at 320, 375, 768, 1024, 1366 and 1920 px wide, in both themes, the panel sits below the copy under 1024 px and beside it from 1024 px. There's no horizontal scroll, and the JSON wraps inside the panel.
  - **Keyboard:** Tab reaches the Skip/Replay button, with a visible focus ring.
- [ ] **Step 5 (👤 approve):** Merge and push:

```bash
git checkout main && git merge --ff-only plan-3-hero && git push origin main plan-3-hero
```

- [ ] **Step 6:** Update `docs/portfolio-revamp.md` section 8: append `, done` after the Plan 3 link text. Commit on `main`: `docs: mark plan 3 done`, then push.

**Next:** resume Plan 4 at Task 4 (QA pass). It now covers the new hero too.

## Out of scope

- The footer "replay inference" button from spec 3.3 (8), which can be added later by dispatching an event the island listens for.
- The scroll-triggered reveals for other sections, the embedding-space explorer and the patch-grid demo (v2).
