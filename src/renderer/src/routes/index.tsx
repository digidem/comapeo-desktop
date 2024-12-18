import { useLayoutEffect } from 'react'
import { useOwnDeviceInfo } from '@comapeo/core-react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { useActiveProjectIdStoreState } from '../contexts/ActiveProjectIdProvider'

export const Route = createFileRoute('/')({
	component: RouteComponent,
})

// the user will never get here, they will be redirected.
// While this code is semi hacky, the suggested alternative is to redirect in the (beforeLoad)[https://tanstack.com/router/latest/docs/framework/react/guide/authenticated-routes#the-routebeforeload-option]. The problem is that this requires the router to use 'useDeviceInfo'. We could pass this hook to the router via the RouterContext. But i think the complexity of passing that info makes this hacky code slightly more desirable and easy to understand.

function RouteComponent() {
	const navigate = useNavigate()
	const { data } = useOwnDeviceInfo()
	const hasCreatedDeviceName = data?.name !== undefined
	const activeProjectId = useActiveProjectIdStoreState(
		(store) => store.activeProjectId,
	)

	useLayoutEffect(() => {
		if (!hasCreatedDeviceName) {
			navigate({ to: '/Onboarding' })
		}
		if (!activeProjectId) {
			navigate({ to: '/Onboarding/CreateJoinProjectScreen' })
		} else {
			navigate({ to: '/tab1' })
		}
	})

	return null
}
