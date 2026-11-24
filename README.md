# Albion Tools

Small static website of tools for **Albion Online**, built with React + Vite and hosted on
GitHub Pages. The first tool is a **refining calculator**.

## Refining calculator

- Drop-down with **type-to-filter autocomplete** over every refined resource
  (T2–T8 × stone/wood/hide/cotton/ore → brick/plank/leather/cloth/metal).
- Enter the **quantity you want** to refine.
- Shows the **full material chain**, including intermediate refined tiers.
- Tick **what you already own** at every level — the table and the compact
  **missing list update live**.
- Your inputs are persisted in `localStorage`.

### Recipes

| Tier | Raw needed      | Previous refined |
| ---- | --------------- | ---------------- |
| T2   | 2× same-tier    | —                |
| T3   | 2× same-tier    | 1× T2 refined    |
| T4   | 2× same-tier    | 1× T3 refined    |
| T5   | 3× same-tier    | 1× T4 refined    |
| T6   | 4× same-tier    | 1× T5 refined    |
| T7   | 5× same-tier    | 1× T6 refined    |
| T8   | 5× same-tier    | 1× T7 refined    |

T1 is ignored, as per the game.

## Development

```bash
npm install
npm run dev      # local dev server
npm run build    # production build → dist/
npm run preview  # serve the production build locally
```

## Deploying on GitHub Pages

1. Push this repository to GitHub (default branch `main`).
2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Every push to `main` runs `.github/workflows/deploy.yml`, which builds the
   site and publishes it to Pages.

The Vite config uses `base: './'`, so the site works both at the root of a
user site (`<user>.github.io`) and under a project subpath
(`<user>.github.io/<repo>/`).

## Project structure

```
src/
  data/resources.js      # resource types, tiers, recipes, autocomplete
  lib/calculate.js       # chain computation (needed / owned / missing)
  components/            # ResourceSelector, MaterialsTable, MissingList, BrandMark
  tools/RefiningTool.jsx # the calculator page component
  App.jsx                # layout: header, intro, tool, footer
public/favicon.svg
.github/workflows/deploy.yml
```

## Adding a new tool later

1. Create `src/tools/<ToolName>.jsx`.
2. Add a route/link in `src/App.jsx` (a simple state-based switch is enough
   for a handful of pages, or add a router if needed).
3. Link it from the header nav.

## License

Do what you want with it (MIT), it's a fan project.
