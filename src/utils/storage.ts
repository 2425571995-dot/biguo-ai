import { HISTORY_LIMIT } from '../constants'
import type { HistoryItem } from '../types'

// ===== 每日额度 =====

export function getDailyCount(): { count: number; date: string } {
  const today = new Date().toISOString().slice(0, 10)
  const saved = localStorage.getItem('xhs_daily')
  if (saved) {
    const parsed = JSON.parse(saved)
    if (parsed.date === today) return parsed
  }
  return { count: 0, date: today }
}

export function saveDailyCount(count: number) {
  const today = new Date().toISOString().slice(0, 10)
  localStorage.setItem('xhs_daily', JSON.stringify({ count, date: today }))
}

// ===== 访问统计 =====

export function addVisitStat() {
  const key = 'xhs_visits'
  const raw = localStorage.getItem(key)
  const today = new Date().toISOString().slice(0, 10)
  if (raw) {
    const visits = JSON.parse(raw)
    if (!visits.dates.includes(today)) {
      visits.dates.push(today)
      visits.total++
      localStorage.setItem(key, JSON.stringify(visits))
    }
  } else {
    localStorage.setItem(key, JSON.stringify({ total: 1, dates: [today] }))
  }
}

export function getVisitCount(): number {
  try { return JSON.parse(localStorage.getItem('xhs_visits') || '{}').total || 0 } catch { return 0 }
}

// ===== 生成统计 =====

export function addGenStat() {
  const key = 'xhs_gen'
  const raw = localStorage.getItem(key)
  const today = new Date().toISOString().slice(0, 10)
  if (raw) {
    const stat = JSON.parse(raw)
    stat.total++
    const day = stat.days.find((d: any) => d.date === today)
    if (day) day.count++
    else stat.days.push({ date: today, count: 1 })
    localStorage.setItem(key, JSON.stringify(stat))
  } else {
    localStorage.setItem(key, JSON.stringify({ total: 1, days: [{ date: today, count: 1 }] }))
  }
}

export function getGenCount(): number {
  try { return JSON.parse(localStorage.getItem('xhs_gen') || '{}').total || 0 } catch { return 0 }
}

// ===== API Key =====

export function getApiKey(): string {
  return localStorage.getItem('xhs_key') || ''
}

export function saveApiKey(key: string) {
  localStorage.setItem('xhs_key', key)
}

// ===== 暗黑模式 =====

export function getDarkMode(): boolean {
  return localStorage.getItem('xhs_dark') === 'true'
}

export function saveDarkMode(dark: boolean) {
  localStorage.setItem('xhs_dark', String(dark))
}

// ===== 历史记录 =====

export function getHistory(): HistoryItem[] {
  try { return JSON.parse(localStorage.getItem('xhs_history') || '[]') } catch { return [] }
}

export function addHistory(item: Omit<HistoryItem, 'id'>): HistoryItem[] {
  const history = getHistory()
  const newItem: HistoryItem = { ...item, id: Date.now().toString() }
  history.unshift(newItem)
  if (history.length > HISTORY_LIMIT) history.length = HISTORY_LIMIT
  localStorage.setItem('xhs_history', JSON.stringify(history))
  return history
}

export function deleteHistory(id: string): HistoryItem[] {
  const history = getHistory().filter(h => h.id !== id)
  localStorage.setItem('xhs_history', JSON.stringify(history))
  return history
}

export function clearHistory(): HistoryItem[] {
  localStorage.setItem('xhs_history', '[]')
  return []
}

// ===== 会员状态 =====

export interface MembershipInfo {
  active: boolean
  plan: string        // 'monthly' | 'yearly' | 'lifetime'
  expiresAt: string   // ISO date string, lifetime 为 '9999-12-31'
  activatedAt: string
}

export function getMembership(): MembershipInfo | null {
  try {
    const raw = localStorage.getItem('xhs_member')
    if (!raw) return null
    const info: MembershipInfo = JSON.parse(raw)
    // 检查是否过期（lifetime 永不过期）
    if (info.plan === 'lifetime') return info
    if (new Date(info.expiresAt) > new Date()) return info
    // 已过期
    localStorage.removeItem('xhs_member')
    return null
  } catch { return null }
}

export function activateMembership(plan: string): MembershipInfo {
  const now = new Date()
  let expiresAt: Date
  if (plan === 'monthly') expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  else if (plan === 'yearly') expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
  else expiresAt = new Date('9999-12-31') // lifetime

  const info: MembershipInfo = {
    active: true,
    plan,
    expiresAt: expiresAt.toISOString(),
    activatedAt: now.toISOString(),
  }
  localStorage.setItem('xhs_member', JSON.stringify(info))
  return info
}

export function isMemberActive(): boolean {
  return getMembership()?.active === true
}

// ===== 卡密（简单的本地校验，格式: XHS-XXXX-XXXX） =====

const VALID_CODES: Record<string, string> = {
  // 卡密 → 套餐ID映射（你发卡密时在这里添加）
  // 'XHS-DEMO-TEST': 'lifetime',
}

export function redeemCode(code: string): { success: boolean; plan?: string; message: string } {
  const upper = code.toUpperCase()
  if (VALID_CODES[upper]) {
    const plan = VALID_CODES[upper]
    activateMembership(plan)
    return { success: true, plan, message: `✅ 卡密兑换成功！已开通${plan === 'lifetime' ? '永久' : plan === 'monthly' ? '月卡' : '年卡'}会员` }
  }
  return { success: false, message: '❌ 卡密无效，请检查后重试' }
}
