// ====== ATS 简历关键词引擎 ======
// 核心逻辑：规则匹配 + 关键词库，不依赖AI
// 护城河在这里——关键词分级、权重、打分模型

// ====== 类型定义 ======
export interface KeywordItem {
  keyword: string
  weight: 'core' | 'secondary' | 'auxiliary'
  category: string
  synonyms: string[]
}

export interface MatchResult {
  keyword: string
  weight: 'core' | 'secondary' | 'auxiliary'
  matched: boolean
  count: number
  density: number // 出现次数/总词数, 过高判定堆砌
  warning?: string
}

export interface FormatIssue {
  type: 'error' | 'warning' | 'ok'
  item: string
  detail: string
}

export interface ATSReport {
  totalScore: number          // 0-100
  level: 'excellent' | 'good' | 'moderate' | 'weak'
  keywordScore: number         // 关键词匹配得分 0-100
  formatScore: number          // 格式得分 0-100
  structureScore: number       // 结构完整性得分 0-100
  jdKeywords: KeywordItem[]    // JD中提取的关键词
  matches: MatchResult[]       // 匹配结果
  missingCore: string[]        // 缺失的核心关键词
  missingSecondary: string[]   // 缺失的次要关键词
  densityWarnings: string[]    // 关键词密度过高警告
  formatIssues: FormatIssue[]  // 格式问题
  structureIssues: string[]    // 结构问题
  atsTips: string[]            // ATS优化建议
  improvedSections: {original: string; improved: string; reason: string}[] // 针对性改进
}

// ====== 岗位关键词库 ======
// 基于真实招聘JD提取，按岗位分类
const JOB_KEYWORDS: Record<string, { core: string[]; secondary: string[]; auxiliary: string[] }> = {
  // 产品经理
  'product-manager': {
    core: ['产品规划', '需求分析', 'PRD', '原型设计', '用户研究', '竞品分析', '产品路线图', 'MVP', '产品迭代', 'A/B测试'],
    secondary: ['数据分析', '跨部门协作', '用户体验', '敏捷开发', '产品定位', '用户画像', '需求优先级', '项目推进'],
    auxiliary: ['SQL', 'Axure', 'Figma', 'Jira', '产品文档', '用户访谈', '市场调研', '运营数据', '产品指标'],
  },
  // Java开发
  'java-dev': {
    core: ['Java', 'Spring Boot', '微服务', 'MySQL', '分布式系统', 'Redis', '消息队列', 'JVM', '多线程', 'REST API'],
    secondary: ['Docker', 'Kubernetes', 'MyBatis', '设计模式', '系统设计', '性能优化', '单元测试', 'CI/CD', 'Git'],
    auxiliary: ['Nginx', 'Elasticsearch', 'Zookeeper', 'Dubbo', 'RabbitMQ', 'Kafka', 'Maven', 'Gradle', 'Swagger'],
  },
  // 前端开发
  'frontend': {
    core: ['React', 'Vue', 'TypeScript', 'JavaScript', 'HTML/CSS', '组件化', '状态管理', '响应式布局', 'ES6', 'Webpack/Vite'],
    secondary: ['性能优化', '前端工程化', '跨端开发', 'Node.js', 'RESTful API', '单元测试', 'Git', 'UI组件库'],
    auxiliary: ['Sass/Less', 'WebSocket', 'ECharts', 'Ant Design', 'Element UI', 'Next.js', '小程序开发', 'SEO优化'],
  },
  // 数据分析
  'data-analyst': {
    core: ['SQL', 'Python', '数据分析', '数据可视化', '指标体系', '用户行为分析', 'A/B测试', '数据建模', 'Excel'],
    secondary: ['统计学', 'Tableau/PowerBI', '数据清洗', '业务分析', '归因分析', '预测模型', '数据仓库', '报表开发'],
    auxiliary: ['R语言', 'Pandas', 'NumPy', 'Matplotlib', 'Hive', 'Spark', '机器学习基础', 'ETL'],
  },
  // 运营
  'operations': {
    core: ['用户增长', '转化率', '留存率', '活动策划', '数据分析', '渠道运营', '内容运营', '社群运营', '用户运营'],
    secondary: ['KPI', '拉新促活', '私域流量', '新媒体运营', '品牌合作', '用户调研', '竞品分析', '活动复盘'],
    auxiliary: ['公众号运营', '抖音运营', '小红书运营', '裂变增长', 'CRM', '推送策略', '视频剪辑'],
  },
  // 人力资源
  'hr': {
    core: ['招聘', '绩效管理', '培训', '员工关系', '薪酬福利', 'HRBP', '组织发展', '人才盘点', '面试'],
    secondary: ['员工入职', '离职面谈', '企业文化', '考勤管理', '劳动法', '社保公积金', '人才评估', '校招'],
    auxiliary: ['HR系统', 'LinkedIn', '结构化面试', '360评估', 'OKR', '岗位说明书', '雇主品牌'],
  },
  // 市场/品牌
  'marketing': {
    core: ['品牌策略', '市场调研', '营销方案', '投放策略', 'ROI', '内容营销', 'SEM/SEO', 'KOL合作', '品牌定位'],
    secondary: ['整合营销', '社交媒体运营', '活动策划', '用户洞察', '竞品监测', '品牌物料', 'PR', '电商运营'],
    auxiliary: ['Photoshop', '视频编辑', '直播运营', '私域运营', 'CRM系统', '营销自动化'],
  },
  // 财务
  'finance': {
    core: ['财务分析', '财务报表', '税务筹划', '成本控制', '预算管理', '会计核算', '审计', '资金管理', '财务合规'],
    secondary: ['ERP系统', '现金流量表', '利润表', '资产负债表', '内控', '财务建模', '汇算清缴', '成本核算'],
    auxiliary: ['用友/金蝶', 'Excel高级', '税务申报', '发票管理', '银行对账', '固定资产管理'],
  },
}

// 通用关键词（所有岗位普遍加分）
const UNIVERSAL_KEYWORDS = {
  core: ['团队合作', '沟通能力', '项目管理'],
  secondary: ['解决问题', '学习能力', '抗压能力', '执行力', '责任心'],
  auxiliary: ['Office', '英语四级', '英语六级'],
}

// ====== 从 JD 文本中提取关键词 ======
export function extractKeywordsFromJD(jdText: string, jobCategory?: string): KeywordItem[] {
  const keywords: KeywordItem[] = []
  const seen = new Set<string>()

  // 1. 如果有岗位分类，加载对应关键词库
  const categoryKeywords = jobCategory ? JOB_KEYWORDS[jobCategory] : null

  // 2. 从JD文本中提取匹配的关键词
  const allKeywords: { kw: string; w: 'core' | 'secondary' | 'auxiliary'; cat: string }[] = []

  // 加入岗位关键词
  if (categoryKeywords) {
    categoryKeywords.core.forEach(k => allKeywords.push({ kw: k, w: 'core', cat: jobCategory! }))
    categoryKeywords.secondary.forEach(k => allKeywords.push({ kw: k, w: 'secondary', cat: jobCategory! }))
    categoryKeywords.auxiliary.forEach(k => allKeywords.push({ kw: k, w: 'auxiliary', cat: jobCategory! }))
  }

  // 加入通用关键词
  UNIVERSAL_KEYWORDS.core.forEach(k => allKeywords.push({ kw: k, w: 'core', cat: '通用' }))
  UNIVERSAL_KEYWORDS.secondary.forEach(k => allKeywords.push({ kw: k, w: 'secondary', cat: '通用' }))
  UNIVERSAL_KEYWORDS.auxiliary.forEach(k => allKeywords.push({ kw: k, w: 'auxiliary', cat: '通用' }))

  // 还要从JD中额外提取高频技术词汇(未在词库中的)
  const extraKeywords = extractExtraKeywords(jdText)
  extraKeywords.forEach(k => {
    if (!allKeywords.find(x => x.kw === k)) {
      allKeywords.push({ kw: k, w: 'secondary', cat: 'JD 提取' })
    }
  })

  // 在JD文本中查找关键词
  for (const item of allKeywords) {
    if (seen.has(item.kw.toLowerCase())) continue
    const found = jdText.toLowerCase().includes(item.kw.toLowerCase())
    if (found) {
      seen.add(item.kw.toLowerCase())
      keywords.push({
        keyword: item.kw,
        weight: item.w,
        category: item.cat,
        synonyms: [],
      })
    }
  }

  // 如果JD提取的关键词太少(少于3个)，只补充通用关键词，不加载整个词库
  if (keywords.length < 3) {
    const fallback = [
      ...UNIVERSAL_KEYWORDS.core.map(k => ({ kw: k, w: 'core' as const, cat: '通用' })),
      ...UNIVERSAL_KEYWORDS.secondary.map(k => ({ kw: k, w: 'secondary' as const, cat: '通用' })),
    ]
    for (const item of fallback) {
      if (seen.has(item.kw.toLowerCase())) continue
      seen.add(item.kw.toLowerCase())
      keywords.push({
        keyword: item.kw,
        weight: item.w,
        category: item.cat,
        synonyms: [],
      })
    }
  }

  return keywords
}

// 从JD中提取额外技术关键词
function extractExtraKeywords(jdText: string): string[] {
  const techPatterns = [
    // 编程语言/框架
    /\b(Python|Java|Go|Rust|C\+\+|TypeScript|JavaScript|Scala|Kotlin|Swift|PHP|Ruby)\b/gi,
    // 数据库
    /\b(MySQL|PostgreSQL|MongoDB|Redis|Elasticsearch|Oracle|SQL Server|ClickHouse|TiDB)\b/gi,
    // 框架
    /\b(Spring|Django|Flask|FastAPI|Vue|React|Angular|Node\.js|Express|NestJS|Laravel)\b/gi,
    // 工具/平台
    /\b(Docker|Kubernetes|AWS|Azure|GCP|Jenkins|GitLab|Terraform|Ansible|Hadoop|Spark)\b/gi,
    // 证书
    /\b(PMP|CFA|CPA|AWS认证|RHCE|CCIE|ACCA|FRM|建造师)\b/gi,
    // 中文技术词
    /\b(机器学习|深度学习|自然语言处理|计算机视觉|推荐系统|知识图谱)\b/g,
  ]

  const found: string[] = []
  for (const pattern of techPatterns) {
    const matches = jdText.match(pattern)
    if (matches) {
      matches.forEach(m => {
        if (!found.includes(m)) found.push(m)
      })
    }
  }
  return found.slice(0, 15)
}

// ====== 检测岗位类别 ======
export function detectJobCategory(jdText: string): string {
  const patterns: Record<string, string[]> = {
    'product-manager': ['产品经理', '产品规划', 'PRD', '产品设计', '需求文档'],
    'java-dev': ['Java', 'Spring', '后端开发', 'java开发'],
    'frontend': ['前端', 'React', 'Vue', 'H5', '小程序开发', 'Web前端'],
    'data-analyst': ['数据分析', '数据分析师', '数据科学', 'BI', '数据挖掘'],
    'operations': ['运营', '用户增长', '转化率', '活动运营', '新媒体'],
    'hr': ['HR', '人力资源', '招聘', '员工关系', '人事'],
    'marketing': ['市场', '品牌', '营销', '品牌推广', '市场经理'],
    'finance': ['财务', '会计', '审计', '税务', '出纳'],
  }

  let bestCategory = ''
  let bestScore = 0
  for (const [cat, kws] of Object.entries(patterns)) {
    let score = 0
    for (const kw of kws) {
      if (jdText.includes(kw)) score++
    }
    if (score > bestScore) {
      bestScore = score
      bestCategory = cat
    }
  }
  if (bestScore < 1) return ''
  return bestCategory
}

// ====== 智能关键词匹配（中文模糊匹配） ======
function matchKeyword(keyword: string, text: string): { found: boolean; count: number } {
  const lowerKW = keyword.toLowerCase()
  const lowerText = text.toLowerCase()

  // 精确匹配
  if (lowerText.includes(lowerKW)) {
    const regex = new RegExp(lowerKW.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    const count = (text.match(regex) || []).length
    return { found: true, count }
  }

  // 中文：拆成单字或词素做部分匹配
  // 2字及以上关键词，超过一半字符出现就算命中
  if (/[一-鿿]/.test(keyword) && keyword.length >= 2) {
    const chars = [...keyword]  // 正确处理中文（非BMP字符）
    let matchedChars = 0
    for (const ch of chars) {
      if (lowerText.includes(ch)) matchedChars++
    }
    const ratio = matchedChars / chars.length
    if (ratio >= 0.6) {
      return { found: true, count: 1 }
    }
  }

  // 英文：拆分单词做匹配
  const englishWords = keyword.split(/[\s/]+/).filter(w => w.length > 2)
  if (englishWords.length > 1) {
    const matchedWords = englishWords.filter(w => lowerText.includes(w.toLowerCase()))
    if (matchedWords.length >= englishWords.length * 0.5) {
      return { found: true, count: 1 }
    }
  }

  return { found: false, count: 0 }
}

// ====== 核心：简历与JD匹配分析 ======
export function analyzeResume(resumeText: string, jdText: string, jobCategory?: string): ATSReport {
  const cat = jobCategory || detectJobCategory(jdText)
  const jdKeywords = extractKeywordsFromJD(jdText, cat)

  // 简历文本预处理
  const resumeWords = resumeText.replace(/\s+/g, ' ').split(/\s+/).length

  // 匹配每个关键词（智能模糊匹配）
  const matches: MatchResult[] = jdKeywords.map(kw => {
    const { found, count } = matchKeyword(kw.keyword, resumeText)
    const density = resumeWords > 0 ? count / resumeWords : 0
    let warning: string | undefined

    if (density > 0.08) {
      warning = `"${kw.keyword}"密度过高(${(density * 100).toFixed(1)}%)，可能被判定为关键词堆砌`
    }
    if (count > 5) {
      warning = `"${kw.keyword}"出现${count}次，建议控制在3次以内`
    }

    return { keyword: kw.keyword, weight: kw.weight, matched: found, count, density, warning }
  })

  // 统计
  const coreKeywords = matches.filter(m => m.weight === 'core')
  const secondaryKeywords = matches.filter(m => m.weight === 'secondary')

  const coreMatched = coreKeywords.filter(m => m.matched).length
  const secondaryMatched = secondaryKeywords.filter(m => m.matched).length

  // ---- 关键词得分（基准50分） ----
  const coreMatchRate = coreKeywords.length > 0 ? coreMatched / coreKeywords.length : 0
  const secondaryMatchRate = secondaryKeywords.length > 0 ? secondaryMatched / secondaryKeywords.length : 0
  const finalKeywordScore = Math.min(100, Math.round(50 + coreMatchRate * 40 + secondaryMatchRate * 10))

  // ---- 格式检查（更温和） ----
  const formatIssues: FormatIssue[] = checkFormat(resumeText)
  const formatErrors = formatIssues.filter(i => i.type === 'error').length
  const formatWarnings = formatIssues.filter(i => i.type === 'warning').length
  const formatScore = Math.max(30, Math.min(100, 75 - formatErrors * 8 - formatWarnings * 4))

  // ---- 结构完整性（只扣大分，不扣小分） ----
  const structureIssues: string[] = checkStructure(resumeText)
  const hasContact = /\b1[3-9]\d{9}\b/.test(resumeText) || /[\w.-]+@[\w.-]+\.\w+/.test(resumeText)
  const structureScore = Math.max(30, Math.min(100, 65 - structureIssues.length * 10 + (hasContact ? 5 : 0)))

  // ---- 总分：关键词50% + 格式28% + 结构22% ----
  const totalScore = Math.round(finalKeywordScore * 0.50 + formatScore * 0.28 + structureScore * 0.22)

  // ---- 等级 ----
  let level: 'excellent' | 'good' | 'moderate' | 'weak'
  if (totalScore >= 80) level = 'excellent'
  else if (totalScore >= 65) level = 'good'
  else if (totalScore >= 45) level = 'moderate'
  else level = 'weak'

  // 缺失关键词
  const missingCore = coreKeywords.filter(m => !m.matched).map(m => m.keyword)
  const missingSecondary = secondaryKeywords.filter(m => !m.matched).map(m => m.keyword)

  // 密度警告
  const densityWarnings = matches.filter(m => m.warning).map(m => m.warning!)

  // ATS 优化建议
  const atsTips = generateATSTips({
    totalScore, keywordScore: finalKeywordScore, formatScore, structureScore,
    missingCore, densityWarnings, formatIssues, structureIssues,
  })

  // 针对性改进建议
  const improvedSections = generateImprovements(resumeText, missingCore, missingSecondary, formatIssues)

  return {
    totalScore, level,
    keywordScore: finalKeywordScore,
    formatScore,
    structureScore,
    jdKeywords, matches,
    missingCore, missingSecondary, densityWarnings,
    formatIssues, structureIssues,
    atsTips, improvedSections,
  }
}

// ====== 格式检查 ======
function checkFormat(resumeText: string): FormatIssue[] {
  const issues: FormatIssue[] = []

  // 检查是否有表格/制表符（ATS无法读取表格）
  if (resumeText.includes('\t') || resumeText.includes('┌') || resumeText.includes('├') || resumeText.includes('│')) {
    issues.push({ type: 'error', item: '表格格式', detail: '检测到表格或制表符格式。ATS系统无法读取表格中的文字，请改为纯文本排版' })
  }

  // 检查特殊符号
  const specialChars = resumeText.match(/[●◆▪▸►▻▷▶▹►▪▫◇◆]/g)
  if (specialChars && specialChars.length > 3) {
    issues.push({ type: 'warning', item: '特殊符号过多', detail: '检测到装饰性符号，部分ATS可能无法正确解析，建议替换为普通编号(1. 2. 3.)' })
  }

  // 检查是否有图片（文本中无法检测，但提醒）
  if (!resumeText.includes('教育背景') && !resumeText.includes('教育经历') && !resumeText.includes('学历')) {
    issues.push({ type: 'warning', item: '缺少教育背景', detail: '未检测到"教育背景/学历"等关键词，ATS会检查此模块' })
  }

  // 检查联系方式
  const hasPhone = /\b1[3-9]\d{9}\b/.test(resumeText)
  const hasEmail = /\b[\w.-]+@[\w.-]+\.\w+\b/.test(resumeText)
  if (!hasPhone) {
    issues.push({ type: 'warning', item: '缺少手机号', detail: '未检测到手机号码，ATS和HR都需要联系方式' })
  }
  if (!hasEmail) {
    issues.push({ type: 'warning', item: '缺少邮箱', detail: '未检测到邮箱地址' })
  }

  // 检查是否包含个人信息表头（阈值放宽到30字符）
  if (resumeText.trim().length < 30) {
    issues.push({ type: 'error', item: '简历内容过短', detail: '简历内容不足30字符，请粘贴完整简历' })
  }

  // 检查是否有emoji
  const emojis = resumeText.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu)
  if (emojis && emojis.length > 2) {
    issues.push({ type: 'warning', item: '包含Emoji', detail: '简历中包含Emoji表情，ATS系统可能无法正确解析，建议删除' })
  }

  if (issues.filter(i => i.type !== 'warning').length === 0 && issues.length === 0) {
    issues.push({ type: 'ok', item: '基本格式检查通过', detail: '未检测到明显格式问题' })
  }

  return issues
}

// ====== 结构完整性检查 ======
function checkStructure(resumeText: string): string[] {
  const issues: string[] = []
  const requiredSections = [
    { name: '个人信息/联系方式', patterns: ['手机', '邮箱', '电话', '手机号'] },
    { name: '教育背景', patterns: ['教育背景', '教育经历', '学历', '学校', '大学', '学院'] },
    { name: '工作/实习经历', patterns: ['工作经历', '实习经历', '工作经验', '项目经验'] },
    { name: '技能', patterns: ['技能', '专业技能', '技术栈', '掌握'] },
  ]

  for (const section of requiredSections) {
    const found = section.patterns.some(p => resumeText.includes(p))
    if (!found) {
      issues.push(`缺少"${section.name}"模块，ATS通常期望简历包含此部分`)
    }
  }

  // 检查是否有量化数据
  const hasNumbers = /\d+%/.test(resumeText) || /\d+人/.test(resumeText) || /\d+万/.test(resumeText) || /提升了?\d/.test(resumeText)
  if (!hasNumbers) {
    issues.push('未检测到量化成果（如"提升30%"、"管理10人团队"），建议用数据量化工作成果')
  }

  return issues
}

// ====== ATS 建议生成 ======
interface TipInput {
  totalScore: number; keywordScore: number; formatScore: number; structureScore: number
  missingCore: string[]; densityWarnings: string[]; formatIssues: FormatIssue[]; structureIssues: string[]
}
function generateATSTips(input: TipInput): string[] {
  const tips: string[] = []

  if (input.missingCore.length > 0) {
    tips.push(`【紧急】在简历中补充以下核心关键词（JD高频词）：${input.missingCore.slice(0, 5).join('、')}`)
  }

  if (input.densityWarnings.length > 0) {
    tips.push('【重要】存在关键词堆砌风险，建议均匀分布关键词而非重复堆砌')
  }

  if (input.formatIssues.some(i => i.type === 'error')) {
    tips.push('【格式】排除格式错误后再提交。ATS无法读取表格、图片中的文字')
  }

  if (!input.structureIssues.length) {
    tips.push('建议文件格式使用.docx（兼容性最好），文件名格式为"姓名_学校_应聘岗位_手机号"')
  }

  // 通用高分技巧
  tips.push('使用JD原文关键词（而非同义词），ATS的语义关联功能不可靠')
  tips.push('每段经历使用"强动词+关键词+量化结果"结构，如"通过A/B测试优化落地页，转化率提升25%"')
  tips.push('同一关键词出现2-3次最佳，切忌超过5次')

  return tips
}

// ====== 针对性改进建议 ======
function generateImprovements(
  resumeText: string,
  missingCore: string[],
  _unusedSecondary: string[],
  formatIssues: FormatIssue[]
): { original: string; improved: string; reason: string }[] {
  const improvements: { original: string; improved: string; reason: string }[] = []

  // 针对缺失关键词的建议
  if (missingCore.length > 0) {
    const exampleKW = missingCore.slice(0, 2)
    improvements.push({
      original: '(简历中未找到相关表述)',
      improved: `在"工作经历"或"项目经验"部分加入与"${exampleKW.join('"、"')}"相关的具体工作内容`,
      reason: `JD明确要求的核心关键词缺失，ATS会自动筛掉不匹配的简历`,
    })
  }

  // 针对格式问题
  const tableIssue = formatIssues.find(i => i.item === '表格格式')
  if (tableIssue) {
    improvements.push({
      original: '(检测到表格格式)',
      improved: '将表格内容转换为纯文本段落，使用缩进或项目符号(·)分隔不同条目',
      reason: 'ATS扫描表格时可能读取为乱序文本，导致关键信息无法被识别',
    })
  }

  // 检查是否有弱动词
  const weakVerbs = ['负责', '参与', '协助', '帮忙']
  for (const verb of weakVerbs) {
    if (resumeText.includes(verb)) {
      const replaceMap: Record<string, string> = {
        '负责': '主导/管理/推动',
        '参与': '协同/贡献/推进',
        '协助': '配合/支持/促成',
        '帮忙': '协助/支援',
      }
      improvements.push({
        original: `"${verb}"属于弱动词，缺乏主动性和影响力`,
        improved: `替换为"${replaceMap[verb]}"等强动词。如"负责公众号运营"→"主导公众号运营，粉丝增长200%"`,
        reason: '强动词显著提升ATS的关键词权重评分',
      })
      break // 只提一次
    }
  }

  return improvements
}

// ====== 简历优化改写（这个用AI） ======
export function buildResumePolishPrompt(resumeText: string, _jdKeywords: string[], missingCore: string[]): string {
  if (missingCore.length === 0) return ''
  return `你是简历优化专家。根据以下JD核心关键词，改写简历中的相关经历，自然地融入缺失的关键词。

【需要融入的关键词】
${missingCore.join('、')}

【改写要求】
1. 保持原意真实，不编造经历
2. 使用"强动词+关键词+量化结果"的句式
3. 关键词密度控制在2-3%以内，不堆砌
4. 输出3-5条改写后的经历描述，每条标注对应原经历的哪部分

【原简历】
${resumeText.slice(0, 2000)}

请直接输出改写建议。`
}
