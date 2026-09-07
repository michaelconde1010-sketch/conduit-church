import { useThemeStore } from '../../stores/themeStore'
import { MediaLibrary } from '../media/MediaLibrary'
import type { ThemeBackground } from '../../types/theme'

const GRADIENT_DIRECTIONS = [
  { label: '↓', value: '180deg' },
  { label: '↘', value: '135deg' },
  { label: '→', value: '90deg' },
  { label: '↗', value: '45deg' },
]

const DARK_SWATCHES = ['#0a0a0f', '#0d0d1a', '#050505', '#0a0e12', '#1a0808', '#0a1408']
const LIGHT_SWATCHES = ['#f5f4ef', '#ffffff', '#e8e4d9', '#1a1a22', '#0e1117', '#1e1e2e']

export function BackgroundControls() {
  const { theme, setTheme } = useThemeStore()
  const bg = theme.background

  const update = (patch: Partial<ThemeBackground>) =>
    setTheme({ background: { ...bg, ...patch } })

  const updateGradient = (patch: Partial<typeof bg.gradient>) =>
    setTheme({ background: { ...bg, gradient: { ...bg.gradient, ...patch } } })

  const tabs: Array<ThemeBackground['type']> = ['solid', 'gradient', 'image']

  return (
    <div className="space-y-4">
      {/* Type tabs */}
      <div className="flex gap-1 bg-surface2 rounded-lg p-1">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => update({ type: t })}
            className={`flex-1 py-1.5 rounded text-[11px] capitalize transition-all ${
              bg.type === t
                ? 'bg-surface3 text-white border border-white/10'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {bg.type === 'solid' && (
        <div className="space-y-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-white/50">Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bg.color}
                onChange={(e) => update({ color: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer border border-white/10 bg-transparent p-0.5"
              />
              <span className="text-[11px] text-white/50 font-mono">{bg.color}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-white/35">Dark presets</label>
            <div className="flex gap-1.5 flex-wrap">
              {DARK_SWATCHES.map((c) => (
                <button
                  key={c}
                  onClick={() => update({ color: c })}
                  className="w-7 h-7 rounded border border-white/10 hover:scale-110 transition-transform"
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-white/35">Light presets</label>
            <div className="flex gap-1.5 flex-wrap">
              {LIGHT_SWATCHES.map((c) => (
                <button
                  key={c}
                  onClick={() => update({ color: c })}
                  className="w-7 h-7 rounded border border-white/15 hover:scale-110 transition-transform"
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {bg.type === 'gradient' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-white/50">From</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bg.gradient.from}
                  onChange={(e) => updateGradient({ from: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer border border-white/10 bg-transparent p-0.5"
                />
                <span className="text-[10px] text-white/40 font-mono">{bg.gradient.from}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-white/50">To</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bg.gradient.to}
                  onChange={(e) => updateGradient({ to: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer border border-white/10 bg-transparent p-0.5"
                />
                <span className="text-[10px] text-white/40 font-mono">{bg.gradient.to}</span>
              </div>
            </div>
          </div>

          {/* Gradient preview */}
          <div
            className="h-10 rounded border border-white/10"
            style={{
              background: `linear-gradient(${bg.gradient.direction}, ${bg.gradient.from}, ${bg.gradient.to})`,
            }}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-white/50">Direction</label>
            <div className="flex gap-1">
              {GRADIENT_DIRECTIONS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => updateGradient({ direction: value })}
                  className={`flex-1 py-1.5 rounded text-sm border transition-all ${
                    bg.gradient.direction === value
                      ? 'bg-gold/10 border-gold/40 text-gold'
                      : 'bg-surface2 border-white/8 text-white/45 hover:border-white/20'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {bg.type === 'image' && <MediaLibrary />}
    </div>
  )
}
