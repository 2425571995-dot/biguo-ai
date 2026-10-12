import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import ResumeChecker from './ResumeChecker'
import AigcChecker from './AigcChecker'
import { track, initAnalytics } from './analytics'

// Hash 路由： #resume → 简历体检, #aigc → AIGC自查, #landing → 落地页, 其他 → 论文助手
function Router() {
  const [mode, setMode] = useState<'paper' | 'resume' | 'aigc'>('paper')

  useEffect(() => {
    initAnalytics()
    const checkHash = () => {
      const hash = window.location.hash.replace('#', '')
      // 落地页是独立静态页，用整页跳转（保留其 SEO 与样式），不参与 SPA 渲染
      if (hash === 'landing') {
        track('view_landing')
        window.location.replace('/landing.html')
        return
      }
      if (hash === 'resume') {
        setMode('resume')
        track('view_resume')
      } else if (hash === 'aigc') {
        setMode('aigc')
        track('view_aigc')
      } else {
        setMode('paper')
        track('view_paper')
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
