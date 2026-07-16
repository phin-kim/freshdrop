# Freshdrop

A website to help deliver weekly groceries to customers.


## Tech stack

- TypeScript
- Frontend: React + Vite + Tailwind
- Backend: Node + Express + TypeScript
- Database: PostgreSQL (Prisma client present)


## Prerequisites

- Node.js >= 18
- pnpm (recommended) or npm/yarn
- PostgreSQL (if you plan to run the backend locally)


## Repository layout

- frontend/ — React + Vite application
- backend/  — Express TypeScript backend
- shared/   — shared types and utilities (if used)


## Install

Recommended (pnpm):

1. Install pnpm if you don't have it:

   ```bash
   npm install -g pnpm
   ```

2. Install dependencies for root, frontend, and backend:

   ```bash
   # from repository root
   pnpm install
   # then
   cd frontend && pnpm install
   cd ../backend && pnpm install
   ```

Alternative (npm):

```bash
# from repository root
npm run install:all
```


## Environment variables

This project uses environment variables for both frontend and backend. Add .env files in the repository root, frontend/, and backend/ when running locally. Do not commit secrets to the repo.

Example values (DO NOT use these in production):

Root /.env

```env
PORT=5100
BETTER_AUTH_SECRET="<your_secret>"
BETTER_AUTH_URL="http://localhost:5100"
DEBUG=true
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

backend/.env

```env
PORT=5100
BETTER_AUTH_SECRET="<your_secret>"
BETTER_AUTH_URL="http://localhost:5100"
DEBUG=true
DATABASE_URL="postgresql://postgres:<password>@localhost:5432/freshdrop_db"
APPLE_CLIENT_ID=""
APPLE_CLIENT_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
MAPBOX_TOKEN=<your_mapbox_token>
# Payment / third-party credentials
PAYHERO_API_KEY=""
PAYHERO_USERNAME=""
PAYHERO_PASSWORD=""
PAYHERO_CHANNEL_ID=""
PAYHERO_BASIC_AUTH=""
```

frontend/.env (for Vite)

```env
BETTER_AUTH_SECRET="<your_secret>"
BETTER_AUTH_URL="http://localhost:5100"
APPLE_CLIENT_ID=""
APPLE_CLIENT_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
MAPBOX_ACCESS_TOKEN=<your_mapbox_token>
VITE_API_URL=http://localhost:5100
```

Notes:
- Replace all <placeholders> with your real values.
- Never commit .env with real credentials.


## Development

From the repository root you can run the included scripts.

- Start frontend only:

  ```bash
  npm run dev:frontend
  # or
  (cd frontend && pnpm dev)
  ```

- Start backend only:

  ```bash
  npm run dev:backend
  # or
  (cd backend && pnpm dev)
  ```

- Start both frontend and backend concurrently (development):

  ```bash
  npm run dev:all
  ```

The backend dev script uses nodemon + tsx and expects TypeScript source in backend/src. The frontend uses Vite.


## Build & Production

- Build frontend:

  ```bash
  npm run build:frontend
  # or (from frontend)
  cd frontend && pnpm build
  ```

- Build backend:

  ```bash
  npm run build:backend
  # then start with
  npm run build:backend
  # or
  (cd backend && pnpm build && pnpm start)
  ```

Adjust process managers (PM2, systemd, Docker) as needed for production.


## Database / Prisma

The backend includes Prisma as a dev dependency. If you use Prisma migrations:

1. Set DATABASE_URL in backend/.env
2. Generate client / run migrations from backend folder:

```bash
cd backend
pnpm prisma generate
pnpm prisma migrate deploy   # or pnpm prisma migrate dev (for local development)
```


## Third-party services

- Mapbox: set MAPBOX_ACCESS_TOKEN / MAPBOX_TOKEN
- OAuth (Google / Apple): set client id & secret in the appropriate .env files
- Payment provider (PayHero or others): set credentials in backend/.env


## Testing

No tests are defined currently. Add test scripts in the frontend/backend package.json as needed.


## Contributing

1. Create an issue describing the change.
2. Make a feature branch, implement changes, add tests.
3. Open a PR and request review.


## License

This repository does not declare a license file. Add LICENSE if you want to make the project open source.


## Contact

If you need help running the project locally, open an issue or contact the repository owner.
