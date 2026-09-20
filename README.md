# Anchor

Calm, local-first P0 for adult AuDHD on **Methylphenidate XL 18 mg**. Bridge intent → execution. Zero shame. No streaks, no overdue chrome, no red warnings.

**Not medical advice.** Onset / Peak / Comedown are **focus-energy scaffolding** — a product timing model, not a plasma prediction. See `disclaimer.pkZones`.

**Live:** https://cieranmcclung.github.io/anchor/

## Enable GitHub Pages

1. Repo **Settings → Pages**
2. Source: **GitHub Actions** (this repo already has `.github/workflows/deploy-pages.yml`)
3. After a green `Deploy to GitHub Pages` run on `main`, the app is at **https://cieranmcclung.github.io/anchor/**
4. Vite `base` is `/anchor/` for project Pages. Custom domain not required.

Manual dispatch: **Actions → Deploy to GitHub Pages → Run workflow**.

## Run locally

```bash
npm install
npm run dev
```

## Build / test

```bash
npm test
npm run build
npm run preview
```

`preview` serves `dist` (same `/anchor/` base). After the first production load, a service worker caches the shell so Modules A–D work offline.

## Product lock (P0)

| Module | What ships |
|---|---|
| **A** | Today only. Load Low / Med / High (soft caps 1 / 2 / 3). Durations = raw × 1.4, nearest 5 min. |
| **B** | One XL 18 mg dose-time per day. Missing dose → zone **Unknown**; app stays usable. |
| **C** | Single Focus HUD: begin / pause / done, Un-Stick, Not This / Swap. |
| **D** | Thought-capture FAB → Park. Rest Protection Mode, user enter/exit only. |

Persistence (`localStorage` key `anchor-p0-v1`): load, dose-time, PK window overrides, anchors, active focus, park, rest flag. Settings survive day rollover.

### PK windows (Research + QA locked defaults)

User-editable in **Meds → Timing windows**. Stored local-first under `settings`.

| Setting | Default | Meaning |
|---|---|---|
| `onsetEndHours` | **2** | Onset ~0–2h after dose log. Climbing 2–6h may still read as Onset. |
| `peakEndHours` | **10** | Peak chip/label ~6h through 10h. |
| `comedownEndHours` | **12** | Soft cue after Peak (starts ~10h). **Not** a hard 8h cutoff and not an alarm. |

**Banned live defaults:** `onsetEndHours: 1`, `peakEndHours: 5`, `comedownEndHours: 8`. Those values are migrated to the locked defaults.

Visible timeline labels: **Onset | Peak | Comedown** only.

## Architecture

```
src/
  App.tsx                 shell routes: Today · Meds · Rest (+ Settings)
  copy/strings.p0.json    zero-shame copy dictionary
  types.ts                DEFAULT_PK_WINDOWS + app state
  utils/pk.ts             zone engine (settings-aware)
  utils/duration.ts       ×1.4, nearest 5 min
  utils/storage.ts        localStorage + legacy migrate
  components/             HUD, anchors, meds, rest, capture, settings
```

Stack: Vite + React + TypeScript, CSS modules, design tokens from P0 UX (`#12141a` base, muted slate/graphite only).

## Copy & design

UI strings come from `src/copy/strings.p0.json` keys. Tokens match `P0_DESIGN` hex values. No light theme, no streak counters, no guilt chrome.
