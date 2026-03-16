# 說來話長 TalkFit

<img src="public/app-icon.png" alt="TalkFit App Icon" width="96" />

> Interactive React prototype for an iOS speech coaching app — helping users speak more fluently by detecting filler words and monitoring speech rate in real time.

---

## Features

- **Real-time speech recognition** — on-device via Whisper (`@xenova/transformers`), targeting Apple Intelligence in the production app
- **Filler word detection** — live transcript with red highlights on detected fillers (嗯、然後、那個…)
- **Live WPM gauge** — circular arc meter that color-codes speech speed: green (normal), red (too fast), purple (too slow)
- **Speed curve chart** — post-session line chart with ideal-range reference band
- **Session report & grading** — fluency score A+ ~ D based on filler frequency and speed consistency
- **Session history & trend charts** — area chart tracking improvement across sessions
- **Customizable filler lists** — enable/disable individual words, add custom entries, organized by category
- **Adjustable speed thresholds** — dual-handle slider for slow/fast boundaries (default 120–180 WPM)
- **Microphone selector** — choose audio input device for waveform visualization
- **Waveform visualization** — animated frequency bars during recording; graceful demo animation when mic is unavailable
- **Light / Dark theme toggle** — Dracula-inspired dark palette, persisted to `localStorage`
- **iPhone frame simulation** — rose-gold metallic border for mobile-first demo presentation
- **Annotation side panel** — each screen has a linked documentation panel explaining product features

---

## Screens

| Screen | Description |
|--------|-------------|
| 首頁 Home | Dashboard with weekly stats, daily filler bar chart, and personalized tip |
| 練習中 Practice | Live recording with WPM gauge, waveform, real-time transcript |
| 分析報告 Report | Post-session scores, filler ranking, speed curve, annotated transcript |
| 紀錄 History | Cumulative stats, trend chart, session list |
| 設定 Settings | Detection toggles, filler word editor, speed range, language, feedback options |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS with CSS variable dual-theme |
| State | Zustand (5 stores, `localStorage` persistence) |
| Animation | Framer Motion |
| Charts | Recharts (BarChart, LineChart, AreaChart) |
| Speech recognition | `@xenova/transformers` — Whisper base model in Web Worker |
| Audio visualization | Web Audio API (AnalyserNode) |

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Load Demo Data

Click the **✦ 載入示範資料** button in the top bar to populate all screens with sample session data — no microphone required.

---

## Project Structure

```
src/
├── screens/          # HomeScreen, PracticeScreen, ReportScreen, HistoryScreen, SettingsScreen
├── components/
│   ├── shell/        # PhoneFrame, StatusBar, TabBar
│   └── MicSelector
├── hooks/            # useSpeechRecognition, useSpeechRate, useAudioLevel, useMicrophoneDevices
├── stores/           # navigationStore, sessionStore, historyStore, reportStore, settingsStore
├── lib/              # speechAnalysis, grading, fillerWords, mockData
├── annotation/       # AnnotationPanel + per-screen annotation data
└── types/            # Shared TypeScript interfaces
public/
├── whisperWorker.js  # Whisper inference Web Worker (ES module, Vite-unprocessed)
├── transformers.min.js  # @xenova/transformers bundled locally
└── app-icon.png      # App icon
```

---

## Notes

- First load downloads the Whisper base model (~75 MB) and caches it in IndexedDB; subsequent loads are near-instant.
- The waveform always animates during recording — a sine-wave demo runs as a fallback if microphone access is unavailable.
- All session data is stored in `localStorage` and never leaves the device.
