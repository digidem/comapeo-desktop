import { Suspense, useEffect, useState } from 'react'
import {
	useDeleteDocument,
	useManyDocs,
	useOwnDeviceInfo,
	useOwnRoleInProject,
	useSingleDocByDocId,
} from '@comapeo/core-react'
import type { Field, Preset } from '@comapeo/schema'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Dialog from '@mui/material/Dialog'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { defineMessages, useIntl } from 'react-intl'
import * as v from 'valibot'

import { BLUE_GREY, DARKER_ORANGE, GREEN, WHITE } from '#renderer/src/colors.ts'
import {
	CategoryIconContainer,
	CategoryIconImage,
} from '#renderer/src/components/category-icon.tsx'
import { ErrorBoundary } from '#renderer/src/components/error-boundary.tsx'
import { ErrorDialog } from '#renderer/src/components/error-dialog.tsx'
import { GenericRouteNotFoundComponent } from '#renderer/src/components/generic-route-not-found-component.tsx'
import { Icon } from '#renderer/src/components/icon.tsx'
import {
	useGlobalEditingState,
	useGlobalEditingStateActions,
} from '#renderer/src/contexts/global-editing-state-store-context.ts'
import {
	COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
	COORDINATOR_ROLE_ID,
	CREATOR_ROLE_ID,
	getMatchingCategoryForDocument,
	type ObservationTagValue,
} from '#renderer/src/lib/comapeo.ts'
import { formatCoords } from '#renderer/src/lib/coordinate-format.ts'
import { customNotFound } from '#renderer/src/lib/navigation.ts'
import {
	getCoordinateFormatQueryOptions,
	getLocaleStateQueryOptions,
} from '#renderer/src/lib/queries/app-settings.ts'
import { createGlobalMutationsKey } from '#renderer/src/lib/queries/global-mutations.ts'
import { EditCategoryPanel } from './-edit-category-panel.tsx'
import {
	EditableFieldSection,
	ReadOnlyFieldSection,
} from './-field-sections.tsx'
import {
	EditableNotesSection,
	ReadOnlyNotesSection,
} from './-notes-section.tsx'
import {
	ObservationAttachmentError,
	ObservationAttachmentPending,
	ObservationAttachmentPreview,
} from './-observation-attachment.tsx'
import { getDisplayedTagValue, type EditableField } from './-shared.ts'

const SearchParamsSchema = v.object({
	fromTrackDocId: v.optional(v.string()),
})

export const Route = createFileRoute(
	'/app/projects/$projectId/observations/$observationDocId/',
)({
	validateSearch: SearchParamsSchema,
	loader: async ({ context, params }) => {
		const {
			clientApi,
			projectApi,
			queryClient,
			localeState: { value: lang },
			formatMessage,
		} = context
		const { projectId, observationDocId } = params

		try {
			const observation = await queryClient.ensureQueryData({
				queryKey: [
					COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
					'projects',
					projectId,
					'observation',
					observationDocId,
					{ lang },
				],
				queryFn: async () => {
					return projectApi.observation.getByDocId(observationDocId, {
						lang,
						mustBeFound: true,
					})
				},
			})

			if (observation.deleted) {
				throw new Error('Observation has been deleted')
			}
		} catch {
			throw customNotFound({
				data: {
					message: formatMessage(m.observationNotFound, {
						docId: observationDocId.slice(0, 7),
					}),
				},
			})
		}

		await Promise.all([
			queryClient.ensureQueryData({
				queryKey: [COMAPEO_CORE_REACT_ROOT_QUERY_KEY, 'client', 'device_info'],
				queryFn: async () => {
					return clientApi.getDeviceInfo()
				},
			}),
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
			queryClient.ensureQueryData({
				queryKey: [
					COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
					'projects',
					projectId,
					'preset',
					{ lang },
				],
				queryFn: async () => {
					return projectApi.preset.getMany({ lang })
				},
			}),
			queryClient.ensureQueryData({
				queryKey: [
					COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
					'projects',
					projectId,
					'field',
					{ lang },
				],
				queryFn: async () => {
					return projectApi.field.getMany({ lang })
				},
			}),
		])
	},
	notFoundComponent: GenericRouteNotFoundComponent,
	component: RouteComponent,
})

function RouteComponent() {
	const [pageState, setPageState] = useState<
		| { name: 'observation-details'; showCategoryEditSuccess: boolean }
		| { name: 'edit-category' }
		| { name: 'delete-observation-success' }
	>({ name: 'observation-details', showCategoryEditSuccess: false })

	const { projectId, observationDocId } = Route.useParams()
	const { fromTrackDocId } = Route.useSearch()

	useEffect(() => {
		let timeoutId: number | undefined

		if (
			pageState.name === 'observation-details' &&
			pageState.showCategoryEditSuccess
		) {
			timeoutId = window.setTimeout(() => {
				setPageState({
					name: 'observation-details',
					showCategoryEditSuccess: false,
				})
			}, 5_000)
		}

		return () => {
			if (timeoutId !== undefined) {
				clearTimeout(timeoutId)
			}
		}
	}, [pageState, setPageState])

	switch (pageState.name) {
		case 'edit-category': {
			return (
				<EditCategoryPanel
					projectId={projectId}
					observationDocId={observationDocId}
					onClose={(success) => {
						setPageState({
							name: 'observation-details',
							showCategoryEditSuccess: success,
						})
					}}
				/>
			)
		}
		case 'delete-observation-success': {
			return (
				<DeleteObservationSuccessPanel
					projectId={projectId}
					fromTrackDocId={fromTrackDocId}
				/>
			)
		}
		case 'observation-details': {
			return (
				<ObservationDetailsPanel
					observationDocId={observationDocId}
					onDeleteObservation={() => {
						setPageState({ name: 'delete-observation-success' })
					}}
					onEditCategory={() => {
						setPageState({ name: 'edit-category' })
					}}
					projectId={projectId}
					showCategoryUpdatedIndicator={pageState.showCategoryEditSuccess}
				/>
			)
		}
	}
}

function DeleteObservationSuccessPanel({
	projectId,
	fromTrackDocId,
}: {
	projectId: string
	fromTrackDocId?: string
}) {
	const router = useRouter()
	const { formatMessage: t } = useIntl()

	return (
		<Stack
			direction="column"
			flex={1}
			overflow="auto"
			justifyContent="space-between"
		>
			<Container maxWidth="xs">
				<Stack
					direction="column"
					padding={6}
					alignItems="center"
					flex={1}
					gap={6}
				>
					<Box padding={6}>
						<Icon
							name="material-check-circle-rounded"
							htmlColor={GREEN}
							size={160}
						/>
					</Box>

					<Typography variant="h1" fontWeight={500} textAlign="center">
						{t(m.deleteObservationSuccessPanelTitle)}
					</Typography>
				</Stack>
			</Container>

			<Box
				display="flex"
				flexDirection="column"
				gap={4}
				paddingX={6}
				paddingBottom={6}
				position="sticky"
				bottom={0}
				alignItems="center"
				zIndex={1}
			>
				<Button
					onClick={() => {
						if (router.history.canGoBack()) {
							router.history.back()
							return
						}

						if (fromTrackDocId) {
							router.navigate({
								to: '/app/projects/$projectId/tracks/$trackDocId',
								params: { projectId, trackDocId: fromTrackDocId },
								replace: true,
							})
						} else {
							router.navigate({
								to: '/app/projects/$projectId',
								params: { projectId },
								replace: true,
							})
						}
					}}
					fullWidth
					variant="outlined"
					sx={{ maxWidth: 400 }}
				>
					{t(
						fromTrackDocId
							? m.deleteObservationSuccessPanelReturnToTrack
							: m.deleteObservationSuccessPanelReturnToObservations,
					)}
				</Button>
			</Box>
		</Stack>
	)
}

const DELETE_OBSERVATION_MUTATION_KEY = createGlobalMutationsKey([
	'observation',
	'delete',
])

function ObservationDetailsPanel({
	observationDocId,
	onDeleteObservation,
	onEditCategory,
	projectId,
	showCategoryUpdatedIndicator,
}: {
	observationDocId: string
	onDeleteObservation: () => void
	onEditCategory: () => void
	projectId: string
	showCategoryUpdatedIndicator: boolean
}) {
	const { formatDate, formatMessage: t } = useIntl()

	const router = useRouter()

	const [
		showDeleteObservationConfirmation,
		setShowDeleteObservationConfirmation,
	] = useState(false)

	const { data: lang } = useSuspenseQuery({
		...getLocaleStateQueryOptions(),
		select: ({ value }) => value,
	})

	const { data: coordinateFormat } = useSuspenseQuery(
		getCoordinateFormatQueryOptions(),
	)

	const { data: observation } = useSingleDocByDocId({
		projectId,
		docType: 'observation',
		docId: observationDocId,
		lang,
	})
	const { data: categories } = useManyDocs({
		projectId,
		docType: 'preset',
		lang,
	})
	const { data: fields } = useManyDocs({
		projectId,
		docType: 'field',
		lang,
	})
	const category = getMatchingCategoryForDocument(observation, categories)
	const fieldsToDisplay = category ? getFieldsToDisplay(category, fields) : []

	const { data: ownRole } = useOwnRoleInProject({ projectId })
	const { data: ownDeviceInfo } = useOwnDeviceInfo()
	const canEdit =
		ownRole.roleId === COORDINATOR_ROLE_ID ||
		ownRole.roleId === CREATOR_ROLE_ID ||
		observation.createdBy === ownDeviceInfo.deviceId

	const deleteObservationDocument = useDeleteDocument({
		projectId,
		docType: 'observation',
	})
	const deleteObservation = useMutation({
		mutationKey: DELETE_OBSERVATION_MUTATION_KEY,
		mutationFn: async ({ docId }: { docId: string }) => {
			// NOTE: We intentionally do NOT update any documents that may reference the deleted observation (e.g. tracks).
			return deleteObservationDocument.mutateAsync({ docId })
		},
	})

	const globalEditingStateActions = useGlobalEditingStateActions()
	const globalEditingEntries = useGlobalEditingState()

	const isEditing = globalEditingEntries.length > 0

	const globalEditIdPrefix = `observations_${observationDocId}_edit`
	const activeObservationDetailsGlobalEditId = globalEditingEntries.find((e) =>
		e.startsWith(globalEditIdPrefix),
	)

	const notesGlobalEditId = `${globalEditIdPrefix}_notes`

	return (
		<>
			<Stack direction="column" flex={1} overflow="auto">
				<Stack
					direction="row"
					alignItems="center"
					component="nav"
					gap={4}
					padding={4}
					borderBottom={`1px solid ${BLUE_GREY}`}
				>
					<IconButton
						disabled={isEditing}
						onClick={() => {
							if (deleteObservation.status === 'pending') {
								return
							}

							if (router.history.canGoBack()) {
								router.history.back()
								return
							}

							router.navigate({
								to: '/app/projects/$projectId',
								params: { projectId },
								replace: true,
							})
						}}
					>
						<Icon name="material-arrow-back" size={30} />
					</IconButton>

					<Typography variant="h1" fontWeight={500}>
						{t(m.navTitle)}
					</Typography>
				</Stack>

				<Box
					display="flex"
					flexDirection="column"
					flex={1}
					overflow="auto"
					position="relative"
				>
					<Stack direction="column" paddingBlock={6} gap={6}>
						<Box paddingInline={6}>
							<Typography>
								{formatDate(observation.createdAt, {
									year: 'numeric',
									month: 'short',
									day: '2-digit',
									minute: '2-digit',
									hour: '2-digit',
									hourCycle: 'h12',
								})}
							</Typography>
						</Box>

						<Stack direction="column" paddingInline={6}>
							<Box border={`1px solid ${BLUE_GREY}`} borderRadius={2}>
								<Stack
									direction="row"
									alignItems="center"
									justifyContent="space-between"
									flexWrap="wrap"
									gap={4}
									padding={4}
								>
									<Stack direction="row" alignItems="center" gap={4}>
										<Box position="relative">
											{category ? (
												<CategoryIconContainer
													color={category.color || BLUE_GREY}
													applyBoxShadow
												>
													{category.iconRef?.docId ? (
														<CategoryIconImage
															altText={t(m.categoryIconAlt, {
																name:
																	category.name ||
																	t(m.observationCategoryNameFallback),
															})}
															iconDocumentId={category.iconRef.docId}
															projectId={projectId}
															imageStyle={{ width: 48, aspectRatio: 1 }}
														/>
													) : (
														<Icon name="material-place" size={40} />
													)}
												</CategoryIconContainer>
											) : (
												<CategoryIconContainer color={BLUE_GREY} applyBoxShadow>
													<Icon name="material-place" size={40} />
												</CategoryIconContainer>
											)}

											{showCategoryUpdatedIndicator ? (
												<Box
													bgcolor={GREEN}
													right={(theme) => theme.spacing(-1)}
													bottom={(theme) => theme.spacing(-1)}
													sx={{
														position: 'absolute',
														borderRadius: '50%',
														padding: 1,
														display: 'flex',
													}}
												>
													<Icon
														name="material-check"
														htmlColor={WHITE}
														size={20}
													/>
												</Box>
											) : null}
										</Box>

										<Typography variant="h2" fontWeight={500}>
											{category
												? category.name
												: t(m.observationCategoryNameFallback)}
										</Typography>
									</Stack>

									{canEdit ? (
										<Box display="flex" flex={0} justifyContent="center">
											<Button
												disabled={isEditing}
												variant="text"
												onClick={() => {
													onEditCategory()
												}}
											>
												{t(m.changeCategory)}
											</Button>
										</Box>
									) : null}
								</Stack>

								<Divider variant="fullWidth" sx={{ color: BLUE_GREY }} />

								<Stack direction="row" alignItems="center" padding={4} gap={3}>
									<Icon
										name="material-fmd-good-filled"
										htmlColor={DARKER_ORANGE}
									/>

									{typeof observation.lon === 'number' &&
									typeof observation.lat === 'number' ? (
										<Typography>
											{formatCoords({
												lon: observation.lon,
												lat: observation.lat,
												format: coordinateFormat,
											})}

											{typeof observation.metadata?.position?.coords
												.accuracy === 'number' ? (
												<Box component="span" marginInlineStart={4}>
													{t(m.locationAccuracy, {
														value:
															observation.metadata?.position?.coords.accuracy.toFixed(
																0,
															),
													})}
												</Box>
											) : null}
										</Typography>
									) : (
										<Typography>{t(m.noLocation)}</Typography>
									)}
								</Stack>
							</Box>
						</Stack>

						<Stack direction="column" gap={2} overflow="auto" paddingInline={6}>
							<Box display="flex" flexWrap="wrap" gap={4} overflow="auto">
								{observation.attachments.map((attachment) => {
									const key = `${attachment.driveDiscoveryId}/${attachment.type}/${attachment.name}/${attachment.hash}`

									return (
										<ErrorBoundary
											key={key}
											getResetKey={() => key}
											fallback={() => <ObservationAttachmentError />}
										>
											<Suspense fallback={<ObservationAttachmentPending />}>
												<ObservationAttachmentPreview
													attachment={attachment}
													projectId={projectId}
												/>
											</Suspense>
										</ErrorBoundary>
									)
								})}
							</Box>
						</Stack>

						<Divider
							variant="fullWidth"
							sx={{ bgcolor: BLUE_GREY, marginInline: 6 }}
						/>

						{canEdit ? (
							<EditableNotesSection
								disabled={
									!!activeObservationDetailsGlobalEditId &&
									activeObservationDetailsGlobalEditId !== notesGlobalEditId
								}
								onStartEditMode={() => {
									globalEditingStateActions.add(notesGlobalEditId)
								}}
								onStopEditMode={() => {
									globalEditingStateActions.remove(notesGlobalEditId)
								}}
								observationDocId={observationDocId}
								projectId={projectId}
							/>
						) : (
							<ReadOnlyNotesSection
								notes={observation.tags.notes?.toString()}
							/>
						)}

						<Divider
							variant="fullWidth"
							sx={{ bgcolor: BLUE_GREY, marginInline: 6 }}
						/>

						{fieldsToDisplay.length > 0 ? (
							<Stack direction="column" paddingInline={6} gap={4}>
								<Typography
									component="h2"
									variant="body1"
									textTransform="uppercase"
								>
									{t(m.detailsSectionTitle)}
								</Typography>

								<Stack direction="column" gap={3}>
									{fieldsToDisplay.map((field) => {
										const globalEditId = `${globalEditIdPrefix}_fields_${field.docId}`
										const existingTagValue = observation.tags[field.tagKey]

										if (!canEdit || !isEditableField(field)) {
											return (
												<ReadOnlyFieldSection
													key={field.docId}
													label={field.label}
													value={
														existingTagValue === undefined
															? undefined
															: getDisplayedTagValue({
																	tagValue: existingTagValue,
																	formatMessage: t,
																	selectionOptions:
																		field.type === 'selectOne' ||
																		field.type === 'selectMultiple'
																			? field.options
																			: undefined,
																})
													}
												/>
											)
										}

										if (existingTagValue === undefined) {
											return (
												<EditableFieldSection
													key={field.docId}
													field={field}
													disabled={
														!!activeObservationDetailsGlobalEditId &&
														activeObservationDetailsGlobalEditId !==
															globalEditId
													}
													onStartEditMode={() => {
														globalEditingStateActions.add(globalEditId)
													}}
													onStopEditMode={() => {
														globalEditingStateActions.remove(globalEditId)
													}}
													initialTagValue={existingTagValue}
													observationDocId={observationDocId}
													projectId={projectId}
												/>
											)
										}

										const coercedTagValue =
											existingTagValue === undefined
												? undefined
												: tryToCoerceTagValue(existingTagValue, field.type)

										// If the tag value cannot be coerced, render it as non-editable
										if (coercedTagValue === undefined) {
											return (
												<ReadOnlyFieldSection
													key={field.docId}
													label={field.label}
													value={
														existingTagValue === undefined
															? undefined
															: getDisplayedTagValue({
																	tagValue: existingTagValue,
																	formatMessage: t,
																	selectionOptions:
																		field.type === 'selectOne' ||
																		field.type === 'selectMultiple'
																			? field.options
																			: undefined,
																})
													}
												/>
											)
										}

										return (
											<ErrorBoundary
												key={field.docId}
												getResetKey={() => field.docId}
												fallback={() => (
													<ReadOnlyFieldSection
														key={field.docId}
														label={field.label}
														value={
															existingTagValue === undefined
																? undefined
																: getDisplayedTagValue({
																		tagValue: existingTagValue,
																		formatMessage: t,
																		selectionOptions:
																			field.type === 'selectOne' ||
																			field.type === 'selectMultiple'
																				? field.options
																				: undefined,
																	})
														}
													/>
												)}
											>
												<EditableFieldSection
													field={field}
													disabled={
														!!activeObservationDetailsGlobalEditId &&
														activeObservationDetailsGlobalEditId !==
															globalEditId
													}
													onStartEditMode={() => {
														globalEditingStateActions.add(globalEditId)
													}}
													onStopEditMode={() => {
														globalEditingStateActions.remove(globalEditId)
													}}
													initialTagValue={coercedTagValue}
													observationDocId={observationDocId}
													projectId={projectId}
												/>
											</ErrorBoundary>
										)
									})}
								</Stack>
							</Stack>
						) : null}
					</Stack>
				</Box>

				{canEdit ? (
					<>
						<Stack
							direction="column"
							gap={2}
							justifyContent="center"
							alignItems="center"
							borderTop={`1px solid ${BLUE_GREY}`}
							padding={6}
						>
							<IconButton
								disabled={isEditing}
								aria-labelledby="delete-observation-button-label"
								sx={{ border: `1px solid ${BLUE_GREY}` }}
								onClick={() => {
									setShowDeleteObservationConfirmation(true)
								}}
							>
								<Icon name="material-symbols-delete" />
							</IconButton>

							<Typography
								id="delete-observation-button-label"
								color={isEditing ? 'textDisabled' : undefined}
							>
								{t(m.deleteObservationButtonText)}
							</Typography>
						</Stack>

						<Dialog
							open={showDeleteObservationConfirmation}
							fullWidth
							maxWidth="sm"
						>
							<Stack direction="column">
								<Stack direction="column" gap={10} flex={1} padding={20}>
									<Stack direction="column" alignItems="center" gap={4}>
										<Icon name="material-error" color="error" size={72} />

										<Typography
											variant="h1"
											fontWeight={500}
											textAlign="center"
										>
											{t(m.deleteObservationConfirmationDialogTitle)}
										</Typography>
									</Stack>
								</Stack>

								<Box
									position="sticky"
									bottom={0}
									display="flex"
									flexDirection="row"
									justifyContent="space-between"
									gap={6}
									padding={6}
								>
									<Button
										fullWidth
										variant="outlined"
										onClick={
											deleteObservation.status === 'pending'
												? undefined
												: () => {
														setShowDeleteObservationConfirmation(false)
													}
										}
										sx={{ maxWidth: 400 }}
									>
										{t(m.deleteObservationConfirmationDialogCancel)}
									</Button>

									<Button
										fullWidth
										color="error"
										onClick={
											deleteObservation.status === 'pending'
												? undefined
												: () => {
														deleteObservation.mutate(
															{ docId: observationDocId },
															{
																onError: () => {
																	setShowDeleteObservationConfirmation(false)
																},
																onSuccess: () => {
																	setShowDeleteObservationConfirmation(false)
																	onDeleteObservation()
																},
															},
														)
													}
										}
										loading={deleteObservation.status === 'pending'}
										loadingPosition="start"
										startIcon={<Icon name="material-symbols-delete" />}
										sx={{ maxWidth: 400 }}
									>
										{t(m.deleteObservationConfirmationDialogConfirm)}
									</Button>
								</Box>
							</Stack>
						</Dialog>
					</>
				) : null}
			</Stack>

			<ErrorDialog
				open={deleteObservation.status === 'error'}
				errorMessage={deleteObservation.error?.toString()}
				onClose={() => {
					deleteObservation.reset()
				}}
			/>
		</>
	)
}

function isEditableField(field: Field): field is EditableField {
	if (field.type === 'UNRECOGNIZED' || field.type === 'type_unspecified') {
		return false
	}

	if (
		(field.type === 'selectMultiple' || field.type === 'selectOne') &&
		field.options === undefined
	) {
		return false
	}

	return true
}

/**
 * Coerce a tag value into another value that is compatible with a given field
 * definition.
 *
 * @param tagValue The value to attempt to coerce.
 * @param fieldType The field to use for coercion to another value.
 *
 * @returns The coerced tag value. If `undefined`, that means that the input tag
 *   value could not be coerced.
 */
function tryToCoerceTagValue(
	tagValue: ObservationTagValue,
	fieldType: EditableField['type'],
): ObservationTagValue | undefined {
	if (Array.isArray(tagValue)) {
		switch (fieldType) {
			case 'number': {
				const [firstElement, ...rest] = tagValue

				if (firstElement === undefined) {
					return undefined
				}

				return rest.length > 0
					? undefined
					: tryToCoerceTagValue(firstElement, fieldType)
			}
			case 'text': {
				return tagValue.join(', ')
			}
			case 'selectOne': {
				if (tagValue.length > 1) {
					return undefined
				}

				return tagValue[0]
			}
			case 'selectMultiple': {
				return tagValue
			}
		}
	}

	switch (fieldType) {
		case 'number': {
			if (tagValue === null) {
				return undefined
			}

			if (typeof tagValue === 'string') {
				const parsed = parseFloat(tagValue)
				if (isNaN(parsed)) {
					return undefined
				}

				return parsed
			}

			if (typeof tagValue === 'number') {
				return tagValue
			}

			if (typeof tagValue === 'boolean') {
				return undefined
			}

			return undefined
		}
		case 'text': {
			if (tagValue === null) {
				return ''
			}

			if (typeof tagValue === 'string') {
				return tagValue
			}

			if (typeof tagValue === 'number') {
				return tagValue.toString(10)
			}

			if (typeof tagValue === 'boolean') {
				return tagValue ? 'true' : 'false'
			}

			return undefined
		}
		case 'selectOne': {
			if (
				tagValue === null ||
				typeof tagValue === 'string' ||
				typeof tagValue === 'boolean'
			) {
				return tagValue
			}

			return undefined
		}
		case 'selectMultiple': {
			if (
				tagValue === null ||
				typeof tagValue === 'string' ||
				typeof tagValue === 'boolean'
			) {
				return [tagValue]
			}

			return undefined
		}
	}
}

function getFieldsToDisplay(category: Preset, fields: Array<Field>) {
	const result: Array<Field> = []

	for (const { docId } of category.fieldRefs) {
		const match = fields.find((f) => f.docId === docId)

		if (match) {
			result.push(match)
		}
	}

	return result
}

const m = defineMessages({
	navTitle: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.index.navTitle',
		defaultMessage: 'Observation',
		description: 'Title of the observation details page.',
	},
	categoryIconAlt: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.index.categoryIconAlt',
		defaultMessage: 'Icon for {name} category',
		description:
			'Alt text for icon image displayed for category (used for accessibility tools).',
	},
	observationCategoryNameFallback: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.index.observationCategoryNameFallback',
		defaultMessage: 'Observation',
		description: 'Fallback name for observation without a matching category.',
	},
	noLocation: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.index.noLocation',
		defaultMessage: 'No location',
		description:
			'Fallback for location when observation does not have location specified.',
	},
	unableToGetDurationTime: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.index.unableToGetDurationTime',
		defaultMessage: 'Unable to get duration time.',
		description:
			'Text displayed when the duration of an audio attachment cannot be determined.',
	},
	detailsSectionTitle: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.index.detailsSectionTitle',
		defaultMessage: 'Details',
		description: 'Title for details section.',
	},
	observationNotFound: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.index.observationNotFound',
		defaultMessage: 'Could not find observation with ID {docId}',
		description: 'Text displayed when observation cannot be found.',
	},
	changeCategory: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.index.changeCategory',
		defaultMessage: 'Change',
		description: 'Text for button to change category.',
	},
	deleteObservationButtonText: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.index.deleteObservationButtonText',
		defaultMessage: 'Delete',
		description: 'Text for delete observation button.',
	},
	deleteObservationConfirmationDialogTitle: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.index.deleteObservationConfirmationDialogTitle',
		defaultMessage: 'Delete Observation?',
		description: 'Text for title of delete observation confirmation dialog.',
	},
	deleteObservationConfirmationDialogConfirm: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.index.deleteObservationConfirmationDialogConfirm',
		defaultMessage: 'Yes, Delete',
		description:
			'Text for confirmation button of delete observation confirmation dialog.',
	},
	deleteObservationConfirmationDialogCancel: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.index.deleteObservationConfirmationDialogCancel',
		defaultMessage: 'Cancel',
		description:
			'Text for cancel button of delete observation confirmation dialog.',
	},
	deleteObservationSuccessPanelTitle: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.index.deleteObservationSuccessPanelTitle',
		defaultMessage: 'Observation Deleted',
		description: 'Title text for the successful observation deletion panel.',
	},
	deleteObservationSuccessPanelReturnToObservations: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.index.deleteObservationSuccessPanelReturnToObservations',
		defaultMessage: 'Return to Observations List',
		description:
			'Text for button to return to observations list in successful observation deletion panel.',
	},
	deleteObservationSuccessPanelReturnToTrack: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.index.deleteObservationSuccessPanelReturnToTrack',
		defaultMessage: 'Return to Track',
		description:
			'Text for button to return to track in successful observation deletion panel.',
	},
	locationAccuracy: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.index.locationAccuracy',
		defaultMessage: '± {value}m',
		description: 'Displayed accuracy for observation location in meters.',
	},
})
