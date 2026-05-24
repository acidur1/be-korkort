import { Icons } from '../components/Icons.jsx'
import { CHAPTER_META } from '../lib/chapterMeta.js'
import { chapterMastery } from '../lib/gameState.js'

export default function StartScreen({ allQuizData, quizResults, wrongCount, onStart, onClearResults, dark, onToggleDark, gameState }) {
  const totalAnswered = Object.values(quizResults).reduce((s, c) => s + c.answered, 0)
  const totalScore = Object.values(quizResults).reduce((s, c) => s + c.score, 0)
  const totalQuestions = Object.values(quizResults).reduce((s, c) => s + c.total, 0)
  const pct = totalQuestions ? Math.round((totalAnswered / totalQuestions) * 100) : 0
  const accuracy = totalAnswered ? Math.round((totalScore / totalAnswered) * 100) : 0

  const circumference = 2 * Math.PI * 42
  const dash = (pct / 100) * circumference

  return (
    <>
      <section className="hero">
        <div className="hero-top">
          <div className="hero-brand">
            <div className="hero-brand-mark" aria-hidden="true">BE</div>
            <div className="hero-brand-text">
              <div className="hero-brand-main">Körkort</div>
              <div className="hero-brand-sub">Tunga släp · Övningsprov</div>
            </div>
          </div>
          <button
            className="hero-icon-btn"
            onClick={onToggleDark}
            aria-label="Växla tema"
            title={dark ? 'Ljust läge' : 'Mörkt läge'}
          >
            {dark ? <Icons.Sun size={18} /> : <Icons.Moon size={18} />}
          </button>
        </div>

        <div className="hero-content">
          <h1 className="hero-title">Bli redo för provet.</h1>
          <p className="hero-sub">
            {totalAnswered === 0
              ? 'Starta med ett kapitel eller dra ett slumpat prov för att se var du står.'
              : pct === 100
                ? 'Du har gått igenom alla frågor. Öva fel-svar eller kör ett slumpat prov.'
                : `Fortsätt där du slutade — ${totalAnswered} av ${totalQuestions} frågor besvarade.`}
          </p>
        </div>

        <div className="hero-stats">
          <div className="ring-wrap">
            <svg viewBox="0 0 100 100">
              <circle className="ring-track" cx="50" cy="50" r="42" />
              <circle
                className="ring-fill"
                cx="50" cy="50" r="42"
                strokeDasharray={`${dash} ${circumference}`}
              />
            </svg>
            <div className="ring-label">
              <div>
                <div className="ring-label-num">{pct}%</div>
                <div className="ring-label-cap">klart</div>
              </div>
            </div>
          </div>
          <div className="kv-grid">
            <div className="kv">
              <div className="kv-num">{totalAnswered}<span style={{ opacity: 0.5, fontSize: '0.55em', fontWeight: 500 }}> / {totalQuestions}</span></div>
              <div className="kv-label">Besvarade</div>
            </div>
            <div className="kv">
              <div className="kv-num">{accuracy}%</div>
              <div className="kv-label">Träffsäkerhet</div>
            </div>
            <div className="kv">
              <div className="kv-num" style={{ color: wrongCount > 0 ? 'var(--brand-yellow)' : '#fff' }}>{wrongCount}</div>
              <div className="kv-label">Att repetera</div>
            </div>
          </div>
        </div>

        <div className="hero-game">
          <div className="hero-chip">
            <div className="hero-chip-icon flame">🔥</div>
            <div className="hero-chip-body">
              <div className="hero-chip-num">
                {gameState?.streakCurrent || 0}
                <span style={{ opacity: 0.55, fontWeight: 500, fontSize: '0.75em' }}> {(gameState?.streakCurrent || 0) === 1 ? 'dag' : 'dagar'}</span>
              </div>
              <div className="hero-chip-label">Streak</div>
            </div>
          </div>
          <div className="hero-chip">
            <div className="hero-chip-icon goal">🎯</div>
            <div className="hero-chip-body" style={{ flex: 1 }}>
              <div className="hero-chip-num" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {Math.min(gameState?.todayCount || 0, gameState?.dailyGoal || 10)}
                <span style={{ opacity: 0.55, fontWeight: 500 }}>/{gameState?.dailyGoal || 10}</span>
              </div>
              <div className="hero-chip-label">Idag</div>
              <div className="hero-chip-bar">
                <div
                  className={'hero-chip-bar-fill' + ((gameState?.todayCount || 0) >= (gameState?.dailyGoal || 10) ? ' done' : '')}
                  style={{ width: `${Math.min(100, ((gameState?.todayCount || 0) / (gameState?.dailyGoal || 10)) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="modes">
          <button className="mode" onClick={() => onStart('random')}>
            <div className="mode-icon mode-icon-brand"><Icons.Dice size={20} /></div>
            <div className="mode-body">
              <div className="mode-title">Slumpat prov</div>
              <div className="mode-sub">30 frågor · som ett riktigt prov</div>
            </div>
            <div className="mode-chev"><Icons.ChevronRight size={18} /></div>
          </button>
          <button
            className="mode"
            onClick={() => wrongCount > 0 && onStart('wrong-only')}
            disabled={wrongCount === 0}
            style={wrongCount === 0 ? { opacity: 0.55, cursor: 'not-allowed' } : null}
          >
            <div className="mode-icon mode-icon-warn"><Icons.Repeat size={20} /></div>
            <div className="mode-body">
              <div className="mode-title">Öva fel</div>
              <div className="mode-sub">
                {wrongCount > 0 ? `${wrongCount} ${wrongCount === 1 ? 'fråga' : 'frågor'} att repetera` : 'Inget att repetera ännu'}
              </div>
            </div>
            <div className="mode-chev"><Icons.ChevronRight size={18} /></div>
          </button>
          <button className="mode" onClick={() => onStart('exam')}>
            <div className="mode-icon mode-icon-aux"><Icons.GraduationCap size={20} /></div>
            <div className="mode-body">
              <div className="mode-title">Provläge</div>
              <div className="mode-sub">30 frågor · facit i slutet</div>
            </div>
            <div className="mode-chev"><Icons.ChevronRight size={18} /></div>
          </button>
        </div>
      </section>

      <section>
        <div className="section-head">
          <div className="section-title">Kapitel</div>
          <div className="section-link" style={{ fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
            {totalQuestions} frågor
          </div>
        </div>
        <div className="chapter-list">
          {allQuizData.map(ch => {
            const rch = quizResults[ch.chapter] || { answered: 0, score: 0 }
            const total = ch.questions.length
            const chPct = total ? (rch.answered / total) * 100 : 0
            const chAcc = rch.answered ? Math.round((rch.score / rch.answered) * 100) : 0
            const done = rch.answered === total
            const meta = CHAPTER_META[ch.chapter] || { num: '?', short: ch.chapter, icon: Icons.BookOpen }
            const ChIcon = meta.icon
            const mastery = chapterMastery(rch)
            const fillCls = !rch.answered ? 'score-zero' : chAcc < 60 ? 'score-low' : ''
            return (
              <button key={ch.chapter} className="chapter" onClick={() => onStart('chapter', ch.chapter)}>
                <div className={`chapter-num${done ? ' done' : ''}`}>
                  {done ? <Icons.Check size={18} stroke={2.5} /> : <ChIcon size={20} />}
                </div>
                <div className="chapter-body">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: 0 }}>
                    <div className="chapter-name" style={{ flex: 1, minWidth: 0 }}>{meta.short}</div>
                    {mastery && (
                      <span className={`mastery mastery-${mastery}`}>
                        {mastery === 'gold' ? '★ Guld' : mastery === 'silver' ? '◆ Silver' : '● Brons'}
                      </span>
                    )}
                  </div>
                  <div className="chapter-bar">
                    <div className={`chapter-bar-fill ${fillCls}`} style={{ width: `${chPct}%` }} />
                  </div>
                  <div className="chapter-meta">
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>{rch.answered} / {total}</span>
                    {rch.answered > 0 && (
                      <>
                        <span style={{ opacity: 0.4 }}>·</span>
                        <span style={{ color: chAcc >= 80 ? 'var(--success-text-default)' : chAcc >= 60 ? 'var(--warning-text-default)' : 'var(--error-text-default)' }}>
                          {chAcc}% rätt
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="chapter-cta"><Icons.ChevronRight size={20} /></div>
              </button>
            )
          })}
        </div>
      </section>

      {totalAnswered > 0 && (
        <div className="footer">
          <button onClick={onClearResults} className="link-danger">Rensa sparade resultat</button>
        </div>
      )}

      <section>
        <div className="tip-card">
          <div className="tip-icon" aria-hidden="true">📚</div>
          <div className="tip-body">
            <div className="tip-title">Studietips</div>
            <div className="tip-text">BE-boken finns att låna på ditt lokala bibliotek.</div>
          </div>
        </div>
      </section>
    </>
  )
}
