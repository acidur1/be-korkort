# Korkort React+Vite Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate Korkort from a single-file vanilla JS PWA to a React 19 + Vite + Tailwind v4 PWA with new UX (one-question-at-a-time, dark mode, random/wrong-only modes, install prompts on Android), preserving all 135 quiz questions verbatim and preparing for Netlify autodeploy.

**Architecture:** Single-page React app with no router. `App.jsx` holds top-level state (`screen`, `session`, `quizResults`) and renders one of three views. Quiz data lives in a frozen module separate from any rendering logic. Pure quiz-state functions are testable in isolation via Vitest. A Netlify Function proxies AI explanation calls so the API key is never bundled into the client.

**Tech Stack:** React 19 · Vite 8 · Tailwind CSS v4 · Vitest · vite-plugin-pwa · Netlify Functions

**Reference spec:** `docs/superpowers/specs/2026-05-23-react-vite-migration-design.md`

**Working directory:** `c:/For_fun/korkort/` (all paths in this plan are relative to this directory unless noted)

---

## File Inventory

| Path | Created in | Purpose |
|------|-----------|---------|
| `.gitignore` | Task 1 | ignores `/archive`, `/node_modules`, `/dist`, `/.netlify` |
| `archive/` | Task 1 | gitignored snapshot of old single-file app |
| `package.json` | Task 2 | deps + scripts |
| `vite.config.js` | Task 2 | Vite + React + Tailwind + PWA plugins |
| `eslint.config.js` | Task 2 | linting (matches stenstallet) |
| `index.html` | Task 2 | Vite entry template |
| `src/main.jsx` | Task 2 | React entry + data-integrity assert |
| `src/App.jsx` | Task 2 → 6 → 7 → 8 | screen switch, top state |
| `src/index.css` | Task 2 | `@import "tailwindcss";` + dark variant |
| `vitest.config.js` | Task 3 | test runner config |
| `src/data/questions.js` | Task 3 | extracted `allQuizData` (frozen) |
| `src/data/questions.test.js` | Task 3 | integrity asserts |
| `src/lib/quizState.js` | Task 4 | pure session/answer functions |
| `src/lib/quizState.test.js` | Task 4 | tests for the above |
| `src/hooks/useLocalStorage.js` | Task 5 | localStorage-backed React state |
| `src/views/StartScreen.jsx` | Task 6 | chapter/mode selection |
| `src/components/ProgressDots.jsx` | Task 7 | session progress UI |
| `src/components/AnswerOption.jsx` | Task 7 | single + multi-choice option |
| `src/components/QuestionCard.jsx` | Task 7 | question + options + feedback |
| `src/views/QuizSession.jsx` | Task 7 | one-question-at-a-time flow |
| `src/views/ResultsScreen.jsx` | Task 8 | end-of-session summary |
| `src/hooks/useTheme.js` | Task 9 | light/dark/auto theme |
| `src/components/ThemeToggle.jsx` | Task 9 | toggle button |
| (StartScreen updates) | Task 10 | adds Random + Wrong-only buttons |
| `public/icon-192.png`, `icon-512.png`, `favicon.svg` | Task 11 | PWA icons |
| (vite.config.js updates) | Task 11 | PWA manifest |
| `src/hooks/useInstallPrompt.js` | Task 12 | beforeinstallprompt + iOS detect |
| `src/components/InstallBanner.jsx` | Task 12 | iOS instructions / Android prompt |
| `netlify.toml` | Task 13 | build + redirects + headers + functions dir |
| `netlify/functions/explain.js` | Task 13 | Gemini proxy (returns 503 if key missing) |
| `src/lib/explain.js` | Task 14 | client wrapper for `/.netlify/functions/explain` |
| `src/components/ExplainSection.jsx` | Task 14 | explain button + result UI |

---

## Task 1: Archive old app and add .gitignore

**Files:**
- Create: `.gitignore`
- Move (to local disk, not git): `index.html`, `sw.js`, `manifest.json`, `icon.svg`, `desktop.ini` → `archive/`

- [ ] **Step 1: Create archive directory and move old files**

PowerShell:
```powershell
New-Item -ItemType Directory -Path archive -Force
Move-Item -Path index.html,sw.js,manifest.json,icon.svg,desktop.ini -Destination archive\
```

Verify with `Get-ChildItem archive` — should show the 5 files.

- [ ] **Step 2: Create `.gitignore`**

```
# Local-only reference to old single-file app
/archive

# Dependencies
/node_modules

# Build output
/dist
/dist-ssr

# Netlify
/.netlify

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Editor / OS
.DS_Store
.vscode/*
!.vscode/extensions.json
.idea
Thumbs.db
desktop.ini
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
```

- [ ] **Step 3: Verify archive is ignored**

Run: `git status`

Expected: `archive/` does NOT appear in untracked files. Only `.gitignore` is untracked.

- [ ] **Step 4: Commit**

```bash
git add .gitignore
git commit -m "Add .gitignore (archive old single-file app locally)"
```

---

## Task 2: Scaffold Vite + React + Tailwind v4 + ESLint

**Files:**
- Create: `package.json`, `vite.config.js`, `eslint.config.js`, `index.html`, `src/main.jsx`, `src/App.jsx`, `src/index.css`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "korkort",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^19.2.4",
    "react-dom": "^19.2.4"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.4",
    "@tailwindcss/vite": "^4.1.0",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.1",
    "eslint": "^9.39.4",
    "eslint-plugin-react-hooks": "^7.0.1",
    "eslint-plugin-react-refresh": "^0.5.2",
    "globals": "^17.4.0",
    "jsdom": "^25.0.0",
    "tailwindcss": "^4.1.0",
    "vite": "^8.0.4",
    "vite-plugin-pwa": "^0.21.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Create `vite.config.js`**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
```

(PWA plugin is added later in Task 11 so we can verify each step in isolation.)

- [ ] **Step 3: Create `eslint.config.js`** (mirrors stenstallet)

```js
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'archive', 'netlify/functions']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
])
```

- [ ] **Step 4: Create `index.html` (Vite template)**

```html
<!doctype html>
<html lang="sv">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#2563eb" />
    <title>BE-Körkortsfrågor</title>
  </head>
  <body class="bg-gray-100 dark:bg-gray-900">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create `src/index.css`**

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

html, body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  -webkit-tap-highlight-color: transparent;
}

body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}

button {
  min-height: 44px;
}
```

(The `@custom-variant dark` line enables `dark:` Tailwind classes via `.dark` class on `<html>`, the strategy we use in Task 9.)

- [ ] **Step 6: Create `src/main.jsx`**

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 7: Create `src/App.jsx`** (placeholder)

```jsx
export default function App() {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 text-gray-800 dark:text-gray-100">
      <header className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold">BE-Körkortsfrågor</h1>
      </header>
      <p>App scaffold running.</p>
    </div>
  )
}
```

- [ ] **Step 8: Install dependencies**

```bash
npm install
```

Expected: no errors. `node_modules/` and `package-lock.json` created.

- [ ] **Step 9: Run dev server and verify**

```bash
npm run dev
```

Open `http://localhost:5173` in a browser. Expected: "BE-Körkortsfrågor" heading and "App scaffold running." text. Stop server with Ctrl+C.

- [ ] **Step 10: Run lint to confirm clean baseline**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 11: Commit**

```bash
git add package.json package-lock.json vite.config.js eslint.config.js index.html src/
git commit -m "Scaffold Vite + React 19 + Tailwind v4"
```

---

## Task 3: Extract questions data with integrity tests

**Files:**
- Create: `vitest.config.js`, `src/data/questions.js`, `src/data/questions.test.js`
- Modify: `src/main.jsx` (add runtime assert)

- [ ] **Step 1: Create `vitest.config.js`**

```js
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: false,
  },
})
```

- [ ] **Step 2: Write the failing integrity test**

Create `src/data/questions.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { allQuizData } from './questions.js'

describe('allQuizData', () => {
  it('has exactly 135 questions across all chapters', () => {
    const total = allQuizData.reduce((sum, ch) => sum + ch.questions.length, 0)
    expect(total).toBe(135)
  })

  it('has unique chapter names', () => {
    const names = allQuizData.map(c => c.chapter)
    expect(new Set(names).size).toBe(names.length)
  })

  it('has unique question ids across all chapters', () => {
    const ids = allQuizData.flatMap(c => c.questions.map(q => q.id))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every correct[] is a non-empty subset of options[]', () => {
    for (const chapter of allQuizData) {
      for (const q of chapter.questions) {
        expect(q.correct.length, `q${q.id} has empty correct[]`).toBeGreaterThan(0)
        for (const c of q.correct) {
          expect(q.options, `q${q.id} correct "${c}" not in options`).toContain(c)
        }
      }
    }
  })

  it('no question has empty text, options, or correct strings', () => {
    for (const chapter of allQuizData) {
      for (const q of chapter.questions) {
        expect(q.text.trim()).not.toBe('')
        expect(q.options.length).toBeGreaterThan(1)
        for (const opt of q.options) expect(opt.trim()).not.toBe('')
        for (const c of q.correct) expect(c.trim()).not.toBe('')
      }
    }
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npm test -- src/data/questions.test.js
```

Expected: FAIL with module-not-found for `./questions.js`.

- [ ] **Step 4: Extract `allQuizData` from old code**

Open `archive/index.html` and locate the `const allQuizData = [` line (around line 124) and its closing `];` (around line 1080).

Create `src/data/questions.js`:

```js
// Quiz data — extracted verbatim from archive/index.html.
// Do NOT edit question text, options, or correct answers without coordinating
// with src/data/questions.test.js. This is the heart of the app.

export const allQuizData = [
  // PASTE everything from the opening `{` of the first chapter object
  // to the closing `}` of the last chapter object, exactly as it appears
  // in archive/index.html
]
```

Then paste the array contents verbatim (chapters and questions) between the brackets. Do not reformat the strings; do not change `correct` from arrays to scalars.

- [ ] **Step 5: Run tests to verify all pass**

```bash
npm test
```

Expected: all 5 tests pass. If any fail, the extraction has a bug — fix until green before proceeding.

- [ ] **Step 6: Add runtime assertion in `src/main.jsx`**

Modify `src/main.jsx`:

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { allQuizData } from './data/questions.js'
import './index.css'

if (import.meta.env.DEV) {
  const total = allQuizData.reduce((s, c) => s + c.questions.length, 0)
  console.assert(total === 135, `Expected 135 questions, got ${total}`)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 7: Run dev server and confirm no console assertion**

```bash
npm run dev
```

Open browser DevTools console. Expected: no `Assertion failed` messages. Stop server.

- [ ] **Step 8: Commit**

```bash
git add vitest.config.js src/data/ src/main.jsx
git commit -m "Extract questions data with integrity tests"
```

---

## Task 4: Pure quiz state logic with tests

**Files:**
- Create: `src/lib/quizState.js`, `src/lib/quizState.test.js`

- [ ] **Step 1: Write failing tests for `createSession`, `recordAnswer`, `isCorrect`, `getWrongQuestions`**

Create `src/lib/quizState.test.js`:

```js
import { describe, it, expect } from 'vitest'
import {
  createSession,
  recordAnswer,
  isAnswerCorrect,
  getWrongQuestions,
  initialResults,
} from './quizState.js'
import { allQuizData } from '../data/questions.js'

const firstChapter = allQuizData[0].chapter

describe('initialResults', () => {
  it('builds empty results keyed by chapter', () => {
    const r = initialResults(allQuizData)
    expect(Object.keys(r)).toHaveLength(allQuizData.length)
    for (const ch of allQuizData) {
      expect(r[ch.chapter]).toEqual({
        score: 0,
        total: ch.questions.length,
        answered: 0,
        questions: {},
      })
    }
  })
})

describe('createSession', () => {
  it('chapter mode includes only that chapter and starts at index 0 when no progress', () => {
    const s = createSession('chapter', allQuizData, initialResults(allQuizData), firstChapter)
    expect(s.questions.length).toBe(allQuizData[0].questions.length)
    expect(s.currentIndex).toBe(0)
    expect(s.mode).toBe('chapter')
  })

  it('chapter mode resumes at first unanswered question', () => {
    const results = initialResults(allQuizData)
    const ch = results[firstChapter]
    ch.questions[allQuizData[0].questions[0].id] = { answered: true, isCorrect: true, selectedAnswer: 'x' }
    ch.questions[allQuizData[0].questions[1].id] = { answered: true, isCorrect: false, selectedAnswer: 'y' }
    ch.answered = 2
    const s = createSession('chapter', allQuizData, results, firstChapter)
    expect(s.currentIndex).toBe(2)
  })

  it('all mode includes all 135 questions', () => {
    const s = createSession('all', allQuizData, initialResults(allQuizData))
    expect(s.questions.length).toBe(135)
  })

  it('random mode includes 30 questions, all distinct', () => {
    const s = createSession('random', allQuizData, initialResults(allQuizData))
    expect(s.questions.length).toBe(30)
    const ids = s.questions.map(q => q.id)
    expect(new Set(ids).size).toBe(30)
  })

  it('wrong-only mode includes only previously-wrong questions', () => {
    const results = initialResults(allQuizData)
    const q0 = allQuizData[0].questions[0]
    const q1 = allQuizData[0].questions[1]
    results[firstChapter].questions[q0.id] = { answered: true, isCorrect: false, selectedAnswer: 'x' }
    results[firstChapter].questions[q1.id] = { answered: true, isCorrect: true, selectedAnswer: 'y' }
    const s = createSession('wrong-only', allQuizData, results)
    expect(s.questions).toHaveLength(1)
    expect(s.questions[0].id).toBe(q0.id)
  })
})

describe('isAnswerCorrect', () => {
  it('single-choice matches when selection equals the one correct value', () => {
    const q = { correct: ['B'], options: ['A','B','C'] }
    expect(isAnswerCorrect(q, 'B')).toBe(true)
    expect(isAnswerCorrect(q, 'A')).toBe(false)
  })

  it('multi-choice requires exact set match', () => {
    const q = { correct: ['B','D'], options: ['A','B','C','D'] }
    expect(isAnswerCorrect(q, ['B','D'])).toBe(true)
    expect(isAnswerCorrect(q, ['D','B'])).toBe(true)
    expect(isAnswerCorrect(q, ['B'])).toBe(false)
    expect(isAnswerCorrect(q, ['B','C','D'])).toBe(false)
  })
})

describe('recordAnswer', () => {
  it('writes single-choice answer and updates counts', () => {
    const results = initialResults(allQuizData)
    const q = allQuizData[0].questions[0]
    const next = recordAnswer(results, firstChapter, q, q.correct[0])
    expect(next[firstChapter].questions[q.id]).toEqual({
      answered: true,
      isCorrect: true,
      selectedAnswer: q.correct[0],
    })
    expect(next[firstChapter].answered).toBe(1)
    expect(next[firstChapter].score).toBe(1)
  })

  it('writes multi-choice answer with selectedAnswers array', () => {
    const results = initialResults(allQuizData)
    // find a known multi-choice question (q12 in chapter 1 has multiple correct answers)
    const q = allQuizData[0].questions.find(qq => qq.correct.length > 1)
    expect(q).toBeDefined()
    const next = recordAnswer(results, firstChapter, q, q.correct)
    expect(next[firstChapter].questions[q.id].selectedAnswers).toEqual(q.correct)
    expect(next[firstChapter].questions[q.id].isCorrect).toBe(true)
    expect(next[firstChapter].score).toBe(1)
  })

  it('does not double-count if same question is answered twice', () => {
    const results = initialResults(allQuizData)
    const q = allQuizData[0].questions[0]
    const r1 = recordAnswer(results, firstChapter, q, q.options[0])
    const r2 = recordAnswer(r1, firstChapter, q, q.correct[0])
    expect(r2[firstChapter].answered).toBe(1)
    // score reflects latest answer
    expect(r2[firstChapter].score).toBe(1)
  })
})

describe('getWrongQuestions', () => {
  it('returns flat list of all questions with isCorrect=false', () => {
    const results = initialResults(allQuizData)
    const q0 = allQuizData[0].questions[0]
    const q1 = allQuizData[1].questions[0]
    results[allQuizData[0].chapter].questions[q0.id] = { answered: true, isCorrect: false, selectedAnswer: 'x' }
    results[allQuizData[1].chapter].questions[q1.id] = { answered: true, isCorrect: false, selectedAnswer: 'y' }
    const wrong = getWrongQuestions(results, allQuizData)
    expect(wrong).toHaveLength(2)
    expect(wrong.map(q => q.id).sort()).toEqual([q0.id, q1.id].sort())
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- src/lib/quizState.test.js
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/quizState.js`**

```js
export function initialResults(allQuizData) {
  const r = {}
  for (const ch of allQuizData) {
    r[ch.chapter] = { score: 0, total: ch.questions.length, answered: 0, questions: {} }
  }
  return r
}

export function isAnswerCorrect(question, answer) {
  if (Array.isArray(answer)) {
    if (answer.length !== question.correct.length) return false
    return answer.every(a => question.correct.includes(a))
  }
  return question.correct.length === 1 && question.correct[0] === answer
}

export function recordAnswer(results, chapterName, question, answer) {
  const next = { ...results, [chapterName]: { ...results[chapterName] } }
  const ch = next[chapterName]
  ch.questions = { ...ch.questions }

  const wasAnswered = Boolean(ch.questions[question.id]?.answered)
  const wasCorrect = Boolean(ch.questions[question.id]?.isCorrect)
  const correct = isAnswerCorrect(question, answer)

  ch.questions[question.id] = Array.isArray(answer)
    ? { answered: true, isCorrect: correct, selectedAnswers: answer }
    : { answered: true, isCorrect: correct, selectedAnswer: answer }

  if (!wasAnswered) ch.answered += 1
  if (wasCorrect && !correct) ch.score -= 1
  if (!wasCorrect && correct) ch.score += 1

  return next
}

export function getWrongQuestions(results, allQuizData) {
  const wrong = []
  for (const ch of allQuizData) {
    const rch = results[ch.chapter]
    if (!rch) continue
    for (const q of ch.questions) {
      if (rch.questions[q.id]?.answered && !rch.questions[q.id].isCorrect) {
        wrong.push(q)
      }
    }
  }
  return wrong
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function createSession(mode, allQuizData, results, chapterName = null) {
  let questions = []
  let currentIndex = 0

  if (mode === 'chapter') {
    const ch = allQuizData.find(c => c.chapter === chapterName)
    questions = ch ? [...ch.questions] : []
    const rch = results[chapterName]
    if (rch) {
      const idx = questions.findIndex(q => !rch.questions[q.id]?.answered)
      currentIndex = idx === -1 ? questions.length : idx
    }
  } else if (mode === 'all') {
    questions = allQuizData.flatMap(c => c.questions)
    const idx = questions.findIndex(q => {
      const chapter = allQuizData.find(c => c.questions.some(qq => qq.id === q.id))
      return !results[chapter.chapter]?.questions[q.id]?.answered
    })
    currentIndex = idx === -1 ? questions.length : idx
  } else if (mode === 'random') {
    questions = shuffle(allQuizData.flatMap(c => c.questions)).slice(0, 30)
  } else if (mode === 'wrong-only') {
    questions = getWrongQuestions(results, allQuizData)
  }

  return { mode, questions, currentIndex, chapterName }
}

export function chapterForQuestion(allQuizData, questionId) {
  for (const ch of allQuizData) {
    if (ch.questions.some(q => q.id === questionId)) return ch.chapter
  }
  return null
}
```

- [ ] **Step 4: Run tests to verify all pass**

```bash
npm test
```

Expected: all tests pass (questions integrity + quizState).

- [ ] **Step 5: Commit**

```bash
git add src/lib/
git commit -m "Add pure quiz state logic with tests"
```

---

## Task 5: useLocalStorage hook

**Files:**
- Create: `src/hooks/useLocalStorage.js`

- [ ] **Step 1: Implement the hook**

```js
import { useEffect, useState } from 'react'

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key)
      return raw !== null ? JSON.parse(raw) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // quota exceeded or private mode — silently drop
    }
  }, [key, value])

  return [value, setValue]
}
```

- [ ] **Step 2: Verify lint passes**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/
git commit -m "Add useLocalStorage hook"
```

---

## Task 6: Start screen with persisted results

**Files:**
- Create: `src/views/StartScreen.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create `src/views/StartScreen.jsx`**

```jsx
export default function StartScreen({ allQuizData, quizResults, onStart, onClearResults }) {
  const totalAnswered = Object.values(quizResults).reduce((s, c) => s + c.answered, 0)
  const totalScore = Object.values(quizResults).reduce((s, c) => s + c.score, 0)
  const totalQuestions = Object.values(quizResults).reduce((s, c) => s + c.total, 0)
  const isAllDone = totalQuestions > 0 && totalAnswered === totalQuestions

  return (
    <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Välj ett kapitel att testa</h2>

      <div className="space-y-3">
        <button
          onClick={() => onStart('all')}
          className={`w-full font-semibold py-3 px-6 rounded-lg transition-colors ${
            isAllDone
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          Hela quizet ({totalAnswered}/{totalQuestions})
        </button>

        {allQuizData.map(ch => {
          const rch = quizResults[ch.chapter]
          const done = rch?.answered === ch.questions.length
          return (
            <button
              key={ch.chapter}
              onClick={() => onStart('chapter', ch.chapter)}
              className={`w-full font-semibold py-3 px-6 rounded-lg transition-colors ${
                done
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100'
              }`}
            >
              {ch.chapter} ({rch?.answered ?? 0}/{ch.questions.length})
            </button>
          )
        })}
      </div>

      {totalAnswered > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
          <p className="font-bold">Totalt: {totalScore} av {totalQuestions} rätt.</p>
          <button
            onClick={onClearResults}
            className="mt-4 text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            Rensa sparade resultat
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Update `src/App.jsx` to wire it up**

```jsx
import { useState } from 'react'
import { allQuizData } from './data/questions.js'
import { initialResults } from './lib/quizState.js'
import { useLocalStorage } from './hooks/useLocalStorage.js'
import StartScreen from './views/StartScreen.jsx'

export default function App() {
  const [quizResults, setQuizResults] = useLocalStorage('quizResults', initialResults(allQuizData))
  const [screen, setScreen] = useState('start')
  const [session, setSession] = useState(null)

  function handleStart(mode, chapterName = null) {
    // Wired up in Task 7
    console.log('start', mode, chapterName)
  }

  function handleClearResults() {
    setQuizResults(initialResults(allQuizData))
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 text-gray-800 dark:text-gray-100 min-h-screen">
      <header className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold">BE-Körkortsfrågor</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Testa dina kunskaper inom körkortsregler, fordonskännedom, last och körning med släp.
        </p>
      </header>

      {screen === 'start' && (
        <StartScreen
          allQuizData={allQuizData}
          quizResults={quizResults}
          onStart={handleStart}
          onClearResults={handleClearResults}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 3: Run dev server and verify visually**

```bash
npm run dev
```

Open `http://localhost:5173`. Expected:
- Header + intro text
- "Hela quizet (0/135)" primary button
- 4 chapter buttons with (0/X) counts
- No "Totalt" row yet (no answers saved)
- Click a chapter button → check console: `start chapter <name>`

Stop server.

- [ ] **Step 4: Commit**

```bash
git add src/views/ src/App.jsx
git commit -m "Add start screen with persisted results"
```

---

## Task 7: Quiz session — one question at a time

**Files:**
- Create: `src/components/ProgressDots.jsx`, `src/components/AnswerOption.jsx`, `src/components/QuestionCard.jsx`, `src/views/QuizSession.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create `src/components/ProgressDots.jsx`**

```jsx
export default function ProgressDots({ questions, currentIndex, results, chapterFor }) {
  return (
    <div className="flex flex-wrap gap-1 items-center">
      {questions.map((q, i) => {
        const chapter = chapterFor(q.id)
        const entry = results[chapter]?.questions[q.id]
        let cls = 'w-2 h-2 rounded-full border'
        if (i === currentIndex) {
          cls += ' bg-blue-600 border-blue-600'
        } else if (entry?.answered) {
          cls += entry.isCorrect ? ' bg-green-500 border-green-500' : ' bg-red-500 border-red-500'
        } else {
          cls += ' bg-transparent border-gray-400 dark:border-gray-500'
        }
        return <span key={q.id} className={cls} />
      })}
    </div>
  )
}
```

- [ ] **Step 2: Create `src/components/AnswerOption.jsx`**

```jsx
export default function AnswerOption({ option, mode, state, selected, onToggle, onPick, disabled }) {
  // state: 'unanswered' | 'correct' | 'incorrect' | 'reveal-correct'
  let cls = 'w-full text-left p-3 border rounded-lg transition-colors min-h-[44px] flex items-center gap-3 '
  if (state === 'correct') cls += 'bg-green-500 text-white border-green-600'
  else if (state === 'incorrect') cls += 'bg-red-500 text-white border-red-600'
  else if (state === 'reveal-correct') cls += 'bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100 border-green-500'
  else cls += 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 ' + (selected ? 'ring-2 ring-blue-500 ' : '')

  if (mode === 'multi') {
    return (
      <label className={cls + ' cursor-pointer'}>
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(option)}
          disabled={disabled}
          className="h-5 w-5 accent-blue-600"
        />
        <span>{option}</span>
      </label>
    )
  }

  return (
    <button type="button" disabled={disabled} onClick={() => onPick(option)} className={cls}>
      {option}
    </button>
  )
}
```

- [ ] **Step 3: Create `src/components/QuestionCard.jsx`**

```jsx
import { useState } from 'react'
import AnswerOption from './AnswerOption.jsx'
import { isAnswerCorrect } from '../lib/quizState.js'

export default function QuestionCard({ question, savedEntry, onAnswer }) {
  const isMulti = question.correct.length > 1
  const answered = Boolean(savedEntry?.answered)

  const initialSelected = answered
    ? (isMulti ? (savedEntry.selectedAnswers ?? []) : (savedEntry.selectedAnswer ? [savedEntry.selectedAnswer] : []))
    : []
  const [selected, setSelected] = useState(initialSelected)

  function toggle(opt) {
    if (answered) return
    setSelected(s => s.includes(opt) ? s.filter(o => o !== opt) : [...s, opt])
  }

  function pickSingle(opt) {
    if (answered) return
    setSelected([opt])
    onAnswer(opt)
  }

  function submitMulti() {
    if (answered || selected.length === 0) return
    onAnswer(selected)
  }

  function optionState(opt) {
    if (!answered) return 'unanswered'
    const selectedThis = selected.includes(opt)
    const isCorrectOpt = question.correct.includes(opt)
    if (isCorrectOpt && selectedThis) return 'correct'
    if (!isCorrectOpt && selectedThis) return 'incorrect'
    if (isCorrectOpt) return 'reveal-correct'
    return 'unanswered'
  }

  const correct = answered && isAnswerCorrect(question, isMulti ? selected : selected[0])

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Fråga {question.id}</p>
      <h3 className="text-lg font-semibold mb-4">{question.text}</h3>

      <div className="space-y-3">
        {question.options.map(opt => (
          <AnswerOption
            key={opt}
            option={opt}
            mode={isMulti ? 'multi' : 'single'}
            state={optionState(opt)}
            selected={selected.includes(opt)}
            onToggle={toggle}
            onPick={pickSingle}
            disabled={answered}
          />
        ))}
      </div>

      {isMulti && !answered && (
        <button
          type="button"
          onClick={submitMulti}
          disabled={selected.length === 0}
          className="mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg"
        >
          Svara ({selected.length} valda)
        </button>
      )}

      {answered && (
        <div className={`mt-4 p-3 rounded-lg ${correct ? 'bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100' : 'bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100'}`}>
          {correct ? 'Rätt svar!' : <>Fel svar. Rätt: <strong>{question.correct.join(', ')}</strong></>}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Create `src/views/QuizSession.jsx`**

```jsx
import { chapterForQuestion, isAnswerCorrect, recordAnswer } from '../lib/quizState.js'
import { allQuizData } from '../data/questions.js'
import QuestionCard from '../components/QuestionCard.jsx'
import ProgressDots from '../components/ProgressDots.jsx'

export default function QuizSession({ session, quizResults, setSession, setQuizResults, onAbort, onFinish }) {
  const question = session.questions[session.currentIndex]
  if (!question) {
    onFinish()
    return null
  }

  const chapter = chapterForQuestion(allQuizData, question.id)
  const savedEntry = session.mode === 'random'
    ? session.ephemeral?.[question.id]
    : quizResults[chapter]?.questions[question.id]

  function handleAnswer(answer) {
    if (session.mode === 'random') {
      const correct = isAnswerCorrect(question, answer)
      const entry = Array.isArray(answer)
        ? { answered: true, isCorrect: correct, selectedAnswers: answer }
        : { answered: true, isCorrect: correct, selectedAnswer: answer }
      setSession({
        ...session,
        ephemeral: { ...(session.ephemeral ?? {}), [question.id]: entry },
      })
      return
    }
    setQuizResults(prev => recordAnswer(prev, chapter, question, answer))
  }

  function next() {
    setSession({ ...session, currentIndex: session.currentIndex + 1 })
  }

  const isLast = session.currentIndex === session.questions.length - 1
  const hasAnswered = Boolean(savedEntry?.answered)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onAbort}
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Avbryt
        </button>
        <ProgressDots
          questions={session.questions}
          currentIndex={session.currentIndex}
          results={quizResults}
          chapterFor={(id) => chapterForQuestion(allQuizData, id)}
        />
        <span className="text-sm text-gray-600 dark:text-gray-400 tabular-nums">
          {session.currentIndex + 1} / {session.questions.length}
        </span>
      </div>

      <QuestionCard
        key={question.id}
        question={question}
        savedEntry={savedEntry}
        onAnswer={handleAnswer}
      />

      {hasAnswered && (
        <button
          onClick={isLast ? onFinish : next}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg"
        >
          {isLast ? 'Visa resultat →' : 'Nästa fråga →'}
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Wire `handleStart` and `screen` switching in `src/App.jsx`**

Replace `handleStart` and add a `QuizSession` render branch:

```jsx
import { createSession } from './lib/quizState.js'
import QuizSession from './views/QuizSession.jsx'
// ... existing imports

function handleStart(mode, chapterName = null) {
  const s = createSession(mode, allQuizData, quizResults, chapterName)
  if (s.questions.length === 0) return
  // If chapter or all mode is already complete (currentIndex === length), jump to results
  if (s.currentIndex >= s.questions.length) {
    setSession(s)
    setScreen('results')
    return
  }
  setSession(s)
  setScreen('quiz')
}

function handleAbort() {
  setSession(null)
  setScreen('start')
}

function handleFinish() {
  setScreen('results')
}

// ... render
{screen === 'quiz' && session && (
  <QuizSession
    session={session}
    quizResults={quizResults}
    setSession={setSession}
    setQuizResults={setQuizResults}
    onAbort={handleAbort}
    onFinish={handleFinish}
  />
)}

{screen === 'results' && (
  <button onClick={() => { setSession(null); setScreen('start') }} className="bg-blue-600 text-white px-6 py-3 rounded-lg">
    Tillbaka till menyn
  </button>
)}
```

(Real ResultsScreen comes in Task 8 — this is a placeholder so the flow doesn't dead-end.)

- [ ] **Step 6: Run dev server and click through**

```bash
npm run dev
```

Verify:
1. Click first chapter button → first question appears
2. Click correct option → green highlight + "Rätt svar!" feedback + "Nästa fråga →" button
3. Click "Nästa fråga →" → next question
4. Click wrong option → red + correct shown in light green + feedback
5. Navigate to a multi-choice question (chapter 1 question 12 — "Vilka fordon och fordonskombinationer..."): check both A and C, click "Svara (2 valda)" → both highlight green
6. Click "Avbryt" mid-session → back to start screen with updated count
7. Click same chapter again → resumes at first unanswered

Stop server.

- [ ] **Step 7: Run lint**

```bash
npm run lint
```

Expected: clean.

- [ ] **Step 8: Commit**

```bash
git add src/components/ src/views/QuizSession.jsx src/App.jsx
git commit -m "Add quiz session with single + multi choice, resume on abort"
```

---

## Task 8: Results screen

**Files:**
- Create: `src/views/ResultsScreen.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create `src/views/ResultsScreen.jsx`**

```jsx
import { chapterForQuestion } from '../lib/quizState.js'
import { allQuizData } from '../data/questions.js'

export default function ResultsScreen({ session, quizResults, onBackToMenu, onPracticeWrong }) {
  // Compute session-specific stats
  let sessionScore = 0
  const sessionWrong = []

  for (const q of session.questions) {
    const entry = session.mode === 'random'
      ? session.ephemeral?.[q.id]
      : quizResults[chapterForQuestion(allQuizData, q.id)]?.questions[q.id]
    if (entry?.isCorrect) sessionScore += 1
    if (entry?.answered && !entry.isCorrect) sessionWrong.push(q)
  }

  // Per-chapter totals (only relevant outside random mode)
  const perChapter = allQuizData.map(ch => ({
    chapter: ch.chapter,
    score: quizResults[ch.chapter]?.score ?? 0,
    total: ch.questions.length,
  }))

  return (
    <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg text-center">
      <h2 className="text-2xl font-bold mb-4">
        {session.mode === 'random' ? 'Slumpat quiz klart' : 'Resultat'}
      </h2>
      <p className="text-xl">
        Du fick <span className="font-bold text-blue-600 dark:text-blue-400">{sessionScore}</span> av{' '}
        <span className="font-bold">{session.questions.length}</span> rätt i den här omgången.
      </p>

      {session.mode !== 'random' && (
        <div className="mt-6 text-left">
          <h3 className="font-semibold mb-2">Totalt per kapitel:</h3>
          <ul className="space-y-1">
            {perChapter.map(c => (
              <li key={c.chapter}>{c.chapter}: {c.score} av {c.total} rätt.</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={onBackToMenu}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg"
        >
          Tillbaka till menyn
        </button>
        {sessionWrong.length > 0 && session.mode !== 'random' && (
          <button
            onClick={() => onPracticeWrong(sessionWrong)}
            className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 font-semibold py-2 px-6 rounded-lg"
          >
            Öva fel-frågorna ({sessionWrong.length})
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Wire it in `src/App.jsx`**

Replace the placeholder results branch:

```jsx
import ResultsScreen from './views/ResultsScreen.jsx'
// ...

function handlePracticeWrong(wrongQuestions) {
  setSession({ mode: 'wrong-only', questions: wrongQuestions, currentIndex: 0 })
  setScreen('quiz')
}

// render:
{screen === 'results' && session && (
  <ResultsScreen
    session={session}
    quizResults={quizResults}
    onBackToMenu={() => { setSession(null); setScreen('start') }}
    onPracticeWrong={handlePracticeWrong}
  />
)}
```

- [ ] **Step 3: Run dev server and verify**

```bash
npm run dev
```

Walk through:
1. Pick a chapter, intentionally answer one question wrong, finish the chapter
2. Results screen shows session score + per-chapter totals + "Öva fel-frågorna (1)" button
3. Click "Öva fel-frågorna" → enters quiz session with only the wrong question(s)
4. Answer it correctly → finish → results screen again (now without öva-knappen)

Stop server.

- [ ] **Step 4: Commit**

```bash
git add src/views/ResultsScreen.jsx src/App.jsx
git commit -m "Add results screen with per-chapter totals and practice-wrong shortcut"
```

---

## Task 9: Dark mode

**Files:**
- Create: `src/hooks/useTheme.js`, `src/components/ThemeToggle.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create `src/hooks/useTheme.js`**

```js
import { useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage.js'

export function useTheme() {
  const [theme, setTheme] = useLocalStorage('theme', 'auto') // 'light' | 'dark' | 'auto'

  useEffect(() => {
    const root = document.documentElement
    const apply = () => {
      const isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      root.classList.toggle('dark', isDark)
    }
    apply()
    if (theme === 'auto') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      mq.addEventListener('change', apply)
      return () => mq.removeEventListener('change', apply)
    }
  }, [theme])

  function cycle() {
    setTheme(t => (t === 'auto' ? 'light' : t === 'light' ? 'dark' : 'auto'))
  }

  return { theme, setTheme, cycle }
}
```

- [ ] **Step 2: Create `src/components/ThemeToggle.jsx`**

```jsx
export default function ThemeToggle({ theme, onCycle }) {
  const label = theme === 'auto' ? 'Auto' : theme === 'dark' ? 'Mörkt' : 'Ljust'
  const icon = theme === 'auto' ? '🌓' : theme === 'dark' ? '🌙' : '☀️'
  return (
    <button
      onClick={onCycle}
      aria-label={`Tema: ${label}`}
      className="px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600"
    >
      <span aria-hidden>{icon}</span> <span className="text-sm">{label}</span>
    </button>
  )
}
```

- [ ] **Step 3: Wire into `src/App.jsx`**

```jsx
import { useTheme } from './hooks/useTheme.js'
import ThemeToggle from './components/ThemeToggle.jsx'
// ...

const { theme, cycle } = useTheme()

// In the header:
<header className="mb-8">
  <div className="flex justify-end mb-4">
    <ThemeToggle theme={theme} onCycle={cycle} />
  </div>
  <div className="text-center">
    <h1 className="text-3xl sm:text-4xl font-bold">BE-Körkortsfrågor</h1>
    <p className="mt-2 text-gray-600 dark:text-gray-400">
      Testa dina kunskaper inom körkortsregler, fordonskännedom, last och körning med släp.
    </p>
  </div>
</header>
```

- [ ] **Step 4: Run dev server and verify dark mode**

```bash
npm run dev
```

Verify:
1. Toggle cycles Auto → Light → Dark → Auto
2. In Dark, body background goes dark; all cards, buttons, text follow
3. In Auto with system in dark mode → dark theme applies
4. Reload page → theme persists (check `localStorage.getItem('theme')` in console)

Stop server.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useTheme.js src/components/ThemeToggle.jsx src/App.jsx
git commit -m "Add dark mode with light/dark/auto cycle"
```

---

## Task 10: Random + Wrong-only modes on start screen

**Files:**
- Modify: `src/views/StartScreen.jsx`

- [ ] **Step 1: Update `StartScreen` to add Random + Wrong-only buttons**

In `src/views/StartScreen.jsx`, accept additional props and add two buttons between "Hela quizet" and chapter list:

```jsx
export default function StartScreen({ allQuizData, quizResults, wrongCount, onStart, onClearResults }) {
  // ... existing computed values

  return (
    <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Välj ett kapitel att testa</h2>

      <div className="space-y-3">
        <button
          onClick={() => onStart('all')}
          className={/* ... unchanged ... */}
        >
          Hela quizet ({totalAnswered}/{totalQuestions})
        </button>

        <button
          onClick={() => onStart('random')}
          className="w-full font-semibold py-3 px-6 rounded-lg bg-purple-600 hover:bg-purple-700 text-white"
        >
          🎲 Slumpat (30 frågor)
        </button>

        {wrongCount > 0 && (
          <button
            onClick={() => onStart('wrong-only')}
            className="w-full font-semibold py-3 px-6 rounded-lg bg-orange-600 hover:bg-orange-700 text-white"
          >
            🔁 Öva fel ({wrongCount} {wrongCount === 1 ? 'fråga' : 'frågor'})
          </button>
        )}

        {/* ... chapter buttons unchanged ... */}
      </div>
      {/* ... totals + clear unchanged ... */}
    </div>
  )
}
```

- [ ] **Step 2: Pass `wrongCount` from `src/App.jsx`**

```jsx
import { getWrongQuestions } from './lib/quizState.js'
// ...

const wrongCount = getWrongQuestions(quizResults, allQuizData).length

// In StartScreen render:
<StartScreen
  allQuizData={allQuizData}
  quizResults={quizResults}
  wrongCount={wrongCount}
  onStart={handleStart}
  onClearResults={handleClearResults}
/>
```

- [ ] **Step 3: Run dev server and verify**

```bash
npm run dev
```

Verify:
1. "🎲 Slumpat (30 frågor)" button appears, clicking it starts a session with 30 random questions
2. After answering some questions wrong, return to start → "🔁 Öva fel (N)" appears
3. Click öva-fel → only the wrong questions appear, answering them correctly removes them from the pool next time
4. Random mode session does NOT modify per-chapter answered counts (verify by checking start screen counts before/after)

Stop server.

- [ ] **Step 4: Commit**

```bash
git add src/views/StartScreen.jsx src/App.jsx
git commit -m "Add random and wrong-only quiz modes"
```

---

## Task 11: PWA — manifest, service worker, icons

**Files:**
- Create: `public/favicon.svg`, `public/icon-192.png`, `public/icon-512.png`
- Modify: `vite.config.js`, `index.html`

- [ ] **Step 1: Generate icons**

Copy the existing `archive/icon.svg` to `public/favicon.svg`:

```powershell
Copy-Item archive\icon.svg public\favicon.svg
```

For PNG icons, either:
- (a) Use an online SVG-to-PNG converter to make 192×192 and 512×512 versions of `favicon.svg`, save as `public/icon-192.png` and `public/icon-512.png`
- (b) Use ImageMagick if installed: `magick public\favicon.svg -resize 192x192 public\icon-192.png` and `-resize 512x512` for the 512 version

If neither is available, ask the user for a quick PNG export. Do not skip — vite-plugin-pwa needs them.

- [ ] **Step 2: Update `vite.config.js`**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'BE-Körkortsfrågor',
        short_name: 'Körkort',
        description: 'Testa dina kunskaper inom BE-körkort.',
        lang: 'sv',
        theme_color: '#2563eb',
        background_color: '#f3f4f6',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        navigateFallback: '/index.html',
      },
    }),
  ],
})
```

- [ ] **Step 3: Update `index.html` to include iOS meta and favicon**

```html
<!doctype html>
<html lang="sv">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#2563eb" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Körkort" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="apple-touch-icon" href="/icon-192.png" />
    <title>BE-Körkortsfrågor</title>
  </head>
  <body class="bg-gray-100 dark:bg-gray-900">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Build and verify PWA**

```bash
npm run build
npm run preview
```

Open `http://localhost:4173` and check:
1. DevTools → Application → Manifest: shows "BE-Körkortsfrågor", icons render
2. DevTools → Application → Service Workers: registered, activated
3. Network throttled to Offline → reload → app still loads
4. Lighthouse → PWA category passes basic checks (installable)

Stop preview server.

- [ ] **Step 5: Commit**

```bash
git add public/ vite.config.js index.html
git commit -m "Add PWA support via vite-plugin-pwa with manifest and offline cache"
```

---

## Task 12: Install prompts (iOS + Android)

**Files:**
- Create: `src/hooks/useInstallPrompt.js`, `src/components/InstallBanner.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create `src/hooks/useInstallPrompt.js`**

```js
import { useEffect, useState } from 'react'
import { useLocalStorage } from './useLocalStorage.js'

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [installed, setInstalled] = useState(false)
  const [dismissed, setDismissed] = useLocalStorage('installBannerDismissed', false)

  useEffect(() => {
    function onBeforeInstall(e) {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    function onInstalled() {
      setInstalled(true)
      setDeferredPrompt(null)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const isStandalone = window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches

  async function promptInstall() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }

  return {
    canPromptAndroid: Boolean(deferredPrompt),
    showIosInstructions: isIos && !isStandalone,
    installed,
    dismissed,
    dismiss: () => setDismissed(true),
    promptInstall,
  }
}
```

- [ ] **Step 2: Create `src/components/InstallBanner.jsx`**

```jsx
export default function InstallBanner({ canPromptAndroid, showIosInstructions, dismissed, dismiss, onPromptInstall }) {
  if (dismissed) return null
  if (!canPromptAndroid && !showIosInstructions) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-blue-700 text-white px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] z-50 flex items-center justify-between gap-3 shadow-lg">
      <div className="text-sm">
        {canPromptAndroid
          ? 'Installera appen för snabbare åtkomst.'
          : <>Installera appen: tryck <strong>⎋ Dela</strong> och sedan <strong>"Lägg till på hemskärmen"</strong>.</>}
      </div>
      <div className="flex gap-2 flex-shrink-0">
        {canPromptAndroid && (
          <button
            onClick={onPromptInstall}
            className="bg-white/20 hover:bg-white/30 rounded-md px-3 py-1.5 text-sm font-semibold"
          >
            Installera
          </button>
        )}
        <button
          onClick={dismiss}
          aria-label="Stäng"
          className="bg-white/20 hover:bg-white/30 rounded-md px-3 py-1.5 text-sm"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Wire into `src/App.jsx`**

```jsx
import { useInstallPrompt } from './hooks/useInstallPrompt.js'
import InstallBanner from './components/InstallBanner.jsx'
// ...

const install = useInstallPrompt()

// Inside the root <div>, at the end:
<InstallBanner
  canPromptAndroid={install.canPromptAndroid}
  showIosInstructions={install.showIosInstructions}
  dismissed={install.dismissed}
  dismiss={install.dismiss}
  onPromptInstall={install.promptInstall}
/>
```

- [ ] **Step 4: Verify**

```bash
npm run build && npm run preview
```

- On desktop Chrome: open DevTools → Application → Manifest → "Add to homescreen" should be available, and reloading the preview triggers a `beforeinstallprompt` event that surfaces the banner.
- On iOS Safari (if you can test): the iOS-style banner appears with the share instructions.
- Click ✕ on the banner → it disappears and `localStorage.installBannerDismissed` is `true`. Reload → banner stays dismissed.
- Open in private/incognito: banner shows again (different storage).

Stop preview.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useInstallPrompt.js src/components/InstallBanner.jsx src/App.jsx
git commit -m "Add install banner for iOS instructions and Android beforeinstallprompt"
```

---

## Task 13: Netlify config + explain function stub

**Files:**
- Create: `netlify.toml`, `netlify/functions/explain.js`

- [ ] **Step 1: Create `netlify.toml`**

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

- [ ] **Step 2: Create `netlify/functions/explain.js`**

```js
// Proxies an explanation request to an LLM. Reads API key from env.
// Returns 503 with a message if no key is configured so the client
// can gracefully show "AI-förklaring inte tillgänglig just nu."

export default async (request) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'AI-förklaring inte konfigurerad' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { question, options, correct, selected } = body
  if (!question || !options || !correct) {
    return new Response(JSON.stringify({ error: 'Missing fields' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const prompt = `Du är körkortslärare för BE-behörighet. Förklara kort (3-5 meningar) varför svaret är rätt, på svenska.

Fråga: ${question}
Alternativ: ${options.join(' | ')}
Rätt svar: ${Array.isArray(correct) ? correct.join(', ') : correct}
Användarens svar: ${Array.isArray(selected) ? selected.join(', ') : selected}`

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    )
    if (!res.ok) {
      const detail = await res.text()
      return new Response(JSON.stringify({ error: 'Provider error', detail }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Network error', detail: String(err) }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
```

- [ ] **Step 3: Verify lint and build still work**

```bash
npm run lint
npm run build
```

Expected: both clean.

- [ ] **Step 4: Commit**

```bash
git add netlify.toml netlify/
git commit -m "Add Netlify config and Gemini explain function (returns 503 without key)"
```

---

## Task 14: Wire up the Explain button

**Files:**
- Create: `src/lib/explain.js`, `src/components/ExplainSection.jsx`
- Modify: `src/components/QuestionCard.jsx`

- [ ] **Step 1: Create `src/lib/explain.js`**

```js
export async function fetchExplanation({ question, options, correct, selected }) {
  const res = await fetch('/.netlify/functions/explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, options, correct, selected }),
  })
  if (res.status === 503) {
    return { available: false, text: null }
  }
  if (!res.ok) {
    throw new Error(`Förklaring misslyckades (${res.status})`)
  }
  const data = await res.json()
  return { available: true, text: data.text }
}
```

- [ ] **Step 2: Create `src/components/ExplainSection.jsx`**

```jsx
import { useState } from 'react'
import { fetchExplanation } from '../lib/explain.js'

export default function ExplainSection({ question, selected }) {
  const [state, setState] = useState('idle') // 'idle' | 'loading' | 'ready' | 'error' | 'unavailable'
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  async function onClick() {
    setState('loading')
    try {
      const result = await fetchExplanation({
        question: question.text,
        options: question.options,
        correct: question.correct,
        selected,
      })
      if (!result.available) {
        setState('unavailable')
        return
      }
      setText(result.text)
      setState('ready')
    } catch (err) {
      setError(err.message)
      setState('error')
    }
  }

  if (state === 'idle') {
    return (
      <button
        type="button"
        onClick={onClick}
        className="mt-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 font-semibold py-2 px-4 rounded-lg"
      >
        Visa förklaring ✨
      </button>
    )
  }

  if (state === 'loading') {
    return <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Hämtar förklaring…</p>
  }

  if (state === 'unavailable') {
    return <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">AI-förklaring inte tillgänglig just nu.</p>
  }

  if (state === 'error') {
    return <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
  }

  return (
    <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg whitespace-pre-wrap">
      {text}
    </div>
  )
}
```

- [ ] **Step 3: Add `<ExplainSection>` to `QuestionCard` after answered**

In `src/components/QuestionCard.jsx`, import and render it after the feedback box:

```jsx
import ExplainSection from './ExplainSection.jsx'
// ...

{answered && (
  <>
    <div className={/* ... feedback ... */}>
      {/* ... feedback content unchanged ... */}
    </div>
    <ExplainSection question={question} selected={isMulti ? selected : selected[0]} />
  </>
)}
```

- [ ] **Step 4: Verify locally with Netlify Dev (optional)**

If `netlify-cli` is installed (`npm i -g netlify-cli`), run:

```bash
netlify dev
```

This starts Vite + functions on `http://localhost:8888`. Answer a question, click "Visa förklaring ✨" → without `GEMINI_API_KEY` env var set, expect "AI-förklaring inte tillgänglig just nu."

If `netlify-cli` is not installed, skip this — verification happens after Netlify deploy in Task 16.

- [ ] **Step 5: Commit**

```bash
git add src/lib/explain.js src/components/ExplainSection.jsx src/components/QuestionCard.jsx
git commit -m "Wire up explain button with graceful 503 fallback"
```

---

## Task 15: Rename branch master → main

**Files:** (no file changes, git plumbing only)

- [ ] **Step 1: Rename local branch**

```bash
git branch -m master main
```

- [ ] **Step 2: Verify**

```bash
git branch
```

Expected: `* main`

- [ ] **Step 3: Add GitHub remote**

```bash
git remote add origin https://github.com/acidur1/be-korkort.git
```

- [ ] **Step 4: Push to GitHub**

```bash
git push -u origin main
```

Expected: all commits pushed, branch tracking set up.

(No Netlify trigger yet — the GitHub repo is not linked to the Netlify project.)

---

## Task 16: Link Netlify (deferred — only when user signals ready)

**This task is performed manually in the Netlify UI when the user gives the go-ahead.**

- [ ] **Step 1: Link repository**

Go to https://app.netlify.com/projects/be-korkortsfragor/configuration/deploys → "Link site to a Git repository" → choose `acidur1/be-korkort` → branch `main`.

Build settings will auto-detect from `netlify.toml`.

- [ ] **Step 2: Set environment variable**

Netlify UI → Site settings → Environment variables → add:
- `GEMINI_API_KEY` = (current Gemini API key)

If no current Gemini key, leave unset; the function will return 503 and the UI shows "AI-förklaring inte tillgänglig just nu." gracefully.

- [ ] **Step 3: Trigger first deploy**

Either push a small commit or click "Trigger deploy → Deploy site" in the Netlify UI.

- [ ] **Step 4: Smoke test the deploy preview**

- Open the Netlify URL on iPhone Safari → install banner appears → "Lägg till på hemskärmen" works
- Open on Android Chrome → install button appears → installs as standalone app
- Run through one chapter from start to finish online, then offline (airplane mode)
- Click "Visa förklaring ✨" — either gets a response, or shows the graceful unavailable message

If all good, promote production and announce.

---

## Verification Checklist (post-implementation)

Run these before considering the migration complete:

- [ ] `npm test` — all data integrity and quiz logic tests pass
- [ ] `npm run lint` — clean
- [ ] `npm run build` — succeeds, dist/ produced
- [ ] Side-by-side check: open `archive/index.html` (just drag into browser) and `npm run dev`. Spot-check the first 5 questions of each chapter — text, options, correct answers match exactly. Pay attention to multi-choice questions: chapter 1 q12/q13/q14/q17/q18.
- [ ] Resume works: start a chapter, answer 3, abort, re-enter chapter → starts at question 4
- [ ] Random mode does NOT change chapter "answered" counts
- [ ] Wrong-only button appears after at least one wrong answer; disappears after all are corrected
- [ ] Dark mode persists across reloads
- [ ] PWA installs and runs offline after first load
- [ ] Explain button shows graceful unavailable when no key is configured
