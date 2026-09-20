# Anchor

Calm, local-first single-page app for AuDHD executive dysfunction: task initiation, visible time, and routines organised around a Methylphenidate XL planning window. Four **in-app autonomous agents** make Anchor an active executive-function engine — not a passive dashboard.

**Not medical advice.** Med phases are personal estimates for organising tasks only.

Live: https://cieranmcclung.github.io/anchor/

## Agents

1. **Pharmacokinetic Orchestrator** — watches elapsed time since logged (or usual) dose; auto-reorders the queue by biological window (peak → deep first; comedown warning ~45m early; rest protection buries high-load with a “show all” escape). Mode persisted in `localStorage`.
2. **Un-Stick Deconstruction** — in Single Focus, **I’m Stuck / Paralyzed** fragments the task into **exactly three** ~2-minute micro-steps; only Step 1 is shown until completed, then Step 2, then Step 3.
3. **Natural Language Brain-Dump** — FAB + `c` / `/`; heuristic parse into tasks with Low/Med/High load and estimate × **1.4** buffer; routes to rails / parking / tomorrow. Optional mic when Web Speech API exists.
4. **Somatic Reset & Sensory Anchor** — if focus sits idle or overrun past its buffer, a soft prompt offers a 2-minute somatic reset, dismiss, or micro-step. Never a red alarm.

Prompts coalesce (session memory + cooldown) so agents feel always-on without spam.

## Other features

- **Daily anchors** — morning / evening basics templates with cognitive load, guilt-free skip
- **Dose sync** — one-tap “Took my dose”; onset → peak → comedown → offline
- **Single focus** — definition of done, buffered timer, body-double option
- **Parking lot** — capture without derailing focus
- **Settings / first-run** — usual dose time, XL label, window overrides, rest protection; disclaimer retained

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

`localStorage` key `anchor-app-v1` (legacy keys + agents schema migrated safely). No backend.

## Stack

Vite + React + TypeScript, CSS modules, dark slate default, UK English, mobile-first.
