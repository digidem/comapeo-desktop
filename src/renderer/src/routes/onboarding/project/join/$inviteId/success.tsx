import { useOwnDeviceInfo, useSingleInvite } from '@comapeo/core-react'
import type { Invite } from '@comapeo/core/dist/invite/invite-api'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'
import * as v from 'valibot'

import { GREEN } from '#renderer/src/colors.ts'
import { Icon } from '#renderer/src/components/icon.tsx'
import { ButtonLink } from '#renderer/src/components/link.tsx'
import { COMAPEO_CORE_REACT_ROOT_QUERY_KEY } from '#renderer/src/lib/comapeo.ts'
import { customNotFound } from '#renderer/src/lib/navigation.ts'

const SearchParamsSchema = v.object({
	projectId: v.optional(v.string()),
})

export const Route = createFileRoute(
	'/onboarding/project/join/$inviteId/success',
)({
	validateSearch: SearchParamsSchema,
	loaderDeps: ({ search }) => {
		return { projectId: search.projectId }
	},
	loader: async ({ context, params, deps }) => {
		const { activeProjectIdStore, clientApi, queryClient, formatMessage } =
			context
		const { inviteId } = params

		let invite: Invite
		try {
			invite = await queryClient.ensureQueryData({
				queryKey: [COMAPEO_CORE_REACT_ROOT_QUERY_KEY, 'invites', { inviteId }],
				queryFn: async () => {
					return clientApi.invite.getById(inviteId)
				},
			})
		} catch {
			throw customNotFound({
				// TODO: Ideally do not need to specify this but it seems that the 'fuzzy' behavior
				// is not working as described in https://tanstack.com/router/latest/docs/framework/react/guide/not-found-errors
				routeId: '/onboarding/project',
				data: {
					message: formatMessage(m.inviteNotFound, {
						inviteId: inviteId.slice(0, 7),
					}),
				},
			})
		}

		// Redirect if the invite response did not actually succeed
		if (invite.state !== 'joined') {
			throw redirect({
				to: '/onboarding/project',
				replace: true,
			})
		}

		if (deps.projectId) {
			activeProjectIdStore.actions.update(deps.projectId)
		}
	},
	component: RouteComponent,
})

function RouteComponent() {
	const { formatMessage: t } = useIntl()
	const { inviteId } = Route.useParams()
	const { projectId } = Route.useSearch()

	const { data: invite } = useSingleInvite({ inviteId })

	const { data: ownDeviceInfo } = useOwnDeviceInfo()

	return (
		<Stack
			display="flex"
			direction="column"
			justifyContent="space-between"
			flex={1}
			gap={10}
		>
			<Container maxWidth="sm" component={Stack} direction="column" gap={5}>
				<Box alignSelf="center">
					<Icon
						name="material-check-circle-rounded"
						size={80}
						htmlColor={GREEN}
					/>
				</Box>

				<Typography variant="h1" fontWeight={500} textAlign="center">
					{t(m.title)}
				</Typography>

				<Typography
					variant="h2"
					fontWeight={400}
					textAlign="center"
					lineHeight={1.5}
				>
					{t(m.description, {
						deviceName: ownDeviceInfo.name,
						projectName: invite.projectName,
					})}
				</Typography>
			</Container>

			<ButtonLink
				to={projectId ? '/app/projects/$projectId' : '/app'}
				params={{ projectId }}
				variant="contained"
				fullWidth
				sx={{ maxWidth: 400, alignSelf: 'center' }}
				startIcon={<Icon name="material-map-filled" />}
			>
				{t(m.startUsingCoMapeo)}
			</ButtonLink>
		</Stack>
	)
}

const m = defineMessages({
	title: {
		id: 'routes.onboarding.project.join.$inviteId.success.title',
		defaultMessage: 'Success!',
		description: 'Title for onboarding joining project success page.',
	},
	description: {
		id: 'routes.onboarding.project.join.$inviteId.success.description',
		defaultMessage:
			'<b>{deviceName}</b><br></br>joined<br></br><b>{projectName}</b>.',
		description: 'Description for onboarding joining project success page.',
	},
	startUsingCoMapeo: {
		id: 'routes.onboarding.project.join.$inviteId.success.startUsingCoMapeo',
		defaultMessage: 'Start Using CoMapeo',
		description: 'Text for link to navigate to main app.',
	},
	inviteNotFound: {
		id: 'routes.onboarding.project.join.$inviteId.success.inviteNotFound',
		defaultMessage: 'Could not find invite with ID {inviteId}',
		description: 'Text displayed when invite cannot be found.',
	},
})
