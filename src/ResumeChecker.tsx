import { useState, useCallback } from 'react'
import { analyzeResume, buildResumePolishPrompt, detectJobCategory, type ATSReport } from './atsEngine'

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
const STORAGE_KEY_RESUME_USAGE = 'resumechecker_usage'

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function isVip(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RESUME_VIP)
    if (!raw) return false
    return JSON.parse(raw).expires > Date.now()
  } catch { return false }
}

function getDailyUsage(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RESUME_USAGE)
    if (!raw) return 0
    const data = JSON.parse(raw)
    return data.date === getTodayStr() ? data.count : 0
  } catch { return 0 }
}

function incrementUsage() {
  const data = { date: getTodayStr(), count: getDailyUsage() + 1 }
  localStorage.setItem(STORAGE_KEY_RESUME_USAGE, JSON.stringify(data))
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
  const [verifyCode, setVerifyCode] = useState('')
  const [vip, setVip] = useState(isVip())
  const [selectedPlan, setSelectedPlan] = useState<365 | 30>(365) // 默认选中永久卡
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['keywords', 'format']))

  const dailyUsed = getDailyUsage()
  const dailyLimit = 1
  const remaining = Math.max(0, dailyLimit - dailyUsed)

  const toggleSection = (s: string) => {
    const next = new Set(expandedSections)
    if (next.has(s)) next.delete(s); else next.add(s)
    setExpandedSections(next)
  }

  // 免费版能看到的内容
  const isFreeReport = !vip && report !== null && dailyUsed >= dailyLimit

  // 分析简历
  const handleAnalyze = useCallback(() => {
    if (!resumeText.trim() || !jdText.trim()) return
    if (!vip && dailyUsed >= dailyLimit) {
      setShowPayment(true)
      return
    }

    setLoading(true)
    setReport(null)
    setPolishedResult('')

    // 用 setTimeout 把计算放到下一帧，避免 UI 卡顿
    setTimeout(() => {
      const cat = jobCategory || detectJobCategory(jdText)
      const result = analyzeResume(resumeText, jdText, cat)
      setReport(result)
      setLoading(false)
      if (!vip) incrementUsage()
    }, 100)
  }, [resumeText, jdText, jobCategory, vip, dailyUsed])

  // AI 润色简历
  const handlePolish = useCallback(async () => {
    if (!report || report.missingCore.length === 0) return
    if (!vip) {
      setShowPayment(true)
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
    } catch (err: any) {
      setPolishedResult('AI 优化服务暂时不可用，请稍后重试。\n\n以下为规则引擎给出的建议：\n' + report.atsTips.join('\n'))
    } finally {
      setPolishedLoading(false)
    }
  }, [report, resumeText, vip])

  // VIP 验证
  const handleVerify = () => {
    if (verifyCode.trim().length < 4) {
      // 轻提示
      const el = document.createElement('div')
      el.textContent = '请先输入交易单号后6位'
      el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#1e293b;color:#fff;padding:12px 24px;border-radius:24px;font-size:14px;z-index:9999;pointer-events:none;'
      document.body.appendChild(el)
      setTimeout(() => el.remove(), 2000)
      return
    }
    localStorage.setItem(STORAGE_KEY_RESUME_VIP, JSON.stringify({ expires: Date.now() + selectedPlan * 86400000 }))
    setVip(true)
    setVerifyCode('')
    setShowPayment(false)
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
          <a href="#" style={{
            fontSize: 12, color: '#64748b', textDecoration: 'none',
            padding: '4px 10px', borderRadius: 14, background: '#f1f5f9',
          }}>
            ← 论文助手
          </a>
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
          {vip ? '👑 会员 · 无限使用' : `🎁 每日免费 ${remaining}/${dailyLimit} 次 · 完整报告 ¥6.9`}
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
        <div className="char-count">{resumeText.length} 字符</div>
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
        {loading ? '🔍 AI 分析中...' : '🔍 开始 ATS 检测（免费）'}
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

                {/* Missing Core Keywords */}
                {report.missingCore.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#ef4444', marginBottom: 6 }}>
                      ❌ 缺失核心关键词（必须补充）
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {report.missingCore.map(k => (
                        <span key={k} style={{
                          padding: '4px 10px', background: '#fef2f2', color: '#ef4444',
                          borderRadius: 16, fontSize: 12, border: '1px solid #fecaca',
                        }}>{k}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing Secondary Keywords (free: show first 2; vip: all) */}
                {report.missingSecondary.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#f59e0b', marginBottom: 6 }}>
                      ⚡ 缺失次要关键词
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {(isFreeReport ? report.missingSecondary.slice(0, 2) : report.missingSecondary).map(k => (
                        <span key={k} style={{
                          padding: '4px 10px', background: '#fffbeb', color: '#92400e',
                          borderRadius: 16, fontSize: 12, border: '1px solid #fde68a',
                        }}>{k}</span>
                      ))}
                      {isFreeReport && report.missingSecondary.length > 2 && (
                        <span style={{
                          padding: '4px 10px', background: '#f1f5f9', color: '#64748b',
                          borderRadius: 16, fontSize: 12, cursor: 'pointer',
                        }} onClick={() => setShowPayment(true)}>
                          +{report.missingSecondary.length - 2} 个 · 付费查看 →
                        </span>
                      )}
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

                {isFreeReport && (
                  <div style={{
                    textAlign: 'center', padding: '12px', background: 'linear-gradient(135deg, #eff6ff, #f0f9ff)',
                    borderRadius: 8, cursor: 'pointer', marginTop: 8,
                  }} onClick={() => setShowPayment(true)}>
                    <span style={{ fontWeight: 600, color: '#2563eb', fontSize: 13 }}>
                      🔓 解锁完整报告（¥6.9） — 查看全部关键词 + 格式检查 + AI改写
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Format Section (VIP + Free show basic) */}
          <div className="card" style={{ marginTop: 12 }}>
            <div className="card-title" onClick={() => toggleSection('format')} style={{ cursor: 'pointer' }}>
              {expandedSections.has('format') ? '▼' : '▶'} 📐 格式检查：{report.formatScore}/100
            </div>
            {expandedSections.has('format') && (
              <div style={{ marginTop: 8 }}>
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

                {isFreeReport && report.formatIssues.filter(i => i.type !== 'ok').length > 1 && (
                  <div style={{
                    textAlign: 'center', padding: '10px', background: '#eff6ff',
                    borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#2563eb',
                  }} onClick={() => setShowPayment(true)}>
                    🔓 查看完整格式优化方案 →
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ATS Tips */}
          <div className="card" style={{ marginTop: 12 }}>
            <div className="card-title">💡 ATS 优化建议</div>
            <div style={{ marginTop: 8 }}>
              {(isFreeReport ? report.atsTips.slice(0, 2) : report.atsTips).map((tip, i) => (
                <div key={i} style={{ padding: '6px 0', fontSize: 13, color: '#334155', borderBottom: '1px solid #f1f5f9' }}>
                  {i + 1}. {tip}
                </div>
              ))}
              {isFreeReport && report.atsTips.length > 2 && (
                <div style={{
                  textAlign: 'center', padding: '10px', color: '#2563eb', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }} onClick={() => setShowPayment(true)}>
                  +{report.atsTips.length - 2} 条建议 · 付费查看 →
                </div>
              )}
            </div>
          </div>

          {/* Improvements */}
          {!isFreeReport && report.improvedSections.length > 0 && (
            <div className="card" style={{ marginTop: 12 }}>
              <div className="card-title">✏️ 针对性修改建议</div>
              <div style={{ marginTop: 8 }}>
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
          )}

          {/* AI Polish (VIP only) */}
          {!isFreeReport && (
            <div style={{ marginTop: 12 }}>
              <button
                className="btn-primary"
                style={{ width: '100%', padding: '12px', background: polishedResult ? '#16a34a' : 'linear-gradient(135deg, #2563eb, #7c3aed)' }}
                onClick={handlePolish}
                disabled={polishedLoading || report.missingCore.length === 0}
              >
                {polishedLoading ? '🤖 AI 改写中...' : polishedResult ? '✅ 改写完成 · 点击重新生成' : '✨ AI 一键优化简历（VIP专享）'}
              </button>
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
            </div>
          )}

          {/* Free upgrade button */}
          {isFreeReport && (
            <button
              className="btn-primary"
              style={{
                width: '100%', padding: '14px', marginTop: 16,
                background: 'linear-gradient(135deg, #f59e0b, #ef4444)', fontSize: 15,
              }}
              onClick={() => setShowPayment(true)}
            >
              🔓 解锁完整报告 · ¥6.9
            </button>
          )}

          {/* Copy Report Button */}
          {!isFreeReport && (
            <button
              className="btn-outline"
              style={{ width: '100%', marginTop: 12, padding: '10px' }}
              onClick={() => handleCopy(
                `【ATS简历检测报告】\n总分: ${report.totalScore}/100 | 等级: ${report.level}\n关键词匹配: ${report.keywordScore}/100\n格式: ${report.formatScore}/100\n结构: ${report.structureScore}/100\n\n缺失核心关键词: ${report.missingCore.join('、')}\n\n优化建议:\n${report.atsTips.join('\n')}`,
                'report'
              )}
            >
              {copied === 'report' ? '✅ 已复制报告' : '📋 复制文字版报告'}
            </button>
          )}
        </div>
      )}

      {/* ====== Payment Modal ====== */}
      {showPayment && (
        <div className="modal-overlay" onClick={() => setShowPayment(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
            <h3 style={{ textAlign: 'center' }}>📋 解锁 ATS 完整报告</h3>
            <p style={{ fontSize: 13, color: '#64748b', textAlign: 'center' }}>
              完整关键词分析 · 格式深度检查 · AI智能改写 · 不限次数
            </p>

            <div className="modal-pricing">
              <div
                className={`pricing-card recommended`}
                onClick={() => setSelectedPlan(365)}
                style={{
                  cursor: 'pointer',
                  outline: selectedPlan === 365 ? '3px solid #2563eb' : 'none',
                  background: selectedPlan === 365 ? '#eff6ff' : undefined,
                  transition: 'all 0.15s',
                }}
              >
                <div>
                  <div className="pricing-name">🎓 永久卡 · 最划算</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>永久有效 · 无限检测 · AI改写 · 自动更新</div>
                </div>
                <div>
                  <span className="pricing-original">¥49.9</span>
                  <span className="pricing-price">¥19.9</span>
                </div>
              </div>
              <div
                className="pricing-card"
                onClick={() => setSelectedPlan(30)}
                style={{
                  cursor: 'pointer',
                  outline: selectedPlan === 30 ? '3px solid #2563eb' : 'none',
                  background: selectedPlan === 30 ? '#eff6ff' : undefined,
                  transition: 'all 0.15s',
                }}
              >
                <div>
                  <div className="pricing-name">📱 月卡</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>30天无限使用</div>
                </div>
                <div className="pricing-price">¥6.9</div>
              </div>
            </div>

            <div className="qr-area" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 13, fontWeight: 600 }}>
                💳 扫码付款 · 已选：{selectedPlan === 365 ? '永久卡 ¥19.9' : '月卡 ¥6.9'}
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
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 10 }}>付款完成后，将交易单号后6位填入下方</div>
            </div>

            <input
              className="verify-input"
              placeholder="输入交易单号后6位验证"
              value={verifyCode}
              onChange={e => setVerifyCode(e.target.value)}
              style={{ marginTop: 10, fontSize: 15, textAlign: 'center', letterSpacing: 2 }}
            />
            <button
              className="btn-primary"
              style={{ width: '100%', marginTop: 10, background: 'linear-gradient(135deg, #2563eb, #7c3aed)', padding: '14px', fontSize: 16 }}
              onClick={handleVerify}
            >
              🔓 解锁完整报告
            </button>
            <button className="btn-close-modal" onClick={() => setShowPayment(false)} style={{ marginTop: 8 }}>
              稍后再说
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="footer" style={{ marginTop: 30 }}>
        <p>📋 ATS简历体检 · 毕过AI出品 | 你的简历能过机器筛选吗？</p>
      </div>
    </div>
  )
}
