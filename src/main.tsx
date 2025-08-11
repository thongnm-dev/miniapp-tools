import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { LoadingProvider } from './stores/LoadingContext'
import { AppProvider } from './stores/AppContext.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProvider>
      <LoadingProvider>
        <App />
      </LoadingProvider>
    </AppProvider>
  </React.StrictMode>,
) 