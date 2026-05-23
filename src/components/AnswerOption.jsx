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
