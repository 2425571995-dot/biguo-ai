import { useState, useEffect, useRef } from 'react'
import { DEEPSEEK_URL, SENSITIVE_WORDS, SHARE_URL } from './constants'
import type { Post, SensitiveWord, Template } from './types'
import { fetchWithCORS, parseJSONPosts, buildPrompt } from './utils/api'
import { addVisitStat, addGenStat, saveApiKey, getApiKey, getDarkMode, saveDarkMode } from './utils/storage'
import { useToast } from './hooks/useToast'
import { useQuota } from './hooks/useQuota'
import { useHistory } from './hooks/useHistory'

import Header from './components/Header'
import SettingsModal from './components/SettingsModal'
import UpgradeModal from './components/UpgradeModal'
import TemplatePresets from './components/TemplatePresets'
import InputForm from './components/InputForm'
import ExamplePreview from './components/ExamplePreview'
import ResultSection from './components/ResultSection'
import InviteShare from './components/InviteShare'
import Footer from './components/Footer'
import Toast from './components/Toast'
import HistoryPanel from './components/HistoryPanel'

function App() {
  // ===== 核心状态 =====
  const [apiKey, setApiKey] = useState(() => getApiKey())
  const [showSettings, setShowSettings] = useState(() => !getApiKey())
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [dark, setDark] = useState(() => getDarkMode())

  // ===== 表单状态 =====
  const [product, setProduct] = useState('')
  const [features, setFeatures] = useState('')
  const [price, setPrice] = useState('')
  const [audienceTags, setAudienceTags] = useState<string[]>([])
  const [style, setStyle] = useState('caozhong')

  // ===== 生成状态 =====
  const [loading, setLoading] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [formattingId, setFormattingId] = useState<number | null>(null)
  const [sensitiveResults, setSensitiveResults] = useState<Record<number, SensitiveWord[]>>({})
  const [verifying, setVerifying] = useState(false)

  // ===== 历史记录 Tab =====
  const [showHistory, setShowHistory] = useState(false)

  // ===== Hooks =====
  const { toasts, showToast, removeToast } = useToast()
  const { remaining, incrementCount, resetCount, DAILY_LIMIT } = useQuota()
  const { history, addHistoryItem, deleteHistoryItem, clearAllHistory } = useHistory()
  const resultRef = useRef<HTMLDivElement>(null)

  // ===== 暗黑模式 =====
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    saveDarkMode(dark)
  }, [dark])

  // ===== 首次访问统计 =====
  useEffect(() => { addVisitStat() }, [])

  // ===== 业务方法 =====
  const handleSaveKey = (v: string) => { setApiKey(v); saveApiKey(v) }

  const toggleAudienceTag = (tag: string) => {
    setAudienceTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  const handleUseTemplate = (t: Template) => {
    setProduct(t.product); setFeatures(t.features); setPrice(t.price)
    setAudienceTags(t.audience.includes('/') ? t.audience.split('/') : [t.audience])
  }

  const generate = async (force = false) => {
    if (!product.trim()) { showToast('请输入产品名称', 'warning'); return }
    if (!apiKey.trim()) { setShowSettings(true); showToast('请先设置 DeepSeek API Key', 'warning'); return }
    if (remaining <= 0 && !force) { setShowUpgrade(true); return }

    setLoading(true); setSensitiveResults({})
    try {
      const audienceText = audienceTags.length > 0 ? audienceTags.join('、') : '普通消费者'
      const res = await fetchWithCORS(DEEPSEEK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: '你是一个小红书爆款文案生成助手。只输出JSON，不输出其他内容。确保JSON中content字段里的双引号已转义（用\\"），换行符用\\n表示。' },
            { role: 'user', content: buildPrompt(product, features, price, audienceText, style) },
          ],
          temperature: 0.9,
          max_tokens: 4096,
        }),
      })
      if (!res.ok) { const errData = await res.json().catch(() => ({})); throw new Error(errData.error?.message || errData.error || `HTTP ${res.status}`) }

      const data = await res.json()
      let parsed: Omit<Post, 'id'>[]
      if (data.posts) { parsed = data.posts } else { parsed = parseJSONPosts(data.choices[0].message.content) }

      const newPosts = parsed.map((p, i) => ({ ...p, id: i }))
      setPosts(newPosts)
      incrementCount(); addGenStat()
      addHistoryItem(product, newPosts)
      setShowHistory(false)

      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
      showToast('✅ 文案生成成功！', 'success')
    } catch (e: any) {
      showToast('生成失败: ' + e.message, 'error')
    } finally { setLoading(false) }
  }

  const verifyKey = async () => {
    if (!apiKey.trim()) { showToast('请先输入 API Key', 'warning'); return }
    setVerifying(true)
    try {
      const res = await fetchWithCORS(DEEPSEEK_URL.replace('/chat/completions', '/models'), { headers: { Authorization: `Bearer ${apiKey}` } })
      res.ok ? showToast('✅ API Key 验证成功！', 'success') : showToast('❌ Key 无效', 'error')
    } catch (e: any) { showToast('❌ ' + (e.message || '验证失败'), 'error') }
    finally { setVerifying(false) }
  }

  const copyPost = (post: Post) => {
    navigator.clipboard.writeText(`${post.title}\n\n${post.content}\n\n${post.tags.join(' ')}\n\n—— 由「小红书AI文案生成器」创作 ${SHARE_URL}`)
    showToast('✅ 已复制到剪贴板')
  }

  const copyAll = () => {
    const text = posts.map(p => `${p.title}\n\n${p.content}\n\n${p.tags.join(' ')}`).join('\n\n---\n\n')
    navigator.clipboard.writeText(text)
    showToast('✅ 全部文案已复制！')
  }

  const copyShareLink = () => {
    navigator.clipboard.writeText(`小红书AI文案生成器 - 免费在线种草文案制作工具\n${SHARE_URL}`)
    showToast('✅ 工具链接已复制，分享给朋友吧！')
  }

  const shareWechat = (post: Post) => {
    navigator.clipboard.writeText(`${post.title}\n\n${post.content}\n\n${post.tags.join(' ')}\n\n—— 由「小红书AI文案生成器」创作 ${SHARE_URL}`)
    showToast('✅ 已复制文案，去微信粘贴发送！')
  }

  const shareWeibo = (post: Post) => {
    const t = encodeURIComponent(`${post.title}\n\n${post.content}\n\n#小红书文案# #AI工具#\n${SHARE_URL}`)
    window.open(`https://service.weibo.com/share/share.php?title=${t}&url=${encodeURIComponent(SHARE_URL)}`, '_blank')
  }

  const checkSensitiveWords = (post: Post) => {
    const text = `${post.title} ${post.content} ${post.tags.join(' ')}`
    setSensitiveResults(prev => ({ ...prev, [post.id]: SENSITIVE_WORDS.filter(({ word }) => text.includes(word)) }))
    showToast('🔍 敏感词检测完成')
  }

  const aiFormat = async (post: Post) => {
    if (!apiKey.trim()) { showToast('请先设置 API Key', 'warning'); return }
    setFormattingId(post.id)
    try {
      const res = await fetchWithCORS(DEEPSEEK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: '你是一个小红书文案优化助手。优化文案使其更生动有吸引力，保留原文标签和核心信息。' },
            { role: 'user', content: `请优化以下小红书文案，让语言更生动、更有吸引力，保留原意和标签：\n\n标题：${post.title}\n正文：${post.content}\n\n直接输出优化后的标题和正文，用 --- 分隔标题和正文。` },
          ],
          temperature: 0.7, max_tokens: 1024,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error('优化失败')
      const parts = data.choices[0].message.content.split('---')
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, title: parts[0]?.trim() || p.title, content: parts[1]?.trim() || p.content } : p))
      showToast('✅ AI 排版完成！')
    } catch (e: any) { showToast('AI 排版失败: ' + (e.message || ''), 'error') }
    finally { setFormattingId(null) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 transition-colors duration-300">
      <Header remaining={remaining} dailyLimit={DAILY_LIMIT} dark={dark} onToggleDark={() => setDark(!dark)} onOpenSettings={() => setShowSettings(true)} />

      <main className="mx-auto max-w-[1400px] px-6 py-8">
        {showSettings && <SettingsModal apiKey={apiKey} verifying={verifying} onSaveKey={handleSaveKey} onVerify={verifyKey} onClose={() => setShowSettings(false)} />}
        {showUpgrade && <UpgradeModal onContinue={() => { setShowUpgrade(false); generate(true) }} onReset={() => { setShowUpgrade(false); resetCount(); showToast('✅ 次数已重置') }} onClose={() => setShowUpgrade(false)} />}

        <TemplatePresets onSelect={handleUseTemplate} />
        <InputForm
          product={product} features={features} price={price} audienceTags={audienceTags} style={style} loading={loading} remaining={remaining}
          onProductChange={setProduct} onFeaturesChange={setFeatures} onPriceChange={setPrice}
          onAudienceTagToggle={toggleAudienceTag} onStyleChange={setStyle} onGenerate={() => generate()}
        />
        <ExamplePreview />

        {/* 结果/历史 Tab 切换 */}
        {(posts.length > 0 || history.length > 0) && (
          <div className="mt-8 flex gap-1 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowHistory(false)}
              className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${!showHistory ? 'text-pink-600 dark:text-pink-400 border-b-2 border-pink-500' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'}`}
            >
              当前结果
            </button>
            <button
              onClick={() => setShowHistory(true)}
              className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${showHistory ? 'text-pink-600 dark:text-pink-400 border-b-2 border-pink-500' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'}`}
            >
              历史记录 {history.length > 0 && <span className="ml-1 text-xs">({history.length})</span>}
            </button>
          </div>
        )}

        <ResultSection
          ref={resultRef}
          loading={loading} posts={posts} formattingId={formattingId} sensitiveResults={sensitiveResults}
          showHistory={showHistory}
          onCopy={copyPost} onFormat={aiFormat} onCheckSensitive={checkSensitiveWords}
          onShareWechat={shareWechat} onShareWeibo={shareWeibo} onCopyAll={copyAll}
          historyContent={<HistoryPanel history={history} onDelete={deleteHistoryItem} onClear={clearAllHistory} onCopyPost={copyPost} />}
        />
        {posts.length > 0 && !showHistory && <InviteShare onCopyShareLink={copyShareLink} />}
      </main>

      <Footer />
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  )
}

export default App
