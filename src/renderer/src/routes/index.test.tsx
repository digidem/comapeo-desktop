import type { ReactNode } from 'react'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { App, router } from '../App'
import {
	PersistedProjectIdContext,
	nonPersistedProjectIdStore,
} from '../contexts/persistedState/PersistedProjectId'
import { useDeviceInfo } from '../queries/deviceInfo'
import { cleanup, render, screen } from '../test/test-util'

vi.mock('../queries/deviceInfo')

const Wrapper = ({
	children,
	value,
}: {
	children: ReactNode
	value: typeof nonPersistedProjectIdStore
}) => (
	<PersistedProjectIdContext.Provider value={value}>
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

		vi.mocked(useDeviceInfo).mockReturnValue({
			// @ts-expect-error -Im not sure why
			data: { name: undefined },
		})

		render(
			<Wrapper value={nonPersistedProjectIdStore}>
				<App />
			</Wrapper>,
		)

		await router.navigate({ to: '/' })

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
		// @ts-expect-error -Im not sure why
		vi.mocked(useDeviceInfo).mockReturnValue({ data: { name: 'erik' } })

		render(
			<Wrapper value={nonPersistedProjectIdStore}>
				<App />
			</Wrapper>,
		)

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
		// @ts-expect-error -Im not sure why
		vi.mocked(useDeviceInfo).mockReturnValue({ data: { name: 'erik' } })

		render(
			<Wrapper value={nonPersistedProjectIdStore}>
				<App />
			</Wrapper>,
		)

		await router.navigate({ to: '/' })
		expect(router.state.location.pathname).toStrictEqual('/Tab1')

		const tabs = await screen.findAllByRole('tab')
		expect(tabs).length(4)
	})
})
