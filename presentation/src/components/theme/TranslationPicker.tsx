import { useThemeStore } from '../../stores/themeStore'
import { TRANSLATIONS } from '../../types/theme'
import type { BibleTranslation } from '../../types/theme'

const DESCRIPTIONS: Record<BibleTranslation, string> = {
  KJV: 'King James Version',
  NIV: 'New International Version',
  ESV: 'English Standard Version',
  NKJV: 'New King James Version',
  NLT: 'New Living Translation',
  AMP: 'Amplified Bible',
}

export function TranslationPicker() {
  const { theme, setTheme } = useThemeStore()

  return (
    <div className="space-y-3">
      <p className="text-[12px] text-white/40 leading-relaxed">
        Sets the default translation for newly staged verses. You can override per-verse in Phase 2.
      </p>

      <div className="space-y-1.5">
        {TRANSLATIONS.map((t) => (
          <button
            key={t}
            onClick={() => setTheme({ translation: t })}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${
              theme.translation === t
                ? 'bg-gold/8 border-gold/35 text-white'
                : 'bg-surface2 border-white/8 text-white/55 hover:border-white/18 hover:text-white/75'
            }`}
          >
            <span
              className={`text-[11px] font-bold tracking-wider w-10 flex-shrink-0 ${
                theme.translation === t ? 'text-gold' : 'text-white/35'
              }`}
            >
              {t}
            </span>
            <span className="text-[12px]">{DESCRIPTIONS[t]}</span>
            {theme.translation === t && (
              <span className="ml-auto text-gold text-xs">✓</span>
            )}
          </button>
        ))}
      </div>

      <p className="text-[11px] text-white/25 leading-relaxed pt-1">
        NIV, ESV, NKJV, NLT, AMP require the Netlify API proxy (configured with a Bible API key).
        KJV fetches directly from bible-api.com.
      </p>
    </div>
  )
}
