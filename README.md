# Quotient Up

**A game that turns aptitude practice into a daily climb.** Six illustrated worlds, 120 levels, a Learn tab that shows where you are improving, and fresh versions of the questions you miss.

> **Live demo: [quotient-up.netlify.app](https://quotient-up.netlify.app)** &nbsp;·&nbsp; Built with React Native (Expo), TypeScript, and a lot of tests.

## Why

Aptitude prep usually means opening a question bank, solving MCQs, seeing a score, and leaving. Quotient Up changes the loop: you climb through worlds, practise distinct skills, and the app uses your real answers to show what is weak, what is improving, and what to retry.

## What it does

- **Six worlds, one per skill area** — Quant, Logic, Data, Verbal, Spatial and Applied reasoning. Each opens into its own illustrated environment (tropical jungle, Amazon rainforest, crystal highlands, desert oasis, floating islands, volcanic wilderness) with a winding 20-level trail.
- **120 levels, 600 questions** — easy → medium → hard (30/50/20), five questions per level: two hand-authored plus three generated in exam style (A–D options).
- **Learn tab built on real data**
  - Mastery per skill, computed from your answers (replays count less, harder questions count more, old practice fades, and a skill shows "not enough data" rather than a made-up number).
  - **Try again**: every question you miss can be retried as a fresh version of the same kind (different numbers or set-up), tracked as _recovered_ once you get it right.
  - **Progress dashboard**: accuracy, mistakes recovered, and which skills improved, with before/after values.
- **"Can't decide?" shuffle** — the six world cards come to the front, flip, shuffle and one is dealt at random.
- **Guest-first**: no sign-up needed; progress is saved on the device with a versioned migration.
- Accessible by design: large touch targets, visible focus, labelled controls, reduced-motion support.

## Engineering highlights

- **Question generators with built-in verification.** 27 generators (percentages, time & work, coding-decoding, blood relations, Venn diagrams, grid routes, painted cubes, break-even, scheduling, syllogisms, …) produce unlimited, seeded, reproducible questions. Every draft carries an _independent cross-check_ (a second method, brute force, or exhaustive set models) and is discarded if it fails. A stress test runs every generator at every difficulty over 300 seeds.
- **Exact answer checking.** Fractions are compared as exact rationals (7.2 = 36/5, no tolerance); ordered lists, coordinates, times and aliases each have their own rules. No `eval`.
- **Pure, tested game logic.** Scoring, rewards (replays can't farm coins), mastery, retry families, improvement detection and trail geometry are plain functions with unit tests (38 tests).
- **Illustrated scenes drawn in code.** Layered SVG worlds, landmarks and animated effects (mist, fireflies, waterfalls) share one coordinate system so scenery, trail and tap targets stay aligned at any size.
- **Responsive without scrolling.** The home screen sizes itself from the space actually available and fits phones from 360×640 up to desktop.

## Tech

React Native · Expo (Router, web + native) · TypeScript (strict) · Zustand (persisted) · Reanimated · react-native-svg · Node test runner

## Run it

```bash
cd mobile
npm install
npm run web        # or: npx expo start  (then scan the QR code with Expo Go)
npm test           # 38 tests
npm run build:web  # static site in mobile/dist
```

## Honest limits (v1)

- Progress is saved on the device only; accounts and sync are not built yet. The Mastery Trial, Daily Challenge, Survival Rooms and Summit mixed mode are planned, not built.
- Visual topics (diagrams, drag interactions, family trees) are currently text or typed/selected answers.
- Questions are original and the difficulty is editorial, not calibrated on learner data. Answers are validated on the device, so this is a practice app, not a scored exam.

## Docs

See [ARCHITECTURE.md](ARCHITECTURE.md) for the product decisions and design notes.
