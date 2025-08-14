import * as SentryReact from '@sentry/react'
import { createRoot } from 'react-dom/client'

import './index.css'

import { App } from './app'

const root = createRoot(document.getElementById('app') as HTMLElement, {
	onUncaughtError: SentryReact.reactErrorHandler((error, errorInfo) => {
		console.warn('Uncaught error', error, errorInfo.componentStack)
	}),
	onCaughtError: SentryReact.reactErrorHandler(),
	onRecoverableError: SentryReact.reactErrorHandler(),
})

root.render(<App />)
