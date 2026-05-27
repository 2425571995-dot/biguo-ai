import { useState } from 'react'
import { DAILY_LIMIT, MEMBERSHIP_PLANS, CONTACT_WECHAT } from '../constants'

interface UpgradeModalProps {
  onContinue: () => void
  onReset: () => void
  onClose: () => void
  onActivateCode: (code: string) => void
}

export default function UpgradeModal({ onContinue, onReset, onClose, onActivateCode }: UpgradeModalProps) {
  const [tab, setTab] = useState<'plans' | 'code'>('plans')
  const [code, setCode] = useState('')
  const [copied, setCopied] = useState(false)

  const handleCopyWechat = () => {
    navigator.clipboard.writeText(CONTACT_WECHAT)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleActivate = () => {
    if (!code.trim()) return
    onActivateCode(code.trim())
    setCode('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="animate-modal mx-4 w-full max-w-md rounded-2xl border border-pink-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* 标题 */}
        <div className="mb-4 text-center">
          <div className="mb-2 text-4xl">👑</div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">今日免费次数已用尽</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            每日免费 <strong className="text-pink-500">{DAILY_LIMIT} 次</strong>，升级会员无限使用
          </p>
        </div>

        {/* Tab 切换 */}
        <div className="mb-4 flex rounded-xl bg-gray-100 dark:bg-gray-700 p-1">
          <button
            onClick={() => setTab('plans')}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all cursor-pointer ${tab === 'plans' ? 'bg-white dark:bg-gray-600 text-pink-600 dark:text-pink-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
          >
            💎 升级会员
          </button>
          <button
            onClick={() => setTab('code')}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all cursor-pointer ${tab === 'code' ? 'bg-white dark:bg-gray-600 text-pink-600 dark:text-pink-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
          >
            🔑 卡密兑换
          </button>
        </div>

        {tab === 'plans' ? (
          <>
            {/* 套餐卡片 */}
            <div className="space-y-3 mb-4">
              {MEMBERSHIP_PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className="relative rounded-xl border-2 border-pink-200 dark:border-gray-600 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/10 dark:to-rose-900/10 p-4 hover:border-pink-400 dark:hover:border-pink-500 transition-colors"
                >
                  {plan.badge && (
                    <span className="absolute -top-2 right-3 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
                      {plan.badge}
                    </span>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">{plan.name}</div>
                      <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{plan.desc}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-pink-600 dark:text-pink-400">{plan.price}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 支付引导 */}
            <div className="rounded-xl bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 border border-pink-200 dark:border-pink-800 p-4">
              <div className="mb-3 text-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">📱 扫码/搜索添加微信开通</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-white dark:bg-gray-800 p-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-900/30">
                  <span className="text-2xl">💬</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-200">微信号：{CONTACT_WECHAT}</div>
                  <div className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">添加时备注「会员开通」</div>
                </div>
                <button
                  onClick={handleCopyWechat}
                  className="shrink-0 rounded-lg bg-pink-500 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-pink-600 active:scale-95 cursor-pointer"
                >
                  {copied ? '✅ 已复制' : '复制'}
                </button>
              </div>
              <div className="mt-3 space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                <p>💡 开通步骤：</p>
                <p>1️⃣ 复制微信号 → 添加好友</p>
                <p>2️⃣ 告知所需套餐 → 微信转账</p>
                <p>3️⃣ 获取卡密 → 本页兑换即可</p>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* 卡密兑换 */}
            <div className="rounded-xl border border-pink-200 dark:border-gray-600 bg-pink-50 dark:bg-pink-900/20 p-4">
              <div className="mb-3 text-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">🔑 输入卡密激活会员</span>
              </div>
              <div className="flex gap-2">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="请输入卡密..."
                  className="flex-1 rounded-lg border border-pink-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 outline-none transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && handleActivate()}
                />
                <button
                  onClick={handleActivate}
                  className="shrink-0 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 px-5 py-2.5 text-sm font-medium text-white transition-all hover:shadow-lg active:scale-95 cursor-pointer"
                >
                  兑换
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                卡密通过微信购买获取，添加微信 {CONTACT_WECHAT}
              </p>
            </div>
          </>
        )}

        {/* 底部操作 */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={onContinue}
            className="flex-1 cursor-pointer rounded-xl border border-gray-200 dark:border-gray-600 px-4 py-2.5 text-sm text-pink-600 dark:text-pink-400 transition-colors hover:bg-pink-50 dark:hover:bg-gray-700"
          >
            继续生成
          </button>
          <button
            onClick={onReset}
            className="flex-1 cursor-pointer rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2.5 text-sm text-white shadow-lg shadow-pink-200 dark:shadow-pink-900/30 transition-all hover:shadow-xl"
          >
            重置次数
          </button>
        </div>
        <p className="mt-3 text-center text-xs text-gray-400 dark:text-gray-500">
          重置后今日可继续免费使用 {DAILY_LIMIT} 次
        </p>
      </div>
    </div>
  )
}
