export default function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-pink-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 animate-pulse">
      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/5 mb-3" />
      <div className="space-y-2 mb-3">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
      </div>
      <div className="flex gap-1.5">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-14" />
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-16" />
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-12" />
      </div>
    </div>
  )
}
