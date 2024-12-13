import type { ReactNode } from 'react'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

import { IntlProvider } from '../contexts/IntlContext'
import { routeTree } from '../routeTree.gen'

vi.mock('../contexts/persistedState/PersistedProjectId', () => ({
	...vi.importActual('../contexts/persistedState/PersistedProjectId'),
	usePersistedProjectIdStore: vi.fn((selector) => {
		// Provide the mocked store state here
		const mockedState = {
			projectId: 'mocked-project-id',
			setProjectId: vi.fn(),
		}
		return selector(mockedState)
	}),
}))

vi.mock('@comapeo/core-react', () => ({
	useManyDocs: vi.fn(() => ({ data: [] })),
}))

const Wrapper = ({ children }: { children: ReactNode }) => (
	<IntlProvider>{children}</IntlProvider>
)

const router = createRouter({
	routeTree,
	context: { hasDeviceName: true, persistedProjectId: true },
})

describe('clicking tabs navigate to correct tab', () => {
	router.navigate({ to: '/Tab1' })
	render(<RouterProvider router={router} />, { wrapper: Wrapper })

	test('There are 4 tabs', async () => {
		const AllTabs = await screen.findAllByRole('tab')
		expect(AllTabs).toHaveLength(4)
	})

	test('Second tab has no children and is disabled', async () => {
		const AllTabs = await screen.findAllByRole('tab')
		const secondTab = AllTabs[1]
		expect(secondTab?.childElementCount).toBe(0)
		expect(secondTab).toBeDisabled()
	})

	test('Tab 1 is selected by default', async () => {
		const Tab1 = screen.getByTestId('tab-observation')
		expect(Tab1.ariaSelected).toBe('true')
	})

	test('The other tabs are not selected by default', () => {
		const AllTabs = screen.getAllByRole('tab')
		const selectedTabs = AllTabs.filter(
			(tab) => tab.getAttribute('aria-selected') === 'true',
		)
		expect(selectedTabs).toHaveLength(1)
	})

	test('Tab 1 Screen is showing', async () => {
		const title = await screen.findByText('Tab 1')
		expect(title).toBeVisible()
	})

	test('Clicking "Settings" propogates "/Tab 2" to the navigator', () => {
		const settingsButton = screen.getByText('Settings')
		settingsButton.click()
		expect(router.state.location.pathname).toStrictEqual('/Tab2')
	})

	test('Tab 2 Screen is showing', () => {
		const title = screen.getByText('Tab 2')
		expect(title).toBeVisible()
	})

	test('Clicking Top Tab propogated "/Tab1" to the navigator', () => {
		const firstTab = screen.getByTestId('tab-observation')
		firstTab.click()
		expect(router.state.location.pathname).toStrictEqual('/Tab1')
	})

	test('Tab 1 Screen is showing', async () => {
		const title = await screen.findByText('Tab 1')
		expect(title).toBeVisible()
	})

	test('Clicking "About" propogates "/Tab 2" to the navigator', () => {
		const aboutTab = screen.getByText('About')
		aboutTab.click()
		expect(router.state.location.pathname).toStrictEqual('/Tab2')
	})

	test('Tab 2 Screen is showing', () => {
		const title = screen.getByText('Tab 2')
		expect(title).toBeDefined()
	})
})
