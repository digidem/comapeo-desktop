import {
	Suspense,
	useCallback,
	useEffect,
	useEffectEvent,
	useMemo,
	useRef,
	type CSSProperties,
	type ReactNode,
	type RefObject,
} from 'react'
import {
	useManyDocs,
	useManyMembers,
	useOwnDeviceInfo,
	useOwnRoleInProject,
} from '@comapeo/core-react'
import type { Observation, Preset, Track } from '@comapeo/schema'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { captureException, captureMessage } from '@sentry/react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useVirtualizer } from '@tanstack/react-virtual'
import { defineMessages, useIntl } from 'react-intl'

import type { HighlightedDocument } from '../-shared.ts'
import {
	BLACK,
	BLUE_GREY,
	COMAPEO_BLUE,
	DARKER_ORANGE,
	LIGHT_GREY,
	WHITE,
} from '../../../../../colors'
import {
	CategoryIconContainer,
	CategoryIconImage,
} from '../../../../../components/category-icon'
import { ErrorBoundary } from '../../../../../components/error-boundary'
import { Icon } from '../../../../../components/icon'
import { ButtonLink } from '../../../../../components/link'
import {
	COORDINATOR_ROLE_ID,
	CREATOR_ROLE_ID,
	MEMBER_ROLE_ID,
	getMatchingCategoryForDocument,
	type Attachment,
} from '../../../../../lib/comapeo'
import { getLocaleStateQueryOptions } from '../../../../../lib/queries/app-settings'
import { PhotoAttachmentImage } from '../observations/$observationDocId/-components/photo-attachment-image.tsx'

const CATEGORY_CONTAINER_SIZE_PX = 64

// NOTE: Accounts for space added by top + bottom padding and bottom border
const APPROXIMATE_ITEM_HEIGHT_PX = CATEGORY_CONTAINER_SIZE_PX + 16 * 2 + 1

export function DisplayedDataList({ projectId }: { projectId: string }) {
	const { formatMessage: t } = useIntl()

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

	const { data: members } = useManyMembers({ projectId })

	const activeMembersCount = members.filter(
		(m) =>
			m.role.roleId === CREATOR_ROLE_ID ||
			m.role.roleId === MEMBER_ROLE_ID ||
			m.role.roleId === COORDINATOR_ROLE_ID,
	).length

	const { data: ownRole } = useOwnRoleInProject({ projectId })

	const selfIsAtLeastCoordinator =
		ownRole.roleId === CREATOR_ROLE_ID || ownRole.roleId === COORDINATOR_ROLE_ID

	const hasDataToShow = observations.length + tracks.length > 0

	if (selfIsAtLeastCoordinator && activeMembersCount < 2 && !hasDataToShow) {
		return (
			<IntroPanel
				title={t(m.inviteCollaboratorsPanelTitle)}
				description={t(m.inviteCollaboratorsPanelDescription)}
				icon={
					<Icon
						name="material-person-add"
						size={120}
						htmlColor={DARKER_ORANGE}
					/>
				}
				link={
					<ButtonLink
						to="/app/projects/$projectId/invite"
						params={{ projectId }}
						startIcon={<Icon name="material-person-add" />}
						sx={{ maxWidth: 400 }}
						variant="contained"
						fullWidth
					>
						{t(m.inviteCollaboratorsPanelInviteLink)}
					</ButtonLink>
				}
			/>
		)
	}

	if (!hasDataToShow) {
		return (
			<IntroPanel
				title={t(m.openExchangePanelTitle)}
				description={t(m.openExchangePanelDescription)}
				icon={
					<Icon
						name="material-offline-bolt-outlined"
						size={150}
						htmlColor={BLUE_GREY}
					/>
				}
				link={
					<ButtonLink
						to="/app/projects/$projectId/exchange"
						params={{ projectId }}
						startIcon={<Icon name="material-offline-bolt-outlined" />}
						sx={{ maxWidth: 400 }}
						variant="contained"
						fullWidth
					>
						{t(m.openExchangePanelLink)}
					</ButtonLink>
				}
			/>
		)
	}

	return <ListedData projectId={projectId} />
}

function IntroPanel({
	icon,
	title,
	description,
	link,
}: {
	icon: ReactNode
	title: string
	description: string
	link: ReactNode
}) {
	return (
		<Stack direction="column" flex={1} padding={6} gap={10}>
			<Stack
				direction="column"
				flex={1}
				gap={4}
				alignItems="center"
				justifyContent="center"
				padding={4}
			>
				<Box>{icon}</Box>

				<Typography variant="h1" fontWeight={500} textAlign="center">
					{title}
				</Typography>

				<Typography textAlign="center">{description}</Typography>
			</Stack>

			<Box display="flex" justifyContent="center" alignItems="center">
				{link}
			</Box>
		</Stack>
	)
}

function ListedData({ projectId }: { projectId: string }) {
	const { formatMessage: t, formatDate } = useIntl()

	const { data: lang } = useSuspenseQuery({
		...getLocaleStateQueryOptions(),
		select: ({ value }) => value,
	})

	const { highlightedDocument } = useSearch({
		from: '/app/projects/$projectId/',
	})

	const navigate = useNavigate({ from: '/app/projects/$projectId/' })

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

	const { data: categories } = useManyDocs({
		projectId,
		docType: 'preset',
		lang,
	})

	const observationsWithCategory = useMemo(() => {
		return observations.map((o) => ({
			type: 'observation' as const,
			document: o,
			category: getMatchingCategoryForDocument(o, categories),
		}))
	}, [observations, categories])

	const tracksWithCategory = useMemo(() => {
		return tracks.map((t) => ({
			type: 'track' as const,
			document: t,
			category: getMatchingCategoryForDocument(t, categories),
		}))
	}, [tracks, categories])

	const sortedListData = useMemo(() => {
		return [...observationsWithCategory, ...tracksWithCategory].sort((a, b) => {
			return a.document.createdAt < b.document.createdAt ? 1 : -1
		})
	}, [observationsWithCategory, tracksWithCategory])

	const listRef = useRef<HTMLUListElement | null>(null)
	const rowVirtualizer = useVirtual(listRef, sortedListData)
	const { scrollToIndex } = rowVirtualizer

	const scrollToHighlightedItem = useEffectEvent(
		(document: HighlightedDocument) => {
			const itemIndexToScrollTo = highlightedDocument?.docId
				? sortedListData.findIndex(
						(item) => item.document.docId === document.docId,
					)
				: undefined

			if (itemIndexToScrollTo) {
				scrollToIndex(itemIndexToScrollTo, { align: 'center' })
			}
		},
	)

	const mountedRef = useRef<boolean>(false)

	useEffect(
		/**
		 * Handles autoscrolling to selected item in list when initially loading the
		 * page.
		 */
		function onInitialRender() {
			if (mountedRef.current) {
				return
			}

			if (highlightedDocument) {
				scrollToHighlightedItem(highlightedDocument)
			}

			mountedRef.current = true
		},
		[highlightedDocument],
	)

	return (
		<Box overflow="auto" display="flex" flexDirection="column" flex={1}>
			<Box
				display="flex"
				flexDirection="row"
				justifyContent="center"
				padding={6}
				borderTop={`1px solid ${BLUE_GREY}`}
				borderBottom={`1px solid ${BLUE_GREY}`}
			>
				<ButtonLink
					fullWidth
					startIcon={<Icon name="material-file-download" />}
					variant="outlined"
					to="/app/projects/$projectId/download"
					params={{ projectId }}
				>
					{t(m.downloadObservations)}
				</ButtonLink>
			</Box>

			<Box overflow="auto" display="flex" flexDirection="column" flex={1}>
				<List
					component="ul"
					ref={listRef}
					disablePadding
					sx={{ overflow: 'auto', scrollbarColor: 'initial' }}
				>
					<Box
						position="relative"
						height={`${rowVirtualizer.getTotalSize()}px`}
						width="100%"
					>
						{rowVirtualizer.getVirtualItems().map((row) => {
							const { type, category, document } = sortedListData[row.index]!
							const { createdAt, docId, createdBy } = document

							const title =
								type === 'track'
									? t(m.trackItemTitle)
									: category?.name || t(m.observationCategoryNameFallback)

							const isHighlighted = docId === highlightedDocument?.docId

							return (
								<Box
									key={row.key}
									sx={{
										position: 'absolute',
										top: 0,
										left: 0,
										width: '100%',
										height: `${row.size}px`,
										transform: `translateY(${row.start}px)`,
									}}
								>
									<ListItemButton
										data-docid={docId}
										disableGutters
										disableTouchRipple
										selected={isHighlighted}
										autoFocus={isHighlighted}
										onClick={() => {
											if (!isHighlighted) {
												navigate({
													search: {
														highlightedDocument: { type, docId, from: 'list' },
													},
													replace: true,
												})

												return
											}

											if (type === 'observation') {
												navigate({
													to: './observations/$observationDocId',
													params: { observationDocId: docId },
												})
											} else {
												navigate({
													to: './tracks/$trackDocId',
													params: { trackDocId: docId },
												})
											}
										}}
										sx={{ borderBottom: `1px solid ${LIGHT_GREY}`, padding: 4 }}
									>
										<Suspense>
											<SyncedIndicatorLine createdByDeviceId={createdBy} />
										</Suspense>
										<Stack direction="row" flex={1} gap={2} overflow="auto">
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
													{title}
												</Typography>

												<Typography
													textOverflow="ellipsis"
													whiteSpace="nowrap"
													overflow="hidden"
												>
													{formatDate(createdAt, {
														year: 'numeric',
														month: 'short',
														day: '2-digit',
														minute: '2-digit',
														hour: '2-digit',
														hourCycle: 'h12',
													})}
												</Typography>
											</Stack>

											<Box
												display="flex"
												justifyContent="center"
												alignItems="center"
												width={CATEGORY_CONTAINER_SIZE_PX}
												sx={{ aspectRatio: 1 }}
											>
												<Box flex={1}>
													<Suspense
														fallback={
															<Box
																display="flex"
																justifyContent="center"
																alignItems="center"
															>
																<CircularProgress disableShrink size={30} />
															</Box>
														}
													>
														{type === 'observation' ? (
															<ObservationCategory
																attachments={document.attachments}
																categoryColor={category?.color}
																categoryName={category?.name}
																categoryIconDocumentId={
																	category?.iconRef?.docId
																}
																projectId={projectId}
															/>
														) : (
															<TrackCategory
																categoryIconDocumentId={
																	category?.iconRef?.docId
																}
																categoryColor={category?.color}
																categoryName={category?.name}
																projectId={projectId}
															/>
														)}
													</Suspense>
												</Box>
											</Box>
										</Stack>
									</ListItemButton>
								</Box>
							)
						})}
					</Box>
				</List>
			</Box>
		</Box>
	)
}

function useVirtual(
	listRef: RefObject<HTMLUListElement | null>,
	data: Array<
		| { type: 'observation'; document: Observation; category?: Preset }
		| { type: 'track'; document: Track; category?: Preset }
	>,
) {
	const getItemKey = useCallback(
		(index: number) => {
			const item = data[index]

			// Shouldn't happen but fail loudly if it does
			if (!item) {
				throw new Error(`Could not get item from listed data at index ${index}`)
			}

			return item.document.docId
		},
		[data],
	)

	// eslint-disable-next-line react-hooks/incompatible-library
	return useVirtualizer({
		count: data.length,
		getScrollElement: () => listRef.current,
		estimateSize: () => APPROXIMATE_ITEM_HEIGHT_PX,
		getItemKey,
		overscan: 10,
	})
}

function SyncedIndicatorLine({
	createdByDeviceId,
}: {
	createdByDeviceId: string
}) {
	const { data: ownDeviceInfo } = useOwnDeviceInfo()

	return ownDeviceInfo.deviceId !== createdByDeviceId ? (
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

function ObservationCategory({
	attachments,
	projectId,
	categoryName,
	categoryColor,
	categoryIconDocumentId,
}: {
	attachments: Array<Attachment>
	categoryColor?: string
	categoryIconDocumentId?: string
	categoryName?: string
	projectId: string
}) {
	const { formatMessage: t } = useIntl()

	const displayableAttachments = attachments.filter(
		// TODO: Support other attachment types
		(a): a is Extract<Attachment, { type: 'photo' }> => a.type === 'photo',
	)

	const color = categoryColor || BLUE_GREY
	const name = categoryName || t(m.observationCategoryNameFallback)

	if (displayableAttachments.length > 0) {
		const shouldStack = displayableAttachments.length > 1

		const categoryIcon = (
			<CategoryIconContainer color={color}>
				{categoryIconDocumentId ? (
					<CategoryIconImage
						projectId={projectId}
						iconDocumentId={categoryIconDocumentId}
						altText={t(m.categoryIconAlt, { name })}
						imageStyle={{ aspectRatio: 1, height: 12, objectFit: 'contain' }}
					/>
				) : (
					<Box
						display="flex"
						justifyContent="center"
						alignItems="center"
						maxHeight={12}
						sx={{ aspectRatio: 1 }}
					>
						<Icon name="material-place" />
					</Box>
				)}
			</CategoryIconContainer>
		)

		return (
			<>
				<Box
					overflow="hidden"
					borderRadius={2}
					display="flex"
					flexDirection="column"
					position="relative"
					width="100%"
					sx={{ aspectRatio: 1 }}
				>
					{
						// NOTE: We only display the first three
						displayableAttachments.slice(0, 3).map((attachment, index) => {
							const key = `${attachment.driveDiscoveryId}/${attachment.type}/${attachment.name}/${attachment.hash}`

							const attachmentStyle: CSSProperties = {
								aspectRatio: 1,
								width: '100%',
								objectFit: 'cover',
							}

							return (
								<Box
									key={key}
									position="absolute"
									sx={
										shouldStack
											? {
													aspectRatio: 1,
													border: `1px solid ${BLUE_GREY}`,
													width: '80%',
													top: index * 5,
													left: index * 5,
												}
											: {
													border: `1px solid ${BLUE_GREY}`,
													top: 0,
													right: 0,
													left: 0,
													bottom: 0,
												}
									}
									overflow="hidden"
									borderRadius={2}
								>
									<ErrorBoundary
										getResetKey={() => key}
										onError={(err) => {
											captureException(new Error('Failed to load attachment'), {
												originalException: err,
												data: {
													driveId: attachment.driveDiscoveryId,
													name: attachment.name,
													type: attachment.type,
												},
											})
										}}
										fallback={() => (
											<Box
												display="flex"
												flex={1}
												justifyContent="center"
												alignItems="center"
												height="100%"
												width="100%"
												bgcolor={WHITE}
											>
												<Icon name="material-error" color="error" />
											</Box>
										)}
									>
										<ErrorBoundary
											getResetKey={() => key + ':preview'}
											onError={() => {
												captureMessage('Failed to load preview image', {
													level: 'info',
													extra: {
														driveId: attachment.driveDiscoveryId,
														name: attachment.name,
													},
												})
											}}
											fallback={() => (
												<PhotoAttachmentImage
													projectId={projectId}
													attachmentDriveId={attachment.driveDiscoveryId}
													attachmentName={attachment.name}
													attachmentVariant="thumbnail"
													style={attachmentStyle}
												/>
											)}
										>
											<PhotoAttachmentImage
												projectId={projectId}
												attachmentDriveId={attachment.driveDiscoveryId}
												attachmentName={attachment.name}
												attachmentVariant="preview"
												style={attachmentStyle}
											/>
										</ErrorBoundary>
									</ErrorBoundary>
								</Box>
							)
						})
					}
				</Box>

				<Box
					position="absolute"
					right={(theme) => theme.spacing(2)}
					bottom={(theme) => theme.spacing(2)}
					zIndex={1}
				>
					{categoryIcon}
				</Box>
			</>
		)
	}

	return categoryIconDocumentId ? (
		<CategoryIconContainer color={color}>
			<CategoryIconImage
				projectId={projectId}
				iconDocumentId={categoryIconDocumentId}
				altText={t(m.categoryIconAlt, { name })}
				imageStyle={{ aspectRatio: 1, width: '100%' }}
			/>
		</CategoryIconContainer>
	) : (
		<CategoryIconContainer color={BLUE_GREY}>
			<Icon name="material-place" size={40} />
		</CategoryIconContainer>
	)
}

function TrackCategory({
	categoryColor,
	categoryIconDocumentId,
	categoryName,
	projectId,
}: {
	projectId: string
	categoryColor?: string
	categoryIconDocumentId?: string
	categoryName?: string
}) {
	const { formatMessage: t } = useIntl()

	return categoryIconDocumentId ? (
		<CategoryIconContainer color={categoryColor || BLUE_GREY}>
			<CategoryIconImage
				projectId={projectId}
				iconDocumentId={categoryIconDocumentId}
				altText={t(m.categoryIconAlt, {
					name: categoryName || t(m.trackItemTitle),
				})}
				imageStyle={{ aspectRatio: 1, width: '100%' }}
			/>
		</CategoryIconContainer>
	) : (
		<CategoryIconContainer color={BLACK}>
			<Icon name="material-hiking" size={40} />
		</CategoryIconContainer>
	)
}

const m = defineMessages({
	inviteCollaboratorsPanelTitle: {
		id: 'routes.app.projects.$projectId.-displayed.data.list.inviteCollaboratorsPanelTitle',
		defaultMessage: 'Invite Collaborators',
		description:
			'Text for title of panel shown when no active collaborators or data exist on project.',
	},
	inviteCollaboratorsPanelDescription: {
		id: 'routes.app.projects.$projectId.-displayed.data.list.inviteCollaboratorsPanelDescription',
		defaultMessage:
			'Invite devices to start gathering observations and tracks.',
		description:
			'Text for description of panel shown when no active collaborators or data exist on project.',
	},
	inviteCollaboratorsPanelInviteLink: {
		id: 'routes.app.projects.$projectId.-displayed.data.list.inviteCollaboratorsPanelInviteLink',
		defaultMessage: 'Invite Device',
		description: 'Text for link that navigates to invite page.',
	},
	openExchangePanelTitle: {
		id: 'routes.app.projects.$projectId.-displayed.data.list.openExchangePanelTitle',
		defaultMessage: 'Exchange to Gather Observations',
		description:
			'Text for title of panel shown when project has collaborators but no data.',
	},
	openExchangePanelDescription: {
		id: 'routes.app.projects.$projectId.-displayed.data.list.openExchangePanelDescription',
		defaultMessage: 'All observations and tracks will be listed here.',
		description:
			'Text for description of panel shown when project has collaborators but no data.',
	},
	openExchangePanelLink: {
		id: 'routes.app.projects.$projectId.-displayed.data.list.openExchangePanelLink',
		defaultMessage: 'Open Exchange',
		description: 'Text for link that navigates to exchange page.',
	},
	observationCategoryNameFallback: {
		id: 'routes.app.projects.$projectId.-displayed.data.list.observationCategoryNameFallback',
		defaultMessage: 'Observation',
		description: 'Fallback name for observation without a matching category.',
	},
	trackItemTitle: {
		id: 'routes.app.projects.$projectId.-displayed.data.list.trackItemTitle',
		defaultMessage: 'Track',
		description: 'Title for list item that is a track.',
	},
	categoryIconAlt: {
		id: 'routes.app.projects.$projectId.-displayed.data.list.categoryIconAlt',
		defaultMessage: 'Icon for {name} category',
		description:
			'Alt text for icon image displayed for category (used for accessibility tools).',
	},
	downloadObservations: {
		id: 'routes.app.projects.$projectId.-displayed.data.list.downloadObservations',
		defaultMessage: 'Download Observations',
		description: 'Link text to navigate to download observations page.',
	},
})
