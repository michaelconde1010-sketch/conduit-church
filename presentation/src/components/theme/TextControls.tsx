import { useThemeStore } from '../../stores/themeStore'

export function TextControls() {
  const { theme, setTheme } = useThemeStore()

  return (
    <div className="space-y-5">
      {/* Alignment */}
      <div className="flex flex-col gap-2">
        <label className="text-[11px] text-white/50">Alignment</label>
        <div className="flex gap-1">
          {(['left', 'center', 'right'] as const).map((align) => {
            const icons = { left: '⇤', center: '⇔', right: '⇥' }
            return (
              <button
                key={align}
                onClick={() => setTheme({ textAlign: align })}
                className={`flex-1 py-2 rounded text-sm border transition-all ${
                  theme.textAlign === align
                    ? 'bg-gold/10 border-gold/40 text-gold'
                    : 'bg-surface2 border-white/8 text-white/45 hover:border-white/20 hover:text-white/70'
                }`}
                title={align}
              >
                {icons[align]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Transition */}
      <div className="flex flex-col gap-2">
        <label className="text-[11px] text-white/50">Transition</label>
        <div className="flex gap-1">
          {(['cut', 'fade', 'slide'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme({ transition: t })}
              className={`flex-1 py-1.5 rounded text-[11px] capitalize border transition-all ${
                theme.transition === t
                  ? 'bg-gold/10 border-gold/40 text-gold'
                  : 'bg-surface2 border-white/8 text-white/45 hover:border-white/20 hover:text-white/70'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Text Shadow */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[12px] text-white/70">Text shadow</div>
          <div className="text-[11px] text-white/30 mt-0.5">Improves legibility on video</div>
        </div>
        <button
          onClick={() => setTheme({ textShadow: !theme.textShadow })}
          className={`relative w-10 h-5 rounded-full border transition-all ${
            theme.textShadow
              ? 'bg-gold/20 border-gold/40'
              : 'bg-surface2 border-white/15'
          }`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
              theme.textShadow ? 'left-5 bg-gold' : 'left-0.5 bg-white/30'
            }`}
          />
        </button>
      </div>

      {/* Padding */}
      <div className="flex flex-col gap-3">
        <label className="text-[11px] text-white/50">Padding</label>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-white/40">Horizontal</span>
            <span className="text-[11px] text-gold tabular-nums">{theme.padding.x} cqw</span>
          </div>
          <input
            type="range"
            min="2"
            max="20"
            step="0.5"
            value={theme.padding.x}
            onChange={(e) =>
              setTheme({ padding: { ...theme.padding, x: parseFloat(e.target.value) } })
            }
            className="w-full accent-gold h-1 cursor-pointer"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-white/40">Vertical</span>
            <span className="text-[11px] text-gold tabular-nums">{theme.padding.y} cqh</span>
          </div>
          <input
            type="range"
            min="2"
            max="20"
            step="0.5"
            value={theme.padding.y}
            onChange={(e) =>
              setTheme({ padding: { ...theme.padding, y: parseFloat(e.target.value) } })
            }
            className="w-full accent-gold h-1 cursor-pointer"
          />
        </div>
      </div>

      {/* Lower Third */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[12px] text-white/70">Lower third mode</div>
            <div className="text-[11px] text-white/30 mt-0.5">Bar at bottom of screen</div>
          </div>
          <button
            onClick={() =>
              setTheme({
                lowerThird: { ...theme.lowerThird, enabled: !theme.lowerThird.enabled },
              })
            }
            className={`relative w-10 h-5 rounded-full border transition-all ${
              theme.lowerThird.enabled
                ? 'bg-gold/20 border-gold/40'
                : 'bg-surface2 border-white/15'
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
                theme.lowerThird.enabled ? 'left-5 bg-gold' : 'left-0.5 bg-white/30'
              }`}
            />
          </button>
        </div>

        {theme.lowerThird.enabled && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-white/40">Bar opacity</span>
              <span className="text-[11px] text-gold tabular-nums">
                {Math.round(theme.lowerThird.barOpacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.3"
              max="1"
              step="0.05"
              value={theme.lowerThird.barOpacity}
              onChange={(e) =>
                setTheme({
                  lowerThird: {
                    ...theme.lowerThird,
                    barOpacity: parseFloat(e.target.value),
                  },
                })
              }
              className="w-full accent-gold h-1 cursor-pointer"
            />
          </div>
        )}
      </div>
    </div>
  )
}
