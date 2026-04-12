# DX Radar | Expedition Spotter

A modern web application for amateur radio (HAM) operators focused on tracking active DX expeditions in real-time. The app combines data from DX clusters, ClubLog integration, and advanced AI analysis to provide maximum situational awareness on the bands.

## 🚀 Key Features

- **Real-time DX Monitoring**: Live spot tracking from DX clusters using WebSockets.
- **AI Analysis (Gemini)**: Intelligent spot analysis that detects:
  - Operating modes (Fox/Hound, SuperFox, MSHV).
  - Signal strength (distinguishing between FT8 dB and CW SNR scales).
  - Pileup status (Big pileup, Busy, Alone/Calling CQ).
  - 6m band specifics (Sporadic E, TEP, AUR, and specific geography).
- **ClubLog Integration**: Automatic check of your QSO status (Worked/Confirmed) for each expedition.
- **Global Propagation**: Real-time SFI, Kp indices, and HF band conditions (WSPR Index) with forecasts.
- **Expedition Management**: Database of current expeditions with urgency indicators (pulsing icons for ending expeditions).
- **Personalization**: Custom callsign, continent, and ClubLog filter settings.

## 🛠 Technology Stack

- **Frontend**: React 18, Vite, TypeScript.
- **Styling**: Tailwind CSS (Dark-first design, Glassmorphism).
- **Animations**: Motion (motion/react).
- **Backend**: Node.js (Express) with Vite middleware integration.
- **AI**: Google Gemini AI (via `@google/genai`).
- **Data**: WebSockets for live spots, REST APIs for propagation and expedition data.

## 📱 Device Support

The application is fully responsive and optimized for:
- Desktop browsers.
- Mobile devices (iOS/iPadOS support including Apple Touch Icon).
- Portrait and landscape orientations.

## ⚙️ Setup

To unlock the full potential of the app, we recommend configuring the following in Settings (gear icon):
1. **Callsign**: Your callsign for ClubLog integration.
2. **ClubLog App Password**: Application-specific password (not your main password).
3. **Gemini API Key**: To enable AI-powered spot analysis.

---
*Developed for the amateur radio community. 73!*
