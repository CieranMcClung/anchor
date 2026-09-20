# Keel

Display name **Keel** by **Keel Labs** (`brand.appName` / `brand.orgName`). One-release subtitle: formerly Anchor. Repo and Pages path stay `/anchor/`.

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

Persistence (`localStorage` key `anchor-p0-v1`): load, dose-time, PK window overrides, buffer %, hyperfocus minutes, anchors, active focus, park, rest flag, today-only done list. Settings survive day rollover.

### Architecture priors (behaviour, not extra modules)

- **Monotropism** — one thing at a time, interest-led capture, high interrupt cost, soft exits
- **Transition friction** — 30–50% buffers (default 40%), pause / Not This, park instead of derailing
- **Sensory fatigue** — muted slate/graphite, no urgency chrome, Rest is voluntary
- **ADHD motivation** — delay aversion / interest timing. No deficiency-tank or refill gamification

### P1 local-first (this release)

P0 behaviour is unchanged. P1 adds local-only surfaces. No med optimisation. No dopamine-tank UI. No plasma language.

| ID | What ships |
|---|---|
| **A3** | Buffer setting **30–50%**, default **40%**, persisted. Every displayed duration uses it (list, HUD, add-anchor preview). |
| **A2** | HUD **Too Hard** → deeper local Un-Stick. **Overwhelmed** → park + Swap / Rest. Zero shame. |
| **A1** | Zone + load **chips / hints only**. Ignore is fine. Never forces a start. |
| **A4** | Soft hyperfocus chip after **45–90 min** continuous (tunable). Dismissible. Never cuts focus. |
| **A5** | Today-only momentum: done / parked counts. No streaks, scores, badges, or rewards. |
| **A6** | Global hotkeys (below). Existing capture shortcut **c** / **/** is unchanged. |
| **B1** | Brain-dump deconstruction **on** (`aiBrainDump: true`). Local heuristic always works offline. Optional user-key LLM enhance. Voice is later. |

### B1 brain-dump

Capture FAB or `c` / `/` → paste a wall or bullets → **Deconstruct**.

1. **Local engine (always):** splits chaos into atomic tasks, each **&lt;10 min pre-buffer**, rough load L/M/H, filler dropped or flagged, optional simple deps on “then” chains. No network.
2. **Review sheet:** edit, uncheck, then **Commit selected to today** or **Reject — keep dump in Park**.
3. Reject / empty / fail → the raw dump stays in Park. Nothing is scored.
4. **Optional LLM enhance:** Settings stores an OpenAI-compatible key in `localStorage` key `keel-llm-v1` only. Missing key, offline, CORS, or any request failure → silent local fallback. **Never** put Cursor or server secrets in the SPA bundle. GitHub Pages has no proxy; many vendors block browser CORS, so local sorting is the offline-safe path.

Toggle the UI in Settings if you want capture to stay “park as written” only.

### QA overrides (same release)

| Control | Where | Why |
|---|---|---|
| **Preview hyperfocus chip** | Settings | A4 chip without waiting 45–90 minutes. Dismissible. Never cuts focus. |
| **Rest bury without waiting** | Settings | Item 7: Park leftover Today items and rest during **Comedown** or **offline** without waiting for PK window minutes. Timing window mins themselves stay clamped (Onset &lt; Peak ≤ Comedown). |

Rest tab shows **Park what’s left and rest** when Comedown, offline, or the override is on. Ordinary Rest (no bury) still works anytime. Zero shame.

### Keyboard

Typed in an input or textarea is ignored. Documented in Settings too.

| Key | Action |
|---|---|
| `c` or `/` | Capture (park a thought) — same as P0 |
| `Space` | Start / pause the current focus |
| `d` | Done |
| `u` | Un-Stick |
| `h` | Too Hard (deeper Un-Stick) |
| `o` | Overwhelmed (park, then Swap or Rest) |
| `s` | Swap |
| `r` | Rest |
| `Esc` | Close sheets |

### PK windows (focus-energy placeholders)

User-editable in **Meds → Timing windows**. User-anchored product model, not a plasma curve. UK “XL” is not one curve (Medikinet / Equasym often ~8 h). Comedown is highly individual.

Internal bins (not chips): Rising 0–2 / Climb 2–6 / Peak 6–10 / Taper 10–12+.

| Setting | Default | Visible chip |
|---|---|---|
| `onsetEndHours` | **2** | **Onset** ~0–2h rising; climbing 2–6h still Onset (never Peak-as-Tmax) |
| `peakEndHours` | **10** | **Peak** ~6–10h focus-energy plateau |
| `comedownEndHours` | **12** | **Comedown** ~10–12h+ |

Soft dose-log cue ~45 min before Comedown — not a prediction. Rest Mode is separate. Superseded `1/5/8` and Peak-as-2–6 (`2/6/10`) migrate to these defaults.

Visible labels: **Onset | Peak | Comedown** only (`efficacy.zone.onset` / `.peak` / `.comedown`).

## Architecture

```
src/
  App.tsx                 shell routes: Today · Meds · Rest (+ Settings)
  copy/strings.p0.json    P0 zero-shame copy dictionary
  copy/strings.p1.json    P1 HUD / buffer / hotkeys / momentum copy
  types.ts                DEFAULT_PK_WINDOWS + app state
  utils/pk.ts             zone engine (settings-aware)
  utils/duration.ts       buffer 30–50% (default 40%), nearest 5 min
  utils/routingHints.ts   A1 zone+load chips (never force)
  utils/aiBrainDump.ts    B1 local heuristic (offline)
  utils/llmEnhance.ts     optional user-key enhance; silent local fallback
  utils/llmKey.ts         API key in localStorage only (`keel-llm-v1`)
  utils/restBury.ts       Item 7 park-and-rest (no minutes wait)
  utils/storage.ts        localStorage + legacy migrate
  components/             HUD, anchors, meds, rest, capture, review, settings
```

Stack: Vite + React + TypeScript, CSS modules, design tokens from P0 UX (`#12141a` base, muted slate/graphite only).

## Copy & design

UI strings come from `src/copy/strings.p0.json` and `src/copy/strings.p1.json`. Tokens match `P0_DESIGN` hex values. No light theme, no streak counters, no guilt chrome. Daily Anchors is still the noun for today’s list. Research bans: no medication optimisation, no dopamine tanks, no plasma-as-product language outside the disclaimer that names what this is not.
