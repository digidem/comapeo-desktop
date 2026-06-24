import {
	Suspense,
	useEffect,
	useEffectEvent,
	useId,
	useMemo,
	useRef,
	useState,
	type CSSProperties,
} from 'react'
import { useManyDocs, useOwnDeviceInfo } from '@comapeo/core-react'
import type { Preset } from '@comapeo/core/schema.js'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import InputBase from '@mui/material/InputBase'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import Radio from '@mui/material/Radio'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'
import { captureException, captureMessage } from '@sentry/react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
	addDays,
	formatISO,
	startOfMonth,
	startOfYear,
	subDays,
} from 'date-fns'
import { isArrayEqual, isEqual } from 'radashi'
import { defineMessages, useIntl, type IntlShape } from 'react-intl'

import {
	BLACK,
	BLUE_GREY,
	COMAPEO_BLUE,
	DARK_GREY,
	LIGHT_COMAPEO_BLUE,
	LIGHT_GREY,
	WHITE,
} from '../../../../../colors.ts'
import {
	CategoryIconContainer,
	CategoryIconImage,
} from '../../../../../components/category-icon.tsx'
import { DecentDialog } from '../../../../../components/decent-dialog.tsx'
import { ErrorBoundary } from '../../../../../components/error-boundary.tsx'
import { Icon } from '../../../../../components/icon.tsx'
import { IconButtonLink } from '../../../../../components/link.tsx'
import { useIconSizeBasedOnTypography } from '../../../../../hooks/icon.ts'
import {
	getMatchingCategoryForDocument,
	type Attachment,
} from '../../../../../lib/comapeo.ts'
import {
	removeItem,
	setItem,
	type DateFilter,
} from '../../../../../lib/local-storage.ts'
import { getLocaleStateQueryOptions } from '../../../../../lib/queries/app-settings.ts'
import { AdvancedFiltersDialogContent } from './-advanced-filters-dialog.tsx'
import { FilterSelect } from './-filter-select.tsx'
import {
	dateFilterToDateRange,
	isDocumentIncludedByFilters,
	isEqualByItemKey,
	type HighlightedDocument,
} from './-shared.ts'
import { PhotoAttachmentImage } from './observations/$observationDocId/-components/photo-attachment-image.tsx'

const CATEGORY_CONTAINER_SIZE_PX = 64

// NOTE: Accounts for space added by top + bottom padding and bottom border
const APPROXIMATE_ITEM_HEIGHT_PX = CATEGORY_CONTAINER_SIZE_PX + 16 * 2 + 1

export function DataList({ projectId }: { projectId: string }) {
	const { formatMessage: t, formatDate } = useIntl()

	const { data: lang } = useSuspenseQuery({
		...getLocaleStateQueryOptions(),
		select: ({ value }) => value,
	})

	const activeCategoryFilters = useSearch({
		from: '/app/projects/$projectId/_main-tabs',
		select: (value) => {
			// TODO: Filter out and warn about irrelevant categories?
			return value.filters?.categories
		},
	})

	const activeDateFilter = useSearch({
		from: '/app/projects/$projectId/_main-tabs',
		select: (value) => {
			// TODO: Filter out and warn about irrelevant categories?
			return value.filters?.date
		},
	})

	const highlightedDocument = useSearch({
		from: '/app/projects/$projectId/_main-tabs',
		select: (value) => {
			return value.highlightedDocument
		},
	})

	const navigate = useNavigate({ from: '/app/projects/$projectId/' })

	const { data: observations } = useManyDocs({
		projectId,
		docType: 'observation',
		lang,
	})

	const { data: tracks } = useManyDocs({ projectId, docType: 'track', lang })

	const { data: categories } = useManyDocs({
		projectId,
		docType: 'preset',
		lang,
	})

	const allCategoryDocIds = categories.map((c) => c.docId)

	const filteredCategories = activeCategoryFilters
		? categories.filter((c) => {
				return activeCategoryFilters.includes(c.docId)
			})
		: categories

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
		// TODO: Does this make sense?
		const now = new Date()

		return [...observationsWithCategory, ...tracksWithCategory]
			.filter((item) => {
				return isDocumentIncludedByFilters(item, {
					categories: filteredCategories,
					date: activeDateFilter
						? dateFilterToDateRange(activeDateFilter, now)
						: undefined,
				})
			})
			.sort((a, b) => {
				return a.document.createdAt < b.document.createdAt ? 1 : -1
			})
	}, [
		activeDateFilter,
		filteredCategories,
		observationsWithCategory,
		tracksWithCategory,
	])

	const listRef = useRef<HTMLUListElement | null>(null)

	// NOTE: Incompatibility in [@tanstack/react-virtual](https://github.com/TanStack/virtual/releases/tag/%40tanstack%2Freact-virtual%403.14.0)
	// (see https://github.com/TanStack/virtual/issues/736#issuecomment-4600048069).
	// eslint-disable-next-line react-hooks/incompatible-library
	const rowVirtualizer = useVirtualizer({
		count: sortedListData.length,
		estimateSize: () => APPROXIMATE_ITEM_HEIGHT_PX,
		getItemKey: (index) => {
			const item = sortedListData[index]

			// Shouldn't happen but fail loudly if it does
			if (!item) {
				throw new Error(`Could not get item from listed data at index ${index}`)
			}

			return item.document.docId
		},
		getScrollElement: () => listRef.current,
		overscan: 10,
		directDomUpdates: true,
		directDomUpdatesMode: 'transform',
	})

	const scrollToHighlightedItem = useEffectEvent(
		(document: HighlightedDocument) => {
			const itemIndexToScrollTo = highlightedDocument?.docId
				? sortedListData.findIndex(
						(item) => item.document.docId === document.docId,
					)
				: undefined

			if (itemIndexToScrollTo) {
				rowVirtualizer.scrollToIndex(itemIndexToScrollTo, { align: 'center' })
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

	const downloadButtonSize = useIconSizeBasedOnTypography({
		typographyVariant: 'h1',
		multiplier: 1.25,
	})

	const filterIconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'button',
	})

	const [showAdvancedFiltersDialog, setShowAdvancedFiltersDialog] = useState<
		true | undefined
	>(undefined)

	function setCategoryFilters(value: Array<string>) {
		setItem('comapeo:filters:category', value)

		navigate({
			replace: true,
			search: (prev) => {
				return { ...prev, filters: { ...prev.filters, categories: value } }
			},
		}).catch((err) => {
			captureException(err)
		})
	}

	function unsetCategoryFilters() {
		removeItem('comapeo:filters:category')

		navigate({
			replace: true,
			search: (prev) => {
				const updatedFilters = { ...prev.filters, categories: undefined }

				if (Object.values(updatedFilters).some((v) => v !== undefined)) {
					return { ...prev, filters: updatedFilters }
				}

				return { ...prev, filters: undefined }
			},
		}).catch((err) => {
			captureException(err)
		})
	}

	function setDateFilter(value: DateFilter) {
		setItem('comapeo:filters:date', value)

		navigate({
			replace: true,
			search: (prev) => {
				return { ...prev, filters: { ...prev.filters, date: value } }
			},
		}).catch((err) => {
			captureException(err)
		})
	}

	const [nowTimestamp, setNowTimestamp] = useState(() => {
		return Date.now()
	})

	function unsetDateFilter() {
		removeItem('comapeo:filters:date')

		navigate({
			replace: true,
			search: (prev) => {
				const updatedFilters = { ...prev.filters, date: undefined }

				if (Object.values(updatedFilters).some((v) => v !== undefined)) {
					return { ...prev, filters: updatedFilters }
				}

				return { ...prev, filters: undefined }
			},
		}).catch((err) => {
			captureException(err)
		})
	}

	return (
		<>
			<Stack direction="column" sx={{ flex: 1, overflow: 'auto' }}>
				<Box
					sx={{
						overflow: 'auto',
						display: 'flex',
						flexDirection: 'column',
						flex: 1,
					}}
				>
					<Stack
						direction="column"
						sx={{
							borderBottom: `2px solid ${BLUE_GREY}`,
							gap: 4,
							paddingBlock: 4,
							paddingInline: 6,
						}}
					>
						<Stack direction="row" sx={{ justifyContent: 'space-between' }}>
							<Stack
								direction="row"
								sx={{ alignItems: 'center', gap: 4, flexWrap: 'wrap' }}
							>
								<Typography variant="h1" sx={{ fontWeight: 500 }}>
									{t(m.listTitle)}
								</Typography>

								<Box
									sx={{
										borderRadius: 2,
										backgroundColor:
											sortedListData.length === 0
												? LIGHT_GREY
												: LIGHT_COMAPEO_BLUE,
										padding: 2,
									}}
								>
									<Typography
										color={
											sortedListData.length === 0 ? 'textDisabled' : 'primary'
										}
										sx={{ fontWeight: 500 }}
									>
										{t(m.resultsCount, { count: sortedListData.length })}
									</Typography>
								</Box>
							</Stack>

							<Tooltip title={t(m.downloadObservations)} placement="right">
								<IconButtonLink
									to="/app/projects/$projectId/download"
									aria-label={t(m.downloadObservations)}
								>
									<Icon
										name="material-file-download"
										size={downloadButtonSize}
									/>
								</IconButtonLink>
							</Tooltip>
						</Stack>

						<Stack direction="row" sx={{ gap: 4, flex: 1, flexWrap: 'wrap' }}>
							<Stack
								direction="row"
								sx={{ gap: 2, flex: 1, alignItems: 'center' }}
							>
								<Tooltip
									title={t(m.categoryFilterLabel)}
									disableFocusListener
									placement="bottom"
								>
									<Icon
										name="material-symbols-apps"
										htmlColor={BLUE_GREY}
										size={filterIconSize}
									/>
								</Tooltip>

								<CategoryFilterSelect
									selected={filteredCategories}
									options={categories}
									onAdvancedClick={() => {
										setShowAdvancedFiltersDialog(true)
									}}
									onDeselectAll={() => {
										setCategoryFilters([])
									}}
									onSelectAll={() => {
										unsetCategoryFilters()
									}}
									onChange={(action, value) => {
										if (action === 'select') {
											setCategoryFilters(
												activeCategoryFilters
													? Array.from(
															new Set([...activeCategoryFilters, value]),
														)
													: [value],
											)
										} else {
											setCategoryFilters(
												activeCategoryFilters
													? activeCategoryFilters.filter((f) => f !== value)
													: allCategoryDocIds.filter((id) => id !== value),
											)
										}
									}}
									projectId={projectId}
								/>
							</Stack>

							<Stack
								direction="row"
								sx={{ gap: 2, flex: 1, alignItems: 'center' }}
							>
								<Tooltip
									title={t(m.dateFilterLabel)}
									disableFocusListener
									placement="bottom"
								>
									<Icon
										name="material-symbols-schedule"
										htmlColor={BLUE_GREY}
										size={filterIconSize}
									/>
								</Tooltip>

								<DateFilterSelect
									value={activeDateFilter}
									nowTimestamp={nowTimestamp}
									onAdvancedClick={() => {
										setShowAdvancedFiltersDialog(true)
									}}
									onChange={(value) => {
										if (value) {
											setDateFilter(value)
										} else {
											unsetDateFilter()
										}
										setNowTimestamp(Date.now())
									}}
								/>
							</Stack>
						</Stack>
					</Stack>

					{!!activeDateFilter ||
					(activeCategoryFilters &&
						activeCategoryFilters.length > 0 &&
						!isArrayEqual(allCategoryDocIds, activeCategoryFilters)) ? (
						<Stack
							direction="row"
							sx={{
								overflowInline: 'auto',
								gap: 2,
								paddingInline: 6,
								paddingBlock: 4,
								borderBottom: `2px solid ${BLUE_GREY}`,
							}}
						>
							<Button
								variant="outlined"
								sx={{ flexShrink: 0, fontWeight: 'normal' }}
								onClick={() => {
									unsetCategoryFilters()
									unsetDateFilter()
								}}
							>
								{t(m.clearFilters)}
							</Button>

							{activeDateFilter ? (
								<FilterPill
									label={
										activeDateFilter.type === 'range'
											? t(m.dateFilterOptionCustom, {
													start: new Date(activeDateFilter.start),
													end: new Date(activeDateFilter.end),
												})
											: getDateFilterOptionDisplayedValue(activeDateFilter, t)
									}
									color={LIGHT_GREY}
									onRemove={() => {
										unsetDateFilter()
									}}
								/>
							) : null}

							{activeCategoryFilters &&
							activeCategoryFilters.length > 0 &&
							!isArrayEqual(allCategoryDocIds, activeCategoryFilters)
								? filteredCategories.map((category) => {
										return (
											<FilterPill
												key={category.docId}
												color={
													category.color ? alpha(category.color, 0.1) : WHITE
												}
												label={category.name}
												onRemove={() => {
													const updatedFilter = activeCategoryFilters.filter(
														(f) => f !== category.docId,
													)

													setCategoryFilters(
														updatedFilter.length === 0
															? allCategoryDocIds
															: updatedFilter,
													)
												}}
											/>
										)
									})
								: null}
						</Stack>
					) : null}

					<Box
						sx={{
							overflow: 'auto',
							display: 'flex',
							flexDirection: 'column',
							flex: 1,
							backgroundColor: LIGHT_GREY,
						}}
					>
						<List
							component="ul"
							ref={listRef}
							disablePadding
							sx={{ flex: 1, overflow: 'auto', scrollbarColor: 'initial' }}
						>
							<Box
								ref={rowVirtualizer.containerRef}
								sx={{ position: 'relative', width: '100%' }}
							>
								{rowVirtualizer.getVirtualItems().map((row) => {
									const { type, category, document } =
										sortedListData[row.index]!
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
												backgroundColor: WHITE,
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
															replace: true,
															search: (prev) => ({
																...prev,
																highlightedDocument: {
																	type,
																	docId,
																	from: 'list',
																},
															}),
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
												sx={{
													borderBottom: `1px solid ${LIGHT_GREY}`,
													padding: 4,
												}}
											>
												<Suspense>
													<SyncedIndicatorLine createdByDeviceId={createdBy} />
												</Suspense>

												<Stack
													direction="row"
													sx={{ flex: 1, gap: 2, overflow: 'auto' }}
												>
													<Stack
														direction="column"
														sx={{
															flex: 1,
															justifyContent: 'center',
															overflow: 'hidden',
														}}
													>
														<Typography
															sx={{
																fontWeight: 500,
																textOverflow: 'ellipsis',
																whiteSpace: 'nowrap',
																overflow: 'hidden',
															}}
														>
															{title}
														</Typography>

														<Typography
															sx={{
																textOverflow: 'ellipsis',
																whiteSpace: 'nowrap',
																overflow: 'hidden',
															}}
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
														sx={{
															display: 'flex',
															justifyContent: 'center',
															alignItems: 'center',
															width: CATEGORY_CONTAINER_SIZE_PX,
															aspectRatio: 1,
														}}
													>
														<Box sx={{ flex: 1 }}>
															<Suspense
																fallback={
																	<Box
																		sx={{
																			display: 'flex',
																			justifyContent: 'center',
																			alignItems: 'center',
																		}}
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
			</Stack>

			<DecentDialog
				fullScreen
				sx={{ padding: 10 }}
				value={showAdvancedFiltersDialog}
			>
				{() => (
					<AdvancedFiltersDialogContent
						categories={categories}
						categoryFilter={filteredCategories}
						dateFilter={activeDateFilter}
						nowTimestamp={nowTimestamp}
						onCancel={() => {
							setShowAdvancedFiltersDialog(undefined)
						}}
						onSubmit={(value) => {
							if (value.categories) {
								setCategoryFilters(value.categories.map((c) => c.docId))
							} else {
								unsetCategoryFilters()
							}

							if (value.date) {
								setDateFilter(value.date)
							} else {
								unsetDateFilter()
							}

							setShowAdvancedFiltersDialog(undefined)
						}}
						projectId={projectId}
						observationsWithCategory={observationsWithCategory}
						tracksWithCategory={tracksWithCategory}
					/>
				)}
			</DecentDialog>
		</>
	)
}

function FilterPill({
	label,
	onRemove,
	color,
}: {
	color?: string
	label: string
	onRemove: () => void
}) {
	const removeFilterButtonSize = useIconSizeBasedOnTypography({
		typographyVariant: 'body1',
		multiplier: 0.75,
	})

	return (
		<Stack
			direction="row"
			sx={{
				alignItems: 'center',
				border: `1px solid ${BLUE_GREY}`,
				borderRadius: 2,
				paddingInline: 4,
				gap: 4,
				backgroundColor: color,
			}}
		>
			<Typography sx={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
				{label}
			</Typography>

			<IconButton
				onClick={() => {
					onRemove()
				}}
				sx={{
					flex: 0,
					padding: 0,
					borderRadius: '50%',
					border: `1px solid ${DARK_GREY}`,
				}}
			>
				<Icon
					name="material-close"
					htmlColor={DARK_GREY}
					size={removeFilterButtonSize}
				/>
			</IconButton>
		</Stack>
	)
}

function SyncedIndicatorLine({
	createdByDeviceId,
}: {
	createdByDeviceId: string
}) {
	const { data: ownDeviceInfo } = useOwnDeviceInfo()

	return ownDeviceInfo.deviceId !== createdByDeviceId ? (
		<Box
			sx={{
				position: 'absolute',
				width: 8,
				left: 0,
				bottom: 0,
				top: 0,
				bgcolor: COMAPEO_BLUE,
			}}
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
						sx={{
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
							maxHeight: 12,
							aspectRatio: 1,
						}}
					>
						<Icon name="material-place" />
					</Box>
				)}
			</CategoryIconContainer>
		)

		return (
			<>
				<Box
					sx={{
						overflow: 'hidden',
						borderRadius: 2,
						display: 'flex',
						flexDirection: 'column',
						position: 'relative',
						width: '100%',
						aspectRatio: 1,
					}}
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
									sx={[
										{
											position: 'absolute',
											overflow: 'hidden',
											borderRadius: 2,
										},
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
												},
									]}
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
												sx={{
													display: 'flex',
													flex: 1,
													justifyContent: 'center',
													alignItems: 'center',
													height: '100%',
													width: '100%',
													bgcolor: WHITE,
												}}
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
					sx={{
						position: 'absolute',
						right: (theme) => theme.spacing(2),
						bottom: (theme) => theme.spacing(2),
						zIndex: 1,
					}}
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

function CategoryFilterSelect({
	selected,
	options,
	onAdvancedClick,
	onChange,
	onDeselectAll,
	onSelectAll,
	projectId,
}: {
	selected: Array<Preset>
	options: Array<Preset>
	onAdvancedClick: () => void
	onSelectAll: () => void
	onDeselectAll: () => void
	onChange: (action: 'select' | 'deselect', value: string) => void
	projectId: string
}) {
	const { formatMessage: t } = useIntl()

	const dataOptionPrefixId = useId()

	const categoryIconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'body1',
		multiplier: 0.75,
	})

	const allSelected = isEqualByItemKey(options, selected, 'docId')

	return (
		<FilterSelect
			multiSelect
			displayedValue={
				allSelected
					? t(m.categoryFilterAll)
					: t(m.categoryFilterValue, { count: selected.length })
			}
			hiddenInput={
				<InputBase
					readOnly
					aria-hidden="true"
					value={selected.map((c) => c.name).join(', ')}
					slotProps={{ input: { tabIndex: -1 } }}
					sx={{
						bottom: 0,
						left: 0,
						position: 'absolute',
						visibility: 'hidden',
					}}
				/>
			}
			header={
				<Button
					variant="text"
					size="small"
					sx={{ maxWidth: 400 }}
					onClick={() => {
						if (selected.length === 0) {
							onSelectAll()
						} else {
							onDeselectAll()
						}
					}}
				>
					{t(
						selected.length === 0
							? m.categoryFilterSelectAll
							: m.categoryFilterDeselectAll,
					)}
				</Button>
			}
			footer={
				<Button
					fullWidth
					variant="outlined"
					sx={{ maxWidth: 400 }}
					onClick={onAdvancedClick}
				>
					{t(m.categoryFilterAdvanced)}
				</Button>
			}
		>
			{options.map((category) => {
				const isSelected = !!selected.find((f) => f.docId === category.docId)

				return (
					<ListItemButton
						key={category.docId}
						role="option"
						disableGutters
						disableRipple
						tabIndex={-1}
						selected={isSelected}
						aria-selected={isSelected}
						data-option-id={`${dataOptionPrefixId}-${category.docId}`}
						sx={{ padding: 4 }}
						onClick={() => {
							onChange(isSelected ? 'deselect' : 'select', category.docId)
						}}
					>
						<Stack
							direction="row"
							sx={{ alignItems: 'center', gap: 2, overflow: 'auto' }}
						>
							<Checkbox
								checked={isSelected}
								slotProps={{ input: { tabIndex: -1 } }}
								sx={{ padding: 0 }}
							/>

							<Stack direction="row" sx={{ alignItems: 'center', gap: 2 }}>
								<Box aria-hidden>
									<CategoryIconContainer color={category.color || BLUE_GREY}>
										{category.iconRef?.docId ? (
											<Suspense
												fallback={
													<Box
														sx={{
															display: 'flex',
															justifyContent: 'center',
															alignItems: 'center',
														}}
													>
														<CircularProgress
															disableShrink
															size={categoryIconSize}
														/>
													</Box>
												}
											>
												<CategoryIconImage
													altText={t(m.categoryFilterCategoryIconAlt, {
														name: category.name,
													})}
													iconDocumentId={category.iconRef.docId}
													projectId={projectId}
													imageStyle={{
														width: categoryIconSize,
														aspectRatio: 1,
													}}
												/>
											</Suspense>
										) : (
											<Icon name="material-place" size={categoryIconSize} />
										)}
									</CategoryIconContainer>
								</Box>

								<Typography
									sx={{
										overflow: 'hidden',
										textOverflow: 'ellipsis',
										whiteSpace: 'nowrap',
									}}
								>
									{category.name}
								</Typography>
							</Stack>
						</Stack>
					</ListItemButton>
				)
			})}
		</FilterSelect>
	)
}

function getDateFilterOptionDisplayedValue(
	value: DateFilter,
	formatMessage: IntlShape['formatMessage'],
) {
	switch (value.type) {
		case 'range': {
			return formatMessage(m.dateFilterValueCustom)
		}
		case 'relative': {
			return formatMessage(m.dateFilterOptionLastNDays, {
				count: value.value,
			})
		}
		case 'same': {
			return formatMessage(
				value.unit === 'month'
					? m.dateFilterOptionSameMonth
					: m.dateFilterOptionSameYear,
			)
		}
	}
}

function DateFilterSelect({
	nowTimestamp,
	onAdvancedClick,
	onChange,
	value,
}: {
	nowTimestamp: number
	onAdvancedClick: () => void
	onChange: (value: DateFilter | null) => void
	value: DateFilter | undefined
}) {
	const { formatMessage: t } = useIntl()

	const dataItemPrefixId = useId()

	const [customRangeOption, setCustomRangeOption] = useState(() => {
		if (value?.type === 'range') {
			return value
		}

		return undefined
	})

	// TODO: Custom range option should not persist when pressing Clear button in filter pills section
	if (value?.type === 'range' && customRangeOption !== value) {
		setCustomRangeOption(value)
	}

	const selectedOption = useMemo(() => {
		if (!value) {
			return {
				id: 'from-start' as const,
				displayedValue: t(m.dateFilterOptionFromStart),
				inputValues: {
					start: '',
					end: formatISO(addDays(nowTimestamp, 1), { representation: 'date' }),
				},
			}
		}

		const displayedValue = getDateFilterOptionDisplayedValue(value, t)

		switch (value.type) {
			case 'range': {
				return {
					id: 'custom' as const,
					displayedValue,
					inputValues: {
						start: formatISO(value.start, { representation: 'date' }),
						end: formatISO(value.end, { representation: 'date' }),
					},
				}
			}
			case 'relative': {
				return {
					id: `last-${value.value}-days` as const,
					displayedValue,
					inputValues: {
						start: formatISO(subDays(nowTimestamp, value.value), {
							representation: 'date',
						}),
						end: formatISO(addDays(nowTimestamp, 1), {
							representation: 'date',
						}),
					},
				}
			}
			case 'same': {
				const startDate =
					value.unit === 'month'
						? startOfMonth(nowTimestamp)
						: startOfYear(nowTimestamp)

				return {
					id: `same-${value.unit}` as const,
					displayedValue,
					inputValues: {
						start: formatISO(startDate, { representation: 'date' }),
						end: formatISO(addDays(nowTimestamp, 1), {
							representation: 'date',
						}),
					},
				}
			}
		}
	}, [value, nowTimestamp, t])

	return (
		<FilterSelect
			displayedValue={selectedOption.displayedValue}
			hiddenInput={
				<>
					<InputBase
						type="date"
						readOnly
						name="start"
						value={selectedOption.inputValues.start}
						aria-hidden="true"
						slotProps={{ input: { tabIndex: -1 } }}
						sx={{
							position: 'absolute',
							left: 0,
							bottom: 0,
							visibility: 'hidden',
						}}
					/>

					<InputBase
						type="date"
						readOnly
						name="end"
						aria-hidden="true"
						value={selectedOption.inputValues.end}
						slotProps={{ input: { tabIndex: -1 } }}
						sx={{
							position: 'absolute',
							left: 0,
							bottom: 0,
							visibility: 'hidden',
						}}
					/>
				</>
			}
			footer={
				<Button
					fullWidth
					variant="outlined"
					sx={{ maxWidth: 400 }}
					onClick={onAdvancedClick}
				>
					{t(m.categoryFilterAdvanced)}
				</Button>
			}
			onClose={() => {
				if (value?.type !== 'range') {
					setCustomRangeOption(undefined)
				}
			}}
			onOpen={() => {
				if (value?.type === 'range' && customRangeOption === undefined) {
					setCustomRangeOption(value)
				}
			}}
		>
			<ListItemButton
				role="option"
				disableGutters
				disableRipple
				selected={selectedOption.id === 'from-start'}
				aria-selected={value === undefined}
				tabIndex={-1}
				sx={{ padding: 4, borderBottom: `1px solid ${BLUE_GREY}` }}
				data-option-id={`${dataItemPrefixId}-from-start`}
				onClick={() => {
					if (selectedOption.id === 'from-start') {
						return
					}

					onChange(null)
				}}
			>
				<Stack
					direction="row"
					sx={{ alignItems: 'center', gap: 2, overflow: 'auto' }}
				>
					<Radio
						disableRipple
						checked={value === undefined}
						slotProps={{ input: { tabIndex: -1 } }}
						sx={{ padding: 0 }}
					/>

					<Typography
						sx={{
							whiteSpace: 'nowrap',
							overflow: 'hidden',
							textOverflow: 'ellipsis',
						}}
					>
						{t(m.dateFilterOptionFromStart)}
					</Typography>
				</Stack>
			</ListItemButton>

			{customRangeOption ? (
				<ListItemButton
					role="option"
					disableGutters
					disableRipple
					tabIndex={-1}
					selected={selectedOption.id === 'custom'}
					aria-selected={selectedOption.id === 'custom'}
					sx={{ padding: 4, borderBottom: `1px solid ${BLUE_GREY}` }}
					data-option-id={`${dataItemPrefixId}-custom`}
					onClick={() => {
						if (selectedOption.id === 'custom') {
							return
						}

						onChange(customRangeOption)
					}}
				>
					<Stack
						direction="row"
						sx={{ alignItems: 'center', gap: 2, overflow: 'auto' }}
					>
						<Radio
							disableRipple
							checked={isEqual(value, customRangeOption)}
							slotProps={{ input: { tabIndex: -1 } }}
							sx={{ padding: 0 }}
						/>

						<Typography
							sx={{
								whiteSpace: 'nowrap',
								overflow: 'hidden',
								textOverflow: 'ellipsis',
							}}
						>
							{t(m.dateFilterOptionCustom, {
								start: new Date(customRangeOption.start),
								end: new Date(customRangeOption.end),
							})}
						</Typography>
					</Stack>
				</ListItemButton>
			) : null}

			<ListItemButton
				role="option"
				disableGutters
				disableRipple
				tabIndex={-1}
				selected={selectedOption.id === 'last-7-days'}
				aria-selected={selectedOption.id === 'last-7-days'}
				sx={{ padding: 4 }}
				data-option-id={`${dataItemPrefixId}-last-7-days`}
				onClick={() => {
					if (selectedOption.id === 'last-7-days') {
						return
					}

					onChange({ type: 'relative', unit: 'days', value: 7 })
				}}
			>
				<Stack
					direction="row"
					sx={{ alignItems: 'center', gap: 2, overflow: 'auto' }}
				>
					<Radio
						disableRipple
						checked={isEqual(value, {
							type: 'relative',
							unit: 'days',
							value: 7,
						})}
						slotProps={{ input: { tabIndex: -1 } }}
						sx={{ padding: 0 }}
					/>

					<Typography
						sx={{
							whiteSpace: 'nowrap',
							overflow: 'hidden',
							textOverflow: 'ellipsis',
						}}
					>
						{t(m.dateFilterOptionLastNDays, { count: 7 })}
					</Typography>
				</Stack>
			</ListItemButton>

			<ListItemButton
				role="option"
				disableGutters
				disableRipple
				tabIndex={-1}
				sx={{ padding: 4 }}
				selected={selectedOption.id === 'last-30-days'}
				aria-selected={selectedOption.id === 'last-30-days'}
				data-option-id={`${dataItemPrefixId}-last-30-days`}
				onClick={() => {
					if (selectedOption.id === 'last-30-days') {
						return
					}

					onChange({ type: 'relative', unit: 'days', value: 30 })
				}}
			>
				<Stack
					direction="row"
					sx={{ alignItems: 'center', gap: 2, overflow: 'auto' }}
				>
					<Radio
						disableRipple
						checked={isEqual(value, {
							type: 'relative',
							unit: 'days',
							value: 30,
						})}
						slotProps={{ input: { tabIndex: -1 } }}
						sx={{ padding: 0 }}
					/>

					<Typography
						sx={{
							whiteSpace: 'nowrap',
							overflow: 'hidden',
							textOverflow: 'ellipsis',
						}}
					>
						{t(m.dateFilterOptionLastNDays, { count: 30 })}
					</Typography>
				</Stack>
			</ListItemButton>

			<ListItemButton
				role="option"
				disableGutters
				disableRipple
				selected={selectedOption.id === 'same-month'}
				aria-selected={selectedOption.id === 'same-month'}
				tabIndex={-1}
				sx={{ padding: 4 }}
				data-option-id={`${dataItemPrefixId}-same-month`}
				onClick={() => {
					if (selectedOption.id === 'same-month') {
						return
					}

					onChange({ type: 'same', unit: 'month' })
				}}
			>
				<Stack
					direction="row"
					sx={{ alignItems: 'center', gap: 2, overflow: 'auto' }}
				>
					<Radio
						disableRipple
						checked={isEqual(value, {
							type: 'same',
							unit: 'month',
						})}
						slotProps={{ input: { tabIndex: -1 } }}
						sx={{ padding: 0 }}
					/>

					<Typography
						sx={{
							whiteSpace: 'nowrap',
							overflow: 'hidden',
							textOverflow: 'ellipsis',
						}}
					>
						{t(m.dateFilterOptionSameMonth)}
					</Typography>
				</Stack>
			</ListItemButton>

			<ListItemButton
				role="option"
				disableGutters
				disableRipple
				tabIndex={-1}
				sx={{ padding: 4 }}
				selected={selectedOption.id === 'same-year'}
				aria-selected={selectedOption.id === 'same-year'}
				data-option-id={`${dataItemPrefixId}-same-year`}
				onClick={() => {
					if (selectedOption.id === 'same-year') {
						return
					}

					onChange({ type: 'same', unit: 'year' })
				}}
			>
				<Stack
					direction="row"
					sx={{ alignItems: 'center', gap: 2, overflow: 'auto' }}
				>
					<Radio
						disableRipple
						checked={isEqual(value, {
							type: 'same',
							unit: 'year',
						})}
						slotProps={{ input: { tabIndex: -1 } }}
						sx={{ padding: 0 }}
					/>

					<Typography
						sx={{
							whiteSpace: 'nowrap',
							overflow: 'hidden',
							textOverflow: 'ellipsis',
						}}
					>
						{t(m.dateFilterOptionSameYear)}
					</Typography>
				</Stack>
			</ListItemButton>
		</FilterSelect>
	)
}

const m = defineMessages({
	observationCategoryNameFallback: {
		id: '$1.routes.app.projects.$projectId.-data-list.observationCategoryNameFallback',
		defaultMessage: 'Observation',
		description: 'Fallback name for observation without a matching category.',
	},
	trackItemTitle: {
		id: '$1.routes.app.projects.$projectId.-data-list.trackItemTitle',
		defaultMessage: 'Track',
		description: 'Title for list item that is a track.',
	},
	categoryIconAlt: {
		id: 'routes.app.projects.$projectId.-data-list.categoryIconAlt',
		defaultMessage: 'Icon for {name} category',
		description:
			'Alt text for icon image displayed for category (used for accessibility tools).',
	},
	downloadObservations: {
		id: '$1.routes.app.projects.$projectId.-data-list.downloadObservations',
		defaultMessage: 'Download Observations',
		description: 'Link text to navigate to download observations page.',
	},
	listTitle: {
		id: '$1.routes.app.projects.$projectId.-data-list.listTitle',
		defaultMessage: 'List',
		description: 'Title for listed data page.',
	},
	resultsCount: {
		id: '$1.routes.app.projects.$projectId.-data-list.resultsCount',
		defaultMessage:
			'{count, plural, =0 {No results} one {# result} other {# results}}',
		description: 'Number of items listed',
	},
	clearFilters: {
		id: '$1.routes.app.projects.$projectId.-data-list.clearFilters',
		defaultMessage: 'Clear All',
		description: 'Text for button to clear all filters',
	},
	categoryFilterLabel: {
		id: '$1.routes.app.projects.$projectId.-data-list.categoryFilterLabel',
		defaultMessage: 'Filter by Category',
		description: 'Text displayed describing the category filter input.',
	},
	categoryFilterValue: {
		id: '$1.routes.app.projects.$projectId.-data-list.categoryFilterValue',
		defaultMessage:
			'{count, plural, =0 {0 categories} one {# category} other {# categories}}',
		description: 'Text displayed describing the selected category filters.',
	},
	categoryFilterAll: {
		id: '$1.routes.app.projects.$projectId.-data-list.categoryFilterAll',
		defaultMessage: 'All Categories',
		description: 'Text shown when all categories are being shown.',
	},
	categoryFilterDeselectAll: {
		id: '$1.routes.app.projects.$projectId.-data-list.categoryFilterDeselectAll',
		defaultMessage: 'Deselect All',
		description: 'Text for button to deselect all categories.',
	},
	categoryFilterSelectAll: {
		id: '$1.routes.app.projects.$projectId.-data-list.categoryFilterSelectAll',
		defaultMessage: 'Select All',
		description: 'Text for button to select all categories.',
	},
	categoryFilterCategoryIconAlt: {
		id: 'routes.app.projects.$projectId.-data-list.categoryFilterCategoryIconAlt',
		defaultMessage: 'Icon for {name} category',
		description:
			'Alt text for icon image displayed for category (used for accessibility tools).',
	},
	categoryFilterAdvanced: {
		id: '$1.routes.app.projects.$projectId.-data-list.categoriesFiltersAdvanced',
		defaultMessage: 'Advanced…',
		description: 'Text for button to clear all filters',
	},
	dateFilterLabel: {
		id: '$1.routes.app.projects.$projectId.-data-list.dateFilterLabel',
		defaultMessage: 'Filter by Date',
		description: 'Text displayed describing the date filter input.',
	},
	dateFilterOptionFromStart: {
		id: '$1.routes.app.projects.$projectId.-data-list.dateFilterOptionFromStart',
		defaultMessage: 'From Start',
		description: 'Text for option to show data from earliest starting date.',
	},
	dateFilterOptionCustom: {
		id: '$1.routes.app.projects.$projectId.-data-list.dateFilterOptionCustom',
		defaultMessage: '{start, date, long} to {end, date, long}',
		description: 'Text for label used for custom date range option.',
	},
	dateFilterValueCustom: {
		id: '$1.routes.app.projects.$projectId.-data-list.dateFilterValueCustom',
		defaultMessage: 'Custom',
		description: 'Text for value displayed when custom date range is selected.',
	},
	dateFilterOptionLastNDays: {
		id: '$1.routes.app.projects.$projectId.-data-list.dateFilterOptionLastNDays',
		defaultMessage: 'Last {count, number} Days',
		description: 'Text for option to show data from the last N days.',
	},
	dateFilterOptionSameMonth: {
		id: '$1.routes.app.projects.$projectId.-data-list.dateFilterOptionSame',
		defaultMessage: 'Same Month',
		description: 'Text for option to show data from the same month.',
	},
	dateFilterOptionSameYear: {
		id: '$1.routes.app.projects.$projectId.-data-list.dateFilterOptionSameYear',
		defaultMessage: 'Same Year',
		description: 'Text for option to show data from the same year.',
	},
})
