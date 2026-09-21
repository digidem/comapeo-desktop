import { Suspense } from 'react'
import Box from '@mui/material/Box'
import { captureException } from '@sentry/react'
import { Outlet, createFileRoute } from '@tanstack/react-router'

import { WHITE } from '../../colors.ts'
import { COMAPEO_CORE_REACT_ROOT_QUERY_KEY } from '../../lib/comapeo.ts'
import { getOnboardedAtQueryOptions } from '../../lib/queries/user.ts'
import { ProjectInviteDialog } from './-project-invite-dialog.tsx'

export const Route = createFileRoute('/app')({
	beforeLoad: async ({ context }) => {
		const { queryClient, clientApi } = context

		const ownDeviceInfo = await queryClient.query({
			queryKey: [COMAPEO_CORE_REACT_ROOT_QUERY_KEY, 'client', 'device_info'],
			queryFn: async () => {
				return clientApi.getDeviceInfo()
			},
		})

		// NOTE: Implicit check that the user hasn't completed the onboarding yet.
		if (!ownDeviceInfo.name) {
			throw Route.redirect({ to: '/welcome', replace: true })
		}
	},
	loader: async ({ context, preload }) => {
		const { queryClient } = context

		// NOTE: Backfill step for users who onboarded before we started persisting an `onboardedAt` timestamp.
		// We assume that if they're able to navigate to any "app" page, then they have passed the checks for being "onboarded".
		if (!preload) {
			const onboardedAtQueryOptions = getOnboardedAtQueryOptions()

			const onboardedAt = await queryClient.query({
				...onboardedAtQueryOptions,
				staleTime: 'static',
			})

			if (onboardedAt === null) {
				const updatedOnboardedAt = Date.now()

				try {
					await window.runtime.setOnboardedAt(updatedOnboardedAt)

					// NOTE: We synchronously update to ensure the updated timestamp is used on initial render.
					queryClient.setQueryData(
						onboardedAtQueryOptions.queryKey,
						updatedOnboardedAt,
					)
				} catch (err) {
					captureException(err)
				}
			}
		}
	},
	component: RouteComponent,
})

function RouteComponent() {
	return (
		<Box sx={{ backgroundColor: WHITE, height: '100%' }}>
			<Box sx={{ display: 'flex', height: '100%', overflow: 'auto' }}>
				<Outlet />

				<Suspense>
					<ProjectInviteDialog />
				</Suspense>
			</Box>
		</Box>
	)
}
