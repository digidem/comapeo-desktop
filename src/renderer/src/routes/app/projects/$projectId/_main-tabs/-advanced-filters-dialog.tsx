import { useId, useState } from 'react'
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
import { isAfter } from 'date-fns'
import { defineMessages, useIntl } from 'react-intl'
import * as v from 'valibot'

import { BLUE_GREY, WHITE } from '../../../../../colors.ts'
import {
	CategoryIconContainer,
	CategoryIconImage,
} from '../../../../../components/category-icon.tsx'
import { Icon } from '../../../../../components/icon.tsx'
import { useAppForm } from '../../../../../hooks/forms.ts'
import { useIconSizeBasedOnTypography } from '../../../../../hooks/icon.ts'
import {
	dateFilterToDateRange,
	isDocumentIncludedByFilters,
	type DateFilter,
} from './-shared.ts'

const OnChangeSchema = v.object({
	startDate: v.union([v.date(), v.null()]),
	endDate: v.date(),
	categories: v.array(
		v.custom<Preset>((input) => {
			if (typeof input !== 'object') {
				return false
			}

			if (input === null) {
				return false
			}

			const hasSchemaName =
				'schemaName' in input && input.schemaName === 'preset'

			const hasDocId = 'docId' in input && typeof input.docId === 'string'

			return hasSchemaName && hasDocId
		}),
	),
})

export function AdvancedFiltersDialogContent({
	categories,
	categoryFilters,
	dateFilter,
	observationsWithCategory,
	onCancel,
	onSubmit,
	projectId,
	tracksWithCategory,
}: {
	categories: Array<Preset>
	categoryFilters: Array<Preset>
	dateFilter: DateFilter | null
	observationsWithCategory: Array<{ document: Observation; category?: Preset }>
	onCancel: () => void
	onSubmit: (value: { categories: Array<Preset> }) => void
	projectId: string
	tracksWithCategory: Array<{ document: Track; category?: Preset }>
}) {
	const { formatMessage: t } = useIntl()
	const formId = useId()

	const [stableNowDate] = useState(() => {
		return new Date()
	})

	const [initialDateRange] = useState(() => {
		if (!dateFilter) {
			return { start: null, end: stableNowDate }
		}

		return dateFilterToDateRange(dateFilter, stableNowDate)
	})

	const form = useAppForm({
		defaultValues: {
			startDate: initialDateRange.start,
			endDate: initialDateRange.end,
			categories: categoryFilters,
		},
		validators: { onChange: OnChangeSchema },
		onSubmit: ({ value }) => {
			onSubmit({ categories: value.categories })
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

			<Box sx={{ overflow: 'auto' }}>
				<Container maxWidth="md">
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
								{/* https://tanstack.com/form/latest/docs/framework/react/guides/linked-fields */}
								<form.AppField name="startDate">
									{(formField) => (
										<DesktopDatePicker
											disableFuture
											shouldDisableDate={(day) => {
												return isAfter(day, form.getFieldValue('endDate'))
											}}
											value={formField.state.value}
											label={t(m.advancedFiltersDateStartLabel)}
											onChange={(value) => {
												console.log('*** start', value)
												formField.setValue(value ? new Date(value) : null)
											}}
											slotProps={{
												field: { clearable: true },
												textField: { sx: { flex: 1 } },
											}}
										/>
									)}
								</form.AppField>

								<form.AppField name="endDate">
									{(formField) => (
										<DesktopDatePicker
											label={t(m.advancedFiltersDateEndLabel)}
											onChange={(value) => {
												formField.setValue(value ? new Date(value) : null)
											}}
											slotProps={{
												field: { clearable: true },
												textField: { sx: { flex: 1 } },
											}}
											value={formField.state.value}
										/>
									)}
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
													formField.clearValues()
												}}
											>
												{t(m.advancedFiltersCategoriesSectionDeselectAll)}
											</Button>
										</Stack>

										<FormControl
											error={formField.state.meta.errors[0]}
											component="fieldset"
										>
											<FormGroup
												sx={{
													display: 'grid',
													gridTemplateColumns: `repeat(${viewportIsNarrow ? 2 : 3}, 1fr)`,
													rowGap: 4,
													columnGap: 4,
												}}
											>
												{categories.map((category) => {
													const isSelected = !!formField.state.value.find(
														(c) => c.docId === category.docId,
													)

													return (
														<FormControlLabel
															disableTypography
															key={category.docId}
															control={
																<Checkbox
																	disableTouchRipple
																	checked={isSelected}
																	value={category.docId}
																/>
															}
															label={
																<Stack
																	direction="row"
																	sx={{ alignItems: 'center', gap: 2 }}
																>
																	<Box aria-hidden>
																		<CategoryIconContainer
																			color={category.color || BLUE_GREY}
																		>
																			{category.iconRef?.docId ? (
																				<CategoryIconImage
																					altText={t(
																						m.advancedFiltersCategoryIconAlt,
																						{ name: category.name },
																					)}
																					iconDocumentId={
																						category.iconRef.docId
																					}
																					projectId={projectId}
																					imageStyle={{
																						width: categoryIconSize,
																						aspectRatio: 1,
																					}}
																				/>
																			) : (
																				<Icon
																					name="material-place"
																					size={categoryIconSize}
																				/>
																			)}
																		</CategoryIconContainer>
																	</Box>

																	<Typography>{category.name}</Typography>
																</Stack>
															}
															onChange={(_event, checked) => {
																formField.handleChange((prev) => {
																	return checked
																		? [...prev, category]
																		: prev.filter(
																				(p) => p.docId !== category.docId,
																			)
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
						return [...observationsWithCategory, ...tracksWithCategory].filter(
							(document) =>
								isDocumentIncludedByFilters(document, {
									categories: state.values.categories,
								}),
						).length
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
													categories: state.values.categories,
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
				</form.Subscribe>
			</Box>
		</Stack>
	)
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
		id: '$1.routes.app.projects.$projectId.index.advancedFiltersDateStartLabel',
		defaultMessage: 'Start Date',
		description: 'Label for start date input in advanced filters dialog.',
	},
	advancedFiltersDateEndLabel: {
		id: '$1.routes.app.projects.$projectId.index.advancedFiltersDateEndLabel',
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
})
