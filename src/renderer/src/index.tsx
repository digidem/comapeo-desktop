import { createRoot } from 'react-dom/client'

import './index.css'

import { AppWrapper } from './AppWrapper'

const root = createRoot(document.getElementById('app') as HTMLElement)

root.render(<AppWrapper />)
