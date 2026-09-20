# Anchor

A calm, local-first single-page app for AuDHD executive dysfunction: task initiation, visible time, and routines organised around a user-configured med window.

**Not medical advice.** Med phases are personal estimates for organising tasks only.

## Run

```bash
cd /workspace/anchor
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

## Build

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Features

- **Med window** — dose time + useful hours; Home shows Before / Rising / Peak / Waning / Offline with soft copy
- **Start Door** — capture a stuck task, editable 2-minute micro-start, Just start → focus timer
- **Focus** — large remaining time, progress ring, elapsed, wall-clock end; Continue / Park / Done
- **Body-double** — quiet presence; optional soft ambient (off by default)
- **Today’s rails** — 3–7 daily anchors with guilt-free skip; suggested next from clock + med phase
- **Parking lot** — capture intrusive tasks; one-tap into Start Door
- **Time check** — wall clock, since last check, until next block
- **Soft close** — evening journal of what started, park for tomorrow, optional med notes (local)
- **Settings** — med window, theme, low-stimulation, reduce motion, edit rails
- **First-run** — dose time + seeded default rail

## Persistence

All state lives in `localStorage` (`anchor-app-v1`). No backend, no accounts.

## Stack

Vite + React + TypeScript, CSS modules, dark default.
