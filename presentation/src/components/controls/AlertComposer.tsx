import { useState } from 'react'
import { useAlertStore } from '../../stores/alertStore'
import type { AlertPosition } from '../../stores/alertStore'
import { useBroadcastSend } from '../../hooks/useBroadcast'

const DURATIONS = [
  { label: '5s', value: 5000 },
  { label: '10s', value: 10000 },
  { label: '30s', value: 30000 },
  { label: 'Hold', value: 0 },
]

interface Props {
  onClose: () => void
}

export function AlertComposer({ onClose }: Props) {
  const { current, saved, setAlert, addSaved, removeSaved } = useAlertStore()
  const send = useBroadcastSend()

  const [text, setText] = useState('')
  const [position, setPosition] = useState<AlertPosition>('bottom')
  const [duration, setDuration] = useState(10000)

  function handleSend(message?: string) {
    const t = (message ?? text).trim()
    if (!t) return
    const alert = { text: t, position, duration }
    setAlert(alert)
    send({ type: 'ALERT', text: t, position, duration })
    if (!message) setText('')
  }

  function handleDismiss() {
    setAlert(null)
    send({ type: 'ALERT_DISMISS' })
  }

  return (
    <div className="absolute right-0 top-9 bg-surface2 border border-white/12 rounded-lg p-3 shadow-2xl z-50 w-72 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] tracking-[3px] uppercase text-white/40">Message</span>
        <button
          onClick={onClose}
          className="text-white/25 hover:text-white/60 transition-colors leading-none"
        >
          ×
        </button>
      </div>

      {/* Currently showing */}
      {current && (
        <div className="flex items-center gap-2 px-2.5 py-2 rounded bg-gold/8 border border-gold/25">
          <span className="w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" />
          <span className="text-[11px] text-white/70 truncate flex-1">{current.text}</span>
          <button
            onClick={handleDismiss}
            className="text-[10px] text-white/40 hover:text-white/75 transition-colors flex-shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Composer */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
        }}
        rows={2}
        maxLength={140}
        placeholder="Type a message for the screen…"
        className="w-full bg-surface border border-white/10 rounded px-2.5 py-2 text-[12px] text-white/80 placeholder:text-white/22 focus:outline-none focus:border-gold/40 resize-none leading-relaxed"
      />

      {/* Position */}
      <div className="space-y-1.5">
        <label className="text-[10px] text-white/35">Position</label>
        <div className="flex gap-1">
          {(['top', 'center', 'bottom'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPosition(p)}
              className={`flex-1 py-1 rounded text-[10px] capitalize border transition-all ${
                position === p
                  ? 'bg-gold/10 border-gold/40 text-gold'
                  : 'bg-surface border-white/8 text-white/40 hover:border-white/20'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div className="space-y-1.5">
        <label className="text-[10px] text-white/35">Duration</label>
        <div className="flex gap-1">
          {DURATIONS.map((d) => (
            <button
              key={d.label}
              onClick={() => setDuration(d.value)}
              className={`flex-1 py-1 rounded text-[10px] border transition-all ${
                duration === d.value
                  ? 'bg-gold/10 border-gold/40 text-gold'
                  : 'bg-surface border-white/8 text-white/40 hover:border-white/20'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-1.5">
        <button
          onClick={() => handleSend()}
          disabled={!text.trim()}
          className={`flex-1 py-1.5 rounded text-[11px] font-medium border transition-all ${
            text.trim()
              ? 'bg-gold/10 border-gold/40 text-gold hover:bg-gold/20'
              : 'bg-surface border-white/8 text-white/20 cursor-not-allowed'
          }`}
        >
          Show on Screen
        </button>
        {text.trim() && !saved.includes(text.trim()) && (
          <button
            onClick={() => addSaved(text.trim())}
            className="px-2.5 py-1.5 rounded text-[11px] border border-white/10 text-white/40 hover:text-white/70 hover:border-white/22 transition-all"
            title="Save for reuse"
          >
            ★
          </button>
        )}
      </div>

      {/* Saved messages */}
      {saved.length > 0 && (
        <div className="space-y-1 pt-1 border-t border-white/8">
          <div className="text-[10px] text-white/28 pt-1.5">Quick messages</div>
          {saved.map((s) => (
            <div key={s} className="flex items-center gap-1.5 group">
              <button
                onClick={() => handleSend(s)}
                className="flex-1 text-left px-2 py-1.5 rounded text-[11px] text-white/55 hover:text-white hover:bg-white/5 transition-colors truncate"
              >
                {s}
              </button>
              <button
                onClick={() => removeSaved(s)}
                className="text-[10px] text-white/0 group-hover:text-white/25 hover:!text-red-400/80 transition-colors px-1"
                title="Remove"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
