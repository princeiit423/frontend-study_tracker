import { useEffect, useRef, useState } from 'react'

export default function GlobalApiLoader() {
  const [active, setActive] = useState(false)
  const hideTimer = useRef(null)

  useEffect(() => {
    const handleLoading = (event) => {
      const pending = event.detail?.pending || 0

      if (pending > 0) {
        clearTimeout(hideTimer.current)
        setActive(true)
        return
      }

      clearTimeout(hideTimer.current)
      hideTimer.current = setTimeout(() => setActive(false), 220)
    }

    window.addEventListener('acestudy:api-loading', handleLoading)
    return () => {
      clearTimeout(hideTimer.current)
      window.removeEventListener('acestudy:api-loading', handleLoading)
    }
  }, [])

  if (!active) return null

  return (
    <div className="fixed inset-0 z-[2500] flex flex-col items-center justify-center gap-4 bg-background/72 backdrop-blur-xl">
      <div className="api-loader-stage">
        <div className="api-loader-orbit" />
        <div className="api-loader-card">
          <img src="/brand-mark.svg" alt="" className="api-loader-mark" />
          <div className="api-loader-word" aria-label="AceStudy loading">AceStudy</div>
          <div className="api-loader-scan" />
        </div>
      </div>
      <p className="text-xs font-black uppercase tracking-[0.22em] text-muted-foreground">Loading your workspace</p>
    </div>
  )
}
