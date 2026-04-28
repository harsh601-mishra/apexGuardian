import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { CrisisProvider } from './contexts/CrisisProvider.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CrisisProvider>
      <App />
    </CrisisProvider>
  </React.StrictMode>,
)
 