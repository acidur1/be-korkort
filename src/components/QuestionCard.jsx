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
