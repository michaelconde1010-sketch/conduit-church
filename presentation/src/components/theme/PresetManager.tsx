import { useState } from 'react'
import { useThemeStore } from '../../stores/themeStore'

export function PresetManager() {
  const { presets, savePreset, loadPreset, deletePreset, theme } = useThemeStore()
  const [newName, setNewName] = useState('')
  const [saved, setSaved] = useState(false)

  function handleSave() {
    const name = newName.trim()
    if (!name) return
    savePreset(name)
    setNewName('')
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const builtIn = presets.filter((p) => p.builtIn)
  const custom = presets.filter((p) => !p.builtIn)

  return (
    <div className="space-y-5">
      {/* Save current */}
      <div className="space-y-2">
        <label className="text-[11px] text-white/50">Save current theme as</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="Preset name…"
            maxLength={40}
            className="flex-1 bg-surface2 border border-white/10 rounded px-3 py-1.5 text-[12px] text-white/80 placeholder:text-white/25 focus:outline-none focus:border-gold/40"
          />
          <button
            onClick={handleSave}
            disabled={!newName.trim()}
            className={`px-3 py-1.5 rounded text-[12px] font-medium border transition-all ${
              saved
                ? 'bg-[#4caf7d]/15 border-[#4caf7d]/40 text-[#4caf7d]'
                : newName.trim()
                ? 'bg-gold/10 border-gold/40 text-gold hover:bg-gold/20'
                : 'bg-surface2 border-white/8 text-white/25 cursor-not-allowed'
            }`}
          >
            {saved ? '✓' : 'Save'}
          </button>
        </div>
      </div>

      {/* Built-in */}
      <div className="space-y-1.5">
        <div className="text-[10px] tracking-[3px] uppercase text-white/25 mb-2">Built-in</div>
        {builtIn.map((p) => (
          <div
            key={p.id}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all ${
              p.theme.id === theme.id || p.id === theme.id
                ? 'bg-gold/8 border-gold/30'
                : 'bg-surface2 border-white/8 hover:border-white/15'
            }`}
          >
            <div
              className="w-8 h-5 rounded flex-shrink-0 border border-white/10"
              style={{ background: p.theme.background.type === 'gradient'
                ? `linear-gradient(135deg, ${p.theme.background.gradient.from}, ${p.theme.background.gradient.to})`
                : p.theme.background.color
              }}
            />
            <span className="flex-1 text-[12px] text-white/70">{p.name}</span>
            <button
              onClick={() => loadPreset(p.id)}
              className="text-[11px] text-gold/70 hover:text-gold transition-colors"
            >
              Load
            </button>
          </div>
        ))}
      </div>

      {/* Custom */}
      {custom.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] tracking-[3px] uppercase text-white/25 mb-2">Saved</div>
          {custom.map((p) => (
            <div
              key={p.id}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all ${
                p.id === theme.id
                  ? 'bg-gold/8 border-gold/30'
                  : 'bg-surface2 border-white/8 hover:border-white/15'
              }`}
            >
              <div
                className="w-8 h-5 rounded flex-shrink-0 border border-white/10"
                style={{ background: p.theme.background.type === 'gradient'
                  ? `linear-gradient(135deg, ${p.theme.background.gradient.from}, ${p.theme.background.gradient.to})`
                  : p.theme.background.color
                }}
              />
              <span className="flex-1 text-[12px] text-white/70 truncate">{p.name}</span>
              <button
                onClick={() => loadPreset(p.id)}
                className="text-[11px] text-gold/70 hover:text-gold transition-colors"
              >
                Load
              </button>
              <button
                onClick={() => deletePreset(p.id)}
                className="text-[11px] text-white/25 hover:text-red-400 transition-colors ml-1"
                title="Delete"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {custom.length === 0 && (
        <p className="text-[11px] text-white/25 text-center py-2">
          No saved presets yet
        </p>
      )}
    </div>
  )
}
