import { useState, useEffect, useRef } from 'react'
import { DEEPSEEK_URL, SHARE_URL, SAMPLE_THESIS_TEXT } from './constants'
import { buildThesisPrompt, fetchWithCORS } from './utils/api'
import { addVisitStat, addGenStat, saveApiKey, getApiKey, getDarkMode, saveDarkMode, redeemCode, isMemberActive, getShareBonus, checkReferralBonus, consumeShareBonus } from './utils/storage'
import { useToast } from './hooks/useToast'
import { useQuota } from './hooks/useQuota'
import { useHistory } from './hooks/useHistory'
import type { Intensity } from './types'

import Header from './components/Header'
import SettingsModal from './components/SettingsModal'
import UpgradeModal from './components/UpgradeModal'
import TemplatePresets from './components/TemplatePresets'
import InputForm from './components/InputForm'
import ResultSection from './components/ResultSection'
import InviteShare from './components/InviteShare'
import Footer from './components/Footer'
import Toast from './components/Toast'

function App() {
  // ===== 核心状态 =====
  const [apiKey, setApiKey] = useState(() => getApiKey())
  const [showSettings, setShowSettings] = useState(() => !getApiKey())
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [dark, setDark] = useState(() => getDarkMode())
  const [isMember, setIsMember] = useState(() => isMemberActive())

  // ===== 论文降重状态 =====
  const [inputText, setInputText] = useState('')
  const [intensity, setIntensity] = useState<Intensity>('moderate')
  const [activeFeature, setActiveFeature] = useState('降重')
  const [resultText, setResultText] = useState('')
  const [originalText, setOriginalText] = useState('')
  const [loading, setLoading] = useState(false)

  // ===== Hooks =====
  const { toasts, showToast, removeToast } = useToast()
  const { remaining, incrementCount, resetCount, DAILY_LIMIT } = useQuota()
  const { addHistoryItem } = useHistory()
  const resultRef = useRef<HTMLDivElement>(null)

  // ===== 暗黑模式 =====
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    saveDarkMode(dark)
  }, [dark])

  // ===== 首次访问统计 + 裂变奖励检测 =====
  const [shareBonus, setShareBonus] = useState(() => getShareBonus())
  useEffect(() => {
    addVisitStat()
    const gotBonus = checkReferralBonus()
    if (gotBonus) {
      setShareBonus(getShareBonus())
      showToast('🎉 通过邀请链接访问，+3次免费额度！', 'success')
    }
  }, [])

  // ===== 业务方法 =====
  const handleSaveKey = (v: string) => { setApiKey(v); saveApiKey(v) }

  const handlePasteExample = () => {
    setInputText(SAMPLE_THESIS_TEXT)
    showToast('📋 已填入示例文本', 'success')
  }

  const handleGenerate = async () => {
    const text = inputText.trim()
    if (!text) { showToast('请输入需要降重的论文段落', 'warning'); return }
    if (text.length > 2000) { showToast('内容过长，建议分段处理', 'warning'); return }
    if (!apiKey.trim()) { setShowSettings(true); showToast('请先设置 DeepSeek API Key', 'warning'); return }
    if (remaining + shareBonus <= 0 && !isMember) { setShowUpgrade(true); return }

    setLoading(true)
    setOriginalText(text)
    try {
      const res = await fetchWithCORS(DEEPSEEK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: '你是一个专业的论文降重和学术写作助手。输出处理后的文本即可，不要输出JSON，不要加额外说明。' },
            { role: 'user', content: buildThesisPrompt(text, intensity, activeFeature) },
          ],
          temperature: 0.7,
          max_tokens: 4096,
        }),
      })
      if (!res.ok) { const errData = await res.json().catch(() => ({})); throw new Error(errData.error?.message || errData.error || `HTTP ${res.status}`) }

      const data = await res.json()
      let result = data.choices[0].message.content
      // 清理可能的 markdown 标记
      result = result.replace(/^```[\w]*\n?/gm, '').replace(/```$/gm, '').trim()

      setResultText(result)
      // 消耗额度
      if (shareBonus > 0) { consumeShareBonus(); setShareBonus(getShareBonus()) }
      else { incrementCount() }
      addGenStat()
      addHistoryItem(text, [{ id: 0, title: '', content: result }])

      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
      showToast('✅ 降重完成！', 'success')
    } catch (e: any) {
      showToast('处理失败: ' + e.message, 'error')
    } finally { setLoading(false) }
  }

  const handleMoreAcademic = async () => {
    if (!resultText.trim()) return
    if (!apiKey.trim()) { setShowSettings(true); showToast('请先设置 API Key', 'warning'); return }

    setLoading(true)
    try {
      const res = await fetchWithCORS(DEEPSEEK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: '你是一个专业的学术写作助手。仅输出处理后的文本，不要额外解释。' },
            { role: 'user', content: buildThesisPrompt(resultText, intensity, '转为学术') },
          ],
          temperature: 0.7,
          max_tokens: 4096,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error('处理失败')
      let result = data.choices[0].message.content
      result = result.replace(/^```[\w]*\n?/gm, '').replace(/```$/gm, '').trim()
      setResultText(result)
      showToast('✅ 已转为更学术的表达！', 'success')
    } catch (e: any) {
      showToast('处理失败: ' + (e.message || ''), 'error')
    } finally { setLoading(false) }
  }

  const handleCopyResult = () => {
    navigator.clipboard.writeText(resultText)
    showToast('✅ 结果已复制到剪贴板')
  }

  const handleContinueOptimize = () => {
    if (!resultText.trim()) return
    setInputText(resultText)
    showToast('📋 结果已填回输入框，可继续优化', 'success')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const copyShareLink = () => {
    navigator.clipboard.writeText(`毕过AI · 论文降重助手 - 免费在线论文降重工具\n${SHARE_URL}`)
    showToast('✅ 工具链接已复制，分享给朋友吧！')
  }

  const handleActivateCode = (code: string) => {
    const result = redeemCode(code)
    showToast(result.message, result.success ? 'success' : 'error')
    if (result.success) {
      setIsMember(true)
      setShowUpgrade(false)
    }
  }

  const handleFeatureChange = (key: string) => {
    setActiveFeature(key)
  }

  const totalRemaining = remaining + shareBonus

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 transition-colors duration-300">
      <Header
        remaining={totalRemaining}
        dark={dark}
        onToggleDark={() => setDark(!dark)}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* ===== 黄色提示横幅 ===== */}
      <div className="bg-amber-50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-900/30">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-2.5 sm:py-3">
          <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-400 text-center leading-relaxed">
            🎓 论文初稿别急着提交：先降重、再润色、最后做提交前检查。今日免费 5 次，分享好友 +3 次。
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-[800px] px-4 sm:px-6 py-5 sm:py-8">
        {showSettings && <SettingsModal apiKey={apiKey} verifying={false} onSaveKey={handleSaveKey} onVerify={() => {}} onClose={() => setShowSettings(false)} />}
        {showUpgrade && <UpgradeModal onContinue={() => { setShowUpgrade(false); handleGenerate() }} onReset={() => { setShowUpgrade(false); resetCount(); showToast('✅ 次数已重置') }} onClose={() => setShowUpgrade(false)} onActivateCode={handleActivateCode} />}

        {/* 功能按钮 */}
        <TemplatePresets activeFeature={activeFeature} onFeatureChange={handleFeatureChange} />

        {/* 输入区 */}
        <InputForm
          inputText={inputText}
          intensity={intensity}
          loading={loading}
          onInputChange={setInputText}
          onIntensityChange={setIntensity}
          onGenerate={handleGenerate}
          onPasteExample={handlePasteExample}
        />

        {/* 结果区 */}
        <ResultSection
          ref={resultRef}
          loading={loading}
          resultText={resultText}
          hasResult={!!resultText}
          originalText={originalText}
          onCopyResult={handleCopyResult}
          onContinueOptimize={handleContinueOptimize}
          onMoreAcademic={handleMoreAcademic}
        />

        {/* 底部会员区 */}
        <div className="mt-6 rounded-2xl border border-indigo-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              📅 今日剩余免费次数：<strong className="text-indigo-600 dark:text-indigo-400">{totalRemaining}</strong> 次
            </div>
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={copyShareLink}
                className="cursor-pointer rounded-lg border border-indigo-200 dark:border-gray-600 px-3.5 py-2 text-xs sm:text-sm font-medium text-indigo-600 dark:text-indigo-400 transition-colors hover:bg-indigo-50 dark:hover:bg-gray-700 active:scale-95"
              >
                🎁 分享得 +3 次
              </button>
              <button
                onClick={() => setShowUpgrade(true)}
                className="cursor-pointer rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-3.5 py-2 text-xs sm:text-sm font-medium text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/30 transition-all hover:shadow-lg active:scale-95"
              >
                ⭐ 开通无限次 ¥9.9
              </button>
            </div>
          </div>
        </div>

        {/* 分享（有结果时显示） */}
        {resultText && <InviteShare onCopyShareLink={copyShareLink} bonusCount={shareBonus} />}
      </main>

      <Footer />
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  )
}

export default App
