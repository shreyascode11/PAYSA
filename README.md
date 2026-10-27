<div align="center">

<img src="public/icon.svg" alt="PAYSA logo" width="96" />

# PAYSA

**Fair pay. Safe work. A voice for every worker.**

PAYSA is a workforce app for the people who build and run our workplaces: construction crews and campus support staff.<br />
Every hour is counted, every payslip makes sense, and anyone can report danger without risking their job.

**[Open the live app →](https://paysa-eight.vercel.app)**

English · தமிழ் · हिंदी

</div>

---

## The problem

A construction worker finishes a 12-hour shift. His payslip says 8.
He can't read the breakdown, and he can't ask why.
If he reports the broken scaffolding, he may not have a job tomorrow.

Across India, labour-intensive workplaces still run on paper registers, spreadsheets and WhatsApp. Overtime disappears, exhaustion goes unnoticed until someone is hurt, and workers stay silent because speaking up is risky.

## Chosen vertical

**UN Sustainable Development Goal 8: Decent Work and Economic Growth.**

PAYSA is built around two people:

| | The worker | The supervisor / HR |
|---|---|---|
| **Who** | A daily-wage or shift worker: a mason, a helper, a housekeeper, a security guard. Often has low literacy and a basic Android phone, and their first language isn't English. | The person responsible for a site or a campus team. |
| **Their question** | *"Was I paid fairly, am I safe, and can I speak up without risk?"* | *"Who needs help **before** they get hurt or quit?"* |

| SDG 8 target | How PAYSA addresses it |
|---|---|
| **8.5** Decent work and equal pay | Hours and overtime counted automatically; a payslip explained in plain words, in the worker's language, read aloud |
| **8.7** Signals of forced labour | Excessive hours, too little rest, late pay, and anonymous reports of forced overtime or threats are surfaced to HR, with reasons |
| **8.8** Safe working environments | Anonymous, voice-first hazard reporting with tracking and a private two-way chat |

## What PAYSA does

### For workers: a simple, spoken app on any phone

- **Start and end work in one tap.** Scan the site's QR poster or use GPS on site. PAYSA counts the hours and overtime automatically, so there's nothing to argue over.
- **A payslip you can understand.** Normal pay, overtime (at 2×) and deductions are shown as clear cards with a plain-language explanation. A **Listen** button reads it aloud. If something looks wrong, one tap opens a pay complaint already filled in for that week.
- **Report danger without fear.** Tap an icon, hold the button and speak in your own language, and optionally add a photo. Reports are **anonymous by default**.
- **Follow up safely.** Every report gets a **tracking code**. Use it to see progress and chat with HR, without ever revealing who you are.
- **Rest reminders.** A gentle warning appears when the hours become unsafe, with the reason and the numbers: *"You worked 63 hours this week (limit 60)."*
- **Speak up every week.** A one-tap mood check and an anonymous space for feedback about managers or conditions.
- **A Skill Passport.** Verified days worked, skills and employer endorsements, shareable as an ID badge or QR code. Phone number and wages are never shown.
- **Notices in your language**, which can be read aloud.

### For supervisors and HR: see problems before they become injuries or resignations

- **Live overview:** who's on site, attendance over 14 days, regular vs overtime hours each week, open reports by severity and how fast they get resolved.
- **Critical alerts** for life-threatening reports, at the top of the dashboard.
- **Reports inbox:** filter, update status and reply anonymously. Every update appears on the worker's tracking page.
- **Fatigue grid:** every worker across the last 14 days, why each day was flagged, and a log of what was done about it.
- **Quit risk:** an explainable 0–100 score for each worker, with the reasons and a suggested next step.
- **Daily QR posters** for each site, and notices that reach workers in their language.

## How it works

```
 Check in (QR or GPS) ──► hours & overtime ──► payslip in the worker's language
          │                     │
          │                     └──► fatigue rules ──► rest alerts for the worker and HR
          │
          └──► attendance patterns ──► explainable quit-risk for HR

 Report a hazard (voice, any language, anonymous) ──► tracking code ──► status + private chat
```

One check-in feeds everything. Every alert and score is produced by clear, fixed rules and always explains itself.

## Approach and decision logic

PAYSA adapts to **who** is using it and **what is happening to them**:

| Situation | What PAYSA decides | The rule |
|---|---|---|
| Hours worked | Overtime and pay | Hours beyond 8 a day are overtime (configurable, never above 9). Regular hours beyond 48 in a Mon–Sun week also count, without double-counting. Shifts that cross midnight are split across days. Overtime is paid at 2×. |
| Shift pattern | Fatigue level | **Warning:** a shift over 10h, under 11h of rest, more than 6 days in a row, or over 54h in a week. **Critical:** a shift over 12h, under 8h of rest, or over 60h in a week. |
| Last 14 days vs the worker's own normal | Quit-risk score, 0–100 | Points for rising absences (+20), fatigue days (+5 each, up to 20), weeks over 54h (+15), late pay (+20), low team mood (+10), joining in the last 90 days (+10) and a team that has gone quiet (+5). Under 30 is low, 30–59 medium, 60+ high. The reasons and a suggested action are always shown. |
| A report, in any language | Category and urgency | Recognises danger words in English, Tamil and Hindi. AI can refine the result but can never make a report look less urgent than the safety rules found. |
| Anonymous or named | What is kept | Anonymous reports keep no name and only the hour they were sent. A random tracking code is the only way back. |
| Team size | What HR can see | Team mood is shown only when at least 5 people answered, so no one can be singled out. |
| Location or QR code | Whether check-in is allowed | The worker must be inside the site's boundary, or scan today's QR code (they change daily). Checking in twice is blocked. |
| Language, sector, role | What each person sees | Screens, voice and even spoken times (காலை 7:09, सुबह 7:09) follow the worker's language. Hazard types and skills follow the workplace. Workers see only their own data, and supervisors only their own organisations. |

## Tracking codes

A tracking code, such as **`PS-7K2Q9M`**, is the receipt a worker gets after sending a report.

- **It is the only link between the worker and the report.** Anonymous reports keep no name, phone number or exact time.
- **Anyone holding it can check progress** from any phone, without logging in. They see the status (*Received → Being checked → Action taken → Solved*) and can talk to HR privately.
- **It is easy to read out and write down.** Look-alike characters such as 0/O and 1/I/L are never used, and codes are random, so they can't be guessed.

Try **`PS-7K2Q9M`** (a scaffolding hazard reported in Tamil) or **`PS-H3KMT4`** (missing safety gear, with an ongoing chat) on the [home page](https://paysa-eight.vercel.app).

## One platform, many workplaces

The same app runs different workplaces, each with its own hazards, skills and shift patterns:

| | Construction site | College campus staff |
|---|---|---|
| Example | Sri Vinayaka Builders: 2 sites, 13 workers | Greenfield College of Engineering: 2 sites, 12 workers |
| Hazards | Fall from height, missing safety gear, electrical, machinery, heat, collapse | Wet floors, cleaning chemicals, electrical, heavy lifting, harassment |
| Shifts | Day shifts | Rotating morning / evening / night, including 12-hour security shifts |
| Skills | Masonry, bar bending, scaffolding, welding… | Housekeeping, gardening, lab assistance, security… |

Hospitals and factories need a new configuration, not a new product.

## Try it

Open **[paysa-eight.vercel.app](https://paysa-eight.vercel.app)** and pick a badge. All worker accounts use PIN **1234**.

| Sign in as | Phone / email | Worth a look |
|---|---|---|
| Construction worker (Tamil) | `9000000001` | Rest alert, heavy overtime on last week's payslip, endorsed skills |
| Construction worker (Hindi) | `9000000002` | The whole app in Hindi |
| Campus housekeeping (Tamil) | `9000000101` | Rotating shifts and short rest between shifts |
| Supervisor / HR (both workplaces) | `admin@paysa.demo` / `demo1234` | Critical alert, charts, fatigue grid, quit risk; switch workplace in the top bar |

The demo data is generated relative to today, so there is always recent activity to explore.

## Privacy by design

- **Anonymous means anonymous.** No name, phone number or exact time is kept, and photos are stripped of location and camera data, both on the phone and again on the server.
- **No singling out.** Team-level results are hidden until at least 5 people have answered.
- **Anonymous reports never count against anyone.** They are never used in a worker's quit-risk score.
- **Feedback about managers is always anonymous.**
- **The Skill Passport never shows phone numbers or wages.**

## Built for everyone

- **Three languages:** English, Tamil and Hindi, with a **Listen** button on every worker screen and voice input that understands each language.
- **Icon first:** large buttons and one main action per screen, designed for low literacy and small, low-cost phones.
- **Accessible:** meets WCAG 2.2 AA (zero issues found by the axe accessibility checker across every page). Full keyboard use, clear focus outlines, and status always shown with an icon and words, never by colour alone.
- **Light on data:** the worker home screen loads about 109 KB of JavaScript.

## Assumptions

- Workplaces are in India: times are India Standard Time and pay is in rupees (₹).
- The working week runs Monday to Sunday with six working days, and pay is calculated weekly.
- Overtime starts after 8 hours a day or 48 a week and is paid at 2×; ESI health insurance is deducted at 0.75%. These follow common Indian practice and can be configured.
- Workers have a basic Android phone with a camera and a browser. Read-aloud and voice typing depend on the phone's installed Tamil/Hindi voices.
- Workers sign in with a phone number and a 4-digit PIN; a production rollout would add one-time-password verification.
- The live demo uses generated sample data and may reset.
- AI features are optional: without them, every feature still works using fixed rules.
- The supervisor dashboard is in English; the worker app is fully trilingual.

## Built with

Next.js 15 · TypeScript · Tailwind CSS · Firestore · Gemini (optional) · Vercel

Tested with 149 automated tests covering pay, overtime, fatigue, quit-risk, privacy, security and accessibility.

---

<div align="center"><sub>Built for Prompt Wars 2026 × SRM ACM Student Chapter · UN SDG 8: Decent Work and Economic Growth</sub></div>
