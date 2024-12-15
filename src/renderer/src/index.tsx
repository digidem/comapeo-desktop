import { createRoot } from 'react-dom/client'

import { AppWrapper } from './AppWrapper'

import './index.css'

const root = createRoot(document.getElementById('app') as HTMLElement)

root.render(<AppWrapper />)
