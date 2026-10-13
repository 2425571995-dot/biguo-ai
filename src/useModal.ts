import { useEffect } from 'react'

/**
 * 弹窗通用交互：按 Esc 关闭 + 锁定背景滚动。
 * 用原生 alert() 之外的模态都需要它，否则移动端只能靠点遮罩，容易误触。
 */
export function useModal(onClose: () => void, active = true) {
  useEffect(() => {
    if (!active) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)

    // 锁定背景滚动，避免弹窗内滚动带动页面
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose, active])
}
