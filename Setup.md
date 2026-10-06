# FundIQ — Setup & Run Guide

## Prerequisites
Install these before anything else:
- Node.js v18+ → https://nodejs.org
- Git → https://git-scm.com
- MongoDB account (free) → https://mongodb.com (or use the existing connection string from the .env you received)

---

## Step 1 — Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

---

## Step 2 — Set up the SERVER

```bash
cd server
npm install
```

Create a `.env` file inside the `server/` folder:

```bash
# On Mac/Linux:
touch .env

# On Windows (Command Prompt):
type nul > .env
```

Now open the `.env` file in any text editor and paste the contents
sent to you via WhatsApp. It should look like this:

```
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=...
EMAIL_USER=...
EMAIL_PASS=...
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

Save the file.

---

## Step 3 — Set up the CLIENT

Open a new terminal tab/window:

```bash
cd client
npm install
```

---

## Step 4 — Run the project

You need TWO terminal windows running simultaneously.

**Terminal 1 — Backend (server):**
```bash
cd server
npm run dev
```
You should see:
```
Server running on port 5000
MongoDB connected
```

**Terminal 2 — Frontend (client):**
```bash
cd client
npm run dev
```
You should see:
```
VITE ready at http://localhost:5173
```

---

## Step 5 — Open in browser

Go to: **http://localhost:5173**

---

## Folder Structure

```
FundIQ/
├── client/          ← React frontend (Vite)
│   ├── src/
│   │   ├── pages/   ← All page components
│   │   └── App.jsx  ← Routes
│   └── package.json
│
├── server/          ← Node/Express backend
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── .env         ← ⚠️ You must create this (contents via WhatsApp)
│   └── package.json
│
└── README.md
```

---

## Available Routes

| URL | Page |
|-----|------|
| / | Home |
| /investor-login | Investor Sign In |
| /investor-signup | Investor Sign Up |
| /startup-login | Startup Sign In |
| /startup-signup | Startup Sign Up |
| /investor-dashboard | Investor Dashboard |
| /startup-dashboard | Startup Dashboard |

---

## Troubleshooting

**"Cannot find module" error on server start**
→ Run `npm install` inside the `server/` folder again

**"Port 5000 already in use"**
→ Kill the process using port 5000:
- Mac/Linux: `lsof -ti:5000 | xargs kill`
- Windows: `netstat -ano | findstr :5000` then `taskkill /PID <number> /F`

**MongoDB connection error**
→ Check that MONGO_URI in your .env is correct and your IP is whitelisted in MongoDB Atlas
→ Go to MongoDB Atlas → Network Access → Add IP Address → Allow from anywhere (0.0.0.0/0) for dev

**Emails not sending**
→ Check EMAIL_USER and EMAIL_PASS in .env
→ EMAIL_PASS must be a Gmail App Password, not your real Gmail password

**Google login not working**
→ Ask your coworker to add http://localhost:5000/api/auth/google/callback
  to the Google OAuth redirect URIs in Google Cloud Console

---

## Notes
- Never commit the .env file to GitHub
- The project runs fully locally — no deployment setup needed to contribute
- Backend runs on port 5000, frontend on port 5173