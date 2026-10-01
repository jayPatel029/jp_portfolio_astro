# Plan 4 — Launch & Hardening Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Steps marked 👤 are **owner steps**: the agent prepares commands and explains, but does not run them unless the owner explicitly approves in that moment.

**Goal:** Launch the Astro site on its own Firebase project, `jaypatel-dev-f91cb` (`https://jaypatel-dev-f91cb.web.app`). The steps are: add security headers, proofread content, deploy, run the QA pass on the real URL, fix findings, then update links everywhere. The old Flutter site on `my-portfolio-ec4b7` is left untouched. Options for it are in the appendix, to be decided later.

**Architecture:** No new features. One config change (security headers in `firebase.json`), docs updates, then a staged launch. The new URL isn't shared anywhere yet, so it serves as the test environment: deploy → QA → fix → redeploy. "Launch" means updating LinkedIn, GitHub and the CV to point at it.

**Spec:** `docs/portfolio-revamp.md` (sections 3.5, 3.6, 4.1, 6). **Builds on:** Plans 1 and 2 (merged to `main` at `012f969`).

> **Status (2026-10-02): paused after Task 3.** Tasks 1–3 are done and deployed. Plan 3 (hero animation) runs first. Its Step 0 merges `plan-4-launch` into `main`, and it ends with a deploy. **Resume at Task 4.** The QA pass then covers the new hero too. For Task 5, make any fixes on a new branch `plan-4-qa-fixes` from `main`, and in Task 5 step 4 merge that branch instead of `plan-4-launch`.

## Global Constraints

- Project root: `C:\Users\jaysu\Desktop\ME\Jay-Portfolio\portfolio_astro`. Work on a new branch `plan-4-launch` created from `main`.
- Firebase project `jaypatel-dev-f91cb`. `site` in `astro.config.mjs` is `https://jaypatel-dev-f91cb.web.app`; canonical, OG image, sitemap, robots.txt and JSON-LD all derive from it.
- **Never deploy to or change `my-portfolio-ec4b7`** in this plan except through the appendix, and only after the owner picks an option.
- Every `firebase deploy` needs owner approval, because it uses the owner's Firebase login.
- **No phone number anywhere**, and Atomic Loops content stays exactly as in `docs/resume.txt`.
- No new dependencies or features. Out of scope: analytics, custom domain, Content-Security-Policy for scripts (the inline theme script and JSON-LD would need hashes; revisit with Plan 3).
- **Owner preferences (execution):**
  - No separate review step per task.
  - For code tasks: implement from this plan, run `npm run check`, commit with the given message, append one line to `.superpowers/sdd/progress.md` (new "plan 4" section at the top), and give the owner a one-line update.
  - `npm run build`, `curl` checks and `firebase` commands only with owner approval, asked once per step.
  - No automated tests.
- Merge `plan-4-launch` into `main` with owner approval before the final deploy in Task 6, so the launched version is always deployed from `main`.

## Prerequisites (👤 owner, once)

- [ ] In the [Firebase console](https://console.firebase.google.com) → project `jaypatel-dev` → **Build → Hosting → Get started**. Click through the steps; the repo already has the config. This creates the default hosting site `jaypatel-dev-f91cb`.
- [ ] Firebase CLI installed and logged in with the account that owns the project:

```bash
npm install -g firebase-tools
firebase login
firebase projects:list
```

Expected: `jaypatel-dev-f91cb` appears in the list.

- [ ] In Formspree, open form `xovegole` → Settings. If **Restrict to domain** is set, add `jaypatel-dev-f91cb.web.app`.
- [ ] Recommended: upgrade Node to the current 22.x LTS (≥ 22.19) or 24.x to remove the `undici` engine warning, then run `npm install` once in `portfolio_astro`.

## File Structure

```
astro.config.mjs, .firebaserc        (already switched to jaypatel-dev-f91cb, committed in Task 1 step 0)
firebase.json                        MOD  security headers
README.md                            MOD  deploy flow and rollback
docs/portfolio-revamp.md             MOD  record launch (sections 8 and 9)
src/content/profile.ts               MOD  only if the proofread finds real typos (owner approves content changes)
```

---

### Task 1: Commit the project switch, then add security headers

**Files:**
- Modify: `firebase.json` (full content below)

- [ ] **Step 0: Commit the pending switch on `main`, then branch**

`main` has uncommitted edits from planning:
- `astro.config.mjs` (`site` → `https://jaypatel-dev-f91cb.web.app`)
- `.firebaserc` (`default` → `jaypatel-dev-f91cb`)
- `README.md` (hosting line)
- `docs/portfolio-revamp.md`
- this plan file

Commit them first, then create the branch:

```bash
git checkout main
git add astro.config.mjs .firebaserc README.md docs
git commit -m "chore: move hosting to new Firebase project jaypatel-dev-f91cb and add plan 4"
git push origin main
git checkout -b plan-4-launch
```

- [ ] **Step 1: Replace `firebase.json`**

The CSP here only restricts framing, `<base>`, plugins and form targets. It does **not** restrict scripts, so the inline theme script and JSON-LD keep working. `form-action` allows Formspree because the no-JS fallback posts there directly.

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
        "headers": [
          { "key": "Cache-Control", "value": "no-cache" },
          { "key": "X-Content-Type-Options", "value": "nosniff" },
          { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
          { "key": "X-Frame-Options", "value": "DENY" },
          { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
          {
            "key": "Content-Security-Policy",
            "value": "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self' https://formspree.io"
          }
        ]
      },
      {
        "source": "/_astro/**",
        "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
      }
    ]
  }
}
```

- [ ] **Step 2: Check and commit**

Run `npm run check`. Expected: 0 errors. Then:

```bash
git add firebase.json && git commit -m "feat: add security headers to Firebase hosting"
```

---

### Task 2: Content proofread and deploy docs

**Files:**
- Modify: `README.md`; `src/content/profile.ts` only if needed

- [ ] **Step 1: Proofread `src/content/profile.ts` against `docs/resume.txt`** (inspection only)

Check, field by field:
- name, role, location, email
- all job titles, companies, dates and bullets (Atomic Loops: the 7 bullets and the ~6 GB / 10 GB GPU numbers, wording unchanged in meaning)
- project titles, stacks and links
- the CV link (`https://drive.google.com/file/d/1TQmPepxVTBuhk_NqN-l3z4cDxqezJOUc/view?usp=sharing`)
- LinkedIn and GitHub URLs
- the Amazon ML Hackathon entry, without the rank

Also check that no phone number exists anywhere in `src/`. Report discrepancies to the owner as a short list. Fix obvious typos directly; any change in meaning needs the owner's OK first. If `profile.ts` changes, commit it on its own:

```bash
git add src/content/profile.ts && git commit -m "fix: correct content from resume proofread"
```

- [ ] **Step 2: Replace the "Deploying" section of `README.md`**

Replace everything from `## Deploying` up to (not including) the last line `Design notes and plans are in \`docs/\`.` with:

````markdown
## Deploying

Hosting is Firebase project `jaypatel-dev-f91cb` (https://jaypatel-dev-f91cb.web.app), separate from the old Flutter site's project (`my-portfolio-ec4b7`).

    npm run build
    firebase deploy --only hosting

To try a risky change without touching the live site, deploy it to a temporary preview URL instead:

    firebase hosting:channel:deploy preview --expires 7d

**Rollback:** Firebase console → Hosting → Release history → pick the previous release → Rollback. This is instant and needs no rebuild.

````

- [ ] **Step 3: Check and commit**

Run `npm run check`. Expected: 0 errors. Then:

```bash
git add README.md && git commit -m "docs: document deploys, preview channels and rollback"
```

---

### Task 3: First deploy and hosting checks (👤 approval needed)

The URL isn't shared anywhere yet, so deploying the branch build here is safe.

- [ ] **Step 1: Build** (with approval)

```bash
npm run build
```

Expected: 0 check errors. `dist/` contains `index.html`, `404.html`, `og.png`, `robots.txt`, `sitemap-index.xml`, `sitemap-0.xml`, `_astro/`. Confirm the new URL is baked in:

```bash
grep -c "jaypatel-dev-f91cb.web.app" dist/index.html dist/robots.txt
grep -rc "my-portfolio-ec4b7" dist --include=*.html --include=*.txt --include=*.xml
```

Expected: the first command reports matches in both files. The second reports `0` for every file.

- [ ] **Step 2: Deploy** (with approval)

```bash
firebase deploy --only hosting
```

Expected: `Deploy complete!` and `Hosting URL: https://jaypatel-dev-f91cb.web.app`.

- [ ] **Step 3: Check the real hosting behaviour** (with approval). Replace `<css-file>` with any file name from `dist/_astro/`.

```bash
SITE=https://jaypatel-dev-f91cb.web.app
curl -sI "$SITE/"
curl -sI "$SITE/_astro/<css-file>"
curl -sI "$SITE/og.png"
curl -s  "$SITE/robots.txt"
curl -sI "$SITE/sitemap-index.xml"
curl -sI "$SITE/this-page-does-not-exist"
```

Expected:

| Path | Status | Key headers |
| --- | --- | --- |
| `/` | 200 | `cache-control: no-cache` plus the five security headers |
| `/_astro/...css` | 200 | `cache-control: public, max-age=31536000, immutable` |
| `/og.png` | 200 | `content-type: image/png` |
| `/robots.txt` | 200 | body shows `Sitemap: https://jaypatel-dev-f91cb.web.app/sitemap-index.xml` |
| `/sitemap-index.xml` | 200 | XML content type |
| unknown path | 404 | serves the site's 404 page |

If `/_astro/` responses lack the security headers, that's acceptable (they're static assets). If `/` lacks them, report it and stop.

---

### Task 4: QA pass on the live URL (👤 owner, in a browser)

The owner records each finding (page area, screen size, what's wrong) and passes the list to the agent. Use Chrome DevTools device toolbar for sizes.

- [ ] **Layouts (spec 3.6 test matrix), in both dark and light themes:** 320×568, 375×667, 390×844, landscape 844×390, 768×1024, 1024×768, 1366×768, 1440×900, 1920×1080, 2560×1440, plus 200% browser zoom at 1366×768. Pass when there's no horizontal scroll, no overlapping or clipped text, and the mobile menu opens and closes and fits on screen.
- [ ] **Keyboard:** Tab through the whole page. The skip link appears first, every link and button shows a focus ring, project cards and archive rows show the detection box on focus, the filter tabs toggle with Enter/Space, and Escape closes the mobile menu.
- [ ] **Reduced motion:** DevTools → Rendering → "Emulate CSS prefers-reduced-motion: reduce". No transitions, smooth scrolling is off, and nothing is hidden.
- [ ] **JavaScript disabled:** DevTools → Settings → Debugger → Disable JavaScript, then reload. All 8 projects show, filter tabs are hidden, the theme follows the system setting, and the contact form submits to Formspree's own page.
- [ ] **Contact form:** send one real message. The success message appears and the email arrives. Confirm the form in Formspree if it asks.
- [ ] **Links:** open the CV link in a private window while logged out of Google. It must open without a sign-in page. Check LinkedIn, GitHub, project links and the archive links.
- [ ] **Lighthouse** (DevTools → Lighthouse → Mobile, all four categories, in a private window): target ≥ 95 for Performance, Accessibility, Best Practices and SEO (spec section 6). Note every audit below 100 in Accessibility and SEO.
- [ ] **Sharing preview:** paste the URL into [opengraph.xyz](https://www.opengraph.xyz/) or a private Slack/WhatsApp chat. The title, description and `og.png` image should appear.

---

### Task 5: Fix QA findings

- [ ] **Step 1:** For each finding, find the root cause in the code and fix it with the smallest change that follows the existing patterns. Anything that changes the design or content goes to the owner first.
- [ ] **Step 2:** Run `npm run check`. Expected: 0 errors. Commit all fixes together:

```bash
git add -A src public firebase.json && git commit -m "fix: address pre-launch QA findings"
```

- [ ] **Step 3:** With approval, rebuild and redeploy (Task 3 steps 1–2). The owner rechecks only the failed items.
- [ ] **Step 4:** With approval, merge into `main` and push:

```bash
git checkout main && git merge --ff-only plan-4-qa-fixes && git push origin main plan-4-qa-fixes
```

If there were no findings, skip steps 1–4 (`main` already contains everything after Plan 3).

---

### Task 6: Launch (👤 owner says "go")

- [ ] **Step 1:** Deploy from `main` (with approval) so the live release matches the merged code:

```bash
git checkout main && npm run build && firebase deploy --only hosting
```

- [ ] **Step 2 (👤): Point everything at the new URL** `https://jaypatel-dev-f91cb.web.app`:
  - LinkedIn: Contact info → Website, plus the Featured section if it links the old site.
  - GitHub: profile "Website" field, profile README if it has one, and the **About → Website** field of `jayPatel029/jp_portfolio_astro`.
  - The CV on Google Drive (`1FPes37W…`, replaced `1TQmPepx…` on 2026-10-02): replace the portfolio link in the document. Edit the existing file so the share link stays the same.
  - Anywhere else the old URL appears (email signature, job portals).
- [ ] **Step 3 (👤): Post-launch checks**
  - Refresh LinkedIn's cached link preview with [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/).
  - Optional: add the site to [Google Search Console](https://search.google.com/search-console) (URL-prefix property, HTML-tag or file verification) and submit `sitemap-index.xml`.
- [ ] **Rollback, if anything is wrong:** Firebase console → project `jaypatel-dev` → Hosting → Release history → previous release → **Rollback**. The old Flutter site is still live at its own URL, so you can temporarily point links back there too.

---

### Task 7: Wrap-up

- [ ] **Step 1: Update `docs/portfolio-revamp.md`.** In section 8, change the Plan 4 line to start with `5. **Plan 4 — Launch & hardening** ([plan](plans/2026-10-01-plan-4-cutover-and-hardening.md), live since <date>)`. In section 9 under "Decided", add:

```markdown
- **Launch**: the Astro site went live on <date> at https://jaypatel-dev-f91cb.web.app (deployed from `portfolio_astro` `main`).
```

Commit on `main` with owner approval: `docs: record launch`, then push.

- [ ] **Step 2 (👤 owner decides): Old Flutter repo `my_portfolio`.** It still has uncommitted Phase 0 changes (`firebase.json`, `pubspec.yaml`, `pubspec.lock`, `lib/widgets/contact_section.dart`, `lib/constants/personal_info.dart`, `.firebase/` cache) and untracked `docs/`, `.cursorignore`. Choose one:
  - Commit them as the final archived state, and add a line to its README: "Archived: superseded by jayPatel029/jp_portfolio_astro."
  - Or discard them.
- [ ] **Step 3 (👤 owner decides): Old URL.** Pick an option from the appendix, now or later.

---

## Appendix: Options for the old URL (`my-portfolio-ec4b7.web.app`)

The old Flutter build registers an offline service worker at `/flutter_service_worker.js`. It caches several MB (CanvasKit, `main.dart.js`, assets), and returning visitors keep it installed. It fetches `/` network-first, so whatever the old project serves next is what visitors see. But the worker and its caches only go away if the old project serves a replacement `flutter_service_worker.js` that unregisters itself.

**Option A — Keep the Flutter site.** Do nothing. Old links keep showing the old portfolio.

**Option B — Redirect to the new site (recommended once links are updated).** Deploy a tiny redirect release to the old project from the `my_portfolio` repo, using a separate config file so its normal `firebase.json` stays untouched. The Flutter release stays in that project's release history, so this is reversible with one click.

Create these files in `my_portfolio`:

`firebase.redirect.json`

```json
{
  "hosting": {
    "public": "redirect",
    "headers": [{ "source": "**", "headers": [{ "key": "Cache-Control", "value": "no-cache" }] }],
    "redirects": [
      { "source": "/", "destination": "https://jaypatel-dev-f91cb.web.app/", "type": 301 },
      { "source": "/index.html", "destination": "https://jaypatel-dev-f91cb.web.app/", "type": 301 }
    ]
  }
}
```

`redirect/flutter_service_worker.js`. It must stay a real file, not a redirect, because browsers refuse redirected service-worker scripts:

```js
// Replaces the Flutter service worker that returning visitors still have installed:
// removes its caches and unregisters itself.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.filter((name) => name.startsWith('flutter-')).map((name) => caches.delete(name)),
      );
      await self.registration.unregister();
    })(),
  );
});
```

`redirect/404.html` (any other old path):

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Moved | Jay Patel</title>
    <meta http-equiv="refresh" content="0; url=https://jaypatel-dev-f91cb.web.app/" />
    <link rel="canonical" href="https://jaypatel-dev-f91cb.web.app/" />
  </head>
  <body>
    <p>This portfolio has moved to <a href="https://jaypatel-dev-f91cb.web.app/">jaypatel-dev-f91cb.web.app</a>.</p>
  </body>
</html>
```

Deploy (👤 with approval), from `my_portfolio`:

```bash
firebase deploy --only hosting --project my-portfolio-ec4b7 --config firebase.redirect.json
```

Check: `curl -sI https://my-portfolio-ec4b7.web.app/` returns `301` with `location: https://jaypatel-dev-f91cb.web.app/`. `curl -sI https://my-portfolio-ec4b7.web.app/flutter_service_worker.js` returns `200`. In a browser that visited the old site, DevTools → Application → Service workers no longer lists the Flutter worker after one visit plus one reload.

**Option C — Take it down.** Same as Option B but without the `redirects` block, so every path shows the "moved" page. Avoid `firebase hosting:disable` on its own, because it leaves the old service worker installed in returning visitors' browsers.
