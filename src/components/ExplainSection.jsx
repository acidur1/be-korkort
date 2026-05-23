import { useState } from 'react'
import { fetchExplanation } from '../lib/explain.js'

export default function ExplainSection({ question, selected }) {
  const [state, setState] = useState('idle') // 'idle' | 'loading' | 'ready' | 'error' | 'unavailable'
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  async function onClick() {
    setState('loading')
    try {
      const result = await fetchExplanation({
        question: question.text,
        options: question.options,
        correct: question.correct,
        selected,
      })
      if (!result.available) {
        setState('unavailable')
        return
      }
      setText(result.text)
      setState('ready')
    } catch (err) {
      setError(err.message)
      setState('error')
    }
  }

  if (state === 'idle') {
    return (
      <button
        type="button"
        onClick={onClick}
        className="mt-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 font-semibold py-2 px-4 rounded-lg"
      >
        Visa förklaring ✨
      </button>
    )
  }

  if (state === 'loading') {
    return <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Hämtar förklaring…</p>
  }

  if (state === 'unavailable') {
    return <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">AI-förklaring inte tillgänglig just nu.</p>
  }

  if (state === 'error') {
    return <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
  }

  return (
    <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg whitespace-pre-wrap">
      {text}
    </div>
  )
}
