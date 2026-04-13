import { Suspense, useId, useState, type MouseEventHandler } from 'react'
import { useOwnRoleInProject, useProjectSettings } from '@comapeo/core-react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import Fade from '@mui/material/Fade'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Popper from '@mui/material/Popper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { darken, type SxProps, type Theme } from '@mui/material/styles'
import { useMatch, useRouter } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import { LIGHT_GREY, WHITE } from '../../colors.ts'
import { Icon } from '../../components/icon.tsx'
import { useIconSizeBasedOnTypography } from '../../hooks/icon.ts'
import { COORDINATOR_ROLE_ID, CREATOR_ROLE_ID } from '../../lib/comapeo.ts'

export function ProjectTabButton({ projectId }: { projectId: string }) {
	const router = useRouter()

	const projectRouteMatch = useMatch({
		from: '/app/projects/$projectId',
		shouldThrow: false,
	})

	const [anchorElement, setAnchorElement] = useState<null | HTMLElement>(null)

	return (
		<ClickAwayListener
			onClickAway={() => {
				setAnchorElement(null)
			}}
		>
			<Box
				onKeyDown={(event) => {
					if (event.key === 'Tab' || event.key === 'Escape') {
						setAnchorElement(null)
					}
				}}
				sx={{ display: 'flex' }}
			>
				<Suspense
					fallback={
						<Box
							sx={{
								...BASE_TAB_CONTAINER_SX_PROPS,
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'center',
								backgroundColor: LIGHT_GREY,
							}}
						>
							<CircularProgress disableShrink size={16} />
						</Box>
					}
				>
					<ButtonTabContent
						anchorElement={anchorElement}
						isOnProjectPage={!!projectRouteMatch}
						onClick={(event) => {
							if (projectRouteMatch) {
								setAnchorElement((prev) => (prev ? null : event.currentTarget))
							} else {
								router.navigate({
									to: '/app/projects/$projectId',
									params: { projectId },
								})
							}
						}}
						projectId={projectId}
					/>
				</Suspense>
			</Box>
		</ClickAwayListener>
	)
}

function ButtonTabContent({
	anchorElement,
	isOnProjectPage,
	onClick,
	projectId,
}: {
	anchorElement: HTMLElement | null
	isOnProjectPage: boolean
	onClick: MouseEventHandler<HTMLButtonElement>
	projectId: string
}) {
	const popupDescribedById = useId()

	const { formatMessage: t, formatDate } = useIntl()

	const { data: projectSettings } = useProjectSettings({ projectId })
	const { data: role } = useOwnRoleInProject({ projectId })

	const iconSize = useIconSizeBasedOnTypography({ typographyVariant: 'body1' })

	const isAtLeastCoordinator =
		role.roleId === CREATOR_ROLE_ID || role.roleId === COORDINATOR_ROLE_ID

	const displayedProjectName = projectSettings.name || t(m.unnamedProject)
	const accentColor = projectSettings.projectColor || WHITE

	return (
		<>
			<Button
				aria-label={t(
					isOnProjectPage
						? m.accessibleLabelShowProjectInfo
						: m.accessibleLabelGoTo,
					{ name: displayedProjectName },
				)}
				aria-describedby={isOnProjectPage ? popupDescribedById : undefined}
				aria-haspopup={isOnProjectPage ? 'dialog' : undefined}
				variant="text"
				size="small"
				onClick={onClick}
				sx={{
					...BASE_TAB_CONTAINER_SX_PROPS,
					backgroundColor: accentColor,
					'&:focus-within': {
						outline: (theme) => `2px solid ${theme.palette.primary.main}`,
					},
					'&:hover': { backgroundColor: darken(accentColor, 0.1) },
				}}
			>
				<Typography
					variant="inherit"
					color="textPrimary"
					sx={{
						textOverflow: 'ellipsis',
						whiteSpace: 'nowrap',
						overflow: 'hidden',
					}}
				>
					{displayedProjectName}
				</Typography>
			</Button>

			<Popper
				id={popupDescribedById}
				role="dialog"
				placement="right-start"
				transition
				sx={{ width: `clamp(250px, 25%, 350px)`, zIndex: 1 }}
				modifiers={[
					{ name: 'offset', options: { offset: [0, 2] } },
					{ name: 'eventListeners', enabled: true },
				]}
				anchorEl={anchorElement}
				open={!!anchorElement}
			>
				{({ TransitionProps }) => {
					return (
						<Fade {...TransitionProps}>
							<Box
								sx={{
									bgcolor: accentColor,
									boxShadow: (theme) => theme.shadows[5],
									borderRadius: 2,
									padding: 6,
								}}
							>
								<Stack direction="column" sx={{ gap: 4 }}>
									<Typography
										variant="h1"
										sx={{ fontWeight: 500, overflowWrap: 'break-word' }}
									>
										{displayedProjectName}
									</Typography>

									{projectSettings.projectDescription ? (
										<Typography sx={{ overflowWrap: 'break-word' }}>
											{projectSettings.projectDescription}
										</Typography>
									) : null}

									<Stack component={List} disablePadding sx={{ gap: 4 }}>
										<Stack
											component={ListItem}
											disableGutters
											disablePadding
											direction="row"
											sx={{ gap: 4, alignItems: 'flex-start' }}
										>
											{isAtLeastCoordinator ? (
												<>
													<Icon
														name="material-manage-accounts-filled"
														size={iconSize}
													/>

													<Typography sx={{ fontWeight: 500 }}>
														{t(m.projectInfoRoleCoordinator)}
													</Typography>
												</>
											) : (
												<>
													<Icon name="material-people-filled" />

													<Typography sx={{ fontWeight: 500 }}>
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
											sx={{ gap: 4, alignItems: 'flex-start' }}
										>
											<Icon name="material-symbols-apps" size={iconSize} />

											{projectSettings.configMetadata ? (
												<Box>
													<Typography color="textSecondary">
														<Typography
															component="span"
															variant="inherit"
															color="textPrimary"
															sx={{ fontWeight: 500 }}
														>
															{projectSettings.configMetadata.name}
														</Typography>
														{
															// eslint-disable-next-line formatjs/no-literal-string-in-jsx
															' '
														}
														{projectSettings.configMetadata.fileVersion}
													</Typography>

													<Typography color="textSecondary">
														{t(m.projectInfoCategoriesCreated, {
															date: (
																<time
																	key={`${projectSettings.configMetadata.name}@${projectSettings.configMetadata.fileVersion}`}
																	dateTime={
																		projectSettings.configMetadata.buildDate
																	}
																>
																	{formatDate(
																		projectSettings.configMetadata.buildDate,
																		{
																			year: 'numeric',
																			month: 'long',
																			day: 'numeric',
																		},
																	)}
																</time>
															),
														})}
													</Typography>
												</Box>
											) : (
												<Typography sx={{ fontWeight: 500 }}>
													{t(m.fallbackCategoriesSetName)}
												</Typography>
											)}
										</Stack>
									</Stack>
								</Stack>
							</Box>
						</Fade>
					)
				}}
			</Popper>
		</>
	)
}

const BASE_TAB_CONTAINER_SX_PROPS = {
	minWidth: 80,
	maxWidth: 200,
	borderRadius: 2,
} satisfies SxProps<Theme>

const m = defineMessages({
	unnamedProject: {
		id: 'routes.app.route.unnamedProject',
		defaultMessage: 'Unnamed Project',
		description: 'Fallback for when project is missing a name.',
	},
	accessibleLabelGoTo: {
		id: 'routes.app.route.accessibleLabelGoTo',
		defaultMessage: 'Go to project {name}.',
		description:
			'Accessible label for button that navigates to project when clicked.',
	},
	accessibleLabelShowProjectInfo: {
		id: 'routes.app.route.accessibleLabelShowProjectInfo',
		defaultMessage: 'Show info for project {name}.',
		description:
			'Accessible label for button that shows project info when clicked.',
	},
	fallbackCategoriesSetName: {
		id: 'routes.app.route.fallbackCategoriesSetName',
		defaultMessage: 'CoMapeo Categories',
		description: 'Text shown when project does not use a categories set.',
	},
	projectInfoRoleCoordinator: {
		id: 'routes.app.route.projectInfoRoleCoordinator',
		defaultMessage: 'Coordinator',
		description: 'Indicates that user is a coordinator.',
	},
	projectInfoRoleParticipant: {
		id: 'routes.app.route.projectInfoRoleParticipant',
		defaultMessage: 'Participant',
		description: 'Indicates that user is a participant.',
	},
	projectInfoCategoriesCreated: {
		id: 'routes.app.route.projectInfoCategoriesCreated',
		defaultMessage: 'Created {date}',
		description: 'Text indicating creation date of categories set.',
	},
})
