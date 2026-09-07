import { useState, useEffect } from 'react'
import { TopBar } from './TopBar'
import { PreviewPanel } from './PreviewPanel'
import { LivePanel } from './LivePanel'
import { LeftRail } from './LeftRail'
import { ThemeDesigner } from '../theme/ThemeDesigner'
import { useThemeStore } from '../../stores/themeStore'
import { useBroadcastSend } from '../../hooks/useBroadcast'

export function OperatorView() {
  const [themeOpen, setThemeOpen] = useState(false)
  const theme = useThemeStore((s) => s.theme)
  const send = useBroadcastSend()

  // Debounced theme sync to output window — fires 120ms after any theme change
  useEffect(() => {
    const t = setTimeout(() => send({ type: 'THEME_UPDATE', theme }), 120)
    return () => clearTimeout(t)
  }, [theme, send])

  return (
    <div className="h-screen flex flex-col bg-bg overflow-hidden">
      <TopBar themeOpen={themeOpen} onToggleTheme={() => setThemeOpen((o) => !o)} />

      <div className="flex flex-1 overflow-hidden">
        <LeftRail />

        {/* Main split */}
        <div className="flex flex-1 gap-4 p-4 overflow-auto min-w-0">
          <PreviewPanel />
          <div className="w-px bg-white/6 flex-shrink-0" />
          <LivePanel />
        </div>

        {/* Theme drawer */}
        {themeOpen && <ThemeDesigner onClose={() => setThemeOpen(false)} />}
      </div>
    </div>
  )
}
