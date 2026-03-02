# ReadrViz

A modern, full-featured alternative to Goodreads — best-in-class reading analytics, smart recommendations, and community features built with Next.js 15, PostgreSQL, and Prisma.

---

## Prerequisites

Before you start, make sure you have these installed:

| Tool | Min version | Install |
|---|---|---|
| Node.js | 18+ | https://nodejs.org or `brew install node` |
| npm | 8+ | Comes with Node |
| PostgreSQL | 14+ | See [Database setup](#database-setup) below |
| Git | any | https://git-scm.com |

> **Option A — Docker (easiest):** If you have Docker Desktop installed, skip the PostgreSQL section and use `docker compose up -d` instead.
>
> **Option B — Local Postgres:** If you don't have Docker, install PostgreSQL directly. See [Database setup](#database-setup).

---

## Getting started

### 1. Clone the repo

```bash
git clone https://github.com/your-username/ReadrViz.git
cd ReadrViz
```

### 2. Install dependencies

```bash
npm install
```

> If you're behind a corporate proxy or have SSL certificate issues, use:
> ```bash
> npm install --legacy-peer-deps
> ```

### 3. Set up your environment

```bash
cp .env.example .env.local
```

Then open `.env.local` and fill in the values:

```env
# Database — update if your Postgres setup differs
DATABASE_URL="postgresql://readrviz:readrviz@localhost:5432/readrviz"

# Generate a secret: run `openssl rand -base64 32`
NEXTAUTH_SECRET="your-generated-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

Generate a secret in your terminal:

```bash
openssl rand -base64 32
```

Paste the output as your `NEXTAUTH_SECRET`.

### 4. Set up the database

#### Option A — Docker (recommended)

```bash
docker compose up -d
```

This starts a PostgreSQL 16 container with the credentials already in `.env.example`. No further Postgres configuration needed.

#### Option B — Local PostgreSQL (no Docker)

**macOS (Homebrew):**
```bash
brew install postgresql@16
brew services start postgresql@16
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
```

**Ubuntu/Debian:**
```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download the installer from https://www.postgresql.org/download/windows/

Then create the database and user:

```bash
# Connect as the postgres superuser
psql -U postgres

# Inside psql:
CREATE USER readrviz WITH PASSWORD 'readrviz';
CREATE DATABASE readrviz OWNER readrviz;
\q
```

Update your `DATABASE_URL` if you used different credentials:
```env
DATABASE_URL="postgresql://readrviz:readrviz@localhost:5432/readrviz"
```

If your local Postgres uses peer authentication (common on Linux/macOS Homebrew without a password):
```env
DATABASE_URL="postgresql://readrviz@localhost:5432/readrviz"
```

### 5. Push the schema and seed

```bash
# Create all tables
npx prisma db push

# Load 20 books, 5 users, shelves, reviews, a book club, and 240 analytics events
npx tsx prisma/seed.ts
```

### 6. Start the dev server

```bash
npm run dev
```

Open **http://localhost:3000**

---

## Demo login

The seed script creates a ready-to-use demo account:

| Field | Value |
|---|---|
| Email | `demo@readrviz.dev` |
| Password | `password123` |

Other seeded accounts (same password):

| Email | Reading style |
|---|---|
| `alice@readrviz.dev` | Literary fiction, slow reader |
| `bob@readrviz.dev` | Sci-fi + nonfiction, speed reader |
| `sara@readrviz.dev` | Fantasy & romance |
| `max@readrviz.dev` | Dark academia, classics |

---

## Project structure

```
ReadrViz/
├── prisma/
│   ├── schema.prisma       # Full data model (15 models)
│   └── seed.ts             # Realistic seed data
├── src/
│   ├── app/
│   │   ├── (auth)/         # Login + register pages
│   │   ├── books/          # Catalog + book detail
│   │   ├── shelves/        # User shelves
│   │   ├── dashboard/      # Analytics dashboard
│   │   ├── clubs/          # Book clubs
│   │   ├── profile/        # Public profiles
│   │   └── api/            # All API routes
│   ├── components/
│   │   ├── ui/             # Base UI components (Button, Card, etc.)
│   │   ├── books/          # BookCard, BookFilters, AddToShelfButton, ReviewForm
│   │   ├── analytics/      # DashboardCharts (Recharts)
│   │   ├── clubs/          # CreateClubButton, JoinClubButton, DiscussionThread
│   │   └── layout/         # Navbar, GlobalSearch, FollowButton, SessionProvider
│   ├── lib/
│   │   ├── auth.ts         # NextAuth config
│   │   ├── db.ts           # Prisma client singleton
│   │   ├── analytics.ts    # Aggregation jobs + dashboard query
│   │   ├── recommendations.ts  # TF-IDF + collaborative + finish probability
│   │   ├── events.ts       # Event tracking helpers
│   │   └── utils.ts        # Formatters, sentiment analysis, theme extraction
│   ├── hooks/
│   │   └── use-toast.ts
│   └── types/
│       └── index.ts        # Shared TypeScript types
├── tests/
│   ├── unit/               # Vitest unit tests
│   └── e2e/                # Playwright browser tests
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Next.js 15 App                   │
│                   (App Router + RSC)                │
│                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │  Pages /    │  │  API Routes  │  │   Cron    │  │
│  │  Components │  │  /api/*      │  │  /cron/*  │  │
│  └──────┬──────┘  └──────┬───────┘  └─────┬─────┘  │
│         │                │                │         │
│  ┌──────▼────────────────▼────────────────▼──────┐  │
│  │                    Lib Layer                   │  │
│  │  auth.ts | db.ts | analytics.ts | recoms.ts   │  │
│  └──────────────────────┬────────────────────────┘  │
│                         │                           │
│  ┌──────────────────────▼────────────────────────┐  │
│  │              Prisma ORM (type-safe)            │  │
│  └──────────────────────┬────────────────────────┘  │
└─────────────────────────┼───────────────────────────┘
                          │
              ┌───────────▼───────────┐
              │   PostgreSQL 16        │
              └───────────────────────┘
```

### Analytics pipeline

```
User action
  → trackEvent() fires in background
  → events table (append-only, indexed by userId/bookId/type)
            │
    Nightly cron job (/api/cron/aggregate)
            │
    aggregateUserMetrics()   aggregateBookMetrics()
            │                         │
    userMetrics table        bookMetrics table
            │                         │
            └──────────┬──────────────┘
                  Dashboard UI
```

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) | RSC for fast server-rendered pages; API routes co-located |
| Language | TypeScript | End-to-end type safety through Prisma |
| Styling | Tailwind CSS + custom design tokens | Full control, no component library lock-in |
| UI primitives | Radix UI (headless) | Accessible, unstyled, composable |
| Database | PostgreSQL 16 | Native arrays (`genre[]`), full-text search, window functions |
| ORM | Prisma 5 | Type-safe queries, great DX, auto-generated client |
| Auth | NextAuth v5 | Native App Router `auth()` helper, PrismaAdapter |
| Search | Postgres ILIKE | Zero extra infra for MVP; Meilisearch is a 1-file swap |
| Charts | Recharts | Composable, TypeScript-native, works with RSC |
| Testing | Vitest (unit) + Playwright (e2e) | Fast isolated unit tests; real browser e2e |

---

## Database schema

```
User ──── Shelf ──── ShelfBook ──── Book
  │                                  │
  ├── Review ──────────────────────► │
  │                                  │
  ├── Follow (self-join)             │
  │                                  │
  ├── ClubMember ──── BookClub ──── ClubReading ──── Discussion
  │
  ├── Event (analytics — append-only)
  │
  └── UserMetrics              Book ──── BookMetrics
```

Key design decisions:
- `ShelfBook` joins a user's shelf to a book. Moving between default shelves deletes the old entry first (a book can only be in one default shelf at a time).
- `Event` is append-only. A nightly cron aggregates it into `UserMetrics`/`BookMetrics`.
- `Book.genre`, `tags`, `mood` are Postgres arrays — enables `hasSome` filtering without a junction table.
- `Review.themes` and `sentimentScore` are computed server-side on write using local NLP (no external API).

---

## API reference

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/books` | Public | Search/filter/sort books |
| GET | `/api/books/:id` | Optional | Book detail + user shelf status |
| POST | `/api/auth/register` | Public | Create account |
| GET | `/api/shelves` | Required | User's shelves + books |
| POST | `/api/shelves` | Required | Add/move book to shelf |
| PATCH | `/api/shelves/:id/progress` | Required | Update reading progress |
| GET | `/api/reviews?bookId=` | Optional | Reviews for a book |
| POST | `/api/reviews` | Required | Post or update a review |
| POST | `/api/reviews/:id/like` | Required | Toggle review like |
| GET | `/api/clubs` | Optional | List public clubs |
| POST | `/api/clubs` | Required | Create a club |
| GET | `/api/clubs/:id` | Optional | Club detail with discussions |
| POST | `/api/clubs/:id` | Required | Join or leave a club |
| POST | `/api/clubs/:id/discussions` | Member | Post a discussion |
| GET | `/api/analytics/dashboard` | Required | Full dashboard data |
| GET | `/api/recommendations` | Required | Personalised book recs |
| GET | `/api/search?q=` | Public | Search books, users, clubs |
| POST | `/api/cron/aggregate` | `CRON_SECRET` header | Nightly metric aggregation |
| GET | `/api/users/:username` | Optional | Public profile data |
| POST | `/api/users/:username/follow` | Required | Follow/unfollow a user |

---

## Running tests

### Unit tests (no database required)

```bash
npm run test:unit
```

Runs 14 tests across `utils.test.ts` (formatters, sentiment, theme extraction) and `recommendations.test.ts` (finish probability model).

### End-to-end tests

Make sure the dev server is running first (`npm run dev`), then:

```bash
npm run test:e2e
```

Or open the interactive Playwright UI:

```bash
npm run test:e2e:ui
```

The e2e suite covers:
- Auth: home page, login, invalid credentials, successful sign-in, register page, demo shortcut
- Books: catalog load, search, filters, book detail, tabs, unauthenticated shelf add, empty results
- Clubs: clubs page load, club cards, navbar search

---

## All npm scripts

```bash
npm run dev           # Start dev server → http://localhost:3000
npm run build         # Production build
npm run start         # Start production server (after build)
npm run lint          # Run ESLint

npx prisma db push    # Sync schema to DB (no migration file)
npx prisma migrate dev  # Create a named migration
npx prisma studio     # Open Prisma Studio (visual DB browser at :5555)
npx tsx prisma/seed.ts  # Seed the database (idempotent — safe to re-run)

npm run db:generate   # Re-generate Prisma client after schema changes
npm run db:seed       # Alias for tsx prisma/seed.ts
npm run db:reset      # Drop all tables, re-push schema, re-seed
npm run db:studio     # Alias for prisma studio

npm run test:unit     # Vitest unit tests
npm run test:unit:watch  # Vitest in watch mode
npm run test:e2e      # Playwright e2e tests
npm run test:e2e:ui   # Playwright interactive UI
```

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes | Random string for signing sessions. Generate: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | Full URL of your app (e.g. `http://localhost:3000`) |
| `GITHUB_ID` | No | GitHub OAuth app client ID (enables "Sign in with GitHub") |
| `GITHUB_SECRET` | No | GitHub OAuth app client secret |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `CRON_SECRET` | No | Bearer token for protecting the `/api/cron/aggregate` endpoint |
| `NEXT_PUBLIC_APP_URL` | No | Public URL, used for absolute links |

---

## Setting up OAuth (optional)

The app works fully with email/password out of the box. OAuth is optional.

**GitHub:**
1. Go to https://github.com/settings/developers → "New OAuth App"
2. Set callback URL to `http://localhost:3000/api/auth/callback/github`
3. Copy Client ID and Client Secret into `.env.local`

**Google:**
1. Go to https://console.cloud.google.com → Credentials → "Create OAuth client ID"
2. Set redirect URI to `http://localhost:3000/api/auth/callback/google`
3. Copy Client ID and Client Secret into `.env.local`

---

## Nightly analytics aggregation

The analytics pipeline aggregates raw events into `UserMetrics` and `BookMetrics` nightly. To trigger it:

**Manually (development):**
```bash
curl -X POST http://localhost:3000/api/cron/aggregate \
  -H "Authorization: Bearer your-cron-secret"
```

**Automated (production — crontab):**
```bash
# Every night at 2am UTC
0 2 * * * curl -X POST https://your-domain.com/api/cron/aggregate \
  -H "Authorization: Bearer $CRON_SECRET"
```

**Vercel Cron (vercel.json):**
```json
{
  "crons": [{
    "path": "/api/cron/aggregate",
    "schedule": "0 2 * * *"
  }]
}
```

---

## Deploying to production

### Vercel (recommended)

```bash
npm install -g vercel
vercel
```

Set environment variables in the Vercel dashboard. Use a managed Postgres service (Vercel Postgres, Supabase, Neon, Railway) and update `DATABASE_URL`.

### Railway

1. Create a new project at https://railway.app
2. Add a PostgreSQL plugin
3. Deploy from GitHub
4. Set environment variables from `.env.example`

### Self-hosted (Docker Compose)

```bash
docker compose up -d        # Start Postgres
npm run build               # Build Next.js
npm run start               # Start production server
```

---

## Troubleshooting

**`Cannot find module 'autoprefixer'`**
```bash
npm install autoprefixer --save-dev
```

**`Environment variable not found: DATABASE_URL`**
Make sure you copied `.env.example` to `.env.local` and the file is in the project root (not inside `src/`).

**`UNABLE_TO_GET_ISSUER_CERT_LOCALLY` during npm install**
You're on a network with a custom SSL certificate (common on corporate/university networks):
```bash
npm install --legacy-peer-deps
# or
NODE_TLS_REJECT_UNAUTHORIZED=0 npm install
```

**`psql: error: connection refused`**
PostgreSQL isn't running. Start it:
```bash
# macOS Homebrew
brew services start postgresql@16

# Linux
sudo systemctl start postgresql

# Docker
docker compose up -d
```

**`role "readrviz" does not exist`**
Create the user and database:
```bash
psql -U postgres -c "CREATE USER readrviz WITH PASSWORD 'readrviz';"
psql -U postgres -c "CREATE DATABASE readrviz OWNER readrviz;"
```

**`P1012 Validation Error` from Prisma**
Your `DATABASE_URL` in `.env.local` is wrong or the file isn't being loaded. Double-check the connection string and make sure the file is named `.env.local` (not `.env`).

**Port 3000 already in use**
```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9
# Then restart
npm run dev
```

**Seed fails with "Unique constraint violated"**
The seed is idempotent (uses `upsert`), but if you hit a schema mismatch, reset the DB first:
```bash
npm run db:reset
```

---

## Feature checklist

### Book catalog & discovery
- [x] Search by title, author, synopsis
- [x] Filters: genre, mood, pace, min rating
- [x] Sort: popularity, rating, completion rate, newest, A–Z
- [x] Pagination (24 per page)
- [x] Book detail: synopsis, tags, tropes, pacing, mood
- [x] Completion rate, DNF rate, polarization score
- [x] "People who finished also finished…"
- [x] Finish probability prediction per user

### Shelves & reading funnel
- [x] Default shelves: Want to Read, Currently Reading, Read, DNF
- [x] Custom shelves
- [x] Track format (physical/ebook/audiobook), ownership, cost, dates
- [x] Progress tracking (0–100%)
- [x] Reading funnel: 25/50/75/completion/review rates per book

### Reading analytics dashboard
- [x] Books/month and pages/month trend charts
- [x] Average days to finish
- [x] Reading streaks (current + longest)
- [x] DNF rate overall + by genre
- [x] Completion rate by genre (colour-coded)
- [x] Genre distribution pie chart
- [x] Year-end reading forecast
- [x] Cost metrics (cost/book, library vs purchased ratio)

### Reviews & intelligence
- [x] Star ratings (1–5)
- [x] Review text + spoiler toggle
- [x] Tags
- [x] Sentiment analysis (local — no external API)
- [x] Theme extraction (keyword frequency)
- [x] Polarization score (rating std-dev)
- [x] Rating breakdown histogram

### Social & community
- [x] Follow/unfollow users
- [x] Public user profiles with reading stats
- [x] Book clubs (create, join, leave)
- [x] Club reading schedules
- [x] Discussion threads by milestone
- [x] Threaded replies
- [x] Member roster with roles

### Recommendations
- [x] Content-based (TF-IDF genre/mood/pace vectors)
- [x] Collaborative filtering ("users like you finished…")
- [x] Hybrid merge (60/40 weighting)
- [x] Score + "why" explanation per recommendation
- [x] Finish probability model

### Analytics pipeline
- [x] 11 event types tracked (VIEW_BOOK, ADD_TO_SHELF, START_READING, UPDATE_PROGRESS, FINISH_BOOK, DNF_BOOK, LIKE_REVIEW, COMMENT, JOIN_CLUB, POST_DISCUSSION, FOLLOW_USER)
- [x] Nightly aggregation endpoint
- [x] UserMetrics + BookMetrics tables

### Design & UX
- [x] Warm neutral palette + teal accent
- [x] Lora serif + Inter sans font pairing
- [x] Mobile-first responsive layout
- [x] Skeleton loaders
- [x] Clear empty states
- [x] Accessible: ARIA labels, keyboard nav, focus rings
- [x] Toast notifications

---

## Product decisions & tradeoffs

**Search: Postgres vs Meilisearch** — Postgres ILIKE works fine for the catalog size. Meilisearch adds typo-tolerance at scale; the search is abstracted so swapping is a 1-file change in `src/app/api/search/route.ts`.

**Recommendations: TF-IDF vs embeddings** — True vector embeddings (OpenAI, Cohere) would be more accurate but add API cost and latency. TF-IDF on genre/mood/pace vectors is surprisingly effective and fully explainable. The `featureVector` JSON field on `Book` is where you'd store pre-computed embeddings later.

**Finish probability: heuristic vs ML** — A trained logistic regression model would be more accurate but requires sufficient per-user training data. The heuristic (genre completion rate + book's own completion rate + pace/length adjustments) produces reasonable results immediately and every factor is shown to the user.

**Review NLP: local vs API** — Simple sentiment (positive/negative word ratio) and keyword extraction (word frequency after stop-word removal) avoid external API dependency and cost. Swap to a proper NLP model by changing `analyzeSentiment()` and `extractThemes()` in `src/lib/utils.ts`.

**Auth: NextAuth v5** — The v5 beta has native App Router support via the `auth()` helper function. The PrismaAdapter handles session persistence. Credentials + optional GitHub/Google OAuth out of the box.

**Events as append-only table** — Keeping raw events and aggregating nightly keeps the write path fast (fire-and-forget, no computation on user actions). The dashboard shows day-old metrics — an acceptable tradeoff. For real-time dashboards, use a materialized view refreshed every few minutes.
