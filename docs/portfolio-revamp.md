# Portfolio Revamp — Audit & Redesign Proposal

Date: 2026-10-01
Status: Draft — waiting on your answers in "Open Questions" (section 9)

---

## 1. TL;DR

- The current site is a Flutter Web single page (Hero, About, Projects, Achievements, Mini Projects, Contact, Footer) hosted on Firebase.
- It has **several real breaking points**: an uncommitted caching config that will serve a stale site for up to a year, layout overflows (yellow/black "OVERFLOWED" stripes) at tablet widths, short laptop screens and landscape phones, and a contact form that likely reports failure even when the message was delivered.
- The content is ~1.5 years behind your resume: no Atomic Loops, still says "Full Stack Developer & AI Enthusiast", still says "student", Kifayti shown as "Present".
- The proposed redesign concept is **"Jay, as a model"**: the site behaves like one of your own AI pipelines. A document gets OCR'd on screen, turns into structured JSON, and that JSON becomes the site. Sections read like a Hugging Face **model card**, projects live in an **embedding space** you can explore, and YOLO-style **detection boxes** are the recurring visual motif. It is built from your actual work (document intelligence, DINOv2 retrieval, YOLO), so it can't be mistaken for a template.

---

## 2. Audit — Bugs & Breaking Points (current code)

Severity: **Critical** = broken for real users now / after next deploy. **High** = visible breakage at common screen sizes. **Medium** = wrong behavior or fragile. **Low** = polish, hygiene, deprecations.

### 2.1 Critical

| # | Where | Problem |
|---|-------|---------|
| C1 | `firebase.json` (uncommitted change, lines 9–28) | The `/**` rule sets `Cache-Control: public, max-age=31536000, immutable` on **everything**. Flutter's `main.dart.js`, `flutter_bootstrap.js`, `manifest.json`, `version.json` are **not content-hashed**, so after the next deploy, returning visitors keep the old app for up to a year. Worse, a visit to `/` (the root URL) does not match the `/index.html` rule. It is served via the rewrite and gets the 1-year immutable header too. **Do not deploy this config as is.** |
| C2 | `contact_section.dart` 353–361 | Formspree is called with a JSON body but without the `Accept: application/json` header. Formspree's AJAX mode requires that header; without it Formspree answers with a redirect to its "thanks" HTML page, which the browser blocks cross-origin. Likely result: the message is delivered but the user sees an orange error snackbar. Needs confirmation by submitting the live form once. |
| C3 | `contact_section.dart` 7 | Imports `package:http`, which is **not** in `pubspec.yaml`. It only works because `google_fonts` pulls it in transitively. Any dependency upgrade that drops it breaks the build. |
| C4 | `contact_section.dart` 390 | Raw exception text (`Error: ClientException: XMLHttpRequest error...`) is shown to visitors. |

### 2.2 High — layout breakage at common sizes

Breakpoints are `MOBILE ≤450`, `TABLET 451–800`, `DESKTOP 801–1200`, `'4K' 1201–1920`. Almost every widget only checks `isMobile`, so **tablets (451–800px) get the full desktop layout squeezed into half the width.**

| # | Where | Problem |
|---|-------|---------|
| H1 | `projects_section.dart` 44–56, 100–101 | The grid uses a fixed `childAspectRatio` (0.75 / 0.65) **plus** a card vertical margin of 42px / 82px. Cell height is derived from width, content height is not. At 2 columns (451–800px) and 3 columns (801–1200px) the card body has ~50–90px for title, description, tags and buttons, so it **overflows**. This is the most visible breakage on the site. |
| H2 | `hero_section.dart` 23 | Desktop hero is locked to `height: screenHeight` with 80px vertical padding and a non-scrolling `Column`. On short viewports (1366×768 laptops once browser chrome is subtracted, any zoomed-in browser) and **landscape phones** (≥451px wide, ~380px tall → desktop layout), the left column overflows at the bottom. |
| H3 | `hero_section.dart` 260–288 | The desktop button `Row` (Contact Me + Download CV, 32px horizontal padding each) needs ~340px. In the tablet half-column it gets ~200–260px, so it overflows horizontally. |
| H4 | `hero_section.dart` 151–219 | The profile circle is a fixed 400px with 350/290/230px decorative rings. At tablet widths it gets squashed into ~260px: the circle shrinks, the rings get clipped, and the "JP" monogram goes off-center. |
| H5 | `navbar.dart` 104–127 | The desktop nav row needs ~650px (name + 4 padded items + 3×30px gaps + 80px padding). Between ~451 and ~650px it overflows horizontally. |
| H6 | `about_section.dart` 289–318 | The experience meta row (building icon + company + clock icon + duration) has no `Flexible`/`Wrap`. It overflows on narrow phones and in the tablet half-column, and will be worse with "Atomic Loops, Pune". |
| H7 | `contact_section.dart` 256–276 | In the contact info tile, the title/value `Column` isn't wrapped in `Expanded`. The email `jaysunilpatel2002@gmail.com` overflows on 320–375px phones and in the tablet half-column. |
| H8 | `home_screen.dart` 113–151 | The "scroll down" arrow is pinned 40px above the **viewport** bottom. On mobile the hero has no fixed height, so the arrow sits on top of the CTA buttons/social icons and blocks taps. |

### 2.3 Medium — wrong behavior / fragile

| # | Where | Problem |
|---|-------|---------|
| M1 | `home_screen.dart` 41–45 | `setState` runs on **every scroll pixel**, rebuilding the entire page tree. It should only update when `_isScrolled` actually flips. This is a jank source on low-end phones. |
| M2 | `home_screen.dart` 101–112 | The navbar is hidden (`top: -100`) until you scroll 100px, so there is **no navigation at all** on first load, on desktop or mobile. Achievements and Mini Projects aren't in the nav at all. |
| M3 | `home_screen.dart` 123 | The scroll arrow scrolls exactly 100px (just enough to reveal the navbar), not to the next section. |
| M4 | `projects_section.dart` 117–121 | `Image.network` placeholders (`dummyimage.com`, `fakeimg.pl`) have no `errorBuilder`/`loadingBuilder`. Flutter Web (CanvasKit) needs CORS headers on images, so if those hosts don't send them, or go down, you get blank boxes and console errors. They're also placeholders, not real visuals. |
| M5 | `personal_info.dart` + all sections | Content is stored as `Map<String, dynamic>` and read with `as String` / `!`. One missing or misspelled key throws at runtime and the whole section renders as a grey error box in release builds. |
| M6 | `projects_section.dart` 179 | Descriptions are cut at 2 lines with no way to read the rest. Your best content is invisible. |
| M7 | `personal_info.dart` 91–94 | For Emotion Recognition, both the "Code" and "Demo" buttons open the same Google Drive file. |
| M8 | `contact_section.dart` 77, 70 | "Location" opens the generic `maps.google.com`, not Pune. The `tel:` link contains a space (`+91 7558380404`). |
| M9 | `contact_section.dart` 123–197 | On mobile, headings use `textAlign: center` inside a `crossAxisAlignment.start` column. Text width is intrinsic, so headings render **left-aligned** while the icons below are centered. |
| M10 | `contact_section.dart` 435–443 | Email validation only checks for `@`. No `keyboardType`, autofill hints, max length or spam honeypot. Formspree's free tier is 50 submissions/month. |
| M11 | All `_launchUrl` helpers | Silent failure if `canLaunchUrl` returns false. There are 6 copies of the same helper and 3 copies of `_SocialIcon`. |
| M12 | Whole app | **Text can't be selected or copied** (no `SelectionArea`), so recruiters can't copy your email. Links aren't real links: no right-click → open in new tab, no middle-click. |
| M13 | Whole app | Accessibility: clickable `GestureDetector`+`Container` instead of buttons, so there's no keyboard focus/tab order and no semantic labels on icon-only buttons. Some `Colors.grey` subtitles on white fail WCAG AA contrast. |
| M14 | `web/index.html` 21, 32; `manifest.json` | Title is `my_portfolio`, description is "A new Flutter project.", and there are no Open Graph/Twitter tags. Shared links on LinkedIn/WhatsApp show nothing useful, and Flutter Web content is largely invisible to search engines. |
| M15 | `web/index.html` | No loading indicator. Visitors stare at a blank white page while ~2–3 MB of CanvasKit + app JS downloads, which is painful on mobile data. |
| M16 | `main.dart` 30 | Google Fonts are fetched at runtime, which causes a font flash and fails where Google is blocked or offline. |
| M17 | Large screens | No max content width. On 1920px+ monitors paragraphs stretch across half the screen, and widths >1920 fall outside every defined breakpoint. |

### 2.4 Low — hygiene, deprecations, dead weight

- `main.dart` 28, `navbar.dart` 29, `home_screen.dart` 64: `ColorScheme.background` is deprecated (use `surface`).
- `main.dart` 31: passing `CardTheme` to `ThemeData.cardTheme` is deprecated in favor of `CardThemeData` and breaks on newer Flutter.
- `.withOpacity(...)` is used everywhere and is deprecated since Flutter 3.27 (use `.withValues(alpha:)`).
- `FontAwesomeIcons.externalLinkAlt` and `mapMarkerAlt` are legacy aliases that get removed on upgrade.
- `pubspec.yaml`: `provider`, `flutter_svg` and `cupertino_icons` are unused but still shipped. `assets/` bundles two unused screenshots.
- `test/widget_test.dart` is the default counter test and always fails.
- `about_section.dart` 128: dead ternary (`center : center`). Line 98: string concatenation. The About text repeats the Hero bio verbatim.
- `mini_projects_section.dart` 121: leftover `SizedBox(width: 18)` from the commented-out demo button. `'#'` demo URLs.
- `projects_section.dart` 39: unused `LayoutBuilder`. The section heading has no color while every other heading uses primary.
- `.firebase/hosting.*.cache` is tracked in git and should be ignored.
- README is still the Flutter template.
- There is no CI/deploy workflow anymore (it was removed in `488b886`), so deploys are manual.

### 2.5 Content out of date vs. resume

| Field | Site says | Resume says |
|---|---|---|
| Title | Full Stack Developer & AI Enthusiast | AI/ML Engineer |
| Bio | "Computer Science student… Currently Full Stack Developer at Kifayti" | Graduated July 2025; Software Engineer (AI/ML) at Atomic Loops since Aug 2025 |
| Experience | Kifayti (Present), Woodesy | Atomic Loops (missing!), Kifayti ended July 2025, Woodesy not on resume |
| Skills | Flutter, Node, generic ML chips | OpenCV, YOLO, DINOv2, OpenVINO, PaddleOCR, Qwen2.5-VL, ONNX, BitsAndBytes, Pydantic-AI… |
| Projects | Crypto EDA leads; old Flutter apps | Emotion Recognition, QR Counterfeit, Onboarding automation |

Small resume typo I noticed: **"RAVDEES" should be "RAVDESS"**.

---

## 3. Redesign Concept — "Jay, as a model"

### 3.1 Why most portfolios look the same

The template is a big name, "Hi, I'm…", a circle avatar, skill chips, a 3-column card grid, and a contact form. Your current site is exactly that. What makes a portfolio memorable is that **the form itself proves the skill**. A designer's site is a design piece. An AI/ML engineer's site should feel like a **running system**.

### 3.2 Three directions I considered

**A. "Inference Pipeline" (recommended core)**
The hero is a live recreation of your Atomic Loops document-intelligence pipeline:

```
 [ scanned "resume" document ]
        │  preprocessing  (deskew / binarize shimmer)
        ▼
 [ OCR bounding boxes draw over each line, with confidence scores ]
        │  VLM extraction (tokens stream in)
        ▼
 { "name": "Jay Patel", "role": "AI/ML Engineer", ... }   ← JSON types out
        │  render()
        ▼
 the JSON keys morph into the real page headline + nav
```

It takes ~4 seconds, is skippable, and replays on click. It's literally what you build for a living, so it is a portfolio piece and an intro at the same time.

**B. "Model Card" (recommended structure)**
The page is organized like a Hugging Face model card, a format every ML reviewer recognizes instantly:

- **Model details**: who you are, current role, location
- **Intended use**: what kinds of problems to hire you for
- **Architecture**: your stack as a layered diagram (Data → Vision/OCR → VLM/LLM → Inference/Serving → Backend)
- **Training data**: education + experience timeline ("pretraining" = B.Tech, "fine-tuning" = Kifayti, "production" = Atomic Loops)
- **Evaluation**: hard numbers as a metrics table (94%+ QR forgery accuracy, 7B VLM in ~6 GB VRAM, ~60% HR effort reduction, patch-level vs CLS retrieval)
- **Limitations & bias**: a short, honest/witty section (e.g. "Over-indexes on quantization. Known to say 'just one more ablation'.")
- **Citation**: contact info as a BibTeX block with a one-click "copy citation" (= copy email)

**C. "Embedding Space" (recommended for projects)**
Projects, work items and skills are points in a 2D latent space, like a t-SNE plot, clustered into Vision, Document AI, LLM/Agents and Systems/Backend. Hover a point to get a detection-box tooltip. Click it to get a "**find similar**" query (a nod to your DINOv2 retrieval work): the nearest neighbours light up with similarity scores and the case study opens. On mobile it collapses into a filterable list with the same clusters.

Also considered and rejected: a terminal/CLI portfolio (now very common) and a 3D/WebGL scene (heavy, gimmicky, bad on mobile).

**Chosen scope (v1):**

| Piece | Decision | Why |
|---|---|---|
| A. Inference-pipeline hero | **Build** | The strongest differentiator, and it's your real day job. |
| B. Model-card structure | **Build, lightly** | Use the model-card *framing* (small mono labels like `// evaluation`), but keep plain section titles (About, Work, Projects, Contact) so non-ML recruiters are never confused. |
| Detection-box hover/focus motif | **Build** | Cheap, consistent, works on every element, and doubles as the keyboard focus ring. |
| Impact / metrics strip | **Build** | Recruiters scan numbers first. |
| Archive table for older work | **Build** | Keeps the Flutter/full-stack history without diluting the AI/ML story. |
| C. Embedding-space projects explorer | **Deferred to v2** | Fun, but hard to make excellent on mobile. v1 uses project case-study cards with cluster filter tabs (Vision · Document AI · LLM/Agents · Systems), and the data model already carries the `cluster` field so the explorer can be added later without rework. |
| Patch-grid demo | **Deferred to v2** | Nice-to-have; not needed to make the site distinctive. |

**Accent color:** detection orange (`#FF7A1A` on dark, a darker `#B54708` on the light "paper" mode; the originally proposed `#D9580A` measured only ~3.5:1 on paper and failed WCAG AA for body text). It reads as a bounding-box color in both themes, while lime washes out on light backgrounds.

### 3.3 Section-by-section plan

1. **Boot / Hero — "Inference run"**: the pipeline animation from 3.2A ends on a headline like *"I make vision & language models work on real documents and real GPUs."* It has two CTAs (Download CV, Contact) and a status line styled like a log: `● online · Atomic Loops, Pune · open to: AI/ML roles`.
2. **Model Card** (About + Skills + Experience), as in 3.2B. The experience timeline is styled as training stages with "checkpoints".
3. **Evaluation / Impact strip**: 4–5 large metric tiles with the source project under each.
4. **Projects**: case-study cards with cluster filter tabs in v1; the embedding-space explorer (3.2C) comes in v2. Each case study has Problem → Approach → Architecture diagram → Results → Links. Featured: Document Intelligence pipeline (Atomic Loops, described without confidential details), Fine-grained DINOv2 retrieval (patch vs CLS), YOLO tool detection & counting, Multi-modal Emotion Recognition, QR Counterfeit Detection, Onboarding Automation.
5. **Interactive demo (v2, optional)**: drag an image onto a mini "patch grid" visualizer, which splits it into ViT-style 14×14 patches and highlights them. This runs fully client-side with no model download; it only illustrates the idea behind patch-level embeddings.
6. **More work (archive)**: a compact table with Crypto Trade-Sentiment Analysis and Credit Card Scraper, plus an achievements row (Amazon ML Hackathon). Flutter mini projects and certifications are dropped (see section 7).
7. **Contact — "Citation"**: a BibTeX-style block, copy-to-clipboard email, the working form, and socials.
8. **Footer**: tiny "build log" (last updated date, stack, a "replay inference" button).

### 3.4 Visual language

- **Mode**: dark-first "lab instrument" look (near-black `#0B0D0F`, soft grid lines) plus a light "paper/scan" mode that looks like a scanned document. The toggle respects the OS setting.
- **Accent**: one signal color only (proposal: electric lime `#C6FF3D` or detection-orange `#FF7A1A`), used for boxes, highlights and the cursor.
- **Type**: a geometric grotesk for headlines (Space Grotesk / Inter Tight) plus a mono for labels, metrics and JSON (JetBrains Mono / IBM Plex Mono). Fonts are self-hosted, not fetched at runtime.
- **Signature motif — detection boxes**: hovering or focusing any card, project or link draws corner-bracket bounding boxes around it with a label + confidence, e.g. `case_study 0.97`, `contact 0.99`. It's consistent, cheap to render, and unmistakably "CV engineer".
- **Texture**: subtle patch-grid overlays on images, scan-line shimmer during loading, token-streaming text reveals for headings.
- **Restraint**: everything else is calm, with generous whitespace, a max content width of ~1200px and a 12-column grid.

### 3.5 Motion & interaction rules

- Animations trigger **on scroll into view**, not on page load (right now everything animates at first build).
- All motion respects `prefers-reduced-motion`. The hero pipeline becomes a static final frame and nothing is gated behind animation.
- The hero intro is skippable and runs at most once per session (sessionStorage).
- Keyboard support: every interactive element is a real link/button with visible focus (and the detection box doubles as the focus ring).

### 3.6 Responsive rules (fixing the root causes from section 2)

- **No fixed heights** on content sections and **no fixed aspect ratios** on cards that hold text. Cards size to their content.
- Four real layouts: phone (<600), tablet (600–1023), laptop (1024–1439), wide (≥1440, content capped at ~1200px and centered).
- Test matrix: 320×568, 375×667, 390×844, landscape 844×390, 768×1024, 1024×768, 1366×768, 1440×900, 1920×1080, 2560×1440, plus 200% browser zoom.
- The navigation is always visible (compact top bar on mobile, slim sticky bar on desktop) with active-section highlighting and a URL hash per section (`/#projects`) so links can be shared.
- Long strings (email, company names, tech tags) always wrap or ellipsize safely.

---

## 4. Tech Stack Decision (needs your call)

The single biggest decision is **whether to stay on Flutter Web**.

| | Stay on Flutter Web | Rebuild with Astro (or Next.js static) + React islands |
|---|---|---|
| First load | ~2–3 MB, blank screen until loaded | ~100–300 KB, instant HTML |
| SEO / link previews | Weak (canvas rendering) | Excellent (real HTML, OG tags) |
| Text selection, real links, a11y | Needs extra work, never quite native | Native |
| Fancy motion (pipeline, embeddings) | Possible (CustomPainter) | Easier (SVG/Canvas + Framer Motion/GSAP) |
| Showcases | Flutter (your old focus) | Web fundamentals; content is the showcase |
| Hosting | Firebase (same) | Firebase (same), or Vercel/Netlify/GitHub Pages |
| Effort | Mostly rewrite anyway (new design) | Full rewrite |

**My recommendation: Astro + TypeScript + Tailwind, with React islands only for the interactive parts (hero pipeline, embedding space).** Your audience is now ML recruiters and hiring managers who open the link once, often on mobile, often from LinkedIn. Fast first paint, link previews and searchability matter more than showing Flutter skills, which your profile no longer leads with. Since the redesign is a near-total rewrite either way, the migration cost is about the same.

If you prefer to stay on Flutter, everything in section 3 is still doable. I'd then fix every item in section 2, move content into typed models, and add a proper HTML loading screen + meta tags.

---

## 4.1 Repository Layout (decided)

The rebuild is a **separate project in a sibling folder with its own git repo**. The Flutter project is not touched beyond the Phase 0 fixes.

```
C:\Users\jaysu\Desktop\ME\Jay-Portfolio\
├── my_portfolio\     ← current Flutter site (repo: jayPatel029/portfolio_flutter). Stays live until cutover, then kept for rollback/archive.
└── portfolio_astro\  ← Astro rebuild, own `git init` (branch `main`), own GitHub repo (created by you when ready to push)
```

- This doc and `resume.txt` are copied into the new repo's `docs/` so the new project is self-contained.
- **Separate Firebase project** (changed 2026-10-02): the new site is hosted in its own project `jaypatel-dev-f91cb` at `https://jaypatel-dev-f91cb.web.app`. The old Flutter site stays live, unchanged, on `my-portfolio-ec4b7`. Launch = deploying the new project and updating links (LinkedIn, GitHub, CV). What happens to the old URL (keep, redirect or take down) is decided later; see Plan 4's appendix.
- Nothing is deployed from the new repo until you approve it.

## 5. Content Architecture

All content lives in **one typed data file** (`content/profile.ts` or `.json` with a schema), validated at build time so a typo fails the build instead of breaking the live site. It covers profile, experience, projects (with `cluster`, `metrics`, `links`, `confidential: boolean`), skills (grouped by architecture layer), achievements and archive. Updating the site later = editing one file.

---

## 6. Non-functional Requirements

- **Performance**: Lighthouse ≥ 95 on mobile for Performance, Accessibility, Best Practices and SEO. LCP < 2.0s on 4G. The hero animation adds < 50 KB.
- **Accessibility**: WCAG 2.2 AA contrast, full keyboard navigation, alt text, reduced-motion support.
- **SEO/sharing**: real `<title>`, description, Open Graph/Twitter cards with a custom share image, `sitemap.xml`, JSON-LD `Person` schema.
- **Reliability**: contact form with proper headers, a honeypot field, clear success/error states (no raw exceptions), and a fallback "email me directly" link.
- **Caching**: hashed assets cached for 1 year; HTML, manifest and service-worker-type files set to `no-cache` (fixes C1 properly).
- **Analytics (optional)**: privacy-friendly and cookie-less (e.g. Cloudflare Web Analytics / Plausible) if you want to know whether recruiters open your CV.

---

## 7. Content Inputs (answered 2026-10-01)

1. **CV**: new link: `https://drive.google.com/file/d/1TQmPepxVTBuhk_NqN-l3z4cDxqezJOUc/view?usp=sharing`. The Drive file must stay shared as "Anyone with the link → Viewer", or recruiters will hit a Google sign-in page.
2. **Project visuals**: pending; you're checking what you have. Until then, each project gets a generated visual instead of a screenshot, drawn in the site's own style: OCR boxes over a mock document, a retrieval result grid, detection boxes over tool silhouettes, a confusion-matrix tile and so on. No placeholder-image services.
3. **Atomic Loops**: show exactly what the resume says (company name, role, dates, the 7 bullets, the ~6 GB / 10 GB GPU numbers). No screenshots, client names or sample documents. Any invoice/document shown in the hero animation is fictional.
4. **Links**: keep as they are (including the Drive link for Emotion Recognition).
5. **Photo / domain / phone**: no photo (typographic identity, "JP" monogram), stay on the Firebase URL (canonical/OG URLs come from one config value so a domain can be added later), and **no phone number anywhere** on the site, in meta tags or in structured data. Email + LinkedIn + GitHub only.
6. **Old content**:
   - **Keep** Woodesy as an experience entry (Flutter Developer Intern, Jun 2024 – Oct 2024).
   - **Drop** all Flutter mini projects (Care-32, Netflix UI Clone, DocuVault, GitHub Webhook Tracker) and certifications (AWS Academy ML Foundations).
   - **My default for the unanswered items**: Crypto Trade-Sentiment Analysis and Credit Card Scraper (LLM/Groq) go into a small "More work" archive under the featured projects. The Amazon ML Hackathon is listed as on the resume, without the 397th rank. Tell me if you want any of these changed.

---

## 8. Proposed Phases

1. **Phase 0 — Safety fixes on the current live site** (small, independent): revert/fix the `firebase.json` caching rules (C1), fix the Formspree header (C2), and add `http` to dependencies (C3). Worth doing even if the redesign takes weeks.
2. **Plan 1 — Foundation & core sections** ([plan](plans/2026-10-01-plan-1-foundation-and-core-sections.md)): scaffold, design tokens, typed content from the resume, layout, header/nav/theme toggle, and all sections in clean form (Hero, Impact, About, Work, Projects, More work, Contact, Footer, 404), plus base SEO meta and Firebase config.
3. **Plan 2 — Signature layer** ([plan](plans/2026-10-01-plan-2-signature-layer.md)): detection-box hover/focus motif, generated project visuals, project cluster filter tabs, Formspree contact form, OG share image, sitemap.
4. **Plan 3 — Hero inference-pipeline animation**: React island; the static hero from Plan 1 is the reduced-motion fallback. (The embedding-space explorer and patch-grid demo are v2.)
5. **Plan 4 — Launch & hardening** ([plan](plans/2026-10-01-plan-4-cutover-and-hardening.md)): security headers, content proofread, first deploy to the new Firebase project, test matrix from 3.6, Lighthouse/a11y pass, reduced-motion pass, fixes, then updating links everywhere.

---

## 9. Decisions & Open Questions

Decided (2026-10-01):

- **Stack**: Astro + React islands + Tailwind.
- **Theme**: dark-first with a light "paper/scan" mode toggle.
- **Phase 0**: done on the current site:
  - `firebase.json`: replaced the 1-year `immutable` rule with `no-cache` on all paths. Firebase revalidates with ETags, so unchanged files return a cheap 304 and every deploy is picked up immediately.
  - `contact_section.dart`: added the `Accept: application/json` header for Formspree.
  - `pubspec.yaml`: declared `http: ^1.3.0` directly (same version as the lockfile).

- **Concept scope & accent color**: chosen as listed at the end of section 3.2 (pipeline hero, light model-card framing, detection-box motif, impact strip, archive; embedding space and patch demo deferred to v2; detection-orange accent).

- **Content inputs**: answered; see section 7.

- **Hosting** (2026-10-02): new Firebase project `jaypatel-dev-f91cb` instead of reusing `my-portfolio-ec4b7`; see section 4.1.

Still open:

1. Project visuals, if you find any (not blocking: generated visuals are the fallback).
2. The old URL `my-portfolio-ec4b7.web.app`: keep the Flutter site, redirect to the new site, or take it down (options in Plan 4's appendix).
