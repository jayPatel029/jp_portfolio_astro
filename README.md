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
