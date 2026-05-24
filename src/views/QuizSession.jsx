import { useEffect, useState } from 'react'
import { Icons } from '../components/Icons.jsx'
import QuestionCard from '../components/QuestionCard.jsx'
import { CHAPTER_META } from '../lib/chapterMeta.js'
import { chapterForQuestion, isAnswerCorrect, recordAnswer } from '../lib/quizState.js'
import { allQuizData } from '../data/questions.js'

export default function QuizSession({ session, quizResults, setSession, setQuizResults, onAbort, onFinish, feedbackMode, progressStyle, onGameAnswer }) {
  const question = session.questions[session.currentIndex]
  const [combo, setCombo] = useState(0)
  const [comboKey, setComboKey] = useState(0)

  useEffect(() => {
    if (!question) onFinish()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question])

  if (!question) return null

  const chapter = chapterForQuestion(allQuizData, question.id)
  const useEphemeral = session.mode === 'random' || session.mode === 'exam' || session.mode === 'wrong-only'
  const savedEntry = useEphemeral
    ? session.ephemeral?.[question.id]
    : quizResults[chapter]?.questions[question.id]

  function handleAnswer(answer) {
    const correct = isAnswerCorrect(question, answer)
    if (correct) {
      setCombo(c => c + 1)
      setComboKey(k => k + 1)
    } else {
      setCombo(0)
    }
    if (onGameAnswer) onGameAnswer(correct)

    if (useEphemeral) {
      const entry = Array.isArray(answer)
        ? { answered: true, isCorrect: correct, selectedAnswers: answer }
        : { answered: true, isCorrect: correct, selectedAnswer: answer }
      setSession({ ...session, ephemeral: { ...(session.ephemeral ?? {}), [question.id]: entry } })
      if (session.mode !== 'exam') {
        setQuizResults(prev => recordAnswer(prev, chapter, question, answer))
      }
      return
    }
    setQuizResults(prev => recordAnswer(prev, chapter, question, answer))
  }

  function next() { setSession({ ...session, currentIndex: session.currentIndex + 1 }) }
  function prev() {
    if (session.currentIndex > 0) setSession({ ...session, currentIndex: session.currentIndex - 1 })
  }

  const isLast = session.currentIndex === session.questions.length - 1
  const hasAnswered = Boolean(savedEntry?.answered)
  const totalQs = session.questions.length
  const currentNo = session.currentIndex + 1

  function entryFor(q) {
    if (useEphemeral) return session.ephemeral?.[q.id]
    const ch = chapterForQuestion(allQuizData, q.id)
    return quizResults[ch]?.questions[q.id]
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div className="quiz-topbar">
        <button onClick={onAbort} className="exit-btn" title="Avbryt och tillbaka till menyn">
          <Icons.ArrowLeft size={16} />
          <span>Avbryt</span>
        </button>
        {progressStyle === 'dots' ? (
          <div className="dots">
            {session.questions.map((q, i) => {
              const e = entryFor(q)
              const cls = ['dot']
              if (i === session.currentIndex) cls.push('current')
              else if (e?.answered) cls.push(e.isCorrect ? 'done-correct' : 'done-wrong')
              return <span key={q.id} className={cls.join(' ')} />
            })}
          </div>
        ) : (
          <div className="progress">
            <div className="progress-fill" style={{ width: `${((currentNo - (hasAnswered ? 0 : 1)) / totalQs) * 100}%` }} />
          </div>
        )}
        {combo >= 2 && (
          <span className="combo" key={comboKey}>🔥 {combo}</span>
        )}
        <div className="progress-counter">{currentNo} <span style={{ opacity: 0.5 }}>/ {totalQs}</span></div>
      </div>

      <QuestionCard
        key={question.id}
        question={question}
        savedEntry={savedEntry}
        onAnswer={handleAnswer}
        feedbackMode={session.mode === 'exam' ? 'end' : feedbackMode}
      />

      <div className="action-bar">
        {session.currentIndex > 0 && (
          <button className="btn btn-secondary" onClick={prev} style={{ flex: '0 0 auto', minWidth: 56 }}>
            <Icons.ArrowLeft size={16} />
          </button>
        )}
        <button
          className="btn btn-primary"
          onClick={isLast ? onFinish : next}
          disabled={!hasAnswered}
        >
          {isLast ? 'Visa resultat' : 'Nästa fråga'}
          <Icons.ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}
