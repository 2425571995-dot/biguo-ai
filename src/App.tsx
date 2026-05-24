import { useState } from 'react'

const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions'

interface Post {
  id: number
  title: string
  content: string
  tags: string[]
}

function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('xhs_key') || '')
  const [showKeyInput, setShowKeyInput] = useState(false)
  const [product, setProduct] = useState('')
  const [features, setFeatures] = useState('')
  const [price, setPrice] = useState('')
  const [audience, setAudience] = useState('')
  const [loading, setLoading] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [copiedId, setCopiedId] = useState<number | null>(null)

  const generate = async () => {
    if (!product.trim()) return alert('请输入产品名称')

    setLoading(true)
    try {
      // 优先使用后端 API（Vercel 部署时）
      let res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, features, price, audience }),
      })

      // 如果后端不可用（Gitee Pages 等纯静态托管），使用用户自带 Key
      if (!res.ok && res.status === 404) {
        if (!apiKey.trim()) {
          setShowKeyInput(true)
          throw new Error('请先设置 DeepSeek API Key')
        }
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

      // Vercel 后端返回 { posts: [...] }，DeepSeek 直接返回 choices
      let parsed: Post[]
      if (data.posts) {
        parsed = data.posts
      } else {
        const raw = data.choices[0].message.content
        const cleaned = raw.replace(/```json\n?/g, '').replace(/```/g, '').trim()
        parsed = JSON.parse(cleaned)
      }

      setPosts(parsed.map((p, i) => ({ ...p, id: i })))
    } catch (e: any) {
      alert('生成失败: ' + e.message)
    } finally {
      setLoading(false)
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
      <header className="border-b border-pink-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <h1 className="text-xl font-bold text-gray-800">小红书文案生成器</h1>
          </div>
          <div className="text-sm text-gray-400">AI 秒出爆款笔记</div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* API Key — 纯静态托管时需要 */}
        {showKeyInput && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="mb-2 text-sm text-amber-700">
              检测到后端服务不可用，请填入你的 DeepSeek API Key（免费获取）：
            </p>
            <input
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => saveKey(e.target.value)}
              className={inputCls}
            />
            <p className="mt-1 text-xs text-amber-500">
              密钥仅保存在你的浏览器本地。
              <a href="https://platform.deepseek.com/api_keys" target="_blank" className="ml-1 underline">
                点此获取（新用户送500万tokens）
              </a>
            </p>
          </div>
        )}

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

          <button
            onClick={generate}
            disabled={loading}
            className="mt-6 w-full cursor-pointer rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 py-3.5 text-lg font-semibold text-white shadow-lg shadow-pink-200 transition-all hover:shadow-xl hover:shadow-pink-300 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
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
        </div>

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

      <footer className="border-t border-pink-100 py-6 text-center text-sm text-gray-400">
        小红书AI文案生成器 · DeepSeek 驱动 ·
        <button onClick={() => setShowKeyInput(!showKeyInput)} className="ml-1 text-pink-400 hover:underline cursor-pointer">
          {showKeyInput ? '收起设置' : 'API 设置'}
        </button>
      </footer>
    </div>
  )
}

export default App
