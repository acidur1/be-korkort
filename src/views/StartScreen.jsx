export default function StartScreen({ allQuizData, quizResults, wrongCount, onStart, onClearResults }) {
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
