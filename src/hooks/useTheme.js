import { useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage.js'

export function useTheme() {
  const [theme, setTheme] = useLocalStorage('theme', 'auto') // 'light' | 'dark' | 'auto'

  useEffect(() => {
    const root = document.documentElement
    const apply = () => {
      const isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      root.classList.toggle('dark', isDark)
    }
    apply()
    if (theme === 'auto') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      mq.addEventListener('change', apply)
      return () => mq.removeEventListener('change', apply)
    }
  }, [theme])

  function cycle() {
    setTheme(t => (t === 'auto' ? 'light' : t === 'light' ? 'dark' : 'auto'))
  }

  return { theme, setTheme, cycle }
}
