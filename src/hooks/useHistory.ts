import { useState, useCallback } from 'react'
import type { HistoryItem, Post } from '../types'
import { getHistory, addHistory as addHistoryStorage, deleteHistory as deleteHistoryStorage, clearHistory as clearHistoryStorage } from '../utils/storage'

export function useHistory() {
  const [history, setHistory] = useState<HistoryItem[]>(() => getHistory())

  const addHistoryItem = useCallback((product: string, posts: Post[]) => {
    const updated = addHistoryStorage({
      product,
      posts,
      createdAt: new Date().toLocaleString('zh-CN'),
    })
    setHistory(updated)
  }, [])

  const deleteHistoryItem = useCallback((id: string) => {
    const updated = deleteHistoryStorage(id)
    setHistory(updated)
  }, [])

  const clearAllHistory = useCallback(() => {
    const updated = clearHistoryStorage()
    setHistory(updated)
  }, [])

  return { history, addHistoryItem, deleteHistoryItem, clearAllHistory }
}
