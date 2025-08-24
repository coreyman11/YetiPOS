
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { setupSecureLogging } from './utils/secure-logging'

// Apply secure logging globally
setupSecureLogging();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
