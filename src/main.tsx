import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

const savedTheme = localStorage.getItem('teamflow-theme')
if (savedTheme === 'dark') {
  document.documentElement.classList.add('theme-dark')
} else {
  document.documentElement.classList.remove('theme-dark')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
