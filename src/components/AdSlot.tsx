export default function AdSlot() {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/40 p-4 text-center flex flex-col justify-center">
      <p className="mb-2 text-xs text-gray-400 dark:text-gray-500">— 广告 —</p>
      <div className="flex min-h-[90px] items-center justify-center rounded-xl bg-white dark:bg-gray-800">
        <div className="text-center">
          <span className="text-sm text-gray-300 dark:text-gray-600">📢 广告位招租</span>
          <p className="mt-1 text-xs text-gray-300 dark:text-gray-600">合作微信：ZzzzySovo</p>
        </div>
      </div>
    </div>
  )
}
