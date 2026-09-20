# Anchor

Calm, local-first single-page app for AuDHD executive dysfunction: task initiation, visible time, and routines organised around a Methylphenidate XL planning window.

**Not medical advice.** Med phases are personal estimates for organising tasks only.

Live: https://cieranmcclung.github.io/anchor/

## Features

- **Daily anchors** — morning / evening basics templates with cognitive load (`low` | `medium` | `high`), guilt-free skip
- **Dose sync** — one-tap “Took my dose”; onset (0–1h) → peak (1–5h) → comedown (5–8h) → offline; soft copy only
- **Single focus** — one task, definition of done, timer = estimate × 1.4; Paralyzed / Stuck → 2-minute micro-step
- **AuDHD helpers** — phase-aware next action, initiation helper, time remaining + elapsed + wall-clock end, energy match on comedown
- **Parking lot** — capture intrusive tasks without derailing focus
- **Settings / first-run** — usual dose time, XL label, window overrides, template toggles; disclaimer retained

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

Vite `base` is `/anchor/` for GitHub Pages.

## Persistence

`localStorage` key `anchor-app-v1` (legacy keys migrated). No backend.

## Stack

Vite + React + TypeScript, CSS modules, dark slate default.
