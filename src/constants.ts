import type { StyleOption, Template, SensitiveWord } from './types'

export const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions'
export const DAILY_LIMIT = 5
export const HISTORY_LIMIT = 20

export const CORS_PROXIES = [
  '',
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
]

export const STYLE_OPTIONS: StyleOption[] = [
  { value: 'caozhong', label: '🌱 种草分享风', desc: '亲切自然，像朋友推荐' },
  { value: 'ganhuo', label: '📊 干货测评风', desc: '专业客观，数据说话' },
  { value: 'tubi', label: '⚠️ 吐槽避雷风', desc: '反向种草，痛点切入' },
  { value: 'jieduan', label: '✍️ 极简短句风', desc: '短小精悍，快速阅读' },
]

export const TEMPLATES: Template[] = [
  { label: '💄 美妆', product: '花西子蜜粉饼', features: '控油持妆12小时、柔焦毛孔、适合油皮', price: '¥149', audience: '油皮/混油皮女生' },
  { label: '👗 穿搭', product: '高腰阔腿牛仔裤', features: '高腰显瘦、垂感好、百搭不挑人', price: '¥129', audience: '梨形身材女生' },
  { label: '🍜 美食', product: '自热小火锅', features: '麻辣鲜香、料超足、15分钟即食', price: '¥39.9', audience: '宿舍党/上班族' },
  { label: '🏠 家居', product: 'ins风护眼台灯', features: '三色温调节、护眼无频闪、高颜值', price: '¥69', audience: '租房党/学生党' },
  { label: '📱 数码科技', product: '无线蓝牙耳机', features: '降噪强、续航24h、高清音质', price: '¥199', audience: '学生党/上班族' },
  { label: '📚 书籍学习', product: '心理学畅销书', features: '通俗易懂、案例丰富、实用性强', price: '¥49', audience: '自我提升人群' },
  { label: '🚗 汽车用品', product: '车载手机支架', features: '稳固不晃动、单手取放、适配所有车型', price: '¥59', audience: '有车一族' },
  { label: '👶 母婴亲子', product: '婴儿恒温睡袋', features: '恒温透气、无荧光剂、四季通用', price: '¥129', audience: '宝妈/孕妈' },
  { label: '🐱 宠物用品', product: '天然无谷猫粮', features: '0谷物、高肉含量、美毛护肠', price: '¥89', audience: '养猫人群' },
  { label: '💪 运动健身', product: '瑜伽垫加厚款', features: '10mm加厚、防滑纹理、无味环保', price: '¥79', audience: '健身爱好者' },
]

export const TEMPLATE_GROUPS = [
  { label: '热门', items: TEMPLATES.slice(0, 4) },
  { label: '生活', items: TEMPLATES.slice(4, 8) },
  { label: '兴趣', items: TEMPLATES.slice(8) },
]

export const AUDIENCE_TAGS = [
  '女生', '男生', '学生党', '上班族', '宝妈', '精致白领',
  '油皮', '干皮', '敏感肌', '混油皮', '预算有限', '追求品质',
]

export const SENSITIVE_WORDS: SensitiveWord[] = [
  { word: '最', tip: '极限词，建议替换为"很/非常"' },
  { word: '第一', tip: '极限词，建议替换为"领先"' },
  { word: '100%', tip: '绝对化用语，建议修改' },
  { word: '绝对', tip: '绝对化用语，建议替换' },
  { word: '超级', tip: '夸大宣传，建议替换' },
  { word: '正品保证', tip: '保证类用语，建议移除' },
  { word: '无效退款', tip: '承诺类用语，建议移除' },
  { word: '假一赔十', tip: '承诺类用语，建议移除' },
  { word: '微信', tip: '注意平台限流' },
  { word: 'QQ', tip: '注意平台限流' },
]

export const STYLE_MAP: Record<string, string> = {
  caozhong: '种草分享风：语气亲切自然，像朋友真心推荐，突出使用感受和真实场景',
  ganhuo: '干货测评风：专业客观，有理有据，多维度分析优缺点，用数据说话',
  tubi: '吐槽避雷风：从痛点/坑点切入，反向安利，容易引发共鸣和讨论',
  jieduan: '极简短句风：短小精悍，一句话一段，快速传递核心信息，适合碎片阅读',
}

export const SHARE_URL = 'https://2425571995-dot.github.io/xhs-app-writer/'
export const SHARE_TEXT = '小红书AI文案生成器 - 免费在线种草文案制作工具'
export const CONTACT_WECHAT = 'ZzzzySovo'
