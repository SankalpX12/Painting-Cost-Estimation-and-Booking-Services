# Home Painting Service Estimator and Booking System

Course project for CSE326 by Code Crusaders. The application uses plain HTML, CSS and JavaScript with a Node.js/Express backend and MongoDB Atlas.

## Current phase

The project includes the estimator, customer registration and login, saved estimate history, bookings, administrator rate/status controls, colour preview and matching, custom design, multi-colour estimates, browser print, and a cost chart.

## Requirements

- Node.js and npm
- Git
- A GitHub account for the public source repository
- A MongoDB Atlas account and database for hosted persistence
- A Render account for the web service deployment

The Color API does not require an account or API key. No payment provider or custom domain is required by the project plan.

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` with `Copy-Item .env.example .env` in PowerShell.
3. Replace the `MONGODB_URI` placeholder in `.env` with your Atlas connection string.
4. Generate a private JWT secret with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Put the result in `.env` as `JWT_SECRET=<generated-value>`. Do not send or commit this value.
5. Start the server with `npm start`.
6. Open `http://localhost:3000` and check `http://localhost:3000/api/health`. The database value should say `connected`.

Run the calculator tests with `npm test`. Register a customer account in the app before using the estimator. The first administrator is created by the seed command below.

## Create the administrator account

1. In local `.env`, set `ADMIN_EMAIL` and a private `ADMIN_PASSWORD` of at least 8 characters.
2. Run `npm run seed` once. This creates the administrator and default rate settings in the Atlas database.
3. Sign in through `/login.html` with those credentials. Do not publish the password in this README or on GitHub.

Never commit `.env` or paste database credentials into source files. Keep the `.env.example` values as placeholders.

## MongoDB Atlas setup

1. Create an Atlas project and a database deployment.
2. Create a database user with a strong, unique password.
3. Configure Network Access for local development and the deployed service. Prefer supported Render egress IP ranges; if the selected service has no fixed egress range, review the security implications before using a broad allow-list.
4. Copy the application connection string into local `.env` as `MONGODB_URI`.

## GitHub and Render deployment

1. Create a public GitHub repository and push this project.
2. Create a Render web service connected to that repository.
3. Set the build command to `npm install` and the start command to `npm start`.
4. Add `MONGODB_URI`, a separate strong `JWT_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in the Render environment settings.
5. Run `npm run seed` locally with the Atlas URI and admin credentials set in `.env`. This creates the admin account in the hosted database.
6. Deploy and open `/api/health`; its `database` field should be `connected` after Atlas is configured.

Do not put real passwords, tokens or connection strings in this README or in GitHub. Set them in local `.env` or the hosting provider's environment settings.