import { useState } from 'react'
import { useDetectionStore } from '../../stores/detectionStore'

interface Props {
  onClose: () => void
}

const STATUS_COPY: Record<string, { label: string; tone: string }> = {
  unknown:      { label: 'Not yet used this session', tone: 'rgba(255,255,255,0.3)' },
  ready:        { label: 'Active', tone: '#4caf7d' },
  unconfigured: { label: 'Not configured', tone: 'rgba(255,255,255,0.35)' },
  rate_limited: { label: 'Rate limited', tone: '#e8a23a' },
  error:        { label: 'Error', tone: '#e85858' },
}

export function SettingsPanel({ onClose }: Props) {
  const { confThreshold, sermonPlan, aiStatus, aiMessage, setConfThreshold, setSermonPlan } =
    useDetectionStore()

  const [planDraft, setPlanDraft] = useState(sermonPlan.join('\n'))
  const [savedFlash, setSavedFlash] = useState(false)

  function save() {
    setSermonPlan(
      planDraft.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 20)
    )
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1400)
  }

  const status = STATUS_COPY[aiStatus] ?? STATUS_COPY.unknown

  return (
    <div className="absolute right-0 top-9 bg-surface2 border border-white/12 rounded-lg p-3.5 shadow-2xl z-50 w-80 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] tracking-[3px] uppercase text-white/40">Settings</span>
        <button
          onClick={onClose}
          className="text-white/25 hover:text-white/60 transition-colors leading-none"
        >
          ×
        </button>
      </div>

      {/* AI status */}
      <div className="space-y-1.5">
        <label className="text-[11px] text-white/50">AI detection</label>
        <div className="flex items-center gap-2 px-2.5 py-2 rounded bg-surface border border-white/8">
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: status.tone }}
          />
          <span className="text-[11px]" style={{ color: status.tone }}>
            {status.label}
          </span>
        </div>
        {aiMessage && (
          <p className="text-[10px] text-white/35 leading-relaxed">{aiMessage}</p>
        )}
        <p className="text-[10px] text-white/25 leading-relaxed">
          Catches paraphrases like “the eagle verse” → Isaiah 40:31. Direct references
          work without it. The API key lives on the server — set{' '}
          <code className="text-gold/70">ANTHROPIC_API_KEY</code> in your Netlify
          environment variables.
        </p>
      </div>

      {/* Confidence */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] text-white/50">Confidence threshold</label>
          <span className="text-[11px] text-gold tabular-nums">{confThreshold}%</span>
        </div>
        <input
          type="range"
          min="50"
          max="99"
          step="1"
          value={confThreshold}
          onChange={(e) => setConfThreshold(parseInt(e.target.value, 10))}
          className="w-full accent-gold h-1 cursor-pointer"
        />
        <p className="text-[10px] text-white/22 leading-relaxed">
          Higher means fewer, surer AI suggestions.
        </p>
      </div>

      {/* Sermon plan */}
      <div className="space-y-1.5">
        <label className="text-[11px] text-white/50">Sermon plan</label>
        <textarea
          value={planDraft}
          onChange={(e) => setPlanDraft(e.target.value)}
          rows={4}
          placeholder={'John 10:10\nRomans 8:28\nJeremiah 29:11'}
          className="w-full bg-surface border border-white/10 rounded px-2.5 py-2 text-[11px] text-white/80 placeholder:text-white/20 focus:outline-none focus:border-gold/40 resize-none leading-relaxed font-mono"
        />
        <p className="text-[10px] text-white/22 leading-relaxed">
          One reference per line. Vague mentions get matched against these first.
        </p>
      </div>

      <button
        onClick={save}
        className={`w-full py-1.5 rounded text-[11px] font-medium border transition-all ${
          savedFlash
            ? 'bg-[#4caf7d]/15 border-[#4caf7d]/40 text-[#4caf7d]'
            : 'bg-gold/10 border-gold/40 text-gold hover:bg-gold/20'
        }`}
      >
        {savedFlash ? '✓ Saved' : 'Save'}
      </button>
    </div>
  )
}
