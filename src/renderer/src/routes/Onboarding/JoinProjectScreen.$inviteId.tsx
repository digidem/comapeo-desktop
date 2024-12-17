import React, { useEffect } from 'react'
import { useClientApi } from '@comapeo/core-react'
import type { Invite, InviteRemovalReason } from '@comapeo/core/dist/invite-api'
import { styled } from '@mui/material/styles'
import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { BLACK, COMAPEO_BLUE, WHITE } from '../../colors'
import { Button } from '../../components/Button'
import { OnboardingScreenLayout } from '../../components/Onboarding/OnboardingScreenLayout'
import { OnboardingTopMenu } from '../../components/Onboarding/OnboardingTopMenu'
import { Text } from '../../components/Text'
import { useAcceptInvite, useRejectInvite } from '../../hooks/mutations/invites'
import { usePendingInvites } from '../../hooks/usePendingInvites'
import AddPersonIcon from '../../images/add_person_solid.png'

export const m = defineMessages({
	title: {
		id: 'screens.JoinProjectScreen.title',
		defaultMessage: 'Join',
	},
	invitedTitle: {
		id: 'screens.JoinProjectScreen.invitedTitle',
		defaultMessage: "You've been invited to join",
	},
	declineInvite: {
		id: 'screens.JoinProjectScreen.declineInvite',
		defaultMessage: 'Decline Invite',
	},
	joinProject: {
		id: 'screens.JoinProjectScreen.joinProject',
		defaultMessage: 'Join Project',
	},
})

const IconContainer = styled('div')({
	position: 'relative',
	width: 72,
	height: 72,
	borderRadius: '50%',
	backgroundColor: WHITE,
	boxShadow: '0px 0px 12px 0px #999999',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	margin: '0 auto 12px auto',
})

const StyledIcon = styled('img')({
	width: 33,
	height: 30,
})

export const Route = createFileRoute('/Onboarding/JoinProjectScreen/$inviteId')(
	{
		component: JoinProjectScreenComponent,
	},
)

function JoinProjectScreenComponent() {
	const navigate = useNavigate()
	const { inviteId } = useParams({
		from: '/Onboarding/JoinProjectScreen/$inviteId',
	})
	const { formatMessage } = useIntl()
	const clientApi = useClientApi()
	const pendingInvites = usePendingInvites().data
	const invite = pendingInvites.find((i) => i.inviteId === inviteId)

	const accept = useAcceptInvite()
	const reject = useRejectInvite()

	useEffect(() => {
		function onInviteRemoved(
			removedInvite: Invite,
			reason: InviteRemovalReason,
		) {
			if (removedInvite.inviteId === inviteId) {
				if (reason === 'canceled') {
					navigate({ to: '/Onboarding/CreateJoinProjectScreen' })
				} else if (reason === 'accepted' || reason === 'rejected') {
					const nextInvite = pendingInvites.find((i) => i.inviteId !== inviteId)
					if (nextInvite) {
						navigate({
							to: '/Onboarding/JoinProjectScreen/$inviteId',
							params: { inviteId: nextInvite.inviteId },
						})
					} else {
						navigate({ to: '/Onboarding/CreateJoinProjectScreen' })
					}
				}
			}
		}

		clientApi.invite.addListener('invite-removed', onInviteRemoved)
		return () => {
			clientApi.invite.removeListener('invite-removed', onInviteRemoved)
		}
	}, [clientApi, inviteId, navigate, pendingInvites])

	const handleDecline = () => {
		if (invite) {
			reject.mutate(
				{ inviteId: invite.inviteId },
				{
					onSuccess: () => {
						const nextInvite = pendingInvites.find(
							(i) => i.inviteId !== inviteId,
						)
						if (nextInvite) {
							navigate({
								to: '/Onboarding/JoinProjectScreen/$inviteId',
								params: { inviteId: nextInvite.inviteId },
							})
						} else {
							navigate({ to: '/Onboarding/CreateJoinProjectScreen' })
						}
					},
				},
			)
		} else {
			navigate({ to: '/Onboarding/CreateJoinProjectScreen' })
		}
	}

	const handleJoin = () => {
		if (invite) {
			accept.mutate(
				{ inviteId: invite.inviteId },
				{
					onSuccess: () => {
						navigate({ to: '/tab1' })
					},
				},
			)
		}
	}

	const topMenu = (
		<OnboardingTopMenu
			currentStep={3}
			onBackPress={() =>
				navigate({ to: '/Onboarding/CreateJoinProjectScreen' })
			}
		/>
	)

	return (
		<OnboardingScreenLayout topMenu={topMenu}>
			<IconContainer>
				<StyledIcon src={AddPersonIcon} alt="Add Person" />
			</IconContainer>
			<Text kind="title" style={{ marginTop: 12 }}>
				{formatMessage(m.title)}
			</Text>
			<div style={{ width: '100%', flexGrow: 1 }}>
				<div style={{ textAlign: 'center' }}>
					<Text bold kind="title">
						{invite?.projectName ?? 'Unknown Project'}
					</Text>
				</div>
				<div style={{ textAlign: 'center', margin: '80px 0' }}>
					<Text style={{ fontSize: '1.25rem', color: BLACK, marginBottom: 12 }}>
						{formatMessage(m.invitedTitle)}
					</Text>
					<Text bold style={{ fontSize: '1.25rem' }}>
						{invite?.projectName ?? 'Unknown Project'}
					</Text>
				</div>
			</div>
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					gap: 12,
					width: '100%',
				}}
			>
				<Button
					variant="outlined"
					style={{
						backgroundColor: WHITE,
						color: BLACK,
						width: '100%',
						padding: '12px 20px',
					}}
					onClick={handleDecline}
				>
					{formatMessage(m.declineInvite)}
				</Button>
				<Button
					style={{
						backgroundColor: COMAPEO_BLUE,
						color: WHITE,
						width: '100%',
						padding: '12px 20px',
					}}
					onClick={handleJoin}
				>
					{formatMessage(m.joinProject)}
				</Button>
			</div>
		</OnboardingScreenLayout>
	)
}
