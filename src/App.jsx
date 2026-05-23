import { useState } from 'react'
import { allQuizData } from './data/questions.js'
import { createSession, initialResults } from './lib/quizState.js'
import { useLocalStorage } from './hooks/useLocalStorage.js'
import { useTheme } from './hooks/useTheme.js'
import StartScreen from './views/StartScreen.jsx'
import QuizSession from './views/QuizSession.jsx'
import ResultsScreen from './views/ResultsScreen.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'

export default function App() {
  const [quizResults, setQuizResults] = useLocalStorage('quizResults', initialResults(allQuizData))
  const [screen, setScreen] = useState('start')
  const [session, setSession] = useState(null)
  const { theme, cycle } = useTheme()

  function handleStart(mode, chapterName = null) {
    const s = createSession(mode, allQuizData, quizResults, chapterName)
    if (s.questions.length === 0) return
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

  function handleClearResults() {
    setQuizResults(initialResults(allQuizData))
  }

  function handlePracticeWrong(wrongQuestions) {
    setSession({ mode: 'wrong-only', questions: wrongQuestions, currentIndex: 0 })
    setScreen('quiz')
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 text-gray-800 dark:text-gray-100 min-h-screen">
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

      {screen === 'start' && (
        <StartScreen
          allQuizData={allQuizData}
          quizResults={quizResults}
          onStart={handleStart}
          onClearResults={handleClearResults}
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
        />
      )}

      {screen === 'results' && session && (
        <ResultsScreen
          session={session}
          quizResults={quizResults}
          onBackToMenu={() => { setSession(null); setScreen('start') }}
          onPracticeWrong={handlePracticeWrong}
        />
      )}
    </div>
  )
}
