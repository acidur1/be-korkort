export default function ThemeToggle({ theme, onCycle }) {
  const label = theme === 'auto' ? 'Auto' : theme === 'dark' ? 'Mörkt' : 'Ljust'
  const icon = theme === 'auto' ? '🌓' : theme === 'dark' ? '🌙' : '☀️'
  return (
    <button
      onClick={onCycle}
      aria-label={`Tema: ${label}`}
      className="px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600"
    >
      <span aria-hidden>{icon}</span> <span className="text-sm">{label}</span>
    </button>
  )
}
