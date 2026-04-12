# DX Radar | Expedition Spotter

Moderní webová aplikace pro radioamatéry (HAM) zaměřená na sledování aktuálních DX expedic v reálném čase. Aplikace kombinuje data z DX clusterů, ClubLogu a pokročilou analýzu pomocí AI pro maximální přehled o dění na pásmech.

## 🚀 Hlavní funkce

- **Real-time DX Monitoring**: Sledování spotů z DX clusterů v reálném čase pomocí WebSocketů.
- **AI Analýza (Gemini)**: Inteligentní analýza spotů, která detekuje:
  - Provozní módy (Fox/Hound, SuperFox, MSHV).
  - Sílu signálu (včetně rozlišení mezi FT8 dB a CW SNR).
  - Stav pileupu (Big pileup, Busy, Alone).
  - Specifické šíření na 6m (ES, TEP, AUR) a geografickou polohu.
- **Integrace ClubLog**: Automatická kontrola stavu vašich spojení (Worked/Confirmed) pro jednotlivé expedice.
- **Globální propagace**: Aktuální indexy SFI, Kp a stav HF pásem (WSPR Index) s předpovědí.
- **Správa expedic**: Databáze aktuálních expedic s indikací naléhavosti (blikající ikony pro končící expedice).
- **Personalizace**: Nastavení vlastního volacího znaku, kontinentu a filtrů pro ClubLog.

## 🛠 Technologický stack

- **Frontend**: React 18, Vite, TypeScript.
- **Styling**: Tailwind CSS (Dark-first design, Glassmorphism).
- **Animace**: Motion (motion/react).
- **Backend**: Node.js (Express) s integrací Vite middleware.
- **AI**: Google Gemini AI (přes `@google/genai`).
- **Data**: WebSocket pro live spoty, REST API pro propagaci a expedice.

## 📱 Podpora zařízení

Aplikace je plně responzivní a optimalizovaná pro:
- Desktopové prohlížeče.
- Mobilní zařízení (iOS/iPadOS podpora včetně Apple Touch Icon).
- Režim na výšku i na šířku.

## ⚙️ Nastavení

Pro plnou funkčnost aplikace doporučujeme v nastavení (ikona ozubeného kola) vyplnit:
1. **Callsign**: Vaše volací značka pro ClubLog integraci.
2. **ClubLog App Password**: Heslo pro aplikaci (ne vaše hlavní heslo).
3. **Gemini API Key**: Pro aktivaci AI analýzy spotů.

---
*Vyvinuto pro radioamatérskou komunitu. 73!*
