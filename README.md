# Albion Tools

Small static website of tools for **Albion Online**, built with React + Vite and hosted on
GitHub Pages. The first tool is a **refining calculator**.

## Refining calculator

- Drop-down with **type-to-filter autocomplete** over every refined resource
  (T2–T8 × stone/wood/hide/fiber/ore). Search works in either language.
- **Official in-game names and icons**: "T4 Travertine Block", "T8 Adamantium
  Steel Bar", … tier first, as in game.
- **English / French**: full UI translation with a toggle in the header
  (🌐 EN/FR button). Item names come from the game's own EN and FR
  localization dumps — "T4 Bloc de travertin", "T2 Peau de bête fine", …
  The choice is persisted and the browser language is used as the default.
- Enter the **quantity you want** to refine.
- Shows the **full material chain**, including intermediate refined tiers
  (the output itself is not listed as a material).
- Tick **what you already own** at every level — the table and the compact
  **missing list** update live. The missing list shows only the raw materials
  you still have to gather (intermediate refined tiers are crafted from them).
- Your inputs are persisted in `localStorage`.

### Recipes

| Tier | Raw needed      | Previous refined |
| ---- | --------------- | ---------------- |
| T2   | 1× same-tier    | —                |
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
  data/resources.js      # resource types, tiers, recipes, official names (EN), autocomplete
  data/resources.fr.js   # official French item names (generated from the FR dump)
  i18n.jsx               # EN/FR strings, language context + toggle, <html lang> handling
  lib/calculate.js       # chain computation (needed / owned / missing)
  components/            # ResourceSelector, MaterialsTable, MissingList, NumberInput, BrandMark
  tools/RefiningTool.jsx # the calculator page component
  App.jsx                # layout: header (+ language toggle), intro, tool, footer
public/favicon.svg
public/icons/            # 70 official item icons (T2–T8 × raw/refined × 5 types)
.github/workflows/deploy.yml
```

## Adding a new tool later

1. Create `src/tools/<ToolName>.jsx`.
2. Add a route/link in `src/App.jsx` (a simple state-based switch is enough
   for a handful of pages, or add a router if needed).
3. Link it from the header nav.

## Assets & data credits

- **Names**: English and French item strings from the game's localization
  dumps ([ao-data/ao-bin-dumps](https://github.com/ao-data/ao-bin-dumps)).
  `src/data/resources.fr.js` is generated from the FR-FR segments of the TMX
  translation memory.
- **Icons**: rendered with Albion's official render service
  (`render.albiononline.com`) and stored locally in `public/icons/`.

Albion Online is a trademark of Sandbox Interactive GmbH. This is a fan
project, not affiliated with Sandbox Interactive.

## License

Do what you want with it (MIT), it's a fan project.
