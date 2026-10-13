// ====== 体检报告分享图（Canvas 生成，零后端）======
// 用户保存图片发求职群 = 免费获客。图上只放自有域名，不放任何联系方式。
import { makeQR } from './qr'

const SITE = 'https://biguoai.top/#resume'

const COLORS = {
  excellent: { main: '#16a34a', soft: '#f0fdf4', label: '可以投，直接冲' },
  good: { main: '#f59e0b', soft: '#fffbeb', label: '补齐缺口再投，过筛率翻倍' },
  moderate: { main: '#f97316', soft: '#fff7ed', label: '建议先优化再投' },
  weak: { main: '#ef4444', soft: '#fef2f2', label: '对这家公司基本过不了筛' },
}

export interface ShareCardInput {
  score: number
  level: 'excellent' | 'good' | 'moderate' | 'weak'
  jobCategory?: string
  matched: number
  missing: number
}

/** 生成分享图并返回 PNG Blob */
export async function buildShareCard(input: ShareCardInput): Promise<Blob> {
  const W = 800, H = 1000
  const cv = document.createElement('canvas')
  cv.width = W; cv.height = H
  const g = cv.getContext('2d')!
  const c = COLORS[input.level]

  // 背景
  g.fillStyle = '#f0f4f8'
  g.fillRect(0, 0, W, H)

  // 顶部色带
  const grad = g.createLinearGradient(0, 0, W, 260)
  grad.addColorStop(0, '#1e3a8a')
  grad.addColorStop(0.55, c.main)
  grad.addColorStop(1, '#7c3aed')
  g.fillStyle = grad
  g.fillRect(0, 0, W, 300)

  // 品牌
  g.fillStyle = '#ffffff'
  g.font = 'bold 30px "Microsoft YaHei", sans-serif'
  g.fillText('毕过AI · ATS 简历体检', 48, 78)
  g.font = '22px "Microsoft YaHei", sans-serif'
  g.fillStyle = 'rgba(255,255,255,0.85)'
  g.fillText(input.jobCategory ? `目标岗位：${input.jobCategory}` : '简历 × 岗位JD 匹配度', 48, 118)

  // 分数
  g.fillStyle = '#ffffff'
  g.font = 'bold 150px "Microsoft YaHei", sans-serif'
  g.fillText(String(input.score), 48, 262)
  const scoreW = g.measureText(String(input.score)).width
  g.font = 'bold 34px "Microsoft YaHei", sans-serif'
  g.fillStyle = 'rgba(255,255,255,0.75)'
  g.fillText('/100', 56 + scoreW, 262)

  // 白卡片
  const cardY = 340, cardH = 420
  g.fillStyle = '#ffffff'
  roundRect(g, 40, cardY, W - 80, cardH, 20)
  g.fill()

  // 结论
  g.fillStyle = c.main
  g.font = 'bold 34px "Microsoft YaHei", sans-serif'
  g.fillText(c.label, 76, cardY + 70)

  // 命中 / 缺失
  g.font = '26px "Microsoft YaHei", sans-serif'
  g.fillStyle = '#16a34a'
  g.fillText(`✅ 命中 ${input.matched} 个关键词`, 76, cardY + 140)
  g.fillStyle = '#ef4444'
  g.fillText(`⚠️ 缺失 ${input.missing} 个关键词`, 76, cardY + 186)

  // 分隔线
  g.strokeStyle = '#e2e8f0'
  g.lineWidth = 2
  g.beginPath(); g.moveTo(76, cardY + 224); g.lineTo(W - 76, cardY + 224); g.stroke()

  // 说明
  g.fillStyle = '#475569'
  g.font = '24px "Microsoft YaHei", sans-serif'
  g.fillText('八成简历死在机器筛选这一步。', 76, cardY + 278)
  g.fillText('不是经历不行，是关键词没对上。', 76, cardY + 318)
  g.fillStyle = '#2563eb'
  g.font = 'bold 24px "Microsoft YaHei", sans-serif'
  g.fillText('贴简历 + 贴 JD，10 秒出同款报告', 76, cardY + 372)

  // 二维码
  const qrSize = 200
  const qrX = 76, qrY = 790
  try {
    const m = makeQR(SITE)
    const n = m.length
    const cell = Math.floor(qrSize / n)
    const realSize = cell * n
    g.fillStyle = '#ffffff'
    roundRect(g, qrX - 10, qrY - 10, realSize + 20, realSize + 20, 10)
    g.fill()
    g.fillStyle = '#000000'
    for (let r = 0; r < n; r++) for (let col = 0; col < n; col++) {
      if (m[r][col]) g.fillRect(qrX + col * cell, qrY + r * cell, cell, cell)
    }
  } catch {
    g.fillStyle = '#94a3b8'
    g.font = '18px "Microsoft YaHei", sans-serif'
    g.fillText('（扫码见图片下方网址）', qrX, qrY + 100)
  }

  // 右侧文字
  g.fillStyle = '#1e293b'
  g.font = 'bold 30px "Microsoft YaHei", sans-serif'
  g.fillText('biguoai.top', qrX + 250, qrY + 78)
  g.fillStyle = '#64748b'
  g.font = '22px "Microsoft YaHei", sans-serif'
  g.fillText('扫码免费测一次', qrX + 250, qrY + 118)
  g.fillText('不用登录，不用装软件', qrX + 250, qrY + 152)

  return new Promise<Blob>((resolve, reject) => {
    cv.toBlob((b) => (b ? resolve(b) : reject(new Error('导出图片失败'))), 'image/png')
  })
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath()
  g.moveTo(x + r, y)
  g.arcTo(x + w, y, x + w, y + h, r)
  g.arcTo(x + w, y + h, x, y + h, r)
  g.arcTo(x, y + h, x, y, r)
  g.arcTo(x, y, x + w, y, r)
  g.closePath()
}

/** 触发下载 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
