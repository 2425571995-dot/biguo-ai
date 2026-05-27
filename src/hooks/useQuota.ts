import { useState } from 'react'
import { DAILY_LIMIT } from '../constants'
import { getDailyCount, saveDailyCount } from '../utils/storage'

export function useQuota() {
  const [dailyCount, setDailyCount] = useState(() => getDailyCount().count)
  const remaining = Math.max(0, DAILY_LIMIT - dailyCount)

  const incrementCount = () => {
    const newCount = dailyCount + 1
    setDailyCount(newCount)
    saveDailyCount(newCount)
  }

  const resetCount = () => {
    setDailyCount(0)
    saveDailyCount(0)
  }

  return { dailyCount, remaining, incrementCount, resetCount, DAILY_LIMIT }
}
