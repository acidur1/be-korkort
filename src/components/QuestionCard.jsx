import { useState, useEffect } from 'react'
import { Icons } from './Icons.jsx'
import { CHAPTER_META, letterFor, stripPrefix } from '../lib/chapterMeta.js'
import { chapterForQuestion, isAnswerCorrect } from '../lib/quizState.js'
import { allQuizData } from '../data/questions.js'
import FeedbackPanel from './FeedbackPanel.jsx'

export default function QuestionCard({ question, savedEntry, onAnswer, feedbackMode }) {
  const isMulti = question.correct.length > 1
  const answered = Boolean(savedEntry?.answered)
  const showFeedback = answered && feedbackMode === 'instant'

  const initialSelected = answered
    ? (isMulti ? (savedEntry.selectedAnswers ?? []) : (savedEntry.selectedAnswer ? [savedEntry.selectedAnswer] : []))
    : []
  const [selected, setSelected] = useState(initialSelected)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected(initialSelected)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id])

  function toggle(opt) {
    if (answered) return
    if (isMulti) {
      setSelected(s => s.includes(opt) ? s.filter(o => o !== opt) : [...s, opt])
    } else {
      setSelected([opt])
      onAnswer(opt)
    }
  }

  function submitMulti() {
    if (answered || selected.length === 0) return
    onAnswer(selected)
  }

  function optionState(opt) {
    if (!showFeedback) {
      return selected.includes(opt) ? 'selected' : 'unanswered'
    }
    const selectedThis = selected.includes(opt)
    const isCorrectOpt = question.correct.includes(opt)
    if (isCorrectOpt && selectedThis) return 'correct'
    if (!isCorrectOpt && selectedThis) return 'incorrect'
    if (isCorrectOpt) return 'reveal-correct'
    return 'unanswered'
  }

  useEffect(() => {
    function onKey(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      const k = e.key.toUpperCase()
      if (k.length === 1 && k >= 'A' && k <= 'Z') {
        const idx = k.charCodeAt(0) - 65
        if (idx < question.options.length) {
          toggle(question.options[idx])
          e.preventDefault()
        }
      } else if (e.key === 'Enter' && isMulti && !answered && selected.length > 0) {
        submitMulti()
        e.preventDefault()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id, answered, selected])

  const correct = showFeedback && isAnswerCorrect(question, isMulti ? selected : selected[0])
  const chapter = chapterForQuestion(allQuizData, question.id)
  const meta = CHAPTER_META[chapter] || {}

  return (
    <div className="q-card">
      <div className="q-meta">
        <span className="pill pill-brand">{meta.short || chapter}</span>
        <span className="pill">Fråga {question.id}</span>
        {isMulti && <span className="pill" style={{ background: 'var(--info-bg-default)', color: 'var(--info-text-default)', borderColor: 'var(--info-bdr)' }}>Flera rätta svar</span>}
      </div>
      <h2 className="q-text" dangerouslySetInnerHTML={{ __html: question.text }} />

      <div className="options">
        {question.options.map((opt, i) => {
          const st = optionState(opt)
          const text = stripPrefix(opt)
          const cls = ['option']
          if (st === 'selected') cls.push('selected')
          if (st === 'correct') cls.push('correct')
          if (st === 'incorrect') cls.push('incorrect')
          if (st === 'reveal-correct') cls.push('reveal-correct')
          return (
            <button
              key={opt}
              className={cls.join(' ')}
              onClick={() => toggle(opt)}
              disabled={answered && feedbackMode === 'instant'}
              type="button"
            >
              <span className="option-key">{letterFor(i)}</span>
              <span className="option-text">{text}</span>
              <span className="option-icon">
                {st === 'correct' && <Icons.Check size={18} stroke={2.5} />}
                {st === 'incorrect' && <Icons.X size={18} stroke={2.5} />}
                {st === 'reveal-correct' && <Icons.Check size={18} stroke={2} />}
              </span>
            </button>
          )
        })}
      </div>

      {isMulti && !answered && (
        <button className="btn btn-primary" onClick={submitMulti} disabled={selected.length === 0}>
          Svara ({selected.length} {selected.length === 1 ? 'vald' : 'valda'})
        </button>
      )}

      {showFeedback && (
        <FeedbackPanel question={question} correct={correct} isMulti={isMulti} />
      )}

      {answered && feedbackMode !== 'instant' && (
        <div className="feedback" style={{ background: 'var(--bg-level-2)', color: 'var(--text-secondary)', border: '1px solid var(--border-light)' }}>
          <div className="feedback-icon" style={{ background: 'var(--accent, var(--brand-default))', color: '#fff' }}>
            <Icons.Check size={18} stroke={2.5} />
          </div>
          <div className="feedback-body">
            <div className="feedback-title" style={{ color: 'var(--text-primary)' }}>Svar sparat</div>
            <div className="feedback-sub">Du ser facit i slutet av provet.</div>
          </div>
        </div>
      )}
    </div>
  )
}
