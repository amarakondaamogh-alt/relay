# Relay

A Discord-style chat site: accounts, servers with invite links, text and voice channels, friends, DMs,
voice/video calls, screen sharing, replies, reactions, edits, typing indicators and online status.

## Run it on your computer

Install Node.js 18+ from https://nodejs.org, then in this folder:

```
npm install
npm start
```

Open http://localhost:3000.

## Put it online (free) so friends can use it

1. **Database (keeps accounts and messages safe).** Create a free Postgres database at https://neon.tech
   and copy its connection string (`postgresql://...`).
2. **Code on GitHub.** Make a new GitHub repository and upload this folder (without `node_modules`).
3. **Host.** On https://render.com: New → Web Service → pick your repo.
   - Build command: `npm install`
   - Start command: `npm start`
   - Instance type: Free
   - Environment variable: `DATABASE_URL` = the Neon connection string
4. Render gives you a link like `https://your-app.onrender.com`. Share it, or share a server invite
   link from inside the app (server name menu → Invite People).

Without `DATABASE_URL`, data is saved to `data/db.json`. That works on your own machine, but free hosts
wipe their disk on every restart, so you'd lose all accounts.

Free Render apps go to sleep after ~15 minutes with nobody on them. The first visit after that takes
about a minute to load.

## Calls on strict networks (optional)

Calls connect people directly. On some school/office or mobile networks that fails, and you need a
TURN relay server. Get free TURN credentials (for example from https://www.metered.ca/tools/openrelay/)
and set:

- `TURN_URL` (comma-separated if several, e.g. `turn:a.example.com:443,turns:a.example.com:443`)
- `TURN_USERNAME`
- `TURN_CREDENTIAL`

## Settings

| Variable | Purpose |
| --- | --- |
| `PORT` | Port to listen on (hosts set this automatically) |
| `DATABASE_URL` | Postgres connection string; enables database storage |
| `PGSSL=false` | Turn off SSL for a local Postgres |
| `DATA_DIR` | Folder for `db.json` when not using Postgres |
| `TURN_URL`, `TURN_USERNAME`, `TURN_CREDENTIAL` | TURN relay for calls |
