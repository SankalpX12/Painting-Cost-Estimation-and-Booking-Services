# Home Painting Service Estimator and Booking System
### FINAL Requirements and Build Plan for GitHub Copilot

> **How to use this file:** put it in the root of the repository. Ask Copilot to build **one phase at a time** (Section 12), in order. After each phase: run it, test it against Section 14, commit, redeploy.
> Every statement is labelled so nothing is guessed:
> - **[CONFIRMED]** the student (project owner) or the teacher's objective said this.
> - **[PROPOSED]** suggested by the planner because the student said "you suggest" or left it open. Change it only if the student says so.
> - **[DEFAULT]** a normal technical default chosen so the build can proceed.
> - **[OPEN]** not decided. **Do not invent an answer.** Use the interim behaviour described and leave a `// TODO(OPEN-n)` comment.

---

## 0. Scope at a glance (READ THIS FIRST)

**Today is Sun 15 Nov 2026. The submission deadline is Fri 20 Nov 2026 [CONFIRMED].** Development has only 3 days (15, 16 and 17 Nov); 18 to 20 Nov are for testing, deploying, recording and submitting.

### What to build
1. **The estimator (top priority, it is the teacher's required feature list, Section 3):** home size, painting type, paint quality with price per sq ft and stars, automatic paintable wall area with door and window deduction, itemized cost breakdown.
2. A **basic backend** (required by the teacher) with customer login, saved estimates, bookings and an admin dashboard.
3. **Extras (build only after 1 and 2 work):** colour picker and preview with The Color API, custom design add-on, multi-colour, print or save as PDF with estimate history, cost breakdown chart.
4. A **responsive, clean, interactive** UI, deployed online.

### What NOT to build (the student removed these)
Painter accounts or a marketplace, painters setting rates, price negotiation, "set my price" matching, weekday selection, in-person consultation, payments of any kind, QR codes, attendance, penalties, ratings of painters. **Do not add them.**

### Rules for Copilot
- One phase per request. Never leave half-working code; if a phase is too big, stop and tell the student what to cut.
- Never guess an **[OPEN]** item.
- Add no libraries beyond Section 4 without telling the student why.
- Follow the coding style in Section 5. The student must be able to explain every line in a viva.

---

## 1. Project context

| Item | Value |
|---|---|
| Project title | Home Painting Service Estimator and Booking System |
| Course | CSE326 (Internet Programming), Lovely Professional University [CONFIRMED] |
| Team name | **Code Crusaders** [CONFIRMED] |
| Team | 3 students. Every member must explain their part in a viva and appear in the video |
| Deadline | **20 Nov 2026** [CONFIRMED] |
| Language | JavaScript [CONFIRMED] |
| Backend | A **basic backend is required** and the app must be deployed online [CONFIRMED] |

### Marking rubric
- **Functionality and UI (15):** implementation of the problem statement, functional correctness, **completeness of required features**, UI design, usability and navigation, proper use of HTML/CSS/JavaScript, code organisation and quality, responsiveness and presentation.
- **Viva (10):** understanding of problem and solution, technologies, explaining code, individual contribution, technical questions; students may be asked to modify or explain any part live.
- **Video (5):** problem, motivation, solution, major features, working demo, technologies, outcomes, each member's contribution; all members appear.

---

## 2. The teacher's updated objective (copied exactly, this is the source of truth)

> **Objective:** Develop a responsive, interactive frontend application that helps users manage or access home painting service estimator and booking system.
> **Description:**
> • Home size input (1 BHK, 2 BHK, 3 BHK, Custom Square Footage) and Painting Type (Fresh Painting vs Repaint Touchup)
> • Paint quality selector (Economy Distemper, Premium Plastic Emulsion, Luxury Silk / Royal Sheen) with price per sq ft ratings
> • Paintable wall area calculator automatically deducting standard door and window openings
> • Itemized cost estimate breakdown separating Paint Material Costs, Putty/Primer Undercoat, and Labor Charges

---

## 3. Estimator requirements (Phase 1, the heart of the project)

All prices are in **Indian rupees (₹)** and shown with Indian digit grouping (for example ₹50,799) [CONFIRMED]. Prices exclude any tax and no tax line is shown [DEFAULT].

### 3.1 Home size [CONFIRMED options, approved sizes]
The customer chooses one of four options:

| Option | Floor area used |
|---|---|
| 1 BHK | **450 sq ft** |
| 2 BHK | **750 sq ft** |
| 3 BHK | **1,100 sq ft** |
| Custom square footage | The customer types a number. **It means WALL area** (the area of the walls to be painted), not floor area [CONFIRMED] |

- Floor areas for BHK are placeholders from typical ranges, kept in one config (Section 7), easy to change.
- **BHK wall area = 2.5 × floor area** [CONFIRMED]. Example: 2 BHK gives 2.5 × 750 = 1,875 sq ft.
- Nobody paints the floor: floor area is only used to estimate the wall area.
- Custom area must be a positive number (a sensible range such as 50 to 20,000 sq ft [DEFAULT]).

### 3.2 Ceiling option [CONFIRMED that it is included]
- A checkbox **"Include ceiling"**.
- For BHK homes, **ceiling area = the floor area** (for example 750 sq ft for 2 BHK) [CONFIRMED approach].
- For **custom** homes the customer enters the ceiling area in an optional extra field shown only when the checkbox is ticked [PROPOSED, OPEN-1].
- The ceiling uses the **same rates as walls** and **no door or window deduction** applies to it [PROPOSED, OPEN-5].

### 3.3 Painting type [CONFIRMED]
- **Fresh Painting:** full work: putty, primer, paint and labour at the standard rates. Rates assume **two coats of paint** [PROPOSED: coats are fixed, no coats input].
- **Repaint Touch-up:** covers the **whole area** [CONFIRMED]; **no putty** (primer only) and **labour at 70% of the fresh labour rate** [CONFIRMED approach].

### 3.4 Paint quality with price per sq ft and star ratings [CONFIRMED names and approved table]

| Quality (exact names) | Paint material ₹/sq ft | Putty + primer ₹/sq ft (fresh) | Labour ₹/sq ft (fresh) | **Fresh total ₹/sq ft** | Stars |
|---|---|---|---|---|---|
| Economy Distemper | 5 | 5.5 (putty 3 + primer 2.5) | 10 | **20.5** | ★★★ |
| Premium Plastic Emulsion | 12 | 5.5 | 12 | **29.5** | ★★★★ |
| Luxury Silk / Royal Sheen | 22 | 5.5 | 14 | **41.5** | ★★★★★ |

- The three quality cards show the **price per sq ft** (the total for the chosen painting type) and the **star rating**. Stars mean **finish quality and durability** [PROPOSED].
- Touch-up per sq ft = paint + primer 2.5 + labour × 0.7 (Economy 5 + 2.5 + 7 = 14.5, Premium 12 + 2.5 + 8.4 = 22.9, Luxury 22 + 2.5 + 9.8 = 34.3). The cards update when the painting type changes.
- These rates are **indicative placeholders** based on public Indian painting-cost guides, not quotes. If the teacher gives different numbers, only the config changes.

### 3.5 Doors and windows [CONFIRMED]
- The customer can **add any number of doors and windows**, each with a **size (width × height in feet)**; entries can be removed.
- If the customer adds **none**, the app uses **standard placeholders** [CONFIRMED approach]:
  - Standard **door 3 × 7 ft = 21 sq ft**; standard **window 3 × 4 ft = 12 sq ft**.
  - Default counts for BHK homes [CONFIRMED]: **1 BHK: 3 doors and 3 windows; 2 BHK: 5 doors and 4 windows; 3 BHK: 7 doors and 6 windows.**
  - A visible note tells the customer that standard openings were assumed.
- For **custom** area with no openings entered, the default counts of the **closest BHK** are used, where "closest" compares (custom wall area ÷ 2.5) with 450, 750 and 1,100 [PROPOSED, OPEN-1].
- If the customer enters openings, **only those are deducted** (the defaults are not added).
- Validation: widths and heights positive; total deduction must be **less than** the wall area.

### 3.6 Paintable area and formulas (all in one pure function file, `estimate.js`)

```
wallArea       = BHK: 2.5 × floorArea     |  Custom: the number entered
openingsArea   = sum of (width × height) of each door and window (entered or default)
paintableWalls = wallArea − openingsArea
ceilingArea    = 0, or (BHK: floorArea | Custom: entered ceiling area) if "Include ceiling" is ticked
paintableArea  = paintableWalls + ceilingArea

Fresh:     paintCost = paintableArea × paintRate(quality)
           puttyPrimerCost = paintableArea × 5.5
           labourCost = paintableArea × labourRate(quality)
Touch-up:  paintCost = paintableArea × paintRate(quality)
           puttyPrimerCost = paintableArea × 2.5      (primer only)
           labourCost = paintableArea × labourRate(quality) × 0.7

baseTotal      = paintCost + puttyPrimerCost + labourCost
```
- **Round each line to the nearest whole rupee and make the total the sum of the rounded lines**, so the numbers on screen always add up [DEFAULT].
- Show the working to the customer step by step: "Wall area 2.5 × 750 = 1,875", "Doors 5 × 21 = 105", "Windows 4 × 12 = 48", "Paintable area = 1,722 sq ft".
- **Itemized breakdown (required):** three separate lines, **Paint Material Costs**, **Putty/Primer Undercoat**, **Labor Charges**, then extras (if any), then the **Total**.

### 3.7 Estimator page behaviour
- One interactive page with clear steps (home size, painting type, quality, doors and windows, options, colour) and a **live result panel** that updates instantly as the customer changes anything.
- Works **without login** [PROPOSED, OPEN-4]. Saving and booking need login.
- The estimator must still work if the server is asleep or unreachable: the page ships with the default rates and uses the rates from the server only when they load [PROPOSED].

---

## 4. Technology stack

| Layer | Choice |
|---|---|
| Frontend | Plain **HTML, CSS, JavaScript** (no framework). Multi-page site, mobile-first responsive |
| Backend | **Node.js + Express** (REST API, JSON) |
| Database | **MongoDB Atlas** (free tier) with **Mongoose** |
| Hosting | **Render** web service. Express serves the API **and** the static frontend (one deployment, no cross-origin problems) |
| Passwords | `bcryptjs` hashing, never plain text |
| Login | `jsonwebtoken` (JWT) in `localStorage`, sent in the `Authorization` header |
| Config | `dotenv`; `.env` is never committed |
| External API | **The Color API** (Section 6.1) |

Packages: `express`, `mongoose`, `bcryptjs`, `jsonwebtoken`, `dotenv`. No chart library and no PDF library (see Section 6).

**Hosting notes**
- Render free services may sleep after inactivity, so the first request afterwards is slow. Open the site shortly before demos and before the evaluator looks. Check current free-tier limits on the Render and Atlas pages.
- Read the port from `process.env.PORT` (fallback 3000). Render: build `npm install`, start `npm start`.
- Allow the host in Atlas network access (weigh security against convenience for a student demo).
- Env variables: `MONGODB_URI`, `JWT_SECRET`; provide `.env.example` with fake values; `.gitignore` has `.env` and `node_modules`.
- The PDF names GitHub Pages "wherever applicable", but a project with a backend cannot run there; Render is acceptable and the submission sheet lists other hosts as examples [CONFIRMED].

---

## 5. Coding style rules (important for the viva)

- Use plain `function` declarations, `if / else`, `for` and `while` loops and simple comparisons.
- **Avoid** ternary operators, chained array methods, destructuring, spread syntax, one-line shortcuts and clever tricks. `async/await` and `fetch` are fine where required, with simple `try / catch`.
- Every file starts with a comment saying what it does; every function has a one-line comment; non-obvious lines are commented.
- Short functions, clear names. **All price maths lives in one file, `public/js/estimate.js`**, written so the same file works in the browser and in Node (end the file with a small check that exports the functions when `module` exists), so the server can re-check prices with the same code.
- Validate input in the browser and on the server; the server is the source of truth for saved data.
- Friendly error messages in the UI; no raw errors or blank screens.

---

## 6. Extras (build only after Phases 0 to 3 work)

### 6.1 Colour picker, preview and The Color API [CONFIRMED to keep]
- A **starter palette of about 24 colours** (`public/data/colours.json`, items `{ "name", "hex", "group" }`, plain generic names such as "Sky Blue", no brand shade names) plus a **native colour picker** for any custom colour.
- **Colour preview:** a simple CSS wall or room mock-up that shows the chosen colour.
- **The Color API** (thecolorapi.com): read its official documentation for exact parameters; do not guess them. It has two endpoints: `/id` (a name for a colour you supply) and `/scheme` (matching colours for a seed colour; modes include monochrome, analogic, complement, triad, quad). It has **no list-all-colours endpoint**, so the palette is ours. It needs no key and allows browser requests, but it is a free service with best-effort uptime.
- **Use it to:** (a) name the colour the customer picks; (b) show matching colours.
- **A fallback is mandatory:** if the API fails or is slow, everything else still works and a short friendly note appears.
- The chosen colour is saved with the estimate and booking.

### 6.2 Custom design add-on [CONFIRMED to keep, values PROPOSED]
- Optional checkbox: the customer enters the **area (sq ft) that has the design** and a short description.
- **Extra charge = designed area × ₹50 per sq ft** [PROPOSED placeholder, OPEN-2]. The designed area must not exceed the paintable area.
- Shown as its own line "Custom Design" in the breakdown.

### 6.3 Multi-colour [CONFIRMED to keep, model PROPOSED]
- **Main colour** plus up to **3 accent colours** [DEFAULT limit], each accent with its own **area in sq ft** (total accent area must not exceed the paintable area).
- **Extra charge = ₹500 flat for each accent colour** [PROPOSED placeholder, OPEN-2]. Rates per sq ft do not change.
- Shown as its own line "Additional Colours".

### 6.4 Print, save as PDF and estimate history [CONFIRMED to keep]
- A **Print / Save as PDF** button using the browser's print function with a clean print stylesheet (no PDF library).
- Logged-in customers can **save** an estimate and see **My Estimates** (list, open, delete).

### 6.5 Cost breakdown chart [CONFIRMED to keep]
- A simple chart (stacked bar or pie) of paint material, putty/primer and labour, built with plain HTML/CSS (or inline SVG), no library.

### 6.6 Admin dashboard [CONFIRMED to keep; scope PROPOSED]
- View **all bookings**, change a booking **status** (`pending`, `confirmed`, `completed`, `cancelled`), and **edit the rate table** (paint and labour rates per quality, putty and primer rates, stars, design rate, extra-colour fee). Optional: list of registered users.

---

## 7. Rates and settings config (single source)

Stored in the database as one settings document, seeded with these defaults, and also kept as a default object in `estimate.js`:

```
qualities: economy (name "Economy Distemper", stars 3, paint 5, labour 10),
           premium (name "Premium Plastic Emulsion", stars 4, paint 12, labour 12),
           luxury  (name "Luxury Silk / Royal Sheen", stars 5, paint 22, labour 14)
putty 3, primer 2.5, touchUpLabourFactor 0.7, wallMultiplier 2.5
bhkFloorArea: 1 -> 450, 2 -> 750, 3 -> 1100
standard door 3 x 7 ft, standard window 3 x 4 ft
default openings: 1 BHK 3 doors 3 windows; 2 BHK 5 doors 4 windows; 3 BHK 7 doors 6 windows
customDesignRatePerSqFt 50, extraColourFee 500
```
Admin can edit the rate fields; the other values are fixed in code.

---

## 8. Booking and accounts [PROPOSED because the student said "you suggest"]

- **Roles:** `customer` and `admin` only. Registration creates a customer. The admin is created by a **seed script** (credentials in the README only).
- **Customer:** register, log in, use the estimator (login not needed to calculate), **save** estimates, **book** a saved or current estimate, view **My Bookings**, **cancel** a booking while it is `pending`.
- **Booking form:** name, phone (10 digits), email, address (line, city, pincode), **preferred start date** (today or later), optional notes. The booking stores a **snapshot** of the estimate inputs and breakdown so later rate changes do not alter it.
- Booking status values: `pending` (default), `confirmed`, `completed`, `cancelled`. Only the admin sets `confirmed` and `completed`.
- **No payment feature** [CONFIRMED].

---

## 9. Data model

**User** `name, email (unique, lower-case), phone, passwordHash, role ("customer" | "admin"), createdAt`
**Settings** one document as in Section 7.
**Estimate** `user, inputs { homeType, bhk, customWallArea, paintingType, quality, includeCeiling, customCeilingArea, openings [ { kind, width, height } ], usedDefaultOpenings, designArea, designDescription, colours { main {name, hex}, accents [ {name, hex, area} ] } }, breakdown { wallArea, openingsArea, ceilingArea, paintableArea, paintCost, puttyPrimerCost, labourCost, designCost, extraColourCost, total }, createdAt`
**Booking** `user, estimateSnapshot (the same inputs and breakdown), contact { name, phone, email }, address { line, city, pincode }, preferredStartDate, notes, status, createdAt`
No password in any response; money stored as numbers in rupees.

---

## 10. REST API (JSON, prefix `/api`; error shape `{ "message": "..." }`)

| Method and path | Who | Purpose |
|---|---|---|
| GET `/settings` | public | Rates and settings for the estimator |
| PUT `/admin/settings` | admin | Edit rates |
| POST `/auth/register`, `/auth/login`; GET `/auth/me` | public / logged in | Accounts |
| POST `/estimates` | customer | Save an estimate (server recomputes with the shared `estimate.js` and rejects a mismatch) |
| GET `/estimates/mine`, DELETE `/estimates/:id` | customer | History |
| POST `/bookings` | customer | Create booking from an estimate |
| GET `/bookings/mine`; PATCH `/bookings/:id/cancel` | customer | My bookings, cancel pending |
| GET `/admin/bookings`; PATCH `/admin/bookings/:id/status` | admin | Manage bookings |
| GET `/admin/users` | admin | Optional list |

Use proper status codes (200, 201, 400, 401, 403, 404, 500).

---

## 11. Pages (static HTML in `public/`)

`index.html` (landing and navigation), `estimator.html` (main page, Section 3 and extras), `login.html`, `register.html`, `book.html`, `my-estimates.html`, `my-bookings.html`, `admin.html` (bookings, status, rate table).
Suggested folders: `server.js`, `config/`, `models/`, `routes/`, `middleware/`, `scripts/seed.js`, `public/css/`, `public/js/` (`estimate.js`, page scripts), `public/data/colours.json`.
UI rules: consistent header and footer, role-based navigation, mobile-first responsive layout (test about 360 px, 768 px, desktop), labelled inputs with inline validation, loading and empty states, sufficient contrast, keyboard-usable controls, calm professional style with CSS variables.

---

## 12. Build plan

| Day | Date | Phase and work | Done when |
|---|---|---|---|
| 1 | **Sun 15 Nov** | **Phase 0:** repo, structure, Express, Atlas connection, `.env`, README, **deploy a "hello" version to Render**. **Phase 1:** `estimate.js`, `estimator.html` with **all four objective features** (Section 3) and default rates | Test cases 1 to 5 in Section 14 pass in the browser |
| 2 | **Mon 16 Nov** | **Phase 2:** settings API, register and login, save estimates, history. **Phase 3:** booking, My Bookings, admin dashboard (bookings, status, rate edit), seed script | A customer can estimate, save and book; admin can confirm |
| 3 | **Tue 17 Nov** | **Phase 4 (extras, in this order):** 4a colour picker, preview and Color API with fallback; 4b custom design; 4c multi-colour; 4d print or PDF and history UI; 4e cost chart | Each extra works with its tests |
| 4 | **Wed 18 Nov** | **Phase 5:** responsive fixes, validation, polish, run the whole Section 14, redeploy, **record the screen demo** | Everything works on the live site |
| 5 | **Thu 19 Nov** | Edit the video, fill and check the submission sheet, verify all links, **submit** | Submitted |
| Buffer | Fri 20 Nov | Deadline day: do not plan to use it | - |

**If the schedule slips, cut in this order:** cost chart, then print/PDF, then multi-colour, then custom design, then colour preview and Color API. **Never cut:** the four objective features, login, booking, admin status, deployment.
Redeploy after every phase to find hosting problems early. **Deploy only working code.**

---

## 13. Deployment checklist
Repo accessible to the evaluator with **all** source code; `.env` not committed; Render env variables set; live site opens and the estimator, login, saving, booking and admin all work; site woken up shortly before evaluation; README with description, features, tech stack, local run steps, seed command, sample logins and team members.

---

## 14. Test checklist (a teammate runs it after each phase; check with a calculator)

**Estimator (rates from Section 3.4, no extras):**
1. **2 BHK, Fresh, Premium, no openings entered:** wall 1,875; openings 5×21 + 4×12 = 153; paintable **1,722**; paint ₹20,664; putty/primer ₹9,471; labour ₹20,664; **total ₹50,799**.
2. **Same plus "Include ceiling":** paintable 1,722 + 750 = **2,472**; paint ₹29,664; putty/primer ₹13,596; labour ₹29,664; **total ₹72,924**.
3. **1 BHK, Fresh, Economy, no openings:** wall 1,125; openings 3×21 + 3×12 = 99; paintable **1,026**; paint ₹5,130; putty/primer ₹5,643; labour ₹10,260; **total ₹21,033**.
4. **2 BHK, Touch-up, Premium, no openings:** paintable 1,722; paint ₹20,664; primer only ₹4,305; labour ₹14,465 (8.4 × 1,722 = 14,464.8 rounded); **total ₹39,434**.
5. **Custom wall area 1,000, 2 doors 3×7 and 1 window 4×4 entered, Fresh, Luxury:** openings 42 + 16 = 58; paintable **942**; paint ₹20,724; putty/primer ₹5,181; labour ₹13,188; **total ₹39,093**.
6. Entered openings replace the defaults (not added to them); the "standard openings assumed" note appears only when defaults are used.
7. Rejected: custom area zero, negative or text; opening size zero or negative; openings larger than the wall area.
8. Price per sq ft on the quality cards changes with painting type (Fresh 20.5 / 29.5 / 41.5; Touch-up 14.5 / 22.9 / 34.3).
9. Line items always add up exactly to the total shown.
**Extras:** design 100 sq ft adds ₹5,000; each accent colour adds ₹500; design or accent area larger than the paintable area is rejected; palette loads; picking a colour shows the preview; Color API failure still lets everything work; print view is clean.
**Accounts and booking:** duplicate email rejected; wrong password rejected; estimator works without login; saving and booking need login; booking stores the snapshot; changing rates later does not alter existing bookings; customer cancels only a pending booking; admin changes status; a customer cannot open admin pages.
**Responsive:** all pages usable at phone width, no sideways scrolling.

---

## 15. Submission (what the teacher asked for)
Upload **one Excel (.xlsx) or doc file on UMS** with one row and these columns:
`Project Name & Title | Team Name | Course Code | Registration Number(s) | GitHub Link | Deployed Link | Video Presentation Link`
Fill: **Team Name = Code Crusaders**, **Course Code = CSE326** [CONFIRMED], registration numbers of **all** members, working links. The project must match the assigned title.

---

## 16. Open items (do not guess; ask the student)

| ID | Question | Interim behaviour |
|---|---|---|
| OPEN-1 | Ceiling and default openings for **custom** wall area | Optional ceiling field; defaults from the closest BHK |
| OPEN-2 | Values for custom design (₹50 per sq ft) and extra colour (₹500) | Use these placeholders from the config |
| OPEN-3 | Whether the multi-colour model (main plus accents with areas) is what the student wants | Build as in 6.3 |
| OPEN-4 | Estimator usable without login | Yes, as in 3.7 |
| OPEN-5 | Ceiling uses the same rates as walls with no opening deduction | Yes, as in 3.2 |
| OPEN-6 | Whether the teacher has her own rate numbers or BHK sizes | Use the placeholders; change only the config |

---

## 17. Suggested prompts for Copilot (one per request)

1. "Read COPILOT_SPEC.md. Do **Phase 0** only: structure, Express server, Atlas connection, dotenv, .gitignore, README, health route. Follow Section 5."
2. "Do **Phase 1**: create `public/js/estimate.js` (Section 3.6, in the plain style of Section 5, with rounding and an export check) and `estimator.html` with all four objective features. Include a small script or comments that checks test cases 1 to 5 from Section 14."
3. "Do **Phase 2**: settings API, register, login, saving estimates and history."
4. "Do **Phase 3**: booking, My Bookings, admin dashboard and the seed script."
5. "Do **Phase 4a, then 4b, 4c, 4d, 4e** (one at a time): Section 6."
6. "Do **Phase 5**: polish, responsiveness, validation, run Section 14, prepare for deployment."
7. If Copilot meets an **[OPEN]** item it must use the interim behaviour and add `// TODO(OPEN-n)`, not decide for itself.
