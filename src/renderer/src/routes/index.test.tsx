import type { ReactNode } from 'react'
import { getDeviceInfoQueryKey } from '@comapeo/core-react'
import { QueryClient } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { render, waitFor } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import { router } from '../App'
import {
	ActiveProjectIdProvider,
	CreateActiveProjectIdStore,
} from '../contexts/ActiveProjectIdProvider'
import { WrapperWithClient } from '../test/helpers/Wrapper'
import { setupCoreIpc } from '../test/helpers/ipc'

const { client } = setupCoreIpc()

const queryClient = new QueryClient()

const activeProjectIdStore = CreateActiveProjectIdStore({ persist: false })

const Wrapper = ({ children }: { children: ReactNode }) => (
	<WrapperWithClient queryClient={queryClient} clientApi={client}>
		<ActiveProjectIdProvider store={activeProjectIdStore}>
			{children}
		</ActiveProjectIdProvider>
	</WrapperWithClient>
)

describe('index navigates to the correct route based on state', () => {
	render(<RouterProvider router={router} />, { wrapper: Wrapper })

	test('when username and projectId is undefined: user is redirected to "/onboarding" ', async () => {
		await client
			.setDeviceInfo({
				name: '',
				deviceType: 'tablet',
			})
			.then(() => {
				queryClient.invalidateQueries({ queryKey: getDeviceInfoQueryKey() })
			})
		await router.navigate({ to: '/' })

		waitFor(() => {
			expect(router.state.location.pathname).toStrictEqual('/Onboarding')
		})
	})

	test('when username is defined and project name is undefined: user is redirected to "/onboarding/CreateJoinProjectScreen" ', async () => {
		activeProjectIdStore.actions.setActiveProjectId('test')
		await router.navigate({ to: '/' })

		waitFor(() => {
			expect(router.state.location.pathname).toStrictEqual(
				'/Onboarding/CreateJoinProjectScreen',
			)
		})
	})

	test('when username and project name are both defined: user is redirected to "/tab1" ', async () => {
		await client
			.setDeviceInfo({
				name: 'erik',
				deviceType: 'tablet',
			})
			.then(() => {
				queryClient.invalidateQueries({ queryKey: getDeviceInfoQueryKey() })
			})
		await router.navigate({ to: '/' })

		waitFor(() => {
			expect(router.state.location.pathname).toStrictEqual('/tab1')
		})
	})
})
