import { useMemo, useState } from 'react'
import { Icons } from '../components/Icons.jsx'
import ReviewList from '../components/ReviewList.jsx'
import { CHAPTER_META } from '../lib/chapterMeta.js'
import { chapterForQuestion } from '../lib/quizState.js'
import { allQuizData } from '../data/questions.js'

export default function ResultsScreen({ session, quizResults, onBackToMenu, onPracticeWrong, onRestart }) {
  const useEphemeral = session.mode === 'random' || session.mode === 'exam' || session.mode === 'wrong-only'
  let sessionScore = 0
  const sessionWrong = []
  const sessionDetail = []

  for (const q of session.questions) {
    const entry = useEphemeral
      ? session.ephemeral?.[q.id]
      : quizResults[chapterForQuestion(allQuizData, q.id)]?.questions[q.id]
    if (entry?.isCorrect) sessionScore += 1
    if (entry?.answered && !entry.isCorrect) sessionWrong.push(q)
    sessionDetail.push({ question: q, entry })
  }

  const total = session.questions.length
  const pct = total ? Math.round((sessionScore / total) * 100) : 0
  const passed = pct >= 75
  const [finishedAt] = useState(() => Date.now())
  const elapsedMin = session.startedAt ? Math.max(1, Math.round((finishedAt - session.startedAt) / 60000)) : null

  let headline = 'Bra övning!'
  let sub = 'Fortsätt så bygger du upp en stark grund.'
  if (session.mode === 'exam' || session.mode === 'random') {
    if (passed) {
      headline = pct === 100 ? 'Perfekt!' : 'Godkänt resultat.'
      sub = pct === 100 ? 'Inget fel — du är redo för provet.' : 'Du är på god väg. Repetera fel-svaren för att slipa till det.'
    } else {
      headline = 'Inte riktigt godkänt.'
      sub = 'Provet kräver minst 75 % rätt. Repetera fel-svaren och försök igen.'
    }
  } else if (session.mode === 'chapter') {
    headline = pct === 100 ? 'Hela kapitlet klart.' : 'Kapitel-övning klar.'
    sub = pct === 100 ? 'Snyggt jobbat. Prova ett annat kapitel eller dra ett prov.' : 'Repetera dina fel-svar för att förbättra resultatet.'
  } else if (session.mode === 'wrong-only') {
    headline = sessionWrong.length === 0 ? 'Alla rätt!' : 'Repetition klar.'
    sub = sessionWrong.length === 0 ? 'Du har fixat allt du tidigare svarat fel på.' : `${sessionWrong.length} frågor kvar att repetera.`
  }

  const circumference = 2 * Math.PI * 56
  const dash = (pct / 100) * circumference
  const ringColor = passed ? 'var(--brand-yellow)' : 'var(--error-bg-strong)'

  const chapterBreakdown = useMemo(() => {
    const byCh = {}
    for (const { question, entry } of sessionDetail) {
      const ch = chapterForQuestion(allQuizData, question.id)
      if (!byCh[ch]) byCh[ch] = { total: 0, correct: 0 }
      byCh[ch].total += 1
      if (entry?.isCorrect) byCh[ch].correct += 1
    }
    return Object.entries(byCh).map(([ch, v]) => ({ chapter: ch, ...v, pct: Math.round((v.correct / v.total) * 100) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.questions, session.ephemeral, quizResults])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <section className="result-hero">
        <div className="ring-wrap">
          <svg viewBox="0 0 132 132">
            <circle cx="66" cy="66" r="56" fill="none" stroke="var(--opacity-white-15)" strokeWidth="12" />
            <circle
              cx="66" cy="66" r="56"
              fill="none"
              stroke={ringColor}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
              transform="rotate(-90 66 66)"
              style={{ transition: 'stroke-dasharray 700ms cubic-bezier(0.2, 0, 0, 1)' }}
            />
          </svg>
          <div className="ring-label">
            <div>
              <div className="ring-label-num">{pct}%</div>
              <div className="ring-label-cap">{sessionScore} / {total}</div>
            </div>
          </div>
        </div>
        <div style={{ minWidth: 0 }}>
          <h1 className="result-headline">{headline}</h1>
          <p className="result-sub">{sub}</p>
          <div className="result-stats-row">
            <div className="result-stat">
              <div className="result-stat-num" style={{ color: 'var(--brand-yellow)' }}>{sessionScore}</div>
              <div className="result-stat-label">Rätt</div>
            </div>
            <div className="result-stat">
              <div className="result-stat-num" style={{ color: '#fff' }}>{sessionWrong.length}</div>
              <div className="result-stat-label">Fel</div>
            </div>
            {elapsedMin !== null && (
              <div className="result-stat">
                <div className="result-stat-num">{elapsedMin} min</div>
                <div className="result-stat-label">Tid</div>
              </div>
            )}
            {(session.mode === 'exam' || session.mode === 'random') && (
              <div className="result-stat">
                <div className="result-stat-num" style={{ color: passed ? 'var(--brand-yellow)' : '#ffb3b2' }}>
                  {passed ? 'Godkänt' : 'Underkänt'}
                </div>
                <div className="result-stat-label">Mot 75 % gräns</div>
              </div>
            )}
          </div>
        </div>
      </section>

      {chapterBreakdown.length > 1 && (
        <section className="card">
          <div className="section-head" style={{ margin: 0, padding: 0, marginBottom: 'var(--space-4)' }}>
            <div className="section-title">Per kapitel</div>
          </div>
          <div className="breakdown">
            {chapterBreakdown.map(c => {
              const meta = CHAPTER_META[c.chapter] || { short: c.chapter }
              return (
                <div className="breakdown-row" key={c.chapter}>
                  <div className="breakdown-name">{meta.short}</div>
                  <div className="breakdown-count">{c.correct} / {c.total}</div>
                  <div className="breakdown-bar">
                    <div
                      className="breakdown-fill"
                      style={{
                        width: `${c.pct}%`,
                        background: c.pct >= 75 ? 'var(--success-bg-strong)' : c.pct >= 50 ? 'var(--warning-bdr-strong)' : 'var(--error-bg-strong)',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {sessionWrong.length > 0 && (
        <section>
          <div className="section-head">
            <div className="section-title">Genomgång av fel-svar ({sessionWrong.length})</div>
          </div>
          <ReviewList items={sessionDetail.filter(d => d.entry?.answered && !d.entry.isCorrect)} />
        </section>
      )}

      <div className="action-bar" style={{ position: 'static' }}>
        <button className="btn btn-secondary" onClick={onBackToMenu}>
          <Icons.ArrowLeft size={16} />
          Tillbaka
        </button>
        {sessionWrong.length > 0 ? (
          <button className="btn btn-primary" onClick={() => onPracticeWrong(sessionWrong)}>
            <Icons.Repeat size={16} />
            Öva fel ({sessionWrong.length})
          </button>
        ) : (
          <button className="btn btn-primary" onClick={onRestart}>
            <Icons.Restart size={16} />
            Kör igen
          </button>
        )}
      </div>
    </div>
  )
}
