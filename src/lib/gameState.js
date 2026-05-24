const DAILY_GOAL_DEFAULT = 10

function todayStr() {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

function yesterdayStr() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

export function defaultGameState() {
  return {
    streakCurrent: 0,
    streakLongest: 0,
    streakLastDate: null,
    todayCount: 0,
    todayDate: null,
    dailyGoal: DAILY_GOAL_DEFAULT,
    achievements: [],
    totalAnswered: 0,
    totalCorrect: 0,
  }
}

export function recordGameAnswer(state, wasCorrect) {
  const today = todayStr()
  const yesterday = yesterdayStr()
  const next = { ...state }

  if (next.streakLastDate === today) {
    // already counted today
  } else if (next.streakLastDate === yesterday) {
    next.streakCurrent += 1
  } else {
    next.streakCurrent = 1
  }
  next.streakLastDate = today
  if (next.streakCurrent > next.streakLongest) next.streakLongest = next.streakCurrent

  if (next.todayDate !== today) {
    next.todayDate = today
    next.todayCount = 0
  }
  next.todayCount += 1

  next.totalAnswered += 1
  if (wasCorrect) next.totalCorrect += 1

  const newAchievements = []
  const has = (id) => next.achievements.includes(id)
  const unlock = (id) => {
    if (!has(id)) { next.achievements = [...next.achievements, id]; newAchievements.push(id) }
  }

  if (next.totalAnswered >= 1) unlock('first_answer')
  if (next.totalAnswered >= 50) unlock('answered_50')
  if (next.totalAnswered >= 100) unlock('answered_100')
  if (next.totalAnswered >= 500) unlock('answered_500')

  if (next.streakCurrent >= 3) unlock('streak_3')
  if (next.streakCurrent >= 7) unlock('streak_7')
  if (next.streakCurrent >= 30) unlock('streak_30')

  if (next.todayCount >= next.dailyGoal) unlock('daily_goal_hit')

  return { state: next, newAchievements }
}

export function chapterMastery(chapterResults) {
  if (!chapterResults || chapterResults.answered === 0) return null
  if (chapterResults.answered < chapterResults.total) return null
  const acc = chapterResults.score / chapterResults.total
  if (acc >= 0.95) return 'gold'
  if (acc >= 0.80) return 'silver'
  if (acc >= 0.60) return 'bronze'
  return null
}

export const ACHIEVEMENT_DEFS = {
  first_answer:    { title: 'Första svaret',     sub: 'Du har startat din resa.',           icon: '✦' },
  answered_50:     { title: '50 frågor',         sub: 'Du har besvarat 50 frågor.',          icon: '★' },
  answered_100:    { title: '100 frågor',        sub: 'Du har besvarat 100 frågor.',         icon: '★' },
  answered_500:    { title: 'Veteran',           sub: '500 besvarade frågor — imponerande!', icon: '✪' },
  streak_3:        { title: '3 dagar i rad',     sub: 'Du har övat 3 dagar i rad.',          icon: '◆' },
  streak_7:        { title: '7 dagar i rad',     sub: 'En hel vecka av övning.',             icon: '◆' },
  streak_30:       { title: '30 dagar i rad',    sub: 'En månads disciplin!',                icon: '✦' },
  daily_goal_hit:  { title: 'Dagens mål',        sub: 'Du har nått ditt dagliga mål.',       icon: '●' },
  perfect_session: { title: 'Perfekt omgång',    sub: 'Alla rätt i en omgång.',              icon: '✦' },
  all_gold:        { title: 'Alla på guld',      sub: 'Du har guld i alla kapitel.',         icon: '☆' },
  chapter_gold:    { title: 'Guldmärke',         sub: 'Du har klarat ett helt kapitel.',     icon: '☆' },
}
