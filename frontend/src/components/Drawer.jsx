import { useEffect } from 'react'
import { X } from 'lucide-react'

/**
 * Reusable slide-in drawer from the right.
 *
 * Props:
 *   open       {boolean}   – whether the drawer is visible
 *   onClose    {fn}        – called when user clicks backdrop or X
 *   title      {string}    – drawer heading
 *   subtitle   {string}    – optional description line below title
 *   children   {ReactNode} – form content
 *   footer     {ReactNode} – action buttons rendered in the footer bar
 *   width      {string}    – optional CSS width (default '480px')
 */
export default function Drawer({ open, onClose, title, subtitle, children, footer, width = '480px' }) {
  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="drawer-root" aria-modal="true" role="dialog">
      {/* Backdrop */}
      <div className="drawer-backdrop" onClick={onClose} />

      {/* Panel */}
      <aside className="drawer-panel" style={{ width }}>
        {/* Header */}
        <div className="drawer-header">
          <div className="drawer-header-text">
            <h2 className="drawer-title">{title}</h2>
            {subtitle && <p className="drawer-subtitle">{subtitle}</p>}
          </div>
          <button className="drawer-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="drawer-body">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="drawer-footer">
            {footer}
          </div>
        )}
      </aside>
    </div>
  )
}
