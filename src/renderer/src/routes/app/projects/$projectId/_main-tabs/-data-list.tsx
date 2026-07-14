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
import { useRouter } from '@tanstack/react-router'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
	addDays,
	endOfToday,
	formatISO,
	max,
	startOfMonth,
	startOfYear,
	subDays,
} from 'date-fns'
import { counting, isArrayEqual, isEqual } from 'radashi'
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
	dateFilterToSearchParams,
	isDocumentIncludedByFilters,
	type HighlightedDocument,
} from './-shared.ts'
import { PhotoAttachmentImage } from './observations/$observationDocId/-components/photo-attachment-image.tsx'

const CATEGORY_CONTAINER_SIZE_PX = 64

// NOTE: Accounts for space added by top + bottom padding and bottom border
const APPROXIMATE_ITEM_HEIGHT_PX = CATEGORY_CONTAINER_SIZE_PX + 16 * 2 + 1

export function DataList({
	categoriesFilter,
	dateFilter,
	filterReferenceDate,
	highlightedDocument,
	projectId,
}: {
	categoriesFilter: Array<string> | undefined
	dateFilter?: DateFilter
	filterReferenceDate?: Date
	highlightedDocument?: HighlightedDocument
	projectId: string
}) {
	const router = useRouter()

	const { formatMessage: t, formatDate } = useIntl()

	const { data: lang } = useSuspenseQuery({
		...getLocaleStateQueryOptions(),
		select: ({ value }) => value,
	})

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

	const filteredCategories = categoriesFilter
		? categories.filter((c) => {
				return categoriesFilter.includes(c.docId)
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

	const groupedByCategoryCount = useMemo(() => {
		const { _, ...result } = counting(
			[...observationsWithCategory, ...tracksWithCategory],
			({ category }) => category?.docId || '_',
		)

		return result
	}, [observationsWithCategory, tracksWithCategory])

	// NOTE: Accounts for cases where the app is left open for a while
	// and the user performs an interaction that relies on a more updated date value.
	const [lastDateFilterInteractionDate, setLastDateFilterInteractionDate] =
		useState<Date>(() => {
			return filterReferenceDate || endOfToday()
		})

	const referenceDateToUse = filterReferenceDate
		? max([filterReferenceDate, lastDateFilterInteractionDate])
		: lastDateFilterInteractionDate

	const sortedListData = useMemo(() => {
		return [...observationsWithCategory, ...tracksWithCategory]
			.filter((item) => {
				return isDocumentIncludedByFilters(item, {
					categories: categoriesFilter || categories.map((c) => c.docId),
					date: dateFilter
						? dateFilterToDateRange(dateFilter, referenceDateToUse)
						: undefined,
				})
			})
			.sort((a, b) => {
				return a.document.createdAt < b.document.createdAt ? 1 : -1
			})
	}, [
		categories,
		categoriesFilter,
		dateFilter,
		observationsWithCategory,
		referenceDateToUse,
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

	const [showAdvancedFiltersDialog, setShowAdvancedFiltersDialog] = useState<
		true | undefined
	>(undefined)

	function setCategoriesFilter(value: Array<string>) {
		setItem('filters/categories', value, projectId)

		router
			.navigate({
				to: '.',
				replace: true,
				search: (prev) => {
					return { ...prev, categories: value }
				},
			})
			.catch((err) => {
				captureException(err)
			})
	}

	function unsetCategoriesFilter() {
		removeItem('filters/categories', projectId)

		router
			.navigate({
				to: '.',
				replace: true,
				search: (prev) => {
					return { ...prev, categories: undefined }
				},
			})
			.catch((err) => {
				captureException(err)
			})
	}

	function setDateFilter(value: DateFilter) {
		setItem('filters/date', value, projectId)

		const dateSearchParams = dateFilterToSearchParams(value)

		router
			.navigate({
				to: '.',
				replace: true,
				search: (prev) => {
					return { ...prev, ...dateSearchParams }
				},
			})
			.catch((err) => {
				captureException(err)
			})
	}

	function unsetDateFilter() {
		removeItem('filters/date', projectId)

		router
			.navigate({
				to: '.',
				replace: true,
				search: (prev) => {
					return {
						...prev,
						period: undefined,
						start: undefined,
						end: undefined,
					}
				},
			})
			.catch((err) => {
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
							<CategoriesFilterSelect
								groupedByCategoryCount={groupedByCategoryCount}
								selected={filteredCategories}
								options={categories}
								onAdvancedClick={() => {
									setShowAdvancedFiltersDialog(true)
								}}
								onDeselectAll={() => {
									setCategoriesFilter([])
								}}
								onSelectAll={() => {
									unsetCategoriesFilter()
								}}
								onChange={(action, value) => {
									if (action === 'select') {
										setCategoriesFilter(
											categoriesFilter
												? Array.from(new Set([...categoriesFilter, value]))
												: [value],
										)
									} else {
										setCategoriesFilter(
											categoriesFilter
												? categoriesFilter.filter((f) => f !== value)
												: allCategoryDocIds.filter((id) => id !== value),
										)
									}
								}}
								projectId={projectId}
							/>

							<DateFilterSelect
								value={dateFilter}
								todayDate={referenceDateToUse}
								onAdvancedClick={() => {
									setShowAdvancedFiltersDialog(true)
								}}
								onChange={(value) => {
									if (value) {
										setDateFilter(value)
									} else {
										unsetDateFilter()
									}
									setLastDateFilterInteractionDate(endOfToday())
								}}
							/>
						</Stack>
					</Stack>

					{!!dateFilter ||
					(categoriesFilter &&
						categoriesFilter.length > 0 &&
						!isArrayEqual(allCategoryDocIds, categoriesFilter)) ? (
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
									unsetCategoriesFilter()
									unsetDateFilter()
								}}
							>
								{t(m.clearFilters)}
							</Button>

							{dateFilter ? (
								<FilterPill
									label={
										dateFilter.type === 'range'
											? t(m.dateFilterOptionCustom, {
													start: new Date(dateFilter.start),
													end: new Date(dateFilter.end),
												})
											: getDateFilterOptionDisplayedValue(dateFilter, t)
									}
									color={LIGHT_GREY}
									onRemove={() => {
										unsetDateFilter()
									}}
								/>
							) : null}

							{categoriesFilter &&
							categoriesFilter.length > 0 &&
							!isArrayEqual(allCategoryDocIds, categoriesFilter)
								? filteredCategories.map((category) => {
										return (
											<FilterPill
												key={category.docId}
												color={
													category.color ? alpha(category.color, 0.1) : WHITE
												}
												label={category.name}
												onRemove={() => {
													const updatedFilter = categoriesFilter.filter(
														(f) => f !== category.docId,
													)

													if (updatedFilter.length === 0) {
														unsetCategoriesFilter()
													} else {
														setCategoriesFilter(updatedFilter)
													}
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
														router.navigate({
															to: '.',
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
														router.navigate({
															to: '/app/projects/$projectId/observations/$observationDocId',
															params: { projectId, observationDocId: docId },
														})
													} else {
														router.navigate({
															to: '/app/projects/$projectId/tracks/$trackDocId',
															params: { projectId, trackDocId: docId },
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
						categoriesFilter={categoriesFilter}
						dateFilter={dateFilter}
						filterReferenceDate={referenceDateToUse}
						onCancel={() => {
							setShowAdvancedFiltersDialog(undefined)
						}}
						onDateFilterChange={() => {
							setLastDateFilterInteractionDate(endOfToday())
						}}
						onSubmit={(value) => {
							if (value.categories) {
								setCategoriesFilter(value.categories)
							} else {
								unsetCategoriesFilter()
							}

							if (value.date) {
								setDateFilter(value.date)
							} else {
								unsetDateFilter()
							}

							setShowAdvancedFiltersDialog(undefined)
							setLastDateFilterInteractionDate(endOfToday())
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

function CategoriesFilterSelect({
	groupedByCategoryCount,
	selected,
	options,
	onAdvancedClick,
	onChange,
	onDeselectAll,
	onSelectAll,
	projectId,
}: {
	groupedByCategoryCount: Record<string, number>
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

	const allSelected =
		new Set(options.map((o) => o.docId)).difference(
			new Set(selected.map((s) => s.docId)),
		).size === 0

	return (
		<FilterSelect
			multiSelect
			displayedValue={
				<Stack direction="row" sx={{ gap: 2 }}>
					<Icon
						aria-hidden
						name="material-symbols-apps"
						htmlColor={BLUE_GREY}
					/>

					{allSelected
						? t(m.categoriesFilterAll)
						: t(m.categoriesFilterValue, { count: selected.length })}
				</Stack>
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
							? m.categoriesFilterSelectAll
							: m.categoriesFilterDeselectAll,
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
					{t(m.categoriesFilterAdvanced)}
				</Button>
			}
		>
			{options.map((category) => {
				const isSelected = !!selected.find((f) => f.docId === category.docId)

				const count = groupedByCategoryCount[category.docId] || 0

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
							sx={{ alignItems: 'center', gap: 2, overflow: 'auto', flex: 1 }}
						>
							<Checkbox
								checked={isSelected}
								slotProps={{ input: { tabIndex: -1 } }}
								sx={{ padding: 0 }}
							/>

							<Stack
								direction="row"
								sx={{
									alignItems: 'center',
									flex: 1,
									gap: 2,
									overflow: 'auto',
								}}
							>
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
													altText={t(m.categoriesFilterCategoryIconAlt, {
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
										display: 'flex',
										flex: 1,
										flexDirection: 'row',
										gap: 2,
										overflow: 'hidden',
									}}
								>
									<Typography
										component="span"
										variant="inherit"
										sx={{
											flex: 1,
											overflow: 'hidden',
											textOverflow: 'ellipsis',
											whiteSpace: 'nowrap',
										}}
									>
										{category.name}
									</Typography>

									<Typography
										component="span"
										variant="inherit"
										color="textSecondary"
										sx={{ fontVariantNumeric: 'tabular-nums' }}
									>
										{count}
									</Typography>
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
	todayDate,
	onAdvancedClick,
	onChange,
	value,
}: {
	todayDate: Date
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
					end: formatISO(addDays(todayDate, 1), { representation: 'date' }),
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
						start: formatISO(subDays(todayDate, value.value), {
							representation: 'date',
						}),
						end: formatISO(addDays(todayDate, 1), {
							representation: 'date',
						}),
					},
				}
			}
			case 'same': {
				const startDate =
					value.unit === 'month'
						? startOfMonth(todayDate)
						: startOfYear(todayDate)

				return {
					id: `same-${value.unit}` as const,
					displayedValue,
					inputValues: {
						start: formatISO(startDate, { representation: 'date' }),
						end: formatISO(addDays(todayDate, 1), {
							representation: 'date',
						}),
					},
				}
			}
		}
	}, [value, todayDate, t])

	return (
		<FilterSelect
			displayedValue={
				<Stack direction="row" sx={{ gap: 2 }}>
					<Icon
						aria-hidden
						name="material-symbols-schedule"
						htmlColor={BLUE_GREY}
					/>

					{selectedOption.displayedValue}
				</Stack>
			}
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
					{t(m.categoriesFilterAdvanced)}
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
	categoriesFilterValue: {
		id: '$1.routes.app.projects.$projectId.-data-list.categoriesFilterValue',
		defaultMessage:
			'{count, plural, =0 {0 categories} one {# category} other {# categories}}',
		description: 'Text displayed describing the selected category filters.',
	},
	categoriesFilterAll: {
		id: '$1.routes.app.projects.$projectId.-data-list.categoriesFilterAll',
		defaultMessage: 'All Categories',
		description: 'Text shown when all categories are being shown.',
	},
	categoriesFilterDeselectAll: {
		id: '$1.routes.app.projects.$projectId.-data-list.categoriesFilterDeselectAll',
		defaultMessage: 'Deselect All',
		description: 'Text for button to deselect all categories.',
	},
	categoriesFilterSelectAll: {
		id: '$1.routes.app.projects.$projectId.-data-list.categoriesFilterSelectAll',
		defaultMessage: 'Select All',
		description: 'Text for button to select all categories.',
	},
	categoriesFilterCategoryIconAlt: {
		id: 'routes.app.projects.$projectId.-data-list.categoriesFilterCategoryIconAlt',
		defaultMessage: 'Icon for {name} category',
		description:
			'Alt text for icon image displayed for category (used for accessibility tools).',
	},
	categoriesFilterAdvanced: {
		id: '$1.routes.app.projects.$projectId.-data-list.categoriesFiltersAdvanced',
		defaultMessage: 'Advanced…',
		description: 'Text for button to clear all filters',
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
