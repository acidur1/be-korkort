import { useState } from 'react'
import { allQuizData } from './data/questions.js'
import { initialResults } from './lib/quizState.js'
import { useLocalStorage } from './hooks/useLocalStorage.js'
import StartScreen from './views/StartScreen.jsx'

export default function App() {
  const [quizResults, setQuizResults] = useLocalStorage('quizResults', initialResults(allQuizData))
  const [screen] = useState('start')

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
