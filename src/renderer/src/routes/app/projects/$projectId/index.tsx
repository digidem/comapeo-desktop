import { Suspense, useState } from 'react'
import { useOwnRoleInProject, useProjectSettings } from '@comapeo/core-react'
import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import CircularProgress from '@mui/material/CircularProgress'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import Fade from '@mui/material/Fade'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Popper from '@mui/material/Popper'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { createFileRoute } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { BLUE_GREY, WHITE } from '../../../../colors'
import { Icon } from '../../../../components/icon'
import { useIconSizeBasedOnTypography } from '../../../../hooks/icon.ts'
import {
	COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
	COORDINATOR_ROLE_ID,
	CREATOR_ROLE_ID,
} from '../../../../lib/comapeo'
import { DisplayedDataList } from './-displayed-data/list'

export const Route = createFileRoute('/app/projects/$projectId/')({
	loader: async ({ context, params }) => {
		const { projectApi, queryClient } = context
		const { projectId } = params

		await Promise.all([
			queryClient.ensureQueryData({
				queryKey: [
					COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
					'projects',
					projectId,
					'project_settings',
				],
				queryFn: async () => {
					return projectApi.$getProjectSettings()
				},
			}),
			queryClient.ensureQueryData({
				queryKey: [
					COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
					'projects',
					projectId,
					'role',
				],
				queryFn: async () => {
					return projectApi.$getOwnRole()
				},
			}),
		])
	},
	component: RouteComponent,
})

function RouteComponent() {
	const { projectId } = Route.useParams()

	return (
		<Stack direction="column" flex={1} overflow="auto">
			<Box padding={6}>
				<ProjectInfoSection projectId={projectId} />
			</Box>

			<Box overflow="auto" display="flex" flexDirection="column" flex={1}>
				<Suspense
					fallback={
						<Box
							display="flex"
							flex={1}
							justifyContent="center"
							alignItems="center"
						>
							<CircularProgress />
						</Box>
					}
				>
					<DisplayedDataList projectId={projectId} />
				</Suspense>
			</Box>
		</Stack>
	)
}

function ProjectInfoSection({ projectId }: { projectId: string }) {
	const { formatMessage: t, formatDate } = useIntl()

	const { data: projectSettings } = useProjectSettings({ projectId })
	const { data: role } = useOwnRoleInProject({ projectId })

	const isAtLeastCoordinator =
		role.roleId === CREATOR_ROLE_ID || role.roleId === COORDINATOR_ROLE_ID

	const displayedName = projectSettings.name || t(m.unnamedProject)
	const displayedColor = projectSettings.projectColor || WHITE

	const [infoToShow, setInfoToShow] = useState<
		| { type: 'tooltip'; show: boolean }
		| { type: 'popper'; anchor: HTMLButtonElement }
	>({ type: 'tooltip', show: false })

	const iconSize = useIconSizeBasedOnTypography({ typographyVariant: 'body1' })

	return (
		<ClickAwayListener
			onClickAway={() => {
				setInfoToShow({ type: 'tooltip', show: false })
			}}
		>
			<Box display="flex">
				<Tooltip
					title={t(m.projectInfoTooltip)}
					slots={{ transition: Fade }}
					placement="right"
					open={infoToShow.type === 'tooltip' && infoToShow.show}
					onOpen={
						infoToShow.type === 'tooltip'
							? () => {
									setInfoToShow({ type: 'tooltip', show: true })
								}
							: undefined
					}
					onClose={
						infoToShow.type === 'tooltip'
							? () => {
									setInfoToShow({ type: 'tooltip', show: false })
								}
							: undefined
					}
					slotProps={{
						tooltip: {
							sx: (theme) => ({
								backgroundColor: theme.palette.common.white,
								color: theme.palette.text.primary,
								boxShadow: theme.shadows[5],
							}),
						},
					}}
				>
					<Box component="span">
						<ButtonBase
							aria-describedby="project-info-panel"
							aria-haspopup="dialog"
							onClick={(event) => {
								setInfoToShow((prev) =>
									prev.type === 'popper'
										? { type: 'tooltip', show: true }
										: { type: 'popper', anchor: event.currentTarget },
								)
							}}
							sx={{
								minWidth: 100,
								maxWidth: 400,
								paddingInline: 4,
								paddingBlock: 2,
								borderRadius: 2,
								border: (theme) =>
									`1px solid ${infoToShow.type === 'popper' ? theme.palette.primary.main : BLUE_GREY}`,
								background: displayedColor,
								'&:focus-within': {
									borderColor: (theme) => theme.palette.primary.main,
									outline: (theme) => `1px solid ${theme.palette.primary.main}`,
								},
							}}
						>
							<Typography variant="button">{displayedName}</Typography>
						</ButtonBase>
					</Box>
				</Tooltip>

				<Popper
					id="project-info-panel"
					role="dialog"
					placement="right-start"
					transition
					sx={{ maxWidth: 300, zIndex: 1 }}
					modifiers={[{ name: 'offset', options: { offset: [0, 8] } }]}
					{...(infoToShow.type === 'popper'
						? { open: true, anchorEl: infoToShow.anchor }
						: { open: false })}
				>
					{({ TransitionProps }) => {
						return (
							<Fade {...TransitionProps}>
								<Box
									bgcolor={displayedColor}
									boxShadow={(theme) => theme.shadows[5]}
									borderRadius={2}
									padding={6}
								>
									<Stack direction="column" gap={4}>
										<Typography variant="h1" fontWeight={500}>
											{displayedName}
										</Typography>

										{projectSettings.projectDescription ? (
											<Typography>
												{projectSettings.projectDescription}
											</Typography>
										) : null}

										<Stack component={List} disablePadding gap={4}>
											<Stack
												component={ListItem}
												disableGutters
												disablePadding
												direction="row"
												gap={4}
												alignItems="flex-start"
											>
												{isAtLeastCoordinator ? (
													<>
														<Icon
															name="material-manage-accounts-filled"
															size={iconSize}
														/>

														<Typography fontWeight={500}>
															{t(m.projectInfoRoleCoordinator)}
														</Typography>
													</>
												) : (
													<>
														<Icon name="material-people-filled" />

														<Typography fontWeight={500}>
															{t(m.projectInfoRoleParticipant)}
														</Typography>
													</>
												)}
											</Stack>

											<Stack
												component={ListItem}
												disableGutters
												disablePadding
												direction="row"
												gap={4}
												alignItems="flex-start"
											>
												<Icon name="material-symbols-apps" size={iconSize} />

												{projectSettings.configMetadata ? (
													<Typography color="textSecondary">
														<Box component="span">
															<Typography
																component="span"
																variant="inherit"
																color="textPrimary"
																fontWeight={500}
															>
																{projectSettings.configMetadata.name}
															</Typography>{' '}
															{projectSettings.configMetadata.fileVersion}
														</Box>

														<br />

														<Box component="span">
															{t(m.projectInfoCategoriesCreated, {
																value: formatDate(
																	projectSettings.configMetadata.buildDate,
																	{
																		year: 'numeric',
																		month: 'long',
																		day: 'numeric',
																	},
																),
															})}
														</Box>
													</Typography>
												) : (
													<Typography fontWeight={500}>
														{t(m.fallbackCategoriesSetName)}
													</Typography>
												)}
											</Stack>

											<Stack
												component={ListItem}
												disableGutters
												disablePadding
												direction="row"
												gap={4}
												alignItems="flex-start"
											>
												<Icon
													name="ant-design-icons-bar-chart-outlined"
													size={iconSize}
												/>

												<Typography fontWeight={500}>
													{t(m.projectInfoProjectStats, {
														enabled: projectSettings.sendStats ? 1 : 0,
													})}
												</Typography>
											</Stack>
										</Stack>
									</Stack>
								</Box>
							</Fade>
						)
					}}
				</Popper>
			</Box>
		</ClickAwayListener>
	)
}

const m = defineMessages({
	projectInfoTooltip: {
		id: 'routes.app.projects.$projectId.index.projectInfoTooltip',
		defaultMessage: 'View Project Info',
		description:
			'Text for tooltip shown when hovering or focusing project info button.',
	},
	unnamedProject: {
		id: 'routes.app.projects.$projectId.index.unnamedProject',
		defaultMessage: 'Unnamed Project',
		description: 'Fallback for when project is missing a name.',
	},
	fallbackCategoriesSetName: {
		id: 'routes.app.projects.$projectId.index.fallbackCategoriesSetName',
		defaultMessage: 'CoMapeo Categories',
		description: 'Text shown when project does not use a categories set.',
	},
	projectInfoRoleCoordinator: {
		id: 'routes.app.projects.$projectId.index.projectInfoRoleCoordinator',
		defaultMessage: 'Coordinator',
		description: 'Indicates that user is a coordinator.',
	},
	projectInfoRoleParticipant: {
		id: 'routes.app.projects.$projectId.index.projectInfoRoleParticipant',
		defaultMessage: 'Participant',
		description: 'Indicates that user is a participant.',
	},
	projectInfoCategoriesCreated: {
		id: 'routes.app.projects.$projectId.index.projectInfoCategoriesCreated',
		defaultMessage: 'Created {value}',
		description: 'Text indicating creation date of categories set.',
	},
	projectInfoProjectStats: {
		id: 'routes.app.projects.$projectId.index.projectInfoProjectStats',
		defaultMessage: 'Project Sharing | {enabled, select, 1 {ON} other {OFF}}',
		description: 'Text indicating if project stats sharing is enabled or not.',
	},
})
