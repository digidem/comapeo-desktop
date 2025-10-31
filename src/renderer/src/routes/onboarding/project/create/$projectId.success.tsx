import { useProjectSettings } from '@comapeo/core-react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import {
	createFileRoute,
	redirect,
	useRouter,
	type NotFoundRouteProps,
} from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { GREEN, LIGHT_GREY } from '../../../../colors'
import { Icon } from '../../../../components/icon'
import { ButtonLink } from '../../../../components/link'
import { COMAPEO_CORE_REACT_ROOT_QUERY_KEY } from '../../../../lib/comapeo'

export const Route = createFileRoute(
	'/onboarding/project/create/$projectId/success',
)({
	loader: async ({ context, params }) => {
		const { activeProjectIdStore, clientApi, queryClient } = context
		const { projectId } = params

		let projectApi
		try {
			// TODO: Not ideal but requires notable changes to @comapeo/core-react
			// Copied from https://github.com/digidem/comapeo-core-react/blob/e56979321e91440ad6e291521a9e3ce8eb91200d/src/lib/react-query/projects.ts#L30
			projectApi = await queryClient.ensureQueryData({
				queryKey: [COMAPEO_CORE_REACT_ROOT_QUERY_KEY, 'projects', projectId],
				queryFn: async () => {
					return clientApi.getProject(projectId)
				},
			})
		} catch {
			// We are assuming that getting the project fails because it does not exist
			throw redirect({ to: '/onboarding/project/create' })
		}

		// TODO: Not ideal but requires notable changes to @comapeo/core-react
		// Copied from https://github.com/digidem/comapeo-core-react/blob/e56979321e91440ad6e291521a9e3ce8eb91200d/src/lib/react-query/projects.ts#L38
		const settings = await queryClient.ensureQueryData({
			queryKey: [
				COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
				'projects',
				projectId,
				'project_settings',
			],
			queryFn: async () => {
				return projectApi.$getProjectSettings()
			},
		})

		// TODO: Kind of hacky but we do not allow creating a project without a name
		// so it should be okay to redirect them to the project creation page for now.
		if (!settings.name) {
			throw redirect({ to: '/onboarding/project/create' })
		}

		activeProjectIdStore.actions.update(params.projectId)
	},
	component: RouteComponent,
	notFoundComponent: NotFoundComponent,
})

function RouteComponent() {
	const { formatMessage: t } = useIntl()
	const { projectId } = Route.useParams()

	const { data: projectSettings } = useProjectSettings({ projectId })

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
					{t(m.description, { projectName: projectSettings.name })}
				</Typography>
			</Container>

			<Stack direction="row" justifyContent="center" gap={5}>
				<ButtonLink
					to="/app/projects/$projectId/settings/categories"
					params={{ projectId }}
					variant="outlined"
					fullWidth
					sx={{ maxWidth: 400 }}
				>
					{t(m.updateCategoriesSet)}
				</ButtonLink>
				<ButtonLink
					to="/app/projects/$projectId/invite"
					params={{ projectId }}
					variant="contained"
					fullWidth
					sx={{ maxWidth: 400 }}
				>
					{t(m.inviteCollaborators)}
				</ButtonLink>
			</Stack>
		</Stack>
	)
}

function NotFoundComponent(_props: NotFoundRouteProps) {
	const router = useRouter()

	const { formatMessage: t } = useIntl()

	const { projectId } = Route.useParams()

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
					{t(m.notFound, { projectId })}
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
	title: {
		id: 'routes.onboarding.project.create.$projectId.success.title',
		defaultMessage: 'Success!',
	},
	description: {
		id: 'routes.onboarding.project.create.$projectId.success.description',
		defaultMessage: 'You created<br></br><b>{projectName}</b>',
	},
	updateCategoriesSet: {
		id: 'routes.onboarding.project.create.$projectId.success.updateCategoriesSet',
		defaultMessage: 'Update Categories Set',
	},
	inviteCollaborators: {
		id: 'routes.onboarding.project.create.$projectId.success.inviteCollaborators',
		defaultMessage: 'Invite Collaborators',
	},
	notFound: {
		id: 'routes.onboarding.project.create.$projectId.notFound',
		defaultMessage: 'Could not find project with ID {projectId}',
	},
	goBack: {
		id: 'routes.onboarding.project.create.$projectId.success.goBack',
		defaultMessage: 'Go back',
	},

	projectNotFound: {
		id: 'routes.onboarding.project.create.$projectId.success.projectNotFound',
		defaultMessage: 'Could not find invite with ID {inviteId}',
		description: 'Text displayed when invite cannot be found.',
	},
})
