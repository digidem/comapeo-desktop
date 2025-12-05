import { useIsMutating } from '@tanstack/react-query'
import {
	Outlet,
	createFileRoute,
	redirect,
	useChildMatches,
	useRouter,
} from '@tanstack/react-router'

import { COMAPEO_CORE_REACT_ROOT_QUERY_KEY } from '#renderer/src/lib/comapeo.ts'

import { BasicLayout } from '../-layouts.tsx'
import { ONBOARDING_BASE_MUTATION_KEY } from './-shared.ts'

export const Route = createFileRoute('/onboarding/project')({
	loader: async ({ context }) => {
		const { clientApi, queryClient } = context

		const ownDeviceInfo = await queryClient.ensureQueryData({
			queryKey: [COMAPEO_CORE_REACT_ROOT_QUERY_KEY, 'client', 'device_info'],
			queryFn: async () => {
				return clientApi.getDeviceInfo()
			},
		})

		if (!ownDeviceInfo.name) {
			throw redirect({
				to: '/onboarding/device-name',
				replace: true,
			})
		}
	},
	component: RouteComponent,
})

function RouteComponent() {
	const router = useRouter()

	const currentRoute = useChildMatches({
		select: (matches) => {
			return matches.at(-1)!
		},
	})

	const hideBack =
		currentRoute.routeId === '/onboarding/project/create/$projectId/success' ||
		currentRoute.routeId === '/onboarding/project/join/$inviteId/success'

	const isOnboardingMutationPending =
		useIsMutating({ mutationKey: ONBOARDING_BASE_MUTATION_KEY }) > 0

	return (
		<BasicLayout
			backStatus={
				hideBack
					? 'hidden'
					: isOnboardingMutationPending
						? 'disabled'
						: 'enabled'
			}
			onBack={() => {
				if (isOnboardingMutationPending) {
					return
				}

				if (router.history.canGoBack()) {
					router.history.back()
				} else {
					router.navigate({
						to: '/onboarding/project',
						replace: true,
					})
				}
			}}
		>
			<Outlet />
		</BasicLayout>
	)
}
