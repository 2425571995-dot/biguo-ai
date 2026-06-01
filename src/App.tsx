import { useState, useCallback, useEffect, useRef } from 'react'

// ====== Types ======
type TabKey = 'jiangchong' | 'runshe' | 'gaixie' | 'fanyi' | 'kuoxie'

interface TabInfo {
  key: TabKey
  label: string
  icon: string
  tier: 'P0' | 'P1'
  placeholder: string
  systemPrompt: string
}

const TABS: TabInfo[] = [
  {
    key: 'jiangchong',
    label: '降重',
    icon: '✂️',
    tier: 'P0',
    placeholder: '粘贴需要降重的论文段落...\n\n提示：AI会保持原意的同时改变句式、替换同义词，有效降低查重率。',
    systemPrompt: `你是一个论文降重专家。你的任务是将用户输入的学术文本进行深度改写，以降低查重率。

要求：
1. 保持原意的100%准确性，不能改变学术观点、数据、专业术语
2. 改变句式结构（主动变被动、拆分长句、重组语序、变换主语）
3. 替换同义词，特别是高频词汇和固定搭配
4. 保持学术语体的正式性和专业性
5. 输出只包含改写后的文本，不要任何解释和前缀
6. 直接输出结果`,
  },
  {
    key: 'runshe',
    label: '润色',
    icon: '✨',
    tier: 'P0',
    placeholder: '粘贴需要润色的论文段落...\n\n提示：AI会修正语法错误、优化表达、提升学术性和可读性。',
    systemPrompt: `你是一个中文学术论文润色专家。请对以下文本进行润色：

要求：
1. 修正语法错误和不通顺的句子
2. 提升学术表达的正式度和专业性
3. 优化句子之间的逻辑衔接（添加合适的连接词）
4. 保持原意的完全不变
5. 直接输出润色后的文本，不要任何解释和前缀`,
  },
  {
    key: 'gaixie',
    label: '改写',
    icon: '🔄',
    tier: 'P0',
    placeholder: '粘贴需要改写的论文段落...\n\n提示：AI会用完全不同的句式结构重新表达，适合大段降重。',
    systemPrompt: `你是一个论文改写专家。请对以下文本进行彻底改写：

要求：
1. 彻底重构句子结构，使用完全不同的表达方式
2. 保持核心信息和学术观点的100%准确
3. 使用更丰富的词汇和句式
4. 输出2个不同版本，用"---版本二---"分隔
5. 保持学术风格的严谨性
6. 直接输出改写结果，不要任何解释`,
  },
  {
    key: 'fanyi',
    label: '翻译',
    icon: '🌐',
    tier: 'P1',
    placeholder: '粘贴需要翻译的中文学术文本...\n\n提示：AI会翻译成符合学术规范的英文。',
    systemPrompt: `你是一个学术翻译专家，擅长中译英学术翻译。

要求：
1. 准确传达中文原意，不遗漏任何信息
2. 使用该学科领域标准的英文术语
3. 保持学术英语的正式风格
4. 句式符合英文表达习惯
5. 直接输出翻译结果，不要任何解释和前缀`,
  },
  {
    key: 'kuoxie',
    label: '扩写',
    icon: '📝',
    tier: 'P1',
    placeholder: '输入一个简短的观点或段落框架...\n\n提示：AI会根据你的核心观点扩写成完整的学术段落。',
    systemPrompt: `你是一个学术写作专家。请根据用户提供的核心观点或框架，扩写成完整的学术段落。

要求：
1. 保持核心观点的准确性
2. 增加必要的论证、解释、例证
3. 使用学术写作规范的语言
4. 扩写后内容要逻辑完整、衔接自然
5. 直接输出扩写后的文本，不要任何解释和前缀`,
  },
]

// ====== Config ======
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://shiyunapi.com/v1'
const DEFAULT_API_KEY = import.meta.env.VITE_API_KEY || ''
const MODEL = import.meta.env.VITE_MODEL || 'gpt-4o'
const FREE_DAILY_LIMIT = 3
const FREE_CHAR_LIMIT = 800
const VIP_CHAR_LIMIT = 5000
const STORAGE_KEY_USAGE = 'biguoai_usage'
const STORAGE_KEY_VIP = 'biguoai_vip'
const STORAGE_KEY_API = 'biguoai_apikey'

// ====== Helpers ======
function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function getUsage(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USAGE)
    if (!raw) return 0
    const data = JSON.parse(raw)
    if (data.date === getTodayStr()) return data.count
  } catch { /* ignore */ }
  return 0
}

function incrementUsage(): number {
  const today = getTodayStr()
  const current = getUsage()
  const newCount = current + 1
  localStorage.setItem(STORAGE_KEY_USAGE, JSON.stringify({ date: today, count: newCount }))
  return newCount
}

function isVip(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VIP)
    if (!raw) return false
    const data = JSON.parse(raw)
    return data.expires > Date.now()
  } catch { return false }
}

function saveVip(days: number) {
  localStorage.setItem(STORAGE_KEY_VIP, JSON.stringify({ expires: Date.now() + days * 86400000 }))
}

function getSavedApiKey(): string {
  return localStorage.getItem(STORAGE_KEY_API) || ''
}

function setSavedApiKey(key: string) {
  localStorage.setItem(STORAGE_KEY_API, key)
}

// ====== Toast Component ======
function Toast({ msg, type, onDone }: { msg: string; type: 'success' | 'error' | 'warning'; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500)
    return () => clearTimeout(t)
  }, [onDone])
  return <div className={`toast ${type}`}>{msg}</div>
}

// ====== Main App ======
export default function App() {
  const [tab, setTab] = useState<TabKey>('jiangchong')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'warning' } | null>(null)
  const [showPayment, setShowPayment] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [apiKey, setApiKey] = useState(getSavedApiKey() || DEFAULT_API_KEY)
  const [, forceUpdate] = useState(0)
  const [vip, setVip] = useState(isVip())
  const [verifyCode, setVerifyCode] = useState('')
  const outputRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  const currentTab = TABS.find(t => t.key === tab)!

  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'warning') => {
    setToast({ msg, type })
  }, [])

  const refreshUsage = useCallback(() => {
    forceUpdate(n => n + 1)
    setVip(isVip())
  }, [])

  const handleProcess = useCallback(async () => {
    const text = input.trim()
    if (!text) {
      showToast('请先输入需要处理的文本', 'warning')
      return
    }

    const charLimit = vip ? VIP_CHAR_LIMIT : FREE_CHAR_LIMIT
    if (text.length > charLimit) {
      showToast(`当前${vip ? 5000 : 800}字限制，文本超出${text.length - charLimit}字`, 'warning')
      return
    }

    if (!vip) {
      const used = getUsage()
      if (used >= FREE_DAILY_LIMIT) {
        setShowPayment(true)
        return
      }
    }

    const key = apiKey || DEFAULT_API_KEY
    if (!key) {
      showToast('请先设置 API Key', 'warning')
      setShowSettings(true)
      return
    }

    setLoading(true)
    setOutput('')

    try {
      const res = await fetch(`${API_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: currentTab.systemPrompt },
            { role: 'user', content: text },
          ],
          max_tokens: 4096,
          temperature: 0.7,
        }),
      })

      if (!res.ok) {
        const errBody = await res.text().catch(() => '')
        throw new Error(`API错误 ${res.status}: ${errBody.slice(0, 100)}`)
      }

      const data = await res.json()
      const result = data.choices?.[0]?.message?.content || ''
      if (!result) throw new Error('API返回为空，请重试')

      setOutput(result)

      if (!vip) {
        incrementUsage()
        refreshUsage()
      }

      showToast('处理完成！ 🎉', 'success')
    } catch (err: any) {
      showToast(err.message || '处理失败，请重试', 'error')
    } finally {
      setLoading(false)
    }
  }, [input, vip, apiKey, currentTab, showToast, refreshUsage])

  const handleCopy = useCallback(async () => {
    if (!output) return
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      showToast('复制失败，请手动选择复制', 'error')
    }
  }, [output, showToast])

  const handleVerifyVip = useCallback(() => {
    const code = verifyCode.trim()
    if (!code) {
      showToast('请输入验证码', 'warning')
      return
    }
    // Simple verification: any code >= 6 chars works for MVP
    // In production, validate against payment system
    if (code.length >= 6) {
      saveVip(365) // 1 year VIP
      setVip(true)
      setVerifyCode('')
      setShowPayment(false)
      showToast('升级成功！祝你毕业顺利 🎉', 'success')
    } else {
      showToast('验证码无效，请检查后重试', 'error')
    }
  }, [verifyCode, showToast])

  // Reset output when tab changes
  useEffect(() => {
    setOutput('')
  }, [tab])

  const usedToday = getUsage()
  const remaining = Math.max(0, FREE_DAILY_LIMIT - usedToday)

  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      {/* Header */}
      <header className="header">
        <div className="header-left">
          <div className="header-logo">毕</div>
          <div className="header-title">
            毕过<span>AI</span>
            <span className="header-badge">免费</span>
          </div>
        </div>
        <button className="settings-btn" onClick={() => setShowSettings(true)}>
          ⚙️ 设置
        </button>
      </header>

      {/* Info Banner */}
      <div className="info-banner">
        <span>💡</span>
        <div>
          <strong>毕业季福利：</strong>
          每天免费使用 {FREE_DAILY_LIMIT} 次（每次{FREE_CHAR_LIMIT}字），升级会员无限用！
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`tab${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.icon} {t.label}
            {t.tier === 'P1' && <span className="tab-badge">新</span>}
          </button>
        ))}
      </div>

      {/* Input Card */}
      <div className="card">
        <div className="card-title">
          <span>📝</span> 输入文本（{currentTab.tier === 'P0' ? '核心' : '扩展'}功能）
        </div>
        <textarea
          className={`text-input${loading ? ' dimmed' : ''}`}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={currentTab.placeholder}
          disabled={loading}
          maxLength={vip ? VIP_CHAR_LIMIT : FREE_CHAR_LIMIT}
        />
        <div className={`char-count${input.length > (vip ? VIP_CHAR_LIMIT : FREE_CHAR_LIMIT) - 100 ? ' over' : ''}`}>
          {input.length} / {vip ? VIP_CHAR_LIMIT : FREE_CHAR_LIMIT} 字
        </div>
      </div>

      {/* Process Button */}
      <button
        className={`btn-primary${loading ? ' loading' : ''}`}
        onClick={handleProcess}
        disabled={loading || !input.trim()}
      >
        {loading
          ? '🤖 AI 处理中，请稍候...'
          : `🚀 开始${currentTab.label}`}
      </button>

      {/* Output Card */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-title">
          <span>📄</span> 处理结果
        </div>
        <div
          ref={outputRef}
          className={`output-area${!output ? ' empty' : ''}`}
        >
          {output || (loading ? 'AI 正在生成中，请稍候...' : '等待处理...')}
        </div>
        {output && (
          <div className="output-actions">
            <button
              className={`btn-outline${copied ? ' copied' : ''}`}
              onClick={handleCopy}
            >
              {copied ? '✅ 已复制' : '📋 复制结果'}
            </button>
          </div>
        )}
      </div>

      {/* Usage Bar */}
      <div className="usage-bar">
        <span className="usage-text">
          {vip
            ? '👑 会员用户 · 无限使用'
            : `今日免费剩余：<strong>${remaining}</strong> / ${FREE_DAILY_LIMIT} 次（每次≤${FREE_CHAR_LIMIT}字）`}
        </span>
        {!vip && (
          <button className="btn-upgrade" onClick={() => setShowPayment(true)}>
            🔓 升级会员
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="footer">
        <p>毕过AI · 毕业论文好帮手 | 遇到问题？反馈给开发者</p>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="modal-overlay" onClick={() => setShowPayment(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>🎓 升级毕过AI会员</h3>
            <p>毕业季限时优惠，一次解锁全部功能！</p>

            <div className="modal-pricing">
              <div className="pricing-card recommended">
                <div>
                  <div className="pricing-name">🎉 毕业季卡 · 最划算</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>无限使用全部功能 + 不限字数</div>
                </div>
                <div>
                  <span className="pricing-original">¥99</span>
                  <span className="pricing-price">¥49.9</span>
                </div>
              </div>
              <div className="pricing-card">
                <div>
                  <div className="pricing-name">📱 月卡</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>30天无限使用</div>
                </div>
                <div className="pricing-price">¥29.9</div>
              </div>
            </div>

            <div className="qr-area">
              <p>💳 扫码付款后获取验证码</p>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                支付宝 / 微信 扫码支付
              </div>
              {/* QR Code placeholder — replace with your actual payment QR */}
              <div
                style={{
                  width: 180,
                  height: 180,
                  margin: '0 auto',
                  background: '#f0f0f0',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  color: '#94a3b8',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div>
                  <div style={{ fontSize: 32, marginBottom: 4 }}>📱</div>
                  放你的收款码
                </div>
              </div>
              <div className="qr-tip">
                ⚡ 付款后把「交易单号后6位」粘贴到下面输入框激活
              </div>
            </div>

            <input
              className="verify-input"
              placeholder="输入交易单号后6位"
              value={verifyCode}
              onChange={e => setVerifyCode(e.target.value)}
            />
            <button
              className="btn-primary"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}
              onClick={handleVerifyVip}
            >
              🔓 验证并激活
            </button>
            <button className="btn-close-modal" onClick={() => setShowPayment(false)}>
              稍后再说
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>⚙️ API 设置</h3>
            <p>配置你的 API Key（如果默认 key 额度用完，可以自己填）</p>

            <div className="settings-hint">
              <strong>获取方式：</strong>
              前往 <a href="https://shiyunapi.com" target="_blank" rel="noopener" style={{ color: '#2563eb' }}>诗云API</a> 注册 →
              创建 API Key → 复制粘贴到下面。支持 OpenAI / DeepSeek 等兼容接口。
            </div>

            <input
              className="settings-input"
              placeholder="sk-..."
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
            />

            <button
              className="btn-primary"
              onClick={() => {
                setSavedApiKey(apiKey)
                setShowSettings(false)
                showToast('API Key 已保存', 'success')
              }}
            >
              💾 保存
            </button>
            <button className="btn-close-modal" onClick={() => setShowSettings(false)}>
              取消
            </button>
          </div>
        </div>
      )}
    </>
  )
}
