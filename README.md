# Home Painting Service Estimator and Booking System

Course project for **CSE326: Internet Programming** at Lovely Professional University. Team name: **Code Crusaders**.

This application helps a customer estimate the cost of painting a home, save estimates, and submit a booking request. Administrators can review bookings, update booking statuses, and edit prices. Prices are illustrative project rates in Indian rupees, not contractor quotes.

## Features

- **Home area:** choose 1 BHK, 2 BHK, 3 BHK, or enter a custom wall area. BHK floor areas are 450, 750, and 1,100 sq ft; estimated wall area is 2.5 times floor area.
- **Painting type:** Fresh Painting includes putty, primer, paint, and labour. Repaint Touch-up covers the selected paintable area, uses primer without putty, and charges 70% of the fresh labour rate.
- **Paint quality:** Economy Distemper, Premium Plastic Emulsion, and Luxury Silk / Royal Sheen. Each option shows a star rating and the current combined rate per sq ft.
- **Area calculation:** subtract standard or user-entered door and window areas from wall area. BHK ceilings use floor area; custom homes can enter a ceiling area.
- **Itemized estimate:** Paint Material Costs, Putty/Primer Undercoat, Labor Charges, optional extras, and a total. Each charge is rounded to a whole rupee and the total is the sum of those rounded lines.
- **Customer accounts:** register and sign in to use the estimator. Passwords are hashed with bcrypt; the app returns a signed JWT for authenticated API requests.
- **Saved estimates:** save, reopen, and delete estimates in customer history. The server recalculates estimates before saving them.
- **Bookings:** submit a booking for a current or saved estimate. A booking stores a snapshot of its estimate and starts with `pending` status. Customers can cancel pending bookings.
- **Administrator tools:** view bookings, update their status, and edit the supported rates. Admin routes require an administrator account.
- **Colour preview:** choose a colour from the local starter palette or a native colour input. The Color API can name colours and suggest matching schemes. The palette and preview do not depend on that external service being available.
- **Optional extras:** custom design is charged at ₹50 per sq ft; each of up to three accent colours adds ₹500. Accent areas and design area cannot exceed paintable area.
- **Print and chart:** print the estimate or use the browser's Save as PDF option. A CSS chart compares paint, undercoat, and labour costs.

## Technology

- Frontend: HTML, CSS, and browser JavaScript
- Backend: Node.js and Express
- Database: MongoDB Atlas with Mongoose
- Authentication: bcryptjs and JSON Web Tokens
- Configuration: dotenv
- Hosting target: one Render web service serves both the API and static pages
- Tests: Node's built-in test runner

The app intentionally does not include payments, painter accounts, a painter marketplace, price negotiation, or external PDF/chart libraries.

## How the estimate works

For BHK homes, the estimated wall area is `floor area × 2.5`. For custom homes, the entered number is already the wall area. Door and window areas are subtracted from the walls. If no openings are entered, the app uses the configured standard sizes and counts. An included ceiling adds its area without opening deductions.

The paintable area is multiplied by the chosen rates. The default fresh rates per sq ft are:

| Quality | Paint | Putty + primer | Labour | Fresh total |
| --- | ---: | ---: | ---: | ---: |
| Economy Distemper | ₹5 | ₹5.50 | ₹10 | ₹20.50 |
| Premium Plastic Emulsion | ₹12 | ₹5.50 | ₹12 | ₹29.50 |
| Luxury Silk / Royal Sheen | ₹22 | ₹5.50 | ₹14 | ₹41.50 |

All rate defaults live in [public/js/estimate.js](public/js/estimate.js). That file is used by the browser and Node server so both calculate from the same formulas. The administrator-editable rate table is initialized from those defaults in MongoDB.

## Pages and main folders

- `public/index.html`: project home page
- `public/estimator.html`: estimator inputs, preview, itemized total, chart, save, book, and print controls
- `public/login.html` and `public/register.html`: customer account pages
- `public/my-estimates.html` and `public/my-bookings.html`: customer history
- `public/book.html`: booking contact, address, and preferred start date
- `public/admin.html`: administrator booking and rate dashboard
- `public/js/`: browser interactions and shared calculation logic
- `public/css/`: responsive page and print styles
- `public/data/colours.json`: generic starter colour palette
- `routes/`: Express API routes
- `models/`: MongoDB data models
- `middleware/auth.js`: JWT and role checks
- `config/`: database connection, settings defaults, and estimate verification
- `scripts/seed.js`: initializes default rates and creates the first administrator
- `test/estimate.test.js`: estimator acceptance and validation tests

## Requirements

- Node.js and npm
- Git
- A public GitHub repository for source code
- MongoDB Atlas project and database deployment
- Render account and web service

The Color API does not require a key or account. The project does not require a payment provider, email provider, or custom domain.

## Local setup

1. In PowerShell, go to the project folder and install packages:

	```powershell
	npm install
	```

2. Copy the example configuration file:

	```powershell
	Copy-Item .env.example .env
	```

3. In `.env`, replace the `MONGODB_URI` placeholder with the connection string from Atlas. Create a database user in Atlas and allow your current IP in the project's Network Access settings.
4. Generate a JWT secret locally:

	```powershell
	node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
	```

	Put the output in `.env` as `JWT_SECRET=<generated-value>`. Keep it private.

5. Add a private admin email and password to `.env`:

	```text
	ADMIN_EMAIL=your-admin-email@example.com
	ADMIN_PASSWORD=your-private-password
	```

6. Create the initial admin account and default rate settings:

	```powershell
	npm run seed
	```

7. Start the website and API:

	```powershell
	npm start
	```

8. Open `http://localhost:3000`. Check `http://localhost:3000/api/health`; the database field should be `connected`. Register a customer account to use the estimator. Sign in with the seeded credentials to open the admin page.

The seed command is safe to run again: it keeps an existing administrator and ensures the default settings exist. If `ADMIN_EMAIL` already belongs to a customer account, choose a different admin email.

## Tests

Run the calculator tests with:

```powershell
npm test
```

The suite checks the required estimate examples, rounding, input validation, custom-design fees, accent fees, and area limits.

## API overview

All API paths are under `/api`. Private routes use `Authorization: Bearer <token>`.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Application and database status |
| GET | `/api/settings` | Current estimator rates |
| POST | `/api/auth/register` | Register a customer |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Read the signed-in account |
| POST | `/api/estimates` | Recalculate and save a customer estimate |
| GET | `/api/estimates/mine` | List the signed-in customer's estimates |
| DELETE | `/api/estimates/:id` | Delete an owned estimate |
| POST | `/api/bookings` | Create a booking from a current or saved estimate |
| GET | `/api/bookings/mine` | List the signed-in customer's bookings |
| PATCH | `/api/bookings/:id/cancel` | Cancel an owned pending booking |
| POST | `/api/bookings/:id/review` | Submit one rating and optional experience for an owned completed booking |
| GET | `/api/admin/bookings` | List all bookings for an admin |
| PATCH | `/api/admin/bookings/:id/status` | Change a booking status |
| PUT | `/api/admin/settings` | Update supported rate fields |

## GitHub and Render deployment

1. Create an **empty public** GitHub repository. Do not initialize it with another README or `.gitignore` because these already exist in this project.
2. Add the GitHub repository as the local `origin` remote, then push the `main` branch.
3. In Render, create a **Web Service** and connect the GitHub repository.
4. Set the build command to `npm install` and the start command to `npm start`.
5. Add `MONGODB_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in Render's private Environment settings.
6. In Atlas Network Access, allow the Render service's outbound IP ranges when available. Atlas must also allow your local IP for local development.
7. Run `npm run seed` locally with the Atlas URI and admin values in `.env`. This creates the admin and default settings in the hosted database.
8. Deploy. Visit the Render URL and `/api/health`; confirm the database reports `connected`.

Render free web services may sleep while idle, so the first request can take longer. Check current Render and Atlas plan limits before relying on free-tier services for a presentation.

## Secrets and public files

The real `.env` file is ignored by Git. Never commit or share the Atlas connection string, JWT secret, or admin password. `.env.example` contains placeholders only and is safe to keep in the repository. Set production secrets through Render's Environment settings.