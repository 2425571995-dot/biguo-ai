import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import ResumeChecker from './ResumeChecker'

// Hash 路由： #resume → 简历体检, 其他 → 论文助手
function Router() {
  const [mode, setMode] = useState<'paper' | 'resume'>('paper')

  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash.replace('#', '')
      if (hash === 'resume') {
        setMode('resume')
      } else {
        setMode('paper')
      }
    }
    checkHash()
    window.addEventListener('hashchange', checkHash)
    return () => window.removeEventListener('hashchange', checkHash)
  }, [])

  return mode === 'resume' ? <ResumeChecker /> : <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router />
  </StrictMode>,
)
