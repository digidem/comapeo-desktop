import { useEffect } from 'react'
import {
	useAcceptInvite,
	useClientApi,
	useRejectInvite,
} from '@comapeo/core-react'
import type { Invite, InviteRemovalReason } from '@comapeo/core/dist/invite-api'
import { styled } from '@mui/material/styles'
import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { BLACK, COMAPEO_BLUE, WHITE } from '../../colors'
import { Button } from '../../components/Button'
import { OnboardingScreenLayout } from '../../components/Onboarding/OnboardingScreenLayout'
import { OnboardingTopMenu } from '../../components/Onboarding/OnboardingTopMenu'
import { Text } from '../../components/Text'
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
	inviteNotFound: {
		id: 'screens.JoinProjectScreen.inviteNotFound',
		defaultMessage: 'Invite Not Found',
	},
	inviteNotFoundDesc: {
		id: 'screens.JoinProjectScreen.inviteNotFoundDesc',
		defaultMessage: 'This invite is no longer valid or has been removed.',
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
	const { data: pendingInvites } = usePendingInvites()
	const invite = pendingInvites.find((i) => i.inviteId === inviteId)

	const { mutate: acceptInvite } = useAcceptInvite()
	const { mutate: rejectInvite } = useRejectInvite()

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

	if (!invite) {
		return (
			<OnboardingScreenLayout topMenu={<OnboardingTopMenu currentStep={3} />}>
				<div style={{ width: '100%', flexGrow: 1 }}>
					<div style={{ textAlign: 'center' }}>
						<Text kind="title" style={{ marginTop: 12 }}>
							{formatMessage(m.inviteNotFound)}
						</Text>
					</div>
					<div style={{ textAlign: 'center', margin: '80px 0' }}>
						<Text style={{ marginTop: 12 }}>
							{formatMessage(m.inviteNotFoundDesc)}
						</Text>
					</div>
				</div>
				<Button
					onClick={() =>
						navigate({ to: '/Onboarding/CreateJoinProjectScreen' })
					}
				>
					{formatMessage({ id: 'common.goBack', defaultMessage: 'Go Back' })}
				</Button>
			</OnboardingScreenLayout>
		)
	}

	const handleDecline = () => {
		rejectInvite(
			{ inviteId: invite.inviteId },
			{
				onSuccess: () => {
					const nextInvite = pendingInvites.find((i) => i.inviteId !== inviteId)
					if (nextInvite) {
						navigate({
							to: '/Onboarding/JoinProjectScreen/$inviteId',
							params: { inviteId: nextInvite.inviteId },
						})
					} else {
						navigate({ to: '/Onboarding/CreateJoinProjectScreen' })
					}
				},
				onError: () => {
					console.log('Declining invite error', invite.inviteId)
				},
			},
		)
	}

	const handleJoin = () => {
		acceptInvite(
			{ inviteId: invite.inviteId },
			{
				onSuccess: () => {
					navigate({ to: '/tab1' })
				},
				onError: () => {
					console.log('Accepting invite error ', invite.inviteId)
				},
			},
		)
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
						{invite.projectName ?? 'Unknown Project'}
					</Text>
				</div>
				<div style={{ textAlign: 'center', margin: '80px 0' }}>
					<Text style={{ fontSize: '1.25rem', color: BLACK, marginBottom: 12 }}>
						{formatMessage(m.invitedTitle)}
					</Text>
					<Text bold style={{ fontSize: '1.25rem' }}>
						{invite.projectName ?? 'Unknown Project'}
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
