import { Suspense, type PropsWithChildren } from 'react'
import {
	useManyProjects,
	useOwnDeviceInfo,
	useOwnRoleInProject,
} from '@comapeo/core-react'
import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import Divider from '@mui/material/Divider'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import type { SxProps, Theme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'
import * as v from 'valibot'

import { BLUE_GREY, COMAPEO_BLUE, LIGHT_GREY, WHITE } from '../../colors.ts'
import { DecentDialog } from '../../components/decent-dialog.tsx'
import { Icon } from '../../components/icon.tsx'
import {
	ButtonBaseLink,
	IconButtonLink,
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
import {
	JoinProjectDialogContent,
	StartProjectDialogContent,
} from './-project-action-dialog-content.tsx'
import { DeviceIcon } from './projects/-shared/device-icon.tsx'

const SearchParamsSchema = v.object({
	projectsLayout: v.optional(v.union([v.literal('grid'), v.literal('list')])),
	fromOnboarding: v.optional(v.boolean()),
	projectAction: v.optional(v.union([v.literal('join'), v.literal('create')])),
})

export const Route = createFileRoute('/app/')({
	validateSearch: SearchParamsSchema,
	loader: async ({ context }) => {
		const { clientApi, queryClient } = context

		await Promise.all([
			queryClient.ensureQueryData({
				queryKey: [COMAPEO_CORE_REACT_ROOT_QUERY_KEY, 'client', 'device_info'],
				queryFn: async () => {
					return clientApi.getDeviceInfo()
				},
			}),
			queryClient.ensureQueryData({
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
	const { formatMessage: t } = useIntl()
	const { data: ownDeviceInfo } = useOwnDeviceInfo()

	const deviceIconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'h1',
	})

	const router = useRouter()

	const activeProjectId = useActiveProjectId()

	// TODO: Persist?
	const additionalProjectsLayout: NonNullable<
		v.InferInput<typeof SearchParamsSchema>['projectsLayout']
	> = Route.useSearch({
		select: (values) => values.projectsLayout || 'grid',
	})

	const { data: projects } = useManyProjects()

	const activeProject = projects.find((p) => p.projectId === activeProjectId)

	const viewportIsNarrow = useMediaQuery((theme) =>
		theme.breakpoints.down('lg'),
	)

	const projectActionToShow = Route.useSearch({
		select: (values) => values.projectAction,
	})

	const fromOnboarding = Route.useSearch({
		select: (values) => values.fromOnboarding,
	})

	function handleBack() {
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
	}

	return (
		<>
			<Stack component="main" direction="column" flex={1} overflow="auto">
				<Stack direction="column" padding={6} gap={4}>
					<Stack direction="row" gap={2} alignItems="center">
						<DeviceIcon
							deviceType={ownDeviceInfo.deviceType}
							size={deviceIconSize}
						/>

						<Typography variant="h1" fontWeight={500}>
							{t(fromOnboarding ? m.postOnboardingPageTitle : m.pageTitle, {
								name: ownDeviceInfo.name,
							})}
						</Typography>
					</Stack>

					<Box
						display="grid"
						gridTemplateColumns={`repeat(${viewportIsNarrow ? 2 : 3}, minmax(auto, 1fr))`}
						columnGap={5}
						rowGap={5}
					>
						{activeProject ? (
							<ListedProjectCard
								highlight
								to="/app/projects/$projectId"
								params={{ projectId: activeProject.projectId }}
								project={activeProject}
							/>
						) : null}

						<Stack direction="row" gap={4}>
							<ButtonBase
								sx={PROJECT_ACTION_CARD_SX}
								onClick={() => {
									router.navigate({
										to: '.',
										search: (prev) => {
											return { ...prev, projectAction: 'join' }
										},
									})
								}}
							>
								<Stack
									direction="column"
									justifyContent="center"
									alignItems="center"
									gap={4}
								>
									<Icon name="material-people-filled" />

									<Typography color="textPrimary">
										{t(m.joinProjectCardTitle)}
									</Typography>
								</Stack>
							</ButtonBase>

							<ButtonBase
								sx={PROJECT_ACTION_CARD_SX}
								onClick={() => {
									router.navigate({
										to: '.',
										search: (prev) => {
											return { ...prev, projectAction: 'create' }
										},
									})
								}}
							>
								<Stack
									direction="column"
									justifyContent="center"
									alignItems="center"
									gap={4}
								>
									<Icon name="material-manage-accounts-filled" />

									<Typography color="textPrimary" flex={1}>
										{t(m.startProjectCardTitle)}
									</Typography>
								</Stack>
							</ButtonBase>
						</Stack>
					</Box>
				</Stack>

				{projects.length > 0 ? (
					<>
						<Box paddingX={6}>
							<Divider variant="fullWidth" />
						</Box>

						<Stack direction="column" flex={1} gap={2}>
							<Stack
								direction="row"
								justifyContent="space-between"
								alignItems="center"
								paddingInline={6}
								paddingBlock={4}
								position="sticky"
								top={0}
								left={0}
								right={0}
								zIndex={1}
								bgcolor={WHITE}
							>
								<Stack
									direction="row"
									alignItems="baseline"
									gap={2}
									textAlign="center"
								>
									<Typography variant="h2" fontWeight={500}>
										{t(m.additionalProjectsSectionTitle)}
									</Typography>

									<Typography color="textSecondary">
										{t(m.additionalProjectsSectionDescription)}
									</Typography>
								</Stack>

								<Stack direction="row">
									<Tooltip
										title={t(m.additionalProjectsSectionShowAsGrid)}
										disableFocusListener
										placement="bottom"
									>
										<IconButtonLink
											to="."
											search={{ projectsLayout: 'grid' }}
											replace
											activeOptions={{ includeSearch: true }}
											inactiveProps={{
												sx: {
													color: (theme) =>
														additionalProjectsLayout === 'grid'
															? theme.palette.text.primary
															: BLUE_GREY,
												},
											}}
											activeProps={{
												sx: { color: (theme) => theme.palette.text.primary },
											}}
										>
											<Icon name="material-symbols-grid-view" />
										</IconButtonLink>
									</Tooltip>

									<Tooltip
										title={t(m.additionalProjectsSectionShowAsList)}
										disableFocusListener
										placement="bottom"
									>
										<IconButtonLink
											to="."
											search={{ projectsLayout: 'list' }}
											replace
											activeOptions={{ includeSearch: true }}
											inactiveProps={{
												sx: {
													color: (theme) =>
														additionalProjectsLayout === 'list'
															? theme.palette.text.primary
															: BLUE_GREY,
												},
											}}
											activeProps={{
												sx: { color: (theme) => theme.palette.text.primary },
											}}
										>
											<Icon name="material-symbols-lists" />
										</IconButtonLink>
									</Tooltip>
								</Stack>
							</Stack>

							<Box
								display="grid"
								gridTemplateColumns={
									additionalProjectsLayout === 'grid'
										? `repeat(${viewportIsNarrow ? 2 : 3}, minmax(auto, 1fr))`
										: '1fr'
								}
								rowGap={5}
								columnGap={5}
								paddingInline={6}
								paddingBlockEnd={6}
							>
								{projects
									.filter((p) => p !== activeProject)
									// NOTE: Projects are returned from oldest to newest
									// but we want newest to oldest
									.reverse()
									.map((project) => (
										<Suspense
											key={project.projectId}
											fallback={
												additionalProjectsLayout === 'list' ? (
													<Stack
														direction="row"
														flex={1}
														alignItems="center"
														gap={2}
														paddingInline={6}
														paddingBlock={4}
														border={`1px solid ${LIGHT_GREY}`}
														sx={{ borderRadius: 2 }}
													>
														<Skeleton
															variant="circular"
															width={24}
															height={24}
														/>

														<Skeleton
															variant="text"
															sx={{
																flex: 1,
																fontSize: (theme) =>
																	theme.typography.h1.fontSize,
															}}
														/>
													</Stack>
												) : (
													<Stack
														direction="column"
														gap={2}
														padding={6}
														border={`1px solid ${LIGHT_GREY}`}
														sx={{ borderRadius: 2 }}
													>
														<Skeleton
															variant="text"
															width="100%"
															sx={{
																fontSize: (theme) =>
																	theme.typography.h1.fontSize,
															}}
														/>
														<Stack direction="row" gap={2} alignItems="center">
															<Skeleton
																variant="circular"
																width={24}
																height={24}
															/>
															<Skeleton
																variant="text"
																width="25%"
																sx={{
																	fontSize: (theme) =>
																		theme.typography.body1.fontSize,
																}}
															/>
														</Stack>
													</Stack>
												)
											}
										>
											<ListedProjectCard
												to="/app/projects/$projectId"
												params={{ projectId: project.projectId }}
												project={project}
												singleRow={additionalProjectsLayout === 'list'}
											/>
										</Suspense>
									))}
							</Box>
						</Stack>
					</>
				) : null}
			</Stack>

			<DecentDialog value={projectActionToShow} fullScreen sx={{ padding: 10 }}>
				{(projectAction) =>
					projectAction === 'join' ? (
						<JoinProjectDialogContent onBack={handleBack} />
					) : (
						<StartProjectDialogContent
							onBack={handleBack}
							onProjectCreated={(createdProjectId) => {
								router.navigate({
									to: '/app/projects/$projectId',
									params: { projectId: createdProjectId },
								})
							}}
						/>
					)
				}
			</DecentDialog>
		</>
	)
}

const PROJECT_ACTION_CARD_SX = {
	flex: 1,
	borderRadius: 2,
	padding: 5,
	border: `1px solid ${BLUE_GREY}`,
	color: (theme) => theme.palette.text.secondary,
	'&:hover, &:focus-within': {
		color: (theme) => theme.palette.text.primary,
		outline: `2px solid ${BLUE_GREY}`,
	},
	textAlign: 'center',
} satisfies SxProps<Theme>

function ListedProjectCard({
	children,
	highlight,
	project,
	singleRow,
	...buttonLinkProps
}: PropsWithChildren<
	ButtonBaseLinkComponentProps & {
		highlight?: boolean
		project: ListedProject
		singleRow?: boolean
	}
>) {
	const { formatMessage: t } = useIntl()

	const { data: ownRole } = useOwnRoleInProject({
		projectId: project.projectId,
	})

	const isAtLeastCoordinator =
		ownRole.roleId === COORDINATOR_ROLE_ID || ownRole.roleId === CREATOR_ROLE_ID

	const displayedName = project.name || t(m.unnamedProject)

	return (
		<ButtonBaseLink
			{...buttonLinkProps}
			aria-label={t(m.projectCardLinkAccessibleLabel, { name: displayedName })}
			sx={{
				backgroundColor: project.projectColor,
				borderRadius: 2,
				border: `1px solid ${highlight ? COMAPEO_BLUE : LIGHT_GREY}`,
				color: (theme) => theme.palette.text.secondary,
				overflow: 'auto',
				'&:hover, &:focus-within': {
					color: (theme) => theme.palette.text.primary,
					outline: `2px solid ${highlight ? COMAPEO_BLUE : BLUE_GREY}`,
				},
			}}
		>
			{singleRow ? (
				<ProjectCardContentListVariant
					highlight={highlight}
					projectName={displayedName}
					role={isAtLeastCoordinator ? 'coordinator' : 'participant'}
				/>
			) : (
				<ProjectCardContentGridVariant
					highlight={highlight}
					projectName={displayedName}
					role={isAtLeastCoordinator ? 'coordinator' : 'participant'}
				/>
			)}
		</ButtonBaseLink>
	)
}

function ProjectCardContentGridVariant({
	highlight,
	projectName,
	role,
}: {
	highlight?: boolean
	projectName: string
	role: 'coordinator' | 'participant'
}) {
	const { formatMessage: t } = useIntl()

	const activeProjectIconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'h1',
	})

	const roleIconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'body1',
	})

	return (
		<Stack direction="column" gap={2} flex={1} padding={6} overflow="auto">
			<Stack
				direction="row"
				alignItems="center"
				justifyContent="space-between"
				flex={1}
			>
				<Typography
					component="p"
					variant="h1"
					color="textPrimary"
					fontWeight={500}
					textOverflow="ellipsis"
					whiteSpace="nowrap"
					overflow="hidden"
				>
					{projectName}
				</Typography>

				{highlight ? (
					<Icon
						name="material-check-circle-rounded"
						size={activeProjectIconSize}
						htmlColor={COMAPEO_BLUE}
					/>
				) : null}
			</Stack>

			<Stack direction="row" alignItems="center" gap={2}>
				<Icon
					name={
						role === 'coordinator'
							? 'material-manage-accounts-filled'
							: 'material-people-filled'
					}
					size={roleIconSize}
				/>

				<Typography
					textOverflow="ellipsis"
					whiteSpace="nowrap"
					overflow="hidden"
				>
					{t(
						role === 'coordinator'
							? m.projectCardRoleCoordinator
							: m.projectCardRoleParticipant,
					)}
				</Typography>
			</Stack>
		</Stack>
	)
}

function ProjectCardContentListVariant({
	highlight,
	projectName,
	role,
}: {
	highlight?: boolean
	projectName: string
	role: 'coordinator' | 'participant'
}) {
	const { formatMessage: t } = useIntl()

	const iconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'h1',
	})

	return (
		<Stack
			direction="row"
			gap={2}
			flex={1}
			justifyContent="space-between"
			alignItems="center"
			paddingInline={6}
			paddingBlock={4}
			overflow="auto"
		>
			<Stack direction="row" gap={2} flex={1} overflow="auto">
				<Icon
					name={
						role === 'coordinator'
							? 'material-manage-accounts-filled'
							: 'material-people-filled'
					}
					size={iconSize}
				/>

				<Box overflow="auto">
					<Typography
						component="p"
						variant="h1"
						color="textPrimary"
						fontWeight={500}
						textOverflow="ellipsis"
						whiteSpace="nowrap"
						overflow="hidden"
					>
						{projectName}
					</Typography>
				</Box>

				{highlight ? (
					<Icon
						name="material-check-circle-rounded"
						size={iconSize}
						htmlColor={COMAPEO_BLUE}
					/>
				) : null}
			</Stack>

			<Box>
				<Typography>
					{t(
						role === 'coordinator'
							? m.projectCardRoleCoordinator
							: m.projectCardRoleParticipant,
					)}
				</Typography>
			</Box>
		</Stack>
	)
}

const m = defineMessages({
	postOnboardingPageTitle: {
		id: 'routes.app.index.postOnboardingPageTitle',
		defaultMessage: '{name} is ready!',
		description: 'Title of home page after completing onboarding.',
	},
	pageTitle: {
		id: 'routes.app.index.pageTitle',
		defaultMessage: "{name}'s Projects",
		description: 'Title of home page.',
	},
	joinProjectCardTitle: {
		id: 'routes.app.index.joinProjectCardTitle',
		defaultMessage: 'Join a Project',
		description: 'Title card for joining a project.',
	},
	startProjectCardTitle: {
		id: 'routes.app.index.startProjectCardTitle',
		defaultMessage: 'Start New Project',
		description: 'Title card for starting a new project.',
	},
	additionalProjectsSectionTitle: {
		id: 'routes.app.index.additionalProjectsSecitionTitle',
		defaultMessage: 'Additional Projects',
		description: 'Title text for the additional projects section.',
	},
	additionalProjectsSectionDescription: {
		id: 'routes.app.index.additionalProjectsSectionDescription',
		defaultMessage: 'Ordered by most recently created',
		description:
			'Text describing sorting order of the additional projects section.',
	},
	additionalProjectsSectionShowAsGrid: {
		id: 'routes.app.index.additionalProjectsSectionShowAsGrid',
		defaultMessage: 'Show as grid',
		description:
			'Tooltip text for button to display additional projects section as a grid.',
	},
	additionalProjectsSectionShowAsList: {
		id: 'routes.app.index.additionalProjectsSectionShowAsList',
		defaultMessage: 'Show as list',
		description:
			'Tooltip text for button to display additional projects section as a list.',
	},
	unnamedProject: {
		id: 'routes.app.index.unnamedProject',
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
		id: 'routes.app.index.projectCardRoleCoordinator',
		defaultMessage: 'Coordinator',
		description: 'Displayed name of coordinator role on project card.',
	},
	projectCardRoleParticipant: {
		id: 'routes.app.index.projectCardRoleParticipant',
		defaultMessage: 'Participant',
		description: 'Displayed name of participant role on project card.',
	},
})
