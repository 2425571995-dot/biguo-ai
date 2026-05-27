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
