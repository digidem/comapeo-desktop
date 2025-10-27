import { useSingleInvite } from '@comapeo/core-react'
import type { Invite } from '@comapeo/core/dist/invite/invite-api'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'
import * as v from 'valibot'

import { GREEN } from '../../../../colors'
import { Icon } from '../../../../components/icon'
import { ButtonLink } from '../../../../components/link'
import { COMAPEO_CORE_REACT_ROOT_QUERY_KEY } from '../../../../lib/comapeo'
import { customNotFound } from '../../../../lib/navigation'

const SearchParamsSchema = v.object({
	projectId: v.optional(v.string()),
})

export const Route = createFileRoute(
	'/onboarding/project/join/$inviteId/success',
)({
	validateSearch: SearchParamsSchema,
	loader: async ({ context, params }) => {
		const { clientApi, queryClient, formatMessage } = context
		const { inviteId } = params

		let invite: Invite
		try {
			// TODO: Not ideal but requires changes in @comapeo/core-react
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
				to: '/onboarding/project/join/$inviteId',
				params: { inviteId },
				replace: true,
			})
		}
	},
	component: RouteComponent,
})

function RouteComponent() {
	const { formatMessage: t } = useIntl()
	const { inviteId } = Route.useParams()
	const { projectId } = Route.useSearch()

	const { data: invite } = useSingleInvite({ inviteId })

	return (
		<Stack
			display="flex"
			direction="column"
			justifyContent="space-between"
			flex={1}
			gap={10}
			padding={5}
		>
			<Container maxWidth="sm" component={Stack} direction="column" gap={5}>
				<Box alignSelf="center">
					<Icon name="material-check-circle" size={80} htmlColor={GREEN} />
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
					{t(m.description, { projectName: invite.projectName })}
				</Typography>
			</Container>

			<ButtonLink
				to={projectId ? '/app/projects/$projectId' : '/app'}
				params={{ projectId }}
				variant="contained"
				fullWidth
				sx={{ maxWidth: 400, alignSelf: 'center' }}
				loadingPosition="start"
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
	},
	description: {
		id: 'routes.onboarding.project.join.$inviteId.success.description',
		defaultMessage: 'You joined<br></br><b>{projectName}</b>',
	},
	startUsingCoMapeo: {
		id: 'routes.onboarding.project.join.$inviteId.success.startUsingCoMapeo',
		defaultMessage: 'Start Using CoMapeo',
	},
	inviteNotFound: {
		id: 'routes.onboarding.project.join.$inviteId.success.inviteNotFound',
		defaultMessage: 'Could not find invite with ID {inviteId}',
		description: 'Text displayed when invite cannot be found.',
	},
})
