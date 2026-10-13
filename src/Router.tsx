import { useState, useEffect } from 'react'
import App from './App'
import ResumeChecker from './ResumeChecker'
import AigcChecker from './AigcChecker'
import { track, initAnalytics } from './analytics'

type Mode = 'paper' | 'resume' | 'aigc'

// 读当前 hash 对应的视图。
// 注意：'/' 现在是简历体检（战略主线），论文助手挪到 #paper。
// 保留旧行为：论文助手的老书签指向 '/'，会落到简历页；老客户由闲鱼发货卡通知新链接。
function resolve(hash: string): Mode | 'landing' {
  if (hash === 'landing') return 'landing'
  if (hash === 'paper') return 'paper'
  if (hash === 'aigc') return 'aigc'
  if (hash === 'resume') return 'resume'
  return 'resume' // 默认（含空 hash）= 简历体检
}

export default function Router() {
  const [mode, setMode] = useState<Mode>(() => {
    const r = resolve(window.location.hash.replace('#', ''))
    return r === 'landing' ? 'resume' : r
  })

  useEffect(() => {
    initAnalytics()
    const checkHash = () => {
      const hash = window.location.hash.replace('#', '')
      const r = resolve(hash)
      // 落地页是独立静态页，用整页跳转（保留其 SEO 与样式），不参与 SPA 渲染
      if (r === 'landing') {
        track('view_landing')
        window.location.replace('/landing.html')
        return
      }
      setMode(r)
      track(r === 'paper' ? 'view_paper' : r === 'resume' ? 'view_resume' : 'view_aigc')
    }
    checkHash()
    window.addEventListener('hashchange', checkHash)
    return () => window.removeEventListener('hashchange', checkHash)
  }, [])

  if (mode === 'paper') return <App />
  if (mode === 'aigc') return <AigcChecker />
  return <ResumeChecker />
}
