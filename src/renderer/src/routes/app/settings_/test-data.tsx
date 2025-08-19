import { useMemo, useState } from 'react'
import {
	useCreateDocument,
	useManyDocs,
	useMapStyleUrl,
	useOwnDeviceInfo,
} from '@comapeo/core-react'
import type { Observation, Track } from '@comapeo/schema'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useStore } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { bboxPolygon } from '@turf/bbox-polygon'
import { featureCollection, lengthToDegrees } from '@turf/helpers'
import { randomPosition } from '@turf/random'
import type { BBox } from 'geojson'
import { draw } from 'radashi'
import { defineMessages, useIntl } from 'react-intl'
import { Layer, Marker, Source } from 'react-map-gl/maplibre'
import * as v from 'valibot'

import { TwoPanelLayout } from '../-components/two-panel-layout'
import { BLACK, BLUE_GREY } from '../../../colors'
import {
	ErrorDialog,
	type Props as ErrorDialogProps,
} from '../../../components/error-dialog'
import { GenericRoutePendingComponent } from '../../../components/generic-route-pending-component'
import { Icon } from '../../../components/icon'
import { Map } from '../../../components/map'
import { useAppForm } from '../../../hooks/forms'
import { COMAPEO_CORE_REACT_ROOT_QUERY_KEY } from '../../../lib/comapeo'
import { createGlobalMutationsKey } from '../../../lib/queries/global-mutations'

// TODO: This technically should live in project settings
export const Route = createFileRoute('/app/settings_/test-data')({
	beforeLoad: ({ context }) => {
		if (
			__APP_TYPE__ === 'production' ||
			import.meta.env.VITE_FEATURE_TEST_DATA_UI !== 'true' ||
			!context.activeProjectId
		) {
			throw redirect({ to: '/', replace: true })
		}
	},
	loader: async ({ context }) => {
		const { activeProjectId, clientApi, queryClient } = context

		await Promise.all([
			// TODO: Not ideal but requires changes in @comapeo/core-react
			queryClient.ensureQueryData({
				queryKey: [
					COMAPEO_CORE_REACT_ROOT_QUERY_KEY,
					'projects',
					activeProjectId,
				],
				queryFn: async () => {
					return clientApi.getProject(activeProjectId)
				},
			}),
			// TODO: Not ideal but requires changes in @comapeo/core-react
			queryClient.ensureQueryData({
				queryKey: [COMAPEO_CORE_REACT_ROOT_QUERY_KEY, 'maps', 'stylejson_url'],
				queryFn: async () => {
					return clientApi.getMapStyleJsonUrl()
				},
			}),
		])
	},
	pendingComponent: () => {
		return (
			<TwoPanelLayout
				start={<GenericRoutePendingComponent />}
				end={
					<Box
						display="flex"
						flex={1}
						justifyContent="center"
						alignItems="center"
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
const MAP_MAX_BOUNDS: [number, number, number, number] = [
	-179.99999, -89.99999, 179.99999, 89.99999,
]

function RouteComponent() {
	const { formatMessage: t } = useIntl()
	const router = useRouter()

	const [notification, setNotification] = useState<{
		type: 'success'
		id: string
		message: string
	} | null>(null)

	const { activeProjectId } = Route.useRouteContext()

	const createTestObservations = useCreateTestObservations({
		projectId: activeProjectId,
	})

	const createTestTrack = useCreateTestTrack({
		projectId: activeProjectId,
	})

	const onChangeSchema = useMemo(() => {
		const requiredError = t(m.requiredError)

		return v.object({
			observationCount: v.pipe(
				v.string(),
				v.minLength(1, requiredError),
				v.trim(),
				v.digits(t(m.invalidObservationCountFormat)),
				v.transform((value) => {
					return Number(value)
				}),
				v.minValue(
					MIN_OBSERVATION_COUNT,
					t(m.minObservationCountError, {
						value: MIN_OBSERVATION_COUNT,
					}),
				),
				v.maxValue(
					MAX_OBSERVATION_COUNT,
					t(m.maxObservationCountError, {
						value: MAX_OBSERVATION_COUNT,
					}),
				),
			),
			boundedDistance: v.pipe(
				v.string(),
				v.minLength(1, requiredError),
				v.trim(),
				v.decimal(t(m.invalidBoundedDistanceFormat)),
				v.transform((value) => {
					return Number.parseFloat(value)
				}),
				v.minValue(
					MIN_BOUNDED_DISTANCE_KM,
					t(m.minBoundedDistanceError, { value: MIN_BOUNDED_DISTANCE_KM }),
				),
			),
			latitude: v.pipe(v.number(), v.minValue(-90), v.maxValue(90)),
			longitude: v.pipe(v.number(), v.minValue(-180), v.maxValue(180)),
			createTrack: v.boolean(),
		})
	}, [t])

	const form = useAppForm({
		defaultValues: {
			observationCount: '1',
			boundedDistance: DEFAULT_BOUNDED_DISTANCE_KM.toString(10),
			latitude: 0,
			longitude: 0,
			createTrack: false,
		},
		validators: {
			onChange: onChangeSchema,
		},
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
				message: `${t(m.observationCreateSuccess, {
					count: parsedValue.observationCount,
				})} ${t(m.trackCreateSuccess, { count: parsedValue.createTrack ? 1 : 0 })}`,
			})
		},
	})

	const boundedDistance = useStore(form.store, (state) => {
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

	const coordinates = useStore(form.store, (state) => {
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

	const data = featureCollection(boundingBox ? [bboxPolygon(boundingBox)] : [])

	const { data: mapStyleUrl } = useMapStyleUrl()

	const errorDialogProps: ErrorDialogProps =
		createTestObservations.status === 'error'
			? {
					errorMessage: createTestObservations.error.toString(),
					onClose: () => {
						createTestObservations.reset()
					},
					open: true,
				}
			: createTestTrack.status === 'error'
				? {
						open: true,
						errorMessage: createTestTrack.error.toString(),
						onClose: () => {
							createTestTrack.reset()
						},
					}
				: { open: false, onClose: () => {} }

	return (
		<>
			<TwoPanelLayout
				start={
					<Stack direction="column" flex={1}>
						<Stack
							direction="row"
							alignItems="center"
							component="nav"
							gap={4}
							padding={4}
							borderBottom={`1px solid ${BLUE_GREY}`}
						>
							<IconButton
								onClick={() => {
									if (router.history.canGoBack()) {
										router.history.back()
										return
									}

									router.navigate({ to: '/app/settings', replace: true })
								}}
							>
								<Icon name="material-arrow-back" size={30} />
							</IconButton>

							<Typography variant="h1" fontWeight={500}>
								{t(m.navTitle)}
							</Typography>
						</Stack>

						<Stack
							direction="column"
							flex={1}
							justifyContent="space-between"
							overflow="auto"
						>
							<Box padding={6}>
								<Box
									component="form"
									id={FORM_ID}
									noValidate
									autoComplete="off"
									onSubmit={(event) => {
										event.preventDefault()
										if (form.state.isSubmitting) return
										form.handleSubmit().catch((_err) => {
											// TODO: Report to Sentry?
										})
									}}
								>
									<Stack direction="column" gap={10}>
										<form.AppField name="observationCount">
											{(field) => (
												<field.TextField
													required
													fullWidth
													label={t(m.observationCountLabel)}
													value={field.state.value}
													error={!field.state.meta.isValid}
													name={field.name}
													onBlur={field.handleBlur}
													inputMode="numeric"
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
													slotProps={{ htmlInput: { maxLength: 4 } }}
													helperText={
														<Box component="span">
															{field.state.meta.errors.length > 0
																? field.state.meta.errors[0]?.message
																: t(m.observationCountHelperText, {
																		min: MIN_OBSERVATION_COUNT,
																		max: MAX_OBSERVATION_COUNT,
																	})}
														</Box>
													}
												/>
											)}
										</form.AppField>

										<Box
											component="fieldset"
											display="flex"
											flexDirection="column"
											border="none"
											padding={0}
											gap={10}
										>
											<Stack direction="column" gap={5}>
												<Typography>{t(m.coordinatesSelectionHint)}</Typography>
												<Stack
													direction="row"
													gap={4}
													justifyContent="space-between"
												>
													<form.AppField name="longitude">
														{(field) => (
															<field.TextField
																fullWidth
																aria-disabled
																disabled
																value={field.state.value}
																label="Longitude"
																helperText={
																	<Box component="span">
																		{field.state.meta.errors.length > 0
																			? field.state.meta.errors[0]?.message
																			: null}
																	</Box>
																}
															/>
														)}
													</form.AppField>

													<form.AppField name="latitude">
														{(field) => (
															<field.TextField
																fullWidth
																aria-disabled
																disabled
																value={field.state.value}
																label="Latitude"
																helperText={
																	<Box component="span">
																		{field.state.meta.errors.length > 0
																			? field.state.meta.errors[0]?.message
																			: null}
																	</Box>
																}
															/>
														)}
													</form.AppField>
												</Stack>
											</Stack>

											<form.AppField name="boundedDistance">
												{(field) => (
													<field.TextField
														required
														fullWidth
														label={t(m.boundedDistanceLabel)}
														value={field.state.value}
														error={!field.state.meta.isValid}
														name={field.name}
														onBlur={field.handleBlur}
														inputMode="decimal"
														onChange={(event) => {
															field.handleChange(event.target.value)
														}}
														helperText={
															<Box component="span">
																{field.state.meta.errors.length > 0
																	? field.state.meta.errors[0]?.message
																	: null}
															</Box>
														}
													/>
												)}
											</form.AppField>
										</Box>

										<form.AppField name="createTrack">
											{(field) => (
												<FormControlLabel
													control={<Checkbox />}
													checked={field.state.value}
													onChange={(_event, checked) => {
														field.handleChange(checked)
													}}
													onBlur={field.handleBlur}
													label={t(m.createTrack)}
												/>
											)}
										</form.AppField>
									</Stack>
								</Box>
							</Box>

							<Stack
								direction="column"
								gap={4}
								paddingX={6}
								paddingBottom={6}
								position="sticky"
								bottom={0}
								alignItems="center"
								zIndex={1}
							>
								<form.Subscribe
									selector={(state) =>
										[state.canSubmit, state.isSubmitting] as const
									}
								>
									{([canSubmit, isSubmitting]) => (
										<>
											<Button
												type="button"
												variant="outlined"
												fullWidth
												aria-disabled={isSubmitting}
												onClick={() => {
													if (isSubmitting) return

													if (router.history.canGoBack()) {
														router.history.back()
														return
													}

													router.navigate({
														to: '/app/settings',
														replace: true,
													})
												}}
												sx={{ maxWidth: 400 }}
											>
												{t(m.cancel)}
											</Button>

											<form.SubmitButton
												type="submit"
												form={FORM_ID}
												fullWidth
												variant="contained"
												loading={isSubmitting}
												loadingPosition="start"
												aria-disabled={!canSubmit}
												sx={{ maxWidth: 400 }}
											>
												{t(m.create)}
											</form.SubmitButton>
										</>
									)}
								</form.Subscribe>
							</Stack>
						</Stack>
					</Stack>
				}
				end={
					<Map
						mapStyle={mapStyleUrl}
						initialViewState={{
							fitBoundsOptions: {
								padding: 40,
								maxZoom: 12,
							},
							...(coordinates.latitude === 0 && coordinates.longitude === 0
								? coordinates
								: { bounds: boundingBox }),
						}}
						maxBounds={MAP_MAX_BOUNDS}
						onClick={(event) => {
							form.setFieldValue('latitude', event.lngLat.lat)
							form.setFieldValue('longitude', event.lngLat.lng)
						}}
					>
						<Source id="selection" type="geojson" data={data}>
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
									form.setFieldValue('latitude', event.lngLat.lat)
									form.setFieldValue('longitude', event.lngLat.lng)
								}}
							/>
						) : null}
					</Map>
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

			<ErrorDialog {...errorDialogProps} />
		</>
	)
}

const CREATE_TEST_OBSERVATIONS_MUTATION_KEY = createGlobalMutationsKey([
	'create-test-observations',
])

const CREATE_TEST_TRACK_MUTATION_KEY = createGlobalMutationsKey([
	'create-test-track',
])

function useCreateTestObservations({ projectId }: { projectId: string }) {
	const queryClient = useQueryClient()

	const { data: deviceInfo } = useOwnDeviceInfo()

	const { data: presets } = useManyDocs({ projectId, docType: 'preset' })

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

				const randomPreset = draw(presets)!

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
		onSuccess: () => {
			queryClient.invalidateQueries({
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
	const queryClient = useQueryClient()

	const { data: deviceInfo } = useOwnDeviceInfo()

	const { data: presets } = useManyDocs({ projectId, docType: 'preset' })

	const createTrack = useCreateDocument({
		projectId,
		docType: 'track',
	})

	return useMutation({
		mutationKey: CREATE_TEST_TRACK_MUTATION_KEY,
		mutationFn: async ({
			observations,
		}: {
			observations: Array<Observation>
		}) => {
			const randomPreset = Math.random() > 0.5 ? draw(presets) : null

			const locations: Track['locations'] = []
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
		onSuccess: () => {
			queryClient.invalidateQueries({
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

const m = defineMessages({
	navTitle: {
		id: 'routes.app.settings_.test-data.navTitle',
		defaultMessage: 'Create Test Data',
		description: 'Title of test data page.',
	},
	requiredError: {
		id: 'routes.app.settings_.test-data.requiredError',
		defaultMessage: 'Required',
		description: 'Error message for when required input is empty.',
	},
	observationCountLabel: {
		id: 'routes.app.settings_.test-data.observationCountLabel',
		defaultMessage: 'Number of observations',
		description: 'Label for the observation count input.',
	},
	boundedDistanceLabel: {
		id: 'routes.app.settings_.test-data.boundedDistanceLabel',
		defaultMessage: 'Maximum bounded distance (kilometers)',
		description: 'Label for the bounded distance input.',
	},
	invalidObservationCountFormat: {
		id: 'routes.app.settings_.test-data.invalidObservationCountFormat',
		defaultMessage: 'Must be an integer',
		description: 'Error message for when observation count is not an integer.',
	},
	invalidBoundedDistanceFormat: {
		id: 'routes.app.settings_.test-data.invalidBoundedDistanceFormat',
		defaultMessage: 'Must be a decimal',
		description: 'Error message for when bounded distance is not an decimal.',
	},
	minObservationCountError: {
		id: 'routes.app.settings_.test-data.minObservationCountError',
		defaultMessage: 'Must be greater than {value}',
		description: 'Error message for when observation count is too small',
	},
	maxObservationCountError: {
		id: 'routes.app.settings_.test-data.maxObservationCountError',
		defaultMessage: 'Cannot be greater than {value}',
		description: 'Error message for when observation count is too large',
	},
	observationCountHelperText: {
		id: 'routes.app.settings_.test-data.observationCountHelperText',
		defaultMessage: 'Between {min} and {max}',
		description: 'Helper text for observation count input.',
	},
	minBoundedDistanceError: {
		id: 'routes.app.settings_.test-data.minBoundedDistanceError',
		defaultMessage: 'Must be greater than {value} kilometers',
		description: 'Error message for when bounded distance is too small',
	},
	cancel: {
		id: 'routes.app.settings_.test-data.cancel',
		defaultMessage: 'Cancel',
		description: 'Label for cancel button.',
	},
	create: {
		id: 'routes.app.settings_.test-data.create',
		defaultMessage: 'Create',
		description: 'Label for create button.',
	},
	coordinatesSelectionHint: {
		id: 'routes.app.settings_.test-data.coordinatesSelectionHint',
		defaultMessage:
			'Set the coordinates by clicking on the map or dragging the location marker.',
		description: 'Instructions displayed for coordinates selection inputs.',
	},
	createTrack: {
		id: 'routes.app.settings_.test-data.createTrack',
		defaultMessage: 'Create track',
		description: 'Label for toggle to create track when creating test data.',
	},
	observationCreateSuccess: {
		id: 'routes.app.settings_.test-data.observationCreateSuccess',
		defaultMessage:
			'Created {count, plural, one {# observation} other {# observations}}.',
		description: 'Message displayed when observation creation succeeds.',
	},
	trackCreateSuccess: {
		id: 'routes.app.settings_.test-data.trackCreateSuccess',
		defaultMessage: 'Created {count, plural, one {# track} other {# tracks}}.',
		description: 'Message displayed when track creation succeeds.',
	},
})
