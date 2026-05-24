import { useState } from 'react'
import { Icons } from './Icons.jsx'
import { letterFor, stripPrefix } from '../lib/chapterMeta.js'

export default function ReviewList({ items }) {
  const [openId, setOpenId] = useState(null)
  return (
    <div className="review-list">
      {items.map(({ question, entry }, i) => {
        const open = openId === question.id
        const isMulti = question.correct.length > 1
        const userPicked = isMulti ? (entry.selectedAnswers || []) : [entry.selectedAnswer]
        return (
          <div className={`review-item${open ? ' open' : ''}`} key={question.id}>
            <button className="review-q" onClick={() => setOpenId(open ? null : question.id)}>
              <span className="review-q-num">{i + 1}</span>
              <span className="review-q-text" dangerouslySetInnerHTML={{ __html: question.text }} />
              <span className="review-q-chev"><Icons.ChevronDown size={18} /></span>
            </button>
            {open && (
              <div className="review-detail">
                <div className="review-detail-label">Du svarade</div>
                {userPicked.filter(Boolean).map(a => (
                  <div key={a} className="review-answer your">
                    <strong style={{ marginRight: 8 }}>{letterFor(question.options.indexOf(a))}</strong>
                    {stripPrefix(a)}
                  </div>
                ))}
                <div className="review-detail-label" style={{ marginTop: 4 }}>Rätt svar</div>
                {question.correct.map(a => (
                  <div key={a} className="review-answer correct">
                    <strong style={{ marginRight: 8 }}>{letterFor(question.options.indexOf(a))}</strong>
                    {stripPrefix(a)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
