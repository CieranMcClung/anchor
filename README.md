# Anchor & Float

Calm, local-first Android app for adult AuDHD (autism + ADHD) executive function. **Anchors** are the few wall-clock milestones in a day. **Floats** are the work that sits before, after, or between them — sequential or opportunistic, never a minute-by-minute grid.

There are no streaks, points, overdue badges, panic reds, or shame copy. Tomorrow always opens as a clean slate.

This repository is a **Kotlin + Jetpack Compose** project (Gradle Kotlin DSL). It replaces the earlier Vite/React PWA in this repo.

## Open in Android Studio

1. Install [Android Studio](https://developer.android.com/studio) (Narwhal / Meerkat or newer is fine).
2. **File → Open** and select this repository root (the folder that contains `settings.gradle.kts`).
3. Use **JDK 17** (Android Studio’s bundled JBR is enough).
4. Let Gradle sync. First sync downloads the Android Gradle Plugin, Compose BOM, Hilt, Room, and WorkManager.
5. Select the `app` run configuration and an API 26+ emulator or device.
6. Run.

Command line (with a local SDK):

```bash
# sdk.dir must be set in local.properties, or ANDROID_HOME exported
./gradlew :app:assembleDebug
./gradlew :app:testDebugUnitTest
```

- **minSdk** 26  
- **compileSdk / targetSdk** 36  
- **applicationId / namespace** `com.anchorfloat.app`  
- **AGP** 8.13.2 · **Gradle** 8.13 · **Kotlin** 2.1.21 (JVM 17 bytecode; JDK 17 or 21)

## Product lock

| Do | Do not |
|---|---|
| Three energy tiers that refilter the board in real time | Rigid calendars or minute schedules |
| Unstuck overlay with **one** micro-action | Gamification, streaks, scores |
| Silent midnight sweep into the pool | Overdue chrome, badges, notifications |
| Muted earth tones, 48dp+ targets, Atkinson Hyperlegible | Neon, alarm red, exclamation badges |

### Energy

- **Flow (green / sage)** — all scheduled floats and the queued pool.
- **Maintenance (amber)** — core anchors and lightweight floats. Non-essential backlog is hidden.
- **Survival (dusty rose)** — hydration, food, meds, and high-consequence deadlines only. Not a failure state.

### Midnight sweep

At local midnight (WorkManager, plus a catch-up when the app opens) unchecked floats leave today’s board and return to the unassigned **pool** as `SWEPT_TO_BACKLOG`. Completed items leave the board quietly. Nothing is marked overdue. Nothing is scored.

## Architecture

Clean Architecture, MVI (`ViewModel` + `StateFlow`), Hilt, Room, WorkManager.

```
app/src/main/java/com/anchorfloat/app/
  domain/           EnergyLevel, TaskStatus, Anchor, FloatTask
                    EnergyVisibility, MidnightSweep, UnstuckCatalog, TransitionRamp
                    TimelineRepository (interface)
  data/             Room entities, DAOs (energy SQL + sweep transaction),
                    SeedData, TimelineRepositoryImpl
  di/               Database, dispatchers, TimeProvider, repository binds
  ui/
    theme/          Sage / slate / charcoal / amber / dusty rose + typography
    energy/         EnergyDialSelector
    timeline/       TimelineViewModel (MVI), TimelineScreen, ramp banner
    unstuck/        UnstuckOverlay
    MainActivity.kt
  worker/           SilentSweepWorker + SweepScheduler
  AnchorFloatApplication.kt
```

Intents: `SetEnergy`, `SelectAnchor`, `SelectTask`, `CompleteTask`, `StartTask`, `BreakSmaller`, `SwapTask`, `OpenUnstuck`, `DismissUnstuck`, `DismissRamp`.

## Design tokens

| Token | Hex |
|---|---|
| Sage Green | `#8A9A86` |
| Slate Grey | `#606C76` |
| Soft Charcoal | `#2B2D42` |
| Muted Amber | `#DDA15E` |
| Dusty Rose | `#BC6C25` |
| Paper | `#F3EEE4` |

Typography is **Atkinson Hyperlegible** (SIL Open Font License, bundled under `app/src/main/res/font/` and `app/src/main/assets/fonts/`).

## First run

Room seeds a sample day: Morning landing (08:00), Work shift (09:00), Lunch (13:00), Wind-down (18:00), with nested floats and a small pool. That data is local only.

## Not medical advice

Anchor & Float is scaffolding for organising a day. It does not diagnose, treat, or track medication.
