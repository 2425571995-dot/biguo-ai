import { useState, useCallback } from 'react'
import { analyzeResume, buildResumePolishPrompt, detectJobCategory, type ATSReport } from './atsEngine'
import { track } from './analytics'
import { isCodeValid, issueMemberCode, getIssuedMemberCodes, normalizeCode } from './vip'
import { buildShareCard, downloadBlob } from './shareCard'

// ====== Config ======
// 从 localStorage 读取用户配置的 API（与论文助手共享配置）
function getApiBase(): string {
  return localStorage.getItem('deepseek_api_base_url') || 'https://api.deepseek.com/v1'
}
function getApiKey(): string {
  return localStorage.getItem('deepseek_api_key') || ''
}
const MODEL = 'deepseek-chat'
const STORAGE_KEY_RESUME_VIP = 'resumechecker_vip'

// 检测全免费不限次；会员只影响「AI 按 JD 改写」
// ¥6.9 解锁 = 30 天会员
const VIP_DAYS = 30

// TODO(用户): 填入闲鱼人工精修商品链接
// 人工简历精修服务下单链接（留空则弹窗引导去闲鱼搜索"毕过AI"）
const SERVICE_URL = ''
const SERVICE_PRICE_TEXT = '¥49 起'

function isVip(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RESUME_VIP)
    if (!raw) return false
    return JSON.parse(raw).expires > Date.now()
  } catch { return false }
}


// ====== Score Ring Component ======
function ScoreRing({ score, size = 140 }: { score: number; size?: number }) {
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const color = score >= 85 ? '#16a34a' : score >= 70 ? '#f59e0b' : score >= 50 ? '#f97316' : '#ef4444'
  const bgColor = '#e5e7eb'

  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={bgColor} strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={`${progress} ${circumference - progress}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', top: 0, left: 0, width: size, height: size,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: size * 0.28, fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: size * 0.09, color: '#64748b', marginTop: 2 }}>ATS 评分 / 100</span>
      </div>
    </div>
  )
}

// ====== Job Category Selector ======
const JOB_CATEGORIES = [
  { value: '', label: '🤖 自动识别' },
  { value: 'mechanical-engineering', label: '⚙️ 机械/制造（工科）' },
  { value: 'mechatronics-automation', label: '🔌 机电/自动化（工科）' },
  { value: 'product-manager', label: '📱 产品经理' },
  { value: 'java-dev', label: '☕ Java开发' },
  { value: 'frontend', label: '🎨 前端开发' },
  { value: 'data-analyst', label: '📊 数据分析' },
  { value: 'operations', label: '📈 运营' },
  { value: 'hr', label: '👥 人力资源' },
  { value: 'marketing', label: '📣 市场/品牌' },
  { value: 'finance', label: '💰 财务' },
]

// ====== Main Component ======
export default function ResumeChecker() {
  const [resumeText, setResumeText] = useState('')
  const [jdText, setJdText] = useState('')
  const [jobCategory, setJobCategory] = useState('')
  const [report, setReport] = useState<ATSReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [polishedResult, setPolishedResult] = useState('')
  const [polishedLoading, setPolishedLoading] = useState(false)
  const [copied, setCopied] = useState('')
  const [showPayment, setShowPayment] = useState(false)
  const [showService, setShowService] = useState(false)
  const [verifyCode, setVerifyCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [vip, setVip] = useState(isVip())
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['keywords', 'format']))

  const toggleSection = (s: string) => {
    const next = new Set(expandedSections)
    if (next.has(s)) next.delete(s); else next.add(s)
    setExpandedSections(next)
  }

  // 检测全免费：全部关键词缺口、格式明细、优化建议、逐句对照一律可见、不限次。
  // 引擎纯本地零成本，锁住只会挡住用户看到价值 —— 付费点只在「AI 改写」。
  const missingItems = report
    ? [
        ...report.missingCore.map(k => ({ k, core: true })),
        ...report.missingSecondary.map(k => ({ k, core: false })),
      ]
    : []

  // 打开付费弹窗（统一入口，带埋点）
  const openPay = useCallback((from: string) => {
    track('resume_unlock_click', { from })
    track('resume_pay_modal', { from })
    setShowPayment(true)
  }, [])

  // 生成体检报告分享图（裂变：用户发群 = 免费获客）
  const handleShareCard = useCallback(async () => {
    if (!report) return
    setSharing(true)
    try {
      const blob = await buildShareCard({
        score: report.totalScore,
        level: report.level,
        jobCategory: JOB_CATEGORIES.find(c => c.value === jobCategory)?.label,
        matched: report.jdKeywords.length - (report.missingCore.length + report.missingSecondary.length),
        missing: report.missingCore.length + report.missingSecondary.length,
      })
      downloadBlob(blob, `简历体检报告-${report.totalScore}分.png`)
      track('resume_share_card', { score: report.totalScore })
    } catch {
      // 生成失败不阻断主流程
      track('resume_share_card_error')
    } finally {
      setSharing(false)
    }
  }, [report, jobCategory])

  // 分析简历（引擎纯本地零成本，不设次数限制）
  const handleAnalyze = useCallback(() => {
    if (!resumeText.trim() || !jdText.trim()) return

    setLoading(true)
    setReport(null)
    setPolishedResult('')

    // 用 setTimeout 把计算放到下一帧，避免 UI 卡顿
    setTimeout(() => {
      const cat = jobCategory || detectJobCategory(jdText)
      const result = analyzeResume(resumeText, jdText, cat)
      setReport(result)
      setLoading(false)
      track('resume_analyze', { category: cat || 'auto', score: result.totalScore })
    }, 100)
  }, [resumeText, jdText, jobCategory])

  // AI 润色简历
  const handlePolish = useCallback(async () => {
    if (!report || report.missingCore.length === 0) return
    if (!vip) {
      openPay('ai_polish')
      return
    }

    setPolishedLoading(true)
    const apiKey = getApiKey()
    const apiBase = getApiBase()
    const prompt = buildResumePolishPrompt(resumeText, report.jdKeywords.map(k => k.keyword), report.missingCore)

    if (!apiKey) {
      setPolishedResult('⚠️ 请先在「论文助手」页面点击 ⚙️ API 设置，填入你的 DeepSeek API Key。\n\n免费获取：platform.deepseek.com → 注册 → API Keys → 复制粘贴')
      setPolishedLoading(false)
      return
    }

    try {
      const res = await fetch(`${apiBase}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model: MODEL, messages: [{ role: 'user', content: prompt }], max_tokens: 2048, temperature: 0.4 }),
      })
      if (!res.ok) throw new Error(`API错误 ${res.status}`)
      const data = await res.json()
      setPolishedResult(data.choices?.[0]?.message?.content || '优化失败，请重试')
    } catch {
      setPolishedResult('AI 优化服务暂时不可用，请稍后重试。\n\n以下为规则引擎给出的建议：\n' + report.atsTips.join('\n'))
    } finally {
      setPolishedLoading(false)
    }
  }, [report, resumeText, vip, openPay])

  // VIP 验证（真校验：源码只存激活码哈希，输任意数字不再放行）
  const handleVerify = () => {
    const code = verifyCode.trim()
    if (code.length < 8) {
      const el = document.createElement('div')
      el.textContent = '激活码格式不对，请检查是否复制完整'
      el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#1e293b;color:#fff;padding:12px 24px;border-radius:24px;font-size:14px;z-index:9999;pointer-events:none;'
      document.body.appendChild(el)
      setTimeout(() => el.remove(), 2000)
      return
    }

    setVerifying(true)
    void (async () => {
      const okCode = await isCodeValid(code)
      setVerifying(false)

      // 会员码恢复：仅接受本机此前由有效激活码签发过的会员码
      const isIssuedMemberCode = code.startsWith('BG') && getIssuedMemberCodes().includes(code.toUpperCase())
      if (!okCode && !isIssuedMemberCode) {
        track('resume_verify_fail')
        const el = document.createElement('div')
        el.textContent = '激活码无效，请确认后重试或联系卖家'
        el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#1e293b;color:#fff;padding:12px 24px;border-radius:24px;font-size:14px;z-index:9999;pointer-events:none;'
        document.body.appendChild(el)
        setTimeout(() => el.remove(), 2200)
        return
      }

      if (isIssuedMemberCode) {
        localStorage.setItem(STORAGE_KEY_RESUME_VIP, JSON.stringify({
          expires: Date.now() + VIP_DAYS * 86400000,
          memberCode: code,
        }))
        setVip(true)
        setVerifyCode('')
        setShowPayment(false)
        track('resume_verify_ok', { mode: 'member_code_restore' })
        const el2 = document.createElement('div')
        el2.innerHTML = `<div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:10000;display:flex;align-items:center;justify-content:center;">
          <div style="background:#fff;border-radius:16px;padding:24px;max-width:340px;text-align:center;margin:16px;">
            <div style="font-size:40px;margin-bottom:8px;">🎉</div>
            <div style="font-size:16px;font-weight:700;margin-bottom:4px;">会员已恢复！</div>
            <div style="font-size:13px;color:#64748b;margin-bottom:12px;">有效期至 ${new Date(Date.now() + VIP_DAYS * 86400000).toLocaleDateString()}</div>
            <button data-close style="width:100%;padding:12px;background:#2563eb;color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;">开始使用</button>
          </div>
        </div>`
        el2.querySelector('[data-close]')?.addEventListener('click', () => el2.remove())
        document.body.appendChild(el2)
        return
      }

      // 用有效激活码解锁：签发一个会员码，便于本机后续恢复
      const memberCode = 'BG' + simpleHash(normalizeCode(code)).toUpperCase().slice(0, 10)
      issueMemberCode(memberCode)
      const expires = Date.now() + VIP_DAYS * 86400000

      localStorage.setItem(STORAGE_KEY_RESUME_VIP, JSON.stringify({ expires, memberCode }))
      setVip(true)
      setVerifyCode('')
      setShowPayment(false)
      track('resume_verify_ok', { mode: 'new_unlock', days: VIP_DAYS })

      // 弹窗提示保存会员码
      const el = document.createElement('div')
      el.innerHTML = `<div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:10000;display:flex;align-items:center;justify-content:center;">
        <div style="background:#fff;border-radius:16px;padding:24px;max-width:340px;text-align:center;margin:16px;">
          <div style="font-size:40px;margin-bottom:8px;">🔑</div>
          <div style="font-size:16px;font-weight:700;margin-bottom:8px;">已解锁 · 请保存会员码</div>
          <div style="font-size:22px;font-weight:800;letter-spacing:2px;color:#2563eb;background:#eff6ff;padding:12px;border-radius:12px;margin-bottom:8px;font-family:monospace;" id="memberCodeDisplay">${memberCode}</div>
          <div style="font-size:12px;color:#64748b;margin-bottom:16px;line-height:1.5;">换设备/清缓存后，在解锁框里输入此会员码即可恢复。建议截图保存！</div>
          <button data-close style="width:100%;padding:12px;background:#2563eb;color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;">✅ 已截图保存</button>
        </div>
      </div>`
      el.querySelector('[data-close]')?.addEventListener('click', () => el.remove())
      document.body.appendChild(el)
    })()
  }

  // 简单哈希函数
  function simpleHash(s: string): string {
    let h = 0
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) - h) + s.charCodeAt(i)
      h |= 0
    }
    return Math.abs(h).toString(36)
  }

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(label)
      setTimeout(() => setCopied(''), 2000)
    } catch { /* ignore */ }
  }

  // ====== Render ======
  return (
    <div className="resume-checker" style={{ maxWidth: 740, margin: '0 auto', padding: '0 12px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <a href="#paper" style={{
            fontSize: 12, color: '#64748b', textDecoration: 'none',
            padding: '4px 10px', borderRadius: 14, background: '#f1f5f9',
          }}>
            ← 论文助手
          </a>
          <span style={{
            fontSize: 11, padding: '4px 10px', borderRadius: 14,
            background: '#eff6ff', color: '#2563eb', fontWeight: 600,
          }}>⚙️ 工科生专属引擎</span>
          <span style={{
            fontSize: 11, padding: '4px 10px', borderRadius: 14,
            background: '#f0fdf4', color: '#16a34a', fontWeight: 500,
          }}>🟢 Beta</span>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#1e293b' }}>
          📋 ATS 简历体检
        </h2>
        <p style={{ fontSize: 13, color: '#64748b', margin: '6px 0 0' }}>
          粘贴你的简历 + 目标岗位JD，秒查匹配度 · 找出关键词缺口 · 提升过筛率
        </p>
        <div style={{
          marginTop: 10, padding: '6px 14px', borderRadius: 20, background: '#fef3c7',
          display: 'inline-block', fontSize: 12, color: '#92400e',
        }}>
          {vip ? '👑 会员 · AI 改写无限次' : '🔍 检测与诊断全免费 · 不限次'}
        </div>
      </div>

      {/* Input: Resume */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-title">📝 粘贴你的简历</div>
        <textarea
          className="text-input"
          placeholder={`在此粘贴你的完整简历内容...

💡 提示：
· 复制简历文本后粘贴（不要上传图片或PDF）
· 包含所有模块：个人信息、教育背景、实习/工作经历、技能
· 如果简历是PDF，请先用文字工具提取文本`}
          value={resumeText}
          onChange={e => setResumeText(e.target.value)}
          disabled={loading}
          style={{ minHeight: 150, fontSize: 13 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11.5, color: '#16a34a', lineHeight: 1.5 }}>
            🔒 简历只在本机浏览器里跑分析，不上传、不存储，刷新即清空
          </span>
          <span className="char-count" style={{ margin: 0 }}>{resumeText.length} 字符</span>
        </div>
      </div>

      {/* Input: JD + Category */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">🎯 目标岗位JD</div>
        <textarea
          className="text-input"
          placeholder={`在此粘贴你投递的岗位描述（JD）...

复制BOSS直聘/拉勾/猎聘上的"职位描述"和"任职要求"即可`}
          value={jdText}
          onChange={e => setJdText(e.target.value)}
          disabled={loading}
          style={{ minHeight: 120, fontSize: 13 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <select
            value={jobCategory}
            onChange={e => setJobCategory(e.target.value)}
            style={{
              padding: '6px 10px', borderRadius: 6, border: '1px solid #e2e8f0',
              fontSize: 12, background: '#fff', color: '#334155',
            }}
          >
            {JOB_CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <div className="char-count">{jdText.length} 字符</div>
        </div>
      </div>

      {/* Analyze Button */}
      <button
        className="btn-primary"
        style={{ width: '100%', padding: '14px', fontSize: 16 }}
        onClick={handleAnalyze}
        disabled={loading || !resumeText.trim() || !jdText.trim()}
      >
        {loading ? '🔍 分析中...' : '🔍 开始 ATS 检测（免费·不限次）'}
      </button>

      {/* ====== Report ====== */}
      {report && (
        <div style={{ marginTop: 20 }}>
          {/* Score Card */}
          <div className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
            <ScoreRing score={report.totalScore} />
            <div style={{ marginTop: 12 }}>
              <span style={{
                fontSize: 16, fontWeight: 700,
                color: report.level === 'excellent' ? '#16a34a' : report.level === 'good' ? '#f59e0b' : report.level === 'moderate' ? '#f97316' : '#ef4444',
              }}>
                {report.level === 'excellent' ? '🌟 优秀 — 直接投！' : report.level === 'good' ? '👍 良好 — 小幅优化即可' : report.level === 'moderate' ? '⚠️ 中等 — 建议先优化再投' : '🔴 较弱 — 需要大幅改进'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 16, fontSize: 12, color: '#64748b' }}>
              <div>关键词匹配 <strong style={{ color: '#1e293b' }}>{report.keywordScore}</strong></div>
              <div>格式 <strong style={{ color: '#1e293b' }}>{report.formatScore}</strong></div>
              <div>结构 <strong style={{ color: '#1e293b' }}>{report.structureScore}</strong></div>
            </div>
            <button
              className="btn-outline"
              style={{ marginTop: 16, width: '100%', padding: '10px', justifyContent: 'center' }}
              onClick={handleShareCard}
              disabled={sharing}
            >
              {sharing ? '生成中…' : '📤 生成体检报告图（发求职群）'}
            </button>
          </div>

          {/* Keyword Section */}
          <div className="card" style={{ marginTop: 12 }}>
            <div className="card-title" onClick={() => toggleSection('keywords')} style={{ cursor: 'pointer' }}>
              {expandedSections.has('keywords') ? '▼' : '▶'} 🔑 关键词匹配度：{report.keywordScore}/100
            </div>
            {expandedSections.has('keywords') && (
              <div style={{ marginTop: 8 }}>
                {/* Matched / Missing Summary */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 12, fontSize: 13 }}>
                  <div style={{ flex: 1, padding: '10px 12px', background: '#f0fdf4', borderRadius: 8 }}>
                    <div style={{ fontWeight: 600, color: '#16a34a' }}>✅ 已匹配 {report.jdKeywords.filter(k => report.matches.find(m => m.keyword === k.keyword)?.matched).length}</div>
                    <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>核心关键词命中</div>
                  </div>
                  <div style={{ flex: 1, padding: '10px 12px', background: '#fef2f2', borderRadius: 8 }}>
                    <div style={{ fontWeight: 600, color: '#ef4444' }}>⚠️ 缺失 {report.missingCore.length + report.missingSecondary.length}</div>
                    <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>{report.missingCore.length}个核心 + {report.missingSecondary.length}个次要</div>
                  </div>
                </div>

                {/* 关键词缺口：全部免费可见（含核心与次要） */}
                {missingItems.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#ef4444', marginBottom: 6 }}>
                      ❌ 缺失关键词（按重要性排序）
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {missingItems.map(({ k, core }) => (
                        <span key={k} style={{
                          padding: '4px 10px',
                          background: core ? '#fef2f2' : '#fffbeb',
                          color: core ? '#ef4444' : '#92400e',
                          borderRadius: 16, fontSize: 12,
                          border: `1px solid ${core ? '#fecaca' : '#fde68a'}`,
                        }}>{k}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Density Warnings */}
                {report.densityWarnings.length > 0 && (
                  <div style={{ marginBottom: 12, padding: '10px 12px', background: '#fff7ed', borderRadius: 8 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#ea580c', marginBottom: 4 }}>🔊 密度警告</div>
                    {report.densityWarnings.map((w, i) => (
                      <div key={i} style={{ fontSize: 12, color: '#9a3412', marginTop: 2 }}>{w}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Format Section（分数免费，明细锁定） */}
          <div className="card" style={{ marginTop: 12 }}>
            <div className="card-title" onClick={() => toggleSection('format')} style={{ cursor: 'pointer' }}>
              {expandedSections.has('format') ? '▼' : '▶'} 📐 格式检查：{report.formatScore}/100
            </div>
            {expandedSections.has('format') && (
              <div style={{ marginTop: 8 }}>
                <div>
                  <div>
                    {report.formatIssues.map((issue, i) => (
                      <div key={i} style={{
                        padding: '8px 12px', marginBottom: 6, borderRadius: 8,
                        background: issue.type === 'error' ? '#fef2f2' : issue.type === 'warning' ? '#fffbeb' : '#f0fdf4',
                        fontSize: 12, lineHeight: 1.5,
                      }}>
                        <span style={{
                          color: issue.type === 'error' ? '#ef4444' : issue.type === 'warning' ? '#f59e0b' : '#16a34a',
                          fontWeight: 600,
                        }}>
                          {issue.type === 'error' ? '❌ ' : issue.type === 'warning' ? '⚠️ ' : '✅ '}
                          {issue.item}：
                        </span>
                        {issue.detail}
                      </div>
                    ))}

                    {/* Structure Issues */}
                    {report.structureIssues.map((s, i) => (
                      <div key={i} style={{
                        padding: '8px 12px', marginBottom: 6, borderRadius: 8,
                        background: '#fffbeb', fontSize: 12, lineHeight: 1.5,
                      }}>
                        <span style={{ color: '#f59e0b', fontWeight: 600 }}>⚠️ </span>{s}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ATS Tips（全免费可见） */}
          <div className="card" style={{ marginTop: 12 }}>
            <div className="card-title">💡 ATS 优化建议</div>
            <div style={{ marginTop: 8 }}>
              <div>
                {report.atsTips.map((tip, i) => (
                  <div key={i} style={{ padding: '6px 0', fontSize: 13, color: '#334155', borderBottom: '1px solid #f1f5f9' }}>
                    {i + 1}. {tip}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Improvements（全免费可见） */}
          {report.improvedSections.length > 0 && (
            <div className="card" style={{ marginTop: 12 }}>
              <div className="card-title">✏️ 针对性修改建议</div>
              <div style={{ marginTop: 8 }}>
                <div>
                  <div>
                    {report.improvedSections.map((imp, i) => (
                      <div key={i} style={{
                        padding: '10px 12px', marginBottom: 8, background: '#f8fafc', borderRadius: 8,
                        border: '1px solid #e2e8f0', fontSize: 12, lineHeight: 1.6,
                      }}>
                        <div style={{ color: '#64748b', marginBottom: 4 }}>
                          <strong>原文：</strong><span style={{ textDecoration: 'line-through' }}>{imp.original}</span>
                        </div>
                        <div style={{ color: '#16a34a', marginBottom: 4 }}>
                          <strong>改为：</strong>{imp.improved}
                        </div>
                        <div style={{ color: '#64748b', fontSize: 11 }}>
                          📌 {imp.reason}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI 一键改写：唯一付费点（走用户自己的 Key，平台零成本） */}
          <div style={{ marginTop: 12 }}>
            <button
              className="btn-primary"
              style={{ width: '100%', padding: '12px', background: polishedResult ? '#16a34a' : 'linear-gradient(135deg, #2563eb, #7c3aed)' }}
              onClick={vip ? handlePolish : () => openPay('ai_polish')}
              disabled={polishedLoading || report.missingCore.length === 0}
            >
              {polishedLoading ? '🤖 AI 改写中...'
                : polishedResult ? '✅ 改写完成 · 点击重新生成'
                : vip ? '✨ AI 一键按 JD 改写经历'
                : '✨ AI 一键按 JD 改写经历（会员）'}
            </button>
            {!vip && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#64748b', textAlign: 'center', lineHeight: 1.6 }}>
                检测与全部诊断<strong>永久免费不限次</strong>；
                <br />AI 改写会用你自己的 API Key 把缺失关键词自然融进经历描述。
              </div>
            )}
          </div>

          {polishedResult && (
            <div className="card" style={{ marginTop: 12 }}>
              <div className="card-title">
                📄 AI 优化结果
                <button className="btn-outline" style={{ float: 'right', padding: '4px 10px', fontSize: 11 }}
                  onClick={() => handleCopy(polishedResult, 'polish')}>
                  {copied === 'polish' ? '✅ 已复制' : '📋 复制'}
                </button>
              </div>
              <pre style={{
                whiteSpace: 'pre-wrap', fontSize: 12, lineHeight: 1.6, color: '#334155',
                background: '#f8fafc', padding: 12, borderRadius: 8, marginTop: 8,
                fontFamily: 'inherit',
              }}>{polishedResult}</pre>
            </div>
          )}

          {/* 人工精修服务 CTA */}
          <div style={{
            marginTop: 16, padding: '16px',
            background: 'linear-gradient(135deg, #eff6ff, #f0f9ff)',
            borderRadius: 12, border: '1px solid #bfdbfe',
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1e40af', marginBottom: 4 }}>
              ✍️ 想更高过筛率？人工精修简历
            </div>
            <div style={{ fontSize: 12, color: '#475569', marginBottom: 12, lineHeight: 1.6 }}>
              AI 报告免费，人工精修 {SERVICE_PRICE_TEXT}（改到能过筛为止）。工具只查关键词缺口，工科简历的"行话包装 + 量化成果"得人来做。
            </div>
            {SERVICE_URL ? (
              <a href={SERVICE_URL} target="_blank" rel="noopener noreferrer"
                className="btn-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none',
                  background: 'linear-gradient(135deg, #2563eb, #7c3aed)', fontSize: 15 }}>
                🛒 去闲鱼下单 · 人工精修 {SERVICE_PRICE_TEXT}
              </a>
            ) : (
              <button className="btn-primary"
                style={{ width: '100%', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', fontSize: 15 }}
                onClick={() => { track('resume_service_click'); setShowService(true) }}>
                🛒 查看人工精修服务 · {SERVICE_PRICE_TEXT}
              </button>
            )}
          </div>

          {/* 复制文字版报告（免费） */}
          <button
            className="btn-outline"
            style={{ width: '100%', marginTop: 12, padding: '10px' }}
            onClick={() => handleCopy(
              `【ATS简历检测报告】\n总分: ${report.totalScore}/100 | 等级: ${report.level}\n关键词匹配: ${report.keywordScore}/100\n格式: ${report.formatScore}/100\n结构: ${report.structureScore}/100\n\n缺失关键词: ${[...report.missingCore, ...report.missingSecondary].join('、')}\n\n优化建议:\n${report.atsTips.join('\n')}\n\n—— 由 biguoai.top 简历体检生成`,
              'report'
            )}
          >
            {copied === 'report' ? '✅ 已复制报告' : '📋 复制文字版报告'}
          </button>
        </div>
      )}

      {/* ====== 会员弹窗（¥6.9 / 30 天，只解锁 AI 改写） ====== */}
      {showPayment && (
        <div className="modal-overlay" onClick={() => setShowPayment(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
            <h3 style={{ textAlign: 'center' }}>✨ 解锁 AI 一键改写</h3>
            <p style={{ fontSize: 13, color: '#64748b', textAlign: 'center' }}>
              检测和全部诊断本来就免费；会员解锁「按 JD 改写经历」
            </p>

            <div style={{ textAlign: 'center', fontSize: 13, color: '#64748b', marginBottom: 8 }}>
              💡 <strong style={{ color: '#2563eb' }}>¥6.9</strong> · 30 天不限次改写
            </div>

            <div className="qr-area" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 13, fontWeight: 600 }}>
                💳 扫码付款 · ¥6.9 解锁 30 天
              </p>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 10, flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <img src="/qr-alipay.png" alt="支付宝付款" style={{
                    width: 200, height: 200, borderRadius: 12, border: '2px solid #e2e8f0', objectFit: 'contain',
                    background: '#fff',
                  }} />
                  <div style={{ fontSize: 12, color: '#334155', marginTop: 6, fontWeight: 500 }}>支付宝扫码</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <img src="/qr-wechat.png" alt="微信付款" style={{
                    width: 200, height: 200, borderRadius: 12, border: '2px solid #e2e8f0', objectFit: 'contain',
                    background: '#fff',
                  }} />
                  <div style={{ fontSize: 12, color: '#334155', marginTop: 6, fontWeight: 500 }}>微信扫码</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 10 }}>付款后把激活码发你，粘贴到下方即可解锁</div>
            </div>

            <input
              className="verify-input"
              placeholder="输入激活码（付款后由卖家提供）"
              value={verifyCode}
              onChange={e => setVerifyCode(e.target.value)}
              maxLength={20}
              style={{ marginTop: 10, fontSize: 15, textAlign: 'center', letterSpacing: 2 }}
            />
            <button
              className="btn-primary"
              style={{ width: '100%', marginTop: 10, background: 'linear-gradient(135deg, #2563eb, #7c3aed)', padding: '14px', fontSize: 16 }}
              onClick={handleVerify}
              disabled={verifying}
            >
              {verifying ? '校验中…' : '✨ 解锁 AI 改写'}
            </button>
            <button className="btn-close-modal" onClick={() => setShowPayment(false)} style={{ marginTop: 8 }}>
              稍后再说
            </button>
          </div>
        </div>
      )}

      {/* ====== 人工精修弹窗（¥49 起，独立于 VIP） ====== */}
      {showService && (
        <div className="modal-overlay" onClick={() => setShowService(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
            <h3 style={{ textAlign: 'center' }}>✍️ 人工简历精修服务</h3>
            <p style={{ fontSize: 13, color: '#64748b', textAlign: 'center' }}>
              工科简历专属 · 关键词包装 + 量化成果 · 交付改后简历
            </p>

            <div style={{ textAlign: 'center', fontSize: 13, color: '#64748b', margin: '12px 0' }}>
              💡 价格：<strong style={{ color: '#2563eb' }}>{SERVICE_PRICE_TEXT}</strong>（按简历复杂度，改到能过筛为止）
            </div>

            <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 10, fontSize: 13, color: '#475569', lineHeight: 1.8 }}>
              📮 下单方式：<strong>闲鱼搜索「毕过AI」</strong><br />
              拍下后发我简历 + 目标岗位JD，交稿当天出诊断。
            </div>

            <button className="btn-close-modal" onClick={() => setShowService(false)} style={{ marginTop: 12 }}>
              知道了
            </button>
          </div>
        </div>
      )}

      {/* FAQ */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-title">❓ 常见问题</div>
        <div style={{ marginTop: 10, fontSize: 13, color: '#334155', lineHeight: 1.75 }}>
          {[
            ['会保存我的简历吗？', '不会。检测引擎完全在你浏览器本地运行，简历和 JD 都不上传服务器、不落库，关闭或刷新页面即清空。只有你自己点了「AI 改写」时，才会把内容发给你自己配置的 API。'],
            ['检测收费吗？', '检测和全部诊断（评分、缺失关键词、格式明细、逐句对照、优化建议）永久免费，不限次数。只有「AI 按 JD 改写经历」需要会员。'],
            ['检测结果准吗？', '关键词匹配用的是本地规则引擎，会同时识别完整词和近似表达。它反映的是「机器看不看得到你」，不等于面试结果——经历本身才是决定性的。'],
            ['和招聘平台自带的免费诊断有什么区别？', '平台给你一个分数就结束了。这里会列出具体缺哪几个词、每个词该补在哪儿，并且能一键把缺失关键词自然融进你的经历描述（改写只允许用你原文已有的事实，不会替你编数据）。'],
          ].map(([q, a]) => (
            <details key={q} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 8, marginBottom: 8 }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{q}</summary>
              <div style={{ marginTop: 6, color: '#64748b', fontSize: 12.5 }}>{a}</div>
            </details>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="footer" style={{ marginTop: 30 }}>
        <p>📋 ATS简历体检 · 毕过AI出品 | 你的简历能过机器筛选吗？</p>
        <p style={{ marginTop: 6, fontSize: 11, color: '#94a3b8', lineHeight: 1.6 }}>
          本工具不提供代写服务，不承诺任何面试或录用结果；简历内容真实性由用户本人负责。
        </p>
      </div>
    </div>
  )
}
