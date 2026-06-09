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
const MODEL = import.meta.env.VITE_MODEL || 'deepseek-chat'
const FREE_DAILY_LIMIT = 5
const CHAR_LIMIT = 2000
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB

// Storage keys
const STORAGE_KEY_USAGE = 'biguoai_usage'
const STORAGE_KEY_BONUS = 'biguoai_bonus'
const STORAGE_KEY_VIP = 'biguoai_vip'
const STORAGE_KEY_VIP_CODE = 'biguoai_vipcode'
const STORAGE_KEY_USER_ID = 'biguoai_uid'
const STORAGE_KEY_SHARED_COUNT = 'biguoai_shared'

// New storage keys
const STORAGE_KEY_DEEPSEEK_BASE = 'deepseek_api_base_url'
const STORAGE_KEY_DEEPSEEK_KEY = 'deepseek_api_key'
const STORAGE_KEY_GUIDE = 'hasSeenKeyGuide'
const STORAGE_KEY_DEMO = 'demo_mode_enabled'

const DEFAULT_API_BASE = 'https://api.deepseek.com/v1'

// 默认激活码（你可以随时改这个）
const DEFAULT_VIP_CODE = 'biguo2026'

// Demo data
const DEMO_INPUT = '随着互联网技术的快速发展，人工智能在教育领域中的应用越来越广泛。通过对学习数据的分析，人工智能能够为学生提供更加个性化的学习建议，从而提高学习效率和教学质量。'
const DEMO_OUTPUT = '随着互联网技术的持续进步，人工智能在教育场景中的应用范围不断扩大。借助对学习行为和相关数据的分析，人工智能能够为学生提供更具针对性的学习建议，从而在一定程度上提升学习效率与教学质量。'
const DEMO_NOTE = '已调整句式结构，替换部分重复表达，并增强了论文表述的自然度和学术感。'
const CORE_PLACEHOLDER = '粘贴需要降重的论文段落，建议 100–800 字。\n\nAI 将在保留原意的基础上调整句式、替换重复表达，并优化为更自然的学术表达。'

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

function getBonusUses(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BONUS)
    if (!raw) return 0
    const data = JSON.parse(raw)
    if (data.date === getTodayStr()) return data.bonus
  } catch { /* ignore */ }
  return 0
}

function addBonusUses(n: number): number {
  const today = getTodayStr()
  const current = getBonusUses()
  const newBonus = current + n
  localStorage.setItem(STORAGE_KEY_BONUS, JSON.stringify({ date: today, bonus: newBonus }))
  return newBonus
}

function getTotalDailyLimit(): number {
  return FREE_DAILY_LIMIT + getBonusUses()
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

function getCurrentVipCode(): string {
  return localStorage.getItem(STORAGE_KEY_VIP_CODE) || DEFAULT_VIP_CODE
}

function setCurrentVipCode(code: string) {
  localStorage.setItem(STORAGE_KEY_VIP_CODE, code)
}

function getUserShareId(): string {
  let id = localStorage.getItem(STORAGE_KEY_USER_ID)
  if (!id) {
    id = Math.random().toString(36).slice(2, 8)
    localStorage.setItem(STORAGE_KEY_USER_ID, id)
  }
  return id
}

function getShareCount(): number {
  return parseInt(localStorage.getItem(STORAGE_KEY_SHARED_COUNT) || '0', 10)
}

function incrementShareCount(): number {
  const n = getShareCount() + 1
  localStorage.setItem(STORAGE_KEY_SHARED_COUNT, String(n))
  return n
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
  const [, forceUpdate] = useState(0)
  const [vip, setVip] = useState(isVip())
  const [verifyCode, setVerifyCode] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const outputRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showAdmin, setShowAdmin] = useState(false)
  const [adminCode, setAdminCode] = useState(getCurrentVipCode())
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const logoClicks = useRef(0)

  // New states for API Key guide & Demo mode
  const [savedApiKey, setSavedApiKey] = useState(() => localStorage.getItem(STORAGE_KEY_DEEPSEEK_KEY) || '')
  const [savedApiBase, setSavedApiBase] = useState(() => localStorage.getItem(STORAGE_KEY_DEEPSEEK_BASE) || DEFAULT_API_BASE)
  const [demoMode, setDemoMode] = useState(() => localStorage.getItem(STORAGE_KEY_DEMO) === 'true')
  const [showConfig, setShowConfig] = useState(false)
  const [configMode, setConfigMode] = useState<'firstTime' | 'settings'>('settings')
  const [configApiKey, setConfigApiKey] = useState('')
  const [configApiBase, setConfigApiBase] = useState(DEFAULT_API_BASE)
  const [configShowPwd, setConfigShowPwd] = useState(false)
  const [showApiKeyPrompt, setShowApiKeyPrompt] = useState(false)
  const [intensity, setIntensity] = useState('中度')
  const [modifyNote, setModifyNote] = useState('')

  const siteUrl = window.location.origin + window.location.pathname
  const shareLink = siteUrl + '?ref=' + getUserShareId()

  const currentTab = ALL_TABS.find(t => t.key === tab)!

  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'warning') => {
    setToast({ msg, type })
  }, [])

  const refreshUsage = useCallback(() => {
    forceUpdate(n => n + 1)
    setVip(isVip())
  }, [])

  const openConfig = useCallback((mode: 'firstTime' | 'settings') => {
    setConfigMode(mode)
    setConfigApiKey(mode === 'settings' ? savedApiKey : '')
    setConfigApiBase(mode === 'settings' ? savedApiBase : DEFAULT_API_BASE)
    setConfigShowPwd(false)
    setShowApiKeyPrompt(false)
    setShowConfig(true)
  }, [savedApiKey, savedApiBase])

  const saveConfig = useCallback(() => {
    localStorage.setItem(STORAGE_KEY_DEEPSEEK_KEY, configApiKey)
    localStorage.setItem(STORAGE_KEY_DEEPSEEK_BASE, configApiBase)
    localStorage.setItem(STORAGE_KEY_GUIDE, 'true')
    setSavedApiKey(configApiKey)
    setSavedApiBase(configApiBase)
    setShowConfig(false)
    if (configApiKey) {
      showToast('API Key 已保存', 'success')
    } else {
      showToast('配置已保存', 'success')
    }
  }, [configApiKey, configApiBase, showToast])

  const clearConfig = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_DEEPSEEK_KEY)
    localStorage.removeItem(STORAGE_KEY_DEEPSEEK_BASE)
    localStorage.removeItem(STORAGE_KEY_DEMO)
    setSavedApiKey('')
    setSavedApiBase(DEFAULT_API_BASE)
    setDemoMode(false)
    setShowConfig(false)
    showToast('配置已清除', 'success')
  }, [showToast])

  const enableDemoAndClose = useCallback(() => {
    localStorage.setItem(STORAGE_KEY_DEMO, 'true')
    localStorage.setItem(STORAGE_KEY_GUIDE, 'true')
    setDemoMode(true)
    setShowConfig(false)
    showToast('🎪 已切换到 Demo 模式', 'success')
  }, [showToast])

  const dismissGuide = useCallback(() => {
    localStorage.setItem(STORAGE_KEY_GUIDE, 'true')
    setShowConfig(false)
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
      showToast(currentTab.needsImage ? '请先上传截图或输入说明' : '请先粘贴需要降重的论文段落', 'warning')
      return
    }

    // Check daily limit
    if (!vip) {
      const used = getUsage()
      if (used >= getTotalDailyLimit()) {
        setShowPayment(true)
        return
      }
    }

    // Demo mode — return preset results
    if (demoMode) {
      if (text === DEMO_INPUT) {
        setOutput(DEMO_OUTPUT)
        setModifyNote(DEMO_NOTE)
      } else {
        setOutput('这是 Demo 模式示例结果。配置诗云 API Key 后，即可处理你输入的真实论文内容。\n\n' + DEMO_OUTPUT)
        setModifyNote(DEMO_NOTE)
      }
      if (!vip) {
        incrementUsage()
        refreshUsage()
      }
      showToast('Demo 模式演示结果 🎉', 'success')
      return
    }

    // Check API Key
    if (!savedApiKey) {
      setShowApiKeyPrompt(true)
      return
    }

    setShowApiKeyPrompt(false)
    setLoading(true)
    setOutput('')

    try {
      // Build API URL
      let baseUrl = (savedApiBase || DEFAULT_API_BASE).replace(/\/+$/, '')
      if (!baseUrl.endsWith('/v1')) baseUrl += '/v1'
      const apiUrl = `${baseUrl}/chat/completions`

      // Build messages
      const messages: any[] = []
      let userContent: any[]

      if (currentTab.needsImage && imagePreview) {
        userContent = [
          { type: 'text', text: currentTab.systemPrompt + (text ? '\n\n用户说明：' + text : '') },
          { type: 'image_url', image_url: { url: imagePreview } },
        ]
      } else {
        // Add intensity instruction for jiangchong tab
        let systemPrompt = currentTab.systemPrompt
        if (tab === 'jiangchong' && intensity !== '中度') {
          const intensityMap: Record<string, string> = {
            '轻度': '\n\n【强度要求】轻度降重：轻微调整句式，保持原文风格，降重率约10-20%。',
            '强力': '\n\n【强度要求】强力降重：大幅改写句式，彻底重组语序，降重率约50-70%。',
          }
          systemPrompt += intensityMap[intensity] || ''
        }
        userContent = [
          { type: 'text', text: systemPrompt + '\n\n' + text },
        ]
      }

      messages.push({ role: 'user', content: userContent })

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${savedApiKey}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages,
          max_tokens: 4096,
          temperature: intensity === '强力' ? 0.9 : intensity === '轻度' ? 0.5 : 0.7,
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
      setModifyNote('已优化句式结构、替换重复表达，并尽量保留原文含义。')

      if (!vip) {
        incrementUsage()
        refreshUsage()
      }

      showToast('处理完成！ 🎉', 'success')
    } catch (err: any) {
      showToast('处理失败，请检查 API Key 是否正确，或稍后重试。', 'error')
    } finally {
      setLoading(false)
    }
  }, [input, imagePreview, vip, savedApiKey, savedApiBase, currentTab, showToast, refreshUsage, demoMode, tab, intensity])

  const handleCopy = useCallback(async () => {
    if (!output) return
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      showToast('已复制到剪贴板', 'success')
    } catch {
      showToast('复制失败，请手动选择复制', 'error')
    }
  }, [output, showToast])

  // Reset state when tab changes
  useEffect(() => {
    setOutput('')
    setInput('')
    setModifyNote('')
    handleRemoveImage()
  }, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  // On mount: check URL params and show first-time guide
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const codeFromUrl = params.get('vip')
    if (codeFromUrl && codeFromUrl.length >= 4) {
      setCurrentVipCode(codeFromUrl)
      showToast('欢迎使用毕过AI！每天免费5次 🎉', 'success')
    }
    // Referral tracking
    const ref = params.get('ref')
    if (ref && ref.length >= 4) {
      const visitedKey = 'biguoai_ref_visited_' + ref
      if (!localStorage.getItem(visitedKey)) {
        localStorage.setItem(visitedKey, '1')
        addBonusUses(3)
        showToast('🎉 通过好友链接进入，已获得 +3 次免费机会！', 'success')
      }
    }

    // First-time guide popup
    if (!savedApiKey && !localStorage.getItem(STORAGE_KEY_GUIDE)) {
      openConfig('firstTime')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const usedToday = getUsage()
  const remaining = Math.max(0, FREE_DAILY_LIMIT - usedToday)
  const isReviewTab = currentTab.group === 'review'

  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      {/* ===== Header ===== */}
      <header className="header">
        <div className="header-left">
          <div className="header-logo" onClick={() => { logoClicks.current++; if (logoClicks.current >= 5) { setShowAdmin(true); logoClicks.current = 0 } }} style={{ cursor: 'pointer' }}>毕</div>
          <div>
            <div className="header-title">
              毕过<span>AI</span>
              <span className="header-badge">{vip ? '无限次' : '每日免费 5 次'}</span>
            </div>
            <div className="header-subtitle">保留原意，优化句式，降低重复表达</div>
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
          <button className="settings-btn" onClick={() => window.open('https://platform.deepseek.com', '_blank')}>
            ⚙️ API
          </button>
        </div>
      </header>

      {/* ===== ATS 简历体检入口卡片 ===== */}
      <a href="#resume" style={{ textDecoration: 'none', display: 'block', margin: '12px 0' }}>
        <div style={{
          background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 40%, #7c3aed 100%)',
          borderRadius: 16,
          padding: '20px 20px 18px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(37, 99, 235, 0.25)',
          cursor: 'pointer',
        }}>
          {/* 背景装饰 */}
          <div style={{
            position: 'absolute', right: -20, top: -30,
            width: 140, height: 140,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
          }} />
          <div style={{
            position: 'absolute', right: 60, top: 20,
            width: 60, height: 60,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* 顶部标签行 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{
                background: '#fbbf24', color: '#1e3a5f', fontWeight: 800,
                padding: '3px 10px', borderRadius: 12, fontSize: 11,
                animation: 'pulse 2s infinite',
              }}>
                🔥 新上线
              </span>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
                2026届毕业生都在用
              </span>
            </div>

            {/* 主标题 */}
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 4, letterSpacing: 0.5 }}>
              📋 你的简历能过 AI 筛选吗？
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 12, lineHeight: 1.5 }}>
              粘贴简历 + 岗位JD → 秒出 ATS 匹配度评分 · 关键词缺口检测 · 格式规范检查
            </div>

            {/* 三个卖点 */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              {[
                { icon: '🎯', text: '关键词匹配打分' },
                { icon: '🔍', text: '格式问题检测' },
                { icon: '📊', text: '对标同岗位竞争力' },
              ].map(item => (
                <span key={item.text} style={{
                  background: 'rgba(255,255,255,0.15)',
                  color: '#fff', fontSize: 11, fontWeight: 500,
                  padding: '5px 10px', borderRadius: 8,
                  backdropFilter: 'blur(4px)',
                }}>
                  {item.icon} {item.text}
                </span>
              ))}
            </div>

            {/* CTA 按钮 */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#fff', color: '#1e40af', fontWeight: 700,
              padding: '10px 22px', borderRadius: 24, fontSize: 14,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}>
              免费检测我的简历 →
            </div>

            <div style={{ marginTop: 8, fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
              🆓 每日免费 1 次 · 完整报告 ¥6.9 解锁
            </div>
          </div>
        </div>
      </a>

      {/* ===== Info Banner ===== */}
      <div className="info-banner">
        <span>🎓</span>
        <div>
          论文初稿别急着提交：先降重、再润色、最后做提交前检查。今日免费 <strong>{FREE_DAILY_LIMIT} 次</strong>，分享好友 +3 次 👇
        </div>
      </div>

      {/* ===== Demo Mode Banner ===== */}
      {demoMode && (
        <div className="demo-banner">
          <span>🎪 Demo 体验模式 — 配置 Key 后可处理你的真实论文</span>
          <button className="demo-config-btn" onClick={() => openConfig('firstTime')}>
            🚀 免费配置，1 分钟搞定
          </button>
        </div>
      )}

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
        <span className="tabs-section-label">📋 提交前检查</span>
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

      {/* ===== Main Consolidated Card ===== */}
      <div className="card main-card">
        {/* Card Title + Paste Example */}
        <div className="card-title" style={{ marginBottom: 0 }}>
          <span>{isReviewTab ? '🔍' : '📝'}</span>
          {isReviewTab ? `${currentTab.label}` : '输入论文段落'}
          {!isReviewTab && (
            <button
              className="btn-paste-example"
              onClick={() => {
                setInput(DEMO_INPUT)
                showToast('📋 已填入示例文本', 'success')
              }}
            >
              📋 粘贴示例
            </button>
          )}
        </div>

        {/* Image Upload (for vision tabs) */}
        {currentTab.needsImage && (
          <div className="image-upload-area" style={{ marginBottom: 0 }}>
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

        {/* Textarea */}
        <textarea
          className={`text-input${loading ? ' dimmed' : ''}`}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={isReviewTab ? currentTab.placeholder : CORE_PLACEHOLDER}
          disabled={loading}
          maxLength={CHAR_LIMIT}
          style={{ minHeight: currentTab.needsImage ? 80 : 170 }}
        />

        {/* Char Count */}
        {!currentTab.needsImage && (
          <div className={`char-count${input.length > CHAR_LIMIT ? ' over' : ''}`}>
            {input.length} / {CHAR_LIMIT} 字，建议 100–800 字
            {input.length > CHAR_LIMIT && (
              <span className="char-over-warning">⚠️ 内容过长，建议分段处理，效果更稳定</span>
            )}
          </div>
        )}

        {/* Intensity & Output Style (core tabs only) */}
        {!isReviewTab && (
          <>
            <div className="intensity-row">
              <span className="intensity-label">降重强度</span>
              <div className="intensity-options">
                {['轻度', '中度', '强力'].map((level) => (
                  <button
                    key={level}
                    className={`intensity-btn${intensity === level ? ' active' : ''}`}
                    onClick={() => {
                      setIntensity(level)
                      showToast(`已选择「${level}」降重`, 'success')
                    }}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
            <div className="intensity-row" style={{ marginBottom: 0 }}>
              <span className="intensity-label">输出风格</span>
              <span className="output-style-display">本科论文</span>
            </div>
          </>
        )}

        {/* Privacy Notice */}
        <div className="privacy-notice" style={{ marginTop: 0, marginBottom: 0 }}>
          🔒 请勿输入涉密内容，文本仅用于本次处理展示
        </div>

        {/* Main Button */}
        <button
          className={`btn-primary${loading ? ' loading' : ''}`}
          onClick={handleProcess}
          disabled={loading || (!input.trim() && !imagePreview) || input.length > CHAR_LIMIT}
        >
          {loading
            ? '🤖 正在处理中...'
            : currentTab.btnLabel}
        </button>

        {/* Button Hint */}
        {!loading && (
          <div className="btn-hint" style={{ marginTop: 0 }}>预计 10–20 秒生成结果</div>
        )}

        {/* API Key Prompt (inline warning) */}
        {showApiKeyPrompt && (
          <div className="api-key-prompt">
            <p>🔑 需要一个 API Key 才能使用。免费注册诗云，1 分钟搞定！</p>
            <div className="api-key-prompt-buttons">
              <button onClick={() => { setShowApiKeyPrompt(false); openConfig('firstTime') }}>
                🚀 免费配置 Key（1 分钟）
              </button>
              <button onClick={() => { setShowApiKeyPrompt(false); localStorage.setItem(STORAGE_KEY_DEMO, 'true'); setDemoMode(true); showToast('🎪 已切换到 Demo 模式', 'success') }}>
                🎪 体验 Demo 模式
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===== Output Area ===== */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-title" style={{ marginBottom: 10 }}>
          <span>{isReviewTab ? '📋' : '📄'}</span> {isReviewTab ? '检查报告' : '处理结果'}
        </div>

        {loading ? (
          <div className="output-area empty" ref={outputRef}>
            🤖 AI 正在分析，请稍候...
          </div>
        ) : output ? (
          <>
            <div className="output-result" ref={outputRef}>{output}</div>
            {modifyNote && (
              <div className="modify-note">
                <strong>修改说明：</strong>{modifyNote}
              </div>
            )}
            <div className="output-actions">
              <button
                className={`btn-action${copied ? ' copied' : ''}`}
                onClick={handleCopy}
              >
                {copied ? '✅ 已复制' : '📋 复制结果'}
              </button>
              <button
                className="btn-action outline"
                onClick={() => { setInput(output); window.scrollTo({ top: 0, behavior: 'smooth' }); showToast('📋 结果已填回输入框', 'success') }}
              >
                🔄 继续降重
              </button>
              <button
                className="btn-action outline"
                style={{ borderColor: '#8b5cf6', color: '#6d28d9' }}
                onClick={() => {
                  if (!output) return
                  setInput(output)
                  setTab('runshe')
                  showToast('🔄 已切换到润色模式', 'success')
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              >
                🎓 转为更学术
              </button>
            </div>
          </>
        ) : (
          <div className="output-empty" ref={outputRef}>
            <div className="empty-main">
              {isReviewTab ? '检查报告将在这里显示' : '处理结果将在这里显示'}
            </div>
            <div className="empty-sub">
              {isReviewTab
                ? '上传截图或输入内容后点击检查，AI 会生成详细的审查报告'
                : '输入内容后点击处理，AI 将自动优化你的论文表达。'}
            </div>
          </div>
        )}
      </div>

      {/* ===== Usage Bar ===== */}
      <div className="usage-bar">
        <span className="usage-text">
          📅 今日剩余免费次数：<strong>{vip ? '∞' : remaining}</strong> 次
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className="btn-outline"
            style={{ borderColor: '#10b981', color: '#10b981' }}
            onClick={() => { setShowShareModal(true) }}
          >
            🎁 分享得 +3 次
          </button>
          <button className="btn-upgrade" onClick={() => setShowPayment(true)}>
            ⭐ 开通无限次 ¥9.9
          </button>
        </div>
      </div>

      {/* ===== Footer ===== */}
      <div className="footer">
        <p>📖 毕过AI · 专注毕业论文降重、润色与提交前检查</p>
        <p style={{ marginTop: 4, color: '#94a3b8' }}>访客 <span id="busuanzi_value_site_pv"></span> 次 ｜ 已服务 <span id="busuanzi_value_page_pv"></span> 篇论文</p>
      </div>

      {/* ===== Share Modal ===== */}
      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <h3>📤 邀请好友，双方各得 +3 次</h3>
            <p>分享链接给好友，TA 通过你的链接访问后，<strong>你和 TA 各获得 3 次额外免费次数</strong>！</p>

            <div style={{
              background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)',
              borderRadius: 10,
              padding: '14px 16px',
              marginBottom: 16,
              border: '1px solid #bbf7d0',
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#166534', marginBottom: 8 }}>
                ✅ 已邀请 <strong>{getShareCount()}</strong> 人 · 今日额外获得 <strong>{getBonusUses()}</strong> 次
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  className="settings-input"
                  value={shareLink}
                  readOnly
                  style={{ marginBottom: 0, flex: 1, fontSize: 12 }}
                />
                <button
                  className="btn-outline"
                  style={{ borderColor: '#10b981', color: '#10b981', whiteSpace: 'nowrap' }}
                  onClick={() => {
                    navigator.clipboard.writeText(shareLink)
                    setShareCopied(true)
                    setTimeout(() => setShareCopied(false), 2000)
                    addBonusUses(3)
                    incrementShareCount()
                    refreshUsage()
                  }}
                >
                  {shareCopied ? '✅ 已复制' : '📋 复制'}
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>分享至</div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button
                  style={{
                    width: 48, height: 48, borderRadius: 12, border: 'none',
                    background: '#07c160', color: 'white', fontSize: 22, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  onClick={() => {
                    navigator.clipboard.writeText('论文党必备！毕过AI · ' + shareLink)
                    showToast('已复制，粘贴到微信分享', 'success')
                  }}
                  title="微信"
                >💬</button>
                <button
                  style={{
                    width: 48, height: 48, borderRadius: 12, border: 'none',
                    background: '#ff8200', color: 'white', fontSize: 22, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  onClick={() => {
                    navigator.clipboard.writeText('论文党必备！毕过AI · ' + shareLink)
                    showToast('已复制，粘贴到微博分享', 'success')
                  }}
                  title="微博"
                >📢</button>
                <button
                  style={{
                    width: 48, height: 48, borderRadius: 12, border: '1px solid #e2e8f0',
                    color: '#64748b', fontSize: 22, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  onClick={() => {
                    navigator.clipboard.writeText(shareLink)
                    showToast('链接已复制，可分享到任何地方', 'success')
                  }}
                  title="复制链接"
                >🔗</button>
              </div>
            </div>

            <button className="btn-close-modal" onClick={() => setShowShareModal(false)}>
              关闭
            </button>
          </div>
        </div>
      )}

      {/* ===== Payment Modal ===== */}
      {showPayment && (
        <div className="modal-overlay" onClick={() => setShowPayment(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>🚀 ¥9.9 无限使用</h3>
            <p>解锁全部功能，不限次数不限字数！</p>
            <div style={{ fontSize: 13, padding: '10px 14px', borderRadius: 8, marginBottom: 16, lineHeight: 1.6, color: '#64748b' }}>
              ✅ 付款后在下面输入 <strong>6位数字</strong> 即可激活<br />
              ✅ 不付款也可以输入6位数字（算你支持我了 🫶）
            </div>

            <div className="qr-area">
              <p>💳 扫码支付 ¥9.9 自愿支持</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, textAlign: 'center' }}>支付宝</div>
                  <img
                    src={import.meta.env.BASE_URL + 'qr-alipay.png'}
                    alt="支付宝"
                    style={{ width: 140, height: 140, objectFit: 'contain', borderRadius: 8, display: 'block', border: '1px solid #e2e8f0' }}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, textAlign: 'center' }}>微信</div>
                  <img
                    src={import.meta.env.BASE_URL + 'qr-wechat.png'}
                    alt="微信"
                    style={{ width: 140, height: 140, objectFit: 'contain', borderRadius: 8, display: 'block', border: '1px solid #e2e8f0' }}
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <input
                className="verify-input"
                placeholder="输入6位数字激活"
                value={verifyCode}
                onChange={e => setVerifyCode(e.target.value)}
                maxLength={6}
              />
              <button
                className="btn-primary"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}
                onClick={() => {
                  if (verifyCode.trim().length >= 6) {
                    setVip(true)
                    saveVip(365)
                    setVerifyCode('')
                    setShowPayment(false)
                    showToast('🎉 激活成功！现在可以无限使用了', 'success')
                    refreshUsage()
                  } else {
                    showToast('请输入6位数字', 'warning')
                  }
                }}
              >
                🔓 激活
              </button>
            </div>
            <button className="btn-close-modal" onClick={() => setShowPayment(false)}>
              暂不升级
            </button>
          </div>
        </div>
      )}

      {/* ===== Config Modal (first-time & settings) ===== */}
      {showConfig && (
        <div className="modal-overlay" onClick={() => { if (configMode !== 'firstTime') setShowConfig(false) }}>
          <div className="modal config-modal" onClick={e => e.stopPropagation()}>
            <h3>{configMode === 'firstTime' ? '🚀 1 分钟完成配置' : '⚙️ 设置'}</h3>

            {configMode === 'firstTime' && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 14, color: '#475569', marginBottom: 16, lineHeight: 1.6 }}>
                  毕过AI 需要连接 AI 接口来生成结果。请按以下步骤操作：
                </p>
                <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px', marginBottom: 12 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                    <span style={{ width: 24, height: 24, borderRadius: 12, background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>1</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>注册获取免费 Key</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>点击下方按钮，1 分钟注册即送免费额度</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ width: 24, height: 24, borderRadius: 12, background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>2</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>粘贴 Key 并保存</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>将创建的 Key 粘贴到下方输入框</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* API Address */}
            <div className="config-field">
              <label>API 地址</label>
              <input
                className="settings-input"
                value={configApiBase}
                onChange={e => setConfigApiBase(e.target.value)}
                placeholder="https://api.deepseek.com/v1"
                style={{ fontFamily: 'monospace' }}
              />
              {configMode === 'firstTime' ? (
                <div className="config-hint">✅ 已默认填好，无需修改</div>
              ) : (
                <div className="config-hint">默认使用诗云 API 地址，一般无需修改</div>
              )}
            </div>

            {/* API Key */}
            <div className="config-field">
              <label>API Key</label>
              <div className="password-wrapper">
                <input
                  type={configShowPwd ? 'text' : 'password'}
                  value={configApiKey}
                  onChange={e => setConfigApiKey(e.target.value)}
                  placeholder={configMode === 'firstTime' ? '从诗云复制 Key 粘贴到这里' : '粘贴你的诗云 API Key'}
                />
                <button
                  type="button"
                  className="pwd-toggle-btn"
                  onClick={() => setConfigShowPwd(!configShowPwd)}
                >
                  {configShowPwd ? '🙈 隐藏' : '👁️ 显示'}
                </button>
              </div>
            </div>

            {/* DeepSeek Link */}
            <a
              href="https://platform.deepseek.com"
              target="_blank"
              rel="noopener noreferrer"
              className="config-link-btn"
              style={configMode === 'firstTime' ? { padding: '12px 20px', fontSize: 14, fontWeight: 600 } : {}}
            >
              🔑 去诗云免费获取 Key
            </a>

            {/* First-time: Demo fallback */}
            {configMode === 'firstTime' && (
              <div style={{ textAlign: 'center', marginTop: 14 }}>
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: 12,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: '4px 8px',
                  }}
                  onClick={() => {
                    setShowConfig(false)
                    localStorage.setItem(STORAGE_KEY_GUIDE, 'true')
                    localStorage.setItem(STORAGE_KEY_DEMO, 'true')
                    setDemoMode(true)
                    showToast('🎪 已进入体验模式，可先试用 Demo', 'success')
                  }}
                >
                  先不配置，进入体验模式看看效果
                </button>
              </div>
            )}

            {/* Settings-only: Demo mode toggle */}
            {configMode === 'settings' && (
              <div className="config-toggle-row">
                <span className="config-toggle-label">Demo 模式</span>
                <button
                  className={`config-toggle-btn${demoMode ? ' active' : ''}`}
                  onClick={() => {
                    const next = !demoMode
                    setDemoMode(next)
                    localStorage.setItem(STORAGE_KEY_DEMO, String(next))
                    showToast(next ? '🎪 Demo 模式已开启' : 'Demo 模式已关闭', 'success')
                  }}
                >
                  {demoMode ? '✅ 已开启' : '⬜ 已关闭'}
                </button>
              </div>
            )}

            {/* First-time buttons */}
            {configMode === 'firstTime' ? (
              <>
                <button className="btn-primary" onClick={saveConfig}>
                  💾 保存并开始使用
                </button>
                <button
                  className="btn-outline"
                  style={{ width: '100%', marginTop: 8, justifyContent: 'center' }}
                  onClick={enableDemoAndClose}
                >
                  🎪 体验 Demo 模式
                </button>
                <button className="btn-close-modal" onClick={dismissGuide}>
                  稍后再说
                </button>
              </>
            ) : (
              <>
                <button className="btn-primary" onClick={saveConfig}>
                  💾 保存配置
                </button>
                <button className="btn-clear" onClick={clearConfig}>
                  🗑️ 清除配置
                </button>
                <button className="btn-close-modal" onClick={() => setShowConfig(false)}>
                  取消
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ===== Admin Panel (连点5次logo进入) ===== */}
      {showAdmin && (
        <div className="modal-overlay" onClick={() => setShowAdmin(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <h3>🔐 管理员后台</h3>
            <p>配置激活码。有人付款后，给他这个码让他激活。</p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>
                当前激活码
              </label>
              <input
                className="settings-input"
                value={adminCode}
                onChange={e => setAdminCode(e.target.value)}
                placeholder="输入新的激活码"
                style={{ fontFamily: 'monospace', fontSize: 18, textAlign: 'center' }}
              />
              {adminCode && (
                <div style={{ marginTop: 8, padding: '8px 10px', background: '#f0fdf4', borderRadius: 8, fontSize: 12, color: '#166534', wordBreak: 'break-all' }}>
                  <strong>分享链接（发给付款的人）：</strong><br />
                  <span style={{ fontSize: 11, userSelect: 'all' }}>{window.location.origin + window.location.pathname}?vip={adminCode}</span>
                  <button
                    style={{ marginLeft: 8, background: 'none', border: '1px solid #166534', borderRadius: 4, padding: '2px 8px', fontSize: 11, color: '#166534', cursor: 'pointer' }}
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.origin + window.location.pathname + '?vip=' + adminCode)
                      showToast('链接已复制！', 'success')
                    }}
                  >
                    📋 复制
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={() => {
                  const newCode = 'BIGUO-' + Math.random().toString(36).toUpperCase().slice(2, 8)
                  setAdminCode(newCode)
                }}
              >
                🎲 随机生成
              </button>
              <button
                className="btn-primary"
                style={{ flex: 1, background: 'linear-gradient(135deg, var(--success), #059669)' }}
                onClick={() => {
                  if (adminCode.length < 4) { showToast('激活码至少4位', 'warning'); return }
                  setCurrentVipCode(adminCode)
                  setShowAdmin(false)
                  showToast(`激活码已更新: ${adminCode}`, 'success')
                }}
              >
                💾 保存
              </button>
            </div>

            <div style={{ marginTop: 16, padding: '10px 14px', background: '#fef3c7', borderRadius: 8, fontSize: 12, color: '#92400e', lineHeight: 1.5 }}>
              <strong>⚠️ 每次有人激活后请更换新码</strong><br />
              操作：点「随机生成」→「保存」→ 把新码发给付款的人
            </div>

            <button className="btn-close-modal" onClick={() => setShowAdmin(false)}>
              关闭
            </button>
          </div>
        </div>
      )}
    </>
  )
}
