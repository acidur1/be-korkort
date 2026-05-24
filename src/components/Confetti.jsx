import { useEffect, useState } from 'react'

export default function Confetti({ count = 60, trigger }) {
  const [particles, setParticles] = useState([])

  useEffect(() => {
    if (!trigger) return
    const colors = ['#f59e0b', '#10b981', '#3b82f6', '#e11d48', '#8b5cf6', '#fbbf24']
    const arr = Array.from({ length: count }, (_, i) => ({
      id: trigger + '_' + i,
      left: 50 + (Math.random() - 0.5) * 30,
      x: (Math.random() - 0.5) * 240,
      y: 200 + Math.random() * 300,
      rot: Math.random() * 720 - 360,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.2,
      shape: Math.random() > 0.5 ? 'square' : 'circle',
      size: 6 + Math.random() * 6,
    }))
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setParticles(arr)
    const t = setTimeout(() => setParticles([]), 2200)
    return () => clearTimeout(t)
  }, [trigger, count])

  if (!particles.length) return null
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 100 }}>
      {particles.map(p => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: '20%',
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
            animation: `confetti-fall 1.8s cubic-bezier(0.2, 0.6, 0.4, 1) ${p.delay}s forwards`,
            '--cx': `${p.x}px`,
            '--cy': `${p.y}px`,
            '--cr': `${p.rot}deg`,
          }}
        />
      ))}
    </div>
  )
}
