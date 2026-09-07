# Conduit — Presentation Studio

React + TypeScript + Tailwind + Zustand.

## Prerequisites

[Node.js](https://nodejs.org) v18 or later.

## Running it

```bash
cd presentation
npm install
npm run dev
```

Open http://localhost:5173

That gives you everything except AI paraphrase detection, which needs the
Netlify functions running (see below).

### With AI detection

The Anthropic API key lives on the server, never in the browser. To use AI
detection locally you need the functions running alongside Vite.

1. Install the Netlify CLI once: `npm install -g netlify-cli`
2. Set the keys on your Netlify site, then pull them down by linking:

   ```bash
   netlify link
   ```

   `netlify dev` reads the linked site's environment variables directly, so no
   secrets file ever touches this folder.

   > Avoid a local `.env` here. `netlify.toml` sets `publish = "."`, meaning the
   > project root *is* the deploy output — a secrets file placed there risks
   > being uploaded.

3. Run both, in separate terminals:

   ```bash
   netlify dev
   ```

   ```bash
   npm run dev
   ```

Vite proxies `/.netlify/functions/*` to port 8888, so the app reaches the
functions transparently.

### Deploying

Set `ANTHROPIC_API_KEY` in Netlify → Site settings → Environment variables.
Never put it in client code or a committed file.

## Features

**Detection feed** (left)
- Continuous speech recognition with automatic restart
- Direct references: "turn to John chapter 3 verse 16"
- Spoken numbers: "chapter twenty-three" → 23, "first Corinthians" → 1 Corinthians
- Context memory: "verse 10" resolves against the book and chapter already named
- Fuzzy matching survives speech-to-text errors like "philipians 4:13"
- AI fallback catches paraphrases: "the eagle verse" → Isaiah 40:31

**Notes** (left, second tab)
- Drop in the pastor's sermon notes as a **PDF, Word (.docx), PowerPoint (.pptx)**, or text file
- Every verse reference is pulled out and pre-fetched; the panel reports what it
  found, e.g. *"Word document processed — 6 verses found"*
- Click any one to stage it instantly — no typing, no waiting mid-service
- PowerPoint decks include **speaker notes**, where references often live
- Parsing runs entirely in the browser; the file is never uploaded
- Scanned PDFs with no text layer are reported rather than failing silently
- Legacy `.doc` / `.ppt` are detected and explained — no browser library reads
  those binary formats, so re-save as `.docx` / `.pptx`

Parser libraries (pdf.js, mammoth, JSZip) are bundled from npm rather than a
CDN, because the app's `script-src 'self'` CSP blocks external scripts. All
three load on demand, so the initial page load doesn't carry them.

**Preview / Live panels** (centre)
- Type a reference with book autocomplete; space after the chapter inserts the colon
- Stage to Preview, then Send to Live
- Edit verse: per-slide text and font-size overrides that don't touch the theme

**Theme Designer** (Theme button)
- Font family, size, colour, weight — body text and reference styled separately
- Background: solid, gradient, or uploaded image
- Alignment, transition, text shadow, padding, lower-third bar
- Default translation
- Presets: three built in, save your own

**Output** (⊞ Output button)
- Opens a window to drag onto the projector or second screen
- Full-screen or lower-third mode
- Theme edits update it live
- Countdown timer (⏱) and on-screen messages (💬)

**Freeze** locks the projector so new verses don't interrupt what's showing.

## Translations

KJV comes straight from bible-api.com — no key, works offline-free.
NIV, ESV, NKJV, NLT, AMP route through `/.netlify/functions/bible`, which needs
`BIBLE_API_KEY` set.

## Storage

Themes, presets, background images, saved messages, and detection settings are
kept in this browser's localStorage. Nothing is uploaded.
