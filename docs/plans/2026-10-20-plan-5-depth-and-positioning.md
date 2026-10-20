# Plan 5 — Depth and Positioning Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Steps marked 👤 need the owner's approval. This repo's owner preference is **inline execution** (same as Plans 1–4): no per-task review, `npm run check`, commit, one-line update. Use superpowers:executing-plans. Do not dispatch per-task subagents unless the owner asks.

**Goal:** Rewrite the live portfolio so it is not a resume clone and not OCR-first: new headline and About, rebalanced metrics, Work that points at three flagship case studies, and synthetic diagrams for those three.

**Architecture:** Content stays in `src/content/profile.ts`. Types grow three optional case-study fields and a linked highlight. `Projects.astro` renders `featured` projects full-width with Problem / Decision / Result; the rest stay compact cards. Three new SVGs override the cluster visual for those slugs. The Plan 3 hero island stays; only stage labels and its aria-label change.

**Tech Stack:** Astro 7, Preact 10 island (untouched except labels), Tailwind v4, TypeScript strict. No new dependencies.

**Spec:** `docs/2026-10-20-depth-and-positioning.md`. **Builds on:** `main` at `15a4bfb` (live at https://jaypatel-dev-f91cb.web.app).

## Global Constraints

- Project root: `C:\Users\jaysu\Desktop\ME\Jay-Portfolio\portfolio_astro`. Branch `plan-5-depth` from `main`.
- **No new npm packages.** No new routes. Do not rebuild `InferencePipeline.tsx` beyond the label / aria-label edits in Task 4.
- **No phone number.** No client names, no real invoices, no production photos. Invoice copy in the document SVG is fictional (`Northridge Tooling`).
- **Numbers (do not invent others):** keep **~6 GB** (resume). Retrieval: **~90%** resolved without review; **5–10%** still need review (body only). Document: **~90%** schema-usable, **10–15 s**/doc, unquantized **~16 GB** never ran. Detection: **5–10 s**, not 5 fps. Catalog: **10–12 classes, 10–15 images each**. QR **94%+** stays.
- Do not call detection “real-time” in new copy. Do not compare 4-bit quality to the original VLM.
- Colors only via theme classes (`fill-accent`, `stroke-line`, `text-muted`, …), never hex, so both themes work.
- Visuals are `aria-hidden` like the existing ones. Seeds stay so SVGs are deterministic.
- **Owner preferences (execution):**
  - No separate review step per task.
  - For each task: implement from this plan, run `npm run check`, commit with the given message, append one line to `.superpowers/sdd/progress.md` (new “plan 5” section at the top), and give the owner a one-line update.
  - `npm run build`, `firebase deploy`, and merge to `main` only with owner approval.
  - No automated tests.
  - One whole-branch review at the end; fix real issues in a single commit, then ask before merging.

## File Structure

```
docs/2026-10-20-depth-and-positioning.md          already written (commit in Step 0)
docs/plans/2026-10-20-plan-5-depth-and-positioning.md  this file
docs/portfolio-revamp.md                         MOD  Plan 5 links
src/content/types.ts                             MOD  summary[], ExperienceHighlight, featured fields
src/content/profile.ts                           MOD  all Plan 5 copy
src/lib/og-image.ts                              MOD  smaller headline so the longer line fits
src/components/sections/About.astro              MOD  map summary paragraphs
src/components/sections/Experience.astro         MOD  linked highlights
src/components/sections/Projects.astro           MOD  flagship vs compact layout
src/components/sections/Contact.astro            MOD  one sentence
src/components/visuals/ProjectVisual.astro       MOD  slug overrides
src/components/visuals/RetrievalVisual.astro     NEW
src/components/visuals/DocumentGroundedVisual.astro NEW
src/components/visuals/DetectionGlareVisual.astro   NEW
src/components/hero/InferencePipeline.tsx        MOD  stage labels + aria-label
```

---

### Task 0: Branch and commit the spec

- [ ] **Step 1: Branch from `main`**

```bash
git checkout main
git pull --ff-only
git checkout -b plan-5-depth
```

- [ ] **Step 2: Point the product spec at this plan**

In `docs/portfolio-revamp.md`, the Plan 5 line currently says the implementation plan is not written yet. Change it to:

```markdown
6. **Plan 5 — Depth & positioning** ([design](2026-10-20-depth-and-positioning.md), [plan](plans/2026-10-20-plan-5-depth-and-positioning.md)): rewrite the live site so it is not a resume clone and not OCR-first. Three flagship case studies from the 2026-10-20 interview, rebalanced metrics, Work no longer duplicates Projects.
```

In `docs/2026-10-20-depth-and-positioning.md`, change the status line to:

```markdown
Status: approved 2026-10-20 (implementation: `docs/plans/2026-10-20-plan-5-depth-and-positioning.md`)
```

- [ ] **Step 3: Commit**

```bash
git add docs/2026-10-20-depth-and-positioning.md docs/plans/2026-10-20-plan-5-depth-and-positioning.md docs/portfolio-revamp.md
git commit -m "docs: add plan 5 (depth and positioning)"
```

---

### Task 1: Content model, copy, About, Work

**Files:**
- Modify: `src/content/types.ts` (replace the Experience, Project, and Profile `summary` fields as below)
- Modify: `src/content/profile.ts` (full file below)
- Modify: `src/components/sections/About.astro`
- Modify: `src/components/sections/Experience.astro`
- Modify: `src/lib/og-image.ts` (headline `fontSize` 60 → 44)

**Interfaces:**
- Consumes: existing `Profile` shape
- Produces: `summary: string[]`; `ExperienceHighlight`; `Project.featured?`, `problem?`, `decision?`, `result?`

- [ ] **Step 1: Replace the Experience / Project / Profile summary types** in `src/content/types.ts`

Keep every other type in that file. Replace only these three:

```ts
export type ExperienceHighlight = string | { text: string; href: string };

export interface Experience {
  role: string;
  company: string;
  location?: string;
  start: string;
  /** `null` means the role is current. */
  end: string | null;
  /** Model-card framing label shown above the role, e.g. "production". */
  stage: string;
  highlights: ExperienceHighlight[];
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
  featured?: boolean;
  problem?: string;
  decision?: string;
  result?: string;
}
```

And in `Profile`, change `summary: string;` to `summary: string[];`.

- [ ] **Step 2: Replace `src/content/profile.ts`** with this file (cvUrl, education, skills, Kifayti, Woodesy, archive, achievements stay as they are today):

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
  headline:
    'I make vision and language models survive production: tight GPUs, messy lighting, and numbers that cannot be invented.',
  summary: [
    'I\'m an AI/ML engineer at Atomic Loops in Pune. I take vision and language models and make them hold up under the constraints that show up after the demo: a 10 GB GPU, a production line that does not look like the training set, and outputs that a downstream system has to trust.',
    'The thing I keep learning is that the native approach often works in a notebook and fails in production. When it does, I go back into how the model actually represents the data — CLS versus patches, raw OCR versus a VLM guessing numbers — and change the pipeline, not just the prompt.',
  ],
  location: 'Pune, Maharashtra, India',
  status: 'Software Engineer (AI/ML) at Atomic Loops, Pune',
  email: 'jaysunilpatel2002@gmail.com',
  cvUrl: 'https://drive.google.com/file/d/1kkeV_QpuJybhdM27z8ZqLrQCfuqkcjmH/view?usp=sharing',
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
    grade: 'CGPA 7.57',
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
        {
          text: 'Built a two-stage retrieval pipeline for near-identical industrial tools, after CLS embeddings kept returning two almost-tied matches.',
          href: '#project-fine-grained-retrieval',
        },
        {
          text: 'Grounded a 7B VLM in cleaned OCR text and a JSON schema so it would stop inventing numbers, and ran it in 4-bit on a 10 GB GPU.',
          href: '#project-document-intelligence',
        },
        {
          text: 'Trained a tool detector on ideal images, then iterated augmentations until it survived glare, shadows, and camera distance on the line.',
          href: '#project-tool-detection',
        },
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
      label: 'parameter VLM running locally on a 10 GB GPU',
      source: 'Document Intelligence Pipeline',
    },
    {
      value: '~90%',
      label: 'close matches resolved without review after a patch-level rerank',
      source: 'Fine-Grained Image Similarity Search',
    },
    {
      value: '10–15 s',
      label: 'to turn one document into structured JSON',
      source: 'Document Intelligence Pipeline',
    },
    {
      value: '94%+',
      label: 'accuracy in QR code forgery detection',
      source: 'QR Code Counterfeit Detection',
    },
  ],
  projects: [
    {
      slug: 'fine-grained-retrieval',
      title: 'Fine-Grained Image Similarity Search',
      cluster: 'vision',
      origin: 'Atomic Loops',
      featured: true,
      summary: 'A small catalog of near-identical industrial tools, where a global embedding was not enough.',
      problem:
        'About 10–12 classes, 10–15 images each. A CLS-token embedding retrieved a top-5 where the top two scores sat 0.1–0.2 apart. That margin kept tripping a “needs review” threshold.',
      decision:
        'A CLS token is a global summary of the image. Patch embeddings keep local structure — component count, shape, spatial layout. Keep CLS for candidate retrieval. When the margin is that tight, rerank by comparing the query’s patch embedding against two or three exemplars from each of the top-2 classes.',
      result:
        'About 5–10% of queries still need review. The rest resolve without it.',
      highlights: [],
      stack: ['DINOv2', 'Patch-level embeddings', 'Python'],
      links: [],
    },
    {
      slug: 'document-intelligence',
      title: 'Document Intelligence Pipeline',
      cluster: 'document-ai',
      origin: 'Atomic Loops',
      featured: true,
      summary: 'A 7B VLM that is not allowed to invent the numbers on an invoice.',
      problem:
        'Prompting the VLM on the image alone, even with strict instructions, it invented values — especially numbers.',
      decision:
        'Run PaddleOCR, clean the raw text, and pass that to Qwen2.5-VL with a prompt and a JSON schema for the response. Token cost went up; brought it back with image downscaling and compact JSON. The unquantized model is about 16 GB and would not load on the 10 GB GPU, so 4-bit quantization (BitsAndBytes) brings it to about 6 GB resident. There is no quality comparison to the original weights: they never ran.',
      result:
        'Usable, schema-shaped output in about 90% of cases. One document takes 10–15 seconds.',
      highlights: [],
      stack: ['PaddleOCR', 'Qwen2.5-VL 7B', 'Transformers', 'BitsAndBytes', 'Python'],
      links: [],
    },
    {
      slug: 'tool-detection',
      title: 'Tool Detection & Counting',
      cluster: 'vision',
      origin: 'Atomic Loops',
      featured: true,
      summary: 'A detector that was accurate in the training photos and blind under the lights on the line.',
      problem:
        'Training images were well-lit and clean. On the line, overhead glare deleted objects, a cover threw shadows, and camera distance changed how the tools looked.',
      decision:
        'Iterate: new augmentations and new datasets until those failure modes shrank.',
      result:
        '5–10 seconds to process the frames that actually arrive (not five frames per second). Counting holds up under the lighting we ship with.',
      highlights: [],
      stack: ['YOLO', 'Python'],
      links: [],
    },
    {
      slug: 'agentic-pipelines',
      title: 'Agentic AI Pipelines',
      cluster: 'llm-agents',
      origin: 'Atomic Loops',
      summary: 'A sequential LLM pipeline whose outputs are checked before they are trusted.',
      highlights: [
        'A class or domain becomes a dynamic prompt, sent to the OpenAI API. The JSON response is validated through stacked Pydantic models, then passed through sequential tools — web search, URL checks, language and grammar, and math checks on any numbers — and merged at the end.',
        'If a block fails it retries three times, then flags the run.',
      ],
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

- [ ] **Step 3: Update `About.astro`** so the summary is two paragraphs. Replace the single `<p>` with:

```astro
<div class="space-y-4">
  {profile.summary.map((paragraph) => (
    <p class="text-lg leading-relaxed">{paragraph}</p>
  ))}
</div>
```

- [ ] **Step 4: Update `Experience.astro`** so a highlight may be a link. Replace the highlights `<ul>` inner map with:

```astro
<ul class="mt-5 max-w-3xl list-disc space-y-2 pl-5 leading-relaxed text-muted marker:text-accent">
  {job.highlights.map((highlight) =>
    typeof highlight === 'string' ? (
      <li>{highlight}</li>
    ) : (
      <li>
        <a href={highlight.href} class="underline-offset-4 hover:text-fg hover:underline">
          {highlight.text}
        </a>
      </li>
    ),
  )}
</ul>
```

- [ ] **Step 5: In `src/lib/og-image.ts`**, change the headline style `fontSize: 60` to `fontSize: 44` so the longer headline still fits the 1200×630 frame.

- [ ] **Step 6: Check and commit**

```bash
npm run check
```

Expected: `Result (32 files): - 0 errors - 0 warnings - 0 hints`.

```bash
git add src/content/types.ts src/content/profile.ts src/components/sections/About.astro src/components/sections/Experience.astro src/lib/og-image.ts
git commit -m "feat: rewrite headline, about, metrics and work around three case studies"
```

---

### Task 2: Flagship project layout

**Files:**
- Modify: `src/components/sections/Projects.astro` (replace the card `<li>` as below; keep the filter script)

**Interfaces:**
- Consumes: `Project.featured`, `problem`, `decision`, `result`
- Produces: full-width flagships, compact remainder; filters still use `[data-project-list] > [data-cluster]`

- [ ] **Step 1: Keep a single `<ul data-project-list class="grid gap-8 md:grid-cols-2">`.** Do not split into two lists (the filter script would miss one of them). Replace the `<li>` with:

```astro
{
  profile.projects.map((project) => (
    <li
      id={`project-${project.slug}`}
      data-cluster={project.cluster}
      data-detect-label="case_study"
      data-detect-score={detectionScore(project.slug)}
      class:list={[
        'detect flex min-w-0 flex-col rounded-md border border-line bg-surface p-6 [overflow-wrap:anywhere] sm:p-8',
        project.featured && 'md:col-span-2',
      ]}
    >
      <ProjectVisual cluster={project.cluster} seed={project.slug} />
      <p class="mt-6 font-mono text-xs uppercase tracking-wider text-muted">
        <span class="text-accent">{clusterLabels[project.cluster]}</span> · {project.origin}
      </p>
      <h3 class="mt-3 text-xl font-semibold sm:text-2xl">{project.title}</h3>
      <p class="mt-3 leading-relaxed text-muted">{project.summary}</p>
      {project.featured && project.problem && project.decision && project.result ? (
        <dl class="mt-6 grid gap-5 sm:grid-cols-3">
          <div>
            <dt class="font-mono text-xs uppercase tracking-wider text-accent">Problem</dt>
            <dd class="mt-2 text-sm leading-relaxed text-muted">{project.problem}</dd>
          </div>
          <div>
            <dt class="font-mono text-xs uppercase tracking-wider text-accent">Decision</dt>
            <dd class="mt-2 text-sm leading-relaxed text-muted">{project.decision}</dd>
          </div>
          <div>
            <dt class="font-mono text-xs uppercase tracking-wider text-accent">Result</dt>
            <dd class="mt-2 text-sm leading-relaxed text-muted">{project.result}</dd>
          </div>
        </dl>
      ) : (
        <ul class="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted marker:text-accent">
          {project.highlights.map((highlight) => (
            <li>{highlight}</li>
          ))}
        </ul>
      )}
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
```

- [ ] **Step 2: Check and commit**

```bash
npm run check
```

Expected: 0 errors.

```bash
git add src/components/sections/Projects.astro
git commit -m "feat: render flagship projects as problem-decision-result case studies"
```

---

### Task 3: Synthetic flagship visuals

**Files:**
- Create: `src/components/visuals/RetrievalVisual.astro`
- Create: `src/components/visuals/DocumentGroundedVisual.astro`
- Create: `src/components/visuals/DetectionGlareVisual.astro`
- Modify: `src/components/visuals/ProjectVisual.astro`

**Interfaces:**
- Consumes: `seed: string` (the project slug)
- Produces: slug-specific SVG for the three flagships; cluster fallback otherwise

- [ ] **Step 1: Create `src/components/visuals/RetrievalVisual.astro`**

```astro
---
interface Props {
  seed: string;
}

const { seed: _seed } = Astro.props;
const patches = [0, 1, 2, 3, 4, 5, 6, 7, 8];
---

<svg viewBox="0 0 320 180" class="block h-auto w-full">
  <text x="16" y="18" font-size="9" class="fill-muted font-mono">query</text>
  <circle cx="40" cy="56" r="10" class="fill-none stroke-muted" stroke-width="2.5"></circle>
  <rect x="36" y="64" width="8" height="36" rx="2" class="fill-muted/50"></rect>

  <text x="96" y="18" font-size="9" class="fill-muted font-mono">CLS top-2</text>
  <rect x="96" y="28" width="200" height="10" class="fill-line"></rect>
  <rect x="96" y="28" width="168" height="10" class="fill-accent/80"></rect>
  <text x="300" y="37" font-size="9" class="fill-muted font-mono" text-anchor="end">0.84</text>
  <rect x="96" y="44" width="200" height="10" class="fill-line"></rect>
  <rect x="96" y="44" width="160" height="10" class="fill-muted/70"></rect>
  <text x="300" y="53" font-size="9" class="fill-muted font-mono" text-anchor="end">0.83</text>

  <text x="16" y="122" font-size="9" class="fill-muted font-mono">patch rerank</text>
  {
    patches.map((index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const lit = index === 1 || index === 4 || index === 5;
      return (
        <rect
          x={96 + col * 22}
          y={110 + row * 18}
          width="18"
          height="14"
          class={lit ? 'fill-accent/70 stroke-accent' : 'fill-surface stroke-line'}
        />
      );
    })
  }
  {
    patches.map((index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const lit = index === 1 || index === 2 || index === 4;
      return (
        <rect
          x={178 + col * 22}
          y={110 + row * 18}
          width="18"
          height="14"
          class={lit ? 'fill-accent/40 stroke-accent' : 'fill-surface stroke-line'}
        />
      );
    })
  }
  <text x="96" y="172" font-size="8" class="fill-muted font-mono">query patches</text>
  <text x="178" y="172" font-size="8" class="fill-muted font-mono">class exemplars</text>
</svg>
```

- [ ] **Step 2: Create `src/components/visuals/DocumentGroundedVisual.astro`**

```astro
---
interface Props {
  seed: string;
}

const { seed: _seed } = Astro.props;
---

<svg viewBox="0 0 320 180" class="block h-auto w-full">
  <rect x="16" y="16" width="128" height="148" rx="3" class="fill-surface stroke-line"></rect>
  <text x="28" y="36" font-size="9" class="fill-muted font-mono">Northridge Tooling</text>
  <text x="28" y="50" font-size="8" class="fill-muted font-mono">INV-1042</text>
  <rect x="28" y="62" width="72" height="5" class="fill-muted/40"></rect>
  <rect x="28" y="74" width="96" height="5" class="fill-muted/40"></rect>
  <rect x="24" y="88" width="88" height="14" class="fill-none stroke-accent"></rect>
  <text x="28" y="98" font-size="8" class="fill-accent font-mono">total 1,840.00</text>
  <rect x="28" y="112" width="80" height="5" class="fill-muted/40"></rect>
  <rect x="28" y="124" width="60" height="5" class="fill-muted/40"></rect>

  <path d="M152 90 h20 m-6 -5 l6 5 l-6 5" class="fill-none stroke-muted" stroke-width="1.5"></path>

  <g font-size="9" class="font-mono">
    <text x="184" y="44" class="fill-muted">{'{'}</text>
    <text x="192" y="62" class="fill-muted">"vendor": "Northridge",</text>
    <text x="192" y="80" class="fill-accent">"total": "1840.00"</text>
    <text x="184" y="98" class="fill-muted">{'}'}</text>
  </g>
  <rect x="192" y="110" width="64" height="12" class="fill-accent"></rect>
  <text x="196" y="119" font-size="8" class="fill-accent-fg font-mono">from OCR</text>
  <text x="184" y="148" font-size="8" class="fill-muted font-mono">not invented by the VLM</text>
</svg>
```

- [ ] **Step 3: Create `src/components/visuals/DetectionGlareVisual.astro`**

```astro
---
interface Props {
  seed: string;
}

const { seed: _seed } = Astro.props;
---

<svg viewBox="0 0 320 180" class="block h-auto w-full">
  <text x="16" y="18" font-size="9" class="fill-muted font-mono">train</text>
  <rect x="16" y="28" width="136" height="136" rx="3" class="fill-surface stroke-line"></rect>
  <circle cx="48" cy="70" r="8" class="fill-none stroke-muted" stroke-width="2"></circle>
  <rect x="44" y="76" width="8" height="28" class="fill-muted/50"></rect>
  <rect x="36" y="52" width="24" height="60" class="fill-none stroke-accent"></rect>
  <circle cx="88" cy="70" r="8" class="fill-none stroke-muted" stroke-width="2"></circle>
  <rect x="84" y="76" width="8" height="28" class="fill-muted/50"></rect>
  <rect x="76" y="52" width="24" height="60" class="fill-none stroke-accent"></rect>
  <circle cx="128" cy="70" r="8" class="fill-none stroke-muted" stroke-width="2"></circle>
  <rect x="124" y="76" width="8" height="28" class="fill-muted/50"></rect>
  <rect x="116" y="52" width="24" height="60" class="fill-none stroke-accent"></rect>
  <text x="24" y="150" font-size="8" class="fill-muted font-mono">count 3</text>

  <text x="168" y="18" font-size="9" class="fill-muted font-mono">on the line</text>
  <rect x="168" y="28" width="136" height="136" rx="3" class="fill-surface stroke-line"></rect>
  <circle cx="200" cy="70" r="8" class="fill-none stroke-muted" stroke-width="2"></circle>
  <rect x="196" y="76" width="8" height="28" class="fill-muted/50"></rect>
  <rect x="188" y="52" width="24" height="60" class="fill-none stroke-accent"></rect>
  <ellipse cx="240" cy="64" rx="22" ry="16" class="fill-accent/30 stroke-accent"></ellipse>
  <circle cx="240" cy="70" r="8" class="fill-none stroke-muted/40" stroke-width="2"></circle>
  <rect x="236" y="76" width="8" height="28" class="fill-muted/30"></rect>
  <rect
    x="228"
    y="52"
    width="24"
    height="60"
    class="fill-none stroke-accent"
    stroke-dasharray="3 3"
  ></rect>
  <circle cx="280" cy="70" r="8" class="fill-none stroke-muted" stroke-width="2"></circle>
  <rect x="276" y="76" width="8" height="28" class="fill-muted/50"></rect>
  <rect x="268" y="52" width="24" height="60" class="fill-none stroke-accent"></rect>
  <text x="176" y="150" font-size="8" class="fill-muted font-mono">glare miss → augment</text>
</svg>
```

- [ ] **Step 4: Replace `src/components/visuals/ProjectVisual.astro`**

```astro
---
import type { ProjectCluster } from '../../content/types';
import AgentsVisual from './AgentsVisual.astro';
import DetectionGlareVisual from './DetectionGlareVisual.astro';
import DocumentGroundedVisual from './DocumentGroundedVisual.astro';
import DocumentVisual from './DocumentVisual.astro';
import RetrievalVisual from './RetrievalVisual.astro';
import SystemsVisual from './SystemsVisual.astro';
import VisionVisual from './VisionVisual.astro';

interface Props {
  cluster: ProjectCluster;
  seed: string;
}

const { cluster, seed } = Astro.props;

const visualsBySlug: Record<string, typeof RetrievalVisual> = {
  'fine-grained-retrieval': RetrievalVisual,
  'document-intelligence': DocumentGroundedVisual,
  'tool-detection': DetectionGlareVisual,
};

const visualsByCluster = {
  vision: VisionVisual,
  'document-ai': DocumentVisual,
  'llm-agents': AgentsVisual,
  systems: SystemsVisual,
} satisfies Record<ProjectCluster, typeof VisionVisual>;

const Visual = visualsBySlug[seed] ?? visualsByCluster[cluster];
---

<div aria-hidden="true" class="overflow-hidden rounded border border-line bg-bg">
  <Visual seed={seed} />
</div>
```

If `astro check` complains that the Astro component types are not assignable to each other, drop the `Record<string, typeof RetrievalVisual>` annotation and use a switch:

```ts
const Visual =
  seed === 'fine-grained-retrieval'
    ? RetrievalVisual
    : seed === 'document-intelligence'
      ? DocumentGroundedVisual
      : seed === 'tool-detection'
        ? DetectionGlareVisual
        : visualsByCluster[cluster];
```

- [ ] **Step 5: Check and commit**

```bash
npm run check
```

Expected: 0 errors. Do not weaken types with `any`.

```bash
git add src/components/visuals
git commit -m "feat: add synthetic diagrams for the three flagship case studies"
```

---

### Task 4: Hero labels and contact line

**Files:**
- Modify: `src/components/hero/InferencePipeline.tsx` (two edits)
- Modify: `src/components/sections/Contact.astro` (one sentence)

- [ ] **Step 1: In `InferencePipeline.tsx`**, replace the `STAGES` labels:

```ts
const STAGES = [
  { label: 'ingest', start: 0 },
  { label: 'extract', start: OCR_START },
  { label: 'ground', start: EXTRACT_START },
  { label: 'render', start: RENDER_START },
];
```

Replace the figure `aria-label` with:

```ts
aria-label="Animated illustration: a scanned page is ingested, extracted, grounded against source text, and rendered as structured JSON."
```

Do not change timings, JSON fields, skip/replay, or motion.

- [ ] **Step 2: In `Contact.astro`**, replace

`Happy to talk about computer vision, document AI and inference work.`

with

`Happy to talk about computer vision, language models, and getting them to hold up in production.`

- [ ] **Step 3: Check and commit**

```bash
npm run check
```

Expected: 0 errors.

```bash
git add src/components/hero/InferencePipeline.tsx src/components/sections/Contact.astro
git commit -m "feat: relabel the hero pipeline and broaden the contact line"
```

---

### Task 5: Whole-branch review

- [ ] **Step 1: Review** `git diff main -- . ':!package-lock.json'` against the spec `docs/2026-10-20-depth-and-positioning.md`.

Confirm:
- Headline, About, four metrics, three flagships, agents compact copy, Work links, hero labels, contact line match the spec.
- No phone number. No “real-time” on the detection title. No ~6 GB in the impact strip (it belongs in the document case study). No 60% in the impact strip.
- “OCR” is not the first technical word in the hero (headline is vision/language; stages are ingest/extract/ground/render).
- Filters still show all eight projects. Featured cards span two columns at `md`.
- Light and dark themes both color the new SVGs (theme classes only).

- [ ] **Step 2:** If there are real issues, fix them and commit once:

```bash
git commit -m "fix: address plan 5 review findings"
```

If there are none, do not make an empty commit.

- [ ] **Step 3 (👤):** Ask the owner to approve `npm run build` (og.png will regenerate with the new headline). Then ask before merging `plan-5-depth` into `main`, and again before `firebase deploy --only hosting`.
