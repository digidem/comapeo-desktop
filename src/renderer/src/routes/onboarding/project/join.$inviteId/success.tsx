import { useSingleInvite } from '@comapeo/core-react'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { createFileRoute } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { GREEN, LIGHT_GREY } from '../../../../colors'
import { Icon } from '../../../../components/icon'
import { ButtonLink } from '../../../../components/link'
import { COMAPEO_CORE_REACT_ROOT_QUERY_KEY } from '../../../../lib/comapeo'

export const Route = createFileRoute(
	'/onboarding/project/join/$inviteId/success',
)({
	loader: async ({ context, params }) => {
		const { clientApi, queryClient } = context
		const { inviteId } = params

		// TODO: Not ideal but requires changes in @comapeo/core-react
		await queryClient.ensureQueryData({
			queryKey: [COMAPEO_CORE_REACT_ROOT_QUERY_KEY, 'invites', { inviteId }],
			queryFn: async () => {
				return clientApi.invite.getById(inviteId)
			},
		})
	},
	component: RouteComponent,
})

function RouteComponent() {
	const { formatMessage: t } = useIntl()
	const { inviteId } = Route.useParams()

	const { data: invite } = useSingleInvite({ inviteId })

	return (
		<Stack
			display="flex"
			useFlexGap
			direction="column"
			justifyContent="space-between"
			flex={1}
			gap={10}
			bgcolor={LIGHT_GREY}
			padding={5}
			borderRadius={2}
			overflow="auto"
		>
			<Container
				maxWidth="sm"
				component={Stack}
				direction="column"
				useFlexGap
				gap={5}
			>
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
				to="/app"
				variant="contained"
				size="large"
				disableElevation
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
})
