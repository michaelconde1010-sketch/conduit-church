import type { StagedVerse } from './verse'
import type { Theme } from './theme'

export type BroadcastPayload =
  | { type: 'VERSE_LIVE'; staged: StagedVerse; theme: Theme }
  | { type: 'CLEAR_SCREEN' }
  | { type: 'FREEZE_TOGGLE'; frozen: boolean }
  | { type: 'LOGO_SCREEN'; src: string | null }
  | { type: 'DISPLAY_MODE'; mode: 'fullscreen' | 'lowerthird' }
  | { type: 'THEME_UPDATE'; theme: Theme }
  | { type: 'ALERT'; text: string; position: 'top' | 'center' | 'bottom'; duration: number }
  | { type: 'ALERT_DISMISS' }
  | { type: 'COUNTDOWN'; seconds: number }
