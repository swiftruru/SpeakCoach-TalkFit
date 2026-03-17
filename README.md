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
- **Waveform visualization** — animated frequency bars during recording; always-on sine-wave demo animation when mic is unavailable
- **Light / Dark theme toggle** — Dracula-inspired dark palette, persisted to `localStorage`
- **iPhone frame simulation** — rose-gold metallic border for mobile-first demo presentation
- **Annotation side panel** — each screen has a linked documentation panel explaining product features
- **One-click guided demo** — a single `開始示範` button launches a microphone-free sample replay first, then automatically continues into report / home / history / settings walkthrough with synced bottom overlay controls
- **Design Story section** — scrollable below the demo area; two-card layout covering the app concept (problem, solution, highlights, filler categories) and Hackathon participation motivation

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
|-------|------------|
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

### Top Bar Buttons

| Button | Action |
|--------|--------|
| ✦ Mock 資料 | Populate all screens with sample session data — no microphone required |
| ▶ 開始示範 | Start the guided demo: sample replay first, then auto-tour the key screens |
| 設定收音裝置 | Select microphone input device |
| 亮色 / 暗色 | Toggle light / dark theme |

---

## Project Structure

```
src/
├── screens/          # HomeScreen, PracticeScreen, ReportScreen, HistoryScreen, SettingsScreen
├── components/
│   ├── shell/        # PhoneFrame, StatusBar, TabBar
│   ├── MicSelector
│   └── AboutSection  # Design Story section (app concept + motivation)
├── demo/             # demoStore, demoScript, sampleReplayData, useLiveDemo, DemoOverlay
├── hooks/            # useSpeechRecognition, useSpeechRate, useAudioLevel, useMicrophoneDevices
├── stores/           # navigationStore, sessionStore, historyStore, reportStore, settingsStore
├── lib/              # speechAnalysis, grading, fillerWords, mockData
├── annotation/       # AnnotationPanel + per-screen annotation data
└── types/            # Shared TypeScript interfaces
public/
├── whisperWorker.js     # Whisper inference Web Worker (ES module, Vite-unprocessed)
├── transformers.min.js  # @xenova/transformers bundled locally
└── app-icon.png         # App icon
```

---

## Notes

- First load downloads the Whisper base model (~75 MB) and caches it in IndexedDB; subsequent loads are near-instant.
- The waveform always animates during recording — a multi-frequency sine-wave demo runs continuously and blends with real audio input when available.
- The guided demo does not require microphone permission; it replays a scripted sample session to show the core product value in about 20 seconds before continuing the walkthrough.
- All session data is stored in `localStorage` and never leaves the device.
