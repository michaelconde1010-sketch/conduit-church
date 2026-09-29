# Conduit — Product Requirements Document

**Status:** Draft skeleton  
**Product:** Conduit Studio (church media-desk: live scripture detection and projector output)  
**Source of truth for “what exists”:** codebase audit of `presentation/`, `netlify/functions`, `netlify.toml` (2026-09-29)  
**Owner:** [PLACEHOLDER: product owner / founder name]  
**Last updated:** 2026-09-29

---

## 1) Vision

Conduit exists so a church media operator can put the spoken Word on the congregation’s screens at the moment it is referenced — without typing under pressure, and without anything going live until a human confirms it.

The product positioning in the current landing page (`presentation/index.html`) is: *“The Word on screen, the moment it's spoken.”* It is aimed at church media teams, volunteer operators, and dual-monitor / projector setups. It is a browser app (Chrome-class), not a native install, and it is designed to sit alongside existing presentation tools rather than replace a full worship-software stack.

**What this document does not invent:** long-term brand mission, TAM, or competitive positioning beyond what the product copy already says. Fill in:

- [PLACEHOLDER: one-sentence company mission, if different from the landing tagline]
- [PLACEHOLDER: 3-year product vision (e.g. multi-campus, worship-suite integration, hardware)]
- [PLACEHOLDER: primary competitor set you actually care about]

---

## 2) Problem Statement

During a live sermon, verse references are spoken naturally (“turn to John chapter three verse sixteen”), paraphrased (“the eagle verse”), or only half-stated (“verse 10”) after the book and chapter were named earlier. The operator must find the text, format it, and put it on the projector in seconds. Mistakes are public. Volunteer operators often have no ProPresenter-level training.

Typing a reference mid-service is slow and error-prone. Indirect references never appear in a search box. Putting the wrong verse live (or putting it up too early) is worse than being slightly late.

**Conduit’s intended loop (as implemented, not as marketed):** listen and/or import notes → detect or search a reference → fetch canonical Bible text from a Bible API (never from the LLM) → stage in Preview → operator sends to Live → a separate output window shows the slide or lower third.

**Problems the current product does not solve (explicit):** accounts, team permissions, billing, Planning Center, camera compositing, multi-operator sync, or guaranteed NIV/ESV licensing UX. Those appear in landing-page pricing copy or leftover files, not as working product.

---

## 3) Goals & Success Metrics

Goals implied by the product as built:

| Goal | Why it matters |
|------|----------------|
| Operator never types under live pressure if a reference can be detected or imported | Core job-to-be-done |
| Nothing reaches the congregation until Send to Live | Safety / trust |
| KJV works with no API key in the browser | Free path, Sunday-ready without Netlify secrets |
| AI paraphrase detection is optional; regex detection still works if Anthropic is down | Resilience |
| Sermon notes stay on the operator’s machine | Privacy / trust with pastors’ manuscripts |

**Success metrics — numbers not in the repo.** Propose and fill:

| Metric | Definition | Target | Source |
|--------|------------|--------|--------|
| [PLACEHOLDER] | e.g. % of Sunday services where ≥1 verse went live via Conduit | [TBD] | [TBD] |
| [PLACEHOLDER] | Time from spoken ref to live (p50 / p90) | [TBD] | [TBD] |
| [PLACEHOLDER] | False-positive AI suggestions dismissed vs staged | [TBD] | [TBD] |
| [PLACEHOLDER] | Weekly active operator desks (unique browsers / churches) | [TBD] | [TBD] |
| [PLACEHOLDER] | Paid conversion (once billing exists) | [TBD] | [TBD] |
| [PLACEHOLDER] | AI cost per service / per church | [TBD] | Anthropic usage |

**Non-goals for measurement until instrumented:** the app currently has no analytics SDK in the React codebase. Any funnel metric is [PLACEHOLDER: analytics tool + events].

---

## 4) Personas & User Stories

Personas are inferred from landing copy and the operator UI. Names and church sizes are placeholders.

### Personas

| Persona | Description | Evidence in product |
|---------|-------------|---------------------|
| **Volunteer operator** | Uses Chrome, dual monitors, little training | Confirm-before-live, book autocomplete, notes import |
| **Pastor / preacher** | Supplies notes (PDF/Word/PPT); may paraphrase | Notes extraction + AI fallback + sermon-plan list |
| **Tech lead / AV** | Cares about projector window, theme, overlays | Output popup, theme designer, countdown, messages |
| **Church admin / treasurer** | Would buy Standard/Pro | Landing pricing only — **no product surface yet** |

[PLACEHOLDER: real interview quotes, church size bands, existing software (ProPresenter, Proclaim, etc.)]

### User stories (current product)

- As an operator, I can open `/app.html` with no account and run a service.
- As an operator, I can start listening and see a live transcript.
- As an operator, I see detected verses as cards (speech vs AI labelled) and can Stage or Dismiss.
- As an operator, I can type a reference, fetch text, and stage it.
- As an operator, I can drop sermon notes and click extracted refs to stage them.
- As an operator, I can edit staged wording/size before Send to Live.
- As an operator, I can Freeze so a new send does not go live.
- As an operator, I can open an Output window and drag it to the projector.
- As an operator, I can switch Full vs Lower third, send a message overlay, or start a countdown.
- As an operator, I can save a visual theme and background images in this browser.
- As a visitor, I can read the marketing site and (in UI only) “join a waitlist.”

### User stories (not true today)

- As a church, I can pay £19/£39 and unlock features — **no gating**.
- As an admin, I get waitlist confirmation by email — **form does not persist**.
- As an operator, I get the next verse in the chapter pre-loaded — **not in React app**.
- As an operator, I overlay verses on a live camera in Conduit — **not in React output**.
- As a team, we share one live output across multiple operator machines — **BroadcastChannel is same-origin, same browser profile / tabs, not multi-device**.

---

## 5) Scope

**Rule for this section:** MVP v1.0 is what the Netlify-published React studio actually implements. Phase 2 / 3 are backlog, marketing promises, leftover prototype features, and known gaps — not “done.”

### MVP v1.0 (as built)

Shipped surface (build: `presentation/` → `presentation/dist`; functions: `netlify/functions`):

- Marketing landing page at `/` (`presentation/index.html`).
- Operator studio at `/app.html`; `/app` → `/app.html` (301).
- Projector/output route `/app.html#/output`.
- Hash-based route switch in React (`#/output` vs operator).
- Detection rail: Web Speech API listen/stop, transcript, detection cards, reset.
- Client-side verse detection: regex, spoken numbers, partial “verse N” context, fuzzy book names.
- AI paraphrase detection via `POST /.netlify/functions/detect` (optional; degrades if unconfigured).
- Settings: confidence threshold, sermon-plan lines (max 20), AI status copy.
- Notes rail: local parse of PDF / `.docx` / `.pptx` / `.txt`/`.md`; extract refs; prefetch verse text; stage on click.
- Manual search with book autocomplete and colon-insert after chapter number.
- Preview / Live split; Send to Live; per-slide text and font-size overrides.
- Freeze (blocks send on operator); Clear Screen from top bar (broadcasts `CLEAR_SCREEN`).
- Theme designer: fonts, colours, weights, alignment, padding, shadow, solid/gradient/image backgrounds, translation picker, three built-in presets + custom presets in localStorage.
- Media library: up to 10 images, ≤0.9 MB each, localStorage data URIs; used as slide backgrounds.
- Output window via `window.open` + `BroadcastChannel('conduit-output')`.
- Display mode: fullscreen vs lower third (top bar).
- Alert/message overlay and countdown overlay on output.
- KJV text from `https://bible-api.com` in the browser.
- Non-KJV path: `GET /.netlify/functions/bible` when translation ≠ KJV (see integrations: NKJV/NLT/AMP caveats).
- Persistence: theme, media, saved messages, detection settings in localStorage.
- CSP on studio: connect to `'self'` + `blob:` + `https://bible-api.com` (AI goes same-origin through Netlify).

**In the MVP codebase but incomplete / unused (do not treat as working product):**

- UI translations **NLT** and **AMP** — proxy has no Bible IDs; requests fail.
- **NKJV** in proxy uses the same API.Bible ID as **KJV**.
- Theme **cut/fade/slide** is stored; slide renderer does not apply it.
- Theme **lower-third enabled** toggle is not what drives output mode (top bar `displayMode` does).
- `FREEZE_TOGGLE` is posted to the channel; output window does not handle it (freeze is operator-side only).
- `LOGO_SCREEN`, `logoSrc` / `setLogo`, `isHeld` / `toggleHold` — unused.
- Live panel **Clear Screen** does not broadcast `CLEAR_SCREEN` (top bar Clear does).
- Landing waitlist — no backend.
- Landing pricing “Free vs Standard vs Pro” — **not enforced** in the app.
- Root `app.html` / `index.html` and `index/functions/` — **not** the current Netlify publish path.

### Phase 2

Candidate work after MVP is treated as the real product (prioritise [PLACEHOLDER: P0 order]):

- Make waitlist real (email capture + one confirmation).
- Enforce or remove marketing claims that don’t match the app (gating vs “full app is free”).
- Finish translation matrix: either wire NLT/AMP to real API.Bible IDs or hide them; decide NKJV vs KJV fallback.
- Output: honour `FREEZE_TOGGLE`; unify Clear; apply slide transitions; wire lower-third theme flag or remove it.
- Consecutive verse pre-load (exists only in unused root `app.html`).
- Camera / live-feed lower third (exists only in unused root `app.html`).
- Demo mode / sample sermons (root `app.html` only).
- Instrument analytics; AI cost dashboards.
- Operator UX: hold, logo screen, if still desired.
- [PLACEHOLDER: accounts / church workspace if Standard “up to 3 users” is real]

### Phase 3

From Pro marketing copy and unused types — **not in working code**:

- Multi-screen / multi-device live sync (beyond same-browser BroadcastChannel).
- Planning Center integration.
- Billing (Standard £19/mo, Pro £39/mo as currently advertised).
- Unlimited users, priority support, custom branding as a sold SKU.
- [PLACEHOLDER: native apps, offline Bible packs, multi-language UI, accessibility audit programme]

---

## 6) Product Features & Solutions

| Feature | User problem | Solution in product | Status |
|---------|--------------|---------------------|--------|
| Marketing site | Discover Conduit | Static HTML landing in Vite build | Shipped |
| Waitlist | Notify when paid plans launch | Modal; success UI only | UI only |
| No account studio | Use on Sunday without IT | Open `/app.html` | Shipped |
| Speech detection | Catch spoken refs | Web Speech + regex/fuzzy/context | Shipped (Chrome/Edge) |
| AI paraphrase | Indirect refs | Haiku via `/detect` | Shipped if `ANTHROPIC_API_KEY` set |
| Sermon plan hints | Vague “that John verse” | Settings textarea → detect body | Shipped |
| Notes import | Preload before service | Client pdf.js / mammoth / JSZip | Shipped |
| Manual search | Backup when mic fails | Preview search box | Shipped |
| Confirm before live | Prevent accidents | Preview → Send to Live | Shipped |
| Per-slide edit | Pastor paraphrases | Override text/size | Shipped |
| Freeze | Don’t interrupt prayer | Block send while frozen | Partial (operator only) |
| Theme + presets | Church visual identity | Theme drawer + localStorage | Shipped |
| Image backgrounds | Custom look | Media library | Shipped |
| Output window | Second monitor / projector | Popup + BroadcastChannel | Shipped |
| Full / lower third | Overlay vs slide | Top-bar mode | Shipped |
| Messages | Notices over content | Alert composer | Shipped |
| Countdown | Pre-service clock | Minutes → overlay | Shipped |
| KJV | Free Bible text | bible-api.com | Shipped |
| NIV/ESV | Licensed text | API.Bible via `/bible` | Shipped if `BIBLE_API_KEY` + supported ID |
| NKJV | Requested translation | Same Bible ID as KJV in proxy | Misleading |
| NLT/AMP | Listed in picker | No proxy mapping | Broken |
| Consecutive preload | Rapid “next verse” | — | Not in React |
| Camera overlay | Lower third on feed | — | Not in React |
| Demo mode | Rehearse without mic | — | Not in React |
| Planning Center | Service order import | — | Not built |
| Multi-user billing | Team SKUs | Landing copy only | Not built |
| Paywall | Monetise Standard/Pro | — | Not built |

---

## 7) Architecture & Tech Stack

**Deployed architecture (current `netlify.toml`):**

- Site root is the Git repo (so `netlify/functions` stays inside the site).
- Build: `npm install --prefix presentation && npm run build --prefix presentation`.
- Publish: `presentation/dist`.
- Functions: `netlify/functions`, bundler `esbuild`.
- Vite multi-page: `landing` = `presentation/index.html`, `app` = `presentation/app.html`.
- Dev: Vite proxies `/.netlify/functions` → `http://localhost:8888` (`netlify dev`).

**Frontend (resolved versions from `presentation/package-lock.json` unless noted):**

| Layer | Package | Pinned version |
|-------|---------|----------------|
| App name | `conduit-presentation` | 0.1.0 (`package.json`) |
| UI | `react` / `react-dom` | 18.3.1 |
| Language | `typescript` | 5.9.3 |
| Bundler | `vite` | 6.4.3 |
| React plugin | `@vitejs/plugin-react` | 4.7.0 |
| State | `zustand` | 5.0.14 |
| CSS | `tailwindcss` | 3.4.19 |
| CSS pipeline | `postcss` | 8.5.25 |
| CSS pipeline | `autoprefixer` | 10.5.4 |
| PDF | `pdfjs-dist` | 6.2.108 |
| Word | `mammoth` | 1.12.2 |
| PPTX zip | `jszip` | 3.10.1 |

**Declared ranges in `presentation/package.json` (caret):** React `^18.3.1`, Zustand `^5.0.3`, Vite `^6.0.5`, Tailwind `^3.4.17`, TypeScript `^5.7.2`, etc. Lockfile versions above are what a clean `npm ci` actually installs today.

**Runtime notes:**

- README: Node.js v18 or later for local Vite.
- `pdfjs-dist@6.2.108` `engines`: Node `>=22.13.0 \|\| >=24` — **conflict to resolve** ([PLACEHOLDER: which Node CI/Netlify image you will standardise on]).
- Functions: Node on Netlify, native `fetch`, no function-level `package.json`.
- Browser APIs: Web Speech, BroadcastChannel, `window.open`, localStorage, FileReader.
- Fonts: Google Fonts (Cinzel, Cormorant Garamond; studio also Playfair Display, Lora, Raleway, Montserrat).

**Client data flow (verse text):**

1. Detection produces a reference string (or AI JSON `{ ref, confidence }`).
2. `fetchVerse` always loads scripture from a Bible HTTP API, never from the LLM.
3. KJV → `GET https://bible-api.com/{ref}?translation=kjv`.
4. Other translations → `GET /.netlify/functions/bible?ref=&translation=`.

**Do not deploy as current product:** repo-root `index.html`, `app.html` (vanilla desk that called Anthropic from the browser), `index.toml`, `index/functions/bible.js`.

---

## 8) High Level Code Contracts

These are the contracts the running React + Netlify path actually uses. Types live under `presentation/src/types/`.

### 8.1 `GET /.netlify/functions/bible`

| | |
|--|--|
| Query | `ref` (e.g. `John 3:16`), `translation` |
| Success 200 | `{ ref, text, translation }` (`translation` uppercased) |
| Errors | 400 missing/unsupported parse; 401 key rejected; 429 rate limit (30/IP/60s per instance) + `Retry-After`; 503 no `BIBLE_API_KEY`; 502 upstream; 404 no content |
| CORS | `Access-Control-Allow-Origin: *` |
| Upstream | `https://api.scripture.api.bible/v4/bibles/{id}/verses/{USFM}` then `/passages/` on 404 |
| Supported `translation` keys in proxy | `KJV`, `NIV`, `ESV`, `NKJV` only |

### 8.2 `POST /.netlify/functions/detect`

| | |
|--|--|
| Body JSON | `{ transcript, confThreshold?, sermonPlan? }` |
| Limits | transcript sanitised, max 1000 chars; plan max 20 items × 60 chars; `confThreshold` default 75, clamped 0–100 |
| Success 200 | `{ ref: string \| null, confidence: number }` |
| Errors | 405 not POST; 400 bad JSON/empty transcript; 429 20/IP/60s; 503 `code: not_configured`; 502 upstream |
| CORS | no wildcard (same-origin) |
| Upstream | Anthropic Messages; model `claude-haiku-4-5-20251001`; `max_tokens` 80; `anthropic-version: 2023-06-01` |

### 8.3 Client `fetchVerse(ref, translation, meta?)`

Returns `DetectedVerse`: `{ id, ref, text, translation, confidence, detectedAt, source }` where `source` is `'speech' \| 'ai' \| 'manual'`.

### 8.4 `BroadcastPayload` (`conduit-output`)

Handled by output today: `VERSE_LIVE`, `CLEAR_SCREEN`, `THEME_UPDATE`, `DISPLAY_MODE`, `COUNTDOWN`, `ALERT`, `ALERT_DISMISS`.

Declared but not consumed by output: `FREEZE_TOGGLE`, `LOGO_SCREEN`.

`VERSE_LIVE` carries `{ staged: StagedVerse, theme: Theme }`. `StagedVerse` is `{ verse, overrides? }`. `COUNTDOWN` uses `seconds` (`0` stops).

### 8.5 AI client (`detectVerseWithAI`)

Treats non-JSON responses as unconfigured (Vite serving `index.html` when functions are down). Maps `code: not_configured` and HTTP 429.

### 8.6 localStorage keys

| Key | Contents |
|-----|----------|
| `conduit-theme` | Theme + custom presets |
| `conduit-media` | Image library + unused `logoSrc` |
| `conduit-alerts` | Saved message strings |
| `conduit-detection` | `confThreshold`, `sermonPlan` (v2; strips old client API key) |

### 8.7 Notes extraction

`extractText(file)` → `{ text, kind, label, units, unitLabel, truncated }`. Caps: 25 MB, 60 pages/slides, 80 refs, 120 ms between fetches.

---

## 9) Third Party Integrations

| Integration | Used by | Auth | Purpose | Notes |
|-------------|---------|------|---------|--------|
| **bible-api.com** | Browser `fetchVerse` (KJV) | None | KJV verse text | In CSP `connect-src` |
| **API.Bible** (`api.scripture.api.bible` v4) | `netlify/functions/bible.js` | Env `BIBLE_API_KEY` as `api-key` header | NIV/ESV/(claimed NKJV) | IDs: KJV/NKJV `de4e12af7f28f599-02`, NIV `78a9f6124f344018-01`, ESV `f421fe261da7624f-01` |
| **Anthropic Messages API** | `netlify/functions/detect.js` | Env `ANTHROPIC_API_KEY` as `x-api-key` | Paraphrase → one ref JSON | Model pinned above; paid; rate-limited in function |
| **Google Fonts / gstatic** | Landing + studio HTML | None | UI typefaces | CSP `style-src` / `font-src` |
| **Web Speech (Chrome/Edge)** | `useSpeechRecognition` | Mic permission | Live transcript | Typically Google’s speech service; app does not call a URL |
| **Netlify** | Host + functions | Site env vars | CDN, SSL, functions | [PLACEHOLDER: site name / team] |
| **Planning Center** | — | — | Marketed on Pro card | **Not implemented** |
| **Email / ESP** | Landing waitlist | — | “We’ll email you” | **Not implemented** |
| **Payments** | Pricing page | — | £19 / £39 | **Not implemented** |
| **Analytics** | — | — | Funnels | **Not in React app** |

No API keys are committed. Client must never receive `ANTHROPIC_API_KEY` or `BIBLE_API_KEY` (current React path honours this; leftover root `app.html` did not).

---

## 10) Pricing & Monetisation

**As advertised on the landing page (not enforced in software):**

| Tier | Price | Claimed includes | Product reality |
|------|-------|------------------|-----------------|
| Free | £0 forever | Manual search, lower-third & full-screen, theme, KJV, 1 user; **not** live mic, AI, notes | App does **not** lock mic, AI, or notes. “1 user” is just a browser. |
| Standard | £19/mo — “Coming soon” | Mic, Claude AI, notes import, messages & countdown, unlimited verses, up to 3 users | Those features (except multi-user) are already in the un-gated app. |
| Pro | £39/mo — “Coming soon” | Multi-screen sync, Planning Center, multiple translations, unlimited users, support, branding | Multiple translations are partially in UI; rest not built. |

Waitlist CTAs do not store emails.

**Monetisation decisions still required:**

- [PLACEHOLDER: keep everything free vs gate AI/mic/notes behind Standard]
- [PLACEHOLDER: API.Bible commercial licence + which translations you may ship]
- [PLACEHOLDER: Anthropic cost passed through vs included in subscription]
- [PLACEHOLDER: legal entity, VAT, Stripe/Paddle, refund policy]
- [PLACEHOLDER: whether waitlist is actually needed if the “paid” features already ship]

---

## 11) Deployment & Environments

| Environment | How it runs | Secrets | Notes |
|-------------|-------------|---------|--------|
| **Local Vite only** | `cd presentation && npm run dev` → port 5173 | None required | KJV + regex work; AI reports unconfigured unless functions run |
| **Local full** | `netlify dev` (8888) + Vite; or Netlify Dev serving both | `netlify link` pulls site env — README warns against a committed `.env` | Vite proxy `/.netlify/functions` → 8888 |
| **Production** | Netlify build command + publish `presentation/dist` | Site env: `BIBLE_API_KEY`, `ANTHROPIC_API_KEY` | Without Bible key, non-KJV fails 503; without Anthropic, detect 503 |

**Redirect:** `/app` → `/app.html` 301.

[PLACEHOLDER: production URL]  
[PLACEHOLDER: Netlify site ID, branch deploys, password-protected previews]  
[PLACEHOLDER: who has access to env vars]  
[PLACEHOLDER: custom domain + DNS]

**Node on Netlify:** [PLACEHOLDER: pin `NODE_VERSION` / Netlify Node image — see pdfjs engines vs README 18].

---

## 12) Non-Functional Requirements

| Area | Current behaviour / requirement | Gap |
|------|---------------------------------|-----|
| **Safety** | Confirm-before-live | Live-panel Clear vs projector desync |
| **Privacy** | Notes parsed in-browser; files not uploaded | Transcript is sent to `/detect` (and thus Anthropic) when AI runs |
| **Key hygiene** | Keys server-side in current app | Unused `app.html` still a footgun if deployed |
| **Availability** | KJV + speech regex without functions | AI and NIV/ESV need Netlify + keys |
| **Rate limits** | Bible 30/min/IP; detect 20/min/IP (per instance, in-memory) | Not global/durable across instances |
| **CSP** | Studio restricts connect-src | Must keep Anthropic off the client |
| **Browser** | Speech needs Chrome or Edge | Safari/Firefox: manual + notes only |
| **Storage** | localStorage; images ≤0.9 MB, max 10 | No cross-device theme; quota failures undocumented |
| **i18n** | Speech `lang = en-US`; English book names | [PLACEHOLDER: other languages] |
| **A11y** | Some landing focus/ARIA | [PLACEHOLDER: operator desk audit] |
| **Performance** | Parsers lazy-loaded | [PLACEHOLDER: budgets] |
| **Reliability** | Speech auto-restart | [PLACEHOLDER: SLA] |
| **Cost** | Detect is paid per call | Tight rate limit; still unbounded per church if ungated |
| **Legal** | Bible APIs + font CDNs | [PLACEHOLDER: scripture licences, Privacy Policy, ToS] |

---

## 13) Acceptance Criteria

Use these for “v1.0 matches the codebase we have,” not for unpaid marketing promises.

### Studio happy path

- Given Chrome/Edge and mic permission, when the operator starts listening and says a canonical English reference, a detection card appears with fetched text (KJV default) without using AI.
- Given Preview has a staged verse and Freeze is off, when the operator sends to live and an Output window is open on the same origin, the output shows that verse.
- Given Freeze is on, Send to Live does not change operator live state.
- Given top-bar Clear, output receives `CLEAR_SCREEN` and shows empty/no verse.
- Given `#/output` opened as the named popup, theme changes on the operator update the output after the 120ms debounce.

### Notes

- Given a text-layer PDF/docx/pptx/txt under size/page caps containing `John 3:16`, the notes panel lists that ref and can stage it after fetch succeeds.
- Given a scan-only PDF, the UI explains OCR is needed rather than failing silently.
- Given `.doc` or `.ppt`, the UI asks to re-save as docx/pptx.

### AI

- Given `ANTHROPIC_API_KEY` unset, AI status is unconfigured and explicit speech refs still detect.
- Given functions down (HTML response), client treats AI as unconfigured.
- Given a paraphrase and threshold, `/detect` returns JSON only (no verse text from the model used as scripture).

### Bible

- Given KJV, browser calls bible-api.com and does not require `BIBLE_API_KEY`.
- Given NIV or ESV and a valid key, `/bible` returns `{ ref, text, translation }`.
- Given NLT or AMP selected, **today this fails** — either hide the options or add IDs before calling this “accepted.”

### Marketing honesty

- Waitlist either stores the email or the copy is changed so it does not claim notification.
- Pricing cards either match entitlements or are labelled as future, without implying the live app is feature-gated.

### Security

- Studio JS never contains Anthropic or API.Bible secrets.
- `POST /detect` is not usable as a public CORS proxy (no `ACAO: *`).

[PLACEHOLDER: automated test suite — none described as product AC in this repo]

---

## 14) Open Questions & Risks

| ID | Item | Type |
|----|------|------|
| Q1 | Is the real v1.0 “everything unlocked in the browser” or the landing-page Free tier? | Product |
| Q2 | Which API.Bible editions are licensed for NIV/ESV/NKJV/NLT/AMP? | Legal / integration |
| Q3 | NKJV currently shares KJV’s Bible ID — acceptable? | Product |
| Q4 | Who pays Anthropic at current ungated usage? | Cost |
| Q5 | Netlify function rate limits are per instance — enough for a livestreamed Sunday spike? | Reliability |
| Q6 | BroadcastChannel is not multi-machine — is “multi-screen sync” a Pro lie or a Phase 3 epic? | Scope |
| Q7 | Delete or archive root `app.html` so nobody deploys client-side Anthropic? | Security |
| Q8 | Node 18 README vs pdfjs 6 engines ≥22.13 — what does Netlify run? | Build |
| Q9 | Privacy Policy: transcripts to Anthropic, no account, localStorage — church GDPR/UK GDPR? | Legal |
| Q10 | Analytics and church identity — none today; do we want them? | Growth |
| Q11 | Safari operator support — required? | Support |
| Q12 | Timeline and owners — blank | Process |

**Risks:** marketing/feature mismatch (trust); paid APIs on a free unlimited UI (bill shock); in-memory rate limits; localStorage loss = lost themes; speech quality; leftover vanilla app; incomplete freeze/clear/transitions.

---

## 15) Timeline & Owners

Nothing in the repository specifies dates, sprints, or named owners.

| Milestone | Date | Owner | Notes |
|-----------|------|-------|-------|
| PRD skeleton (this doc) | 2026-09-29 | Engineering audit | Draft |
| Align pricing copy vs app | [PLACEHOLDER] | [PLACEHOLDER: product] | High trust risk |
| Translation + proxy matrix | [PLACEHOLDER] | [PLACEHOLDER: eng] | NLT/AMP/NKJV |
| Output contract completeness | [PLACEHOLDER] | [PLACEHOLDER: eng] | Freeze, clear, transitions |
| Waitlist / billing | [PLACEHOLDER] | [PLACEHOLDER] | Phase 2–3 |
| Public launch / church pilots | [PLACEHOLDER] | [PLACEHOLDER] | [PLACEHOLDER: n churches] |

RACI: [PLACEHOLDER].

---

## 16) Changelog

| Date | Author | Change |
|------|--------|--------|
| 2026-09-29 | Engineering (codebase audit → PRD skeleton) | Initial draft. MVP scope = Netlify-published React studio + two functions as they exist in repo. Versions pinned from `presentation/package-lock.json`. Placeholders marked for vision extras, metrics, owners, legal, and URLs. |

---

*Fill every `[PLACEHOLDER]` before treating this PRD as approved. Do not expand MVP in Section 5 without a matching implementation.*
