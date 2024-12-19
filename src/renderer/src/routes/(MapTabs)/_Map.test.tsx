import { describe } from 'node:test'
import type { ReactNode } from 'react'
import { QueryClient } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import { router } from '../../App'
import {
	ActiveProjectIdProvider,
	createActiveProjectIdStore,
} from '../../contexts/ActiveProjectIdProvider'
import { WrapperWithClient } from '../../test/helpers/Wrapper'
import { setupCoreIpc } from '../../test/helpers/ipc'

const { client } = setupCoreIpc()

const queryClient = new QueryClient()

const activeProjectIdStore = createActiveProjectIdStore({ persist: false })

const Wrapper = ({ children }: { children: ReactNode }) => (
	<WrapperWithClient queryClient={queryClient} clientApi={client}>
		<ActiveProjectIdProvider store={activeProjectIdStore}>
			{children}
		</ActiveProjectIdProvider>
	</WrapperWithClient>
)

describe('tabs navigate to correct routes', () => {
	render(<RouterProvider router={router} />, { wrapper: Wrapper })

	router.navigate({ to: '/tab1' })

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

	test('Tab 1 selected when user has navigated to "tab1", and all other tags are not selected', async () => {
		const Tab1 = screen.getByTestId('tab-observation')
		expect(Tab1.ariaSelected).toBe('true')
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
		expect(router.state.location.pathname).toStrictEqual('/tab2')
	})

	test('Tab 2 Screen is showing', () => {
		const title = screen.getByText('Tab 2')
		expect(title).toBeVisible()
	})

	test('Clicking Top Tab propogated "/Tab1" to the navigator', () => {
		const firstTab = screen.getByTestId('tab-observation')
		firstTab.click()
		expect(router.state.location.pathname).toStrictEqual('/tab1')
	})

	test('Tab 1 Screen is showing', async () => {
		const title = await screen.findByText('Tab 1')
		expect(title).toBeVisible()
	})

	test('Clicking "About" propogates "/Tab 2" to the navigator', () => {
		const aboutTab = screen.getByText('About')
		aboutTab.click()
		expect(router.state.location.pathname).toStrictEqual('/tab2')
	})

	test('Tab 2 Screen is showing', () => {
		const title = screen.getByText('Tab 2')
		expect(title).toBeDefined()
	})
})
