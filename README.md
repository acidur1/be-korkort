# BE-Körkortsfrågor

Övningsapp för BE-körkort (bil med tungt släp). 135 frågor fördelade på fyra kapitel, med direkt feedback, offline-förklaringar och gamifiering.

## Funktioner

- **Fyra övningslägen** — kapitelvis, alla frågor i ordning, slumpat prov (30 frågor med feedback), och provläge (30 frågor, facit i slutet)
- **Öva fel** — samlar alla frågor du svarat fel på och låter dig köra om dem
- **Offline-förklaringar** — varje fråga har en inbyggd förklaring, ingen nätuppkoppling krävs
- **Gamifiering** — daglig streak, dagsmål, kapitelmastery (brons/silver/guld) och achievements med toast-notiser
- **PWA** — installerbar på mobil och desktop, fungerar offline
- **Mörkt/ljust läge**

## Komma igång

```bash
npm install
npm run dev        # Startar dev-server på localhost:5173
npm run build      # Bygger till dist/
npm run preview    # Förhandsvisar produktionsbuilden
npm run test       # Kör enhetstester
npm run lint       # Kör ESLint
```

## Struktur

```
src/
  data/
    questions.js       # 135 frågor uppdelade i 4 kapitel
    explanations.js    # Offline-förklaringar per fråga
  lib/
    quizState.js       # Sessionslogik, svarsspårning, localStorage-schema
    gameState.js       # Streak, dagsmål, achievements
    chapterMeta.js     # Kapitelnamn, ikoner, bokstavsfunktioner
  views/
    StartScreen.jsx    # Startsida med statistik, spelstatus och kapitelöversikt
    QuizSession.jsx    # Aktiv frågesession med progress och kombo-räknare
    ResultsScreen.jsx  # Resultatsammanfattning med kapiteluppdelning
  components/
    QuestionCard.jsx   # Frågekort med svarsalternativ och tangentbordsnavigation
    FeedbackPanel.jsx  # Direkt feedback med expanderbar förklaring
    ReviewList.jsx     # Genomgång av fel-svar på resultatsidan
    AchievementToast.jsx
    Confetti.jsx
    Icons.jsx
  hooks/
    useLocalStorage.js
    useInstallPrompt.js
public/
  marken/             # Vägmärkesbilder (PNG) som refereras i frågetexterna
```

## localStorage-nycklar

| Nyckel | Innehåll |
|---|---|
| `quizResults_v2` | Svarsstatus per kapitel och fråga |
| `gameState_v1` | Streak, dagsmål, achievements |
| `theme_dark` | Temainställning |

## Teknisk stack

- React 19 + Vite 8
- vite-plugin-pwa (0.21.x) med workaround för Rolldown-inkompatibilitet
- Vitest för enhetstester
- Netlify för deploy (`netlify.toml` konfigurerar build och SPA-redirect)
