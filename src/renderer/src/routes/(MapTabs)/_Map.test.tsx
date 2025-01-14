import type { ReactNode } from 'react'
import {
	RouterProvider,
	createRootRoute,
	createRoute,
	createRouter,
} from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'

import { IntlProvider } from '../../contexts/IntlContext'
import { MapLayout } from './_Map'

const rootRoute = createRootRoute({})

const Wrapper = ({ children }: { children: ReactNode }) => (
	<IntlProvider>{children}</IntlProvider>
)

// Creates a stubbed out router. We are just testing whether the navigation gets passed the correct route (aka "/main" or "/tab2") so we do not need the actual router and can just intecept the navgiation state.
const mapRoute = createRoute({
	getParentRoute: () => rootRoute,
	id: 'map',
	component: MapLayout,
})

const catchAllRoute = createRoute({
	getParentRoute: () => mapRoute,
	path: '$',
	component: () => null,
})

const routeTree = rootRoute.addChildren([mapRoute.addChildren([catchAllRoute])])

const router = createRouter({ routeTree })
test('clicking tabs navigate to correct tab', () => {
	vi.mock('../../components/Map', () => ({
		Map: () => <div>Mocked Map</div>,
	}))
	// @ts-expect-error - typings
	render(<RouterProvider router={router} />, { wrapper: Wrapper })
	const settingsButton = screen.getByText('Settings')
	settingsButton.click()
	const settingsRouteName = router.state.location.pathname
	expect(settingsRouteName).toStrictEqual('/tab2')

	const observationTab = screen.getByTestId('tab-observation')
	observationTab.click()
	const observationTabRouteName = router.state.location.pathname
	expect(observationTabRouteName).toStrictEqual('/main')

	const aboutTab = screen.getByText('About')
	aboutTab.click()
	const aboutTabRoute = router.state.location.pathname
	expect(aboutTabRoute).toStrictEqual('/tab2')
})
