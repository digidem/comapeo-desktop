import {
	Suspense,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	type FocusEvent,
	type MouseEvent,
} from 'react'
import {
	useDocumentCreatedBy,
	useIconUrl,
	useManyDocs,
	useOwnDeviceInfo,
	useOwnRoleInProject,
	useProjectSettings,
} from '@comapeo/core-react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'

import {
	BLACK,
	BLUE_GREY,
	COMAPEO_BLUE,
	DARK_GREY,
	LIGHT_COMAPEO_BLUE,
	LIGHT_GREY,
	WHITE,
} from '../../../../colors'
import { Icon } from '../../../../components/icon'
import { ButtonLink, TextLink } from '../../../../components/link'
import {
	COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
	COORDINATOR_ROLE_ID,
	CREATOR_ROLE_ID,
	getMatchingPresetForObservation,
	getMatchingPresetForTrack,
} from '../../../../lib/comapeo'
import { getLocaleStateQueryOptions } from '../../../../lib/queries/app-settings'

export const Route = createFileRoute('/app/projects/$projectId/')({
	loader: async ({ context, params }) => {
		const {
			clientApi,
			projectApi,
			queryClient,
			localeState: { value: lang },
		} = context
		const { projectId } = params

		await Promise.all([
			// TODO: Not ideal but requires changes in @comapeo/core-react
			queryClient.ensureQueryData({
				queryKey: [COMAPEO_CORE_REACT_ROOT_QUERY_KEY, 'client', 'device_info'],
				queryFn: async () => {
					return clientApi.getDeviceInfo()
				},
			}),
			// TODO: Not ideal but requires changes in @comapeo/core-react
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
			// TODO: Not ideal but requires changes in @comapeo/core-react
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
			// TODO: Not ideal but requires changes in @comapeo/core-react
			queryClient.ensureQueryData({
				queryKey: [
					COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
					'projects',
					projectId,
					'observations',
					{ lang },
				],
				queryFn: async () => {
					return projectApi.observation.getMany({ lang })
				},
			}),
			// TODO: Not ideal but requires changes in @comapeo/core-react
			queryClient.ensureQueryData({
				queryKey: [
					COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
					'projects',
					projectId,
					'tracks',
					{ lang },
				],
				queryFn: async () => {
					return projectApi.track.getMany({ lang })
				},
			}),
			// TODO: Not ideal but requires changes in @comapeo/core-react
			queryClient.ensureQueryData({
				queryKey: [
					COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
					'projects',
					projectId,
					'presets',
					{ lang },
				],
				queryFn: async () => {
					return projectApi.preset.getMany({ lang })
				},
			}),
		])
	},
	pendingComponent: () => {
		return (
			<Box
				display="flex"
				flexDirection="column"
				flex={1}
				justifyContent="center"
				alignItems="center"
			>
				<CircularProgress />
			</Box>
		)
	},
	component: RouteComponent,
})

const BOX_SHADOW = `0px 1px 5px 0px ${alpha(BLACK, 0.25)}`

function RouteComponent() {
	const { formatMessage: t } = useIntl()

	const { projectId } = Route.useParams()

	const { data: projectSettings } = useProjectSettings({ projectId })
	const { data: role } = useOwnRoleInProject({ projectId })

	const isAtLeastCoordinator =
		role.roleId === CREATOR_ROLE_ID || role.roleId === COORDINATOR_ROLE_ID

	return (
		<Stack direction="column" flex={1} overflow="auto">
			<Box padding={6}>
				<Stack
					direction="column"
					useFlexGap
					gap={5}
					borderRadius={2}
					padding={6}
					boxShadow={BOX_SHADOW}
					bgcolor={projectSettings.projectColor}
					border={`2px solid ${LIGHT_GREY}`}
				>
					<Typography variant="h1" fontWeight={500}>
						{projectSettings.name || t(m.unnamedProject)}
					</Typography>

					<Stack direction="row" useFlexGap gap={3} alignItems="center">
						<Icon
							name={
								isAtLeastCoordinator
									? 'material-manage-accounts-filled'
									: 'material-people-filled'
							}
							htmlColor={DARK_GREY}
						/>
						<Typography fontWeight={400} sx={{ color: DARK_GREY }}>
							{t(
								isAtLeastCoordinator
									? m.youAreCoordinator
									: m.youAreParticipant,
							)}
						</Typography>
					</Stack>

					<Stack direction="row" useFlexGap gap={5} justifyContent="center">
						<ButtonLink
							fullWidth
							variant="outlined"
							size="large"
							to="/app/projects/$projectId/settings"
							params={{ projectId }}
							sx={{ maxWidth: 400 }}
						>
							{t(m.view)}
						</ButtonLink>

						<ButtonLink
							fullWidth
							variant="contained"
							size="large"
							to="/app/projects/$projectId/settings"
							params={{ projectId }}
							disabled={!isAtLeastCoordinator}
							startIcon={<Icon name="material-person-add" />}
							sx={{
								maxWidth: 400,
								visibility: isAtLeastCoordinator ? undefined : 'hidden',
							}}
						>
							{t(m.invite)}
						</ButtonLink>
					</Stack>
				</Stack>
			</Box>

			<Divider sx={{ bgcolor: LIGHT_GREY }} />

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
					<ListedDataSection projectId={projectId} />
				</Suspense>
			</Box>
		</Stack>
	)
}

function ListedDataSection({ projectId }: { projectId: string }) {
	const { formatMessage: t, formatDate } = useIntl()

	const { highlightedDocument } = Route.useSearch()
	const navigate = Route.useNavigate()

	const { data: lang } = useSuspenseQuery({
		...getLocaleStateQueryOptions(),
		select: ({ value }) => value,
	})

	const { data: observations } = useManyDocs({
		projectId,
		docType: 'observation',
		lang,
	})

	const { data: tracks } = useManyDocs({
		projectId,
		docType: 'track',
		lang,
	})

	const { data: presets } = useManyDocs({
		projectId,
		docType: 'preset',
		lang,
	})

	const observationsWithPreset = useMemo(() => {
		return observations.map((o) => ({
			type: 'observation' as const,
			value: o,
			preset: getMatchingPresetForObservation(o.tags, presets),
		}))
	}, [observations, presets])

	const tracksWithPreset = useMemo(() => {
		return tracks.map((t) => ({
			type: 'track' as const,
			value: t,
			preset: getMatchingPresetForTrack(t, presets),
		}))
	}, [tracks, presets])

	const sortedListData = useMemo(() => {
		return [...observationsWithPreset, ...tracksWithPreset].sort((a, b) => {
			return a.value.createdAt < b.value.createdAt ? 1 : -1
		})
	}, [observationsWithPreset, tracksWithPreset])

	const listRef = useRef<HTMLUListElement | null>(null)

	const onFocus = useCallback(
		(event: FocusEvent<HTMLUListElement>) => {
			const el = event.target.closest('[data-docid]')

			if (!(el instanceof HTMLElement)) {
				return
			}

			const dataType = el.getAttribute('data-datatype')
			const docId = el.getAttribute('data-docid')

			if (!(dataType && docId)) {
				return
			}

			if (!(dataType === 'observation' || dataType === 'track')) {
				return
			}

			if (highlightedDocument && docId === highlightedDocument.docId) {
				return
			}

			navigate({
				search: {
					highlightedDocument: {
						type: dataType,
						docId,
					},
				},
			})
		},
		[navigate, highlightedDocument],
	)

	const onMouseMove = useCallback((event: MouseEvent<HTMLUListElement>) => {
		const el = (event.target as HTMLElement).closest('[data-docid]')

		if (!(el instanceof HTMLElement)) {
			return
		}

		// NOTE: We defer to the onFocus callback in order to determine the navigation changes.
		el.focus()
	}, [])

	return sortedListData.length > 0 ? (
		<List
			component="ul"
			ref={listRef}
			disablePadding
			onFocus={onFocus}
			onMouseMove={onMouseMove}
			sx={{ overflow: 'auto', scrollbarColor: 'initial', position: 'relative' }}
		>
			{sortedListData.map(({ type, value, preset }) => (
				<ListItemButton
					key={value.docId}
					data-datatype={type}
					data-docid={value.docId}
					disableGutters
					disableTouchRipple
					selected={highlightedDocument?.docId === value.docId}
					onClick={() => {
						if (type === 'observation') {
							navigate({
								to: './observations/$observationDocId',
								params: { observationDocId: value.docId },
							})
						} else {
							navigate({
								to: './tracks/$trackDocId',
								params: { trackDocId: value.docId },
							})
						}
					}}
					sx={{ outline: `1px solid ${LIGHT_GREY}`, padding: 4 }}
				>
					<Suspense>
						<SyncedIndicatorLine
							projectId={projectId}
							originalVersionId={value.originalVersionId}
						/>
					</Suspense>
					<Stack direction="row" flex={1} useFlexGap gap={2} overflow="auto">
						<Stack
							direction="column"
							flex={1}
							justifyContent="center"
							overflow="hidden"
						>
							<Typography
								fontWeight={500}
								textOverflow="ellipsis"
								whiteSpace="nowrap"
								overflow="hidden"
							>
								{preset?.name ||
									t(
										type === 'observation'
											? m.observationPresetNameFallback
											: m.trackPresetNameFallback,
									)}
							</Typography>

							<Typography
								textOverflow="ellipsis"
								whiteSpace="nowrap"
								overflow="hidden"
							>
								{formatDate(value.createdAt, {
									year: 'numeric',
									month: 'short',
									day: '2-digit',
									minute: '2-digit',
									hour: '2-digit',
									hourCycle: 'h12',
								})}
							</Typography>
						</Stack>

						<Box display="flex" justifyContent="center" alignItems="center">
							{preset?.iconRef?.docId ? (
								<Suspense
									fallback={
										<Box
											display="flex"
											justifyContent="center"
											alignItems="center"
											height={48}
											width={48}
										>
											<CircularProgress disableShrink size={30} />
										</Box>
									}
								>
									<DisplayedPresetAndAttachments
										projectId={projectId}
										presetName={preset.name}
										borderColor={preset.color || BLUE_GREY}
										iconDocumentId={preset.iconRef.docId}
									/>
								</Suspense>
							) : (
								<Icon name="material-place" />
							)}
						</Box>
					</Stack>
				</ListItemButton>
			))}
		</List>
	) : (
		<AddObservationsCard projectId={projectId} />
	)
}

function SyncedIndicatorLine({
	projectId,
	originalVersionId,
}: {
	projectId: string
	originalVersionId: string
}) {
	const { data: ownDeviceInfo } = useOwnDeviceInfo()

	const { data: createdBy } = useDocumentCreatedBy({
		projectId,
		originalVersionId,
	})

	return ownDeviceInfo.deviceId !== createdBy ? (
		<Box
			position="absolute"
			width={8}
			left={0}
			bottom={0}
			top={0}
			bgcolor={COMAPEO_BLUE}
		/>
	) : null
}

// TODO: Display attachments
function DisplayedPresetAndAttachments({
	borderColor,
	presetName,
	projectId,
	iconDocumentId,
}: {
	borderColor: string
	presetName: string
	projectId: string
	iconDocumentId: string
}) {
	const { formatMessage: t } = useIntl()

	const { data: iconURL } = useIconUrl({
		projectId,
		iconId: iconDocumentId,
		mimeType: 'image/png',
		size: 'small',
		pixelDensity: 3,
	})

	return (
		<Box
			display="flex"
			alignItems="center"
			justifyContent="center"
			padding={2}
			overflow="hidden"
			borderRadius="50%"
			border={`3px solid ${borderColor}`}
		>
			<img
				src={iconURL}
				alt={t(m.presetIconAlt, { name: presetName })}
				style={{ aspectRatio: 1, maxHeight: 48 }}
			/>
		</Box>
	)
}

function AddObservationsCard({ projectId }: { projectId: string }) {
	const { formatMessage: t } = useIntl()

	return (
		<Box display="flex" flex={1} padding={6}>
			<Stack
				direction="column"
				useFlexGap
				gap={4}
				alignItems="center"
				borderRadius={2}
				border={`1px solid ${BLUE_GREY}`}
				paddingX={6}
				paddingY={10}
				justifyContent="center"
				flex={1}
			>
				<Box
					borderRadius="100%"
					bgcolor={LIGHT_COMAPEO_BLUE}
					display="flex"
					justifyContent="center"
					alignItems="center"
					padding={6}
				>
					<Icon name="comapeo-cards" htmlColor={WHITE} size={40} />
				</Box>

				<Typography variant="h1" textAlign="center" fontWeight={500}>
					{t(m.addObservationsTitle)}
				</Typography>

				<Typography textAlign="center" fontWeight={400}>
					{t(m.addObservationsDescription)}
				</Typography>

				<TextLink
					underline="none"
					to="/app/projects/$projectId/exchange"
					params={{ projectId }}
				>
					{t(m.goToExchange)}
				</TextLink>
			</Stack>
		</Box>
	)
}

const m = defineMessages({
	unnamedProject: {
		id: 'routes.app.projects.$projectId.index.unnamedProject',
		defaultMessage: 'Unnamed Project',
		description: 'Fallback for when current project is missing a name.',
	},
	youAreCoordinator: {
		id: 'routes.app.projects.$projectId.index.youAreCoordinator',
		defaultMessage: "You're a coordinator on this project.",
		description: 'Indicates that user is a coordinator on the current project.',
	},
	youAreParticipant: {
		id: 'routes.app.projects.$projectId.index.youAreParticipant',
		defaultMessage: "You're a participant on this project.",
		description: 'Indicates that user is a participant on the current project.',
	},
	view: {
		id: 'routes.app.projects.$projectId.index.view',
		defaultMessage: 'View',
		description: 'Link text to navigate to project settings page.',
	},
	invite: {
		id: 'routes.app.projects.$projectId.index.invite',
		defaultMessage: 'Invite',
		description: 'Link text to navigate to invite collaborators page.',
	},
	addObservationsTitle: {
		id: 'routes.app.projects.$projectId.index.addObservationsTitle',
		defaultMessage: 'Add Observations',
		description:
			'Title of card that is displayed when project has no observations to display.',
	},
	addObservationsDescription: {
		id: 'routes.app.projects.$projectId.index.addObservationsDescription',
		defaultMessage: 'Use Exchange to add Collaborator Observations',
		description:
			'Description of card that is displayed when project has no observations to display.',
	},
	goToExchange: {
		id: 'routes.app.projects.$projectId.index.goToExchange',
		defaultMessage: 'Go to Exchange',
		description: 'Link text to navigate to Exchange page.',
	},
	observationPresetNameFallback: {
		id: 'routes.app.projects.$projectId.index.observationPresetNameFallback',
		defaultMessage: 'Observation',
		description: 'Fallback name for observation without a matching category.',
	},
	trackPresetNameFallback: {
		id: 'routes.app.projects.$projectId.index.trackPresetNameFallback',
		defaultMessage: 'Track',
		description: 'Fallback name for track without a matching category.',
	},
	presetIconAlt: {
		id: 'routes.app.projects.$projectId.index.presetIconAlt',
		defaultMessage: 'Icon for preset {name}',
		description:
			'Alt text for icon image displayed for preset (used for accessibility tools).',
	},
})
