// ====== 轻量转化埋点 ======
// 设计目标：零后端、零依赖，静态站也能看到「弹窗 → 付款」漏斗。
//
// 数据去向（三选一或全开）：
//   1) 始终写入 localStorage 环形缓冲 —— 本机调试用，后台面板可直接查看
//   2) 配置 BAIDU_TONGJI_ID 后，额外上报自定义事件 —— 可看全站聚合漏斗（推荐）
//   3) 配置 TRACK_ENDPOINT 后，额外 POST JSON —— 接自建/第三方统计
//
// 隐私：只记录事件名与匿名属性，不采集论文/简历正文，不采集 API Key。

const EVENTS_KEY = 'biguoai_events'
const MAX_EVENTS = 300

// TODO(用户): 注册 https://tongji.baidu.com → 管理 → 获取代码 → 把 hm.js? 后面的 ID 填这里
// 形如 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6'。留空则只在本机记录，不上报。
export const BAIDU_TONGJI_ID = ''

// TODO(用户): 想接自建/第三方统计端点时填完整 URL（会 POST JSON），留空则不发送
export const TRACK_ENDPOINT = ''

export interface TrackEvent {
  e: string
  t: number
  p?: Record<string, string | number | boolean>
}

declare global {
  interface Window {
    _hmt?: unknown[][]
  }
}

function read(): TrackEvent[] {
  try {
    const raw = localStorage.getItem(EVENTS_KEY)
    return raw ? (JSON.parse(raw) as TrackEvent[]) : []
  } catch { return [] }
}

/** 记录一个转化事件 */
export function track(event: string, props?: TrackEvent['p']): void {
  const item: TrackEvent = { e: event, t: Date.now(), ...(props ? { p: props } : {}) }

  // 1) 本机环形缓冲
  try {
    const list = read()
    list.push(item)
    if (list.length > MAX_EVENTS) list.splice(0, list.length - MAX_EVENTS)
    localStorage.setItem(EVENTS_KEY, JSON.stringify(list))
  } catch { /* 隐私模式 / 配额满，忽略 */ }

  // 2) 百度统计自定义事件
  if (BAIDU_TONGJI_ID) {
    window._hmt = window._hmt || []
    window._hmt.push(['_trackEvent', 'biguoai', event, props ? JSON.stringify(props) : '-'])
  }

  // 3) 自定义端点（失败静默，绝不阻塞 UI）
  if (TRACK_ENDPOINT) {
    try {
      void fetch(TRACK_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
        keepalive: true,
      }).catch(() => { /* ignore */ })
    } catch { /* ignore */ }
  }
}

/** 读取本机事件（时间正序） */
export function getEvents(): TrackEvent[] { return read() }

/** 清空本机事件 */
export function clearEvents(): void {
  try { localStorage.removeItem(EVENTS_KEY) } catch { /* ignore */ }
}

/** 加载百度统计脚本（仅在配置了 ID 时） */
export function initAnalytics(): void {
  if (!BAIDU_TONGJI_ID) return
  if (document.getElementById('baidu-tongji')) return
  window._hmt = window._hmt || []
  const s = document.createElement('script')
  s.id = 'baidu-tongji'
  s.async = true
  s.src = 'https://hm.baidu.com/hm.js?' + BAIDU_TONGJI_ID
  document.head.appendChild(s)
}

// ====== 漏斗定义（顺序即漏斗层级） ======
export interface FunnelStep { label: string; event: string }

export const RESUME_FUNNEL: FunnelStep[] = [
  { label: '① 打开简历体检', event: 'view_resume' },
  { label: '② 跑检测', event: 'resume_analyze' },
  { label: '③ 点解锁', event: 'resume_unlock_click' },
  { label: '④ 付费弹窗打开', event: 'resume_pay_modal' },
  { label: '⑤ 输码解锁成功', event: 'resume_verify_ok' },
]

export const PAPER_FUNNEL: FunnelStep[] = [
  { label: '① 打开论文助手', event: 'view_paper' },
  { label: '② 生成结果', event: 'paper_analyze' },
  { label: '③ 付费弹窗打开', event: 'paper_pay_modal' },
  { label: '④ 输码激活成功', event: 'paper_verify_ok' },
]

export const AIGC_FUNNEL: FunnelStep[] = [
  { label: '① 打开 AIGC 自查', event: 'view_aigc' },
  { label: '② 跑检测', event: 'aigc_analyze' },
  { label: '③ 展开人工服务', event: 'aigc_service_toggle' },
]

/** 统计各步骤在本机事件里的次数 */
export function countFunnel(steps: FunnelStep[]): { label: string; count: number }[] {
  const events = read()
  return steps.map((s) => ({
    label: s.label,
    count: events.filter((e) => e.e === s.event).length,
  }))
}
