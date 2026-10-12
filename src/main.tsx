import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import ResumeChecker from './ResumeChecker'
import AigcChecker from './AigcChecker'

// Hash 路由： #resume → 简历体检, #aigc → AIGC自查, 其他 → 论文助手
function Router() {
  const [mode, setMode] = useState<'paper' | 'resume' | 'aigc'>('paper')

  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash.replace('#', '')
      if (hash === 'resume') {
        setMode('resume')
      } else if (hash === 'aigc') {
        setMode('aigc')
      } else {
        setMode('paper')
      }
    }
    checkHash()
    window.addEventListener('hashchange', checkHash)
    return () => window.removeEventListener('hashchange', checkHash)
  }, [])

  if (mode === 'resume') return <ResumeChecker />
  if (mode === 'aigc') return <AigcChecker />
  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router />
  </StrictMode>,
)
