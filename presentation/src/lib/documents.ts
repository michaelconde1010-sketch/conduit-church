// Text extraction from sermon notes: PDF, Word, PowerPoint, and plain text.
//
// Everything runs in the browser — the file is never uploaded. All three parser
// libraries are bundled from node_modules and served from our own origin, so
// they satisfy the page's `script-src 'self'` CSP. They are also loaded on
// demand: none of them reaches the operator unless a matching file is opened.

export type DocKind = 'pdf' | 'docx' | 'pptx' | 'text'

export interface ExtractResult {
  text: string
  kind: DocKind
  /** Human label for the status line, e.g. "Word document" */
  label: string
  /** Pages, slides, or 1 for plain text */
  units: number
  /** "page" | "slide" | null when the unit is not meaningful */
  unitLabel: string | null
  /** True when the document exceeded MAX_UNITS and we stopped early */
  truncated: boolean
}

/** Sermon notes are rarely long; these guard against a mis-picked file. */
export const MAX_UNITS = 60
export const MAX_FILE_BYTES = 25_000_000

/** Sentence-leading form, e.g. "Word document processed — 6 verses found" */
const LABELS: Record<DocKind, string> = {
  pdf: 'PDF',
  docx: 'Word document',
  pptx: 'PowerPoint deck',
  text: 'Text file',
}

/**
 * Mid-sentence form, e.g. "Could not read that PowerPoint deck."
 * Kept separate rather than lower-casing LABELS, which would mangle the
 * proper nouns into "powerpoint deck" and "pdf".
 */
export const KIND_PHRASES: Record<DocKind, string> = {
  pdf: 'PDF',
  docx: 'Word document',
  pptx: 'PowerPoint deck',
  text: 'text file',
}

/** Thrown for problems worth showing the operator verbatim. */
export class ExtractError extends Error {}

// ── Lazy library loading ─────────────────────────────────────────────────────

type PdfJs = typeof import('pdfjs-dist')
let pdfjsPromise: Promise<PdfJs> | null = null

function loadPdfjs(): Promise<PdfJs> {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const [lib, worker] = await Promise.all([
        import('pdfjs-dist'),
        import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
      ])
      lib.GlobalWorkerOptions.workerSrc = worker.default
      return lib
    })().catch((e) => {
      pdfjsPromise = null // let a later attempt retry
      throw e
    })
  }
  return pdfjsPromise
}

interface MammothLike {
  extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<{ value: string }>
}
let mammothPromise: Promise<MammothLike> | null = null

function loadMammoth(): Promise<MammothLike> {
  if (!mammothPromise) {
    // The prebuilt browser bundle — self-contained, no Node built-ins.
    mammothPromise = import('mammoth/mammoth.browser.js')
      .then((m) => ((m as unknown as { default?: MammothLike }).default ?? m) as MammothLike)
      .catch((e) => {
        mammothPromise = null
        throw e
      })
  }
  return mammothPromise
}

type JsZipCtor = typeof import('jszip')
let jszipPromise: Promise<JsZipCtor> | null = null

function loadJsZip(): Promise<JsZipCtor> {
  if (!jszipPromise) {
    jszipPromise = import('jszip')
      .then((m) => (m.default ?? (m as unknown as JsZipCtor)))
      .catch((e) => {
        jszipPromise = null
        throw e
      })
  }
  return jszipPromise
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Strip anything HTML-ish and collapse whitespace before references are parsed. */
function clean(raw: string): string {
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function extensionOf(name: string): string {
  const m = /\.([a-z0-9]+)$/i.exec(name.trim())
  return m ? m[1].toLowerCase() : ''
}

function detectKind(file: File): DocKind | null {
  const ext = extensionOf(file.name)
  if (ext === 'pdf' || file.type === 'application/pdf') return 'pdf'
  if (ext === 'docx') return 'docx'
  if (ext === 'pptx') return 'pptx'
  if (ext === 'txt' || ext === 'md' || ext === 'text') return 'text'
  // Fall back to MIME when the name has no useful extension
  if (file.type === 'text/plain' || file.type === 'text/markdown') return 'text'
  if (file.type.includes('wordprocessingml')) return 'docx'
  if (file.type.includes('presentationml')) return 'pptx'
  return null
}

// ── PDF ──────────────────────────────────────────────────────────────────────

async function extractPdf(file: File): Promise<ExtractResult> {
  const pdfjsLib = await loadPdfjs()
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) })
  const doc = await loadingTask.promise

  try {
    const total = doc.numPages
    const limit = Math.min(total, MAX_UNITS)
    const parts: string[] = []

    for (let i = 1; i <= limit; i++) {
      const page = await doc.getPage(i)
      const content = await page.getTextContent()
      // Each item is a positioned run; joining with spaces is enough for
      // reference detection, which doesn't care about layout.
      parts.push(
        content.items
          .map((it) => (typeof it === 'object' && 'str' in it ? String(it.str) : ''))
          .join(' ')
      )
      page.cleanup()
    }

    return {
      text: clean(parts.join(' ')),
      kind: 'pdf',
      label: LABELS.pdf,
      units: limit,
      unitLabel: 'page',
      truncated: total > limit,
    }
  } finally {
    await loadingTask.destroy() // releases the worker for this document
  }
}

// ── Word ─────────────────────────────────────────────────────────────────────

async function extractDocx(file: File): Promise<ExtractResult> {
  const mammoth = await loadMammoth()
  const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
  return {
    text: clean(value ?? ''),
    kind: 'docx',
    label: LABELS.docx,
    units: 1,
    unitLabel: null,
    truncated: false,
  }
}

// ── PowerPoint ───────────────────────────────────────────────────────────────

const DRAWINGML_NS = 'http://schemas.openxmlformats.org/drawingml/2006/main'

function unescapeXml(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
}

/**
 * Pull the text out of one slide's XML.
 *
 * Runs (<a:t>) inside a paragraph (<a:p>) are joined with no separator on
 * purpose: PowerPoint routinely splits a phrase mid-word across runs, so
 * inserting spaces would turn "John 3:16" into "John 3 :16" and break
 * reference detection. Paragraphs are joined with a space instead.
 */
function textFromSlideXml(xml: string): string {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')

  if (!doc.querySelector('parsererror')) {
    const paras = doc.getElementsByTagNameNS(DRAWINGML_NS, 'p')
    if (paras.length) {
      const out: string[] = []
      for (const p of Array.from(paras)) {
        const runs = p.getElementsByTagNameNS(DRAWINGML_NS, 't')
        const line = Array.from(runs).map((t) => t.textContent ?? '').join('')
        if (line.trim()) out.push(line)
      }
      if (out.length) return out.join(' ')
    }
  }

  // Fallback for XML the parser rejects — same paragraph-aware grouping
  const out: string[] = []
  const paraRe = /<a:p\b[\s\S]*?<\/a:p>/g
  const runRe = /<a:t[^>]*>([\s\S]*?)<\/a:t>/g
  let pm: RegExpExecArray | null
  while ((pm = paraRe.exec(xml)) !== null) {
    let line = ''
    let rm: RegExpExecArray | null
    runRe.lastIndex = 0
    while ((rm = runRe.exec(pm[0])) !== null) line += unescapeXml(rm[1])
    if (line.trim()) out.push(line)
  }
  return out.join(' ')
}

/** slide2.xml sorts after slide10.xml alphabetically, so compare the numbers. */
function slideNumber(path: string): number {
  const m = /(\d+)\.xml$/.exec(path)
  return m ? parseInt(m[1], 10) : 0
}

async function extractPptx(file: File): Promise<ExtractResult> {
  const JSZip = await loadJsZip()
  const zip = await JSZip.loadAsync(await file.arrayBuffer())

  const names = Object.keys(zip.files)
  const slides = names
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/i.test(n))
    .sort((a, b) => slideNumber(a) - slideNumber(b))
  // Sermon references often live in the speaker notes rather than on the slide
  const notes = names
    .filter((n) => /^ppt\/notesSlides\/notesSlide\d+\.xml$/i.test(n))
    .sort((a, b) => slideNumber(a) - slideNumber(b))

  if (!slides.length && !notes.length) {
    throw new ExtractError(
      'That doesn’t look like a PowerPoint file — no slides were found inside it.'
    )
  }

  const limited = slides.slice(0, MAX_UNITS)
  const parts: string[] = []

  for (const path of [...limited, ...notes.slice(0, MAX_UNITS)]) {
    const entry = zip.file(path)
    if (!entry) continue
    parts.push(textFromSlideXml(await entry.async('string')))
  }

  return {
    text: clean(parts.join(' ')),
    kind: 'pptx',
    label: LABELS.pptx,
    units: limited.length,
    unitLabel: 'slide',
    truncated: slides.length > limited.length,
  }
}

// ── Plain text ───────────────────────────────────────────────────────────────

async function extractPlainText(file: File): Promise<ExtractResult> {
  return {
    text: clean(await file.text()),
    kind: 'text',
    label: LABELS.text,
    units: 1,
    unitLabel: null,
    truncated: false,
  }
}

// ── Entry point ──────────────────────────────────────────────────────────────

export async function extractText(file: File): Promise<ExtractResult> {
  if (file.size > MAX_FILE_BYTES) {
    throw new ExtractError('That file is over 25 MB — try a smaller export.')
  }

  const ext = extensionOf(file.name)

  // The pre-2007 binary formats are a different thing entirely and no
  // browser library reads them; say so rather than failing obscurely.
  if (ext === 'doc') {
    throw new ExtractError(
      'That’s an older .doc file. Open it in Word, choose Save As, pick .docx, and try again.'
    )
  }
  if (ext === 'ppt') {
    throw new ExtractError(
      'That’s an older .ppt file. Open it in PowerPoint, choose Save As, pick .pptx, and try again.'
    )
  }

  const kind = detectKind(file)
  if (!kind) {
    throw new ExtractError(
      `Conduit reads PDF, Word (.docx), PowerPoint (.pptx) and plain text files${
        ext ? ` — that’s a .${ext} file` : ''
      }.`
    )
  }

  try {
    switch (kind) {
      case 'pdf':  return await extractPdf(file)
      case 'docx': return await extractDocx(file)
      case 'pptx': return await extractPptx(file)
      case 'text': return await extractPlainText(file)
    }
  } catch (e) {
    if (e instanceof ExtractError) throw e
    console.warn('Extraction failed:', e)
    throw new ExtractError(
      `Could not read that ${KIND_PHRASES[kind]}. It may be corrupted, password-protected, or saved in an unexpected format.`
    )
  }
}
