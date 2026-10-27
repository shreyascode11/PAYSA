# CLAUDE.md — PAYSA: Decent Work Platform

> Prompt Wars 2026 × SRM ACM · Theme: UN SDG 8 (Decent Work & Economic Growth)
> Read this whole file before writing code. Follow the build order in §14. Do not add scope beyond this file.

---

## 1. What we're building

PAYSA is a **worker-first workforce platform** for employee-intensive organisations that today run on paper registers, spreadsheets and WhatsApp. It is **one engine with sector templates**: we demo **Construction Site** and **College Campus (facility/support staff)**.

**The core idea is that one check-in feeds everything.** A QR/geo shift check-in drives the following:
attendance → automatic overtime → plain-language payslip → fatigue alerts → explainable quit-risk score.

On top of that sit **anonymous, voice-first safety and grievance reporting**, plus a **portable Skill Passport**.

**Two UIs (mandatory):**
- **Worker app** (`/w/*`): mobile-first, voice- and icon-led, Tamil / Hindi / English, works on low-end Android Chrome.
- **Admin dashboard** (`/admin/*`): desktop-first, for supervisors and HR.

---

## 2. Hard constraints (submission rules, never violate)

| Rule | What it means for the code |
|---|---|
| Hosted on **Vercel** (primary) or **Google Cloud Run** | `vercel.json` (region `bom1`) for Vercel; `Dockerfile` with Next.js `output: "standalone"` for Cloud Run. On serverless hosts `SESSION_SECRET` is required and Firestore is the data store (in-memory data is per instance). |
| Repo **< 10 MB**, **1 branch** (`main`) | Add no binaries, videos or datasets. Seed data lives in a small TS/JSON file. Use SVG icons only. Keep `node_modules`, `.next` and `.env*` gitignored. |
| Public repo URL ends in `.git` | n/a for code |
| **No exposed secrets** (AI evaluator checks this) | Keys are read only from `process.env` on the server. Commit `.env.example` with empty values. Gemini is never called from the client. |
| AI evaluator scores **tests** | Write Vitest unit tests for every business rule in §7. |
| AI evaluator scores **accessibility** | Meet WCAG AA contrast, full keyboard navigation, visible focus rings, ARIA labels, `lang` attribute per locale. |
| AI evaluator scores **code quality / efficiency** | Use strict TypeScript, small modules, no unused dependencies, no giant client bundles. |
| Must work across **2+ sectors** | Sector config in §6. Both sectors must be visibly demoable. |

---

## 3. Tech stack

- **Next.js 15 (App Router) + TypeScript (strict)**, one app serving both UIs plus the API routes.
- **Tailwind CSS**, no component library except optional `lucide-react` icons.
- **Data:** Firestore via `firebase-admin` (server only), behind a `Repository` interface. If `FIRESTORE_PROJECT_ID` is unset, fall back to an **in-memory repository seeded from `src/data/seed.ts`**. The demo must work with zero cloud config.
- **AI:** Gemini via `@google/genai` (server only). The model name comes from the `GEMINI_MODEL` env var. Uses:
  - transcribe and translate a worker's voice note (audio → text in the original language + English)
  - classify hazard severity and category
  - plain-language payslip explanation in the worker's language
  - If `GEMINI_API_KEY` is missing, use deterministic fallbacks (keyword classifier, template text). **The app must never crash without AI.**
- **Voice out:** browser `speechSynthesis` (free, offline-capable) to read payslips and status aloud.
- **Voice in:** `MediaRecorder` → POST audio (webm/opus, max 60 s, max 2 MB) to `/api/voice/transcribe`.
- **QR:** `qrcode` (generate the site QR on admin) and `html5-qrcode` (scan on worker), with the scanner lazy-loaded.
- **Charts:** `recharts`, lazy-loaded on admin pages only.
- **Validation:** `zod` on every API input.
- **Tests:** `vitest` + `@testing-library/react`. Optionally `@axe-core/react` in dev.
- **Auth (demo-grade):** phone + 4-digit PIN for workers, email + password for admin. Session is a signed HttpOnly cookie (`jose`, secret from env). Seed users are listed in README.

---

## 4. Repo layout

```
paysa/
├─ CLAUDE.md
├─ README.md               # problem, features, sectors, demo logins, deploy steps, SDG 8 mapping
├─ Dockerfile
├─ .dockerignore  .gitignore  .env.example
├─ next.config.ts          # output: "standalone"
├─ src/
│  ├─ app/
│  │  ├─ page.tsx                    # landing: choose Worker / Admin, language picker
│  │  ├─ w/                          # WORKER UI
│  │  │  ├─ login/  home/  checkin/  pay/  report/  report/[trackingId]/
│  │  │  ├─ voice/ (feedback)  passport/
│  │  ├─ admin/                      # ADMIN UI
│  │  │  ├─ login/  page.tsx (overview)  workers/  workers/[id]/
│  │  │  ├─ reports/  reports/[id]/  fatigue/  attrition/  sites/
│  │  ├─ p/[passportId]/             # public, shareable Skill Passport (read-only)
│  │  └─ api/ ... (see §9)
│  ├─ lib/
│  │  ├─ rules/            # PURE business logic, 100% unit tested
│  │  │  ├─ overtime.ts  payslip.ts  fatigue.ts  attrition.ts  anonymity.ts  geo.ts
│  │  ├─ ai/gemini.ts      # server-only wrapper + fallbacks
│  │  ├─ repo/             # Repository interface, firestore.ts, memory.ts
│  │  ├─ auth.ts  i18n.ts  sectors.ts  validation.ts
│  ├─ components/          # BigButton, IconTile, VoiceRecorder, SpeakButton, StatusBadge, LangSwitch...
│  ├─ locales/en.json ta.json hi.json
│  └─ data/seed.ts         # 2 orgs (1 per sector), ~25 workers, 3 weeks of shifts, reports
└─ tests/                  # mirrors src/lib/rules + a few component tests
```

---

## 5. Data model

```ts
type Sector = "construction" | "college";
type Lang = "en" | "ta" | "hi";

Org      { id, name, sector: Sector }
Site     { id, orgId, name, lat, lng, radiusM, qrToken }   // qrToken rotates daily
Worker   { id, orgId, name, phone, pinHash, lang: Lang, role, dailyWage, hourlyRate,
           teamId, joinedAt, passportId }
Shift    { id, workerId, siteId, checkIn: ISO, checkOut?: ISO, method: "qr"|"geo"|"manual" }
Payslip  { workerId, periodStart, periodEnd, regularHours, otHours, regularPay, otPay,
           deductions: {label, amount}[], netPay }          // derived, not stored as source of truth
Report   { id, trackingId, orgId, siteId?, type: "hazard"|"grievance"|"manager_feedback",
           category, severity: 1..4, textOriginal, langOriginal, textEn, photoUrl?,
           status: "received"|"in_review"|"action_taken"|"resolved",
           anonymous: boolean, workerId?: string /* ONLY if anonymous=false */,
           createdAt, updates: {at, status, note}[], messages: {from:"worker"|"admin", text, at}[] }
Pulse    { id, orgId, teamId, weekOf, score: 1..5 }          // anonymous weekly mood tap; no workerId
SkillEntry { id, workerId, skill, level: 1..3, source: "training"|"experience"|"employer",
             endorsedBy?: orgId, date }
```

**Anonymity rule:** when `anonymous=true`, **never store `workerId`, IP, or a precise timestamp** (round `createdAt` to the hour). `trackingId` is a random 8-char code (for example `PS-7K2Q9M`). It is shown to the worker once and is the only way back to the report.

---

## 6. Sector templates (`src/lib/sectors.ts`)

One engine with different configuration per sector:

```ts
construction: {
  label: "Construction Site",
  hazardCategories: ["fall_height","ppe_missing","electrical","machinery","heat","collapse","other"],
  shiftPattern: "day", standardDailyHours: 8, otMultiplier: 2,
  skills: ["masonry","bar_bending","scaffolding","welding","electrical","plumbing","safety_induction"],
},
college: {
  label: "College Campus Staff",
  hazardCategories: ["wet_floor","chemical_cleaning","electrical","lifting","harassment","other"],
  shiftPattern: "rotating", standardDailyHours: 8, otMultiplier: 2,
  skills: ["housekeeping","gardening","electrical_maintenance","lab_assistance","security","plumbing"],
}
```

The admin dashboard has a **sector switcher** (one seeded org per sector) so judges can see both. Note in README how hospitals and factories would plug in with only a new config object. That covers the feasibility/scalability criterion.

---

## 7. Business rules (pure functions, must be unit tested)

All rules live in `src/lib/rules/`. They take plain data and return plain data, with no I/O.

**overtime.ts**
- Daily OT = hours beyond `standardDailyHours` (default 8, with 9 as a configurable cap).
- Weekly OT = hours beyond 48 in a Mon–Sun week, not double-counting daily OT.
- OT pay = `otHours × hourlyRate × otMultiplier` (default 2×).
- Shifts crossing midnight are split correctly. An open shift (no checkout) is excluded and flagged.

**payslip.ts**
- `buildPayslip(worker, shifts, period)` returns a line-item breakdown.
- `explainPayslip(payslip, lang)` returns 3–5 short plain-language sentences. Use Gemini when available, otherwise templates from the locale files.

**fatigue.ts** returns `{level: "ok"|"warn"|"critical", reasons: string[]}`.
- warn: shift > 10 h, OR < 11 h rest between shifts, OR > 6 consecutive days, OR > 54 h per week
- critical: shift > 12 h, OR < 8 h rest, OR > 60 h per week
- Every reason is a human-readable string with numbers, for example `"Worked 63h this week (limit 60)"`.

**attrition.ts** returns an explainable score from 0–100 with `drivers[]`.

| Signal (last 14 days vs worker's own baseline) | Points |
|---|---|
| Absences up ≥ 2 | +20 |
| Fatigue warn/critical days | +5 each (max 20) |
| Weekly hours > 54 | +15 |
| Late or missed pay in period | +20 |
| Team pulse avg ≤ 2 (team-level, not individual) | +10 |
| Tenure < 90 days | +10 |
| Went silent: no pulse/feedback from the team in 3 weeks | +5 |

Bands: 0–29 low, 30–59 medium, 60+ high. **Always return the drivers.** The UI shows *why*, never a bare number. Anonymous reports are **never** an input to an individual's score.

**anonymity.ts**
- `canShowAggregate(groupSize)` returns `groupSize >= 5` (k-anonymity). Any team breakdown below 5 is shown as "Not enough responses".
- `generateTrackingId()` uses a crypto-random alphabet with no ambiguous characters.

**geo.ts**
- `haversineMeters()` and `isInsideSite(lat, lng, site)` for geo check-in.

---

## 8. Features and acceptance criteria

The deck requires at least 3 working features. We ship **6 core features (P0)** plus 2 stretch features (P1).

### P0-1 · Shift check-in (QR or geo) with automatic overtime
- The worker taps a big **"Start Work"** button, then scans the site QR or uses GPS inside the radius. The **"End Work"** button does the reverse.
- Reject an expired QR token, outside-radius GPS, or a double check-in, with a clear icon and message.
- The home screen shows today's hours, this week's hours and OT so far.
- The admin `sites/` page displays a printable QR for each site.

### P0-2 · Clear payslip in the worker's language
- `/w/pay` shows a card per line item: icon, amount in large text, and a ₹ total.
- A 🔊 **"Listen"** button reads the explanation aloud via `speechSynthesis` in the worker's language.
- OT hours are listed explicitly, so the worker can see they were counted.
- A **"Something wrong?"** button opens a pay grievance prefilled with the period.

### P0-3 · Voice-first safety / hazard reporting with status tracking
- Flow: pick a category from an icon grid → hold to record a voice note (or type) → optional photo → toggle **anonymous** (default ON) → submit.
- The server transcribes and translates the note (Gemini), then auto-suggests severity and category. The admin can override both.
- The worker gets a **tracking ID** and can check status at `/w/report/[trackingId]`. The status timeline is shown as icons.
- Severity 4 (critical) appears with a red banner at the top of the admin overview.

### P0-4 · Honest anonymous feedback (manager + conditions)
- A weekly **1-tap mood pulse** (5 faces) plus an optional anonymous voice/text comment about a manager or conditions.
- **Two-way anonymous chat** on any anonymous report: the admin can ask a follow-up, and the worker sees it by entering the tracking ID. Identity is never revealed.
- The admin sees only aggregates gated by k ≥ 5.

### P0-5 · Fatigue alerts
- The worker sees a gentle banner ("You've worked 58h this week, please rest") with a reason.
- The admin `fatigue/` page shows a heatmap (workers × last 14 days) coloured ok/warn/critical. Clicking a cell lists the reasons, and a **"Log action"** button records an intervention (rest given, shift swapped).

### P0-6 · Admin dashboard
- **Overview KPIs:** on-site now, attendance trend (14 d), open reports by severity, avg resolution time, fatigue critical count, high quit-risk count.
- **Attrition** page: a table sorted by score showing **top 2 drivers** per worker plus a suggested action (for example "Reduce hours", "Check pay delay", "1-on-1 check-in").
- Reports inbox with filters (type, severity, status, site) and a status update that notifies the worker's tracking page.
- Sector switcher.

### P1-7 · Skill Passport (build if time allows; it is high-impact for judges)
- The worker sees their skills (from training, experience, and employer endorsement) plus total verified days worked, computed from shifts.
- A **QR / share link** to `/p/[passportId]` gives a read-only public view with no phone number or wage.
- The admin can endorse a skill, which marks it with an "Endorsed by <Org>" badge.

### P1-8 · Daily announcements (stories-style)
- The admin posts a short notice (text and optional voice). Workers see a tappable card that is read aloud. Keep it simple.

---

## 9. API routes (`src/app/api/`)

All inputs are validated with zod. Workers can access only their own data. Admin routes require an admin session. Errors return `{error: string}` with the correct HTTP status.

```
POST /api/auth/worker-login        {phone, pin}
POST /api/auth/admin-login         {email, password}
POST /api/auth/logout
POST /api/shifts/check-in          {method, qrToken? | lat,lng}
POST /api/shifts/check-out         {lat?, lng?}
GET  /api/me/summary               -> today/week hours, OT, fatigue
GET  /api/me/payslip?period=       -> payslip + explanation
POST /api/voice/transcribe         multipart audio -> {text, lang, textEn}
POST /api/reports                  {type, category, text, lang, anonymous, siteId?, photo?}
GET  /api/reports/track/:trackingId          (public, by tracking id only)
POST /api/reports/track/:trackingId/message  (worker reply, anonymous)
POST /api/pulse                    {score}            (anonymous, team-level)
GET  /api/me/passport
GET  /api/admin/overview?orgId=
GET  /api/admin/fatigue?orgId=
GET  /api/admin/attrition?orgId=
GET  /api/admin/reports?filters
PATCH /api/admin/reports/:id       {status, note, severity?, category?}
POST /api/admin/reports/:id/message
POST /api/admin/skills/endorse     {workerId, skill}
POST /api/admin/fatigue/action     {workerId, date, action}
```

Rate-limit `/api/reports`, `/api/voice/transcribe` and the login routes with a simple in-memory token bucket.

---

## 10. Worker UI rules (inclusivity, judged directly)

- Make **icon + colour + short word** the primary path. Text is secondary. Every action is reachable without reading.
- Tap targets ≥ 44–48 px, base font 16 px (see §18.3), and a maximum of 3 primary actions per screen.
- Every screen has a 🔊 button that reads its main content aloud in the selected language.
- The language switch (EN / தமிழ் / हिंदी) is always visible in the header and persisted in a cookie.
- All strings come from `src/locales/*.json`. **No hard-coded UI text.** Translate properly; don't leave English in the ta/hi files.
- Performance for low-end phones: worker pages are server components by default, client JS only where needed, no charts on worker pages, scanner and recorder lazy-loaded. Target < 150 KB JS for `/w/home`.
- Show graceful states for offline, permission denied (mic/camera/GPS) and AI unavailable.

## 11. Accessibility checklist (the AI evaluator checks this)

- Semantic HTML: `<main>`, `<nav>`, `<button>` (never a clickable `<div>`), with headings in order.
- WCAG AA contrast in both themes. Status is never conveyed by colour alone; always add an icon and a label.
- Everything is keyboard operable with a visible `focus-visible` ring and a skip-to-content link.
- `aria-label` on icon-only buttons, and `aria-live="polite"` for check-in results and status updates.
- `<html lang>` matches the selected locale. Charts have a text/table alternative.
- Respect `prefers-reduced-motion`.

## 12. Security checklist

- No keys in the client bundle or the repo. `.env.example` lists `GEMINI_API_KEY`, `GEMINI_MODEL`, `SESSION_SECRET`, `FIRESTORE_PROJECT_ID`, with no values.
- On Cloud Run, secrets go in **Secret Manager** and are mounted as env vars (documented in README).
- PINs and passwords are hashed with `bcryptjs`. Session cookies are `HttpOnly; Secure; SameSite=Lax`.
- Authorization is checked on every route. A worker can't read another worker's data, and anonymous reports never expose identity in any API response.
- Uploads are size- and type-checked. Strip EXIF/GPS from photos when the report is anonymous (or store no photo metadata).
- Set security headers in `next.config.ts`: CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` (allow camera/mic/geolocation for self only).
- Do not log report text or PII.

## 13. Testing (Vitest)

- `tests/rules/overtime.test.ts`: normal day, daily OT, weekly OT without double count, midnight crossing, open shift.
- `tests/rules/fatigue.test.ts`: each warn and critical threshold, plus reason strings.
- `tests/rules/attrition.test.ts`: each driver, score banding, and that anonymous reports are ignored.
- `tests/rules/anonymity.test.ts`: k < 5 hidden, tracking ID format and uniqueness.
- `tests/rules/geo.test.ts`: inside/outside radius.
- `tests/rules/payslip.test.ts`: totals and deductions.
- `tests/api/reports.test.ts`: creating an anonymous report stores no workerId, and the track endpoint returns no identity.
- 2–3 component tests: BigButton has an accessible name, LangSwitch changes `lang`, StatusBadge has a text label.
- Scripts: `npm test`, `npm run lint`, `npm run typecheck`. All must pass before deploy.

## 14. Build order (follow strictly; commit after each phase)

1. **Scaffold:** Next.js + TS strict + Tailwind + Vitest, `output: "standalone"`, Dockerfile, `.env.example`, gitignore. Verify `docker build` works.
2. **Rules first:** implement `src/lib/rules/*` and their tests until they are green.
3. **Repo + seed:** Repository interface, memory implementation, rich seed for both sectors (enough shifts that fatigue and attrition look real: some critical, some high-risk).
4. **Auth + i18n:** login pages, session, locale files (en/ta/hi), LangSwitch, SpeakButton.
5. **Worker UI:** home → check-in → pay → report (voice) → tracking page → pulse.
6. **Admin UI:** overview → reports inbox/detail with chat → fatigue heatmap → attrition table → sites/QR → sector switcher.
7. **Gemini integration** with fallbacks (transcribe, classify, explain).
8. **P1:** Skill Passport, then announcements.
9. **Polish:** accessibility pass (keyboard-only walkthrough, contrast), Firestore implementation if time allows, README.
10. **Deploy** to Cloud Run (§15), smoke-test both UIs on a phone, check repo size (`git count-objects -vH`) and that only `main` exists.

**If time runs short, cut from the bottom.** P0-1, P0-2, P0-3 and P0-6 with both sectors are the minimum viable submission.

## 15. Deployment (Cloud Run)

`Dockerfile`: multi-stage `node:20-alpine` (deps → build → runner). Copy `.next/standalone`, `.next/static` and `public`, run as a non-root user, `ENV PORT=8080`, `CMD ["node","server.js"]`.

```bash
gcloud run deploy paysa \
  --source . --region asia-south1 --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=gemini-key:latest,SESSION_SECRET=session-secret:latest \
  --set-env-vars GEMINI_MODEL=<model>,NODE_ENV=production \
  --memory 512Mi --min-instances 0 --max-instances 3
```

Note: the in-memory repo resets on cold start. For the demo, either set `--min-instances 1` or enable Firestore.

## 16. README must include

The problem in 3 lines → SDG 8 targets addressed (8.5 decent work, 8.7 forced labour signals, 8.8 safe working environments) → feature list mapped to the deck's 8 example features → **cross-sector section** (construction + college, and how hospital/factory plug in) → demo logins (worker phone/PIN in each sector, admin email/password) → architecture diagram (mermaid) → how anonymity is guaranteed → run locally → deploy → tests.

## 17. Coding conventions

- Strict TS with no `any`. Business logic stays in `lib/rules` and never lives in components or routes.
- Server components by default; `"use client"` only for interactive leaves.
- Functions should be small and named for what they do. Comment the *why*, not the *what*.
- No new dependency without a clear need. Check bundle impact.
- Never commit generated files, audio or images other than tiny SVGs.

## 18. Design system

Design references live in `./ui-design/` (gitignored, never committed). Use them for **layout and feel only**. Never copy their branding, logos or text.

### 18.1 Palette — Holst (the only colours allowed)

These are Tailwind theme tokens (`bg-navy-950`, `text-ivory-50`…). Tints are allowed only as reduced opacity of these tokens (`text-ivory-50/70`).

| Token | Hex | Use |
|---|---|---|
| `navy-950` | `#0D1B2A` | Worker background; admin sidebar; **text on every light fill** |
| `navy-900` | `#1B263B` | Raised cards and surfaces on dark |
| `slate-600` | `#415A77` | Emphasis cards on dark; links, headings and primary chart series on light; completed timeline steps |
| `sage-500` | `#778D7A` | `ok` status fill; secondary chart series |
| `sand-300` | `#D4C4A8` | **Primary action fill** (navy text), active nav, worked days, rings, progress; accent text on dark |
| `ivory-50` | `#F4F1DE` | Text on dark; admin cards; light chips (navy text) |

**Status tones** are the only colours outside the palette. They're tuned to sit with it and are used **only as fills, with an icon and a label**: `ok` = sage `#778D7A` (navy text), `warn` = `#E3B04B` (navy text), `critical` = `#A8432F` (ivory text).

### 18.2 Contrast rules (computed, WCAG AA ≥ 4.5:1 for text)

| Text on background | Ratio | Allowed |
|---|---|---|
| ivory-50 on navy-950 / navy-900 / slate-600 | 15.31 / 13.33 / 6.26 | ✓ |
| ivory-50/70 on navy-950 · navy-900 | 8.02 · 7.24 | ✓ muted text on dark |
| ivory-50/85 on slate-600 | 5.04 | ✓ muted text on slate (never below /85) |
| sand-300 on navy-950 / navy-900 | 10.16 / 8.84 | ✓ accent text on dark |
| navy-950 on sand-300 · ivory-50 · warn · sage (ok) | 10.16 · 15.31 · 8.76 · 4.87 | ✓ the only text on these fills |
| ivory-50 on critical | 5.27 | ✓ |
| navy-950/70 on ivory-50 · admin bg | 6.11 · 5.81 | ✓ muted text on light |
| slate-600 on admin bg | 5.69 | ✓ links on light |
| critical on ivory-50 · admin bg | 5.27 · 4.79 | ✓ error text on light |
| sage-500 as text on light (3.15) or dark (4.87 on navy is fill-only) | — | ✗ never as text |
| critical as text on dark (≤ 3.5) | — | ✗ never |

Non-text marks need ≥ 3:1: "off" dots use ivory-50/40 (3.48:1) and hollow "future" dots use ivory-50/45 (4.04:1). Chart series: slate (6.26:1) and sage (3.15:1) against the ivory card.

### 18.3 Rules

- **Status = icon + label, always** (`StatusPill`). Colour is never the only signal. Dots and heatmaps carry a shape difference plus an accessible name or table.
- **Worker UI is dark** (`navy-950` + `bg-aurora`) and mobile-first: **16px base text**, ≥ 44–48px tap targets, **one primary action per screen** (the sand button).
- **Type scale** (keep it calm):
  - worker screen titles `text-xl`; hero figures `text-5xl`; card figures `text-3xl`
  - buttons `text-lg`; labels in small caps `text-xs`
  - admin page titles `text-2xl`; KPI figures `text-3xl`
- **Admin UI is light** (ivory/sand background, `navy-950` sidebar) and desktop-first.
- **Cards:** `rounded-3xl`/`rounded-4xl` on worker and `rounded-3xl` on admin. Worker cards are `bg-navy-900`, with `bg-slate-600` for emphasis. Admin cards are ivory with a hairline `navy-950/10` border.
- **Focus ring:** 3px `sand-300` on dark, 3px `slate-600` on light.
- **Motion:** only the nav highlight slide, the badge sway and ring/progress fills, at ≤ 250ms (sway 1.6s once). All motion is disabled under `prefers-reduced-motion`.
- **Language:**
  - every UI string comes from the locale files;
  - times use spoken day periods in Tamil/Hindi (காலை 7:09, सुबह 7:09);
  - notices carry per-language translations;
  - voice input uses Gemini when configured, otherwise the browser's own speech recogniser in the worker's language.

### 18.4 Shared components (`src/components/ui/`)

| Component | Purpose | Notes |
|---|---|---|
| `BigButton` | One primary action | `primary` = sand fill + navy; `secondary` = slate + ivory; `light` = navy + ivory (admin); `outline` |
| `StatCard` | Label + big number + unit + hint | `tone`: `card`, `hero` (slate), `light` (admin ivory), `dark` (admin navy hero) |
| `StatusPill` | Status chip | `ok`, `warn`, `critical`, `info`, `neutral`; icon + label always |
| `PillNav` | Worker bottom nav | Glass navy pill, 4 tabs (Home, Pay, Report, Passport), sand highlight circle slides to the active tab, label under each icon |
| `Timeline` | Horizontal step tracker | done (slate fill, check), current (sand fill, navy icon, "Now" label), todo (hollow ring); progress bar beneath |
| `DotCalendar` | Dot grid by row | `worked` (sand), `off` (small grey), `future` (hollow), and `ok`/`warn`/`critical` (status fill + icon) for fatigue; optional select handler; always paired with an sr-only summary |
| `Gauge` | Semicircular segmented gauge (0–100) | Segments filled to the value in band colour; centre shows value + band label + icon |
| `Ring` | Timer-style progress ring | For pay and hours; value text sits inside. `arc="ink"` on sand cards |
| `IdBadge` | Lanyard ID badge (strap, clip, punched slot, dusk glow) | Auth (worker + supervisor login, role picker) and the Skill Passport |
| `ColumnChart` | Server-rendered column chart | y-axis ticks, hairline grid, optional average line, stacked series with 2px gaps, focusable tooltips, legend for 2+ series, table view |

### 18.5 Screen patterns

- **Worker home:** big "hours this week" number at top, then rounded cards (today, overtime, streak dot calendar, notices), then the primary action.
- **Worker check-in:** 3 steps (permission → scan inside sand corner brackets → result).
- **Worker pay:** ivory / navy / sand cards with rings, plus a Listen button.
- **Report tracking:** horizontal `Timeline`.
- **Auth:** dark `bg-aurora` page; the form lives inside an `IdBadge` (big role word like "WORKER" / "SUPERVISOR", sand role chip, sand pill submit).
- **Admin:** navy sidebar, top bar with the sector switcher, KPI `StatCard`s, bar chart, team table with `StatusPill`s. The quit-risk page uses `Gauge` plus heatmap tiles. The fatigue page uses a `DotCalendar` grid (workers × days).

### 18.6 Brand, glass and glow

- **Logo:** the PAYSA mascot (a site worker in a hard hat and shades), drawn as an original SVG (`Logo` = ivory tile, `Mascot` = bare). Always next to the "PAYSA" wordmark, which carries the name.
- **Glass** (`glass-dark`, `glass-light`): blurred, translucent surfaces only where content scrolls beneath or sits over a glow. That means sticky headers, the bottom nav, panels beside grids, and secondary cards on auth pages. Never put glass behind long body text.
- **Glow** (`bg-dusk`, `bg-aurora`): radial gradients of the palette. Peaks are capped at 25% sand / 60% slate, which keeps ivory/70 text ≥ 5:1 over them.
- **Charts:** one axis only, hairline solid gridlines, ≤ 28px bars with 4px rounded tops, 2px gaps between stacked segments, a legend for 2+ series, and always a table view. Regular hours are `slate-600`, overtime `sage-500`, today `navy-950` and rest days hatched.
