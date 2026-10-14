import { Suspense, useState, type PropsWithChildren } from 'react'
import {
	useManyProjects,
	useOwnDeviceInfo,
	useOwnRoleInProject,
} from '@comapeo/core-react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import {
	defineMessages,
	useIntl,
	type MessageValue,
	type NoMessageValues,
} from 'react-intl'
import * as v from 'valibot'

import {
	BLACK_03,
	BLUE_03,
	BLUE_05,
	BLUE_06,
	GREEN_00,
	ORANGE_00,
	WHITE_00,
} from '../../../../shared/colors.ts'
import { DecentDialog } from '../../components/decent-dialog.tsx'
import { Icon } from '../../components/icon.tsx'
import {
	ButtonBaseLink,
	ButtonLink,
	type ButtonBaseLinkComponentProps,
} from '../../components/link.tsx'
import { useActiveProjectId } from '../../contexts/active-project-id-store-context.ts'
import { useIconSizeBasedOnTypography } from '../../hooks/icon.ts'
import {
	COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
	COORDINATOR_ROLE_ID,
	CREATOR_ROLE_ID,
	type ListedProject,
} from '../../lib/comapeo.ts'
import { shouldShowAppUsageConsent } from '../../lib/metrics.ts'
import { getAppUsageMetricsQueryOptions } from '../../lib/queries/app-settings.ts'
import { getOnboardedAtQueryOptions } from '../../lib/queries/user.ts'
import {
	AppUsageConsentDialogContent,
	LeftProjectDialogContent,
	StartProjectDialogContent,
} from './-home-page-dialog-content.tsx'

const SearchParamsSchema = v.object({
	fromFlow: v.optional(
		v.variant('name', [
			v.object({
				name: v.literal('project_leave'),
				projectName: v.optional(v.string()),
			}),
		]),
	),
	projectAction: v.optional(v.union([v.literal('create')])),
})

export const Route = createFileRoute('/app/')({
	validateSearch: SearchParamsSchema,
	loader: async ({ context }) => {
		const { clientApi, queryClient } = context

		await Promise.all([
			queryClient.query({
				...getOnboardedAtQueryOptions(),
				staleTime: 'static',
			}),
			queryClient.query({
				staleTime: 'static',
				queryKey: [COMAPEO_CORE_REACT_ROOT_QUERY_KEY, 'client', 'device_info'],
				queryFn: async () => {
					return clientApi.getDeviceInfo()
				},
			}),
			queryClient.query({
				staleTime: 'static',
				queryKey: [COMAPEO_CORE_REACT_ROOT_QUERY_KEY, 'projects'],
				queryFn: async () => {
					return clientApi.listProjects()
				},
			}),
		])
	},
	component: RouteComponent,
})

function RouteComponent() {
	const intl = useIntl()

	const router = useRouter()

	const { data: ownDeviceInfo } = useOwnDeviceInfo()

	const { data: projects } = useManyProjects()

	const showCreateProjectDialog = Route.useSearch({
		select: (values) => values.projectAction === 'create',
	})

	const fromFlow = Route.useSearch({ select: (values) => values.fromFlow })

	const { data: onboardedAt } = useSuspenseQuery(getOnboardedAtQueryOptions())

	const { data: appUsageMetrics } = useSuspenseQuery(
		getAppUsageMetricsQueryOptions(),
	)

	const [showAppUsageDialog, setShowAppUsageDialog] = useState(() => {
		return shouldShowAppUsageConsent({ appUsageMetrics, onboardedAt })
	})

	return (
		<>
			<Stack
				component="main"
				direction="column"
				sx={{ flex: 1, overflow: 'auto' }}
			>
				<Stack
					component="header"
					direction="row"
					sx={{
						alignItems: 'center',
						borderBottom: `1px solid ${BLUE_05}`,
						flexWrap: 'wrap',
						gap: 6,
						paddingBlock: 4,
						paddingInline: 6,
					}}
				>
					<Stack direction="row" sx={{ alignItems: 'center', flex: 1, gap: 4 }}>
						<Typography variant="pageTitle">
							{intl.formatMessage(m.pageTitle)}
						</Typography>

						<Box
							sx={{
								background: BLUE_06,
								borderRadius: 2,
								paddingBlock: 1,
								paddingInline: 2,
							}}
						>
							<Typography
								color="textTertiary"
								variant="detailCopy"
								sx={{ whiteSpace: 'nowrap' }}
							>
								{intl.formatMessage(m.mostRecent)}
							</Typography>
						</Box>
					</Stack>

					<Stack direction="row" sx={{ flexWrap: 'wrap', gap: 2 }}>
						<ButtonLink
							variant="outlined"
							to="."
							search={(prev) => {
								return { ...prev, projectAction: 'create' }
							}}
							startIcon={<Icon name="material-symbols-add-circle-outline" />}
						>
							{intl.formatMessage(m.startNewProject)}
						</ButtonLink>

						<ButtonLink
							variant="outlined"
							to="/app/settings"
							startIcon={<Icon name="material-settings" />}
						>
							{intl.formatMessage(m.comapeoSettings)}
						</ButtonLink>
					</Stack>
				</Stack>

				<Suspense
					fallback={
						<Box
							sx={{
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'center',
								height: '100%',
							}}
						>
							<CircularProgress />
						</Box>
					}
				>
					<Box
						sx={{
							display: 'flex',
							flex: 1,
							flexDirection: 'column',
							overflow: 'auto',
						}}
					>
						{projects.length === 0 ? (
							<GetStartedPanel />
						) : (
							<ListedProjectsPanel projects={projects} />
						)}
					</Box>
				</Suspense>
			</Stack>

			<DecentDialog
				value={showCreateProjectDialog ? true : null}
				fullScreen
				sx={{ padding: 10 }}
			>
				{() => (
					<StartProjectDialogContent
						onBack={() => {
							if (router.history.canGoBack()) {
								router.history.back()
								return
							}

							router.navigate({
								to: '.',
								search: ({ projectAction: _, ...rest }) => {
									return rest
								},
								replace: true,
							})
						}}
						onProjectCreated={(createdProjectId) => {
							router.navigate({
								to: '/app/projects/$projectId',
								params: { projectId: createdProjectId },
							})
						}}
					/>
				)}
			</DecentDialog>

			<DecentDialog
				fullWidth
				maxWidth="sm"
				value={
					fromFlow?.name === 'project_leave'
						? { projectName: fromFlow.projectName }
						: null
				}
			>
				{({ projectName }) => (
					<LeftProjectDialogContent
						projectName={projectName}
						onClose={() => {
							router.navigate({
								to: '.',
								search: ({ fromFlow: _, ...rest }) => {
									return rest
								},
								replace: true,
							})
						}}
					/>
				)}
			</DecentDialog>

			<DecentDialog fullWidth maxWidth="sm" value={showAppUsageDialog || null}>
				{() => (
					<AppUsageConsentDialogContent
						deviceName={ownDeviceInfo.name}
						onClose={() => {
							setShowAppUsageDialog(false)
						}}
					/>
				)}
			</DecentDialog>
		</>
	)
}

function GetStartedPanel() {
	const intl = useIntl()

	const { data: ownDeviceInfo } = useOwnDeviceInfo()

	const desktopIconSize = useIconSizeBasedOnTypography({
		variant: 'heroHeader',
		multiplier: 4,
	})

	const checkIconSize = useIconSizeBasedOnTypography({
		variant: 'heroHeader',
	})

	return (
		<Container maxWidth="sm" sx={{ display: 'flex', flex: 1, padding: 6 }}>
			<Stack
				direction="column"
				sx={{ alignItems: 'center', flex: 1, gap: 10, paddingTop: 20 }}
			>
				<Stack
					direction="column"
					sx={{ alignItems: 'center', gap: 2, justifyContent: 'center' }}
				>
					<Box sx={{ position: 'relative' }}>
						<Icon
							name="material-symbols-computer"
							htmlColor={ORANGE_00}
							size={desktopIconSize}
						/>

						<Box
							sx={{
								background: GREEN_00,
								borderRadius: '50%',
								bottom: (theme) => theme.spacing(2),
								display: 'flex',
								padding: 1,
								position: 'absolute',
								right: (theme) => theme.spacing(-2),
							}}
						>
							<Icon
								name="material-check"
								htmlColor={WHITE_00}
								size={checkIconSize}
							/>
						</Box>
					</Box>

					<Typography
						variant="heroHeader"
						sx={{ textAlign: 'center', textWrap: 'balance' }}
					>
						{intl.formatMessage(m.getStartedTitle, {
							name: ownDeviceInfo.name,
						})}
					</Typography>
				</Stack>

				<Typography
					variant="heroSubheading"
					sx={{ textAlign: 'center', textWrap: 'balance' }}
				>
					{intl.formatMessage(m.getStartedDescription)}
				</Typography>

				<Stack
					component={List}
					direction="column"
					sx={{
						color: (theme) => theme.palette.text.secondary,
						gap: 4,
					}}
				>
					<ListItem sx={{ gap: 5 }}>
						<Icon name="openmoji-world-map" />

						{intl.formatMessage(m.getStartedMapAnywhereDetail)}
					</ListItem>

					<ListItem sx={{ gap: 5 }}>
						<Icon name="openmoji-handshake-medium-skin-tone" />

						{intl.formatMessage(m.getStartedShareDetail)}
					</ListItem>

					<ListItem sx={{ gap: 5 }}>
						<Icon name="openmoji-locked-with-key" />

						{intl.formatMessage(m.getStartedOwnDataDetail)}
					</ListItem>
				</Stack>
			</Stack>
		</Container>
	)
}

function ListedProjectsPanel({ projects }: { projects: Array<ListedProject> }) {
	const intl = useIntl()

	const activeProjectId = useActiveProjectId()

	const activeProject = projects.find((p) => p.projectId === activeProjectId)

	const otherProjects = activeProject
		? projects.filter((p) => p.projectId !== activeProject.projectId)
		: projects

	const sectionIconSize = useIconSizeBasedOnTypography({
		variant: 'sectionLabel',
		multiplier: 1.5,
	})

	return (
		<Container maxWidth="sm" sx={{ display: 'flex', flex: 1, padding: 6 }}>
			{activeProject ? (
				<Stack direction="column" sx={{ flex: 1, gap: 10 }}>
					<Stack component="section" direction="column" sx={{ gap: 4 }}>
						<Stack direction="row" sx={{ alignItems: 'center', gap: 2 }}>
							<Icon
								name="material-check-circle-rounded"
								size={sectionIconSize}
							/>

							<Typography component="h2" variant="sectionLabel">
								{intl.formatMessage(m.projectsListSectionTitleCurrent)}
							</Typography>
						</Stack>

						<ListedProjectCard
							key={activeProject.projectId}
							data-current
							highlight
							to="/app/projects/$projectId"
							params={{ projectId: activeProject.projectId }}
							project={activeProject}
						/>
					</Stack>

					{otherProjects.length > 0 ? (
						<>
							<Divider />

							<Stack component="section" direction="column" sx={{ gap: 4 }}>
								<Stack direction="row" sx={{ alignItems: 'center', gap: 2 }}>
									<Icon
										name="material-symbols-view-agenda"
										size={sectionIconSize}
									/>

									<Typography component="h2" variant="sectionLabel">
										{intl.formatMessage(m.projectsListSectionTitleOthers)}
									</Typography>
								</Stack>

								<Stack direction="column" sx={{ gap: 6 }}>
									{projects
										.filter((p) => p.projectId !== activeProject.projectId)
										.map((project) => (
											<ListedProjectCard
												key={project.projectId}
												to="/app/projects/$projectId"
												params={{ projectId: project.projectId }}
												project={project}
											/>
										))}
								</Stack>
							</Stack>
						</>
					) : null}
				</Stack>
			) : (
				<Stack direction="column" sx={{ flex: 1, gap: 4 }}>
					{projects.map((project) => (
						<ListedProjectCard
							key={project.projectId}
							to="/app/projects/$projectId"
							params={{ projectId: project.projectId }}
							project={project}
						/>
					))}
				</Stack>
			)}
		</Container>
	)
}

function ListedProjectCard({
	children,
	highlight,
	project,
	...buttonLinkProps
}: PropsWithChildren<
	ButtonBaseLinkComponentProps & {
		highlight?: boolean
		project: ListedProject
	}
>) {
	const intl = useIntl()

	const { data: ownRole } = useOwnRoleInProject({
		projectId: project.projectId,
	})

	const isAtLeastCoordinator =
		ownRole.roleId === COORDINATOR_ROLE_ID || ownRole.roleId === CREATOR_ROLE_ID

	const displayedName = project.name || intl.formatMessage(m.unnamedProject)

	const activeProjectIconSize = useIconSizeBasedOnTypography({
		variant: 'cardHeader',
		multiplier: 1.25,
	})

	const roleIconSize = useIconSizeBasedOnTypography({
		variant: 'bodyCopy',
	})

	return (
		<ButtonBaseLink
			{...buttonLinkProps}
			aria-label={intl.formatMessage(m.projectCardLinkAccessibleLabel, {
				name: displayedName,
			})}
			sx={{
				background: project.projectColor,
				borderRadius: 2,
				outline: `2px solid ${highlight ? BLUE_03 : BLACK_03}`,
				outlineOffset: -1,
				overflow: 'auto',
				'&:hover, &:focus-within': {
					color: (theme) => theme.palette.text.primary,
					outlineColor: (theme) =>
						theme.darken(highlight ? BLUE_03 : BLACK_03, 0.1),
					outlineWidth: 3,
				},
			}}
		>
			<Stack
				direction="column"
				sx={{ gap: 2, flex: 1, padding: 6, overflow: 'auto' }}
			>
				<Stack
					direction="row"
					sx={{
						alignItems: 'center',
						gap: 4,
						justifyContent: 'space-between',
						flex: 1,
					}}
				>
					<Typography
						variant="cardHeader"
						sx={{
							textOverflow: 'ellipsis',
							whiteSpace: 'nowrap',
							overflow: 'hidden',
						}}
					>
						{displayedName}
					</Typography>

					{highlight ? (
						<Icon
							color="primary"
							name="material-check-circle-rounded"
							size={activeProjectIconSize}
						/>
					) : null}
				</Stack>

				<Stack
					direction="row"
					sx={{
						alignItems: 'center',
						color: (theme) => theme.palette.text.secondary,
						gap: 2,
					}}
				>
					<Icon
						name={
							isAtLeastCoordinator
								? 'material-manage-accounts-filled'
								: 'material-people-filled'
						}
						size={roleIconSize}
					/>

					<Typography
						color="inherit"
						sx={{
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							whiteSpace: 'nowrap',
						}}
					>
						{intl.formatMessage(
							isAtLeastCoordinator
								? m.projectCardRoleCoordinator
								: m.projectCardRoleParticipant,
						)}
					</Typography>
				</Stack>
			</Stack>
		</ButtonBaseLink>
	)
}

const m = defineMessages<{
	readonly pageTitle: NoMessageValues
	readonly startNewProject: NoMessageValues
	readonly comapeoSettings: NoMessageValues
	readonly unnamedProject: NoMessageValues
	readonly projectCardLinkAccessibleLabel: { readonly name: MessageValue }
	readonly projectCardRoleCoordinator: NoMessageValues
	readonly projectCardRoleParticipant: NoMessageValues
	readonly mostRecent: NoMessageValues
	readonly getStartedTitle: { readonly name: MessageValue }
	readonly getStartedDescription: NoMessageValues
	readonly getStartedMapAnywhereDetail: NoMessageValues
	readonly getStartedShareDetail: NoMessageValues
	readonly getStartedOwnDataDetail: NoMessageValues
	readonly projectsListSectionTitleCurrent: NoMessageValues
	readonly projectsListSectionTitleOthers: NoMessageValues
}>({
	pageTitle: {
		id: '$1.routes.app.index.pageTitle',
		defaultMessage: 'All Projects',
		description: 'Title of home page.',
	},
	startNewProject: {
		id: '$1.routes.app.index.startNewProject',
		defaultMessage: 'Start New Project',
		description: 'Title for button to start a new project.',
	},
	comapeoSettings: {
		id: '$1.routes.app.index.comapeoSettings',
		defaultMessage: 'CoMapeo Settings',
		description: 'Title for button to navigate to CoMapeo settings.',
	},
	unnamedProject: {
		id: '$1.routes.app.index.unnamedProject',
		defaultMessage: 'Unnamed Project',
		description: 'Fallback for when project is missing a name.',
	},
	projectCardLinkAccessibleLabel: {
		id: 'routes.app.route.projectCardLinkAccessibleLabel',
		defaultMessage: 'Go to project {name}.',
		description:
			'Accessible label for link that navigates to project when clicked.',
	},
	projectCardRoleCoordinator: {
		id: '$1.routes.app.index.projectCardRoleCoordinator',
		defaultMessage: 'Coordinator',
		description: 'Displayed name of coordinator role on project card.',
	},
	projectCardRoleParticipant: {
		id: '$1.routes.app.index.projectCardRoleParticipant',
		defaultMessage: 'Participant',
		description: 'Displayed name of participant role on project card.',
	},
	mostRecent: {
		id: '$1.routes.app.index.mostRecent',
		defaultMessage: 'Most Recent',
		description:
			'Text for describing order of listed projects in all projects page.',
	},
	getStartedTitle: {
		id: '$1.routes.app.index.getStartedTitle',
		defaultMessage: '{name} is ready!',
		description: 'Title text for get started panel.',
	},
	getStartedDescription: {
		id: '$1.routes.app.index.getStartedDescription',
		defaultMessage:
			'Coordinate with a team to join them or start a new project.',
		description: 'Description text for get started panel.',
	},
	getStartedMapAnywhereDetail: {
		id: '$1.routes.app.index.getStartedMapAnywhereDetail',
		defaultMessage: 'Map anywhere and everywhere',
		description: 'Detail about mapping in get started panel.',
	},
	getStartedShareDetail: {
		id: '$1.routes.app.index.getStartedShareDetail',
		defaultMessage: 'Securely share with others',
		description: 'Detail about sharing in get started panel.',
	},
	getStartedOwnDataDetail: {
		id: '$1.routes.app.index.getStartedOwnDataDetail',
		defaultMessage: 'Own and control your data',
		description: 'Detail about data ownership in get started panel.',
	},
	projectsListSectionTitleCurrent: {
		id: '$1.routes.app.index.projectsListSectionTitleCurrent',
		defaultMessage: 'Current Project',
		description: 'Title for section displaying current project.',
	},
	projectsListSectionTitleOthers: {
		id: '$1.routes.app.index.projectsListSectionTitleOthers',
		defaultMessage: 'Other Projects',
		description: 'Title for section displaying all other projects.',
	},
})
