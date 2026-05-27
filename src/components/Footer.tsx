import { DAILY_LIMIT } from '../constants'
import { getVisitCount, getGenCount } from '../utils/storage'

export default function Footer() {
  return (
    <footer className="border-t border-pink-100 dark:border-gray-700 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
      <div className="mx-auto px-6 space-y-2">
        <p>🔥 小红书AI文案生成器 · 免费在线 · 无需注册 · AI 驱动</p>
        <div className="text-xs text-gray-300 dark:text-gray-600 space-x-3">
          <span>
            访问人数 <strong className="text-pink-400">{getVisitCount()}</strong>
          </span>
          <span>·</span>
          <span>
            已帮助 <strong className="text-pink-400">{getGenCount()}</strong> 位创作者生成文案
          </span>
          <span>·</span>
          <span>每日免费 {DAILY_LIMIT} 次</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs">
          <span className="text-gray-400 dark:text-gray-500">📢 商务合作：</span>
          <span className="font-medium text-gray-500 dark:text-gray-400">微信 ZzzzySovo</span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span>🛒 <a href="https://union.jd.com/" target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:underline">京东联盟</a></span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span>📚 <a href="https://s.click.taobao.com/t?e=m%3D2%26s%3Dfi8zB1swAsBw4vFB6t2Z2ueEDrYVVa64g3vZOarmkFi53hKxp7mNFl906SyIHsHUT9M7X579b8r0JlhLk0Jl4cw18WEQwTuvF%2FhnFMwfvDzmSxm29wiKVF93alVF4qCKqbxYZVy1v%2BTWqunGLAygI3FzUC1tkZVLiaflJfA6nTGgFd2iucECtf1SarTXhIOTsgIpc1WFZiJNubylQlnZt2xkzRYmczbHBA2W2UBWM%2FW90US8XtsVPoOtdnWN%2BJ514lD2smTG1DvU1Cce0w7gxJ16ZID7dcT7j4MrAUsR31Dl1SxDw1i9uP7nyHmkoZi7UpN9ALTZSr6jIW%2BNqheccMYMXU3NNCg%2F&union_lens=lensId%3APUB%401779790411%400b513950_0dd2_19e63c67511_b090%40026UjcsJN3gEijHzsJIUqeTa%40eyJmbG9vcklkIjo4MDY3NCwiic3BtQiiI6Il9wb3J0YWxfdjJfcGFnZXNfcHJvbW9fZ29vZHNfaW5kZXhfaHRtIiiwiic3JjRmxvb3JJZCI6IjgwNjc0In0ie%3BtkScm%3AselectionPlaza_site_4358_0_0_0_1_177979041110710280197467%3Bscm%3A1007.30148.329090.pub_search-item_b0c0781d-190e-49d7-9013-632b416cd858_" target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:underline">AI工具推荐</a></span>
        </div>
      </div>
    </footer>
  )
}
