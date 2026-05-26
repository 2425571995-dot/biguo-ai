import { useState } from 'react'

const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions'
const DAILY_LIMIT = 5

interface Post {
  id: number
  title: string
  content: string
  tags: string[]
}

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
  const [loading, setLoading] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [verifying, setVerifying] = useState(false)

  // 每日次数
  const daily = getDailyCount()
  const [dailyCount, setDailyCount] = useState(daily.count)
  const remaining = Math.max(0, DAILY_LIMIT - dailyCount)
  const [showUpgrade, setShowUpgrade] = useState(false)

  // 首次访问自动弹设置 + 统计
  useState(() => {
    addVisitStat()
  })

  const generate = async () => {
    if (!product.trim()) return alert('请输入产品名称')
    if (!apiKey.trim()) {
      setShowSettings(true)
      return alert('请先设置 DeepSeek API Key')
    }
    if (remaining <= 0) {
      setShowUpgrade(true)
      return
    }

    setLoading(true)
    try {
      let res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, features, price, audience }),
      })

      if (!res.ok && res.status === 404) {
        res = await fetch(DEEPSEEK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: '你是一个小红书爆款文案生成助手。只输出JSON，不输出其他内容。' },
              {
                role: 'user',
                content: buildPrompt(),
              },
            ],
            temperature: 0.9,
            max_tokens: 2048,
          }),
        })
      }

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || data.error?.message || '生成失败')
      }

      let parsed: Post[]
      if (data.posts) {
        parsed = data.posts
      } else {
        const raw = data.choices[0].message.content
        const cleaned = raw.replace(/```json\n?/g, '').replace(/```/g, '').trim()
        parsed = JSON.parse(cleaned)
      }

      setPosts(parsed.map((p, i) => ({ ...p, id: i })))

      // 更新每日次数
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
      const res = await fetch(DEEPSEEK_URL.replace('/chat/completions', '/models'), {
        headers: { Authorization: `Bearer ${apiKey}` },
      })
      if (res.ok) {
        alert('✅ API Key 验证成功！')
      } else {
        const data = await res.json()
        alert('❌ 验证失败: ' + (data.error?.message || 'Key 无效'))
      }
    } catch {
      alert('❌ 网络错误，请检查网络连接')
    } finally {
      setVerifying(false)
    }
  }

  const buildPrompt = () =>
    `你是小红书爆款文案专家。根据以下产品信息，生成3条小红书风格的种草文案。

产品：${product}
卖点：${features || '请根据产品名称自行提炼'}
价格：${price || '未提供'}
目标人群：${audience || '普通消费者'}

要求：
- 每条文案包含：吸睛标题、正文（150-300字）、3-5个话题标签
- 语气自然亲切，像真实用户分享而非广告
- 善用emoji，但不能过度
- 包含具体使用场景和真实感受

请严格按照以下JSON格式输出，不要输出其他内容：
[{"title":"标题","content":"正文内容","tags":["标签1","标签2","标签3"]}]`

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

  const inputCls =
    'w-full rounded-xl border border-pink-200 bg-white px-4 py-3 text-gray-800 placeholder-gray-400 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 outline-none transition-all'

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
      {/* ===== Header ===== */}
      <header className="border-b border-pink-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <h1 className="text-xl font-bold text-gray-800">小红书文案生成器</h1>
          </div>
          <div className="flex items-center gap-3">
            {remaining > 0 && remaining <= 3 && (
              <span className="text-xs text-amber-500 font-medium">剩余 {remaining} 次</span>
            )}
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
              <div className="mb-3 text-4xl">🚀</div>
              <h2 className="mb-2 text-lg font-semibold text-gray-800">今日免费次数已用尽</h2>
              <p className="mb-1 text-sm text-gray-500">
                每日免费 {DAILY_LIMIT} 次，升级后无限使用。
              </p>
              <p className="mb-5 text-sm text-gray-500">
                更多模板、批量生成、历史记录...
              </p>

              <div className="mb-4 rounded-xl bg-amber-50 p-4">
                <p className="text-sm font-medium text-amber-700">联系开发者开通</p>
                <p className="mt-1 text-sm text-amber-600">微信: ZzzzySovo</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowUpgrade(false)}
                  className="flex-1 cursor-pointer rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-500 transition-colors hover:bg-gray-50"
                >
                  继续使用
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

        {/* ===== 输入表单 ===== */}
        <div className="rounded-2xl border border-pink-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-700">📝 产品信息</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-gray-500">产品名称 *</label>
              <input
                placeholder="如：花西子蜜粉饼"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                className={inputCls}
                onKeyDown={(e) => e.key === 'Enter' && generate()}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-500">价格</label>
              <input
                placeholder="如：¥199"
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
                placeholder="如：控油持妆12小时、柔焦毛孔、适合油皮"
                value={features}
                onChange={(e) => setFeatures(e.target.value)}
                className={inputCls + ' resize-none'}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-500">目标人群</label>
              <input
                placeholder="如：油皮/混油皮女生"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className={inputCls}
                onKeyDown={(e) => e.key === 'Enter' && generate()}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={generate}
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
            {remaining > 0 && (
              <span className="shrink-0 text-xs text-gray-400">
                今日剩余 <strong className="text-pink-500">{remaining}</strong> 次
              </span>
            )}
          </div>
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
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="group rounded-2xl border border-pink-100 bg-white p-5 shadow-sm transition-all hover:shadow-md"
                >
                  <h3 className="mb-2 font-semibold text-gray-800">{post.title}</h3>
                  <p className="mb-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-600">{post.content}</p>
                  <div className="mb-4 flex flex-wrap gap-1">
                    {post.tags.map((tag, i) => (
                      <span key={i} className="rounded-full bg-pink-50 px-2.5 py-0.5 text-xs text-pink-500">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => copyPost(post)}
                    className="w-full cursor-pointer rounded-lg border border-pink-200 py-2 text-sm text-pink-600 transition-all hover:bg-pink-50 active:scale-95"
                  >
                    {copiedId === post.id ? '✅ 已复制' : '📋 复制此条'}
                  </button>
                </div>
              ))}
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
          <div className="flex flex-wrap items-center justify-center gap-x-4">
            <span>小红书AI文案生成器 · DeepSeek 驱动</span>
            <button onClick={() => setShowSettings(true)} className="text-pink-400 hover:underline cursor-pointer">
              API 设置
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs">
            <span>📢 广告/商务合作：</span>
            <span className="font-medium text-gray-500">微信: ZzzzySovo</span>
            <span className="text-gray-300">|</span>
            <span>🛒 <a href="https://union.jd.com/" target="_blank" className="text-pink-400 hover:underline">京东好物</a></span>
            <span className="text-gray-300">|</span>
            <span>🛒 <a href="https://s.click.taobao.com/OlTZ1Tl" target="_blank" className="text-pink-400 hover:underline">手机支架 补光灯 ¥17.68</a></span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
