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

- `DX_CLUSTER_HOST` / `DX_CLUSTER_PORT` / `DX_CLUSTER_CALLSIGN` / `DX_CLUSTER_COMMANDS` — DX cluster connection.
- `CLUBLOG_API_KEY` — required server-side for ClubLog lookups.
- `DEEPSEEK_API_BASE` — optional override for the DeepSeek API endpoint.

Build-time overrides (Vite env, optional):

- `VITE_GEMINI_MODEL` — Gemini model id (default `gemini-3.1-flash-lite-preview`).
- `VITE_DEEPSEEK_MODEL` — DeepSeek model id (default `deepseek-v4-flash`).

The About dialog (help icon) shows the running build's git short hash and build timestamp.

## 🤝 Data Sources & Credits

Expedition schedules are aggregated from two excellent community resources:
- **NG3K Amateur Radio Exigencies**: The classic and highly reliable ADXO bulletin.
- **HamRadioTimeline.com**: Designed by IK8LOV (Max Laconca) and Edited by MM0NDX (DX-World).

---
*Developed for the amateur radio community. 73!*
