import { useState } from 'react'
import { allQuizData } from './data/questions.js'
import { createSession, initialResults } from './lib/quizState.js'
import { useLocalStorage } from './hooks/useLocalStorage.js'
import StartScreen from './views/StartScreen.jsx'
import QuizSession from './views/QuizSession.jsx'

export default function App() {
  const [quizResults, setQuizResults] = useLocalStorage('quizResults', initialResults(allQuizData))
  const [screen, setScreen] = useState('start')
  const [session, setSession] = useState(null)

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
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center">
          <p className="text-xl font-bold mb-4">Quiz klart!</p>
          <button
            onClick={() => { setSession(null); setScreen('start') }}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Tillbaka till menyn
          </button>
        </div>
      )}
    </div>
  )
}
