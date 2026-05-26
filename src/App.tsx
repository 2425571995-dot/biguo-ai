import { useState } from 'react'

const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions'
const DAILY_LIMIT = 5

// CORS 代理链：依次尝试，直到成功
const CORS_PROXIES = [
  '', // 直连（DeepSeek 是国内服务，可能直接可用）
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
]

async function fetchWithCORS(url: string, options: RequestInit = {}): Promise<Response> {
  const errors: string[] = []
  for (const proxy of CORS_PROXIES) {
    try {
      const finalUrl = proxy ? proxy + url : url
      const res = await fetch(finalUrl, { ...options })
      if (res.status >= 400 && res.status < 500 && proxy) {
        return res
      }
      return res
    } catch (e: any) {
      errors.push(`${proxy || '直连'}: ${e.message}`)
      continue
    }
  }
  throw new Error(`无法连接到 DeepSeek API（已尝试所有代理）\n${errors.join('\n')}`)
}

interface Post {
  id: number
  title: string
  content: string
  tags: string[]
}

const STYLE_OPTIONS = [
  { value: 'caozhong', label: '🌱 种草分享风', desc: '亲切自然，像朋友推荐' },
  { value: 'ganhuo', label: '📊 干货测评风', desc: '专业客观，数据说话' },
  { value: 'tubi', label: '⚠️ 吐槽避雷风', desc: '反向种草，痛点切入' },
  { value: 'jieduan', label: '✍️ 极简短句风', desc: '短小精悍，快速阅读' },
]

const TEMPLATES = [
  { label: '💄 美妆', product: '花西子蜜粉饼', features: '控油持妆12小时、柔焦毛孔、适合油皮', price: '¥149', audience: '油皮/混油皮女生' },
  { label: '👗 穿搭', product: '高腰阔腿牛仔裤', features: '高腰显瘦、垂感好、百搭不挑人', price: '¥129', audience: '梨形身材女生' },
  { label: '🍜 美食', product: '自热小火锅', features: '麻辣鲜香、料超足、15分钟即食', price: '¥39.9', audience: '宿舍党/上班族' },
  { label: '🏠 家居', product: 'ins风护眼台灯', features: '三色温调节、护眼无频闪、高颜值', price: '¥69', audience: '租房党/学生党' },
]

const SENSITIVE_WORDS = [
  { word: '最', tip: '极限词，建议替换为"很/非常"' },
  { word: '第一', tip: '极限词，建议替换为"领先"' },
  { word: '100%', tip: '绝对化用语，建议修改' },
  { word: '绝对', tip: '绝对化用语，建议替换' },
  { word: '超级', tip: '夸大宣传，建议替换' },
  { word: '正品保证', tip: '保证类用语，建议移除' },
  { word: '无效退款', tip: '承诺类用语，建议移除' },
  { word: '假一赔十', tip: '承诺类用语，建议移除' },
  { word: '微信', tip: '注意平台限流' },
  { word: 'QQ', tip: '注意平台限流' },
]

function getDailyCount(): { count: number; date: string } {
  const today = new Date().toISOString().slice(0, 10)
  const saved = localStorage.getItem('xhs_daily')
  if (saved) {
    const parsed = JSON.parse(saved)
    if (parsed.date === today) return parsed
  }
  return { count: 0, date: today }
}

function saveDailyCount(count: number) {
  const today = new Date().toISOString().slice(0, 10)
  localStorage.setItem('xhs_daily', JSON.stringify({ count, date: today }))
}

function addVisitStat() {
  const key = 'xhs_visits'
  const raw = localStorage.getItem(key)
  const today = new Date().toISOString().slice(0, 10)
  if (raw) {
    const visits = JSON.parse(raw)
    if (!visits.dates.includes(today)) {
      visits.dates.push(today)
      visits.total++
      localStorage.setItem(key, JSON.stringify(visits))
    }
  } else {
    localStorage.setItem(key, JSON.stringify({ total: 1, dates: [today] }))
  }
}

function addGenStat() {
  const key = 'xhs_gen'
  const raw = localStorage.getItem(key)
  const today = new Date().toISOString().slice(0, 10)
  if (raw) {
    const stat = JSON.parse(raw)
    stat.total++
    const day = stat.days.find((d: any) => d.date === today)
    if (day) day.count++
    else stat.days.push({ date: today, count: 1 })
    localStorage.setItem(key, JSON.stringify(stat))
  } else {
    localStorage.setItem(key, JSON.stringify({ total: 1, days: [{ date: today, count: 1 }] }))
  }
}

function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('xhs_key') || '')
  const [showSettings, setShowSettings] = useState(() => !localStorage.getItem('xhs_key'))
  const [product, setProduct] = useState('')
  const [features, setFeatures] = useState('')
  const [price, setPrice] = useState('')
  const [audience, setAudience] = useState('')
  const [style, setStyle] = useState('caozhong')
  const [loading, setLoading] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [formattingId, setFormattingId] = useState<number | null>(null)
  const [sensitiveResults, setSensitiveResults] = useState<Record<number, { word: string; tip: string }[]>>({})

  // 每日次数
  const daily = getDailyCount()
  const [dailyCount, setDailyCount] = useState(daily.count)
  const remaining = Math.max(0, DAILY_LIMIT - dailyCount)
  const [showUpgrade, setShowUpgrade] = useState(false)

  // 首次访问自动弹设置 + 统计
  useState(() => {
    addVisitStat()
  })

  const buildPrompt = () => {
    const styleMap: Record<string, string> = {
      caozhong: '种草分享风：语气亲切自然，像朋友真心推荐，突出使用感受和真实场景',
      ganhuo: '干货测评风：专业客观，有理有据，多维度分析优缺点，用数据说话',
      tubi: '吐槽避雷风：从痛点/坑点切入，反向安利，容易引发共鸣和讨论',
      jieduan: '极简短句风：短小精悍，一句话一段，快速传递核心信息，适合碎片阅读',
    }
    return `你是小红书爆款文案专家。根据以下产品信息，生成3条小红书风格的种草文案。

产品：${product}
卖点：${features || '请根据产品名称自行提炼'}
价格：${price || '未提供'}
目标人群：${audience || '普通消费者'}
风格要求：${styleMap[style]}

要求：
- 每条文案包含：吸睛标题、正文（150-300字）、3-5个话题标签
- 语气自然亲切，像真实用户分享而非广告
- 善用emoji，但不能过度
- 包含具体使用场景和真实感受

请严格按照以下JSON格式输出，不要输出其他内容：
[{"title":"标题","content":"正文内容","tags":["标签1","标签2","标签3"]}]`
  }

  const generate = async (force = false) => {
    if (!product.trim()) return alert('请输入产品名称')
    if (!apiKey.trim()) {
      setShowSettings(true)
      return alert('请先设置 DeepSeek API Key')
    }
    if (remaining <= 0 && !force) {
      setShowUpgrade(true)
      return
    }

    setLoading(true)
    setSensitiveResults({})
    try {
      const body = JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是一个小红书爆款文案生成助手。只输出JSON，不输出其他内容。' },
          { role: 'user', content: buildPrompt() },
        ],
        temperature: 0.9,
        max_tokens: 2048,
      })

      // 通过代理链调用 DeepSeek API（浏览器端存在 CORS 限制）
      const res = await fetchWithCORS(DEEPSEEK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body,
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error?.message || errData.error || `HTTP ${res.status}`)
      }

      const data = await res.json()
      let parsed: Post[]
      if (data.posts) {
        parsed = data.posts
      } else {
        const raw = data.choices[0].message.content
        const cleaned = raw.replace(/```json\n?/g, '').replace(/```/g, '').trim()
        parsed = JSON.parse(cleaned)
      }

      setPosts(parsed.map((p, i) => ({ ...p, id: i })))
      const newCount = dailyCount + 1
      setDailyCount(newCount)
      saveDailyCount(newCount)
      addGenStat()
    } catch (e: any) {
      alert('生成失败: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const verifyKey = async () => {
    if (!apiKey.trim()) return alert('请先输入 API Key')
    setVerifying(true)
    try {
      const res = await fetchWithCORS(DEEPSEEK_URL.replace('/chat/completions', '/models'), {
        headers: { Authorization: `Bearer ${apiKey}` },
      })
      if (res.ok) {
        alert('✅ API Key 验证成功！')
      } else {
        const data = await res.json()
        alert('❌ 验证失败: ' + (data.error?.message || 'Key 无效'))
      }
    } catch (e: any) {
      alert('❌ ' + (e.message || '验证失败'))
    } finally {
      setVerifying(false)
    }
  }

  const copyPost = (post: Post) => {
    const text = `${post.title}\n\n${post.content}\n\n${post.tags.join(' ')}`
    navigator.clipboard.writeText(text)
    setCopiedId(post.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const copyAll = () => {
    const text = posts.map((p) => `${p.title}\n\n${p.content}\n\n${p.tags.join(' ')}`).join('\n\n---\n\n')
    navigator.clipboard.writeText(text)
    alert('全部文案已复制！')
  }

  const saveKey = (v: string) => {
    setApiKey(v)
    localStorage.setItem('xhs_key', v)
  }

  const useTemplate = (t: typeof TEMPLATES[0]) => {
    setProduct(t.product)
    setFeatures(t.features)
    setPrice(t.price)
    setAudience(t.audience)
  }

  const checkSensitiveWords = (post: Post) => {
    const text = `${post.title} ${post.content} ${post.tags.join(' ')}`
    const found = SENSITIVE_WORDS.filter(({ word }) => text.includes(word))
    setSensitiveResults(prev => ({ ...prev, [post.id]: found }))
  }

  const aiFormat = async (post: Post) => {
    if (!apiKey.trim()) return alert('请先设置 API Key')
    setFormattingId(post.id)
    try {
      const res = await fetchWithCORS(DEEPSEEK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: '你是一个小红书文案优化助手。优化文案使其更生动有吸引力，保留原文标签和核心信息。' },
            {
              role: 'user',
              content: `请优化以下小红书文案，让语言更生动、更有吸引力，保留原意和标签：\n\n标题：${post.title}\n正文：${post.content}\n\n直接输出优化后的标题和正文，用 --- 分隔标题和正文。`,
            },
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error('优化失败')
      const text = data.choices[0].message.content
      const parts = text.split('---')
      const newTitle = parts[0]?.trim() || post.title
      const newContent = parts[1]?.trim() || post.content
      setPosts(prev => prev.map(p => (p.id === post.id ? { ...p, title: newTitle, content: newContent } : p)))
    } catch (e: any) {
      alert('AI 排版失败，请重试: ' + (e.message || ''))
    } finally {
      setFormattingId(null)
    }
  }

  const inputCls =
    'w-full rounded-xl border border-pink-200 bg-white px-4 py-3 text-gray-800 placeholder-gray-400 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 outline-none transition-all'

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
      {/* ===== Header ===== */}
      <header className="border-b border-pink-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <h1 className="text-xl font-bold text-gray-800">小红书AI文案生成器</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-amber-500 font-medium whitespace-nowrap">
              剩余 <strong className="text-pink-500">{remaining}</strong>/{DAILY_LIMIT} 次
            </span>
            <button
              onClick={() => setShowSettings(true)}
              className="cursor-pointer rounded-lg p-2 text-gray-400 transition-colors hover:bg-pink-50 hover:text-pink-500"
              title="API 设置"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* ===== 设置弹窗 ===== */}
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="mx-4 w-full max-w-md rounded-2xl border border-pink-100 bg-white p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-700">⚙️ API 设置</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="cursor-pointer rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="mb-3 text-sm text-gray-500">
                输入你的 DeepSeek API Key 即可开始使用。密钥仅保存在你浏览器本地。
              </p>

              <input
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => saveKey(e.target.value)}
                className={inputCls + ' mb-3'}
              />

              <div className="flex gap-2">
                <button
                  onClick={verifyKey}
                  disabled={verifying}
                  className="cursor-pointer rounded-xl border border-pink-200 px-4 py-2.5 text-sm text-pink-600 transition-colors hover:bg-pink-50 disabled:opacity-50 flex-1"
                >
                  {verifying ? '验证中...' : '🔍 验证 Key'}
                </button>
                <a
                  href="https://platform.deepseek.com/api_keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-1 items-center justify-center rounded-xl border border-pink-200 px-4 py-2.5 text-sm text-pink-600 transition-colors hover:bg-pink-50"
                >
                  🔑 免费获取
                </a>
              </div>

              <p className="mt-3 text-xs text-gray-400">
                新用户注册 DeepSeek 送 500 万 tokens，足够生成数千条文案。
              </p>
            </div>
          </div>
        )}

        {/* ===== 升级引导弹窗 ===== */}
        {showUpgrade && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="mx-4 w-full max-w-sm rounded-2xl border border-pink-100 bg-white p-6 shadow-2xl text-center">
              <div className="mb-3 text-4xl">👑</div>
              <h2 className="mb-2 text-lg font-semibold text-gray-800">今日免费次数已用尽</h2>
              <p className="mb-1 text-sm text-gray-500">
                每日免费 <strong className="text-pink-500">{DAILY_LIMIT} 次</strong>，升级后解锁全部权益
              </p>

              <div className="my-5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 p-4 text-left space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-green-500">✅</span> 无限生成次数
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-green-500">✅</span> 全部文案风格（种草/测评/避雷/极简）
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-green-500">✅</span> AI 智能排版 + 违禁词检测
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-green-500">✅</span> 历史记录云端同步
                </div>
              </div>

              <div className="mb-4 rounded-xl bg-pink-50 p-4">
                <p className="text-sm font-medium text-pink-700">联系开发者开通会员</p>
                <p className="mt-1 text-sm text-pink-600">微信: ZzzzySovo</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { setShowUpgrade(false); generate(true) }}
                  className="flex-1 cursor-pointer rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-pink-600 transition-colors hover:bg-pink-50"
                >
                  继续生成
                </button>
                <button
                  onClick={() => {
                    setShowUpgrade(false)
                    setDailyCount(0)
                    saveDailyCount(0)
                  }}
                  className="flex-1 cursor-pointer rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2.5 text-sm text-white shadow-lg shadow-pink-200 transition-all hover:shadow-xl"
                >
                  重置次数
                </button>
              </div>
              <p className="mt-3 text-xs text-gray-400">
                重置后今日可继续免费使用 {DAILY_LIMIT} 次
              </p>
            </div>
          </div>
        )}

        {/* ===== 模板预设 ===== */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-400">⚡ 快速填充：</span>
          {TEMPLATES.map((t) => (
            <button
              key={t.label}
              onClick={() => useTemplate(t)}
              className="cursor-pointer rounded-full border border-pink-200 px-3.5 py-1.5 text-sm text-pink-600 transition-all hover:bg-pink-50 hover:border-pink-300 active:scale-95"
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ===== 输入表单 ===== */}
        <div className="rounded-2xl border border-pink-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-700">📝 产品信息</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-gray-500">产品名称 *</label>
              <input
                placeholder="如：花西子蜜粉饼、某品牌护肤品"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                className={inputCls}
                onKeyDown={(e) => e.key === 'Enter' && generate()}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-500">价格</label>
              <input
                placeholder="如：¥199 / 均价50元"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={inputCls}
                onKeyDown={(e) => e.key === 'Enter' && generate()}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm text-gray-500">核心卖点</label>
              <textarea
                rows={2}
                placeholder="如：控油持妆12小时、柔焦毛孔、适合油皮、颜值高"
                value={features}
                onChange={(e) => setFeatures(e.target.value)}
                className={inputCls + ' resize-none'}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-500">目标人群</label>
              <input
                placeholder="如：油皮/混油皮女生、学生党"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className={inputCls}
                onKeyDown={(e) => e.key === 'Enter' && generate()}
              />
            </div>
          </div>

          {/* ===== 风格选择 ===== */}
          <div className="mt-5">
            <label className="mb-2 block text-sm text-gray-500">🎨 文案风格</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {STYLE_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStyle(s.value)}
                  className={`cursor-pointer rounded-xl border px-3 py-2.5 text-sm transition-all ${
                    style === s.value
                      ? 'border-pink-400 bg-pink-50 text-pink-700 shadow-sm'
                      : 'border-gray-200 text-gray-500 hover:border-pink-200 hover:bg-pink-50/50'
                  }`}
                >
                  <div className="font-medium">{s.label}</div>
                  <div className="mt-0.5 text-xs opacity-70">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* ===== 生成按钮 ===== */}
          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={() => generate()}
              disabled={loading}
              className="flex-1 cursor-pointer rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 py-3.5 text-lg font-semibold text-white shadow-lg shadow-pink-200 transition-all hover:shadow-xl hover:shadow-pink-300 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  AI 正在生成...
                </span>
              ) : (
                '✨ 一键生成文案'
              )}
            </button>
            <span className="shrink-0 text-xs text-gray-400 whitespace-nowrap">
              剩余 <strong className="text-pink-500">{remaining}</strong> / {DAILY_LIMIT} 次
            </span>
          </div>
          {remaining <= 1 && remaining > 0 && (
            <p className="mt-2 text-xs text-amber-500">
              💡 每日免费 {DAILY_LIMIT} 次，用完后可重置继续使用或联系微信 ZzzzySovo 开通无限会员
            </p>
          )}
        </div>

        {/* ===== 广告位 1：表单下方横幅 ===== */}
        <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 p-4 text-center">
          <p className="mb-2 text-xs text-gray-400">— 广告 —</p>
          <div className="mx-auto flex min-h-[90px] items-center justify-center rounded-xl bg-white">
            <div className="text-center">
              <span className="text-sm text-gray-300">📢 广告位招租</span>
              <p className="mt-1 text-xs text-gray-300">联系微信：ZzzzySovo</p>
            </div>
          </div>
        </div>

        {/* ===== 生成结果 ===== */}
        {posts.length > 0 && (
          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-700">📋 生成结果</h2>
              <button
                onClick={copyAll}
                className="rounded-lg border border-pink-200 px-4 py-1.5 text-sm text-pink-600 transition-colors hover:bg-pink-50 cursor-pointer"
              >
                一键复制全部
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {posts.map((post) => {
                const sr = sensitiveResults[post.id]
                return (
                  <div
                    key={post.id}
                    className="group rounded-2xl border border-pink-100 bg-white p-5 shadow-sm transition-all hover:shadow-md"
                  >
                    <h3 className="mb-2 font-semibold text-gray-800">{post.title}</h3>
                    <p className="mb-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-600">{post.content}</p>
                    <div className="mb-3 flex flex-wrap gap-1">
                      {post.tags.map((tag, i) => (
                        <span key={i} className="rounded-full bg-pink-50 px-2.5 py-0.5 text-xs text-pink-500">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* 违禁词检测结果 */}
                    {sr !== undefined && (
                      <div
                        className={`mb-3 rounded-lg p-2.5 text-xs ${
                          sr.length > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                        }`}
                      >
                        {sr.length > 0 ? (
                          <div>
                            ⚠️ 发现 {sr.length} 个敏感词：
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {sr.map((f, i) => (
                                <span key={i} className="inline-block rounded bg-red-100 px-1.5 py-0.5" title={f.tip}>
                                  {f.word}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          '✅ 未发现敏感词，内容安全'
                        )}
                      </div>
                    )}

                    {/* 操作按钮 */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyPost(post)}
                        className="flex-1 cursor-pointer rounded-lg border border-pink-200 py-2 text-sm text-pink-600 transition-all hover:bg-pink-50 active:scale-95"
                      >
                        {copiedId === post.id ? '✅ 已复制' : '📋 复制'}
                      </button>
                      <button
                        onClick={() => aiFormat(post)}
                        disabled={formattingId === post.id}
                        className="flex-1 cursor-pointer rounded-lg border border-purple-200 py-2 text-sm text-purple-600 transition-all hover:bg-purple-50 active:scale-95 disabled:opacity-50"
                      >
                        {formattingId === post.id ? '⏳ 优化中' : '🎨 AI排版'}
                      </button>
                      <button
                        onClick={() => checkSensitiveWords(post)}
                        className="flex-1 cursor-pointer rounded-lg border border-amber-200 py-2 text-sm text-amber-600 transition-all hover:bg-amber-50 active:scale-95"
                      >
                        🔍 查敏感词
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {/* ===== 广告位 2：结果区下方 ===== */}
      {posts.length > 0 && (
        <div className="mx-auto max-w-4xl px-4">
          <div className="mb-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 p-4 text-center">
            <p className="mb-2 text-xs text-gray-400">— 广告 —</p>
            <div className="mx-auto flex min-h-[90px] items-center justify-center rounded-xl bg-white">
              <div className="text-center">
                <span className="text-sm text-gray-300">📢 广告位招租</span>
                <p className="mt-1 text-xs text-gray-300">合作微信：ZzzzySovo</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Footer ===== */}
      <footer className="border-t border-pink-100 py-6 text-center text-sm text-gray-400">
        <div className="mx-auto max-w-4xl px-4 space-y-2">
          <p>🔥 小红书AI文案生成器 · 免费在线 · 无需注册 · AI 驱动</p>
          <div className="text-xs text-gray-300 space-x-3">
            <span>
              访问人数 <strong className="text-pink-400">
                {(() => { try { return JSON.parse(localStorage.getItem('xhs_visits') || '{}').total || 0 } catch { return 0 } })()}
              </strong>
            </span>
            <span>·</span>
            <span>
              共生成 <strong className="text-pink-400">
                {(() => { try { return JSON.parse(localStorage.getItem('xhs_gen') || '{}').total || 0 } catch { return 0 } })()}
              </strong> 篇文案
            </span>
            <span>·</span>
            <span>每日免费 {DAILY_LIMIT} 次</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs">
            <span>📢 广告/商务合作：</span>
            <span className="font-medium text-gray-500">微信: ZzzzySovo</span>
            <span className="text-gray-300">|</span>
            <span>🛒 <a href="https://union.jd.com/" target="_blank" className="text-pink-400 hover:underline">京东好物</a></span>
            <span className="text-gray-300">|</span>
            <span>🛒 <a href="https://s.click.taobao.com/OlTZ1Tl" target="_blank" className="text-pink-400 hover:underline">手机支架 ¥17.68</a></span>
            <span className="text-gray-300">|</span>
            <span>📚 <a href="https://s.click.taobao.com/t?e=m%3D2%26s%3Dfi8zB1swAsBw4vFB6t2Z2ueEDrYVVa64g3vZOarmkFi53hKxp7mNFl906SyIHsHUT9M7X579b8r0JlhLk0Jl4cw18WEQwTuvF%2FhnFMwfvDzmSxm29wiKVF93alVF4qCKqbxYZVy1v%2BTWqunGLAygI3FzUC1tkZVLiaflJfA6nTGgFd2iucECtf1SarTXhIOTsgIpc1WFZiJNubylQlnZt2xkzRYmczbHBA2W2UBWM%2FW90US8XtsVPoOtdnWN%2BJ514lD2smTG1DvU1Cce0w7gxJ16ZID7dcT7j4MrAUsR31Dl1SxDw1i9uP7nyHmkoZi7UpN9ALTZSr6jIW%2BNqheccMYMXU3NNCg%2F&union_lens=lensId%3APUB%401779790411%400b513950_0dd2_19e63c67511_b090%40026UjcsJN3gEijHzsJIUqeTa%40eyJmbG9vcklkIjo4MDY3NCwiic3BtQiiI6Il9wb3J0YWxfdjJfcGFnZXNfcHJvbW9fZ29vZHNfaW5kZXhfaHRtIiiwiic3JjRmxvb3JJZCI6IjgwNjc0In0ie%3BtkScm%3AselectionPlaza_site_4358_0_0_0_1_177979041110710280197467%3Bscm%3A1007.30148.329090.pub_search-item_b0c0781d-190e-49d7-9013-632b416cd858_" target="_blank" className="text-pink-400 hover:underline">AI写作课程 ¥2</a></span>
            <span className="text-gray-300">|</span>
            <span>💊 <a href="https://s.click.taobao.com/t?e=m%3D2%26s%3DhztpAwZGq4hw4vFB6t2Z2ueEDrYVVa64YUrQeSeIhnK53hKxp7mNFl906SyIHsHUPmrhe%2FeGHez0JlhLk0Jl4cw18WEQwTuvF%2FhnFMwfvDzmSxm29wiKVF93alVF4qCKhJiE2weqqaRFVI6Hlqs2%2FghrMZuPHvYZHxfsbtDfsFop%2Fq%2BquMQUN1NnEW1QpY0vMLh2y84Z6f6jbKKPA9GKC%2BpRzaullHjPKb9iXllmZ4E%2BkZHuqvdivXhY1KXLRvFPCDp44iebu2xP7qa1tU3ZgS3jKrSQZrKgRywEOrHj0TZGeuhDKKWOXMYMXU3NNCg%2F&union_lens=lensId%3APUB%401779790812%400b1fea4b_0d29_19e63cc93b5_cffb%40024NZIGWy0BN05wTYP4tnjNE%40eyJmbG9vcklkIjoxMTU2ODMsInNwbUIiiOiiJfcG9ydGFsX3YyX3BhZ2VzX3Byb21vX2dvb2RzX2luZGV4X2h0bSIsInNyY0Zsb29ySWQiiOiiIxMTU2ODMiifQieie%3BtkScm%3Asearch_fuzzy_selectionPlaza_site_4358_0_0_0_1_177979081217810280197467%3Bscm%3A1007.30148.329090.0_0_734bd2ea-432b-4881-adfb-f0b77bdab01b_" target="_blank" className="text-pink-400 hover:underline">祛疤膏 ¥11.40</a></span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
