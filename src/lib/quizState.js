export function initialResults(allQuizData) {
  const r = {}
  for (const ch of allQuizData) {
    r[ch.chapter] = { score: 0, total: ch.questions.length, answered: 0, questions: {} }
  }
  return r
}

export function isAnswerCorrect(question, answer) {
  if (Array.isArray(answer)) {
    if (answer.length !== question.correct.length) return false
    return answer.every(a => question.correct.includes(a))
  }
  return question.correct.length === 1 && question.correct[0] === answer
}

export function recordAnswer(results, chapterName, question, answer) {
  const next = { ...results }
  next[chapterName] = { ...results[chapterName] }
  const ch = next[chapterName]
  ch.questions = { ...ch.questions }
  const wasAnswered = Boolean(ch.questions[question.id]?.answered)
  const wasCorrect = Boolean(ch.questions[question.id]?.isCorrect)
  const correct = isAnswerCorrect(question, answer)
  ch.questions[question.id] = Array.isArray(answer)
    ? { answered: true, isCorrect: correct, selectedAnswers: answer }
    : { answered: true, isCorrect: correct, selectedAnswer: answer }
  if (!wasAnswered) ch.answered += 1
  if (wasCorrect && !correct) ch.score -= 1
  if (!wasCorrect && correct) ch.score += 1
  return next
}

export function getWrongQuestions(results, allQuizData) {
  const wrong = []
  for (const ch of allQuizData) {
    const rch = results[ch.chapter]
    if (!rch) continue
    for (const q of ch.questions) {
      const entry = rch.questions[q.id]
      if (entry?.answered && !entry.isCorrect) wrong.push(q)
    }
  }
  return wrong
}

export function chapterForQuestion(allQuizData, qid) {
  for (const ch of allQuizData) {
    if (ch.questions.some(q => q.id === qid)) return ch.chapter
  }
  return null
}

export function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function createSession(mode, allQuizData, results, chapterName = null) {
  let questions = []
  let currentIndex = 0
  if (mode === 'chapter') {
    const ch = allQuizData.find(c => c.chapter === chapterName)
    questions = ch ? ch.questions.slice() : []
    const rch = results[chapterName]
    if (rch) {
      const idx = questions.findIndex(q => !rch.questions[q.id]?.answered)
      currentIndex = idx === -1 ? 0 : idx
    }
  } else if (mode === 'all') {
    questions = allQuizData.flatMap(c => c.questions)
    const idx = questions.findIndex(q => {
      const ch = allQuizData.find(c => c.questions.some(qq => qq.id === q.id))
      return !results[ch.chapter]?.questions[q.id]?.answered
    })
    currentIndex = idx === -1 ? 0 : idx
  } else if (mode === 'random' || mode === 'exam') {
    questions = shuffle(allQuizData.flatMap(c => c.questions)).slice(0, 30)
  } else if (mode === 'wrong-only') {
    questions = getWrongQuestions(results, allQuizData)
  }
  return { mode, questions, currentIndex, chapterName, startedAt: Date.now(), ephemeral: {} }
}
