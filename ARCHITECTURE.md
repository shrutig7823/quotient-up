# Quotient Up — Architecture Plan (the app was first called "Summit"; "The Summit" is now only the final in-game challenge)

Source of truth: `Claude_Aptitude_Game_Master_Product_Technical_Brief.md`. Decisions agreed so far: **Expo (React Native + web preview), local-first for M1–M4, FastAPI + Postgres from M5.**

## Decisions log (from the owner's flow chart, approved)
- Onboarding = age group, reason for playing, daily practice goal.
- Home: coins top-left, profile icon top-right, **4 bottom tabs kept** (Journey, Arena, Learn, Profile).
- Each genre has its own terrain (fire, jungle, ice, desert, ocean, night city).
- Sign-up prompt after 5 completed levels (deferred auth).
- **Lives (3, refill every 5h) apply to Survival Rooms only**; normal levels are unlimited.
- **Summit needs both**: levels completed in a genre AND its Mastery Trial passed, for all six genres. Start at 10 levels/genre, grow toward 20.
- Coins can be spent on hints. Survival unlocks weekly; leaderboard sits in Arena.

- **Content v1 (question bank):** 240 authored genre questions + 20 Summit questions imported by `mobile/scripts/import-bank.mjs` into `src/content/bank.json` (stable ids, all `draft`, editorial difficulty). 20 levels per genre, 2 questions per level, 30/50/20 easy/medium/hard (levels 1-6 / 7-16 / 17-20).
- **Saved-progress migration:** state version 2. Old Level 1-10 progress is kept under `legacyProgress`, never reassigned to the new levels; XP and coins carry over.
- **Journey screen:** one fixed screen (header, small Summit, six branch buttons), sized from the available space. Worlds (scenery) live inside each branch.
- **Generated questions:** every level = 2 authored + 3 generated (exam-style A-D). Generators live in `mobile/src/content/gen/` (one file per world), seeded by `(genre, level, slot)` so a level always shows the same questions. Each draft carries an independent cross-check; a draft that fails it is discarded, never shown. `tests/generators.test.ts` runs every generator at every difficulty over 300 seeds. Original content, not copied from any site or app.
- **Navigation now:** 3 bottom tabs (Journey, Arena, Learn). Profile is a full-screen page opened from the icon on the home page (the owner removed the Profile tab).
- **Learn: retry and progress:** every missed question can be retried as a fresh version (`variantOf` in `content/gen`): same kind of question, different numbers or set-up, same skill, id `RTY-<original>-v<n>` so it can always be rebuilt. Retries pay no XP/coins/stars; they feed mastery. The dashboard reports improvement only when a skill is 5+ points above where it first had an estimate.
- **Shuffle:** the home page Shuffle button opens a table (cards to the front, flip, shuffle, deal, one turned over at random). A one-line tooltip points at it once for people who seem unsure.
- **Not built yet:** diagram/drag renderers for visual topics (spatial, charts, family trees, maps), hints, review questions, a separate Mastery Trial pool, Summit mixed mode, server-side answer validation.

## 1. Product architecture summary
Guest-first mobile game. Six genre trails climb a mountain to a central Summit unlocked by six Mastery Trials. Learning loop = levels (3–5 interactive questions) → attempts logged → mastery computed from real events → Learn tab recommends fixes. Retention = Daily Challenge + streak, weekly Survival Room, stars/unlocks.
Layers: **UI (Expo Router screens)** → **game engine (pure TS: level runner, scoring, unlocks, mastery)** → **repository interface** → `LocalRepo` (AsyncStorage, M1–M4) / `ApiRepo` (FastAPI, M5+). Content is data (JSON), not code.

## 2. Route / navigation map
```
/ (splash) → /entry (Start Playing | Log in)
/onboarding/goal → /onboarding/time
/(tabs)/journey | arena | learn | profile
/genre/[slug]            trail
/level/[id]/intro | play | result
/daily  /daily/result
/arena/survival/[genre]  lobby → round → eliminated → results
/boss/[genre]   /summit/unlock   /summit/path
```
Four bottom tabs only (Journey, Arena, Learn, Profile).

## 3. Core user-flow
Open → Start Playing (guest id created) → goal → daily time → Journey map → pick genre → trail → level intro → questions (renderer by type) → feedback → result (stars/XP/coins) → next node. After 4 levels: "Save progress?" → signup → guest migration. Six Mastery Trials passed → Summit unlock → mixed path → Infinite Peak.

## 4. Screen inventory
The 21 screens from brief §46. M1 builds: Splash, Entry, 2 onboarding, Journey, Genre trail, Level intro/question/feedback/result, Profile stub.

## 5. State inventory
- **Server-ish state (repo):** profile, wallet, level progress, attempts, mastery, daily results, room state, experiment assignments.
- **Client UI state (Zustand):** selected genre, active modal, current question index, unsaved answer, drag state, timers, reduced-motion/mute prefs.
Rule: UI never writes storage directly; it calls engine functions that go through the repo.

## 6. Data model
As brief §33 (users, genres, concepts, levels, questions, level_questions, user_level_progress, question_attempts, mastery, daily_challenges, survival_*, reward_transactions, experiments, assignments). M1–M4 mirrors the same shapes as TS types stored locally, so the Postgres migration is mechanical. Genres/concepts live in a config layer (not hard-coded names). Mastery is **derived** from `question_attempts`, never stored by hand.

## 7. API contract
As brief §34. Added: `Idempotency-Key` on attempt/complete/spend endpoints (duplicate reward/submission guard); server computes rewards and room progression (client is never authoritative for Survival Rooms).

## 8. Question-renderer architecture
`QuestionRenderer` switches on `question_type` → component. Each type ships `{ payloadSchema, validate(answer, payload) → {correct, detail}, Component }`. M2 types: **MultipleChoice, DragSequence (number series), BalanceRatio**. Malformed payload → error card + skip + event, never a crash. Validation is a pure function so it runs identically on device and server.

## 9. Analytics event map
Events from brief §27 through one `track(event, props)` function → local event table now, PostHog/custom endpoint later. Common props attached automatically (guest_id, session_id, experiment variants, timestamp).

## 10. Survival Room state machine
`SCHEDULED → LOBBY(open join) → ROUND_n_OPEN → ROUND_n_CLOSED(eliminate wrong; tie-break by time) → … → COMPLETED(split pool among survivors)`. Player: `JOINED → ALIVE → ELIMINATED(round, concept) | SURVIVOR`. Phase A is clearly labelled **simulated practice room** (no claim of live players); Phase B real async rooms; Phase C websockets.

## 11. MVP build plan
- **M1 Skeleton:** shell, guest, onboarding, map with 6 trails, one trail tappable. *(starting now)*
- **M2 Learning loop:** level engine, 3 renderers, stars, XP/coins, unlocks, Quant trail (10 levels).
- **M3 Intelligence:** attempt log, mastery, Learn tab.
- **M4 Retention:** Daily Challenge, streak, share card; Logic trail (10 levels).
- **M5 Backend:** FastAPI + Postgres, auth, guest migration.
- **M6 Competition:** Survival Room prototype + elimination diagnostics.
- **M7 Summit:** Mastery Trial, fragments, unlock. **M8** analytics dashboard/experiments. **M9** AI pipeline.

## 12. Repository structure
```
aptitude app/
  ARCHITECTURE.md
  app/            Expo Router routes
  src/
    config/       genres.ts, economy.ts, starRules.ts
    content/      quant/*.json, logic/*.json
    engine/       level.ts scoring.ts unlocks.ts mastery.ts
    questions/    registry.ts, MultipleChoice/, DragSequence/, BalanceRatio/
    data/         repo.ts (interface), localRepo.ts, apiRepo.ts
    analytics/    track.ts events.ts
    state/        uiStore.ts
    ui/           theme, components, map art
  backend/        FastAPI (M5)
```

## 13. Technical risks
Drag/gesture question types on web vs native; map illustration effort; local→server migration conflicts; timer trust in Survival Rooms; question content volume/quality (20 levels × ~4 questions must be correct and unambiguous); Expo SDK churn.

## 14. Product risks
Quiz-with-skin feel if only MCQ; sparse content → quick boredom; empty-room feel in Survival Rooms without real users; mastery shown from too few attempts (show "not enough data" below a threshold); economy inflation.
