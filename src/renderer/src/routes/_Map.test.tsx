import type { ReactNode } from 'react'
import { describe, expect, test, vi } from 'vitest'

import { App, router } from '../App'
import {
	PersistedProjectIdContext,
	nonPersistedProjectIdStore,
} from '../contexts/persistedState/PersistedProjectId'
import { render, screen } from '../test/test-util'

// import { useDeviceInfo } from '../queries/deviceInfo'

nonPersistedProjectIdStore.setState(() => ({
	projectId: 'tester',
}))

vi.mock('../queries/deviceInfo', () => ({
	useDeviceInfo: vi.fn(() => ({ data: { name: 'erik' } })),
}))

const Wrapper = ({ children }: { children: ReactNode }) => (
	<PersistedProjectIdContext.Provider value={nonPersistedProjectIdStore}>
		{children}
	</PersistedProjectIdContext.Provider>
)

describe('clicking tabs navigate to correct tab', () => {
	router.navigate({ to: '/Tab1' })
	render(<App />, { wrapper: Wrapper })

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
