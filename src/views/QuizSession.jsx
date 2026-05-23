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
