import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import App from './App'
import './index.css'
import { antdTheme } from './styles/theme'

/**
 * Main Application Entry Point with Attio Theme
 * 
 * Applies the Attio-inspired design system to all Ant Design components
 * via ConfigProvider. This ensures consistent styling throughout the app.
 */

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider theme={antdTheme}>
        <App />
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>,
)


