# FundIQ — AI-Powered Startup-Investor Matching Platform

> Venture capital matchmaking platform combining transformer-based semantic embeddings, vector search, and Groq AI assistants to connect startups with the most strategically aligned investors.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Seeding the Database](#seeding-the-database)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [How Matching Works](#how-matching-works)

---

## Overview

FundIQ solves a core problem in venture capital: startups and investors struggle to find each other efficiently. Traditional keyword-based filters miss nuanced alignment — an investor whose thesis says "backing data-driven CFO tools" and a startup building "AI-powered treasury management" are a perfect match, but share no keywords.

FundIQ uses **semantic vector embeddings** to understand meaning, not just words. Each startup and investor profile is converted into a 384-dimensional vector using the `all-MiniLM-L6-v2` transformer model. Similarity is computed using cosine distance in **Qdrant**, a purpose-built vector database. Structured filters (stage, geography, revenue status) are applied as ranking bonuses on top of semantic scores.

---

## Features

- **Semantic Startup-Investor Matching** — transformer embeddings + cosine similarity via Qdrant
- **Hybrid Recommendation Engine** — semantic score + structured compatibility bonuses
- **Dynamic Matching** — every profile save triggers re-embedding and re-matching automatically
- **AI Startup Advisor** — Groq-powered LLM chat for funding strategy and market questions
- **AI Pitch Corrector** — Groq-powered pitch review using the startup's own profile as context
- **Startup Profile** — structured profile with financials, traction score, and risk score
- **Investor Profile** — preferences, thesis text, check size range, and geo focus
- **Top 10 Matches** — pre-computed matches served instantly via REST API
- **GitHub OAuth** — authentication via GitHub for both startup and investor accounts
- **Dark / Light Mode** — theme toggle across all pages

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React + Vite | UI framework and dev server |
| React Router | Client-side routing |
| ReactMarkdown | Render AI assistant responses |
| Axios / Fetch | API communication |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| MongoDB Atlas | Primary data store (profiles, matches, users) |
| Mongoose | MongoDB ODM |
| Passport.js | GitHub OAuth authentication |
| JWT + Cookies | Session management |
| BullMQ + Redis | (optional) async job queue for embedding |

### AI / ML
| Technology | Purpose |
|---|---|
| @xenova/transformers | Local inference — all-MiniLM-L6-v2 (384-dim embeddings) |
| Qdrant | Vector database — cosine similarity search |
| Groq API (LLaMA 3.3-70b) | Startup Advisor and Pitch Corrector LLM |
| Sentence Transformers | Embedding model architecture |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      React Frontend                      │
│   Startup Profile │ Investor Profile │ Advisor │ Pitch  │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTP
┌──────────────────────────▼──────────────────────────────┐
│                    Express REST API                      │
│  /api/startup  │  /api/investor  │  /api/advisor        │
│  /api/pitch    │  /api/auth      │  /api/user           │
└───────┬─────────────────┬────────────────────┬──────────┘
        │                 │                    │
┌───────▼──────┐  ┌───────▼──────┐   ┌────────▼────────┐
│  MongoDB     │  │   Qdrant     │   │   Groq API      │
│  Atlas       │  │  (Docker)    │   │  LLaMA 3.3-70b  │
│              │  │              │   │                 │
│ Profiles     │  │ 384-dim      │   │ Advisor Chat    │
│ Matches      │  │ Vector Index │   │ Pitch Review    │
│ Users        │  │ Cosine Sim   │   │                 │
└──────────────┘  └──────────────┘   └─────────────────┘
```

### Matching Pipeline

```
Profile Save (POST /api/startup/profile)
        │
        ▼
Auto-assign startup_id (ST-XXXX)
        │
        ▼
Save to MongoDB
        │
        ▼  (non-blocking background)
startupToText() → natural language string
        │
        ▼
all-MiniLM-L6-v2 → 384-dim vector
        │
        ▼
Qdrant upsert (startups collection)
        │
        ▼
Qdrant search (investors collection, limit 50)
        │
        ▼
Bonus scoring (stage +0.1, geo +0.1) + revenue filter
        │
        ▼
Top 10 saved to MongoDB Match collection
        │
        ▼
GET /api/startup/top-picks → returns enriched matches
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- Docker (for Qdrant)
- MongoDB Atlas account
- Groq API key ([console.groq.com](https://console.groq.com))
- GitHub OAuth app credentials

### Installation

```bash
# Clone the repository
git clone https://github.com/Vignesh230405/FundIQ_till_advisor.git
cd FundIQ_till_advisor

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Start Qdrant

```bash
docker run -p 6333:6333 qdrant/qdrant
```

### Start the server

```bash
cd server
node server.js
```

### Start the client

```bash
cd client
npm run dev
```

---

## Environment Variables

Create a `.env` file in the `server/` directory:

```env
# MongoDB
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/FundIQ?appName=Cluster0

# JWT
JWT_SECRET=your_jwt_secret_key

# Groq
GROQ_API_KEY=your_groq_api_key

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback

# Qdrant (optional — defaults to localhost)
QDRANT_URL=http://localhost:6333

# Client URL
CLIENT_URL=http://localhost:5173
```

---

## Seeding the Database

Run these three scripts in order to populate the demo dataset (500 startups + 500 investors):

```bash
cd server

# 1. Create user accounts
node scripts/seedAuthUsers.js

# 2. Create startup and investor profiles in MongoDB
node scripts/seedProfiles.js

# 3. Embed all profiles and generate matches in Qdrant
node scripts/seedVectors.js
```

Or use the combined npm script:

```bash
npm run seed
```

> **Note:** `seedVectors.js` downloads the `all-MiniLM-L6-v2` model (~25MB) on first run. Subsequent runs use the cached model.

> **Note:** Run this only once per fresh database. Real user signups and profile saves trigger matching automatically — no manual re-seeding needed.

---

## API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/auth/github` | Initiate GitHub OAuth |
| GET | `/api/auth/github/callback` | OAuth callback |
| POST | `/api/auth/logout` | Logout |

### Startup
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/startup/profile` | ✅ | Get own profile |
| POST | `/api/startup/profile` | ✅ | Create / update profile + trigger matching |
| GET | `/api/startup/profile/:startup_id` | ❌ | Public profile by ID |
| GET | `/api/startup/top-picks` | ✅ | Get top 10 matched investors |

### Investor
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/investor/profile` | ✅ | Get own profile |
| POST | `/api/investor/profile` | ✅ | Create / update profile + trigger matching |
| GET | `/api/investor/profile/:investor_id` | ❌ | Public profile by ID |
| GET | `/api/investor/top-picks` | ✅ | Get top 10 matched startups |

### AI Features
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/advisor/chat` | ❌ | Startup Advisor chat (Groq) |
| POST | `/api/pitch/chat` | ✅ | Pitch Corrector — uses startup profile as context |

---

## Project Structure

```
fundiqSanta/
├── client/                     # React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── StartupAdvisor.jsx
│   │   │   ├── StartupPitchCorrector.jsx
│   │   │   ├── StartupProfile.jsx
│   │   │   └── StartupDashboard.jsx
│   │   └── ThemeContext.jsx
│   └── vite.config.js
│
└── server/                     # Express backend
    ├── config/
    │   ├── db.js               # MongoDB connection
    │   └── passport.js         # GitHub OAuth config
    ├── embeddings/
    │   ├── embedder.js         # MiniLM model wrapper
    │   ├── buildText.js        # Profile → natural language
    │   └── vectorStore.js      # Qdrant client + search
    ├── matching/
    │   └── matchEngine.js      # matchStartup / matchInvestor
    ├── middleware/
    │   └── authMiddleware.js   # JWT protect middleware
    ├── models/
    │   ├── Startup.js
    │   ├── Investor.js
    │   ├── StartupProfile.js
    │   ├── InvestorProfile.js
    │   └── Match.js
    ├── routes/
    │   ├── authRoutes.js
    │   ├── startupProfile.routes.js
    │   ├── investorProfile.routes.js
    │   ├── advisor.js
    │   └── pitchCorrector.routes.js
    ├── scripts/
    │   ├── seedAuthUsers.js
    │   ├── seedProfiles.js
    │   └── seedVectors.js
    └── server.js
```

---

## How Matching Works

### 1. Embedding
Each profile is converted to a natural language string and passed through `all-MiniLM-L6-v2` to produce a **384-dimensional dense vector**. Similar profiles produce geometrically close vectors.

### 2. Vector Storage
Vectors are stored in **Qdrant** with metadata payloads (stage, sector, geo, check sizes). Qdrant uses cosine similarity as the distance metric.

### 3. Search
When a startup saves their profile, Qdrant searches the investor collection and returns the 50 most semantically similar investors.

### 4. Hybrid Scoring
Results are re-ranked using a bonus system:
- **+0.1** if investor's preferred stage matches startup's stage
- **+0.1** if investor's geo focus matches startup's market
- **Hard filter** — investors who don't do pre-revenue startups are excluded if the startup has zero revenue

### 5. Storage & Retrieval
Top 10 matches are saved to MongoDB's `Match` collection. `GET /top-picks` reads this collection instantly — no AI computation at query time.

---

## Paper

This project was submitted as a research paper to **IDSCS2026** under the track:
**Artificial Intelligence and Machine Learning for Data-Driven Innovation**

**Title:** FundIQ: AI-Powered Startup-Investor Matching Platform

**Authors:** Vignesh M, Sreevardhan Vadhulas MS, V Santosh Varma, Shahid Ul Islam, Rakshitha H S

**Institution:** Dept. of Computer Science and Engineering, Dayananda Sagar Academy of Technology and Management, Bengaluru, India

---

> Built with ❤️ at DSATM Bengaluru