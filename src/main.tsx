import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.tsx'
import { LanguageSync } from './i18n/LanguageSync'
import { getMockSessions } from './lib/mockData'
import { useHistoryStore } from './stores/historyStore'

// Inject mock data directly into the store if empty (bypasses localStorage timing)
if (useHistoryStore.getState().sessions.length === 0) {
  useHistoryStore.setState({ sessions: getMockSessions() })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageSync />
    <App />
  </StrictMode>,
)
