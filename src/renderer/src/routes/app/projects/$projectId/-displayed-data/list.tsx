import {
	Suspense,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	type FocusEvent,
	type MouseEvent,
	type ReactNode,
	type RefObject,
} from 'react'
import {
	useDocumentCreatedBy,
	useIconUrl,
	useManyDocs,
	useOwnDeviceInfo,
} from '@comapeo/core-react'
import type { Observation, Preset, Track } from '@comapeo/schema'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
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
	BLUE_GREY,
	COMAPEO_BLUE,
	LIGHT_COMAPEO_BLUE,
	LIGHT_GREY,
	WHITE,
} from '../../../../../colors'
import { Icon } from '../../../../../components/icon'
import { TextLink } from '../../../../../components/link'
import { getMatchingCategoryForDocument } from '../../../../../lib/comapeo'
import { getLocaleStateQueryOptions } from '../../../../../lib/queries/app-settings'

const APPROXIMATE_ITEM_HEIGHT_PX = 100

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
					const { createdAt, docId, originalVersionId } = document

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
								key={docId}
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
									<SyncedIndicatorLine
										projectId={projectId}
										originalVersionId={originalVersionId}
									/>
								</Suspense>
								<Stack
									direction="row"
									flex={1}
									useFlexGap
									gap={2}
									overflow="auto"
								>
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
											{category?.name ||
												t(
													type === 'observation'
														? m.observationCategoryNameFallback
														: m.trackCategoryNameFallback,
												)}
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
									>
										{category?.iconRef?.docId ? (
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
												<DisplayedCategoryAndAttachments
													projectId={projectId}
													categoryName={category.name}
													borderColor={category.color || BLUE_GREY}
													iconDocumentId={category.iconRef.docId}
												/>
											</Suspense>
										) : (
											<CategoryIconContainer borderColor={BLUE_GREY}>
												<Icon name="material-place" size={40} />
											</CategoryIconContainer>
										)}
									</Box>
								</Stack>
							</ListItemButton>
						</Box>
					)
				})}
			</Box>
		</List>
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

	return useVirtualizer({
		count: data.length,
		getScrollElement: () => listRef.current,
		estimateSize: () => APPROXIMATE_ITEM_HEIGHT_PX,
		getItemKey,
		overscan: 10,
	})
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
function DisplayedCategoryAndAttachments({
	borderColor,
	categoryName,
	projectId,
	iconDocumentId,
}: {
	borderColor: string
	categoryName: string
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
		<CategoryIconContainer borderColor={borderColor}>
			<img
				src={iconURL}
				alt={t(m.categoryIconAlt, { name: categoryName })}
				style={{ aspectRatio: 1, maxHeight: 48 }}
			/>
		</CategoryIconContainer>
	)
}

function CategoryIconContainer({
	borderColor,
	children,
}: {
	borderColor: string
	children: ReactNode
}) {
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
			{children}
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
	addObservationsTitle: {
		id: 'routes.app.projects.$projectId.-displayed.data.index.addObservationsTitle',
		defaultMessage: 'Add Observations',
		description:
			'Title of card that is displayed when project has no observations to display.',
	},
	addObservationsDescription: {
		id: 'routes.app.projects.$projectId.-displayed.data.index.addObservationsDescription',
		defaultMessage: 'Use Exchange to add Collaborator Observations',
		description:
			'Description of card that is displayed when project has no observations to display.',
	},
	goToExchange: {
		id: 'routes.app.projects.$projectId.-displayed.data.index.goToExchange',
		defaultMessage: 'Go to Exchange',
		description: 'Link text to navigate to Exchange page.',
	},
	observationCategoryNameFallback: {
		id: 'routes.app.projects.$projectId.-displayed.data.index.observationCategoryNameFallback',
		defaultMessage: 'Observation',
		description: 'Fallback name for observation without a matching category.',
	},
	trackCategoryNameFallback: {
		id: 'routes.app.projects.$projectId.-displayed.data.index.trackCategoryNameFallback',
		defaultMessage: 'Track',
		description: 'Fallback name for track without a matching category.',
	},
	categoryIconAlt: {
		id: 'routes.app.projects.$projectId.-displayed.data.index.categoryIconAlt',
		defaultMessage: 'Icon for {name} category',
		description:
			'Alt text for icon image displayed for category (used for accessibility tools).',
	},
})
