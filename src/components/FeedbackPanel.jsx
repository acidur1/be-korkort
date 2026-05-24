import { useState } from 'react'
import { Icons } from './Icons.jsx'
import { letterFor, stripPrefix } from '../lib/chapterMeta.js'
import { questionExplanations } from '../data/explanations.js'

export default function FeedbackPanel({ question, correct, isMulti }) {
  const [open, setOpen] = useState(false)
  const explanation = questionExplanations?.[question.id]

  return (
    <div className={`feedback ${correct ? 'feedback-correct' : 'feedback-wrong'}`}>
      <div className="feedback-icon">
        {correct ? <Icons.Check size={18} stroke={2.5} /> : <Icons.X size={18} stroke={2.5} />}
      </div>
      <div className="feedback-body" style={{ width: '100%' }}>
        <div className="feedback-title">{correct ? 'Rätt svar!' : 'Inte riktigt.'}</div>
        <div className="feedback-sub">
          {correct
            ? (isMulti ? 'Bra — du markerade alla rätta alternativ.' : 'Bra jobbat — gå vidare när du är klar.')
            : <>Rätt svar: <strong>{question.correct.map(c => letterFor(question.options.indexOf(c))).join(' & ')}</strong>{isMulti ? '' : ` — ${stripPrefix(question.correct[0])}`}</>}
        </div>
        {explanation && (
          <>
            <button
              type="button"
              className="explain-btn"
              onClick={() => setOpen(o => !o)}
              style={{ marginTop: 'var(--space-3)' }}
            >
              {open ? '✕ Dölj förklaring' : '✦ Visa förklaring'}
            </button>
            {open && (
              <div className="explain-body" style={{ marginTop: 'var(--space-2)' }}>
                {explanation}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
