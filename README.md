# DX Radar | Expedition Spotter (v1.1.0)

A modern web application for amateur radio (HAM) operators focused on tracking active DX expeditions in real-time. The app combines data from DX clusters, ClubLog integration, and advanced AI analysis to provide maximum situational awareness on the bands.

## 🚀 Key Features

- **Real-time DX Monitoring**: Live spot tracking from DX clusters using WebSockets.
- **AI Analysis (Gemini or DeepSeek)**: Choose your AI provider in Settings. Intelligent spot analysis that detects:
  - Operating modes (Fox/Hound, SuperFox, MSHV).
  - Signal strength (distinguishing between FT8 dB and CW SNR scales).
  - Pileup status (Big pileup, Busy, Alone/Calling CQ).
  - 6m band specifics (Sporadic E, TEP, AUR, and specific geography).
- **ClubLog Integration**: Automatic check of your QSO status (Worked/Confirmed) for each expedition.
- **Global Propagation**: Real-time SFI, Kp indices, and HF band conditions (WSPR Index) with forecasts.
- **Expedition Management**: Database of current expeditions aggregated from NG3K ADXO and HamRadioTimeline.com (by IK8LOV Max Laconca, edited by MM0NDX), featuring visual timeline Gantt charts.
- **Personalization**: Custom callsign, continent, and ClubLog filter settings.
- **Secure Export & Import**: Securely backup and restore your settings across devices using AES-encrypted files with a custom password.

## 🛠 Technology Stack

- **Frontend**: React 19, Vite, TypeScript.
- **Styling**: Tailwind CSS (Dark-first design, Glassmorphism).
- **Animations**: Motion (motion/react).
- **Backend**: Node.js (Express) with Vite middleware integration.
- **AI**: Google Gemini (via `@google/genai`, in-browser) or DeepSeek (OpenAI-compatible, via a same-origin server proxy).
- **Data**: A single shared WebSocket for live spots/status/propagation, REST APIs for propagation and expedition data.

## 📱 Device Support

The application is fully responsive and optimized for:
- Desktop browsers.
- Mobile devices (iOS/iPadOS support including Apple Touch Icon).
- Portrait and landscape orientations.

## ⚙️ Setup

To unlock the full potential of the app, we recommend configuring the following in Settings (gear icon):
1. **Callsign**: Your callsign for ClubLog integration.
2. **ClubLog App Password**: Application-specific password (not your main password).
3. **AI Provider & API Key**: Pick Gemini or DeepSeek and enter that provider's API key to enable AI-powered spot analysis. Keys are stored only in your browser; the DeepSeek key is forwarded per-request through the server proxy and is never stored server-side.

## 🧑‍💻 Getting Started (Development)

```bash
npm install
npm run dev      # start the app (tsx server.ts + Vite middleware)
npm run build    # production build to dist/
npm run lint     # type-check (tsc --noEmit)
```

Server-side configuration is optional and lives in `.env` (copy from `.env.example`):

- `DX_CLUSTER_HOST` / `DX_CLUSTER_PORT` / `DX_CLUSTER_CALLSIGN` / `DX_CLUSTER_COMMANDS` — primary DX cluster connection.
- `DX_CLUSTER_HOST_BACKUP` / `DX_CLUSTER_PORT_BACKUP` — optional backup cluster for automatic failover. The server switches to it when the primary drops or its feed goes silent, and fails back to the primary once it recovers. Leaving `DX_CLUSTER_HOST_BACKUP` empty disables failover. `DX_CLUSTER_STALE_SECONDS` (default `90`) is how long a connected cluster may go completely silent before being treated as an outage; `DX_CLUSTER_FAILBACK_MINUTES` (default `15`) is how often the preferred primary is retried while running on the backup.
- `CLUBLOG_API_KEY` — required server-side for ClubLog lookups.
- `DEEPSEEK_API_BASE` — optional override for the DeepSeek API endpoint.

Build-time overrides (Vite env, optional):

- `VITE_GEMINI_MODEL` — Gemini model id (default `gemini-3.1-flash-lite-preview`).
- `VITE_DEEPSEEK_MODEL` — DeepSeek model id (default `deepseek-v4-flash`).

The About dialog (help icon) shows the running build's git short hash and build timestamp.

## 🐳 Docker

The app ships as a single container (multi-stage build: Vite build → Express/WebSocket server run with `tsx`). It serves the built frontend, the REST APIs, and the live WebSocket on one port (`3000`).

Using Docker Compose (recommended — loads `.env` automatically):

```bash
cp .env.example .env    # optional, for server-side settings
GIT_HASH=$(git rev-parse --short HEAD) docker compose build
docker compose up
```

Or with plain Docker:

```bash
docker build --build-arg GIT_HASH=$(git rev-parse --short HEAD) -t dxradar .
docker run --rm -p 3000:3000 --env-file .env dxradar
```

The app is then available at `http://localhost:3000`.

Notes:
- Same-origin only — no volumes or database are required; server-side caches are in-memory and client settings live in the browser.
- `GIT_HASH` is optional; without it the About dialog shows `unknown` (the container has no `.git`).
- Secrets stay out of the image: `.env` is excluded via `.dockerignore` and passed in at runtime.

## 📋 Logging & Diagnostics

Every real outbound call to ClubLog is logged to `logs/clublog.log` (created automatically). Only actual HTTP requests are recorded — responses served from the in-memory caches are not — so the file is a faithful measure of how often ClubLog is actually queried. This is the first place to look when diagnosing ClubLog auth or rate issues.

Each line is human-readable: timestamp, event (`REQ` / `RESP` / `RETRY` / `ERR`), endpoint (`dxcc` / `dxccchart`), mode, callsign, email, HTTP status and timing. The ClubLog API key and password are **never** written to the file.

```
2026-09-10 14:32:07  REQ   GET  dxcc  call=OH2XX
2026-09-10 14:32:08  RESP  200  dxcc  call=OH2XX  (170ms)
2026-09-10 14:32:09  REQ   GET  dxccchart mode=1  call=OK1ABC email=you@example.com
2026-09-10 14:32:10  RESP  200  dxccchart mode=1  call=OK1ABC email=you@example.com  (631ms)
```

Count the real request rate per minute with `cut -c1-16 logs/clublog.log | uniq -c`. The file rotates to `clublog.log.1` once it passes 10 MB, and is excluded from git and Docker images.

## 🤝 Data Sources & Credits

Expedition schedules are aggregated from two excellent community resources:
- **NG3K Amateur Radio Exigencies**: The classic and highly reliable ADXO bulletin.
- **HamRadioTimeline.com**: Designed by IK8LOV (Max Laconca) and Edited by MM0NDX (DX-World).

---
*Developed for the amateur radio community. 73!*
