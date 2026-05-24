import { useCallback, useEffect, useState } from 'react'
import { allQuizData } from './data/questions.js'
import { createSession, initialResults, getWrongQuestions, chapterForQuestion } from './lib/quizState.js'
import {
  defaultGameState,
  recordGameAnswer,
  chapterMastery,
  ACHIEVEMENT_DEFS,
} from './lib/gameState.js'
import { useLocalStorage } from './hooks/useLocalStorage.js'
import { useInstallPrompt } from './hooks/useInstallPrompt.js'
import StartScreen from './views/StartScreen.jsx'
import QuizSession from './views/QuizSession.jsx'
import ResultsScreen from './views/ResultsScreen.jsx'
import Confetti from './components/Confetti.jsx'
import AchievementToast from './components/AchievementToast.jsx'
import InstallBanner from './components/InstallBanner.jsx'

const CONFETTI_ACHIEVEMENTS = ['streak_7', 'streak_30', 'answered_100', 'answered_500', 'all_gold', 'perfect_session']

export default function App() {
  const [quizResults, setQuizResults] = useLocalStorage('quizResults_v2', initialResults(allQuizData))
  const [gameState, setGameState] = useLocalStorage('gameState_v1', defaultGameState())
  const [dark, setDark] = useLocalStorage('theme_dark', false)
  const [screen, setScreen] = useState('start')
  const [session, setSession] = useState(null)
  const [toastQueue, setToastQueue] = useState([])
  const [currentToast, setCurrentToast] = useState(null)
  const [confettiKey, setConfettiKey] = useState(0)
  const install = useInstallPrompt()

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])

  useEffect(() => {
    if (currentToast || toastQueue.length === 0) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentToast(toastQueue[0])
    setToastQueue(q => q.slice(1))
  }, [toastQueue, currentToast])

  const wrongCount = getWrongQuestions(quizResults, allQuizData).length

  const handleGameAnswer = useCallback((wasCorrect) => {
    setGameState(prev => {
      const { state, newAchievements } = recordGameAnswer(prev, wasCorrect)
      if (newAchievements.length) {
        const items = newAchievements.map(id => ({ id, ...ACHIEVEMENT_DEFS[id] }))
        setToastQueue(q => [...q, ...items])
        if (newAchievements.some(id => CONFETTI_ACHIEVEMENTS.includes(id))) {
          setConfettiKey(k => k + 1)
        }
      }
      return state
    })
  }, [setGameState])

  const handleSessionEnd = useCallback((sessionDetail) => {
    const correct = sessionDetail.filter(d => d.entry?.isCorrect).length
    const total = sessionDetail.length
    const perfect = total >= 5 && correct === total
    setGameState(prev => {
      const newAch = []
      let achievements = prev.achievements
      if (perfect && !achievements.includes('perfect_session')) {
        achievements = [...achievements, 'perfect_session']
        newAch.push('perfect_session')
      }
      const allGold = allQuizData.every(ch => chapterMastery(quizResults[ch.chapter]) === 'gold')
      if (allGold && !achievements.includes('all_gold')) {
        achievements = [...achievements, 'all_gold']
        newAch.push('all_gold')
      }
      if (!newAch.length) return prev
      setToastQueue(q => [...q, ...newAch.map(id => ({ id, ...ACHIEVEMENT_DEFS[id] }))])
      setConfettiKey(k => k + 1)
      return { ...prev, achievements }
    })
  }, [quizResults, setGameState])

  function handleStart(mode, chapterName = null) {
    const s = createSession(mode, allQuizData, quizResults, chapterName)
    if (s.questions.length === 0) return
    setSession(s)
    setScreen('quiz')
  }
  function handleAbort() { setSession(null); setScreen('start') }
  function handleFinish() {
    if (session) {
      const useEphemeral = session.mode === 'random' || session.mode === 'exam' || session.mode === 'wrong-only'
      const sessionDetail = session.questions.map(q => {
        const entry = useEphemeral
          ? session.ephemeral?.[q.id]
          : quizResults[chapterForQuestion(allQuizData, q.id)]?.questions[q.id]
        return { question: q, entry }
      })
      handleSessionEnd(sessionDetail)
    }
    setScreen('results')
  }
  function handleClearResults() {
    if (window.confirm('Vill du verkligen rensa alla sparade resultat och spelframsteg?')) {
      setQuizResults(initialResults(allQuizData))
      setGameState(defaultGameState())
    }
  }
  function handlePracticeWrong(wrongQuestions) {
    setSession({ mode: 'wrong-only', questions: wrongQuestions, currentIndex: 0, ephemeral: {}, startedAt: Date.now() })
    setScreen('quiz')
  }
  function handleRestart() {
    const s = createSession(session.mode, allQuizData, quizResults, session.chapterName)
    setSession(s)
    setScreen('quiz')
  }

  return (
    <div className="app">
      <div className="app-bg" aria-hidden="true" />
      <Confetti trigger={confettiKey} />
      <AchievementToast achievement={currentToast} onDismiss={() => setCurrentToast(null)} />
      <div className="shell">
        <main>
          {screen === 'start' && (
            <StartScreen
              allQuizData={allQuizData}
              quizResults={quizResults}
              wrongCount={wrongCount}
              onStart={handleStart}
              onClearResults={handleClearResults}
              dark={dark}
              onToggleDark={() => setDark(d => !d)}
              gameState={gameState}
            />
          )}
          {screen === 'quiz' && session && (
            <QuizSession
              session={session}
              quizResults={quizResults}
              setSession={setSession}
              setQuizResults={setQuizResults}
              onAbort={handleAbort}
              onFinish={handleFinish}
              feedbackMode="instant"
              progressStyle="bar"
              onGameAnswer={handleGameAnswer}
            />
          )}
          {screen === 'results' && session && (
            <ResultsScreen
              session={session}
              quizResults={quizResults}
              onBackToMenu={() => { setSession(null); setScreen('start') }}
              onPracticeWrong={handlePracticeWrong}
              onRestart={handleRestart}
            />
          )}
        </main>
      </div>
      <InstallBanner
        canPromptAndroid={install.canPromptAndroid}
        showIosInstructions={install.showIosInstructions}
        dismissed={install.dismissed}
        dismiss={install.dismiss}
        onPromptInstall={install.promptInstall}
      />
    </div>
  )
}
