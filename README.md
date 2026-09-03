# Bargain Bazaar

A full-stack bidding marketplace prototype where users can browse listings, add products, place offers, and sign in before using the site.

## Features

- Browse featured listings
- Search items by name or category
- Add a new product listing
- Make offers and bargain on prices
- Indian rupee pricing
- Responsive modern UI
- Login page with demo credentials

## Project Structure

- `FRONTEND/` — browser-based UI
  - `index.html` — main marketplace page
  - `login.html` — login page
  - `styles.css` — styling for the website
  - `script.js` — login logic and marketplace interactions
- `backend/` — simple Node.js/Express API
  - `server.js`
  - `package.json`

## Setup

### Backend

```bash
cd backend
npm install
npm start
```

The backend runs on http://localhost:5000.

### Frontend

Open the frontend files in a browser, or serve the folder locally:

```bash
cd FRONTEND
npx http-server . -p 3000
```

Then visit http://localhost:3000.

## Demo Login

Use these credentials on the login page:

- Email: demo@example.com
- Password: 123456
