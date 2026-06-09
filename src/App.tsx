import { useState, useCallback, useEffect, useRef } from 'react'

// ====== Types ======
type TabKey =
  | 'jiangchong' | 'runshe' | 'gaixie' | 'fanyi' | 'kuoxie'
  | 'formula-check' | 'chart-check' | 'review-checklist' | 'reference-check'

interface TabInfo {
  key: TabKey
  label: string
  icon: string
  group: 'core' | 'review'
  needsImage: boolean
  placeholder: string
  systemPrompt: string
  btnLabel: string
}

const CORE_TABS: TabInfo[] = [
  {
    key: 'jiangchong', label: '降重', icon: '✂️', group: 'core', needsImage: false,
    placeholder: '粘贴需要降重的论文段落...\n\nAI会保持原意同时改变句式、替换同义词，有效降低查重率。',
    systemPrompt: '你是一个论文降重专家。\n要求：\n1. 保持原意的100%准确性\n2. 改变句式结构（主动变被动、拆分长句、重组语序）\n3. 替换同义词\n4. 保持学术语体\n5. 只输出改写后的文本，不要任何解释',
    btnLabel: '🚀 开始降重',
  },
  {
    key: 'runshe', label: '润色', icon: '✨', group: 'core', needsImage: false,
    placeholder: '粘贴需要润色的论文段落...\n\nAI会修正语法错误、优化表达、提升学术性和可读性。',
    systemPrompt: '你是一个学术论文润色专家。\n要求：\n1. 修正语法错误和不通顺的句子\n2. 提升学术表达的正式度和专业性\n3. 优化句子之间的逻辑衔接\n4. 保持原意完全不变\n5. 直接输出润色后的文本',
    btnLabel: '✨ 开始润色',
  },
  {
    key: 'gaixie', label: '改写', icon: '🔄', group: 'core', needsImage: false,
    placeholder: '粘贴需要改写的论文段落...\n\nAI会用完全不同的句式结构重新表达，适合大段降重。',
    systemPrompt: '你是一个论文改写专家。\n要求：\n1. 彻底重构句子结构\n2. 保持核心信息和学术观点100%准确\n3. 输出2个版本用---版本二---分隔\n4. 直接输出结果',
    btnLabel: '🔄 开始改写',
  },
  {
    key: 'fanyi', label: '翻译', icon: '🌐', group: 'core', needsImage: false,
    placeholder: '粘贴需要翻译的中文学术文本...\n\nAI会翻译成符合学术规范的英文。',
    systemPrompt: '你是一个学术翻译专家。\n要求：\n1. 准确传达中文原意\n2. 使用该学科领域标准的英文术语\n3. 保持学术英语正式风格\n4. 直接输出翻译结果',
    btnLabel: '🌐 开始翻译',
  },
  {
    key: 'kuoxie', label: '扩写', icon: '📝', group: 'core', needsImage: false,
    placeholder: '输入一个简短的观点或段落框架...\n\nAI会根据核心观点扩写成完整的学术段落。',
    systemPrompt: '你是一个学术写作专家。\n要求：\n1. 保持核心观点准确性\n2. 增加必要的论证、解释、例证\n3. 使用学术写作规范的语言\n4. 直接输出扩写后的文本',
    btnLabel: '📝 开始扩写',
  },
]

const REVIEW_TABS: TabInfo[] = [
  {
    key: 'formula-check', label: '公式检查', icon: '📐', group: 'review', needsImage: true,
    placeholder: '可选：补充公式所在的章节或上下文说明...',
    systemPrompt: `你是一个工科论文格式审查专家。分析用户提供的公式截图，从以下维度检查并输出报告：

【检查项目】
1. 公式编号位置 → 是否在公式右侧？编号格式是否统一（如(1-1)）？
2. 变量定义 → 公式中的变量是否在正文中被明确定义？
3. 量纲一致性 → 等式两边量纲是否一致？（如 E=mc² 一边能量一边质量×速度²）
4. 编号连续性 → 公式编号是否连续？有无跳跃或重复？
5. 符号规范性 → 使用的符号是否符合学科通用标准？

【输出格式要求】
请严格按照以下格式输出，使用对应 emoji 开头：

✅ **通过项**
- 公式编号位置：✓ 正确，编号在右侧，格式统一
- ...

⚠️ **建议项**
- 变量定义：△ 变量 ρ 建议在前文补充定义
- ...

❌ **问题项**
- 量纲一致性：✗ 等号左边是力(N)，右边是质量(kg)，缺少加速度项
- ...

最后请给出总体评价和改进建议。`,
    btnLabel: '🔍 检查公式',
  },
  {
    key: 'chart-check', label: '图表规范', icon: '📊', group: 'review', needsImage: true,
    placeholder: '可选：补充图表在论文中的位置或相关说明...',
    systemPrompt: `你是一个工科论文图表格式审查专家。分析用户提供的图表截图，从以下维度检查：

【检查项目】
1. 图题位置 → 图题是否在图下方？（国家标准要求图题在图下方）
2. 坐标轴 → x/y轴是否有标注？是否包含物理单位？
3. 图片质量 → 图片是否清晰？文字是否可辨？分辨率是否足够？
4. 表格格式 → 是否为标准三线表（顶线、表头线、底线）？
5. 编号连续性 → 图表编号是否连续？

【输出格式要求】
请严格按照以下格式输出：

✅ **通过项**
- ...

⚠️ **建议项**
- ...

❌ **问题项**
- ...

总体评价：`,
    btnLabel: '🔍 检查图表',
  },
  {
    key: 'review-checklist', label: '盲审清单', icon: '✅', group: 'review', needsImage: false,
    placeholder: `粘贴你的论文内容（摘要、目录、章节片段等）或直接在下方勾选需要检查的项目...

AI会根据你提供的论文内容，逐项检查盲审常见扣分点。`,
    systemPrompt: `你是一个论文盲审专家。根据用户提供的论文内容，逐项检查以下盲审常见扣分点：

【格式规范】
□ 页眉页脚是否正确
□ 目录页码与正文是否一致
□ 字体字号是否符合要求
□ 行间距是否统一
□ 页面边距是否规范

【内容规范】
□ 摘要是否概述了研究内容、方法和结论
□ 关键词是否准确反映论文主题
□ 结论是否与研究成果对应，是否有数据支撑
□ 参考文献引用在正文中是否都有出现

【学术规范】
□ 专业术语是否全文统一
□ 符号变量是否全文一致
□ 计量单位是否规范
□ 英文摘要语法是否正确

请逐项检查，输出格式：
✅ [通过项]：说明
⚠️ [建议项]：问题描述 → 修改建议
❌ [问题项]：问题描述 → 修改建议

如果用户没有提供完整论文，请根据已有内容尽可能检查，并标注"待补充材料"的项目。`,
    btnLabel: '✅ 开始审查',
  },
  {
    key: 'reference-check', label: '参考文献', icon: '📚', group: 'review', needsImage: false,
    placeholder: `粘贴你的参考文献列表...

支持检查：
• GB/T 7714-2015 格式规范性
• 正文引用与参考文献列表的对应关系
• 缺失的引用信息（页码、年份、卷期号）
• 格式统一性`,
    systemPrompt: `你是一个参考文献格式审查专家。检查用户提供的参考文献列表是否符合GB/T 7714-2015国家标准格式。

【检查规则】
1. 期刊 [J]: 作者. 题名[J]. 刊名, 年, 卷(期): 起止页码.
2. 图书 [M]: 作者. 书名[M]. 出版地: 出版社, 年.
3. 会议 [C]: 作者. 题名[C]. 会议名, 地点, 年.
4. 学位论文 [D]: 作者. 题名[D]. 出版地: 学校, 年.
5. 标准 [S]: 标准号. 标准名称[S]. 发布年.
6. 电子资源 [EB/OL]: 作者. 题名[EB/OL]. 引用日期. 网址.

【常见问题检查】
- 作者超过3人是否用"et al."或"等"
- 标点符号是否全英文半角
- 是否缺少年份/卷期/页码
- 文献类型标识是否正确
- 格式是否全文统一（同一个文献在不同位置格式一致）

请逐条分析，按以下格式输出：

📚 **参考文献检查报告**

📄 [1] 张三, 李四. 论文标题[J]. 期刊名, 2024, 15(3): 45-52.
✅ 格式正确

📄 [2] Wang Y, et al. Title[C]. Conference, 2023.
⚠️ 缺少页码，建议补充

📄 [3] 王五. 书[M]. 北京, 2021.
❌ 缺少出版社，建议补充为：北京: 出版社名, 2021

...

总体评价：XX 条参考文献中，XX 条格式正确，XX 条需要修改。`,
    btnLabel: '📚 检查格式',
  },
]

const ALL_TABS = [...CORE_TABS, ...REVIEW_TABS]

// ====== Config ======
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://shiyunapi.com/v1'
const DEFAULT_API_KEY = import.meta.env.VITE_API_KEY || ''
const MODEL = import.meta.env.VITE_MODEL || 'gpt-4o'
const FREE_DAILY_LIMIT = 3
const FREE_CHAR_LIMIT = 800
const VIP_CHAR_LIMIT = 5000
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
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
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const outputRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentTab = ALL_TABS.find(t => t.key === tab)!

  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'warning') => {
    setToast({ msg, type })
  }, [])

  const refreshUsage = useCallback(() => {
    forceUpdate(n => n + 1)
    setVip(isVip())
  }, [])

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_IMAGE_SIZE) {
      showToast('图片不能超过 5MB', 'warning')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      showToast('仅支持 JPG/PNG/GIF/WebP 格式', 'warning')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }, [showToast])

  const handleRemoveImage = useCallback(() => {
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const handleProcess = useCallback(async () => {
    const text = input.trim()

    // Validate
    if (!text && !imagePreview) {
      showToast(currentTab.needsImage ? '请先上传截图或输入说明' : '请先输入需要处理的文本', 'warning')
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
      // Build multimodal content for vision tabs
      const messages: any[] = []
      let userContent: any[]

      if (currentTab.needsImage && imagePreview) {
        userContent = [
          { type: 'text', text: currentTab.systemPrompt + (text ? '\n\n用户说明：' + text : '') },
          { type: 'image_url', image_url: { url: imagePreview } },
        ]
      } else {
        userContent = [
          { type: 'text', text: currentTab.systemPrompt + '\n\n' + text },
        ]
      }

      messages.push({ role: 'user', content: userContent })

      const res = await fetch(`${API_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages,
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
  }, [input, imagePreview, vip, apiKey, currentTab, showToast, refreshUsage])

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
    if (!code) { showToast('请输入验证码', 'warning'); return }
    if (code.length >= 6) {
      saveVip(365)
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
    setInput('')
    handleRemoveImage()
  }, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  const usedToday = getUsage()
  const remaining = Math.max(0, FREE_DAILY_LIMIT - usedToday)
  const isReviewTab = currentTab.group === 'review'

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
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <a href="#resume" style={{
            fontSize: 12, color: '#2563eb', textDecoration: 'none',
            padding: '4px 10px', borderRadius: 14, background: '#eff6ff',
            fontWeight: 500,
          }}>
            📋 简历体检
          </a>
          <button className="settings-btn" onClick={() => setShowSettings(true)}>
            ⚙️ 设置
          </button>
        </div>
      </header>

      {/* Info Banner */}
      <div className="info-banner">
        <span>💡</span>
        <div>
          <strong>毕过AI · 论文写作助手：</strong>
          从降重润色到盲审检查，一站式搞定毕业论文。每天
          {FREE_DAILY_LIMIT} 次免费，升级会员整篇论文无限处理 👇
        </div>
      </div>

      {/* ===== Core Tabs ===== */}
      <div className="tabs">
        {CORE_TABS.map(t => (
          <button
            key={t.key}
            className={`tab${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ===== Review Tabs with Header ===== */}
      <div className="tabs review-section">
        <span className="tabs-section-label">📋 盲审专区</span>
        {REVIEW_TABS.map(t => (
          <button
            key={t.key}
            className={`tab review${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ===== Input Area ===== */}
      <div className="card">
        <div className="card-title">
          <span>{isReviewTab ? '🔍' : '📝'}</span>
          {isReviewTab ? `${currentTab.label} — 上传截图或输入说明` : `输入文本`}
        </div>

        {/* Image Upload (for vision tabs) */}
        {currentTab.needsImage && (
          <div className="image-upload-area">
            {!imagePreview ? (
              <div className="image-upload-placeholder" onClick={() => fileInputRef.current?.click()}>
                <div className="upload-icon">📤</div>
                <div className="upload-text">点击上传截图</div>
                <div className="upload-hint">支持 JPG/PNG/GIF/WebP，最大 5MB</div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
              </div>
            ) : (
              <div className="image-preview-wrapper">
                <img src={imagePreview} alt="upload preview" className="image-preview" />
                <button className="image-remove-btn" onClick={handleRemoveImage}>🗑️ 删除</button>
              </div>
            )}
          </div>
        )}

        {/* Text Input (always visible but optional for vision tabs) */}
        <textarea
          className={`text-input${loading ? ' dimmed' : ''}`}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={currentTab.placeholder}
          disabled={loading}
          maxLength={vip ? VIP_CHAR_LIMIT : FREE_CHAR_LIMIT}
          style={{ minHeight: currentTab.needsImage ? 80 : 180 }}
        />
        {!currentTab.needsImage && (
          <div className={`char-count${input.length > (vip ? VIP_CHAR_LIMIT : FREE_CHAR_LIMIT) - 100 ? ' over' : ''}`}>
            {input.length} / {vip ? VIP_CHAR_LIMIT : FREE_CHAR_LIMIT} 字
          </div>
        )}
      </div>

      {/* ===== Process Button ===== */}
      <button
        className={`btn-primary${loading ? ' loading' : ''}`}
        onClick={handleProcess}
        disabled={loading || (!input.trim() && !imagePreview)}
      >
        {loading
          ? '🤖 AI 分析中，请稍候...'
          : currentTab.btnLabel}
      </button>

      {/* ===== Output Area ===== */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-title">
          <span>{isReviewTab ? '📋' : '📄'}</span> {isReviewTab ? '检查报告' : '处理结果'}
        </div>
        <div
          ref={outputRef}
          className={`output-area${!output ? ' empty' : ''}`}
        >
          {output || (
            loading
              ? '🤖 AI 正在分析，请稍候...'
              : isReviewTab
                ? '上传截图后点击检查，AI 会生成详细的审查报告'
                : '等待处理...'
          )}
        </div>
        {output && (
          <div className="output-actions">
            <button
              className={`btn-outline${copied ? ' copied' : ''}`}
              onClick={handleCopy}
            >
              {copied ? '✅ 已复制' : '📋 复制报告'}
            </button>
          </div>
        )}
      </div>

      {/* ===== Usage Bar ===== */}
      <div className="usage-bar">
        <span className="usage-text">
          {vip
            ? '👑 会员用户 · 无限使用'
            : `今日免费剩余：${remaining} / ${FREE_DAILY_LIMIT} 次`}
        </span>
        {!vip && (
          <button className="btn-upgrade" onClick={() => setShowPayment(true)}>
            🔓 升级会员
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="footer">
        <p>毕过AI · 论文写作助手 — 降重润色·盲审检查·一站搞定 | 有问题反馈给开发者</p>
      </div>

      {/* ===== Payment Modal ===== */}
      {showPayment && (
        <div className="modal-overlay" onClick={() => setShowPayment(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>🎓 升级毕过AI会员</h3>
            <p>毕业季限时优惠，一次解锁全部功能！</p>

            <div style={{ fontSize: 13, background: '#f0fdf4', padding: '10px 14px', borderRadius: 8, marginBottom: 16, lineHeight: 1.6, color: '#166534' }}>
              ✅ 整篇论文无限次降重 &nbsp;·&nbsp; 每次最多 2 万字<br />
              ✅ 盲审专区全部开放 &nbsp;·&nbsp; 公式/图表/清单/文献<br />
              ✅ 查重报告分析 &nbsp;·&nbsp; 高重复段落定位与改写<br />
              ✅ 参考文献格式整理 &nbsp;·&nbsp; GB/T 7714 自动规范
            </div>

            <div className="modal-pricing">
              <div className="pricing-card recommended">
                <div>
                  <div className="pricing-name">🎉 毕业季卡 · 最划算</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>永久有效，不限次数 · 不限字数 · 全部功能</div>
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
              <div
                style={{
                  width: 180, height: 180, margin: '0 auto', background: '#f0f0f0',
                  borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, color: '#94a3b8', border: '1px solid #e2e8f0',
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

      {/* ===== Settings Modal ===== */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>⚙️ API 设置</h3>
            <p>配置你的 API Key（如果默认 key 额度用完，可以自己填）</p>

            <div className="settings-hint">
              <strong>获取方式：</strong>
              前往 <a href="https://shiyunapi.com" target="_blank" rel="noopener" style={{ color: '#2563eb' }}>诗云API</a> 注册 →
              创建 API Key → 复制粘贴到下面。
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
