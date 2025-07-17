import { createRoot } from 'react-dom/client'

import './index.css'

import { App } from './app'

const root = createRoot(document.getElementById('app') as HTMLElement)

root.render(<App />)
