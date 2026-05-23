import { describe, it, expect } from 'vitest'
import {
  createSession,
  recordAnswer,
  isAnswerCorrect,
  getWrongQuestions,
  initialResults,
} from './quizState.js'
import { allQuizData } from '../data/questions.js'

const firstChapter = allQuizData[0].chapter

describe('initialResults', () => {
  it('builds empty results keyed by chapter', () => {
    const r = initialResults(allQuizData)
    expect(Object.keys(r)).toHaveLength(allQuizData.length)
    for (const ch of allQuizData) {
      expect(r[ch.chapter]).toEqual({
        score: 0,
        total: ch.questions.length,
        answered: 0,
        questions: {},
      })
    }
  })
})

describe('createSession', () => {
  it('chapter mode includes only that chapter and starts at index 0 when no progress', () => {
    const s = createSession('chapter', allQuizData, initialResults(allQuizData), firstChapter)
    expect(s.questions.length).toBe(allQuizData[0].questions.length)
    expect(s.currentIndex).toBe(0)
    expect(s.mode).toBe('chapter')
  })

  it('chapter mode resumes at first unanswered question', () => {
    const results = initialResults(allQuizData)
    const ch = results[firstChapter]
    ch.questions[allQuizData[0].questions[0].id] = { answered: true, isCorrect: true, selectedAnswer: 'x' }
    ch.questions[allQuizData[0].questions[1].id] = { answered: true, isCorrect: false, selectedAnswer: 'y' }
    ch.answered = 2
    const s = createSession('chapter', allQuizData, results, firstChapter)
    expect(s.currentIndex).toBe(2)
  })

  it('all mode includes all 135 questions', () => {
    const s = createSession('all', allQuizData, initialResults(allQuizData))
    expect(s.questions.length).toBe(135)
  })

  it('random mode includes 30 questions, all distinct', () => {
    const s = createSession('random', allQuizData, initialResults(allQuizData))
    expect(s.questions.length).toBe(30)
    const ids = s.questions.map(q => q.id)
    expect(new Set(ids).size).toBe(30)
  })

  it('wrong-only mode includes only previously-wrong questions', () => {
    const results = initialResults(allQuizData)
    const q0 = allQuizData[0].questions[0]
    const q1 = allQuizData[0].questions[1]
    results[firstChapter].questions[q0.id] = { answered: true, isCorrect: false, selectedAnswer: 'x' }
    results[firstChapter].questions[q1.id] = { answered: true, isCorrect: true, selectedAnswer: 'y' }
    const s = createSession('wrong-only', allQuizData, results)
    expect(s.questions).toHaveLength(1)
    expect(s.questions[0].id).toBe(q0.id)
  })
})

describe('isAnswerCorrect', () => {
  it('single-choice matches when selection equals the one correct value', () => {
    const q = { correct: ['B'], options: ['A','B','C'] }
    expect(isAnswerCorrect(q, 'B')).toBe(true)
    expect(isAnswerCorrect(q, 'A')).toBe(false)
  })

  it('multi-choice requires exact set match', () => {
    const q = { correct: ['B','D'], options: ['A','B','C','D'] }
    expect(isAnswerCorrect(q, ['B','D'])).toBe(true)
    expect(isAnswerCorrect(q, ['D','B'])).toBe(true)
    expect(isAnswerCorrect(q, ['B'])).toBe(false)
    expect(isAnswerCorrect(q, ['B','C','D'])).toBe(false)
  })
})

describe('recordAnswer', () => {
  it('writes single-choice answer and updates counts', () => {
    const results = initialResults(allQuizData)
    const q = allQuizData[0].questions[0]
    const next = recordAnswer(results, firstChapter, q, q.correct[0])
    expect(next[firstChapter].questions[q.id]).toEqual({
      answered: true,
      isCorrect: true,
      selectedAnswer: q.correct[0],
    })
    expect(next[firstChapter].answered).toBe(1)
    expect(next[firstChapter].score).toBe(1)
  })

  it('writes multi-choice answer with selectedAnswers array', () => {
    const results = initialResults(allQuizData)
    // find a known multi-choice question (correct.length > 1)
    const q = allQuizData[0].questions.find(qq => qq.correct.length > 1)
    expect(q).toBeDefined()
    const next = recordAnswer(results, firstChapter, q, q.correct)
    expect(next[firstChapter].questions[q.id].selectedAnswers).toEqual(q.correct)
    expect(next[firstChapter].questions[q.id].isCorrect).toBe(true)
    expect(next[firstChapter].score).toBe(1)
  })

  it('does not double-count if same question is answered twice', () => {
    const results = initialResults(allQuizData)
    const q = allQuizData[0].questions[0]
    const r1 = recordAnswer(results, firstChapter, q, q.options[0])
    const r2 = recordAnswer(r1, firstChapter, q, q.correct[0])
    expect(r2[firstChapter].answered).toBe(1)
    // score reflects latest answer
    expect(r2[firstChapter].score).toBe(1)
  })
})

describe('getWrongQuestions', () => {
  it('returns flat list of all questions with isCorrect=false', () => {
    const results = initialResults(allQuizData)
    const q0 = allQuizData[0].questions[0]
    const q1 = allQuizData[1].questions[0]
    results[allQuizData[0].chapter].questions[q0.id] = { answered: true, isCorrect: false, selectedAnswer: 'x' }
    results[allQuizData[1].chapter].questions[q1.id] = { answered: true, isCorrect: false, selectedAnswer: 'y' }
    const wrong = getWrongQuestions(results, allQuizData)
    expect(wrong).toHaveLength(2)
    expect(wrong.map(q => q.id).sort()).toEqual([q0.id, q1.id].sort())
  })
})
