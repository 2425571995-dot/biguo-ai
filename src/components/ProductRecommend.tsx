import { PRODUCT_ADS } from '../constants'

interface ProductRecommendProps {
  product: string
  features: string
}

export default function ProductRecommend({ product, features }: ProductRecommendProps) {
  // 根据用户输入的关键词匹配推荐商品
  const searchText = `${product} ${features}`.toLowerCase()
  const matched = PRODUCT_ADS.filter(ad => {
    if (ad.tags.length === 0) return false // 兜底商品不在这里显示
    return ad.tags.some(tag => searchText.includes(tag.toLowerCase()))
  })

  // 如果没匹配到，展示全部3个淘宝商品
  const displayAds = matched.length > 0 ? matched : PRODUCT_ADS.filter(ad => ad.tags.length > 0)

  return (
    <div className="rounded-2xl border border-pink-100 dark:border-gray-700 bg-gradient-to-br from-amber-50/60 to-orange-50/40 dark:from-amber-900/10 dark:to-orange-900/10 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-sm">🎁</span>
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">为你推荐</span>
        <span className="rounded-full bg-pink-100 dark:bg-pink-900/30 px-2 py-0.5 text-[10px] text-pink-500">好物</span>
      </div>
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {displayAds.map((ad, i) => (
          <a
            key={i}
            href={ad.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 transition-all hover:border-pink-300 dark:hover:border-pink-600 hover:shadow-md"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-pink-50 dark:bg-pink-900/30 text-lg">
              {ad.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-pink-600 dark:group-hover:text-pink-400">
                {ad.name}
              </div>
              <div className="mt-0.5 text-xs font-semibold text-pink-500">{ad.price}</div>
            </div>
            <span className="shrink-0 text-xs text-gray-300 dark:text-gray-600 group-hover:text-pink-400 transition-colors">→</span>
          </a>
        ))}
      </div>
    </div>
  )
}
