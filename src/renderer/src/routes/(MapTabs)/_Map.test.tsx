import type { ReactNode } from 'react'
import {
	RouterProvider,
	createRootRoute,
	createRoute,
	createRouter,
} from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import { IntlProvider } from '../../contexts/IntlContext'
import { Map } from './_Map'

const rootRoute = createRootRoute({})

const Wrapper = ({ children }: { children: ReactNode }) => (
	<IntlProvider>{children}</IntlProvider>
)

const mapRoute = createRoute({
	getParentRoute: () => rootRoute,
	id: 'map',
	component: Map,
})

const catchAllRoute = createRoute({
	getParentRoute: () => mapRoute,
	path: '$',
	component: () => null,
})

const routeTree = rootRoute.addChildren([mapRoute.addChildren([catchAllRoute])])

const router = createRouter({ routeTree })

test('renders something', () => {
	router.navigate({ to: '/tab1' })
	// @ts-expect-error - typings
	render(<RouterProvider router={router} />, { wrapper: Wrapper })
	const settingsButton = screen.getByText('Settings')
	expect(settingsButton).toBeDefined()
	settingsButton.click()
	console.log(router.state.location)
})
