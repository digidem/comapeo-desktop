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
import ButtonBase from '@mui/material/ButtonBase'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import Fade from '@mui/material/Fade'
import IconButton from '@mui/material/IconButton'
import InputBase from '@mui/material/InputBase'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import Popper from '@mui/material/Popper'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'
import { captureException, captureMessage } from '@sentry/react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useVirtualizer } from '@tanstack/react-virtual'
import { defineMessages, useIntl } from 'react-intl'

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
import { ErrorBoundary } from '../../../../../components/error-boundary.tsx'
import { Icon } from '../../../../../components/icon.tsx'
import { IconButtonLink } from '../../../../../components/link.tsx'
import { useIconSizeBasedOnTypography } from '../../../../../hooks/icon.ts'
import {
	getMatchingCategoryForDocument,
	type Attachment,
} from '../../../../../lib/comapeo.ts'
import { getLocaleStateQueryOptions } from '../../../../../lib/queries/app-settings.ts'
import type { HighlightedDocument } from './-shared.ts'
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

	const { highlightedDocument } = useSearch({
		from: '/app/projects/$projectId/_main-tabs',
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

	const [categoryFilters, setCategoryFilters] = useState<Array<Preset>>([])

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
		let result = [...observationsWithCategory, ...tracksWithCategory]

		if (categoryFilters.length > 0) {
			const categoryIdsToInclude = new Set(categoryFilters.map((c) => c.docId))

			result = result.filter((item) => {
				if (!item.category?.docId) {
					return false
				}

				return categoryIdsToInclude.has(item.category.docId)
			})
		}

		return result.sort((a, b) => {
			return a.document.createdAt < b.document.createdAt ? 1 : -1
		})
	}, [observationsWithCategory, tracksWithCategory, categoryFilters])

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

	const removeFilterButtonSize = useIconSizeBasedOnTypography({
		typographyVariant: 'body1',
		multiplier: 0.75,
	})

	const filterIconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'button',
	})

	return (
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
								<Icon name="material-file-download" size={downloadButtonSize} />
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
								categories={categories}
								categoryFilters={categoryFilters}
								onChange={setCategoryFilters}
							/>
						</Stack>

						<Stack
							direction="row"
							sx={{ gap: 2, flex: 1, alignItems: 'center' }}
						>
							<Icon
								name="material-symbols-schedule"
								htmlColor={BLUE_GREY}
								size={filterIconSize}
							/>

							<Box
								sx={{
									flex: 1,
									border: `1px solid orange`,
									alignSelf: 'stretch',
									minWidth: 100,
								}}
							/>
						</Stack>
					</Stack>
				</Stack>

				{categoryFilters.length > 0 ? (
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
								setCategoryFilters([])
							}}
						>
							{t(m.clearFiltersButton)}
						</Button>

						{categoryFilters.map((category) => {
							return (
								<Stack
									direction="row"
									key={category.docId}
									sx={{
										alignItems: 'center',
										border: `1px solid ${BLUE_GREY}`,
										justifyContent: 'space-between',
										borderRadius: 2,
										paddingInline: 4,
										gap: 4,
										backgroundColor: category.color
											? alpha(category.color, 0.1)
											: WHITE,
									}}
								>
									<Typography sx={{ whiteSpace: 'nowrap' }}>
										{category.name}
									</Typography>

									<IconButton
										onClick={() => {
											setCategoryFilters((prev) =>
												prev.filter((p) => p.docId !== category.docId),
											)
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
						})}
					</Stack>
				) : null}

				<Box
					sx={{
						overflow: 'auto',
						display: 'flex',
						flexDirection: 'column',
						flex: 1,
					}}
				>
					<List
						component="ul"
						ref={listRef}
						disablePadding
						sx={{ overflow: 'auto', scrollbarColor: 'initial' }}
					>
						<Box
							ref={rowVirtualizer.containerRef}
							sx={{ position: 'relative', width: '100%' }}
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
															highlightedDocument: {
																type,
																docId,
																from: 'list',
															},
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
	categories,
	categoryFilters,
	onChange,
}: {
	categories: Array<Preset>
	categoryFilters: Array<Preset>
	onChange: (value: Array<Preset>) => void
}) {
	const { formatMessage: t } = useIntl()

	const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null)

	const [lastFocusedCategoryItem, setLastFocusedCategoryItem] = useState<
		string | null
	>(null)

	const categoryItemsListRef = useRef<HTMLUListElement>(null)

	const showAllItemId = useId()

	function focusCategoryItem() {
		if (!categoryItemsListRef.current) {
			return
		}

		const itemToFocus = categoryItemsListRef.current.querySelector(
			`[role="option"][data-item-id="${lastFocusedCategoryItem || showAllItemId}"]`,
		)

		if (itemToFocus instanceof HTMLElement) {
			itemToFocus.focus()
		}
	}

	return (
		<ClickAwayListener
			onClickAway={() => {
				setAnchorElement(null)
			}}
		>
			<Box
				onKeyDown={(event) => {
					if (event.key === 'Escape') {
						setAnchorElement(null)
					}
				}}
				sx={{ display: 'flex', flex: 1 }}
			>
				<ButtonBase
					type="button"
					aria-expanded={!!anchorElement}
					aria-haspopup="listbox"
					disableRipple
					disableTouchRipple
					role="combobox"
					onClick={(event) => {
						setAnchorElement((prev) => (prev ? null : event.currentTarget))
					}}
					onKeyDown={(event) => {
						if (event.key === 'Enter' && !anchorElement) {
							event.preventDefault()
							setAnchorElement(event.currentTarget)
						}
					}}
					sx={{
						flex: 1,
						borderRadius: 2,
						justifyContent: 'flex-start',
						outline: (theme) => `1px solid ${theme.palette.action.disabled}`,
						'&:focus': {
							outline: (theme) => `2px solid ${theme.palette.primary.main}`,
						},
					}}
				>
					<Stack
						direction="row"
						sx={{
							flex: 1,
							overflow: 'hidden',
							padding: 2,
							position: 'relative',
						}}
					>
						<Typography
							variant="button"
							sx={{
								flex: 1,
								overflow: 'hidden',
								whiteSpace: 'nowrap',
								textOverflow: 'ellipsis',
								textAlign: 'start',
							}}
						>
							{categoryFilters.length === 0
								? t(m.categoryFilterShowAll)
								: t(m.categoryFilterValue, { count: categoryFilters.length })}
						</Typography>

						<Icon
							name="material-expand-more-rounded"
							sx={{ transform: anchorElement ? 'rotate(180deg)' : undefined }}
							htmlColor={DARK_GREY}
						/>
					</Stack>

					<InputBase
						readOnly
						value={categoryFilters.map((c) => c.name).join(', ')}
						slotProps={{
							input: { tabIndex: -1 },
						}}
						sx={{
							position: 'absolute',
							left: 0,
							bottom: 0,
							visibility: 'hidden',
						}}
					/>
				</ButtonBase>

				<Popper
					placement="bottom-start"
					transition
					sx={{ zIndex: 1 }}
					disablePortal
					modifiers={[
						{ name: 'offset', options: { offset: [0, 8] } },
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
										overflow: 'hidden',
										bgcolor: WHITE,
										boxShadow: (theme) => theme.shadows[5],
										borderRadius: 2,
										scrollbarColor: 'initial',
									}}
								>
									<Stack
										direction="column"
										sx={{ maxHeight: '50dvh', position: 'relative' }}
									>
										<Stack
											component={List}
											disablePadding
											role="listbox"
											aria-multiselectable
											ref={categoryItemsListRef}
											sx={{ overflow: 'auto' }}
											onFocus={(event) => {
												if (event.currentTarget === event.target) {
													event.preventDefault()
													focusCategoryItem()
												}
											}}
											onKeyDown={(event) => {
												switch (event.key) {
													case 'ArrowDown': {
														if (
															'nextElementSibling' in event.target &&
															event.target.nextElementSibling instanceof
																HTMLElement
														) {
															event.preventDefault()
															event.target.nextElementSibling.focus()
														}

														return
													}
													case 'ArrowUp': {
														if (
															'previousElementSibling' in event.target &&
															event.target.previousElementSibling instanceof
																HTMLElement
														) {
															event.preventDefault()
															event.target.previousElementSibling.focus()
														}

														return
													}
												}
											}}
										>
											<ListItemButton
												role="option"
												disableGutters
												disableRipple
												tabIndex={-1}
												sx={{
													padding: 4,
													borderBottom: `1px solid ${BLUE_GREY}`,
												}}
												data-item-id={showAllItemId}
												onFocus={() => {
													setLastFocusedCategoryItem(showAllItemId)
												}}
												onClick={() => {
													if (categoryFilters.length === 0) {
														return
													}

													onChange([])
												}}
											>
												<Stack
													direction="row"
													sx={{
														gap: 2,
														alignItems: 'center',
														overflow: 'auto',
													}}
												>
													<Checkbox
														disableRipple
														checked={categoryFilters.length === 0}
														slotProps={{
															input: {
																'aria-label': 'controlled',
																tabIndex: -1,
															},
														}}
														sx={{ padding: 0 }}
													/>

													<Typography
														sx={{
															whiteSpace: 'nowrap',
															overflow: 'hidden',
															textOverflow: 'ellipsis',
														}}
													>
														{t(m.categoryFilterShowAll)}
													</Typography>
												</Stack>
											</ListItemButton>

											{categories.map((category) => {
												const isSelected = !!categoryFilters.find(
													(f) => f.docId === category.docId,
												)

												return (
													<ListItemButton
														key={category.docId}
														role="option"
														disableGutters
														disableRipple
														tabIndex={-1}
														data-item-id={category.docId}
														onFocus={() => {
															setLastFocusedCategoryItem(category.docId)
														}}
														sx={{ padding: 4 }}
														onClick={() => {
															onChange(
																isSelected
																	? categoryFilters.filter(
																			(f) => f.docId !== category.docId,
																		)
																	: [...categoryFilters, category],
															)
														}}
													>
														<Stack
															direction="row"
															sx={{
																alignItems: 'center',
																gap: 2,
																overflow: 'auto',
															}}
														>
															<Checkbox
																checked={isSelected}
																slotProps={{
																	input: {
																		'aria-label': 'controlled',
																		tabIndex: -1,
																	},
																}}
																sx={{ padding: 0 }}
															/>

															<Typography
																sx={{
																	whiteSpace: 'nowrap',
																	overflow: 'hidden',
																	textOverflow: 'ellipsis',
																}}
															>
																{category.name}
															</Typography>
														</Stack>
													</ListItemButton>
												)
											})}
										</Stack>

										<Box
											sx={{
												position: 'sticky',
												bottom: 0,
												right: 0,
												left: 0,
												padding: 2,
												backgroundColor: WHITE,
												borderTop: `1px solid ${BLUE_GREY}`,
											}}
										>
											<Button
												fullWidth
												variant="outlined"
												sx={{ maxWidth: 400 }}
												onKeyDown={(event) => {
													if (event.key !== 'Tab') {
														return
													}

													if (event.shiftKey) {
														event.preventDefault()
														focusCategoryItem()
													} else {
														// TODO: Close popper
													}
												}}
											>
												{t(m.categoryFilterAdvanced)}
											</Button>
										</Box>
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
	clearFiltersButton: {
		id: '$1.routes.app.projects.$projectId.-data-list.clearFiltersButton',
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
	categoryFilterShowAll: {
		id: '$1.routes.app.projects.$projectId.-data-list.categoryFilterShowAll',
		defaultMessage: 'Show All',
		description: 'Text shown when all categories are being shown.',
	},
	categoryFilterAdvanced: {
		id: '$1.routes.app.projects.$projectId.-data-list.categoriesFiltersAdvanced',
		defaultMessage: 'Advanced…',
		description: 'Text for button to clear all filters',
	},
})
