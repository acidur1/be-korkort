import { useEffect, useRef } from 'react'

export default function AchievementToast({ achievement, onDismiss }) {
  const dismissRef = useRef(onDismiss)
  useEffect(() => { dismissRef.current = onDismiss }, [onDismiss])

  useEffect(() => {
    if (!achievement) return
    const t = setTimeout(() => { dismissRef.current?.() }, 4000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [achievement?.id])

  if (!achievement) return null
  return (
    <div className="toast-wrap">
      <div className="toast" onClick={() => dismissRef.current?.()}>
        <div className="toast-icon">{achievement.icon}</div>
        <div className="toast-body">
          <div className="toast-eyebrow">Märke upplåst</div>
          <div className="toast-title">{achievement.title}</div>
          <div className="toast-sub">{achievement.sub}</div>
        </div>
      </div>
    </div>
  )
}
