# Anchor

Calm, local-first P0 for adult AuDHD on **Methylphenidate XL 18 mg**. Bridge intent → execution. Zero shame. No streaks, no overdue chrome, no red warnings.

**Not medical advice.** Onset / Peak / Comedown are a **product timing model** for organising today — not a plasma prediction, not a diagnosis, and not a dopamine tank. See `disclaimer.pkZones`.

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
| **C** | Single Focus HUD: begin / pause / done, Un-Stick, Not This / Swap. Timer never force-cuts hyperfocus. |
| **D** | Thought-capture FAB → Park (capture-on-interrupt). Rest Protection Mode, user enter/exit only. |

Persistence (`localStorage` key `anchor-p0-v1`): load, dose-time, PK window overrides, anchors, active focus, park, rest flag. Settings survive day rollover.

### Architecture priors (behaviour, not extra modules)

- **Monotropism** — one thing at a time, interest-led capture, high interrupt cost, soft exits
- **Transition friction** — +40% buffers, pause / Not This, park instead of derailing
- **Sensory fatigue** — muted slate/graphite, no urgency chrome, Rest is voluntary
- **ADHD motivation** — delay aversion / interest timing. No deficiency-tank or refill gamification

### PK windows (Concerta/OROS-class placeholders)

User-editable in **Meds → Timing windows**. Product modelling only. UK “XL” is not one curve (Medikinet / Equasym often ~8 h). Comedown is highly individual.

| Setting | Default | Placeholder map |
|---|---|---|
| `onsetEndHours` | **2** | **Onset** ~0–2h |
| `peakEndHours` | **6** | **Peak** ~2–6h |
| `comedownEndHours` | **10** | **Comedown** ~6–10h+ (chip stays Comedown after 10h; Rest Mode is separate) |

Soft dose-log cue near the end of Comedown — not a prediction, never an alarm. Superseded placeholders (`1/5/8` and `2/10/12`) migrate to these defaults.

Visible labels: **Onset | Peak | Comedown** only (`efficacy.zone.onset` / `.peak` / `.comedown`).

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
