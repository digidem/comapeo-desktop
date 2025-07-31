import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import {
	Outlet,
	createFileRoute,
	notFound,
	useRouter,
	type NotFoundRouteProps,
} from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { LIGHT_GREY } from '../../../../colors'
import { COMAPEO_CORE_REACT_ROOT_QUERY_KEY } from '../../../../lib/comapeo'

export const Route = createFileRoute('/onboarding/project/join/$inviteId')({
	beforeLoad: async ({ context, params }) => {
		const { clientApi, queryClient } = context
		const { inviteId } = params

		try {
			// TODO: Not ideal but requires changes in @comapeo/core-react
			await queryClient.ensureQueryData({
				queryKey: [COMAPEO_CORE_REACT_ROOT_QUERY_KEY, 'invites', { inviteId }],
				queryFn: async () => {
					return clientApi.invite.getById(inviteId)
				},
			})
		} catch {
			throw notFound()
		}
	},
	component: RouteComponent,
	notFoundComponent: NotFoundComponent,
})

function RouteComponent() {
	return <Outlet />
}

function NotFoundComponent(_props: NotFoundRouteProps) {
	const router = useRouter()

	const { formatMessage: t } = useIntl()

	const { inviteId } = Route.useParams()

	return (
		<Stack
			display="flex"
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
				gap={5}
				flex={1}
				justifyContent="center"
			>
				<Typography variant="h1" fontWeight={500} textAlign="center">
					{t(m.notFound, { inviteId })}
				</Typography>
			</Container>

			<Button
				variant="outlined"
				fullWidth
				onClick={() => {
					if (router.history.canGoBack()) {
						router.history.back()
						return
					}

					router.navigate({ to: '/', replace: true })
				}}
				sx={{ maxWidth: 400, alignSelf: 'center' }}
			>
				{t(m.goBack)}
			</Button>
		</Stack>
	)
}

const m = defineMessages({
	notFound: {
		id: 'routes.onboarding.project.join.$inviteId.notFound',
		defaultMessage: 'Could not find invite with ID {inviteId}',
	},
	goBack: {
		id: 'routes.onboarding.project.join.$inviteId.goBack',
		defaultMessage: 'Go back',
	},
})
