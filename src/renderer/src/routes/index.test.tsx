import { afterEach } from 'node:test'
import type { ReactNode } from 'react'
import { describe, expect, test, vi } from 'vitest'

import { App, router } from '../App'
import {
	PersistedProjectIdContext,
	nonPersistedProjectIdStore,
} from '../contexts/persistedState/PersistedProjectId'
import { cleanup, render, screen } from '../test/test-util'

const Wrapper = ({ children }: { children: ReactNode }) => (
	<PersistedProjectIdContext.Provider value={nonPersistedProjectIdStore}>
		{children}
	</PersistedProjectIdContext.Provider>
)

describe('index navigates to the correct route based on state', () => {
	afterEach(() => {
		cleanup()
	})

	test('username and projectId is undefined and user is redirected to "/onboarding" ', async () => {
		nonPersistedProjectIdStore.setState(() => ({
			projectId: undefined,
		}))

		vi.mock('../queries/deviceInfo', () => ({
			useDeviceInfo: vi.fn(() => ({ data: { name: undefined } })),
		}))

		await router.navigate({ to: '/' })
		render(<App />, { wrapper: Wrapper })
		expect(router.state.location.pathname).toStrictEqual('/Onboarding')
		const text = await screen.findByText(
			'View and manage observations in CoMapeo Mobile Projects.',
		)
		expect(text).toBeVisible()
	})

	test('username is defined, project name is undefined and user is redirected to "/onboarding/CreateJoinProjectScreen" ', async () => {
		nonPersistedProjectIdStore.setState(() => ({
			projectId: undefined,
		}))

		vi.mock('../queries/deviceInfo', () => ({
			useDeviceInfo: vi.fn(() => ({ data: { name: 'Erik' } })),
		}))

		await router.navigate({ to: '/' })
		expect(router.state.location.pathname).toStrictEqual(
			'/Onboarding/CreateJoinProjectScreen',
		)

		const text = await screen.findByText('Join a Project')
		expect(text).toBeVisible()
	})

	test('username and project name is defined and user is redirected to "/Tab1" ', async () => {
		nonPersistedProjectIdStore.setState(() => ({
			projectId: 'someId',
		}))

		vi.mock('../queries/deviceInfo', () => ({
			useDeviceInfo: vi.fn(() => ({ data: { name: 'Erik' } })),
		}))

		await router.navigate({ to: '/' })
		expect(router.state.location.pathname).toStrictEqual('/Tab1')

		const tabs = await screen.findAllByRole('tab')
		expect(tabs).length(4)
	})
})
