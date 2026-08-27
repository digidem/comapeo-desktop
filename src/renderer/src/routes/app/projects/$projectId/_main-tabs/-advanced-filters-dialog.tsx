import { useId, useMemo, useState } from 'react'
import type { Observation, Preset, Track } from '@comapeo/core/schema.js'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Container from '@mui/material/Container'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker'
import { endOfDay, isAfter, isBefore, isEqual, min, startOfDay } from 'date-fns'
import { defineMessages, useIntl } from 'react-intl'
import * as v from 'valibot'

import { BLACK, BLUE_GREY, WHITE } from '../../../../../colors.ts'
import {
	CategoryIconContainer,
	CategoryIconImage,
} from '../../../../../components/category-icon.tsx'
import { Icon } from '../../../../../components/icon.tsx'
import { useAppForm } from '../../../../../hooks/forms.ts'
import { useIconSizeBasedOnTypography } from '../../../../../hooks/icon.ts'
import type { DateFilter } from '../../../../../lib/local-storage.ts'
import {
	dateFilterToDateRange,
	isDocumentIncludedByFilters,
	type CategoriesFilterOption,
} from './-shared.ts'

export function AdvancedFiltersDialogContent({
	categoriesFilter,
	dateFilter,
	filterReferenceDate,
	observationsWithCategory,
	onCancel,
	onDateFilterChange,
	onSubmit,
	options,
	projectId,
	tracksWithCategory,
}: {
	categoriesFilter: Array<string> | undefined
	dateFilter: DateFilter | undefined
	filterReferenceDate: Date
	observationsWithCategory: Array<{ document: Observation; category?: Preset }>
	onCancel: () => void
	onDateFilterChange?: () => void
	onSubmit: (values: { categories?: Array<string>; date?: DateFilter }) => void
	options: Array<CategoriesFilterOption>
	projectId: string
	tracksWithCategory: Array<{ document: Track; category?: Preset }>
}) {
	const { formatMessage: t } = useIntl()
	const formId = useId()

	const [initialDateRange] = useState(() => {
		if (!dateFilter) {
			return { start: null, end: null }
		}

		return dateFilterToDateRange(dateFilter, filterReferenceDate || new Date())
	})

	const advancedFiltersSchema = useMemo(() => {
		return v.pipe(
			v.object({
				startDate: v.union([v.date(), v.null()]),
				endDate: v.union([v.date(), v.null()]),
				categories: v.undefinedable(v.array(v.string())),
			}),
			v.check((input) => {
				if (input.startDate && input.endDate) {
					return isValidStartDate(input.startDate, input.endDate)
				}

				return true
			}, t(m.invalidStartDateError)),
		)
	}, [t])

	const form = useAppForm({
		defaultValues: {
			startDate: initialDateRange.start,
			endDate: initialDateRange.end,
			categories: categoriesFilter,
		} satisfies v.InferOutput<typeof advancedFiltersSchema>,
		validators: { onChange: advancedFiltersSchema },
		onSubmit: ({ value }) => {
			const parsed = v.parse(advancedFiltersSchema, value)

			onSubmit({
				categories: parsed.categories,
				date:
					parsed.startDate && parsed.endDate
						? {
								type: 'range',
								start: parsed.startDate.toISOString(),
								end: parsed.endDate.toISOString(),
							}
						: undefined,
			})
		},
	})

	const closeIconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'h1',
		multiplier: 1.25,
	})

	const categoryIconSize = useIconSizeBasedOnTypography({
		typographyVariant: 'body1',
		multiplier: 0.75,
	})

	const viewportIsNarrow = useMediaQuery((theme) =>
		theme.breakpoints.down('md'),
	)

	const oldestSelectableDate = startOfDay(
		min(
			[...observationsWithCategory, ...tracksWithCategory].map(
				({ document }) => new Date(document.createdAt),
			),
		),
	)

	return (
		<Stack direction="column" sx={{ flex: 1, overflow: 'auto' }}>
			<Stack
				direction="row"
				sx={{
					alignItems: 'center',
					backgroundColor: WHITE,
					borderBottom: `1px solid ${BLUE_GREY}`,
					gap: 2,
					left: 0,
					padding: 4,
					position: 'sticky',
					right: 0,
					top: 0,
				}}
			>
				<IconButton onClick={onCancel}>
					<Icon name="material-close" size={closeIconSize} />
				</IconButton>

				<Typography variant="h1" sx={{ fontWeight: 500 }}>
					{t(m.advancedFiltersTitle)}
				</Typography>
			</Stack>

			<Box sx={{ overflow: 'auto', flex: 1 }}>
				<Container maxWidth="lg">
					<Stack
						id={formId}
						direction="column"
						sx={{ flex: 1, gap: 10, overflow: 'auto', padding: 6 }}
						component="form"
						onSubmit={(event) => {
							event.preventDefault()
							if (form.state.isSubmitting) return
							form.handleSubmit()
						}}
					>
						<Stack direction="column" sx={{ gap: 4 }}>
							<Stack
								direction="row"
								sx={{
									alignItems: 'center',
									borderBottom: `1px solid ${BLUE_GREY}`,
									gap: 2,
									padding: 2,
								}}
							>
								<Icon name="material-symbols-schedule" htmlColor={BLUE_GREY} />

								<Typography sx={{ fontWeight: 500 }}>
									{t(m.advancedFiltersDateSectionTitle)}
								</Typography>
							</Stack>

							<Stack direction="row" sx={{ gap: 4, paddingBlock: 4 }}>
								<form.AppField
									name="startDate"
									validators={{
										onChangeListenTo: ['endDate'],
										onChange: ({ value, fieldApi }) => {
											if (!value) {
												return undefined
											}

											const endDate = fieldApi.form.getFieldValue('endDate')

											if (!endDate) {
												return undefined
											}

											if (!isValidStartDate(value, endDate)) {
												return new Error(t(m.invalidStartDateError))
											}
										},
									}}
								>
									{(formField) => {
										const error = formField.state.meta.errors[0]

										return (
											<DesktopDatePicker
												disableFuture
												shouldDisableDate={(day) => {
													if (isBefore(day, oldestSelectableDate)) {
														return true
													}

													const endDate = form.getFieldValue('endDate')

													if (!endDate) {
														return false
													}

													return isAfter(day, endDate)
												}}
												value={formField.state.value}
												label={t(m.advancedFiltersDateStartLabel)}
												onChange={(value) => {
													formField.handleChange(
														value ? startOfDay(value) : null,
													)

													onDateFilterChange?.()
												}}
												slotProps={{
													field: { clearable: true },
													textField: {
														error: !!error,
														helperText: error?.message,
														sx: { flex: 1 },
													},
												}}
											/>
										)
									}}
								</form.AppField>

								<form.AppField
									name="endDate"
									validators={{
										onChangeListenTo: ['startDate'],
										onChange: ({ value, fieldApi }) => {
											if (!value) {
												return undefined
											}

											const startDate = fieldApi.form.getFieldValue('startDate')

											if (!startDate) {
												return undefined
											}

											if (!isValidStartDate(startDate, value)) {
												return new Error(t(m.invalidEndDateError))
											}
										},
									}}
								>
									{(formField) => {
										const error = formField.state.meta.errors[0]

										return (
											<DesktopDatePicker
												label={t(m.advancedFiltersDateEndLabel)}
												disableFuture
												shouldDisableDate={(day) => {
													if (isBefore(day, oldestSelectableDate)) {
														return true
													}

													const startDate = form.getFieldValue('startDate')

													if (!startDate) {
														return false
													}

													return isBefore(day, startDate)
												}}
												onChange={(value) => {
													formField.handleChange(value ? endOfDay(value) : null)

													onDateFilterChange?.()
												}}
												slotProps={{
													field: { clearable: true },
													textField: {
														error: !!error,
														helperText: error?.message,
														sx: { flex: 1 },
													},
												}}
												value={formField.state.value}
											/>
										)
									}}
								</form.AppField>
							</Stack>
						</Stack>

						<Stack direction="column" sx={{ gap: 4 }}>
							<form.Field name="categories">
								{(formField) => (
									<>
										<Stack
											direction="row"
											sx={{
												borderBottom: `1px solid ${BLUE_GREY}`,
												gap: 6,
												justifyContent: 'space-between',
											}}
										>
											<Stack
												direction="row"
												sx={{ alignItems: 'center', gap: 2, padding: 2 }}
											>
												<Icon
													name="material-symbols-apps"
													htmlColor={BLUE_GREY}
												/>

												<Typography sx={{ fontWeight: 500 }}>
													{t(m.advancedFiltersCategoriesSectionTitle)}
												</Typography>
											</Stack>

											<Button
												variant="text"
												size="small"
												onClick={() => {
													if (
														formField.state.value === undefined ||
														formField.state.value.length > 0
													) {
														formField.clearValues()
													} else {
														formField.handleChange(options.map((o) => o.id))
													}
												}}
											>
												{t(
													formField.state.value === undefined ||
														formField.state.value.length > 0
														? m.advancedFiltersCategoriesSectionDeselectAll
														: m.advancedFiltersCategoriesSectionSelectAll,
												)}
											</Button>
										</Stack>

										<FormControl component="fieldset">
											<FormGroup
												sx={{
													display: 'grid',
													gridTemplateColumns: `repeat(${viewportIsNarrow ? 2 : 3}, 1fr)`,
													rowGap: 4,
													columnGap: 4,
												}}
											>
												{options.map((option) => {
													const isSelected = formField.state.value
														? !!formField.state.value.find(
																(filterDocId) => option.id === filterDocId,
															)
														: true

													return (
														<FormControlLabel
															disableTypography
															key={option.id}
															control={
																<Checkbox
																	disableTouchRipple
																	checked={isSelected}
																	value={option.id}
																/>
															}

															label={
																<Stack
																	direction="row"
																	sx={{
																		alignItems: 'center',
																		flex: 1,
																		gap: 2,
																		overflow: 'hidden',
																	}}
																>
																	<Box aria-hidden>
																		<CategoryIconContainer
																			color={option.color || BLACK}
																		>
																			{option.iconId ? (
																				<CategoryIconImage
																					altText={t(
																						m.advancedFiltersCategoryIconAlt,
																						{ name: option.name },
																					)}
																					iconDocumentId={option.iconId}
																					projectId={projectId}
																					imageStyle={{
																						width: categoryIconSize,
																						aspectRatio: 1,
																					}}
																				/>
																			) : (
																				<Icon
																					name="material-symbols-indeterminate-question-box"
																					size={categoryIconSize}
																				/>
																			)}
																		</CategoryIconContainer>
																	</Box>

																	<Typography
																		sx={{
																			flex: 1,
																			display: 'flex',
																			flexDirection: 'row',
																			overflow: 'hidden',
																			gap: 2,
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
																			{option.name}
																		</Typography>

																		<Typography
																			component="span"
																			variant="inherit"
																			color="textSecondary"
																			sx={{
																				fontVariantNumeric: 'tabular-nums',
																			}}
																		>
																			{option.matchCount}
																		</Typography>
																	</Typography>
																</Stack>
															}
															onChange={(_event, checked) => {
																formField.handleChange((prev) => {
																	if (prev) {
																		return checked
																			? [...prev, option.id]
																			: prev.filter(
																					(previousOptionId) =>
																						previousOptionId !== option.id,
																				)
																	}

																	return checked ? [option.id] : prev
																})
															}}
															sx={{
																backgroundColor: isSelected
																	? (theme) =>
																			alpha(
																				theme.palette.primary.main,
																				theme.palette.action.selectedOpacity,
																			)
																	: undefined,
																borderRadius: 2,
																display: 'flex',
																margin: 0,
																overflow: 'auto',
																padding: 2,
																transition: (theme) =>
																	theme.transitions.create('background-color'),
																':hover': {
																	backgroundColor: (theme) =>
																		isSelected
																			? alpha(
																					theme.palette.primary.main,
																					theme.palette.action.activatedOpacity,
																				)
																			: theme.palette.action.hover,
																},
																':focus, :focus-within': {
																	backgroundColor: (theme) =>
																		isSelected
																			? alpha(
																					theme.palette.primary.main,
																					theme.palette.action.focusOpacity,
																				)
																			: theme.palette.action.focus,
																},
															}}
														/>
													)
												})}
											</FormGroup>
										</FormControl>
									</>
								)}
							</form.Field>
						</Stack>
					</Stack>
				</Container>
			</Box>

			<Box
				sx={{
					backgroundColor: WHITE,
					borderTop: `1px solid ${BLUE_GREY}`,
					bottom: 0,
					display: 'flex',
					flexDirection: 'row',
					justifyContent: 'center',
					left: 0,
					padding: 6,
					position: 'sticky',
					right: 0,
				}}
			>
				<form.Subscribe
					selector={(state) => {
						return [state.canSubmit, state.isSubmitting]
					}}
				>
					{([canSubmit, isSubmitting]) => {
						return (
							<Button
								type="submit"
								aria-disabled={!canSubmit || isSubmitting}
								form={formId}
								sx={{ maxWidth: 400 }}
							>
								<form.Subscribe
									selector={(state) => {
										return [
											...observationsWithCategory,
											...tracksWithCategory,
										].filter((document) =>
											isDocumentIncludedByFilters(document, {
												categories:
													state.values.categories || options.map((o) => o.id),
												date:
													state.values.startDate && state.values.endDate
														? {
																start: state.values.startDate,
																end: state.values.endDate,
															}
														: undefined,
											}),
										).length
									}}
								>
									{(filteredDocumentsCount) => {
										return t(m.advancedFiltersShowResults, {
											count: filteredDocumentsCount,
										})
									}}
								</form.Subscribe>
							</Button>
						)
					}}
				</form.Subscribe>
			</Box>
		</Stack>
	)
}

function isValidStartDate(start: Date, end: Date) {
	return isEqual(start, end) || isBefore(start, end)
}

const m = defineMessages({
	advancedFiltersCloseAccessibleLabel: {
		id: 'routes.app.projects.$projectId.index.advancedFiltersCloseAccessibleLabel',
		defaultMessage: 'Close',
		description:
			'Accessible label for button to close advanced filters dialog.',
	},
	advancedFiltersTitle: {
		id: '$1.routes.app.projects.$projectId.index.advancedFiltersTitle',
		defaultMessage: 'Advanced Filters',
		description: 'Title for advanced filters dialog.',
	},
	advancedFiltersDateSectionTitle: {
		id: '$1.routes.app.projects.$projectId.index.advancedFiltersDateSectionTitle',
		defaultMessage: 'Date',
		description: 'Title for date filter section in advanced filters dialog.',
	},
	advancedFiltersDateStartLabel: {
		id: 'routes.app.projects.$projectId.index.advancedFiltersDateStartLabel',
		defaultMessage: 'Start Date',
		description: 'Label for start date input in advanced filters dialog.',
	},
	advancedFiltersDateEndLabel: {
		id: 'routes.app.projects.$projectId.index.advancedFiltersDateEndLabel',
		defaultMessage: 'End Date',
		description: 'Label for end date input in advanced filters dialog.',
	},
	advancedFiltersCategoriesSectionTitle: {
		id: '$1.routes.app.projects.$projectId.index.advancedFiltersCategoriesSectionTitle',
		defaultMessage: 'Categories',
		description:
			'Title for categories filter section in advanced filters dialog.',
	},
	advancedFiltersCategoriesSectionDeselectAll: {
		id: '$1.routes.app.projects.$projectId.index.advancedFiltersCategoriesSectionDeselectAll',
		defaultMessage: 'Deselect All',
		description:
			'Text for button to deselect all in categories filter section in advanced filters dialog.',
	},
	advancedFiltersCategoriesSectionSelectAll: {
		id: '$1.routes.app.projects.$projectId.index.advancedFiltersCategoriesSectionSelectAll',
		defaultMessage: 'Select All',
		description:
			'Text for button to select all in categories filter section in advanced filters dialog.',
	},
	advancedFiltersCategoriesSectionNotCategorizedOption: {
		id: '$1.routes.app.projects.$projectId.index.advancedFiltersCategoriesSectionNotCategorizedOption',
		defaultMessage: 'Not categorized',
		description:
			'Text for category filter option for data without a matching category in advanced filters dialog.',
	},
	advancedFiltersCategoryIconAlt: {
		id: 'routes.app.projects.$projectId.index.advancedFiltersCategoryIconAlt',
		defaultMessage: 'Icon for {name} category',
		description:
			'Alt text for icon image displayed for category (used for accessibility tools).',
	},
	advancedFiltersShowResults: {
		id: '$1.routes.app.projects.$projectId.index.advancedFiltersShowResults',
		defaultMessage: 'Show {count, number} Results',
		description:
			'Text for submit button to apply selected filters in advanced filters dialog.',
	},
	invalidStartDateError: {
		id: '$1.routes.app.projects.$projectId.index.invalidStartDateError',
		defaultMessage: 'Start date must be earlier than end date.',
		description:
			'Text indicating invalid start date for custom date range filter.',
	},
	invalidEndDateError: {
		id: '$1.routes.app.projects.$projectId.index.invalidEndDateError',
		defaultMessage: 'End date must be later than start date.',
		description:
			'Text indicating invalid end date for custom date range filter.',
	},
})
