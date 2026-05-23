import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { allQuizData } from './data/questions.js'
import './index.css'

if (import.meta.env.DEV) {
  const total = allQuizData.reduce((s, c) => s + c.questions.length, 0)
  console.assert(total === 135, `Expected 135 questions, got ${total}`)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
