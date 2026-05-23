import { describe, it, expect } from 'vitest'
import { allQuizData } from './questions.js'

describe('allQuizData', () => {
  it('has exactly 135 questions across all chapters', () => {
    const total = allQuizData.reduce((sum, ch) => sum + ch.questions.length, 0)
    expect(total).toBe(135)
  })

  it('has unique chapter names', () => {
    const names = allQuizData.map(c => c.chapter)
    expect(new Set(names).size).toBe(names.length)
  })

  it('has unique question ids across all chapters', () => {
    const ids = allQuizData.flatMap(c => c.questions.map(q => q.id))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every correct[] is a non-empty subset of options[]', () => {
    for (const chapter of allQuizData) {
      for (const q of chapter.questions) {
        expect(q.correct.length, `q${q.id} has empty correct[]`).toBeGreaterThan(0)
        for (const c of q.correct) {
          expect(q.options, `q${q.id} correct "${c}" not in options`).toContain(c)
        }
      }
    }
  })

  it('no question has empty text, options, or correct strings', () => {
    for (const chapter of allQuizData) {
      for (const q of chapter.questions) {
        expect(q.text.trim()).not.toBe('')
        expect(q.options.length).toBeGreaterThan(1)
        for (const opt of q.options) expect(opt.trim()).not.toBe('')
        for (const c of q.correct) expect(c.trim()).not.toBe('')
      }
    }
  })

  it('all chapters have a name and a questions array', () => {
    for (const ch of allQuizData) {
      expect(ch.chapter).toBeTruthy()
      expect(Array.isArray(ch.questions)).toBe(true)
      expect(ch.questions.length).toBeGreaterThan(0)
    }
  })
})
