import type { ToastMessage } from '../types'

interface ToastProps {
  toasts: ToastMessage[]
  onRemove: (id: number) => void
}

const typeStyles: Record<ToastMessage['type'], string> = {
  success: 'bg-gradient-to-r from-pink-500 to-rose-500 text-white',
  error: 'bg-gradient-to-r from-red-500 to-red-600 text-white',
  warning: 'bg-gradient-to-r from-amber-400 to-orange-400 text-white',
}

export default function Toast({ toasts, onRemove }: ToastProps) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => onRemove(t.id)}
          className={`animate-toast-in px-5 py-2.5 rounded-full shadow-lg cursor-pointer text-sm font-medium ${typeStyles[t.type]}`}
        >
          {t.text}
        </div>
      ))}
    </div>
  )
}
