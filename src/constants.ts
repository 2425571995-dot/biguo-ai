import type { Template } from './types'

export const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions'
export const DAILY_LIMIT = 5
export const HISTORY_LIMIT = 20

export const CORS_PROXIES = [
  '',
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
]

export const SHARE_URL = 'https://2425571995-dot.github.io/biguo-ai/'
export const SHARE_TEXT = '毕过AI · 论文降重助手 - 免费在线毕业论文降重工具'
export const CONTACT_WECHAT = 'ZzzzySovo'

// ===== 降重强度选项 =====
export const INTENSITY_OPTIONS = [
  { value: 'mild', label: '轻度', desc: '微调句式，保持原文结构' },
  { value: 'moderate', label: '中度', desc: '调整句式结构，替换重复表达' },
  { value: 'strong', label: '强力', desc: '大幅改写，深度优化表达' },
]

// ===== 功能按钮 =====
export const FEATURE_BUTTONS = [
  { key: '降重', label: '降重', active: true },
  { key: '润色', label: '润色', active: false },
  { key: '改写', label: '改写', active: false },
  { key: '翻译', label: '翻译', active: false },
  { key: '扩写', label: '扩写', active: false },
]

// ===== 首审功能区 =====
export const REVIEW_ITEMS = [
  { key: 'formula', label: '公式检查' },
  { key: 'chart', label: '图表规范' },
  { key: 'checklist', label: '首审清单' },
  { key: 'reference', label: '参考文献' },
]

// ===== 论文示例文本 =====
export const SAMPLE_THESIS_TEXT = `随着互联网技术的快速发展，人工智能在教育领域中的应用越来越广泛。通过对学习数据的分析，人工智能能够为学生提供更加个性化的学习建议，从而提高学习效率和教学质量。`

// ===== 输出风格 =====
export const OUTPUT_STYLE = '本科论文'

export const SENSITIVE_WORDS = [
  { word: '最', tip: '极限词，建议替换为"很/非常"' },
  { word: '第一', tip: '极限词，建议替换为"领先"' },
  { word: '100%', tip: '绝对化用语，建议修改' },
]

// ===== 商品推荐（联盟营销） =====
export interface ProductAd {
  name: string
  price: string
  emoji: string
  url: string
  tags: string[]
}

export const PRODUCT_ADS: ProductAd[] = [
  {
    name: '手机支架 补光灯',
    price: '¥17.68',
    emoji: '🛒',
    url: 'https://s.click.taobao.com/OlTZ1Tl',
    tags: ['手机', '支架', '补光', '直播', '数码'],
  },
  {
    name: 'AI写作课程',
    price: '¥2',
    emoji: '📚',
    url: 'https://s.click.taobao.com/t?e=m%3D2%26s%3Dfi8zB1swAsBw4vFB6t2Z2ueEDrYVVa64g3vZOarmkFi53hKxp7mNFl906SyIHsHUT9M7X579b8r0JlhLk0Jl4cw18WEQwTuvF%2FhnFMwfvDzmSxm29wiKVF93alVF4qCKqbxYZVy1v%2BTWqunGLAygI3FzUC1tkZVLiaflJfA6nTGgFd2iucECtf1SarTXhIOTsgIpc1WFZiJNubylQlnZt2xkzRYmczbHBA2W2UBWM%2FW90US8XtsVPoOtdnWN%2BJ514lD2smTG1DvU1Cce0w7gxJ16ZID7dcT7j4MrAUsR31Dl1SxDw1i9uP7nyHmkoZi7UpN9ALTZSr6jIW%2BNqheccMYMXU3NNCg%2F&union_lens=lensId%3APUB%401779790411%400b513950_0dd2_19e63c67511_b090%40026UjcsJN3gEijHzsJIUqeTa%40eyJmbG9vcklkIjo4MDY3NCwiic3BtQiiI6Il9wb3J0YWxfdjJfcGFnZXNfcHJvbW9fZ29vZHNfaW5kZXhfaHRtIiiwiic3JjRmxvb3JJZCI6IjgwNjc0In0ie%3BtkScm%3AselectionPlaza_site_4358_0_0_0_1_177979041110710280197467%3Bscm%3A1007.30148.329090.pub_search-item_b0c0781d-190e-49d7-9013-632b416cd858_',
    tags: ['课程', '学习', '写作', 'AI', '教育'],
  },
  {
    name: '祛疤膏',
    price: '¥11.40',
    emoji: '💊',
    url: 'https://s.click.taobao.com/t?e=m%3D2%26s%3DhztpAwZGq4hw4vFB6t2Z2ueEDrYVVa64YUrQeSeIhnK53hKxp7mNFl906SyIHsHUPmrhe%2FeGHez0JlhLk0Jl4cw18WEQwTuvF%2FhnFMwfvDzmSxm29wiKVF93alVF4qCKhJiE2weqqaRFVI6Hlqs2%2FghrMZuPHvYZHxfsbtDfsFop%2Fq%2BquMQUN1NnEW1QpY0vMLh2y84Z6f6jbKKPA9GKC%2BpRzaullHjPKb9iXllmZ4E%2BkZHuqvdivXhY1KXLRvFPCDp44iebu2xP7qa1tU3ZgS3jKrSQZrKgRywEOrHj0TZGeuhDKKWOXMYMXU3NNCg%2F&union_lens=lensId%3APUB%401779790812%400b1fea4b_0d29_19e63cc93b5_cffb%40024NZIGWy0BN05wTYP4tnjNE%40eyJmbG9vcklkIjoxMTU2ODMsInNwbUIiiOiiJfcG9ydGFsX3YyX3BhZ2VzX3Byb21vX2dvb2RzX2luZGV4X2h0bSIsInNyY0Zsb29ySWQiiOiiIxMTU2ODMiifQieie%3BtkScm%3Asearch_fuzzy_selectionPlaza_site_4358_0_0_0_1_177979081217810280197467%3Bscm%3A1007.30148.329090.0_0_734bd2ea-432b-4881-adfb-f0b77bdab01b_',
    tags: ['护肤', '祛疤', '修复'],
  },
  {
    name: '京东好物精选',
    price: '优惠购',
    emoji: '🛍️',
    url: 'https://union.jd.com/',
    tags: [],
  },
]

// ===== 会员套餐 =====
export const MEMBERSHIP_PLANS = [
  {
    id: 'monthly',
    name: '月卡会员',
    price: '¥9.9',
    priceNum: 9.9,
    desc: '30天无限使用',
    badge: '人气之选',
  },
  {
    id: 'yearly',
    name: '年卡会员',
    price: '¥49.9',
    priceNum: 49.9,
    desc: '365天无限使用',
    badge: '超值',
  },
  {
    id: 'lifetime',
    name: '永久会员',
    price: '¥29.9',
    priceNum: 29.9,
    desc: '一次购买永久使用',
    badge: '限时特惠',
  },
]
