import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

type ToastType = 'success' | 'error'

type ToastItem = {
  id: number
  message: string
  type: ToastType
}

type ToastContextValue = {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4200)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed bottom-4 right-4 z-[5000] flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0">
          {toasts.map((item) => (
            <div
              key={item.id}
              className={`pointer-events-auto animate-[toast-in_0.25s_ease-out] rounded-xl border px-4 py-3 text-sm shadow-xl ${
                item.type === 'success'
                  ? 'border-[color:var(--success)]/30 bg-[color:var(--surface-raised)] text-[color:var(--success)]'
                  : 'border-[color:var(--danger)]/30 bg-[color:var(--surface-raised)] text-[color:var(--danger)]'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0">{item.type === 'success' ? '✓' : '✕'}</span>
                <span className="text-[color:var(--ink)]/90">{item.message}</span>
              </div>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return ctx
}
