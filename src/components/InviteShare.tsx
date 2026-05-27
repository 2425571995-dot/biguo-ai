import { getShareReferralCode } from '../utils/storage'

interface InviteShareProps {
  onCopyShareLink: () => void
  bonusCount: number
}

const SITE_URL = 'https://2425571995-dot.github.io/xhs-app-writer/'

export default function InviteShare({ onCopyShareLink, bonusCount }: InviteShareProps) {
  const refCode = getShareReferralCode()
  const shareUrl = `${SITE_URL}?ref=${refCode}`

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).catch(() => {})
    onCopyShareLink()
  }

  return (
    <div className="mx-auto px-6 mb-6 mt-6">
      <div className="rounded-2xl bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 border border-pink-100 dark:border-gray-700 p-5">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 text-center sm:text-left">
            <p className="text-sm font-semibold text-pink-700 dark:text-pink-400 mb-1">🎁 邀请好友，双方各得3次免费额度！</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              分享你的专属链接，每成功邀请1位好友访问，你和好友各获得3次免费生成机会
              {bonusCount > 0 && <span className="ml-1 text-pink-500 font-medium">（已获赠 {bonusCount} 次）</span>}
            </p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 break-all">专属链接：{shareUrl}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleCopy}
              className="cursor-pointer rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-pink-200 dark:shadow-pink-900/30 transition-all hover:shadow-lg active:scale-95"
            >
              📤 复制链接分享
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
