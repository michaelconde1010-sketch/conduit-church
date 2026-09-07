import { useState } from 'react'
import { usePresentationStore } from '../../stores/presentationStore'
import { useAlertStore } from '../../stores/alertStore'
import { useOutputWindow } from '../../hooks/useOutputWindow'
import { useBroadcastSend } from '../../hooks/useBroadcast'
import { AlertComposer } from '../controls/AlertComposer'
import { SettingsPanel } from '../controls/SettingsPanel'

interface Props {
  themeOpen: boolean
  onToggleTheme: () => void
}

export function TopBar({ themeOpen, onToggleTheme }: Props) {
  const live = usePresentationStore((s) => s.live)
  const isFrozen = usePresentationStore((s) => s.isFrozen)
  const displayMode = usePresentationStore((s) => s.displayMode)
  const clearScreen = usePresentationStore((s) => s.clearScreen)
  const toggleFreeze = usePresentationStore((s) => s.toggleFreeze)
  const setDisplayMode = usePresentationStore((s) => s.setDisplayMode)

  const send = useBroadcastSend()
  const { open: openOutput } = useOutputWindow()

  const [countdownOpen, setCountdownOpen] = useState(false)
  const [countdownMins, setCountdownMins] = useState('5')
  const [alertOpen, setAlertOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const activeAlert = useAlertStore((s) => s.current)

  function handleClear() {
    clearScreen()
    send({ type: 'CLEAR_SCREEN' })
  }

  function handleFreeze() {
    const next = !isFrozen
    toggleFreeze()
    send({ type: 'FREEZE_TOGGLE', frozen: next })
  }

  function handleModeToggle() {
    const next = displayMode === 'fullscreen' ? 'lowerthird' : 'fullscreen'
    setDisplayMode(next)
    send({ type: 'DISPLAY_MODE', mode: next })
  }

  function handleStartCountdown() {
    const secs = Math.max(1, parseInt(countdownMins || '5', 10)) * 60
    send({ type: 'COUNTDOWN', seconds: secs })
    setCountdownOpen(false)
  }

  function handleStopCountdown() {
    send({ type: 'COUNTDOWN', seconds: 0 })
  }

  return (
    <div className="h-12 flex items-center px-4 border-b border-white/8 gap-2.5 flex-shrink-0 bg-surface relative">
      {/* Logo + title */}
      <div className="flex items-center gap-2.5 mr-1.5">
        <img
          src="/logo.png"
          alt=""
          className="w-6 h-6 object-contain"
          style={{ mixBlendMode: 'screen', filter: 'drop-shadow(0 0 4px rgba(201,168,76,0.4))' }}
          onError={(e) => { ;(e.target as HTMLImageElement).style.display = 'none' }}
        />
        <span className="font-cinzel text-gold text-[13px] tracking-[5px] uppercase">
          Conduit
        </span>
      </div>

      <div className="h-4 w-px bg-white/10" />

      {/* Live status */}
      <div className="flex items-center gap-1.5 text-[11px] min-w-0">
        {live ? (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-[#4caf7d] flex-shrink-0" />
            <span className="text-[#4caf7d] truncate">{live.verse.ref}</span>
          </>
        ) : (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-white/15 flex-shrink-0" />
            <span className="text-white/30">Screen clear</span>
          </>
        )}
      </div>

      <div className="flex-1" />

      {/* Output controls */}
      <div className="flex items-center gap-1.5">

        {/* Alert / message */}
        <div className="relative">
          <button
            onClick={() => { setAlertOpen((o) => !o); setSettingsOpen(false); setCountdownOpen(false) }}
            className={`px-2.5 py-1 rounded text-[11px] border transition-all ${
              activeAlert
                ? 'bg-gold/12 border-gold/45 text-gold'
                : alertOpen
                ? 'bg-white/5 border-white/22 text-white/75'
                : 'border-white/10 text-white/45 hover:border-white/20 hover:text-white/70'
            }`}
            title="Send a message to the screen"
          >
            {activeAlert ? '💬 Showing' : '💬'}
          </button>
          {alertOpen && <AlertComposer onClose={() => setAlertOpen(false)} />}
        </div>

        {/* Countdown */}
        <div className="relative">
          <button
            onClick={() => { setCountdownOpen((o) => !o); setAlertOpen(false); setSettingsOpen(false) }}
            className="px-2.5 py-1 rounded text-[11px] border border-white/10 text-white/45 hover:border-white/20 hover:text-white/70 transition-all"
            title="Countdown timer"
          >
            ⏱
          </button>
          {countdownOpen && (
            <div className="absolute right-0 top-9 bg-surface2 border border-white/12 rounded-lg p-3 shadow-xl z-50 w-44">
              <div className="text-[10px] text-white/40 mb-2 tracking-widest uppercase">Countdown</div>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={countdownMins}
                  onChange={(e) => setCountdownMins(e.target.value)}
                  className="w-14 bg-surface border border-white/10 rounded px-2 py-1 text-[12px] text-white/80 focus:outline-none focus:border-gold/40"
                />
                <span className="text-[11px] text-white/40">minutes</span>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={handleStartCountdown}
                  className="flex-1 py-1.5 rounded text-[11px] bg-gold/10 border border-gold/35 text-gold hover:bg-gold/20 transition-all"
                >
                  Start
                </button>
                <button
                  onClick={handleStopCountdown}
                  className="flex-1 py-1.5 rounded text-[11px] border border-white/10 text-white/45 hover:border-white/20 transition-all"
                >
                  Stop
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Display mode */}
        <button
          onClick={handleModeToggle}
          className={`px-2.5 py-1 rounded text-[11px] border transition-all ${
            displayMode === 'lowerthird'
              ? 'bg-gold/10 border-gold/40 text-gold'
              : 'border-white/10 text-white/45 hover:border-white/20 hover:text-white/70'
          }`}
          title={displayMode === 'fullscreen' ? 'Switch to lower third' : 'Switch to full screen'}
        >
          {displayMode === 'fullscreen' ? '⊡ Full' : '▬ Lower'}
        </button>

        {/* Open output window */}
        <button
          onClick={openOutput}
          className="px-2.5 py-1 rounded text-[11px] border border-white/10 text-white/50 hover:border-white/22 hover:text-white/80 transition-all"
        >
          ⊞ Output
        </button>

        {live && (
          <>
            <div className="h-4 w-px bg-white/10" />

            <button
              onClick={handleFreeze}
              className={`px-2.5 py-1 rounded text-[11px] border transition-all ${
                isFrozen
                  ? 'bg-amber-500/15 border-amber-400/40 text-amber-400'
                  : 'border-white/10 text-white/45 hover:border-white/20 hover:text-white/70'
              }`}
            >
              {isFrozen ? '⏸ Frozen' : '⏸ Freeze'}
            </button>

            <button
              onClick={handleClear}
              className="px-2.5 py-1 rounded text-[11px] border border-red-500/25 text-red-400/70 hover:border-red-500/45 hover:text-red-400 transition-all"
            >
              Clear
            </button>
          </>
        )}

        <div className="h-4 w-px bg-white/10" />

        <button
          onClick={onToggleTheme}
          className={`px-2.5 py-1 rounded text-[11px] border transition-all ${
            themeOpen
              ? 'bg-gold/10 border-gold/40 text-gold'
              : 'border-white/10 text-white/50 hover:border-white/20 hover:text-white/75'
          }`}
        >
          Theme
        </button>

        {/* Settings */}
        <div className="relative">
          <button
            onClick={() => { setSettingsOpen((o) => !o); setAlertOpen(false); setCountdownOpen(false) }}
            className={`px-2.5 py-1 rounded text-[11px] border transition-all ${
              settingsOpen
                ? 'bg-white/5 border-white/22 text-white/75'
                : 'border-white/10 text-white/45 hover:border-white/20 hover:text-white/70'
            }`}
            title="Settings"
          >
            ⚙
          </button>
          {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
        </div>
      </div>
    </div>
  )
}
