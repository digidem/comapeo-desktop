import { CssBaseline, ThemeProvider } from '@mui/material'
import { createRoot } from 'react-dom/client'

import theme from './Theme.tsx'

import './index.css'

import { App } from './App'

const root = createRoot(document.getElementById('app') as HTMLElement)

root.render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <App />
  </ThemeProvider>,
)
