import AdSlot from './AdSlot'

export default function ExamplePreview() {
  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_300px]">
      <div className="rounded-2xl border border-pink-100 dark:border-gray-700 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/10 dark:to-rose-900/10 p-5">
        <h3 className="mb-3 text-base font-semibold text-gray-700 dark:text-gray-200">✨ 生成效果预览</h3>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-pink-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 text-left shadow-sm">
            <div className="mb-1 text-sm font-bold text-gray-800 dark:text-gray-100">🌸 混油皮亲妈！！这个蜜粉饼我哭了</div>
            <div className="text-xs leading-relaxed text-gray-500 dark:text-gray-400 line-clamp-3">
              真的后悔没早点买！！油皮夏天最怕脱妆，这个持妆12小时完全没问题...
            </div>
            <div className="mt-2 flex gap-1 flex-wrap">
              <span className="rounded-full bg-pink-50 dark:bg-pink-900/30 px-2 py-0.5 text-[10px] text-pink-500">#小红书文案</span>
              <span className="rounded-full bg-pink-50 dark:bg-pink-900/30 px-2 py-0.5 text-[10px] text-pink-500">#美妆种草</span>
            </div>
          </div>
          <div className="rounded-xl border border-pink-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 text-left shadow-sm">
            <div className="mb-1 text-sm font-bold text-gray-800 dark:text-gray-100">⚠️ 避雷！这牛仔裤我穿了三天就...</div>
            <div className="text-xs leading-relaxed text-gray-500 dark:text-gray-400 line-clamp-3">
              本来满怀期待买的，结果垂感完全不是描述的那样，洗了一次直接...
            </div>
            <div className="mt-2 flex gap-1 flex-wrap">
              <span className="rounded-full bg-pink-50 dark:bg-pink-900/30 px-2 py-0.5 text-[10px] text-pink-500">#穿搭避雷</span>
              <span className="rounded-full bg-pink-50 dark:bg-pink-900/30 px-2 py-0.5 text-[10px] text-pink-500">#真实测评</span>
            </div>
          </div>
          <div className="rounded-xl border border-pink-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 text-left shadow-sm">
            <div className="mb-1 text-sm font-bold text-gray-800 dark:text-gray-100">📚 这本书改变了我的思维方式</div>
            <div className="text-xs leading-relaxed text-gray-500 dark:text-gray-400 line-clamp-3">
              真的很干货！每个章节都有实际案例，读完感觉整个人都通透了...
            </div>
            <div className="mt-2 flex gap-1 flex-wrap">
              <span className="rounded-full bg-pink-50 dark:bg-pink-900/30 px-2 py-0.5 text-[10px] text-pink-500">#书籍推荐</span>
              <span className="rounded-full bg-pink-50 dark:bg-pink-900/30 px-2 py-0.5 text-[10px] text-pink-500">#自我提升</span>
            </div>
          </div>
        </div>
      </div>
      <AdSlot />
    </div>
  )
}
