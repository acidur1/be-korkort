# Korkort — migration to React + Vite PWA

**Status:** Draft
**Date:** 2026-05-23
**Author:** Andreas Evekull
**Repo:** https://github.com/acidur1/be-korkort.git
**Netlify project:** be-korkortsfragor (existing, not yet linked to repo)

## Background

The current Korkort app is a single ~1450-line `index.html` with vanilla JS and Tailwind via CDN. It contains 135 BE driving licence questions split across four chapters, persists per-question results to `localStorage`, and has minimal PWA support (manual service worker + manifest).

Goals for this migration:

1. Rebuild as React 19 + Vite + locally-installed Tailwind, matching the stenstallet stack.
2. Improve mobile UX (one-question-at-a-time flow, dark mode, install prompts on both iOS and Android).
3. Add new study modes (random quiz, wrong-answer review).
4. Set up Netlify autodeploy from GitHub `main` branch — but only link once the app is ready, to avoid burning free-tier deploys.
5. **Critical constraint:** none of the 135 questions or their correct answers may change. The dataset is the heart of the app.

Out of scope for this iteration: new question content, account/cloud sync, timer/exam-mode, statistics dashboards.

## Stack

| Concern | Choice |
|---------|--------|
| Framework | React 19 (matching stenstallet) |
| Bundler / dev server | Vite 8 |
| Styling | Tailwind CSS (PostCSS plugin, **not** CDN) |
| State | Local component state + a `useLocalStorage` hook. No Redux/Zustand. |
| Routing | None — `screen` state in `App.jsx` switches between three views |
| PWA | `vite-plugin-pwa` (Workbox-generated service worker, manifest) |
| Linting | ESLint 9, same config as stenstallet |
| Tests | Vitest for data integrity + pure quiz logic |
| Hosting | Netlify static hosting + one Netlify Function (Gemini proxy) |
| AI explanations | Gemini via Netlify Function — API key as env var, never bundled |

## Folder structure

```
korkort/
├── archive/                  # gitignored — old index.html as local reference
├── docs/
│   └── superpowers/specs/    # this file
├── netlify/
│   └── functions/
│       └── explain.js        # Gemini proxy
├── public/
│   ├── icon-192.png
│   ├── icon-512.png
│   └── favicon.svg
├── src/
│   ├── main.jsx              # entry → renders <App/>
│   ├── App.jsx               # top-level state, screen switch
│   ├── data/
│   │   ├── questions.js      # allQuizData — frozen, extracted verbatim
│   │   └── questions.test.js # integrity asserts
│   ├── hooks/
│   │   ├── useLocalStorage.js
│   │   ├── useTheme.js
│   │   └── useInstallPrompt.js
│   ├── lib/
│   │   ├── quizState.js      # pure session/answer functions
│   │   ├── quizState.test.js
│   │   └── explain.js        # client wrapper around /.netlify/functions/explain
│   ├── views/
│   │   ├── StartScreen.jsx
│   │   ├── QuizSession.jsx
│   │   └── ResultsScreen.jsx
│   └── components/
│       ├── QuestionCard.jsx
│       ├── AnswerOption.jsx
│       ├── ProgressDots.jsx
│       ├── ExplainSection.jsx
│       ├── ThemeToggle.jsx
│       └── InstallBanner.jsx
├── index.html                # minimal Vite template
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.js
├── netlify.toml
├── package.json
└── .gitignore                # includes /archive
```

### Module responsibilities

- **`src/data/questions.js`** — single source of truth for quiz content. Exported as `export const allQuizData`. Never imported anywhere except `quizState.js`, tests, and the start screen (for counts).
- **`src/lib/quizState.js`** — pure functions: `createSession(mode, allQuizData, savedResults)`, `recordAnswer(session, questionId, answer)`, `getWrongQuestions(savedResults, allQuizData)`. No React, no DOM, no storage. Trivially testable.
- **`src/hooks/useLocalStorage.js`** — generic key/value hook that mirrors localStorage to React state. Used for `quizResults` and `theme`.
- **`src/views/*`** — receive props, render UI, dispatch callbacks. No direct localStorage access.
- **`src/components/*`** — leaf components, each under ~150 lines. AnswerOption renders both single-choice and multi-choice via a `mode` prop.

## Data preservation

The 135 questions are extracted **verbatim** from `archive/index.html` into `src/data/questions.js`. The data shape is frozen:

```js
{
  chapter: string,
  questions: [
    {
      id: number,        // unique across all chapters
      text: string,
      options: string[],
      correct: string[], // always an array — single-choice has length 1
      imageUrl?: string  // present on a small number of road-sign questions
    }
  ]
}
```

`src/data/questions.test.js` (Vitest) asserts on every test run:

- Total question count is exactly 135
- All `id` values are unique across the whole dataset
- Every `correct[]` is a non-empty subset of the matching `options[]`
- No `text`, `options[i]`, or `correct[i]` is empty or whitespace-only
- Chapter names are unique

These same checks run as a lightweight runtime assertion in `main.jsx` under `import.meta.env.DEV`, so a corruption is loud during local development too.

If a test fails, the build fails — Netlify will refuse to deploy a corrupt dataset.

## State model

Three layers, separated cleanly:

```
┌─────────────────────────────────────────────┐
│ Persisted (localStorage)                    │
│  - quizResults  (schema unchanged from old) │
│  - theme        ('light' | 'dark' | 'auto') │
│  - installBannerDismissed                   │
└─────────────────────────────────────────────┘
              ▲
              │ useLocalStorage hook
              ▼
┌─────────────────────────────────────────────┐
│ App state (App.jsx, useState)               │
│  - screen     ('start' | 'quiz' | 'results')│
│  - session    (current quiz session or null)│
│  - quizResults (mirror of storage)          │
└─────────────────────────────────────────────┘
              ▲
              │ props + callbacks
              ▼
┌─────────────────────────────────────────────┐
│ View components (pure renderers)            │
└─────────────────────────────────────────────┘
```

### `quizResults` schema (unchanged for backwards compatibility)

```js
{
  '<chapter name>': {
    score: number,        // count of correct answers
    total: number,        // total questions in chapter
    answered: number,     // count of answered questions
    questions: {
      [questionId]: {
        answered: true,
        isCorrect: boolean,
        selectedAnswer?: string,    // single-choice
        selectedAnswers?: string[]  // multi-choice
      }
    }
  }
}
```

Keeping this schema means an existing user with saved progress (on the same origin) loads in seamlessly.

### `session` schema (new)

```js
{
  mode: 'chapter' | 'all' | 'random' | 'wrong-only',
  questions: Question[],   // ordered list pulled from allQuizData
  currentIndex: number,
  // No need to track per-question state here — answers write straight to quizResults
}
```

Session ends when `currentIndex === questions.length`. App.jsx then transitions `screen` to `'results'`.

**Random mode:** 30 questions sampled without replacement from `allQuizData`. The session is purely ephemeral — answers in random mode do **not** write to `quizResults` (so they don't affect per-chapter progress or completion counts). Results are shown at the end of the session and then discarded. No resume.

**Wrong-only mode:** session questions are computed from `quizResults` — every question where `isCorrect === false`. Answering correctly in this mode updates `quizResults`, so the question naturally drops out of the wrong-only pool next time.

## UX flows

### Start screen

- Tema-toggle (sun/moon/auto icon) top-right
- Primary button: "Hela quizet (N/135)"
- Secondary buttons (only when relevant):
  - "🎲 Slumpat (30 frågor)"
  - "🔁 Öva fel (N frågor)" — hidden if zero wrong answers
- Per-chapter buttons with progress count, green when complete
- Total score line + "Rensa sparade resultat" link
- Install banner (iOS instructions or Android `beforeinstallprompt` button) if applicable and not dismissed

### Quiz session (one question at a time)

- Top bar: "← Avbryt" + progress dots + "N / total"
- Question text
- Options as tappable cards:
  - **Single-choice:** tap = submit immediately
  - **Multi-choice:** tap toggles selection; primary "Svara (N valda)" button submits
- After submit:
  - Picked option(s) coloured green/red
  - Correct option(s) highlighted green
  - Inline feedback line
  - "Förklaring ✨" expandable section (calls Gemini proxy)
  - Primary button: "Nästa fråga →" (or "Visa resultat →" on last question)
- Enter / Space triggers primary button on desktop

### Avbryt + resume

When the user taps "Avbryt", the session is dropped (answers already recorded in `quizResults` stay). When they re-enter the same chapter or "Hela quizet", `createSession` builds the session and sets `currentIndex` to the first question that has no entry in `quizResults`. They resume where they left off.

For random and wrong-only modes there is no resume — entering them always starts a fresh session. (Random mode doesn't write to `quizResults` at all; wrong-only sessions are derived from `quizResults` each time so the question list itself reflects current state.)

### Results screen

- Big total: "X av Y rätt"
- Per-chapter breakdown
- Buttons:
  - "Tillbaka till menyn"
  - "Öva fel-frågor från detta pass" (if any were wrong in this session)

### Dark mode

- Three states: `light`, `dark`, `auto` (uses `prefers-color-scheme`).
- `useTheme` sets/removes `class="dark"` on `<html>`.
- Tailwind `dark:` variants on every colour.
- Toggle button cycles through the three states.

### Install prompts

- **iOS:** existing banner pattern ("⎋ Dela → Lägg till på hemskärmen"), shown if `isIos && !isInStandaloneMode && !dismissed`.
- **Android / Chrome:** `useInstallPrompt` listens for `beforeinstallprompt`, stashes the event, exposes a `prompt()` function. A discrete "Installera appen" button appears when the event has fired. Disappears on `appinstalled` event.
- Both dismissals persist via `localStorage`.

## AI explanations (Gemini proxy)

Architecture decouples the client from any particular AI provider:

```
[Client]                         [Netlify Function]              [LLM provider]
ExplainSection ─POST /.netlify── netlify/functions/explain.js ── (Gemini / Claude / …)
               functions/explain                ▲
                                                │
                                  reads GEMINI_API_KEY from env
```

- Client (`lib/explain.js`) sends `{ question, options, correct, selected }` as JSON.
- Function calls the LLM, returns plain text or `{ error: '...' }`.
- If `GEMINI_API_KEY` is missing or invalid, function returns HTTP 503 with a clear message. Client shows: "AI-förklaring inte tillgänglig just nu."
- Switching providers later is a single-file change. The API key is never bundled into the static frontend.

The "Förklaring ✨" button is hidden until the user has submitted an answer for that question.

## Build, deploy, and hosting

### `netlify.toml`

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "no-cache"

[functions]
  directory = "netlify/functions"
```

### Linking Netlify (deferred)

The existing Netlify project `be-korkortsfragor` will **not** be linked to the GitHub repo until the user signals the app is ready. Until then, all development happens locally — pushes to GitHub are fine (Netlify won't trigger builds without a link). This preserves the free-tier build minutes.

When ready, in Netlify UI:
1. Site settings → Build & deploy → Link repository → `acidur1/be-korkort`, branch `main`
2. Build settings auto-detected from `netlify.toml`
3. Environment variables → add `GEMINI_API_KEY` (or whatever provider key is current)

### Git

- Local branch is currently `master` with no commits. Rename to `main` to match stenstallet and GitHub default before the first push.
- `.gitignore` includes `/archive`, `/dist`, `/node_modules`, `/.netlify`, standard Node ignores.

## Migration plan

The plan below is the development order. Each step is a buildable, runnable state — no half-finished commits land. Commit granularity is approximate; combine where they're tiny.

1. **Archive the old app.** Create `/archive` and move `index.html`, `sw.js`, `manifest.json`, `icon.svg` into it. Add `.gitignore` with `/archive`. (Archive directory exists only on disk, never in git.)
2. **Scaffold the new stack.** `package.json`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js`, `eslint.config.js`, `index.html` template, minimal `src/main.jsx` + `src/App.jsx`. `npm run dev` shows a Hello World. Initial commit (this is the first commit in the new repo).
3. **Extract questions data.** `src/data/questions.js` + `src/data/questions.test.js`. Vitest set up. Tests pass. Runtime assert wired in `main.jsx`.
4. **Pure quiz logic.** `src/lib/quizState.js` + tests for `createSession`, `recordAnswer`, `getWrongQuestions`.
5. **Persistence + start screen.** `useLocalStorage`, `StartScreen.jsx`. Chapter buttons render but don't start anything yet (or start a stub session).
6. **Quiz session + question card.** `QuizSession.jsx`, `QuestionCard.jsx`, `AnswerOption.jsx`, `ProgressDots.jsx`. Both single- and multi-choice flows work. Answers persist. Resume works.
7. **Results screen.** `ResultsScreen.jsx`. End-of-session flow complete.
8. **Dark mode.** `useTheme`, `ThemeToggle.jsx`. Tailwind `dark:` classes applied.
9. **Random + wrong-only modes.** Extend `quizState.js`, add buttons to start screen.
10. **PWA: manifest, service worker, install prompts.** `vite-plugin-pwa` config, `useInstallPrompt`, `InstallBanner.jsx`. New icons in `public/`.
11. **Netlify config + explain function stub.** `netlify.toml`, `netlify/functions/explain.js` returning 503 when no key is configured.
12. **Wire up the explain button.** `ExplainSection.jsx`, `lib/explain.js`. Graceful fallback when function returns 503.
13. **Rename branch to `main` and push to GitHub.** (Can happen earlier — anywhere from step 2 onwards — without triggering Netlify.)
14. **Link Netlify when user signals ready.** Add env var. Verify first deploy preview. Promote to production.

## Verification

Three layers of confidence that nothing has regressed:

1. **Automated data integrity.** `src/data/questions.test.js` + runtime asserts in dev mode. The build fails if the dataset is corrupt.
2. **Side-by-side visual diff.** During development, open `archive/index.html` directly in a browser alongside `npm run dev`. Walk through the first 5 questions of each chapter; pay special attention to the multi-choice questions (chapter 1 questions 12, 13, 14, 17, 18, and similar across other chapters). Confirm:
   - Question text matches exactly
   - Options match exactly (text and order)
   - Correct answers match exactly
   - Feedback shown after answering matches
3. **Post-deploy smoke test.** Once Netlify is linked and a deploy preview exists, install the PWA on an iPhone and an Android device. Verify offline behaviour, install banner behaviour, and one full chapter run-through on each.

## Open decisions

- **AI provider.** The currently-embedded Gemini key may be expired or replaced. The design assumes Gemini-via-proxy as the default, but the function is structured so any provider (current Gemini, newer Google models, Anthropic Claude) can be swapped in with a single-file change. Decision can be deferred until after the app is otherwise complete.

## Non-goals (explicit)

- No account system, no cloud sync, no leaderboard.
- No timer / exam mode.
- No statistics dashboards beyond the per-chapter scores already shown.
- No editing of question content. Adding new questions is out of scope for this migration; if needed later, append to `src/data/questions.js`.
- No internationalisation — Swedish only.
