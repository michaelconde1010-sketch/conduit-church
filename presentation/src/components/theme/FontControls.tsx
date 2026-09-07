import { useThemeStore } from '../../stores/themeStore'
import type { ThemeFont } from '../../types/theme'
import { FONT_FAMILIES } from '../../types/theme'

function FontSection({
  label,
  font,
  onChange,
}: {
  label: string
  font: ThemeFont
  onChange: (updates: Partial<ThemeFont>) => void
}) {
  return (
    <div className="space-y-3">
      <div className="text-[10px] tracking-[3px] uppercase text-white/35 font-medium pb-2 border-b border-white/8">
        {label}
      </div>

      {/* Family */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] text-white/50">Family</label>
        <select
          value={font.family}
          onChange={(e) => onChange({ family: e.target.value })}
          className="w-full bg-surface2 border border-white/10 rounded px-2.5 py-1.5 text-[12px] text-white/80 focus:outline-none focus:border-gold/40"
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f} value={f} style={{ fontFamily: f }}>
              {f}
            </option>
          ))}
        </select>
      </div>

      {/* Size */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] text-white/50">Size</label>
          <span className="text-[11px] text-gold tabular-nums">{font.size.toFixed(1)} cqw</span>
        </div>
        <input
          type="range"
          min="1"
          max="14"
          step="0.1"
          value={font.size}
          onChange={(e) => onChange({ size: parseFloat(e.target.value) })}
          className="w-full accent-gold h-1 cursor-pointer"
        />
      </div>

      {/* Color */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] text-white/50">Color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={font.color}
            onChange={(e) => onChange({ color: e.target.value })}
            className="w-8 h-8 rounded cursor-pointer border border-white/10 bg-transparent p-0.5"
          />
          <span className="text-[11px] text-white/50 font-mono">{font.color}</span>
          <div className="flex gap-1 ml-auto">
            {['#ffffff', '#e8e4d9', '#c9a84c', '#d4c5a0', '#8cb4d2'].map((c) => (
              <button
                key={c}
                onClick={() => onChange({ color: c })}
                className="w-5 h-5 rounded-sm border border-white/10 hover:scale-110 transition-transform"
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Weight */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] text-white/50">Weight</label>
        <div className="flex gap-1">
          {([300, 400, 600, 700] as const).map((w) => (
            <button
              key={w}
              onClick={() => onChange({ weight: w })}
              className={`flex-1 py-1 rounded text-[11px] border transition-all ${
                font.weight === w
                  ? 'bg-gold/10 border-gold/40 text-gold'
                  : 'bg-surface2 border-white/8 text-white/45 hover:border-white/20 hover:text-white/70'
              }`}
              style={{ fontWeight: w }}
            >
              {w}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function FontControls() {
  const { theme, setTheme } = useThemeStore()

  return (
    <div className="space-y-6">
      <FontSection
        label="Body Text"
        font={theme.bodyFont}
        onChange={(u) => setTheme({ bodyFont: { ...theme.bodyFont, ...u } })}
      />
      <FontSection
        label="Verse Reference"
        font={theme.refFont}
        onChange={(u) => setTheme({ refFont: { ...theme.refFont, ...u } })}
      />
    </div>
  )
}
