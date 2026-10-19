import { Suspense, useEffect, useId, useMemo, useState, type JSX } from 'react'
import {
	useDeleteDocument,
	useManyDocs,
	useOwnDeviceInfo,
	useOwnRoleInProject,
	useSingleDocByDocId,
} from '@comapeo/core-react'
import type { Field, Observation, Preset } from '@comapeo/core/schema.js'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import ButtonBase from '@mui/material/ButtonBase'
import Divider from '@mui/material/Divider'
import Fade from '@mui/material/Fade'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { captureException, captureMessage } from '@sentry/react'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { Block, createFileRoute, useRouter } from '@tanstack/react-router'
import {
	defineMessages,
	useIntl,
	type MessageValue,
	type NoMessageValues,
} from 'react-intl'
import * as v from 'valibot'

import {
	BLACK_00,
	BLACK_03,
	BLUE_05,
	BLUE_06,
	GREEN_00,
	ORANGE_00,
	WHITE_00,
} from '../../../../../../../../../shared/colors.ts'
import type { CoordinateFormat } from '../../../../../../../../../shared/coordinate-format.ts'
import type { UnitSystem } from '../../../../../../../../../shared/unit-system.ts'
import {
	CategoryIconContainer,
	CategoryIconImage,
} from '../../../../../../../components/category-icon.tsx'
import { DecentDialog } from '../../../../../../../components/decent-dialog.tsx'
import { DiscardEditsDialogContent } from '../../../../../../../components/discard-edits-dialog.tsx'
import { ErrorBoundary } from '../../../../../../../components/error-boundary.tsx'
import { ErrorDialogContent } from '../../../../../../../components/error-dialog.tsx'
import { GenericRouteNotFoundComponent } from '../../../../../../../components/generic-route-not-found-component.tsx'
import { Icon } from '../../../../../../../components/icon.tsx'
import { useIconSizeBasedOnTypography } from '../../../../../../../hooks/icon.ts'
import {
	COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
	COORDINATOR_ROLE_ID,
	CREATOR_ROLE_ID,
	getMatchingCategoryForDocument,
	isAudioAttachment,
	isPhotoAttachment,
	type ObservationTagValue,
} from '../../../../../../../lib/comapeo.ts'
import { formatCoords } from '../../../../../../../lib/coordinate-format.ts'
import { ExhaustivenessError } from '../../../../../../../lib/exhaustiveness-error.ts'
import { customNotFound } from '../../../../../../../lib/navigation.ts'
import {
	getCoordinateFormatQueryOptions,
	getLocaleStateQueryOptions,
	getUnitSystemQueryOptions,
} from '../../../../../../../lib/queries/app-settings.ts'
import { createGlobalMutationsKey } from '../../../../../../../lib/queries/global-mutations.ts'
import { DeleteConfirmationDialogContentLayout } from './-components/delete-confirmation-dialog-content-layout.tsx'
import { DeleteSuccessPanelLayout } from './-components/delete-success-panel-layout.tsx'
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
	ObservationAudioAttachmentPreview,
	ObservationPhotoAttachmentPreview,
	ObservationUnsupportedAttachmentPreview,
} from './-observation-attachment.tsx'
import {
	IsoTimestampSchema,
	getDisplayedTagValue,
	type EditableField,
} from './-shared.ts'

// NOTE: Vendored from Convert (https://github.com/jonahsnider/convert/blob/9e077c6d9cff8a43bc4b431c915712039353c5c0/src/conversions/measures/length.ts#L15)
const FOOT_TO_METER_RATIO = 0.3048

const SearchParamsSchema = v.object({ fromTrackDocId: v.optional(v.string()) })

export const Route = createFileRoute(
	'/app/projects/$projectId/_with-map-panel/observations/$observationDocId/',
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
			const observation = await queryClient.query({
				staleTime: 'static',
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
			queryClient.query({
				staleTime: 'static',
				queryKey: [COMAPEO_CORE_REACT_ROOT_QUERY_KEY, 'client', 'device_info'],
				queryFn: async () => {
					return clientApi.getDeviceInfo()
				},
			}),
			queryClient.query({
				staleTime: 'static',
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
			queryClient.query({
				staleTime: 'static',
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
			queryClient.query({
				staleTime: 'static',
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
			queryClient.query({
				staleTime: 'static',
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
	remountDeps: ({ params }) => {
		return params
	},
	notFoundComponent: GenericRouteNotFoundComponent,
	component: RouteComponent,
})

function RouteComponent() {
	const intl = useIntl()

	const router = useRouter()

	const [pageState, setPageState] = useState<
		| { name: 'observation-details'; showCategoryEditSuccess: boolean }
		| { name: 'edit-category' }
		| { name: 'delete-observation-success' }
	>({ name: 'observation-details', showCategoryEditSuccess: false })

	const { projectId, observationDocId } = Route.useParams()

	const fromTrackDocId = Route.useSearch({
		select: (state) => {
			return state.fromTrackDocId
		},
	})

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
				<DeleteSuccessPanelLayout
					action={
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
										search: (prev) => {
											return { ...prev, fromTrackId: undefined }
										},
										mask: {
											to: '/app/projects/$projectId/tracks/$trackDocId',
											params: { projectId, trackDocId: fromTrackDocId },
										},
										replace: true,
									})
								} else {
									router.navigate({
										to: '/app/projects/$projectId',
										params: { projectId },
										search: true,
										replace: true,
									})
								}
							}}
							sx={{ alignSelf: 'center' }}
							variant="text"
						>
							{intl.formatMessage(
								fromTrackDocId
									? m.deleteObservationSuccessPanelReturnToTrack
									: m.deleteObservationSuccessPanelReturnToObservations,
							)}
						</Button>
					}
					title={intl.formatMessage(m.deleteObservationSuccessPanelTitle)}
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
	const intl = useIntl()

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

	const { data: unitSystem } = useSuspenseQuery(getUnitSystemQueryOptions())

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
	const { data: fields } = useManyDocs({ projectId, docType: 'field', lang })
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

	const backIconSize = useIconSizeBasedOnTypography({
		variant: 'pageTitle',
		multiplier: 1.5,
	})

	const metadataIconSize = useIconSizeBasedOnTypography({
		variant: 'bodyCopy',
		multiplier: 1.5,
	})

	// NOTE: We only allow editing one thing at a time.
	// Otherwise we could represent as a list of IDs.
	const [activeEditId, setActiveEditId] = useState<string | null>(null)

	const editPrefixId = useId()
	const notesEditId = `${editPrefixId}-notes`

	return (
		<>
			<Stack direction="column" sx={{ flex: 1, overflow: 'auto' }}>
				<Stack
					component="header"
					direction="row"
					sx={{
						alignItems: 'center',
						borderBottom: `1px solid ${BLUE_05}`,
						gap: 2,
						padding: 4,
					}}
				>
					<IconButton
						aria-disabled={deleteObservation.status === 'pending'}
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
								search: (prev) => {
									return { ...prev, fromTrackDocId: undefined }
								},
								replace: true,
							})
						}}
						sx={{ color: (theme) => theme.palette.text.secondary }}
					>
						<Icon name="material-arrow-back" size={backIconSize} />
					</IconButton>

					<Typography variant="pageTitle">
						{intl.formatMessage(m.navTitle)}
					</Typography>
				</Stack>

				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						flex: 1,
						overflow: 'auto',
						position: 'relative',
					}}
				>
					<Stack direction="column" sx={{ paddingBlock: 6, gap: 6 }}>
						<Box sx={{ display: 'flex', justifyContent: 'center' }}>
							<Tooltip
								describeChild={false}
								placement="right-end"
								slots={{ transition: Fade }}
								slotProps={{
									tooltip: {
										style: {
											fontWeight: 'unset',
											maxWidth: 'unset',
											overflow: 'hidden',
											padding: 0,
										},
									},
									popper: {
										modifiers: [
											{ name: 'offset', options: { offset: [-4, 8] } },
										],
									},
								}}
								title={
									<ObservationMetadataPanel
										coordinateFormat={coordinateFormat}
										observation={observation}
										unitSystem={unitSystem}
									/>
								}
							>
								<Stack direction="row" sx={{ gap: 4 }}>
									<Typography
										tabIndex={0}
										sx={{
											textAlign: 'center',
											textDecoration: 'underline dashed',
											textUnderlineOffset: 8,
										}}
									>
										<time dateTime={observation.createdAt}>
											{intl.formatDate(observation.createdAt, {
												year: 'numeric',
												month: 'short',
												day: '2-digit',
												minute: '2-digit',
												hour: '2-digit',
												hourCycle: 'h12',
											})}
										</time>
									</Typography>

									<Icon
										name="comapeo-validated-badge"
										aria-hidden
										size={metadataIconSize}
									/>
								</Stack>
							</Tooltip>
						</Box>

						<Stack direction="column" sx={{ paddingInline: 6 }}>
							<Stack
								direction="column"
								sx={{
									border: `1px solid ${BLUE_05}`,
									borderRadius: 2,
									flex: 1,
								}}
							>
								{canEdit ? (
									<Tooltip
										placement="bottom"
										title={intl.formatMessage(m.changeCategory)}
									>
										<ButtonBase
											disableTouchRipple
											disabled={!!activeEditId}
											onClick={() => {
												onEditCategory()
											}}
											sx={{
												':disabled': {
													color: (theme) => theme.palette.text.disabled,
												},
												':hover, :focus': {
													background: (theme) => theme.alpha(BLUE_06, 0.5),
													transition: (theme) =>
														theme.transitions.create('background-color'),
												},
											}}
										>
											<CategoryDetails
												category={category}
												projectId={projectId}
												showEditIcon
												showUpdatedIndicator={showCategoryUpdatedIndicator}
											/>
										</ButtonBase>
									</Tooltip>
								) : (
									<CategoryDetails category={category} projectId={projectId} />
								)}

								<Divider />

								<Stack
									direction="row"
									sx={{ alignItems: 'center', padding: 4, gap: 3 }}
								>
									<Icon
										name="material-symbols-location-filled"
										htmlColor={ORANGE_00}
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
												<Box component="span" sx={{ marginInlineStart: 4 }}>
													{unitSystem === 'imperial'
														? intl.formatMessage(m.locationAccuracyFeet, {
																value: (
																	observation.metadata.position.coords
																		.accuracy * FOOT_TO_METER_RATIO
																).toFixed(0),
															})
														: intl.formatMessage(m.locationAccuracyMeters, {
																value:
																	observation.metadata.position.coords.accuracy.toFixed(
																		0,
																	),
															})}
												</Box>
											) : null}
										</Typography>
									) : (
										<Typography>{intl.formatMessage(m.noLocation)}</Typography>
									)}
								</Stack>
							</Stack>
						</Stack>

						<Stack
							direction="column"
							sx={{ gap: 2, overflow: 'auto', paddingInline: 6 }}
						>
							<Box
								sx={{
									display: 'flex',
									flexWrap: 'wrap',
									gap: 4,
									overflow: 'auto',
								}}
							>
								{observation.attachments.map((attachment) => {
									const key = `${attachment.driveDiscoveryId}/${attachment.type}/${attachment.name}/${attachment.hash}`

									let previewToRender: JSX.Element

									if (isPhotoAttachment(attachment)) {
										previewToRender = (
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
													<ObservationPhotoAttachmentPreview
														projectId={projectId}
														attachment={attachment}
														variant="thumbnail"
													/>
												)}
											>
												<ErrorBoundary
													getResetKey={() => key + ':original'}
													onError={() => {
														captureMessage('Failed to load original image', {
															level: 'info',
															extra: {
																driveId: attachment.driveDiscoveryId,
																name: attachment.name,
															},
														})
													}}
													fallback={() => (
														<ObservationPhotoAttachmentPreview
															projectId={projectId}
															attachment={attachment}
															variant="preview"
														/>
													)}
												>
													<ObservationPhotoAttachmentPreview
														projectId={projectId}
														attachment={attachment}
														variant="original"
													/>
												</ErrorBoundary>
											</ErrorBoundary>
										)
									} else if (isAudioAttachment(attachment)) {
										previewToRender = (
											<ObservationAudioAttachmentPreview
												projectId={projectId}
												attachment={attachment}
												variant="original"
											/>
										)
									} else {
										previewToRender = (
											<ObservationUnsupportedAttachmentPreview
												attachmentName={attachment.name}
											/>
										)
									}

									return (
										<ErrorBoundary
											key={key}
											getResetKey={() => key}
											onError={(err) => {
												captureException(
													new Error('Failed to load attachment'),
													{
														originalException: err,
														data: {
															driveId: attachment.driveDiscoveryId,
															name: attachment.name,
															type: attachment.type,
														},
													},
												)
											}}
											fallback={() => <ObservationAttachmentError />}
										>
											<Suspense fallback={<ObservationAttachmentPending />}>
												{previewToRender}
											</Suspense>
										</ErrorBoundary>
									)
								})}
							</Box>
						</Stack>

						<Divider sx={{ marginInline: 6 }} />

						{canEdit ? (
							<EditableNotesSection
								disabled={!!activeEditId && activeEditId !== notesEditId}
								onStartEditMode={() => {
									setActiveEditId(notesEditId)
								}}
								onStopEditMode={() => {
									setActiveEditId(null)
								}}
								observationDocId={observationDocId}
								projectId={projectId}
							/>
						) : (
							<ReadOnlyNotesSection
								notes={observation.tags.notes?.toString()}
							/>
						)}

						<Divider sx={{ marginInline: 6 }} />

						{fieldsToDisplay.length > 0 ? (
							<Stack direction="column" sx={{ paddingInline: 6, gap: 4 }}>
								<Typography component="h2" variant="sectionLabel">
									{intl.formatMessage(m.detailsSectionTitle)}
								</Typography>

								<Stack direction="column" sx={{ gap: 3 }}>
									{fieldsToDisplay.map((field) => {
										const editId = `${editPrefixId}/fields/${field.docId}`
										const existingTagValue = observation.tags[field.tagKey]

										let displayedReadOnlyValue =
											existingTagValue === undefined
												? undefined
												: getDisplayedTagValue({
														tagValue: existingTagValue,
														intl,
														selectionOptions:
															field.type === 'selectOne' ||
															field.type === 'selectMultiple'
																? field.options
																: undefined,
													})

										if (
											field.type === 'date' &&
											v.is(IsoTimestampSchema, displayedReadOnlyValue)
										) {
											displayedReadOnlyValue = intl.formatDate(
												displayedReadOnlyValue,
												{
													month: 'long',
													day: '2-digit',
													year: 'numeric',
												},
											)
										}

										if (!canEdit || !isEditableField(field)) {
											return (
												<ReadOnlyFieldSection
													key={field.docId}
													label={field.label}
													value={displayedReadOnlyValue}
												/>
											)
										}

										if (existingTagValue === undefined) {
											return (
												<EditableFieldSection
													key={field.docId}
													field={field}
													disabled={!!activeEditId && activeEditId !== editId}
													onStartEditMode={() => {
														setActiveEditId(editId)
													}}
													onStopEditMode={() => {
														setActiveEditId(null)
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

										// NOTE: If the tag value cannot be coerced, render it as non-editable
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
																	intl,
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
														value={displayedReadOnlyValue}
													/>
												)}
											>
												<EditableFieldSection
													field={field}
													disabled={!!activeEditId && activeEditId !== editId}
													onStartEditMode={() => {
														setActiveEditId(editId)
													}}
													onStopEditMode={() => {
														setActiveEditId(null)
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
							sx={{
								alignItems: 'center',
								borderTop: `1px solid ${BLUE_05}`,
								gap: 2,
								justifyContent: 'center',
								padding: 6,
							}}
						>
							<IconButton
								disabled={!!activeEditId}
								aria-labelledby="delete-observation-button-label"
								sx={{ border: `1px solid ${BLUE_05}` }}
								onClick={() => {
									setShowDeleteObservationConfirmation(true)
								}}
							>
								<Icon name="material-symbols-delete" />
							</IconButton>

							<Typography
								id="delete-observation-button-label"
								color={activeEditId ? 'textDisabled' : undefined}
							>
								{intl.formatMessage(m.deleteObservationButtonText)}
							</Typography>
						</Stack>

						<DecentDialog
							fullWidth
							maxWidth="sm"
							value={showDeleteObservationConfirmation || null}
						>
							{() => {
								const actionIsPending = deleteObservation.status === 'pending'

								return (
									<DeleteConfirmationDialogContentLayout
										actions={
											<Stack
												direction="row"
												sx={{
													flexWrap: 'wrap',
													gap: 4,
													justifyContent: 'center',
													padding: 6,
												}}
											>
												<Button
													fullWidth
													onClick={
														actionIsPending
															? undefined
															: () => {
																	setShowDeleteObservationConfirmation(false)
																}
													}
													startIcon={<Icon name="material-symbols-cancel" />}
													variant="outlined"
												>
													{intl.formatMessage(
														m.deleteObservationConfirmationDialogCancel,
													)}
												</Button>

												<Button
													color="error"
													fullWidth
													loading={actionIsPending}
													loadingPosition="start"
													onClick={
														actionIsPending
															? undefined
															: () => {
																	deleteObservation.mutate(
																		{ docId: observationDocId },
																		{
																			onError: () => {
																				setShowDeleteObservationConfirmation(
																					false,
																				)
																			},
																			onSuccess: () => {
																				setShowDeleteObservationConfirmation(
																					false,
																				)
																				onDeleteObservation()
																			},
																		},
																	)
																}
													}
													startIcon={<Icon name="material-symbols-delete" />}
													variant="contained"
												>
													{intl.formatMessage(
														m.deleteObservationConfirmationDialogConfirm,
													)}
												</Button>
											</Stack>
										}
										title={intl.formatMessage(
											m.deleteObservationConfirmationDialogTitle,
										)}
									/>
								)
							}}
						</DecentDialog>
					</>
				) : null}
			</Stack>

			<DecentDialog
				fullWidth
				maxWidth="sm"
				value={
					deleteObservation.status === 'error' ? deleteObservation.error : null
				}
			>
				{(error) => (
					<ErrorDialogContent
						errorMessage={error.toString()}
						onClose={() => {
							deleteObservation.reset()
						}}
					/>
				)}
			</DecentDialog>

			<Block
				withResolver
				// TODO: Ideally we conditionally enable this but the handled unload event does not
				// emit a state update so it won't trigger the dialog as expected.
				enableBeforeUnload={false}
				shouldBlockFn={() => {
					return !!activeEditId
				}}
			>
				{({ status, proceed, reset }) => (
					<DecentDialog
						fullWidth
						maxWidth="sm"
						value={status === 'blocked' ? { proceed, reset } : null}
					>
						{(blockerActions) => (
							<DiscardEditsDialogContent
								onCancel={blockerActions.reset}
								onConfirm={blockerActions.proceed}
							/>
						)}
					</DecentDialog>
				)}
			</Block>
		</>
	)
}

function CategoryDetails({
	category,
	projectId,
	showEditIcon,
	showUpdatedIndicator,
}: {
	category: Preset | undefined
	projectId: string
	showEditIcon?: boolean
	showUpdatedIndicator?: boolean
}) {
	const intl = useIntl()

	const categoryIconSize = useIconSizeBasedOnTypography({
		variant: 'cardHeader',
		multiplier: 2,
	})

	const categoryEditSuccessIconSize = useIconSizeBasedOnTypography({
		variant: 'cardHeader',
	})

	const editIconSize = useIconSizeBasedOnTypography({
		variant: 'cardHeader',
	})

	return (
		<Stack
			direction="row"
			sx={{ alignItems: 'center', flex: 1, gap: 4, padding: 4 }}
		>
			<Box sx={{ position: 'relative' }}>
				{category ? (
					<CategoryIconContainer
						color={category.color || BLACK_00}
						applyBoxShadow
					>
						{category.iconRef?.docId ? (
							<CategoryIconImage
								altText={intl.formatMessage(m.categoryIconAlt, {
									name: category.name,
								})}
								iconDocumentId={category.iconRef.docId}
								projectId={projectId}
								imageStyle={{
									aspectRatio: 1,
									width: categoryIconSize,
								}}
							/>
						) : (
							<Icon
								name="material-symbols-indeterminate-question-box"
								size={categoryIconSize}
							/>
						)}
					</CategoryIconContainer>
				) : (
					<CategoryIconContainer applyBoxShadow color={BLACK_00}>
						<Icon
							name="material-symbols-indeterminate-question-box"
							size={categoryIconSize}
						/>
					</CategoryIconContainer>
				)}

				{showUpdatedIndicator ? (
					<Box
						sx={{
							background: GREEN_00,
							borderRadius: '50%',
							bottom: (theme) => theme.spacing(-1),
							display: 'flex',
							padding: 1,
							position: 'absolute',
							right: (theme) => theme.spacing(-1),
						}}
					>
						<Icon
							name="material-check"
							htmlColor={WHITE_00}
							size={categoryEditSuccessIconSize}
						/>
					</Box>
				) : null}
			</Box>

			<Typography
				variant="cardHeader"
				sx={{
					flex: 1,
					overflow: 'auto',
					overflowWrap: 'break-word',
					textAlign: 'start',
				}}
			>
				{category
					? category.name
					: intl.formatMessage(m.observationCategoryNameFallback)}
			</Typography>

			{showEditIcon ? (
				<Box
					sx={{
						color: (theme) => theme.palette.text.secondary,
						display: 'grid',
						placeItems: 'center',
					}}
				>
					<Icon name="material-edit-filled" size={editIconSize} />
				</Box>
			) : null}
		</Stack>
	)
}

function ObservationMetadataPanel({
	coordinateFormat,
	observation,
	unitSystem,
}: {
	coordinateFormat: CoordinateFormat
	observation: Observation
	unitSystem: UnitSystem
}) {
	const intl = useIntl()

	const metadataRows = useMemo(() => {
		const accuracy = observation.metadata?.position?.coords.accuracy
		const altitude = observation.metadata?.position?.coords.altitude
		const altitudeAccuracy =
			observation.metadata?.position?.coords.altitudeAccuracy
		const latitude = observation.lat
		const longitude = observation.lon
		const speed = observation.metadata?.position?.coords.speed

		const result: Array<{
			id: string
			icon: JSX.Element
			label: string
			value: string
		}> = []

		if (latitude !== undefined) {
			result.push({
				id: 'latitude',
				icon: <Icon name="comapeo-latitude" />,
				label: intl.formatMessage(m.observationMetadataLatitudeLabel),
				value: intl.formatMessage(m.observationMetadataCoordinate, {
					value: latitude.toFixed(5),
				}),
			})
		}

		if (longitude !== undefined) {
			result.push({
				id: 'longitude',
				icon: <Icon name="comapeo-longitude" />,
				label: intl.formatMessage(m.observationMetadataLongitudeLabel),
				value: intl.formatMessage(m.observationMetadataCoordinate, {
					value: longitude.toFixed(5),
				}),
			})
		}

		if (accuracy !== undefined) {
			const value =
				unitSystem === 'imperial'
					? intl.formatMessage(m.observationMetadataLocationAccuracyFeet, {
							value: (Math.abs(accuracy) * FOOT_TO_METER_RATIO).toFixed(0),
						})
					: intl.formatMessage(m.observationMetadataLocationAccuracyMeters, {
							value: Math.abs(accuracy).toFixed(0),
						})

			result.push({
				id: 'accuracy',
				icon: <Icon name="comapeo-accuracy" />,
				label: intl.formatMessage(m.observationMetadataLocationAccuracyLabel),
				value,
			})
		}

		if (altitude !== undefined) {
			const value =
				unitSystem === 'imperial'
					? intl.formatMessage(m.observationMetadataAltitudeFeet, {
							value: (altitude * FOOT_TO_METER_RATIO).toFixed(0),
						})
					: intl.formatMessage(m.observationMetadataAltitudeMeters, {
							value: altitude.toFixed(0),
						})

			result.push({
				id: 'altitude',
				icon: <Icon name="material-symbols-landscape" />,
				label: intl.formatMessage(m.observationMetadataAltitudeLabel),
				value,
			})
		}

		if (altitudeAccuracy !== undefined) {
			const value =
				unitSystem === 'imperial'
					? intl.formatMessage(m.observationMetadataAltitudeAccuracyFeet, {
							value: (Math.abs(altitudeAccuracy) * FOOT_TO_METER_RATIO).toFixed(
								0,
							),
						})
					: intl.formatMessage(m.observationMetadataAltitudeAccuracyMeters, {
							value: Math.abs(altitudeAccuracy).toFixed(0),
						})

			result.push({
				id: 'altitude-accuracy',
				icon: <Icon name="material-symbols-keyboard-double-arrow-up" />,
				label: intl.formatMessage(m.observationMetadataAltitudeAccuracyLabel),
				value,
			})
		}

		if (speed !== undefined) {
			result.push({
				id: 'speed',
				icon: <Icon name="material-symbols-speed" />,
				label: intl.formatMessage(m.observationMetadataSpeedLabel),
				value: intl.formatMessage(
					unitSystem === 'imperial'
						? m.observationMetadataSpeedFeet
						: m.observationMetadataSpeedMeters,
					{ value: speed.toFixed(2) },
				),
			})
		}

		return result
	}, [observation, intl, unitSystem])

	const validatedIconSize = useIconSizeBasedOnTypography({
		variant: 'heroHeader',
		multiplier: 2.5,
	})

	return (
		<Stack direction="column">
			<Box
				sx={{
					flex: 1,
					display: 'flex',
					justifyContent: 'center',
					padding: 6,
				}}
			>
				<Box sx={{ position: 'relative' }}>
					<Icon name="comapeo-validated-badge" size={validatedIconSize} />

					<Box
						sx={{
							background: GREEN_00,
							borderRadius: '50%',
							bottom: 0,
							display: 'flex',
							padding: 1,
							position: 'absolute',
							right: (theme) => theme.spacing(-1),
						}}
					>
						<Icon
							name="material-check"
							htmlColor={WHITE_00}
							size={`calc(${validatedIconSize} / 3)`}
						/>
					</Box>
				</Box>
			</Box>

			<Stack direction="column" sx={{ gap: 6 }}>
				<Stack
					direction="column"
					sx={{
						color: (theme) => theme.palette.text.secondary,
						gap: 2,
						paddingInline: 6,
					}}
				>
					<Stack direction="row" sx={{ alignItems: 'center', gap: 2 }}>
						<Icon
							name="material-symbols-calendar-today"
							sx={{ alignSelf: 'center' }}
						/>

						<Typography>
							<time dateTime={observation.createdAt}>
								{intl.formatDate(observation.createdAt, {
									year: 'numeric',
									month: 'short',
									day: '2-digit',
									minute: '2-digit',
									hour: '2-digit',
									hourCycle: 'h12',
								})}
							</time>
						</Typography>
					</Stack>

					<Stack direction="row" sx={{ alignItems: 'center', gap: 2 }}>
						<Icon
							name="material-symbols-location-filled"
							sx={{ alignSelf: 'center' }}
						/>

						{typeof observation.lon === 'number' &&
						typeof observation.lat === 'number' ? (
							<Typography>
								{formatCoords({
									lon: observation.lon,
									lat: observation.lat,
									format: coordinateFormat,
								})}
							</Typography>
						) : null}
					</Stack>
				</Stack>

				{metadataRows.length > 0 ? (
					<Stack
						direction="column"
						sx={{ color: (theme) => theme.palette.text.secondary }}
					>
						{metadataRows.map((metadata, index) => (
							<Stack
								key={metadata.id}
								direction="row"
								sx={{
									alignItems: 'center',
									background: index % 2 === 0 ? BLACK_03 : WHITE_00,
									gap: 2,
									justifyContent: 'space-between',
									paddingBlock: 4,
									paddingInline: 6,
								}}
							>
								{metadata.icon}

								<Stack
									direction="row"
									sx={{
										alignItems: 'center',
										flex: 1,
										gap: 2,
										justifyContent: 'space-between',
										overflow: 'hidden',
									}}
								>
									<Typography
										sx={{
											fontWeight: (theme) => theme.typography.fontWeightMedium,
											overflow: 'hidden',
											textOverflow: 'ellipsis',
											whiteSpace: 'nowrap',
											width: `clamp(10ch, 20ch, 30ch)`,
										}}
									>
										{metadata.label}
									</Typography>

									<Typography
										sx={{
											fontVariantNumeric: 'tabular-nums',
											whiteSpace: 'nowrap',
										}}
									>
										{metadata.value}
									</Typography>
								</Stack>
							</Stack>
						))}
					</Stack>
				) : null}
			</Stack>
		</Stack>
	)
}

function isEditableField(field: Field): field is EditableField {
	switch (field.type) {
		case 'date':
		case 'number':
		case 'text': {
			return true
		}
		case 'selectOne':
		case 'selectMultiple': {
			return field.options !== undefined
		}
		default: {
			return false
		}
	}
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
		case 'date': {
			if (typeof tagValue === 'string') {
				try {
					return new Date(tagValue).toISOString()
				} catch {
					return undefined
				}
			}

			return undefined
		}
		default: {
			throw new ExhaustivenessError(fieldType)
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

const m = defineMessages<{
	readonly navTitle: NoMessageValues
	readonly categoryIconAlt: { readonly name: MessageValue }
	readonly observationCategoryNameFallback: NoMessageValues
	readonly noLocation: NoMessageValues
	readonly detailsSectionTitle: NoMessageValues
	readonly observationNotFound: { readonly docId: MessageValue }
	readonly changeCategory: NoMessageValues
	readonly deleteObservationButtonText: NoMessageValues
	readonly deleteObservationConfirmationDialogTitle: NoMessageValues
	readonly deleteObservationConfirmationDialogConfirm: NoMessageValues
	readonly deleteObservationConfirmationDialogCancel: NoMessageValues
	readonly deleteObservationSuccessPanelTitle: NoMessageValues
	readonly deleteObservationSuccessPanelReturnToObservations: NoMessageValues
	readonly deleteObservationSuccessPanelReturnToTrack: NoMessageValues
	readonly locationAccuracyMeters: { readonly value: MessageValue }
	readonly locationAccuracyFeet: { readonly value: MessageValue }
	readonly observationMetadataLatitudeLabel: NoMessageValues
	readonly observationMetadataLongitudeLabel: NoMessageValues
	readonly observationMetadataCoordinate: { readonly value: MessageValue }
	readonly observationMetadataLocationAccuracyLabel: NoMessageValues
	readonly observationMetadataLocationAccuracyMeters: {
		readonly value: MessageValue
	}
	readonly observationMetadataLocationAccuracyFeet: {
		readonly value: MessageValue
	}
	readonly observationMetadataAltitudeLabel: NoMessageValues
	readonly observationMetadataAltitudeMeters: { readonly value: MessageValue }
	readonly observationMetadataAltitudeFeet: { readonly value: MessageValue }
	readonly observationMetadataAltitudeAccuracyLabel: NoMessageValues
	readonly observationMetadataAltitudeAccuracyMeters: {
		readonly value: MessageValue
	}
	readonly observationMetadataAltitudeAccuracyFeet: {
		readonly value: MessageValue
	}
	readonly observationMetadataSpeedLabel: NoMessageValues
	readonly observationMetadataSpeedMeters: { readonly value: MessageValue }
	readonly observationMetadataSpeedFeet: { readonly value: MessageValue }
}>({
	navTitle: {
		id: '$1.routes.app.projects.$projectId.observations.$observationDocId.index.navTitle',
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
		id: '$1.routes.app.projects.$projectId.observations.$observationDocId.index.observationCategoryNameFallback',
		defaultMessage: 'Not categorized',
		description: 'Fallback name for observation without a matching category.',
	},
	noLocation: {
		id: '$1.routes.app.projects.$projectId.observations.$observationDocId.index.noLocation',
		defaultMessage: 'No location',
		description:
			'Fallback for location when observation does not have location specified.',
	},
	detailsSectionTitle: {
		id: '$1.routes.app.projects.$projectId.observations.$observationDocId.index.detailsSectionTitle',
		defaultMessage: 'Details',
		description: 'Title for details section.',
	},
	observationNotFound: {
		id: '$1.routes.app.projects.$projectId.observations.$observationDocId.index.observationNotFound',
		defaultMessage: 'Could not find observation with ID {docId}',
		description: 'Text displayed when observation cannot be found.',
	},
	changeCategory: {
		id: '$1.routes.app.projects.$projectId.observations.$observationDocId.index.changeCategory',
		defaultMessage: 'Change Category',
		description: 'Tooltip text for button to change category.',
	},
	deleteObservationButtonText: {
		id: '$1.routes.app.projects.$projectId.observations.$observationDocId.index.deleteObservationButtonText',
		defaultMessage: 'Delete',
		description: 'Text for delete observation button.',
	},
	deleteObservationConfirmationDialogTitle: {
		id: '$1.routes.app.projects.$projectId.observations.$observationDocId.index.deleteObservationConfirmationDialogTitle',
		defaultMessage: 'Delete Observation?',
		description: 'Text for title of delete observation confirmation dialog.',
	},
	deleteObservationConfirmationDialogConfirm: {
		id: '$1.routes.app.projects.$projectId.observations.$observationDocId.index.deleteObservationConfirmationDialogConfirm',
		defaultMessage: 'Yes, Delete',
		description:
			'Text for confirmation button of delete observation confirmation dialog.',
	},
	deleteObservationConfirmationDialogCancel: {
		id: '$1.routes.app.projects.$projectId.observations.$observationDocId.index.deleteObservationConfirmationDialogCancel',
		defaultMessage: 'Cancel',
		description:
			'Text for cancel button of delete observation confirmation dialog.',
	},
	deleteObservationSuccessPanelTitle: {
		id: '$1.routes.app.projects.$projectId.observations.$observationDocId.index.deleteObservationSuccessPanelTitle',
		defaultMessage: 'Observation Deleted',
		description: 'Title text for the successful observation deletion panel.',
	},
	deleteObservationSuccessPanelReturnToObservations: {
		id: '$1.routes.app.projects.$projectId.observations.$observationDocId.index.deleteObservationSuccessPanelReturnToObservations',
		defaultMessage: 'Return to Observations List',
		description:
			'Text for button to return to observations list in successful observation deletion panel.',
	},
	deleteObservationSuccessPanelReturnToTrack: {
		id: '$1.routes.app.projects.$projectId.observations.$observationDocId.index.deleteObservationSuccessPanelReturnToTrack',
		defaultMessage: 'Return to Track',
		description:
			'Text for button to return to track in successful observation deletion panel.',
	},
	locationAccuracyMeters: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.index.locationAccuracyMeters',
		defaultMessage: '± {value} m',
		description: 'Displayed accuracy for observation location in meters.',
	},
	locationAccuracyFeet: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.index.locationAccuracyFeet',
		defaultMessage: '± {value} ft',
		description: 'Displayed accuracy for observation location in feet.',
	},
	observationMetadataLatitudeLabel: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.index.observationMetadataLatitudeLabel',
		defaultMessage: 'Latitude',
		description: 'Label for observation metadata latitude.',
	},
	observationMetadataLongitudeLabel: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.index.observationMetadataLongitudeLabel',
		defaultMessage: 'Longitude',
		description: 'Label for observation metadata longitude.',
	},
	observationMetadataCoordinate: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.index.observationMetadataCoordinate',
		defaultMessage: '{value}°',
		description:
			'Displayed coordinate (latitude or longitude) for observation metadata.',
	},
	observationMetadataLocationAccuracyLabel: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.index.observationMetadataLocationAccuracyLabel',
		defaultMessage: 'Accuracy',
		description: 'Label for observation metadata location accuracy.',
	},
	observationMetadataLocationAccuracyMeters: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.index.observationMetadataLocationAccuracyMeters',
		defaultMessage: '± {value} m',
		description:
			'Displayed location accuracy for observation metadata in meters.',
	},
	observationMetadataLocationAccuracyFeet: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.index.observationMetadataLocationAccuracyFeet',
		defaultMessage: '± {value} ft',
		description:
			'Displayed location accuracy for observation metadata in feet.',
	},
	observationMetadataAltitudeLabel: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.index.observationMetadataAltitudeLabel',
		defaultMessage: 'Altitude',
		description: 'Label for observation metadata altitude.',
	},
	observationMetadataAltitudeMeters: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.index.observationMetadataAltitudeMeters',
		defaultMessage: '{value} m',
		description: 'Displayed altitude for observation metadata in meters.',
	},
	observationMetadataAltitudeFeet: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.index.observationMetadataAltitudeFeet',
		defaultMessage: '{value} ft',
		description: 'Displayed altitude for observation metadata in feet.',
	},
	observationMetadataAltitudeAccuracyLabel: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.index.observationMetadataAltitudeAccuracyLabel',
		defaultMessage: 'Altitude Accuracy',
		description: 'Label for observation metadata altitude accuracy.',
	},
	observationMetadataAltitudeAccuracyMeters: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.index.observationMetadataAltitudeAccuracyMeters',
		defaultMessage: '± {value} m',
		description: 'Displayed altitude accuracy for observation in meters.',
	},
	observationMetadataAltitudeAccuracyFeet: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.index.observationMetadataAltitudeAccuracyFeet',
		defaultMessage: '± {value} ft',
		description: 'Displayed altitude accuracy for observation in feet.',
	},
	observationMetadataSpeedLabel: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.index.observationMetadataSpeedLabel',
		defaultMessage: 'Speed',
		description: 'Label for observation metadata speed.',
	},
	observationMetadataSpeedMeters: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.index.observationMetadataSpeedMeters',
		defaultMessage: '{value} m/s',
		description: 'Displayed speed for observation in meters per second.',
	},
	observationMetadataSpeedFeet: {
		id: 'routes.app.projects.$projectId.observations.$observationDocId.index.observationMetadataSpeedFeet',
		defaultMessage: '{value} ft/s',
		description: 'Displayed speed for observation in feet per second.',
	},
})
