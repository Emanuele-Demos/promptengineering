import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

type ThemeMode = 'light' | 'dark'

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('teamflow-theme')
    return saved === 'dark' ? 'dark' : 'light'
  })

  useEffect(() => {
    localStorage.setItem('teamflow-theme', theme)
    document.documentElement.classList.toggle('theme-dark', theme === 'dark')
  }, [theme])

  return (
    <div className="theme-toggle-shell inline-flex items-center gap-1 rounded-2xl border p-1 shadow-sm">
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={`theme-toggle-button inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ${theme === 'light' ? 'theme-toggle-button--active' : ''}`}
        aria-pressed={theme === 'light'}
        title="Tema chiaro"
      >
        <Sun className="h-4 w-4" />
        Light
      </button>
      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={`theme-toggle-button inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ${theme === 'dark' ? 'theme-toggle-button--active' : ''}`}
        aria-pressed={theme === 'dark'}
        title="Tema scuro"
      >
        <Moon className="h-4 w-4" />
        Dark
      </button>
    </div>
  )
}