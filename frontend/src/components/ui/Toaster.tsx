import { CheckCircle } from '@phosphor-icons/react'
import { hideToast, useToastStore } from '@/stores/toastStore'

/**
 * 피그마 Toast — #111 88% · 흰 글자 13 Medium. 테마와 상관없이 같은 색이에요.
 * 하단 바가 있는 화면에서는 바 위 16에 떠요 (--toast-bottom을 하단 바가 정해요).
 */
export function Toaster() {
  const toast = useToastStore((s) => s.toast)
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 z-50 flex justify-center px-5"
      style={{ bottom: 'calc(var(--toast-bottom, 0px) + 16px + env(safe-area-inset-bottom))' }}
    >
      {toast && (
        <div
          key={toast.id}
          role="status"
          className="pointer-events-auto flex min-h-12 animate-toast-in items-center gap-2 rounded-button bg-[#111111]/88 px-4 py-3 text-body-m-13 text-white shadow-3"
        >
          {toast.icon && <CheckCircle size={20} aria-hidden />}
          <span>{toast.message}</span>
          {toast.action && (
            <button
              type="button"
              className="-my-2 ml-2 px-1 py-2 text-label-13 text-white underline-offset-2 hover:underline"
              onClick={() => {
                toast.action?.onClick()
                hideToast(toast.id)
              }}
            >
              {toast.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
