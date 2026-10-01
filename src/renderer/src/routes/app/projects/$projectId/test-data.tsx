import { Suspense, useId, useMemo, useState } from 'react'
import {
	useCreateDocument,
	useMapStyleUrl,
	useOwnDeviceInfo,
	usePresetsSelection,
} from '@comapeo/core-react'
import type { Observation, Track } from '@comapeo/core/schema.js'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import FormControlLabel from '@mui/material/FormControlLabel'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useSelector } from '@tanstack/react-form'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { bboxPolygon } from '@turf/bbox-polygon'
import { featureCollection, lengthToDegrees } from '@turf/helpers'
import { randomPosition } from '@turf/random'
import { Layer, Marker, Source } from '@vis.gl/react-maplibre'
import type { BBox } from 'geojson'
import { draw } from 'radashi'
import {
	defineMessages,
	useIntl,
	type MessageValue,
	type NoMessageValues,
} from 'react-intl'
import * as v from 'valibot'

import { TwoPanelLayout } from '../-shared/two-panel-layout.tsx'
import { BLACK, BLUE_GREY } from '../../../../colors.ts'
import { DecentDialog } from '../../../../components/decent-dialog.tsx'
import { DecentTextField } from '../../../../components/decent-text-field.tsx'
import { ErrorDialogContent } from '../../../../components/error-dialog.tsx'
import { GenericRoutePendingComponent } from '../../../../components/generic-route-pending-component.tsx'
import { Map } from '../../../../components/map.tsx'
import { useAppForm } from '../../../../hooks/forms.ts'
import { useNetworkAwareMapStyleUrl } from '../../../../hooks/maps.ts'
import { COMAPEO_CORE_REACT_ROOT_QUERY_KEY } from '../../../../lib/comapeo.ts'
import { getLocaleStateQueryOptions } from '../../../../lib/queries/app-settings.ts'
import { createGlobalMutationsKey } from '../../../../lib/queries/global-mutations.ts'

export const Route = createFileRoute('/app/projects/$projectId/test-data')({
	beforeLoad: async ({ params }) => {
		const { projectId } = params

		if (
			__APP_TYPE__ === 'production' ||
			import.meta.env.VITE_FEATURE_TEST_DATA_UI !== 'true'
		) {
			throw Route.redirect({
				to: '/app/projects/$projectId',
				params: { projectId },
				replace: true,
			})
		}
	},
	pendingComponent: () => {
		return (
			<TwoPanelLayout
				start={<GenericRoutePendingComponent />}
				end={
					<Box
						sx={{
							display: 'flex',
							flex: 1,
							justifyContent: 'center',
							alignItems: 'center',
							bgcolor: BLACK,
							opacity: 0.5,
						}}
					>
						<CircularProgress />
					</Box>
				}
			/>
		)
	},
	component: RouteComponent,
})

const FORM_ID = 'create-test-data-form'
const MIN_OBSERVATION_COUNT = 1
const MAX_OBSERVATION_COUNT = 1000
const DEFAULT_BOUNDED_DISTANCE_KM = 50
const MIN_BOUNDED_DISTANCE_KM = 0.1

function RouteComponent() {
	const intl = useIntl()

	const { projectId } = Route.useParams()

	const [notification, setNotification] = useState<{
		type: 'success'
		id: string
		message: string
	} | null>(null)

	const onChangeSchema = useMemo(() => {
		const requiredError = intl.formatMessage(m.requiredError)

		return v.object({
			observationCount: v.pipe(
				v.string(),
				v.minLength(1, requiredError),
				v.trim(),
				v.digits(intl.formatMessage(m.invalidObservationCountFormat)),
				v.toNumber(),
				v.minValue(
					MIN_OBSERVATION_COUNT,
					intl.formatMessage(m.minObservationCountError, {
						value: MIN_OBSERVATION_COUNT,
					}),
				),
				v.maxValue(
					MAX_OBSERVATION_COUNT,
					intl.formatMessage(m.maxObservationCountError, {
						value: MAX_OBSERVATION_COUNT,
					}),
				),
			),
			boundedDistance: v.pipe(
				v.string(),
				v.minLength(1, requiredError),
				v.trim(),
				v.decimal(intl.formatMessage(m.invalidBoundedDistanceFormat)),
				v.toNumber(),
				v.minValue(
					MIN_BOUNDED_DISTANCE_KM,
					intl.formatMessage(m.minBoundedDistanceError, {
						value: MIN_BOUNDED_DISTANCE_KM,
					}),
				),
			),
			latitude: v.pipe(v.number(), v.minValue(-90), v.maxValue(90)),
			longitude: v.pipe(v.number(), v.minValue(-180), v.maxValue(180)),
			createTrack: v.boolean(),
		})
	}, [intl])

	const form = useAppForm({
		defaultValues: {
			observationCount: '1',
			boundedDistance: DEFAULT_BOUNDED_DISTANCE_KM.toString(10),
			latitude: 0,
			longitude: 0,
			createTrack: false,
		},
		validators: { onChange: onChangeSchema },
		onSubmit: async ({ value }) => {
			const parsedValue = v.parse(onChangeSchema, value)

			const observations = await createTestObservations.mutateAsync({
				count: parsedValue.observationCount,
				boundingBox: getBoundingBoxUsingDistance({
					longitude: parsedValue.longitude,
					latitude: parsedValue.latitude,
					distance: parsedValue.boundedDistance,
				}),
			})

			if (parsedValue.createTrack) {
				await createTestTrack.mutateAsync({ observations })
			}

			setNotification({
				type: 'success',
				id: `id_${Date.now()}`,
				message: `${intl.formatMessage(m.observationCreateSuccess, {
					count: parsedValue.observationCount,
				})} ${intl.formatMessage(m.trackCreateSuccess, { count: parsedValue.createTrack ? 1 : 0 })}`,
			})
		},
	})

	const createTestObservations = useCreateTestObservations({ projectId })

	const createTestTrack = useCreateTestTrack({ projectId })

	const boundedDistance = useSelector(form.store, (state) => {
		if (
			state.fieldMeta.boundedDistance &&
			!state.fieldMeta.boundedDistance.isValid
		) {
			return undefined
		}

		return v.parse(
			onChangeSchema.entries['boundedDistance'],
			state.values.boundedDistance,
		)
	})

	const coordinates = useSelector(form.store, (state) => {
		return {
			longitude: state.values.longitude,
			latitude: state.values.latitude,
		}
	})

	const boundingBox = useMemo(() => {
		if (!boundedDistance) {
			return undefined
		}

		const { longitude, latitude } = coordinates

		return getBoundingBoxUsingDistance({
			longitude,
			latitude,
			distance: boundedDistance,
		})
	}, [boundedDistance, coordinates])

	const componentId = useId()

	const observationCountFieldBaseId = `${componentId}-observation-count`
	const longitudeFieldBaseId = `${componentId}-longitude`
	const latitudeFieldBaseId = `${componentId}-latitude`
	const boundedDistanceBaseFieldId = `${componentId}-bounded-distance`

	return (
		<>
			<TwoPanelLayout
				start={
					<Stack direction="column" sx={{ flex: 1, overflow: 'auto' }}>
						<Stack
							component="header"
							direction="row"
							sx={{
								alignItems: 'center',
								paddingBlock: 4,
								paddingInline: 6,
								borderBottom: `1px solid ${BLUE_GREY}`,
							}}
						>
							<Typography
								variant="h1"
								sx={{ fontWeight: 500, textAlign: 'center' }}
							>
								{intl.formatMessage(m.navTitle)}
							</Typography>
						</Stack>

						<Stack
							direction="column"
							sx={{
								flex: 1,
								justifyContent: 'space-between',
								overflow: 'auto',
							}}
						>
							<Box sx={{ padding: 6, overflow: 'auto' }}>
								<Box
									component="form"
									id={FORM_ID}
									noValidate
									autoComplete="off"
									onSubmit={(event) => {
										event.preventDefault()
										if (form.state.isSubmitting) return
										form.handleSubmit()
									}}
								>
									<Stack direction="column" sx={{ gap: 10 }}>
										<form.AppField name="observationCount">
											{(field) => {
												const inputId = `${observationCountFieldBaseId}-input`
												const errorTextId = `${observationCountFieldBaseId}-error-text`

												return (
													<DecentTextField
														aria-describedby={
															field.state.meta.isValid ? undefined : errorTextId
														}
														error={!field.state.meta.isValid}
														fullWidth
														helperText={
															<Typography
																id={errorTextId}
																color={
																	field.state.meta.isValid ? undefined : 'error'
																}
																component="span"
																variant="body2"
															>
																{field.state.meta.errors.length > 0
																	? field.state.meta.errors[0]?.message
																	: intl.formatMessage(
																			m.observationCountHelperText,
																			{
																				min: MIN_OBSERVATION_COUNT,
																				max: MAX_OBSERVATION_COUNT,
																			},
																		)}
															</Typography>
														}
														id={inputId}
														inputMode="numeric"
														label={intl.formatMessage(m.observationCountLabel)}
														name={field.name}
														onBlur={field.handleBlur}
														onChange={(event) => {
															if (
																event.target.value === '' ||
																v.is(
																	v.pipe(v.string(), v.digits()),
																	event.target.value,
																)
															) {
																field.handleChange(event.target.value)
															}
														}}
														required
														value={field.state.value}
													/>
												)
											}}
										</form.AppField>

										<Stack
											component="fieldset"
											sx={{ border: 'none', gap: 10, padding: 0 }}
										>
											<Stack direction="column" sx={{ gap: 5 }}>
												<Typography>
													{intl.formatMessage(m.coordinatesSelectionHint)}
												</Typography>

												<Stack
													direction="row"
													sx={{
														gap: 4,
														justifyContent: 'space-between',
														flexWrap: 'wrap',
													}}
												>
													<form.AppField name="longitude">
														{(field) => {
															const inputId = `${longitudeFieldBaseId}-input`
															const errorTextId = `${longitudeFieldBaseId}-error-text`

															return (
																<DecentTextField
																	aria-describedby={
																		field.state.meta.isValid
																			? undefined
																			: errorTextId
																	}
																	aria-disabled
																	disabled
																	helperText={
																		<Typography
																			id={errorTextId}
																			color={
																				field.state.meta.isValid
																					? undefined
																					: 'error'
																			}
																			component="span"
																			variant="body2"
																		>
																			{field.state.meta.errors.length > 0
																				? field.state.meta.errors[0]?.message
																				: null}
																		</Typography>
																	}
																	id={inputId}
																	// NOTE: Only surfaced for internal usage
																	// eslint-disable-next-line formatjs/no-literal-string-in-jsx
																	label="Longitude"
																	sx={{ minWidth: 200 }}
																	value={field.state.value}
																/>
															)
														}}
													</form.AppField>

													<form.AppField name="latitude">
														{(field) => {
															const inputId = `${latitudeFieldBaseId}-input`
															const errorTextId = `${latitudeFieldBaseId}-error-text`

															return (
																<DecentTextField
																	aria-describedby={
																		field.state.meta.isValid
																			? undefined
																			: errorTextId
																	}
																	aria-disabled
																	disabled
																	helperText={
																		<Typography
																			id={errorTextId}
																			color={
																				field.state.meta.isValid
																					? undefined
																					: 'error'
																			}
																			component="span"
																			variant="body2"
																		>
																			{field.state.meta.errors.length > 0
																				? field.state.meta.errors[0]?.message
																				: null}
																		</Typography>
																	}
																	id={inputId}
																	// NOTE: Only surfaced for internal usage
																	// eslint-disable-next-line formatjs/no-literal-string-in-jsx
																	label="Latitude"
																	sx={{ minWidth: 200 }}
																	value={field.state.value}
																/>
															)
														}}
													</form.AppField>
												</Stack>
											</Stack>

											<form.AppField name="boundedDistance">
												{(field) => {
													const inputId = `${boundedDistanceBaseFieldId}-input`
													const errorTextId = `${boundedDistanceBaseFieldId}-error-text`

													return (
														<DecentTextField
															aria-describedby={
																field.state.meta.isValid
																	? undefined
																	: errorTextId
															}
															error={!field.state.meta.isValid}
															helperText={
																<Typography
																	id={errorTextId}
																	color={
																		field.state.meta.isValid
																			? undefined
																			: 'error'
																	}
																	component="span"
																	variant="body2"
																>
																	{field.state.meta.errors.length > 0
																		? field.state.meta.errors[0]?.message
																		: null}
																</Typography>
															}
															id={inputId}
															inputMode="decimal"
															label={intl.formatMessage(m.boundedDistanceLabel)}
															name={field.name}
															onBlur={field.handleBlur}
															onChange={(event) => {
																field.handleChange(event.target.value)
															}}
															required
															value={field.state.value}
														/>
													)
												}}
											</form.AppField>
										</Stack>

										<form.AppField name="createTrack">
											{(field) => (
												<FormControlLabel
													control={<Checkbox />}
													checked={field.state.value}
													onChange={(_event, checked) => {
														field.handleChange(checked)
													}}
													onBlur={field.handleBlur}
													label={intl.formatMessage(m.createTrack)}
												/>
											)}
										</form.AppField>
									</Stack>
								</Box>
							</Box>

							<Stack
								direction="column"
								sx={{
									alignItems: 'center',
									borderTop: `1px solid ${BLUE_GREY}`,
									gap: 4,
									padding: 6,
								}}
							>
								<form.Subscribe
									selector={(state) =>
										[state.canSubmit, state.isSubmitting] as const
									}
								>
									{([canSubmit, isSubmitting]) => (
										<Button
											type="submit"
											form={FORM_ID}
											fullWidth
											variant="contained"
											loading={isSubmitting}
											loadingPosition="start"
											aria-disabled={!canSubmit}
											sx={{ maxWidth: 400 }}
										>
											{intl.formatMessage(m.create)}
										</Button>
									)}
								</form.Subscribe>
							</Stack>
						</Stack>
					</Stack>
				}
				end={
					<Suspense
						fallback={
							<Box
								sx={{
									display: 'flex',
									flex: 1,
									justifyContent: 'center',
									alignItems: 'center',
									bgcolor: BLACK,
									opacity: 0.5,
								}}
							>
								<CircularProgress />
							</Box>
						}
					>
						<Box sx={{ display: 'flex', flex: 1 }}>
							<DisplayedMap
								boundingBox={boundingBox}
								coordinates={coordinates}
								onChange={({ longitude, latitude }) => {
									form.setFieldValue('latitude', latitude)
									form.setFieldValue('longitude', longitude)
								}}
							/>
						</Box>
					</Suspense>
				}
			/>

			<Snackbar
				key={notification?.id}
				open={!!notification}
				message={notification?.message}
				autoHideDuration={3_000}
				onClose={(_event, reason) => {
					if (reason === 'clickaway') {
						return
					}

					setNotification(null)
				}}
				slotProps={{
					transition: {
						onExited: () => {
							setNotification(null)
						},
					},
				}}
				anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
			/>

			<DecentDialog
				fullWidth
				maxWidth="sm"
				value={
					createTestObservations.status === 'error'
						? {
								errorMessage: createTestObservations.error.toString(),
								onClose: () => {
									createTestObservations.reset()
								},
							}
						: createTestTrack.status === 'error'
							? {
									errorMessage: createTestTrack.error.toString(),
									onClose: () => {
										createTestTrack.reset()
									},
								}
							: null
				}
			>
				{({ errorMessage, onClose }) => (
					<ErrorDialogContent errorMessage={errorMessage} onClose={onClose} />
				)}
			</DecentDialog>
		</>
	)
}

const MAP_MAX_BOUNDS: [number, number, number, number] = [
	-179.99999, -89.99999, 179.99999, 89.99999,
]

function DisplayedMap({
	boundingBox,
	coordinates,
	onChange,
}: {
	boundingBox?: [number, number, number, number]
	coordinates: { latitude: number; longitude: number }
	onChange: (coordinate: { latitude: number; longitude: number }) => void
}) {
	const boundingBoxFeatureCollection = featureCollection(
		boundingBox ? [bboxPolygon(boundingBox)] : [],
	)

	const { data: originalStyleUrl } = useMapStyleUrl()
	const styleUrl = useNetworkAwareMapStyleUrl(originalStyleUrl)

	return (
		<Map
			mapStyle={styleUrl}
			initialViewState={{
				fitBoundsOptions: { padding: 40, maxZoom: 12 },
				...(coordinates.latitude === 0 && coordinates.longitude === 0
					? coordinates
					: { bounds: boundingBox }),
			}}
			maxBounds={MAP_MAX_BOUNDS}
			onClick={(event) => {
				onChange({ latitude: event.lngLat.lat, longitude: event.lngLat.lng })
			}}
			touchZoomRotate={false}
			dragRotate={false}
			pitchWithRotate={false}
		>
			<Source id="selection" type="geojson" data={boundingBoxFeatureCollection}>
				<Layer type="symbol" id="point" />

				<Layer
					type="fill"
					id="radius"
					paint={{
						'fill-color': BLACK,
						'fill-opacity': 0.2,
						'fill-outline-color': BLACK,
					}}
				/>
				<Layer
					type="line"
					id="border"
					paint={{ 'line-width': 1, 'line-color': BLACK }}
				/>
			</Source>

			{coordinates ? (
				<Marker
					draggable
					latitude={coordinates.latitude}
					longitude={coordinates.longitude}
					onDragEnd={(event) => {
						onChange({
							latitude: event.lngLat.lat,
							longitude: event.lngLat.lng,
						})
					}}
				/>
			) : null}
		</Map>
	)
}

const CREATE_TEST_OBSERVATIONS_MUTATION_KEY = createGlobalMutationsKey([
	'create-test-observations',
])

const CREATE_TEST_TRACK_MUTATION_KEY = createGlobalMutationsKey([
	'create-test-track',
])

function useCreateTestObservations({ projectId }: { projectId: string }) {
	const { data: deviceInfo } = useOwnDeviceInfo()

	const { data: lang } = useSuspenseQuery({
		...getLocaleStateQueryOptions(),
		select: ({ value }) => value,
	})

	const selectableObservationCategories = usePresetsSelection({
		projectId,
		dataType: 'observation',
		lang,
	})

	const createObservation = useCreateDocument({
		projectId,
		docType: 'observation',
	})

	return useMutation({
		mutationKey: CREATE_TEST_OBSERVATIONS_MUTATION_KEY,
		mutationFn: async ({
			count,
			boundingBox,
		}: {
			count: number
			boundingBox: BBox
		}) => {
			const promises = []

			for (let i = 0; i < count; i++) {
				const position = randomPosition(boundingBox)

				const longitude = position[0]
				const latitude = position[1]

				// Shouldn't happen but need to narrow the type
				if (longitude === undefined || latitude === undefined) {
					throw new Error(
						`randomPosition() returned unexpected position ${position}`,
					)
				}

				const randomPreset = draw(selectableObservationCategories)!

				const now = new Date().toISOString()

				const notes = deviceInfo.name ? `Created by ${deviceInfo.name}` : null

				promises.push(
					createObservation.mutateAsync({
						value: {
							lon: longitude,
							lat: latitude,
							presetRef: {
								docId: randomPreset.docId,
								versionId: randomPreset.versionId,
							},
							metadata: {
								manualLocation: false,
								position: {
									timestamp: now,
									mocked: false,
									coords: { latitude, longitude },
								},
							},
							tags: { ...randomPreset.tags, notes },

							attachments: [],
						},
					}),
				)
			}

			return Promise.all(promises)
		},
		onSuccess: (_data, _variables, _mutateResult, context) => {
			context.client.invalidateQueries({
				queryKey: [
					COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
					'projects',
					projectId,
					'observation',
				],
			})
		},
	})
}

function useCreateTestTrack({ projectId }: { projectId: string }) {
	const { data: deviceInfo } = useOwnDeviceInfo()

	const { data: lang } = useSuspenseQuery({
		...getLocaleStateQueryOptions(),
		select: ({ value }) => value,
	})

	const selectableTrackCategories = usePresetsSelection({
		projectId,
		dataType: 'track',
		lang,
	})

	const createTrack = useCreateDocument({ projectId, docType: 'track' })

	return useMutation({
		mutationKey: CREATE_TEST_TRACK_MUTATION_KEY,
		mutationFn: async ({
			observations,
		}: {
			observations: Array<Observation>
		}) => {
			const randomPreset =
				Math.random() > 0.5 ? draw(selectableTrackCategories) : null

			// NOTE: This is technically invalid if observations.length < 2 but helpful to allow this
			// to test handling of invalid data.
			const locations = [] as unknown as Track['locations']
			const observationRefs: Track['observationRefs'] = []

			for (const observation of observations) {
				observationRefs.push({
					docId: observation.docId,
					versionId: observation.versionId,
				})

				if (
					typeof observation.lon === 'number' &&
					typeof observation.lat === 'number'
				) {
					locations.push({
						mocked: false,
						timestamp: observation.createdAt,
						coords: { longitude: observation.lon, latitude: observation.lat },
					})
				}
			}

			const notes = deviceInfo.name ? `Created by ${deviceInfo.name}` : null

			return createTrack.mutateAsync({
				value: {
					locations,
					observationRefs,
					...(randomPreset
						? {
								tags: { ...randomPreset.tags, notes },
								presetRef: {
									docId: randomPreset.docId,
									versionId: randomPreset.versionId,
								},
							}
						: { tags: { notes } }),
				},
			})
		},
		onSuccess: (_data, _variables, _mutateResult, context) => {
			context.client.invalidateQueries({
				queryKey: [COMAPEO_CORE_REACT_ROOT_QUERY_KEY, 'track'],
			})
		},
	})
}

function getBoundingBoxUsingDistance({
	longitude,
	latitude,
	distance,
}: {
	longitude: number
	latitude: number
	distance: number
}): [number, number, number, number] {
	const distanceBufferDegrees = lengthToDegrees(distance, 'kilometers')

	return [
		Math.max(longitude - distanceBufferDegrees, -180),
		Math.max(latitude - distanceBufferDegrees, -90),
		Math.min(longitude + distanceBufferDegrees, 180),
		Math.min(latitude + distanceBufferDegrees, 90),
	]
}

const m = defineMessages<{
	readonly navTitle: NoMessageValues
	readonly requiredError: NoMessageValues
	readonly observationCountLabel: NoMessageValues
	readonly boundedDistanceLabel: NoMessageValues
	readonly invalidObservationCountFormat: NoMessageValues
	readonly invalidBoundedDistanceFormat: NoMessageValues
	readonly minObservationCountError: { readonly value: MessageValue }
	readonly maxObservationCountError: { readonly value: MessageValue }
	readonly observationCountHelperText: {
		readonly max: MessageValue
		readonly min: MessageValue
	}
	readonly minBoundedDistanceError: { readonly value: MessageValue }
	readonly create: NoMessageValues
	readonly coordinatesSelectionHint: NoMessageValues
	readonly createTrack: NoMessageValues
	readonly observationCreateSuccess: { readonly count: number | bigint }
	readonly trackCreateSuccess: { readonly count: number | bigint }
}>({
	navTitle: {
		id: 'routes.app.settings.test-data.navTitle',
		defaultMessage: 'Create Test Data',
		description: 'Title of test data page.',
	},
	requiredError: {
		id: 'routes.app.settings.test-data.requiredError',
		defaultMessage: 'Required',
		description: 'Error message for when required input is empty.',
	},
	observationCountLabel: {
		id: 'routes.app.settings.test-data.observationCountLabel',
		defaultMessage: 'Number of observations',
		description: 'Label for the observation count input.',
	},
	boundedDistanceLabel: {
		id: 'routes.app.settings.test-data.boundedDistanceLabel',
		defaultMessage: 'Maximum bounded distance (kilometers)',
		description: 'Label for the bounded distance input.',
	},
	invalidObservationCountFormat: {
		id: 'routes.app.settings.test-data.invalidObservationCountFormat',
		defaultMessage: 'Must be an integer',
		description: 'Error message for when observation count is not an integer.',
	},
	invalidBoundedDistanceFormat: {
		id: 'routes.app.settings.test-data.invalidBoundedDistanceFormat',
		defaultMessage: 'Must be a decimal',
		description: 'Error message for when bounded distance is not an decimal.',
	},
	minObservationCountError: {
		id: 'routes.app.settings.test-data.minObservationCountError',
		defaultMessage: 'Must be greater than {value}',
		description: 'Error message for when observation count is too small',
	},
	maxObservationCountError: {
		id: 'routes.app.settings.test-data.maxObservationCountError',
		defaultMessage: 'Cannot be greater than {value}',
		description: 'Error message for when observation count is too large',
	},
	observationCountHelperText: {
		id: 'routes.app.settings.test-data.observationCountHelperText',
		defaultMessage: 'Between {min} and {max}',
		description: 'Helper text for observation count input.',
	},
	minBoundedDistanceError: {
		id: 'routes.app.settings.test-data.minBoundedDistanceError',
		defaultMessage: 'Must be greater than {value} kilometers',
		description: 'Error message for when bounded distance is too small',
	},
	create: {
		id: 'routes.app.settings.test-data.create',
		defaultMessage: 'Create',
		description: 'Label for create button.',
	},
	coordinatesSelectionHint: {
		id: 'routes.app.settings.test-data.coordinatesSelectionHint',
		defaultMessage:
			'Set the coordinates by clicking on the map or dragging the location marker.',
		description: 'Instructions displayed for coordinates selection inputs.',
	},
	createTrack: {
		id: 'routes.app.settings.test-data.createTrack',
		defaultMessage: 'Create track',
		description: 'Label for toggle to create track when creating test data.',
	},
	observationCreateSuccess: {
		id: 'routes.app.settings.test-data.observationCreateSuccess',
		defaultMessage:
			'Created {count, plural, one {# observation} other {# observations}}.',
		description: 'Message displayed when observation creation succeeds.',
	},
	trackCreateSuccess: {
		id: 'routes.app.settings.test-data.trackCreateSuccess',
		defaultMessage: 'Created {count, plural, one {# track} other {# tracks}}.',
		description: 'Message displayed when track creation succeeds.',
	},
})
