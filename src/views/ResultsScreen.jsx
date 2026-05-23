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
