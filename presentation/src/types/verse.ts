import type { BibleTranslation, ThemeBackground } from './theme'

export interface DetectedVerse {
  id: string
  ref: string
  text: string
  translation: BibleTranslation
  confidence: number
  detectedAt: number
  source: 'speech' | 'ai' | 'manual'
}

export interface VerseOverride {
  editedText?: string
  translation?: BibleTranslation
  bodyFontSize?: number
  background?: ThemeBackground
}

export interface StagedVerse {
  verse: DetectedVerse
  overrides?: VerseOverride
}
