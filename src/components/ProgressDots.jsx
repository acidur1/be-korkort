export default function ProgressDots({ questions, currentIndex, results, chapterFor }) {
  return (
    <div className="flex flex-wrap gap-1 items-center">
      {questions.map((q, i) => {
        const chapter = chapterFor(q.id)
        const entry = results[chapter]?.questions[q.id]
        let cls = 'w-2 h-2 rounded-full border'
        if (i === currentIndex) {
          cls += ' bg-blue-600 border-blue-600'
        } else if (entry?.answered) {
          cls += entry.isCorrect ? ' bg-green-500 border-green-500' : ' bg-red-500 border-red-500'
        } else {
          cls += ' bg-transparent border-gray-400 dark:border-gray-500'
        }
        return <span key={q.id} className={cls} />
      })}
    </div>
  )
}
