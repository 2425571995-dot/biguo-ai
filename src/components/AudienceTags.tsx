interface AudienceTagsProps {
  tags: string[]
  selected: string[]
  onToggle: (tag: string) => void
}

export default function AudienceTags({ tags, selected, onToggle }: AudienceTagsProps) {
  return (
    <div>
      <label className="mb-1 block text-sm text-gray-500 dark:text-gray-400">目标人群（点击选择）</label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onToggle(t)}
            className={`cursor-pointer rounded-full px-3 py-1 text-xs transition-all ${
              selected.includes(t)
                ? 'bg-pink-500 text-white shadow-sm'
                : 'border border-pink-200 dark:border-gray-600 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {selected.length > 0 && (
        <div className="text-xs text-gray-400 dark:text-gray-500">
          已选：{selected.join('、')}
        </div>
      )}
    </div>
  )
}
