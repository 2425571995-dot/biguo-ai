import { AUDIENCE_TAGS, DAILY_LIMIT } from '../constants'
import AudienceTags from './AudienceTags'
import StyleSelector from './StyleSelector'

interface InputFormProps {
  product: string
  features: string
  price: string
  audienceTags: string[]
  style: string
  loading: boolean
  remaining: number
  onProductChange: (v: string) => void
  onFeaturesChange: (v: string) => void
  onPriceChange: (v: string) => void
  onAudienceTagToggle: (tag: string) => void
  onStyleChange: (v: string) => void
  onGenerate: () => void
}

export default function InputForm({
  product, features, price, audienceTags, style, loading, remaining,
  onProductChange, onFeaturesChange, onPriceChange, onAudienceTagToggle, onStyleChange, onGenerate,
}: InputFormProps) {
  const inputCls = 'w-full rounded-xl border border-pink-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 outline-none transition-all'

  return (
    <div className="rounded-2xl border border-pink-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-700 dark:text-gray-200">📝 产品信息</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-gray-500 dark:text-gray-400">产品名称 *</label>
          <input
            placeholder="如：花西子蜜粉饼、某品牌护肤品"
            value={product}
            onChange={(e) => onProductChange(e.target.value)}
            className={inputCls}
            onKeyDown={(e) => e.key === 'Enter' && onGenerate()}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-500 dark:text-gray-400">价格</label>
          <input
            placeholder="如：¥199 / 均价50元"
            value={price}
            onChange={(e) => onPriceChange(e.target.value)}
            className={inputCls}
            onKeyDown={(e) => e.key === 'Enter' && onGenerate()}
          />
        </div>
        <div className="sm:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm text-gray-500 dark:text-gray-400">核心卖点</label>
            <span className="text-xs text-gray-400 dark:text-gray-500">{features.length} 字</span>
          </div>
          <textarea
            rows={2}
            placeholder="如：控油持妆12小时、柔焦毛孔、适合油皮、颜值高"
            value={features}
            onChange={(e) => onFeaturesChange(e.target.value)}
            className={`${inputCls} resize-none`}
          />
        </div>
        <div>
          <AudienceTags tags={AUDIENCE_TAGS} selected={audienceTags} onToggle={onAudienceTagToggle} />
        </div>
      </div>

      <div className="mt-5">
        <StyleSelector value={style} onChange={onStyleChange} />
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={onGenerate}
          disabled={loading}
          className="flex-1 cursor-pointer rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 py-3.5 text-lg font-semibold text-white shadow-lg shadow-pink-200 dark:shadow-pink-900/30 transition-all hover:shadow-xl hover:shadow-pink-300 dark:hover:shadow-pink-900/50 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
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
      {remaining <= 1 && remaining > 0 && (
        <p className="mt-2 text-xs text-amber-500 dark:text-amber-400">
          💡 每日免费 {DAILY_LIMIT} 次，用完后可重置继续使用或联系微信 ZzzzySovo 开通无限会员
        </p>
      )}
    </div>
  )
}
