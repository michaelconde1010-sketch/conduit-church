import { useState } from 'react'
import { FontControls } from './FontControls'
import { BackgroundControls } from './BackgroundControls'
import { TextControls } from './TextControls'
import { TranslationPicker } from './TranslationPicker'
import { PresetManager } from './PresetManager'

type Tab = 'font' | 'background' | 'text' | 'translation' | 'presets'

const TABS: Array<{ id: Tab; label: string; icon: string }> = [
  { id: 'font', label: 'Font', icon: 'A' },
  { id: 'background', label: 'BG', icon: '▣' },
  { id: 'text', label: 'Text', icon: '≡' },
  { id: 'translation', label: 'Bible', icon: '✦' },
  { id: 'presets', label: 'Presets', icon: '◈' },
]

interface Props {
  onClose: () => void
}

export function ThemeDesigner({ onClose }: Props) {
  const [tab, setTab] = useState<Tab>('font')

  return (
    <div
      className="flex flex-col border-l border-white/8 bg-surface"
      style={{ width: 300, flexShrink: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
        <span className="text-[10px] tracking-[4px] uppercase text-gold font-medium">
          Theme
        </span>
        <button
          onClick={onClose}
          className="text-white/30 hover:text-white/70 transition-colors text-lg leading-none"
          title="Close"
        >
          ×
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-white/8">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[9px] tracking-wide uppercase transition-all border-b-2 ${
              tab === t.id
                ? 'text-gold border-gold'
                : 'text-white/30 border-transparent hover:text-white/55'
            }`}
          >
            <span className="text-[13px] leading-none">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'font' && <FontControls />}
        {tab === 'background' && <BackgroundControls />}
        {tab === 'text' && <TextControls />}
        {tab === 'translation' && <TranslationPicker />}
        {tab === 'presets' && <PresetManager />}
      </div>
    </div>
  )
}
