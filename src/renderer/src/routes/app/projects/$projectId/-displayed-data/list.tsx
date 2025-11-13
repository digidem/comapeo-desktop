import {
	Suspense,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	type FocusEvent,
	type MouseEvent,
	type RefObject,
} from 'react'
import type { BlobApi } from '@comapeo/core'
import {
	useAttachmentUrl,
	useManyDocs,
	useOwnDeviceInfo,
} from '@comapeo/core-react'
import type { Observation, Preset, Track } from '@comapeo/schema'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useVirtualizer } from '@tanstack/react-virtual'
import { defineMessages, useIntl } from 'react-intl'
import scrollIntoView from 'scroll-into-view-if-needed'

import {
	BLACK,
	BLUE_GREY,
	COMAPEO_BLUE,
	LIGHT_COMAPEO_BLUE,
	LIGHT_GREY,
	WHITE,
} from '../../../../../colors'
import {
	CategoryIconContainer,
	CategoryIconImage,
} from '../../../../../components/category-icon'
import { ErrorBoundary } from '../../../../../components/error-boundary'
import { Icon } from '../../../../../components/icon'
import { ButtonLink, TextLink } from '../../../../../components/link'
import { SuspenseImage } from '../../../../../components/suspense-image'
import {
	getMatchingCategoryForDocument,
	type Attachment,
} from '../../../../../lib/comapeo'
import { getLocaleStateQueryOptions } from '../../../../../lib/queries/app-settings'

const CATEGORY_CONTAINER_SIZE_PX = 64

// NOTE: Accounts for space added by top + bottom padding and bottom border
const APPROXIMATE_ITEM_HEIGHT_PX = CATEGORY_CONTAINER_SIZE_PX + 16 * 2 + 1

export function DisplayedDataList({ projectId }: { projectId: string }) {
	const { formatMessage: t, formatDate } = useIntl()

	const { highlightedDocument } = useSearch({
		from: '/app/projects/$projectId/',
	})
	const navigate = useNavigate({ from: '/app/projects/$projectId/' })

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
						from: 'list',
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

	const listRef = useRef<HTMLUListElement | null>(null)
	const rowVirtualizer = useVirtual(listRef, sortedListData)
	const { scrollToIndex, scrollElement } = rowVirtualizer

	useEffect(
		/**
		 * Scrolls the list to the item that is either:
		 *
		 * 1. Hovered over on the map
		 * 2. Focused onto via the keyboard in the list.
		 *
		 * Does not do anything if the highlighting is triggered by a mouseover
		 * interaction on the list.
		 */
		function scrollToHighlightedItem() {
			if (highlightedDocument?.docId) {
				if (scrollElement) {
					const itemNode = scrollElement.querySelector(
						`[data-docid="${highlightedDocument.docId}"]`,
					)
					if (itemNode) {
						// We don't want the list to change scroll position if it's not needed (i.e the item is already visible in the list).
						// Reduces the amount of visual abruptness.
						scrollIntoView(itemNode, {
							scrollMode: 'if-needed',
							block: 'nearest',
						})
						return
					}
				}

				const itemIndexToScrollTo = highlightedDocument?.docId
					? sortedListData.findIndex(
							({ document }) => document.docId === highlightedDocument.docId,
						)
					: undefined

				if (itemIndexToScrollTo) {
					scrollToIndex(itemIndexToScrollTo)
				}
			}
		},
		[highlightedDocument?.docId, scrollToIndex, sortedListData, scrollElement],
	)

	return sortedListData.length > 0 ? (
		<Box overflow="auto" display="flex" flexDirection="column" flex={1}>
			<Box
				display="flex"
				flexDirection="row"
				justifyContent="center"
				padding={6}
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

			<Divider sx={{ bgcolor: LIGHT_GREY }} />

			<Box overflow="auto" display="flex" flexDirection="column" flex={1}>
				<List
					component="ul"
					ref={listRef}
					disablePadding
					onFocus={onFocus}
					onMouseMove={onMouseMove}
					sx={{
						overflow: 'auto',
						scrollbarColor: 'initial',
					}}
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
										data-datatype={type}
										data-docid={docId}
										disableGutters
										disableTouchRipple
										selected={docId === highlightedDocument?.docId}
										onClick={() => {
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
	) : (
		<AddObservationsCard projectId={projectId} />
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
						displayableAttachments.slice(0, 3).map((attachment, index) => (
							<Box
								key={`${attachment.driveDiscoveryId}/${attachment.type}/${attachment.name}/${attachment.hash}`}
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
									getResetKey={() =>
										`${attachment.driveDiscoveryId}/${attachment.type}/${attachment.name}/${attachment.hash}`
									}
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
									<AttachmentImage
										projectId={projectId}
										blobId={{
											driveId: attachment.driveDiscoveryId,
											name: attachment.name,
											variant: 'preview',
											type: attachment.type,
										}}
									/>
								</ErrorBoundary>
							</Box>
						))
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

function AttachmentImage({
	blobId,
	projectId,
}: {
	blobId: BlobApi.BlobId
	projectId: string
}) {
	const { data: attachmentUrl } = useAttachmentUrl({ projectId, blobId })

	return (
		<SuspenseImage
			src={attachmentUrl}
			style={{
				aspectRatio: 1,
				width: '100%',
				objectFit: 'cover',
			}}
		/>
	)
}

function AddObservationsCard({ projectId }: { projectId: string }) {
	const { formatMessage: t } = useIntl()

	return (
		<Box display="flex" flex={1} padding={6}>
			<Stack
				direction="column"
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
	addObservationsTitle: {
		id: 'routes.app.projects.$projectId.-displayed.data.list.addObservationsTitle',
		defaultMessage: 'Add Observations',
		description:
			'Title of card that is displayed when project has no observations to display.',
	},
	addObservationsDescription: {
		id: 'routes.app.projects.$projectId.-displayed.data.list.addObservationsDescription',
		defaultMessage: 'Use Exchange to add Collaborator Observations',
		description:
			'Description of card that is displayed when project has no observations to display.',
	},
	goToExchange: {
		id: 'routes.app.projects.$projectId.-displayed.data.list.goToExchange',
		defaultMessage: 'Go to Exchange',
		description: 'Link text to navigate to Exchange page.',
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
