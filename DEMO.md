# PAYSA demo guide

A guided tour of **[paysa-eight.vercel.app](https://paysa-eight.vercel.app)**. It works on any phone or laptop browser, with no install.

## Demo accounts

| Who | Sign in with | PIN / password | Language |
|---|---|---|---|
| Murugan, mason (construction) | `9000000001` | `1234` | Tamil |
| Ramesh, helper (construction) | `9000000002` | `1234` | Hindi |
| Lakshmi, housekeeping (college campus) | `9000000101` | `1234` | Tamil |
| Supervisor / HR (both workplaces) | `admin@paysa.demo` | `demo1234` | English |

Each worker opens in their own language. Switch anytime with **EN · தமிழ் · हिंदी** at the top right.

> The demo uses generated sample data based on today's date. It may reset, so anything you add can disappear later.

---

## The 3-minute tour

Use a phone (or a narrow browser window) for the worker steps and a second tab for the supervisor.

1. **Open the app.** Two ID badges hang on the page: **Worker** and **Supervisor**.
2. **Worker: see the problem.** Tap **Enter** on the Worker badge and sign in as `9000000001`.
   - A big **hours this week** number and a yellow **rest warning** that gives the reason, e.g. *"You worked 15 days in a row"*.
   - Tap **Pay**. Last week shows **a lot of overtime**, every hour counted and paid at 2×. Tap **Listen** to hear the payslip read aloud.
3. **Worker: report danger.** Tap **Report**, choose **Fall from height**, type *"Railing missing on level 3"*, leave **Hide my name** on, and **Send report**. Note the **tracking code** (e.g. `PS-XXXXXX`).
4. **Supervisor: respond.** In another tab, sign in as `admin@paysa.demo`.
   - A **red critical alert** heads the dashboard.
   - Open **Reports**. Your report is there, marked **Anonymous: identity not stored**.
   - Open it, set the status to **Action taken**, add a note, and send a reply in the chat.
5. **Worker: follow up anonymously.** Back on the landing page, enter the tracking code under **Enter your tracking code**. The timeline has moved to *Action taken*, and HR's reply is waiting. HR never learned who sent it.

---

## Full walkthrough: worker app

### Home
Sign in as `9000000001`.

- **Hours this week** (big number), **today's hours** in a ring, and the overtime line.
- **Rest warning:** yellow for a warning, red for critical. It always states the reason and the limit.
- **Start work:** the one main action on the screen.
- **Days worked:** a dot calendar for the last 5 weeks. Filled = worked, small = day off, hollow = still to come.
- **"How was your week?"** card leads to the anonymous mood check.
- **Notices** from the employer appear in the worker's language, each with a 🔊 button.

### Start and end work (check-in)
Tap **Start work**. There are three steps: *Ready → Scan → Done*.

- **Scan site QR:** on a laptop, sign in as the supervisor and open **Sites & QR**. Point the phone's scanner at the construction poster.
- **No second device?** On the **Sites & QR** page, click **test link** under a poster. It opens the check-in exactly as if the QR had been scanned.
- **Use my location:** GPS check-in only works inside the site's boundary. Away from the site you'll see *"You are … metres away"*, which shows the geofence working.
- **Trouble scanning?** Use **Take a photo of the code** instead.
- Once you've started work, the button changes to **End work**; a second check-in is blocked. Tap **End work** to finish the shift.

### Pay
- Use **‹ ›** to move between weeks.
- **You get:** the take-home amount, showing gross minus deductions.
- **Normal pay** and **Overtime pay** cards, each with a ring showing the hours.
- **Cut from pay:** ESI health insurance, plus any advance taken.
- **What this means:** 3–5 plain sentences, in the worker's language, that can be listened to.
- **Something wrong?** opens a pay complaint already filled in with that week.

### Report a problem
- Choose **Danger / safety** or **Complaint**, then tap an icon.
- **Hold to speak** in English, Tamil or Hindi and your words appear as text. You can also type, and optionally **add a photo**. The photo's location data is removed.
- **Hide my name** is on by default. Turn it off to share your name with HR.
- After sending, you get a tracking code with **Copy** and **Listen** buttons.

### Report status (tracking code)
Enter a code on the landing page, or try these ready-made ones:

| Code | What it shows |
|---|---|
| `PS-7K2Q9M` | A critical scaffolding hazard reported in Tamil. Open it in English and it shows the English version, with **Translated from தமிழ் · show original** |
| `PS-H3KMT4` | A missing-safety-gear report with an ongoing chat between the worker and HR |

You'll see the step timeline, HR's notes and the private chat, and you can reply without revealing who you are.

### My voice
From the home card:

- **How do you feel about work this week?** Tap one of five faces. Once a week, completely anonymous.
- **Tell us more:** feedback about a manager or conditions. It's **always anonymous**.

### Skills (Skill Passport)
- An ID badge with **verified days worked**, skills and levels, and **Endorsed by** badges.
- **Share my passport** shows a QR code and link. Open the link while signed out: no phone number or wages appear.

### Languages
Switch to **தமிழ்** or **हिंदी** on any screen. Everything changes: labels, payslip explanation, read-aloud voice, and even spoken times (*காலை 7:09*, *सुबह 7:09*).

---

## Full walkthrough: supervisor / HR dashboard

Sign in as `admin@paysa.demo` / `demo1234`. The top bar has a **Construction | College** switch.

### Overview
- A **red banner** for life-threatening reports.
- **Key numbers:** on site now, open reports, average resolution time, workers with critical fatigue, high quit risk.
- **Attendance, last 14 days:** rest days are hatched and today is dark. Hover or tab onto any bar for details, or use **Show as table**.
- **Hours worked per week:** regular vs overtime, with a badge flagging high overtime.
- **Team mood:** shown only when 5 or more people answered. Switch to **College** to see *"Not enough responses"* for a small team.
- **Team: needs attention first:** who is on site, fatigue and quit risk, with the top reason for each.

### Reports
- Filter by type, severity, status and site.
- Open a report to see the original language and the English translation, any photo, and the timeline.
- **Update status**, change severity or category, and add a note. The worker sees it on their tracking page.
- **Anonymous follow-up chat:** ask a question without ever knowing who you're talking to.

### Fatigue
- Every worker × the last 14 days as dots: green OK, yellow ⚠ warning, red ⛔ critical, small dot = day off.
- Click a dot to see **why** (e.g. *"Shift of 12.9h (limit 12)"*), then **Log action**: rest day given, shift swapped, hours reduced, or talked with worker.

### Quit risk
- A **gauge** for the average risk, plus counts of high, medium and low.
- **Most common reasons** across the team.
- A **risk map** with one tile per worker; click a tile for that worker's details.
- **Why, and what to do:** the top two reasons for each worker and a suggested action, e.g. *Reduce hours*, *Check pay delay*.

### Workers
- Everyone with their role, team, daily wage and risk.
- Open a worker for this week's hours, fatigue and quit-risk reasons. **Endorse** a skill, and it appears on that worker's Skill Passport.

### Sites & QR
Printable QR posters for each site. They **change every day**, so an old photo of a poster stops working.

### Notices
Post a short notice and add Tamil or Hindi versions. Workers see it in their own language and can listen to it.

---

## Try the other workplace

1. Switch the supervisor dashboard to **College**. A **harassment report from a night shift** is flagged as critical, and there are 12-hour security shifts in the fatigue grid.
2. Sign in as worker `9000000101` (Lakshmi). Her week shows **rotating shifts**: morning, evening and night.

Same app, different hazards, skills and shift patterns, set by configuration rather than separate products.

---

## Things to notice

- **Every number explains itself:** rest warnings, quit-risk scores and payslips always show *why*.
- **Anonymity holds end to end:** the tracking page never shows a name, and HR sees *"Anonymous: identity not stored"*.
- **Built for real workers:** large icons, one main action per screen, read-aloud everywhere, three languages, and it runs on low-cost phones.
- **Accessible:** try navigating with only the keyboard (Tab / Enter). Every control is reachable, with a visible focus outline.
