import { useEffect } from 'react'
import { useClientApi } from '@comapeo/core-react'
import {
	createFileRoute,
	useLocation,
	useNavigate,
} from '@tanstack/react-router'

import { useRejectInvite } from '../hooks/mutations/invites'

export const Route = createFileRoute('/InviteListener')({
	component: InviteListener,
})

export function InviteListener() {
	const clientApi = useClientApi()
	const location = useLocation()
	const navigate = useNavigate()
	const rejectInvite = useRejectInvite()

	useEffect(() => {
		function onInviteReceived(invite: { inviteId: string }) {
			if (location.pathname === '/Onboarding/CreateJoinProjectScreen') {
				navigate({
					to: '/Onboarding/JoinProjectScreen/$inviteId',
					params: { inviteId: invite.inviteId },
				})
			} else {
				// Reject all invites received while not on the join project screen
				rejectInvite.mutate({ inviteId: invite.inviteId })
			}
		}

		clientApi.invite.addListener('invite-received', onInviteReceived)

		return () => {
			clientApi.invite.removeListener('invite-received', onInviteReceived)
		}
	}, [clientApi, location.pathname, navigate, rejectInvite])

	return null
}
