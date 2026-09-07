export type BibleTranslation = 'NIV' | 'KJV' | 'ESV' | 'NKJV' | 'NLT' | 'AMP'

export interface ThemeFont {
  family: string
  /** Size in cqw units (container-query width %). E.g. 5 = 5cqw */
  size: number
  color: string
  weight: 300 | 400 | 600 | 700
}

export interface ThemeBackground {
  type: 'solid' | 'gradient' | 'image'
  color: string
  gradient: { from: string; to: string; direction: string }
  imageId: string | null
}

export interface Theme {
  id: string
  name: string
  /** Styles the verse body text */
  bodyFont: ThemeFont
  /** Styles the verse reference ("John 3:16 · KJV") */
  refFont: ThemeFont
  textAlign: 'left' | 'center' | 'right'
  textShadow: boolean
  /** Padding in cqw (x) and cqh (y) units */
  padding: { x: number; y: number }
  background: ThemeBackground
  translation: BibleTranslation
  lowerThird: { enabled: boolean; barOpacity: number }
  transition: 'cut' | 'fade' | 'slide'
}

export interface Preset {
  id: string
  name: string
  theme: Theme
  builtIn: boolean
}

export const FONT_FAMILIES = [
  'Cormorant Garamond',
  'Cinzel',
  'Playfair Display',
  'Lora',
  'Raleway',
  'Montserrat',
] as const

export const TRANSLATIONS: BibleTranslation[] = ['KJV', 'NIV', 'ESV', 'NKJV', 'NLT', 'AMP']
