# Plan 5 design — Depth and positioning

Date: 2026-10-20
Status: approved 2026-10-20 (implementation: `docs/plans/2026-10-20-plan-5-depth-and-positioning.md`)

This is the product spec for the next content pass. It does not replace `docs/portfolio-revamp.md`; it extends it. Implementation goes in a later plan under `docs/plans/`.

## Problem

The live site is a well-designed rendering of the resume. Work and Projects say the same Atomic Loops bullets twice. The first impression is document/OCR-heavy (headline ends on “real documents”, two of four impact numbers, first project card). Recruiters cannot tell Jay is an applied AI engineer who also does retrieval, detection, agents, and inference systems.

## Goal

A visitor who only reads the hero, the four metrics, and the first case study should leave thinking: **this person ships vision and language models under production constraints** — not “this person does OCR.”

## Locked decisions

- **Positioning:** applied AI engineer. Breadth across vision, language, and systems. Documents are one application, not the identity.
- **Depth:** interview-driven case studies. Owner answers from 2026-10-20 are the source of truth for new facts. The resume remains the source of truth for titles, dates, and the ~6 GB figure.
- **Visuals:** synthetic diagrams only. No client screenshots, no real invoices, no production-line photos.
- **GPU memory:** keep **~6 GB** on the site to match the resume. The interview (7 GB loaded) is not used.
- **Retrieval number:** after the patch rerank, about **5–10% of queries still need review** (~90% resolve without it). Use **~90%** on the impact strip so the big number is the win; put the remaining 5–10% in the case study body.
- **Page structure:** three flagship case studies, then a compact grid. Work stops duplicating Projects.
- **Hero motion:** keep the Plan 3 island. Relabel stages only. Do not rebuild it.

## What we will not claim

- Large-scale retrieval. The catalog is **10–12 classes, 10–15 images each**.
- A quality comparison of 4-bit vs the unquantized VLM. The unquantized model **never ran** (~16 GB vs a 10 GB GPU).
- Real-time 5 fps / 30 fps detection. Processing takes **5–10 seconds** for the frames that actually arrive.
- Any number that was not in the resume or the 2026-10-20 interview.
- Client names, real documents, phone number.

## Above the fold

### Headline (replaces the current one)

> I make vision and language models survive production: tight GPUs, messy lighting, and numbers that cannot be invented.

Role line stays `Jay Patel · AI/ML Engineer`. Status line stays `Software Engineer (AI/ML) at Atomic Loops, Pune`.

### About (replaces `profile.summary`)

Two short first-person paragraphs, plus the existing facts list (role, currently, based in, education). Skills architecture stays.

> I'm an AI/ML engineer at Atomic Loops in Pune. I take vision and language models and make them hold up under the constraints that show up after the demo: a 10 GB GPU, a production line that does not look like the training set, and outputs that a downstream system has to trust.

> The thing I keep learning is that the native approach often works in a notebook and fails in production. When it does, I go back into how the model actually represents the data — CLS versus patches, raw OCR versus a VLM guessing numbers — and change the pipeline, not just the prompt.

### Impact strip (four numbers, one per capability)

Drop the 60% HR-onboarding figure from the strip. It stays on the onboarding card. Drop the duplicate ~6 GB strip entry; that figure lives in the document case study.

| Value | Label | Source |
| --- | --- | --- |
| `7B` | parameter VLM running locally on a 10 GB GPU | Document Intelligence Pipeline |
| `~90%` | close matches resolved without review after a patch-level rerank | Fine-Grained Image Similarity Search |
| `10–15 s` | to turn one document into structured JSON | Document Intelligence Pipeline |
| `94%+` | accuracy in QR code forgery detection | QR Code Counterfeit Detection |

## Work vs Projects

### Work

Atomic Loops becomes **three short bullets** that point at the flagships. The seven resume bullets are removed so they stop repeating.

1. Built a two-stage retrieval pipeline for near-identical industrial tools, after CLS embeddings kept returning two almost-tied matches. → `#project-fine-grained-retrieval`
2. Grounded a 7B VLM in cleaned OCR text and a JSON schema so it would stop inventing numbers, and ran it in 4-bit on a 10 GB GPU. → `#project-document-intelligence`
3. Trained a tool detector on ideal images, then iterated augmentations until it survived glare, shadows, and camera distance on the line. → `#project-tool-detection`

Kifayti and Woodesy copy stays as it is (short, not duplicated elsewhere). Education stays, CGPA 7.57.

The Work component should render those Atomic Loops bullets as links to the project anchors.

### Projects

**Flagships first, in this order**, each full width, with Problem / Decision / Result:

1. Fine-Grained Image Similarity Search (`fine-grained-retrieval`, vision)
2. Document Intelligence Pipeline (`document-intelligence`, document-ai)
3. Tool Detection & Counting (`tool-detection`, vision) — drop “Real-Time” from the title

**Then a compact two-column grid**, existing card style:

4. Agentic AI Pipelines (rewritten compact copy below)
5. Batched Image Inference Service (copy stays)
6. Multi-Modal Emotion Recognition (copy stays)
7. QR Code Counterfeit Detection (copy stays)
8. AI-Powered Onboarding Automation (copy stays, including the 60% figure)

Filter tabs stay. Cluster names stay (`Vision`, `Document AI`, `LLM / Agents`, `Systems`). Document AI is a filter, not the lead.

## Flagship copy

### 1. Fine-Grained Image Similarity Search

**Summary:** A small catalog of near-identical industrial tools, where a global embedding was not enough.

- **Problem.** About 10–12 classes, 10–15 images each. A CLS-token embedding retrieved a top-5 where the top two scores sat 0.1–0.2 apart. That margin kept tripping a “needs review” threshold.
- **Decision.** A CLS token is a global summary of the image. Patch embeddings keep local structure — component count, shape, spatial layout. Keep CLS for candidate retrieval. When the margin is that tight, rerank by comparing the query’s patch embedding against two or three exemplars from each of the top-2 classes.
- **Result.** About 5–10% of queries still need review. The rest resolve without it.

Stack stays: DINOv2, patch-level embeddings, Python. No links.

### 2. Document Intelligence Pipeline

**Summary:** A 7B VLM that is not allowed to invent the numbers on an invoice.

- **Problem.** Prompting the VLM on the image alone, even with strict instructions, it invented values — especially numbers.
- **Decision.** Run PaddleOCR, clean the raw text, and pass that to Qwen2.5-VL with a prompt and a JSON schema for the response. Token cost went up; brought it back with image downscaling and compact JSON. The unquantized model is about 16 GB and would not load on the 10 GB GPU, so 4-bit quantization (BitsAndBytes) brings it to about 6 GB resident. There is no quality comparison to the original weights: they never ran.
- **Result.** Usable, schema-shaped output in about 90% of cases. One document takes 10–15 seconds.

Stack stays. No links.

### 3. Tool Detection & Counting

**Summary:** A detector that was accurate in the training photos and blind under the lights on the line.

- **Problem.** Training images were well-lit and clean. On the line, overhead glare deleted objects, a cover threw shadows, and camera distance changed how the tools looked.
- **Decision.** Iterate: new augmentations and new datasets until those failure modes shrank.
- **Result.** 5–10 seconds to process the frames that actually arrive (not five frames per second). Counting holds up under the lighting we ship with.

Stack stays: YOLO, Python. No links.

### Agents (compact card, not a flagship)

**Summary:** A sequential LLM pipeline whose outputs are checked before they are trusted.

**Highlights:**

- A class or domain becomes a dynamic prompt, sent to the OpenAI API. The JSON response is validated through stacked Pydantic models, then passed through sequential tools — web search, URL checks, language and grammar, and math checks on any numbers — and merged at the end.
- If a block fails it retries three times, then flags the run.

Stack stays: LLMs, Pydantic-AI, Python.

## Visuals

`ProjectVisual` gains a per-slug override for the three flagships. Other projects keep the existing cluster SVGs.

1. **Retrieval.** A row of near-identical tool silhouettes. Two CLS scores almost tied (e.g. 0.84 / 0.83). A second row lights a few patches on the query and on exemplars from the two classes.
2. **Document.** A fake invoice (invented vendor, invented totals — never a real client doc) with OCR-style boxes, next to a JSON snippet where one numeric field is tagged as coming from OCR, not the VLM.
3. **Detection.** A tray of tools. A glare blob sits on one object (missed). A second frame, after augmentation, draws a detection box on it.

All three use theme CSS variables only (no hardcoded hex), work in light and dark, and are `aria-hidden` like the current visuals. Seeds stay so they don’t reshuffle.

### Hero island labels only

In `src/components/hero/InferencePipeline.tsx`, rename stages:

- `preprocess` → `ingest`
- `ocr` → `extract`
- `extract` → `ground`
- `render` → `render`

Update the island `aria-label` so it no longer says the panel is an OCR demo. Motion, timing, JSON fields, and skip/replay stay.

## Other copy

Contact intro, replace:

> Happy to talk about computer vision, document AI and inference work.

with:

> Happy to talk about computer vision, language models, and getting them to hold up in production.

OG image already reads `profile.headline`; it will pick up the new headline on the next build. No separate OG redesign.

## Content model

Extend `Project` with optional case-study fields. Existing compact projects omit them.

```ts
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

Extend `Experience` so a highlight can point at a project:

```ts
export type ExperienceHighlight = string | { text: string; href: string };

export interface Experience {
  // ...existing fields
  highlights: ExperienceHighlight[];
}
```

`About.astro` should render `profile.summary` as paragraphs split on `\n\n` (two paragraphs from one string), or `summary` becomes `string[]`. Prefer `summary: string[]` so we don’t invent a markdown dialect.

## Out of scope

- New routes (`/project/[slug]`)
- New npm dependencies
- Rebuilding the hero animation
- Analytics, custom domain, the old Flutter URL / `my-portfolio-ec4b7`
- Automated tests
- Changing Kifayti, Woodesy, archive, or achievements
- Putting a photo or phone number on the site
- Replacing generated visuals for the non-flagship cards

## Success check

A reader who only sees the hero, the four metrics, and flagship 1 should be able to answer: what kind of engineer is this, and what did they actually decide that a resume bullet does not capture? The word “OCR” may appear in the document case study. It must not be the first technical word on the page.
