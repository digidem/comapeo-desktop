import { RouterProvider, createRouter } from '@tanstack/react-router'
import { createRoot } from 'react-dom/client'

import { routeTree } from './routeTree.gen'

import './index.css'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router
	}
}

const root = createRoot(document.getElementById('app') as HTMLElement)

root.render(<RouterProvider router={router} />)
