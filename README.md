# A11yVision

An AI-powered web accessibility visual auditor and code remediator, built with Next.js (App Router), Tailwind CSS, and the Google Gemini API.

## Features

### 🔍 Visual Auditor
- Drag-and-drop or click-to-upload a website screenshot (PNG/JPEG/WEBP).
- "Scan Screenshot" sends the image to `gemini-3.5-flash` (configurable) for a vision-based WCAG audit.
- Rotating accessibility tips are shown while the scan is running.
- Detected violations are rendered as responsive, percentage-based bounding boxes over the image, each with a keyboard-accessible tooltip describing the issue, WCAG rule, and remediation steps.
- A synced, screen-reader-friendly list mirrors every violation for users who can't rely on hover tooltips.
- A native **EyeDropper** color contrast checker lets you sample any two colors on screen and instantly see the WCAG contrast ratio and AA/AAA pass/fail status (falls back to manual hex entry in browsers without EyeDropper support, e.g. Firefox/Safari).

### 🛠️ Code Remediator
- Paste raw HTML into the left panel.
- "Remediate Code" sends it to the Gemini API, which rewrites it with accessibility fixes (alt text, label associations, semantic elements, ARIA, heading structure, etc.).
- The corrected HTML appears on the right with lightweight syntax highlighting and a one-click copy button.
- A bulleted explanation panel lists exactly what was changed and why, with WCAG rule references.

## Getting started

### Requirements
- Node.js 18.18+ (works on Node 18 or 20). Pinned to Next.js 14.2.35, React 18, and Tailwind CSS 3 for broad sandbox/runtime compatibility.
- A **free** [Gemini API key](https://aistudio.google.com/apikey) from Google AI Studio — no credit card required, and the free tier (1,500 requests/day on Flash models as of this writing) is generous enough for regular development use.

### Setup

```bash
npm install
cp .env.example .env.local
# then edit .env.local and set GEMINI_API_KEY=...
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `GEMINI_API_KEY` | Yes | — | Server-side only. Never exposed to the client. Get a free one at [aistudio.google.com/apikey](https://aistudio.google.com/apikey). |
| `GEMINI_VISION_MODEL` | No | `gemini-3.5-flash` | Model used for `/api/ai/visual-audit`. Must support vision input. |
| `GEMINI_TEXT_MODEL` | No | `gemini-3.5-flash` | Model used for `/api/ai/code-audit`. |

> **Model availability changes fast.** Google periodically retires/restricts older free-tier models for newly-created API keys (this project originally defaulted to `gemini-2.5-flash`, which stopped working for new keys shortly before this note was written). If you get a `404 ... no longer available` or similar error, check [ai.google.dev/gemini-api/docs/deprecations](https://ai.google.dev/gemini-api/docs/deprecations) for the current recommended model and set `GEMINI_VISION_MODEL`/`GEMINI_TEXT_MODEL` accordingly — no other code changes are needed.

## API routes

Both routes run exclusively on the server (`src/app/api/**`), so your Gemini key is never sent to the browser.

- `POST /api/ai/visual-audit` — body: `{ "image": "data:image/png;base64,..." }` → `{ "violations": [...] }`
- `POST /api/ai/code-audit` — body: `{ "html": "<div>...</div>" }` → `{ "correctedHtml": "...", "explanations": [...] }`

Both routes validate their inputs, sanitize the AI's JSON output against a strict schema, and return clear error messages (400 for bad input, 429 for rate limits, 502 for AI/parsing failures, 500 for missing/invalid API key).

## Accessibility of the app itself

- Semantic landmarks (`header`, `main`, `footer`), a skip link, and a WAI-ARIA tabs pattern with full keyboard support (arrow keys, Home/End).
- All interactive controls are real `<button>`/`<input>` elements with visible focus rings and descriptive `aria-label`s.
- Violation bounding boxes are keyboard-focusable and expose their tooltip content to screen readers via `aria-describedby`.
- Respects `prefers-reduced-motion`.

## A note on dependency versions

This project intentionally pins `next@14.2.35` (the latest security-patched release in the 14.x line) rather than the newest major version, because Next.js 15/16 require Node.js 20+. If your environment runs Node 20+, you can upgrade freely — no application code here depends on 14.x-specific APIs.

Similarly, it uses `@google/generative-ai` (Google's previous-generation Gemini SDK) rather than the newer `@google/genai`, because the latter requires Node.js 20+ while `@google/generative-ai` supports Node 18+. Both SDKs talk to the same underlying Gemini REST API, so if your environment runs Node 20+, migrating to `@google/genai` is straightforward.

