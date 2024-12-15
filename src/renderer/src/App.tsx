import { RouterProvider, createRouter } from '@tanstack/react-router'

import { usePersistedProjectIdStore } from './contexts/persistedState/PersistedProjectId'
import { useDeviceInfo } from './queries/deviceInfo'
import { routeTree } from './routeTree.gen'

export const router = createRouter({
	routeTree,
	context: { hasDeviceName: undefined!, persistedProjectId: undefined! },
})

declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router
	}
}

export const App = () => {
	const { data } = useDeviceInfo()
	const hasDeviceName = data?.name !== undefined
	const persistedProjectId = !!usePersistedProjectIdStore(
		(store) => store.projectId,
	)
	return (
		<RouterProvider
			router={router}
			context={{ hasDeviceName, persistedProjectId }}
		/>
	)
}
