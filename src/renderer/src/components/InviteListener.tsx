import { useEffect, useRef } from 'react'
import { getInvitesQueryKey, useClientApi } from '@comapeo/core-react'
import { useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from '@tanstack/react-router'

import { useRejectInvite } from '../hooks/mutations/invites'
import { usePendingInvites } from '../hooks/usePendingInvites'

export function InviteListener() {
	const clientApi = useClientApi()
	const location = useLocation()
	const navigate = useNavigate()
	const rejectInvite = useRejectInvite()
	const queryClient = useQueryClient()
	const { data: pendingInvites } = usePendingInvites()
	const prevCount = useRef(0)
	const isDevTest = process.env.NODE_ENV === 'development'
	useEffect(() => {
		if (isDevTest) {
			return
		}
		function onInviteReceived(invite: { inviteId: string }) {
			queryClient.invalidateQueries({ queryKey: getInvitesQueryKey() })
			if (location.pathname === '/Onboarding/CreateJoinProjectScreen') {
				navigate({
					to: '/Onboarding/JoinProjectScreen/$inviteId',
					params: { inviteId: invite.inviteId },
				})
			}
		}

		clientApi.invite.addListener('invite-received', onInviteReceived)

		return () => {
			clientApi.invite.removeListener('invite-received', onInviteReceived)
		}
	}, [
		isDevTest,
		clientApi,
		queryClient,
		location.pathname,
		navigate,
		rejectInvite,
	])

	useEffect(() => {
		if (!isDevTest) {
			return
		}
		if (location.pathname === '/Onboarding/CreateJoinProjectScreen') {
			if (pendingInvites.length > prevCount.current) {
				const latest = pendingInvites[pendingInvites.length - 1]
				if (latest) {
					navigate({
						to: '/Onboarding/JoinProjectScreen/$inviteId',
						params: { inviteId: latest.inviteId },
					})
				}
			}
		}
		prevCount.current = pendingInvites.length
	}, [pendingInvites, location.pathname, navigate])

	return null
}
