import { useState, useMemo, useCallback } from 'react'
import { track } from './analytics'

// ====== AIGC 痕迹检测引擎（纯本地，不上传） ======
interface PatternDef {
  re: RegExp
  t: string      // 类型
  tip: string    // 修改建议
}

const PATTERNS: PatternDef[] = [
  { re: /随着[^，。！？]{2,15}的(不断|快速|飞速|日益)?发展/g, t: '套话开头', tip: '删掉整句，改用具体数据、年份或真实问题直接开场' },
  { re: /(近年来|当今|如今|当下)[，,][^。]{0,25}(日益|越来越|不断|逐渐)/g, t: '套话开头', tip: '去掉宏大开头，直接说这件事和你论文的具体关系' },
  { re: /在[^，。！？]{2,12}的(背景|大背景|形势)下/g, t: '套话开头', tip: '换成一句具体事实，例如某政策/某技术落地的时间点' },
  { re: /众所周知/g, t: '套话开头', tip: '直接删除，四个字全都是AI味' },
  { re: /首先[^。]{0,60}其次[^。]{0,60}(再次|然后|最后)/g, t: '模板结构', tip: '拆成独立段落，用内容自然衔接，不要报菜名' },
  { re: /(综上所述|总而言之|由此可见)[，,]?/g, t: '模板结构', tip: '结尾直接给结论本身，不用「综上所述」垫场' },
  { re: /(值得注意的是|需要注意的是|需要指出的是|不难发现)/g, t: '模板结构', tip: '删除引导语，让观点自己站出来' },
  { re: /与此同时/g, t: '模板结构', tip: '换成具体时间/对象，如「同一批次加工时」' },
  { re: /一方面[^。]{0,60}另一方面/g, t: '模板结构', tip: '拆成两句，长短句交错' },
  { re: /(不仅|不但)[^。]{0,40}(而且|还|同时)[^。]{0,40}/g, t: 'AI万能句式', tip: 'AI最爱「不仅…还…」，拆成两句，或删掉一半信息' },
  { re: /(赋能|深度融合|全方位|多维度|多层次|一体化)/g, t: 'AI热词', tip: '换成具体动作：谁、对什么、做了什么、结果如何' },
  { re: /(具有|有着)重要的?(理论|实践|现实|应用)?(意义|价值)/g, t: 'AI热词', tip: '写出意义的具体指向：省多少时间、解决什么故障' },
  { re: /发挥(着)?(重要|关键|不可替代)的?作用/g, t: 'AI热词', tip: '举例说明作用，别空喊' },
  { re: /为[^，。！？]{2,12}提供了(新|宝贵|重要)?的?(思路|参考|借鉴|依据)/g, t: 'AI热词', tip: '直接说给谁用、用在哪，删掉「提供了宝贵」' },
  { re: /(深入|深刻|全面|系统)地?(探讨|分析|研究|阐述|介绍)/g, t: 'AI热词', tip: '删掉程度副词，动词前面加真实约束（如「针对XX故障」）' },
  { re: /(显著|有效|大大|进一步)(地)?(提升|提高|增强|改善|优化)/g, t: 'AI热词', tip: '全部换成具体数字：节拍、误差、合格率' },
  { re: /(至关重要|不可或缺|大有可为|前景广阔|方兴未艾|势在必行)/g, t: 'AI热词', tip: '成语四连是重灾区，整句重写成大白话' },
  { re: /(旨在|致力于)/g, t: 'AI万能句式', tip: '改成「为了…」或直接写动作' },
  { re: /(本文|本设计|本系统|本课题)主要?(研究|设计|实现|介绍|阐述|分析)了/g, t: '论文模板', tip: '每段都这么开头会连坐，隔段换写法或用问题引出' },
  { re: /通过[^，。！？]{2,25}(实现|达到|完成)了?/g, t: 'AI万能句式', tip: 'AI标准句式，改成「先…再…最后…」的实操过程' },
  { re: /(较好|良好|广阔)的(应用|推广|实用|发展)(价值|前景)/g, t: 'AI热词', tip: '结尾套话，删除或换成一条具体局限+改进方向' },
  { re: /(未来|今后)[^。]{0,15}(展望|发展方向|发展趋势)/g, t: '论文模板', tip: '展望别写空话，写你下一步具体想改哪里' },
  { re: /(综合|统筹|协调)(考虑|兼顾)[^。]{0,20}/g, t: 'AI万能句式', tip: '写出你到底权衡了哪两个具体参数' },
  { re: /(口感|体验|效果)更佳|更胜一筹/g, t: 'AI热词', tip: '口语化重写' },
]

interface FlagItem {
  idx: number
  sentence: string
  type: string
  tip: string
}

interface AnalysisResult {
  score: number
  band: 'low' | 'mid' | 'high'
  bandText: string
  hitCount: number
  flaggedRatio: number
  cv: number
  cvRisk: number
  flags: FlagItem[]
}

function splitSentences(text: string): string[] {
  return text.split(/(?<=[。！？!?；;])/).map(s => s.trim()).filter(s => s.length > 1)
}

function analyze(raw: string): AnalysisResult | null {
  const text = raw.replace(/\s/g, '')
  if (text.length < 50) return null
  const sents = splitSentences(raw)
  const n = sents.length || 1

  const flags: FlagItem[] = []
  let hitCount = 0
  sents.forEach((s, i) => {
    for (const p of PATTERNS) {
      p.re.lastIndex = 0
      if (p.re.test(s)) {
        flags.push({ idx: i, sentence: s, type: p.t, tip: p.tip })
        hitCount++
        break
      }
    }
  })

  const hitRate = hitCount / (text.length / 100)
  const lens = sents.map(s => s.length)
  const mean = lens.reduce((a, b) => a + b, 0) / n
  const sd = Math.sqrt(lens.reduce((a, b) => a + (b - mean) ** 2, 0) / n)
  const cv = mean ? sd / mean : 0
  const cvRisk = Math.max(0, ((0.55 - cv) / 0.55) * 100)
  const s1 = Math.min(100, hitRate * 55)
  const tplRisk = Math.min(100, (flags.length / n) * 130 + (/(随着|近年来|在.{2,12}背景下)/.test(text.slice(0, 40)) ? 15 : 0))
  const score = Math.round(Math.max(5, Math.min(97, s1 * 0.42 + tplRisk * 0.33 + cvRisk * 0.25)))
  const band = score < 30 ? 'low' : score < 60 ? 'mid' : 'high'
  const bandText = band === 'low' ? '低风险 · 基本像人写的' : band === 'mid' ? '中风险 · 有明显AI痕迹' : '高风险 · 建议大改'

  return { score, band, bandText, hitCount, flaggedRatio: flags.length / n, cv, cvRisk, flags }
}

function buildReport(r: AnalysisResult, charLen: number): string {
  let out = `【毕过AI · 论文AIGC痕迹自查报告】\n生成时间：${new Date().toLocaleString('zh-CN')}\n正文长度：${charLen} 字\n\n`
  out += `AI 痕迹风险分：${r.score}/100（${r.bandText}）\n`
  out += `高频句式命中：${r.hitCount} 处\n被标记句子占比：${Math.round(r.flaggedRatio * 100)}%\n句长波动系数：${r.cv.toFixed(2)}（<0.35 偏AI，>0.55 偏人写）\n\n`
  if (r.flags.length) {
    out += `◇ 逐句诊断：\n`
    r.flags.slice(0, 15).forEach(f => {
      out += `  【句${f.idx + 1}】${f.sentence}\n    ⚑ ${f.type}｜✎ ${f.tip}\n`
    })
  } else {
    out += `◇ 未检测到典型 AI 句式，继续保持。\n`
  }
  out += `\n◇ 修改优先级：\n  1. 删「首先/其次/综上所述」类骨架词\n  2. 套话开头换成具体数据/事实\n  3. 万能形容词换成本人实测数字\n  4. 句子长短交错，打破均匀节奏\n\n—— 毕过AI biguoai.top · 全程本地分析，文本未上传`
  return out
}

// ====== Score Ring ======
function ScoreRing({ score, band }: { score: number; band: 'low' | 'mid' | 'high' }) {
  const size = 150
  const strokeWidth = 11
  const radius = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * radius
  const color = band === 'low' ? '#16a34a' : band === 'mid' ? '#f59e0b' : '#ef4444'
  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - score / 100)}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 40, fontWeight: 800, color, lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>风险分 / 100</div>
      </div>
    </div>
  )
}

// ====== Main Component ======
export default function AigcChecker() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [showSop, setShowSop] = useState(false)
  const [showService, setShowService] = useState(false)

  const charCount = useMemo(() => input.replace(/\s/g, '').length, [input])
  const report = useMemo(() => (result ? buildReport(result, charCount) : ''), [result, charCount])

  const handleAnalyze = useCallback(() => {
    const r = analyze(input)
    if (!r) {
      alert('正文太短啦，至少粘贴 50 字以上才有参考价值')
      return
    }
    setResult(r)
    track('aigc_analyze', { score: r.score, band: r.band, chars: charCount, hits: r.hitCount })
    setTimeout(() => document.getElementById('aigc-result')?.scrollIntoView({ behavior: 'smooth' }), 100)
  }, [input, charCount])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(report).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [report])

  const metricBar = (label: string, value: number, color: string, note: string) => (
    <div key={label} style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#5b6b7d', marginBottom: 6 }}>
        <span>{label}</span><span style={{ fontWeight: 600 }}>{note}</span>
      </div>
      <div style={{ height: 7, background: '#eef2f7', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(100, Math.round(value))}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px 60px' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#1e40af,#7c3aed)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>毕</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>毕过<span style={{ color: '#2563eb' }}>AI</span> <span style={{ fontSize: 12, background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: 10, marginLeft: 4 }}>AIGC自查</span></div>
            <div style={{ fontSize: 11, color: '#8a97a6' }}>全程本地分析 · 文字不上传 · 不限次数</div>
          </div>
        </div>
        <a href="#" onClick={e => { e.preventDefault(); window.location.hash = '' }} style={{ fontSize: 12, color: '#2563eb', textDecoration: 'none', padding: '5px 12px', borderRadius: 14, background: '#eff6ff', fontWeight: 500 }}>
          ← 论文助手
        </a>
      </header>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #7c2d12 0%, #dc2626 60%, #f59e0b 100%)', borderRadius: 16, padding: '18px 20px', marginBottom: 16, color: '#fff' }}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>🔬 查重过了，还有一关叫「AI味」</div>
        <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
          粘贴论文段落 → 秒出风险分 + 逐句标红 + 改法建议。检测词库来自 2026 届毕设实战复盘。
        </div>
      </div>

      {/* Input */}
      <div style={{ background: '#fff', border: '1px solid #e3e9f0', borderRadius: 12, padding: 18, boxShadow: '0 2px 12px rgba(20,50,90,.05)', marginBottom: 16 }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="粘贴你的开题报告、论文正文或任意段落（建议 200 字以上，越长约准）……"
          style={{ width: '100%', height: 180, border: '1px solid #d5dde6', borderRadius: 10, padding: 14, fontSize: 14, lineHeight: 1.8, resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
          onFocus={e => (e.target.style.borderColor = '#2563eb')}
          onBlur={e => (e.target.style.borderColor = '#d5dde6')}
        />
        <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={handleAnalyze} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            🔬 开始检测
          </button>
          {result && (
            <button onClick={handleCopy} style={{ background: '#eef2f7', color: '#45566b', border: 'none', borderRadius: 10, padding: '11px 20px', fontSize: 14, cursor: 'pointer' }}>
              {copied ? '已复制 ✓' : '📋 复制自查报告'}
            </button>
          )}
          <span style={{ fontSize: 12, color: '#98a6b6' }}>{charCount} 字</span>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div id="aigc-result" style={{ background: '#fff', border: '1px solid #e3e9f0', borderRadius: 12, padding: 22, boxShadow: '0 2px 12px rgba(20,50,90,.05)' }}>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
            <ScoreRing score={result.score} band={result.band} />
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12, color: result.band === 'low' ? '#16a34a' : result.band === 'mid' ? '#d97706' : '#dc2626' }}>
                {result.bandText}
              </div>
              {metricBar('AI 高频句式命中', result.hitCount ? 100 : 0, '#dc2626', `${result.hitCount} 处命中`)}
              {metricBar('句式模板化程度', result.flaggedRatio * 130, '#d97706', `${Math.round(result.flaggedRatio * 100)}% 句子被标记`)}
              {metricBar('节奏均匀度（越满越像AI）', result.cvRisk, '#2563eb', `句长波动 ${result.cv.toFixed(2)}`)}
            </div>
          </div>

          <h3 style={{ fontSize: 14, margin: '24px 0 12px', paddingLeft: 10, borderLeft: '3px solid #2563eb' }}>逐句诊断（点哪改哪）</h3>
          {result.flags.length === 0 ? (
            <div style={{ color: '#16a34a', fontSize: 13.5, lineHeight: 1.8 }}>
              ✅ 未检测到典型 AI 句式。继续保持：多塞具体数据、多用第一人称、句子长短交错。
            </div>
          ) : (
            <div style={{ maxHeight: 420, overflowY: 'auto' }}>
              {result.flags.map(f => (
                <div key={f.idx} style={{ border: '1px solid #f0d9d9', background: '#fdf7f7', borderRadius: 10, padding: '12px 14px', marginBottom: 10, fontSize: 13.5, lineHeight: 1.75 }}>
                  <div>【句{f.idx + 1}】<span style={{ color: '#c2410c', fontWeight: 600 }}>{f.sentence}</span></div>
                  <div style={{ color: '#8a6a6a', fontSize: 12, marginTop: 4 }}>⚑ 命中「{f.type}」</div>
                  <div style={{ color: '#166534', fontSize: 12.5, marginTop: 4 }}>✎ 建议：{f.tip}</div>
                </div>
              ))}
            </div>
          )}

          <h3 onClick={() => setShowSop(!showSop)} style={{ fontSize: 14, margin: '24px 0 12px', paddingLeft: 10, borderLeft: '3px solid #f59e0b', cursor: 'pointer' }}>
            🛠 降 AI 味四步法（点击展开）
          </h3>
          {showSop && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '14px 16px', fontSize: 13.5, lineHeight: 2 }}>
              ① <b>拆模板</b>：删掉「首先/其次/综上所述」这类骨架词，AI 味直接掉一半。<br />
              ② <b>换主语</b>：把「本文/本系统/该方法」换成「我/我们在调试时/实际加工中发现」，加入第一人称和真实细节。<br />
              ③ <b>塞私货</b>：把万能形容词（显著提升、重要作用）换成你自己的数据：报警几次、节拍多少秒、误差多少毫米。<br />
              ④ <b>乱节奏</b>：长句后面接短句，偶尔来一句 10 字以内的短句。AI 的句子长度太整齐，人不是。
            </div>
          )}

          {/* 转化钩子：人工降AI味（主）+ 简历体检（次） */}
          <div style={{ marginTop: 22, background: 'linear-gradient(135deg,#1e40af,#3b82f6)', borderRadius: 12, padding: '14px 18px', color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>😅 不想自己改？人工降 AI 味服务</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>修订模式留痕 + 前后对比报告，改到安全线为止</div>
              </div>
              <button
                onClick={() => { const next = !showService; setShowService(next); track('aigc_service_toggle', { open: next }) }}
                style={{ background: '#fff', color: '#1e40af', fontSize: 12, border: 'none', padding: '8px 14px', borderRadius: 20, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}
              >
                🛒 查看人工服务
              </button>
            </div>
            {showService && (
              <div style={{ marginTop: 12, padding: '12px 14px', background: 'rgba(255,255,255,0.12)', borderRadius: 10, fontSize: 12.5, lineHeight: 1.9 }}>
                📮 下单方式：<b>闲鱼搜索「毕过AI」</b><br />
                拍下后发我论文全文，交付：修订模式留痕全文 + 前后 AIGC 风险分对比截图 + 一页修改清单。<br />
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>只做改写与自查辅导，不含代写；学校检测结果以官方为准。</span>
              </div>
            )}
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.15)', fontSize: 12 }}>
              <a href="#resume" style={{ color: 'rgba(255,255,255,0.9)', textDecoration: 'none', fontWeight: 500 }}>
                📋 顺手测测简历能过 AI 筛选吗 →
              </a>
            </div>
          </div>
        </div>
      )}

      <footer style={{ textAlign: 'center', fontSize: 11, color: '#a8b4c2', marginTop: 18, lineHeight: 1.8 }}>
        检测结果仅供写作自查参考，非任何官方检测机构结论<br />
        毕过AI biguoai.top · 论文降重 + ATS简历体检 + AIGC自查
      </footer>
    </div>
  )
}
