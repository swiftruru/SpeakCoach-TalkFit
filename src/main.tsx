import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { MOCK_SESSIONS } from './lib/mockData'
import { useHistoryStore } from './stores/historyStore'

// Inject mock data directly into the store if empty (bypasses localStorage timing)
if (useHistoryStore.getState().sessions.length === 0) {
  useHistoryStore.setState({ sessions: MOCK_SESSIONS })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
