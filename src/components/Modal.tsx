import { useEffect, useState, type ReactNode } from 'react'

type ModalProps = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  maxWidth?: string
}

export default function Modal({ open, onClose, title, children, footer, maxWidth = 'max-w-lg' }: ModalProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!open) {
      setShow(false)
      return
    }
    const raf = requestAnimationFrame(() => setShow(true))
    return () => cancelAnimationFrame(raf)
  }, [open])

  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${show ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div
        className={`relative w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl transition-all duration-200 ${
          show ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-[#13294b]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">{footer}</div>}
      </div>
    </div>
  )
}
