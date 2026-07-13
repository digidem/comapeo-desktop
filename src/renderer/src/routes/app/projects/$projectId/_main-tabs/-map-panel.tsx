import {
	Suspense,
	useCallback,
	useEffect,
	useEffectEvent,
	useMemo,
	useRef,
	useState,
	type ReactNode,
} from 'react'
import {
	useManyDocs,
	useMapStyleUrl,
	useSingleDocByDocId,
} from '@comapeo/core-react'
import type { Observation, Preset, Track } from '@comapeo/core/schema.js'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'
import { captureMessage } from '@sentry/react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { bbox } from '@turf/bbox'
import { center } from '@turf/center'
import { featureCollection, lineString, point } from '@turf/helpers'
import type { Feature, Point } from 'geojson'
import type {
	FilterSpecification,
	FitBoundsOptions,
	LineLayerSpecification,
	MapLibreEvent,
} from 'maplibre-gl'
import { defineMessages, useIntl } from 'react-intl'
import {
	Layer,
	Marker,
	NavigationControl,
	ScaleControl,
	Source,
	type CircleLayerSpecification,
	type MapInstance,
	type MapLayerMouseEvent,
	type MapRef,
} from 'react-map-gl/maplibre'
import * as v from 'valibot'

import { BLACK, BLUE_GREY, ORANGE, WHITE } from '../../../../../colors.ts'
import {
	CategoryIconContainer,
	CategoryIconImage,
} from '../../../../../components/category-icon.tsx'
import { Icon } from '../../../../../components/icon.tsx'
import {
	type OmittedVisibility,
	ToggleOmittedVisibilityMapControl,
	ZoomToDataMapControl,
	ZoomToSelectedDocumentMapControl,
} from '../../../../../components/map-controls.tsx'
import { Map } from '../../../../../components/map.tsx'
import { useNetworkAwareMapStyleUrl } from '../../../../../hooks/maps.ts'
import { getMatchingCategoryForDocument } from '../../../../../lib/comapeo.ts'
import {
	getItem,
	removeItem,
	setItem,
	type DateFilter,
} from '../../../../../lib/local-storage.ts'
import {
	getLocaleStateQueryOptions,
	getUnitSystemQueryOptions,
} from '../../../../../lib/queries/app-settings.ts'
import {
	dateFilterToDateRange,
	isDocumentIncludedByFilters,
	type HighlightedDocument,
} from './-shared.ts'

// TODO: Move to lib/colors
const SHADOW_COLOR = '#686868'

const OBSERVATIONS_SOURCE_ID = 'observations_source' as const
const TRACKS_SOURCE_ID = 'tracks_source' as const

const OBSERVATIONS_LAYER_ID = 'observations_layer' as const
const TRACKS_LAYER_ID = 'tracks_layer' as const
const TRACKS_HOVER_OUTLINE_LAYER_ID = 'tracks_hover_outline_layer' as const
const TRACKS_HOVER_SHADOW_LAYER_ID = 'tracks_hover_shadow_layer' as const

const OBSERVATIONS_LAYER_LAYOUT: CircleLayerSpecification['layout'] = {
	// NOTE: Ensures that visible features appear on top of hidden ones (when filters are active)
	'circle-sort-key': ['case', ['boolean', ['get', 'visible'], true], 1, 0],
}
const TRACKS_LAYER_LAYOUT: LineLayerSpecification['layout'] = {
	'line-cap': 'round',
	'line-join': 'round',
	// NOTE: Ensures that visible features appear on top of hidden ones (when filters are active)
	'line-sort-key': ['case', ['boolean', ['get', 'visible'], true], 1, 0],
}
const TRACKS_LAYER_PAINT_PROPERTY: LineLayerSpecification['paint'] = {
	'line-color': BLACK,
	'line-width': 4,
	'line-opacity': [
		'case',
		[
			'any',
			['boolean', ['get', 'visible'], true],
			['boolean', ['feature-state', 'highlight'], false],
		],
		1,
		0.1,
	],
}
const TRACKS_HOVER_OUTLINE_LAYER_PAINT_PROPERTY: LineLayerSpecification['paint'] =
	{
		'line-color': WHITE,
		'line-width': 12,
		'line-opacity': [
			'case',
			['boolean', ['feature-state', 'highlight'], false],
			1,
			0,
		],
	}
const TRACKS_HOVER_SHADOW_LAYER_PAINT_PROPERTY: LineLayerSpecification['paint'] =
	{
		'line-color': SHADOW_COLOR,
		'line-blur': 20,
		'line-width': 20,
		'line-opacity': [
			'case',
			['boolean', ['feature-state', 'highlight'], false],
			1,
			0,
		],
	}

const INTERACTIVE_LAYER_IDS = [OBSERVATIONS_LAYER_ID, TRACKS_LAYER_ID]

const DEFAULT_BOUNDING_BOX: [number, number, number, number] = [
	-180, -85.0511, 180, 85.0511,
]

const BASE_FIT_BOUNDS_OPTIONS: FitBoundsOptions = {
	padding: 40,
	maxZoom: 12,
	linear: true,
}

export function MapPanel({
	allowHighlightedDocumentMarker,
	categoriesFilter,
	dateFilter,
	documentToHighlight,
	filterReferenceDate,
	isDocumentRoute,
	projectId,
}: {
	allowHighlightedDocumentMarker: boolean
	categoriesFilter?: Array<string>
	dateFilter?: DateFilter
	documentToHighlight?: HighlightedDocument
	filterReferenceDate?: Date
	isDocumentRoute: boolean
	projectId: string
}) {
	const router = useRouter()

	const { formatMessage: t } = useIntl()

	const [mapLoaded, setMapLoaded] = useState(false)

	const mapRef = useRef<MapRef>(null)

	const { data: lang } = useSuspenseQuery({
		...getLocaleStateQueryOptions(),
		select: ({ value }) => value,
	})

	const { data: unitSystem } = useSuspenseQuery(getUnitSystemQueryOptions())

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

	const { data: originalStyleUrl } = useMapStyleUrl()
	const mapStyleUrl = useNetworkAwareMapStyleUrl(originalStyleUrl)

	const observationsFeatureCollection = useMemo(() => {
		return observationsToFeatureCollection({
			categories,
			filters: { categories: categoriesFilter, date: dateFilter },
			observations,
			referenceDate: filterReferenceDate || new Date(),
		})
	}, [
		observations,
		categories,
		categoriesFilter,
		dateFilter,
		filterReferenceDate,
	])

	const tracksFeatureCollection = useMemo(() => {
		return tracksToFeatureCollection({
			categories,
			filters: { categories: categoriesFilter, date: dateFilter },
			tracks,
			referenceDate: filterReferenceDate || new Date(),
		})
	}, [tracks, categories, categoriesFilter, dateFilter, filterReferenceDate])

	console.log('*** tracksFeatureCollection', tracksFeatureCollection)

	const observationsLayerPaint = useMemo(() => {
		return createObservationLayerPaintProperty(categories)
	}, [categories])

	const mapBbox: [number, number, number, number] = useMemo(() => {
		if (
			observationsFeatureCollection.features.length === 0 &&
			tracksFeatureCollection.features.length === 0
		) {
			return DEFAULT_BOUNDING_BOX
		}

		// TODO: There's probably a better way of doing this with turf but not worth trying to figure out
		const observationsBbox = bbox(observationsFeatureCollection)
		const tracksBbox = bbox(tracksFeatureCollection)

		const minLon = Math.min(tracksBbox[0], observationsBbox[0])
		const minLat = Math.min(tracksBbox[1], observationsBbox[1])
		const maxLon = Math.max(tracksBbox[2], observationsBbox[2])
		const maxLat = Math.max(tracksBbox[3], observationsBbox[3])

		return [minLon, minLat, maxLon, maxLat]
	}, [observationsFeatureCollection, tracksFeatureCollection])

	const moveMapToObservation = useCallback(
		(
			{
				coordinates,
				shouldZoomIn,
			}: { coordinates: [lat: number, lon: number]; shouldZoomIn?: boolean },
			map: MapInstance | MapRef,
		) => {
			map.panTo(
				{ lon: coordinates[0], lat: coordinates[1] },
				{ zoom: shouldZoomIn ? 10 : undefined },
			)
		},
		[],
	)

	const moveMapToTrack = useCallback(
		(
			{
				trackFeature,
				shouldZoomIn,
			}: {
				trackFeature: ReturnType<
					typeof tracksToFeatureCollection
				>['features'][number]
				shouldZoomIn?: boolean
			},
			map: MapInstance | MapRef,
		) => {
			const c = center(trackFeature)

			const [minLon, minLat, maxLon, maxLat] = bbox(trackFeature)

			map.panTo(
				{ lon: c.geometry.coordinates[0]!, lat: c.geometry.coordinates[1]! },
				{ zoom: shouldZoomIn ? 10 : undefined },
			)

			map.fitBounds([minLon, minLat, maxLon, maxLat], BASE_FIT_BOUNDS_OPTIONS)
		},
		[],
	)

	const onMapClick = useCallback(
		(event: MapLayerMouseEvent) => {
			const feature = event.features?.[0]

			if (!feature) {
				if (documentToHighlight) {
					router.navigate({
						to: '.',
						search: (prev) => ({ ...prev, highlightedDocument: undefined }),
					})
				}

				return
			}

			const mapInstance = event.target
			const shouldZoomIn = mapInstance.getZoom() < 10

			if (
				feature.layer.id === OBSERVATIONS_LAYER_ID &&
				typeof feature.properties.docId === 'string'
			) {
				const observationMatch = observationsFeatureCollection.features.find(
					({ properties }) => properties.docId === feature.properties.docId,
				)

				if (observationMatch) {
					moveMapToObservation(
						{
							coordinates: [
								observationMatch.geometry.coordinates[0]!,
								observationMatch.geometry.coordinates[1]!,
							],
							shouldZoomIn,
						},
						mapInstance,
					)
				}

				router.navigate({
					to: '/app/projects/$projectId/observations/$observationDocId',
					params: {
						projectId,
						observationDocId: feature.properties.docId,
					},
					mask: {
						to: '/app/projects/$projectId/observations/$observationDocId',
						params: { projectId, observationDocId: feature.properties.docId },
						search: (prev) => ({
							...prev,
							highlightedDocument: undefined,
						}),
					},
				})

				return
			}

			if (
				feature.layer.id === TRACKS_LAYER_ID &&
				typeof feature.properties.docId === 'string'
			) {
				const tracksMatch = tracksFeatureCollection.features.find(
					({ properties }) => properties.docId === feature.properties.docId,
				)

				if (tracksMatch) {
					moveMapToTrack(
						{ trackFeature: tracksMatch, shouldZoomIn },
						mapInstance,
					)
				}

				router.navigate({
					to: '/app/projects/$projectId/tracks/$trackDocId',
					params: { projectId, trackDocId: feature.properties.docId },
					mask: {
						to: '/app/projects/$projectId/tracks/$trackDocId',
						params: { projectId, trackDocId: feature.properties.docId },
						search: (prev) => ({ ...prev, highlightedDocument: undefined }),
					},
				})

				return
			}
		},
		[
			documentToHighlight,
			moveMapToObservation,
			moveMapToTrack,
			observationsFeatureCollection,
			tracksFeatureCollection,
			router,
			projectId,
		],
	)

	/**
	 * NOTE: Determines if the hover state of a feature should be enabled
	 */
	const onMapMouseMove = useCallback(
		(event: MapLayerMouseEvent) => {
			const mapInstance = event.target

			const feature = event.features?.[0]

			const mapCanvas = mapInstance.getCanvas()

			// NOTE: Hovering over nothing
			if (!(feature && typeof feature.properties.docId === 'string')) {
				// Clear the existing feature states
				mapInstance.removeFeatureState({ source: OBSERVATIONS_SOURCE_ID })
				mapInstance.removeFeatureState({ source: TRACKS_SOURCE_ID })

				// Restore feature states related to highlighted document
				if (documentToHighlight) {
					// Enable the hover state for the relevant feature
					if (documentToHighlight.type === 'observation') {
						let trackDocIdToHighlight: string | undefined

						for (const t of tracks) {
							if (
								t.observationRefs.some(
									(o) => o.docId === documentToHighlight.docId,
								)
							) {
								trackDocIdToHighlight = t.docId
								break
							}
						}

						// NOTE: Highlight the associated track as well
						if (trackDocIdToHighlight) {
							mapInstance.setFeatureState(
								{ source: TRACKS_SOURCE_ID, id: trackDocIdToHighlight },
								{ highlight: true },
							)
						}
					} else {
						mapInstance.setFeatureState(
							{ source: TRACKS_SOURCE_ID, id: documentToHighlight.docId },
							{ highlight: true },
						)
					}
				}

				// Restore default cursor style
				if (mapCanvas.style.cursor !== 'inherit') {
					mapInstance.getCanvas().style.cursor = 'inherit'
				}

				return
			}

			// NOTE: Update the cursor style when hovering over a relevant feature
			if (
				(feature.layer.id === OBSERVATIONS_LAYER_ID ||
					feature.layer.id === TRACKS_LAYER_ID) &&
				mapCanvas.style.cursor !== 'pointer'
			) {
				mapCanvas.style.cursor = 'pointer'
			}

			// NOTE: Enable the hover state for the relevant features
			if (feature.layer.id === OBSERVATIONS_LAYER_ID) {
				mapInstance.setFeatureState(
					{ source: OBSERVATIONS_SOURCE_ID, id: feature.properties.docId },
					{ highlight: true },
				)

				let trackDocIdToHighlight: string | undefined

				for (const t of tracks) {
					if (
						t.observationRefs.some((o) => o.docId === feature.properties.docId)
					) {
						trackDocIdToHighlight = t.docId
						break
					}
				}

				// NOTE: Highlight the associated track as well
				if (trackDocIdToHighlight) {
					mapInstance.setFeatureState(
						{ source: TRACKS_SOURCE_ID, id: trackDocIdToHighlight },
						{ highlight: true },
					)
				}
			} else if (feature.layer.id === TRACKS_LAYER_ID) {
				mapInstance.setFeatureState(
					{ source: TRACKS_SOURCE_ID, id: feature.properties.docId },
					{ highlight: true },
				)
			}
		},
		[documentToHighlight, tracks],
	)

	/**
	 * NOTE: On initial map load, if there's a document to highlight, pan to it
	 * and zoom in if necessary. Otherwise, update the bounding box of the map to
	 * fit all of the features.
	 */
	const onMapLoad = useCallback(
		(event: MapLibreEvent) => {
			const mapInstance = event.target

			if (!documentToHighlight) {
				mapInstance.fitBounds(mapBbox, {
					...BASE_FIT_BOUNDS_OPTIONS,
					animate: false,
				})

				setMapLoaded(true)

				return
			}

			const { type, docId } = documentToHighlight

			const shouldZoomIn = mapInstance.getZoom() < 10

			if (type === 'observation') {
				const observationMatch = observationsFeatureCollection.features.find(
					({ properties }) => properties.docId === docId,
				)

				if (observationMatch) {
					moveMapToObservation(
						{
							coordinates: [
								observationMatch.geometry.coordinates[0]!,
								observationMatch.geometry.coordinates[1]!,
							],
							shouldZoomIn,
						},
						mapInstance,
					)
				}
			} else {
				const tracksMatch = tracksFeatureCollection.features.find(
					({ properties }) => properties.docId === docId,
				)

				if (tracksMatch) {
					moveMapToTrack(
						{ trackFeature: tracksMatch, shouldZoomIn },
						mapInstance,
					)
				}
			}

			setMapLoaded(true)
		},
		[
			documentToHighlight,
			mapBbox,
			moveMapToObservation,
			moveMapToTrack,
			observationsFeatureCollection,
			setMapLoaded,
			tracksFeatureCollection,
		],
	)

	const highlightedFeature = useMemo(() => {
		if (!documentToHighlight) {
			return undefined
		}

		const collectionToSearch =
			documentToHighlight.type === 'observation'
				? observationsFeatureCollection
				: tracksFeatureCollection

		return collectionToSearch.features.find(
			(f) => f.properties.docId === documentToHighlight.docId,
		)
	}, [
		documentToHighlight,
		observationsFeatureCollection,
		tracksFeatureCollection,
	])

	const highlightMapFeature = useEffectEvent(
		(document: HighlightedDocument) => {
			if (!mapRef.current) {
				return
			}

			mapRef.current.removeFeatureState({ source: OBSERVATIONS_SOURCE_ID })
			mapRef.current.removeFeatureState({ source: TRACKS_SOURCE_ID })

			const shouldZoomIn = mapRef.current.getZoom() < 10

			if (document.type === 'observation') {
				let trackDocIdToHighlight: string | undefined

				for (const t of tracks) {
					if (t.observationRefs.some((o) => o.docId === document.docId)) {
						trackDocIdToHighlight = t.docId
						break
					}
				}

				// 1. Highlight the track that references the observation
				if (trackDocIdToHighlight) {
					mapRef.current.setFeatureState(
						{ source: TRACKS_SOURCE_ID, id: trackDocIdToHighlight },
						{ highlight: true },
					)
				}

				const observationMatch = observationsFeatureCollection.features.find(
					({ properties }) => properties.docId === document.docId,
				)

				// 2. Move to observation
				if (observationMatch) {
					moveMapToObservation(
						{
							coordinates: [
								observationMatch.geometry.coordinates[0]!,
								observationMatch.geometry.coordinates[1]!,
							],
							shouldZoomIn,
						},
						mapRef.current,
					)
				}
			} else {
				// 1. Highlight the track
				mapRef.current.setFeatureState(
					{ source: TRACKS_SOURCE_ID, id: document.docId },
					{ highlight: true },
				)

				const tracksMatch = tracksFeatureCollection.features.find(
					({ properties }) => properties.docId === document.docId,
				)

				// 2. Move to the track
				if (tracksMatch) {
					moveMapToTrack(
						{ trackFeature: tracksMatch, shouldZoomIn },
						mapRef.current,
					)
				}
			}
		},
	)

	useEffect(
		/**
		 * Controls map feature highlighting for when items in the list selected via
		 * click.
		 */
		function onUpdateFromListClick() {
			// NOTE: Only care about triggers from list interactions
			if (documentToHighlight?.from !== 'list') {
				return
			}

			highlightMapFeature(documentToHighlight)
		},
		[documentToHighlight],
	)

	const [omittedVisibility, setOmittedVisibility] = useState<OmittedVisibility>(
		() => {
			const stored = getItem('map/show_omitted', projectId)
			return stored ? 'visible' : 'hidden'
		},
	)

	const layerFilter: FilterSpecification = [
		'case',
		['boolean', omittedVisibility === 'visible'],
		true,
		['boolean', ['get', 'visible'], true],
	]

	return (
		<Box sx={{ position: 'relative', display: 'flex', flex: 1 }}>
			{mapLoaded ? null : (
				<Box
					sx={{
						display: 'flex',
						flex: 1,
						justifyContent: 'center',
						alignItems: 'center',
						position: 'absolute',
						left: 0,
						right: 0,
						top: 0,
						bottom: 0,
						bgcolor: BLACK,
						opacity: 0.5,
					}}
				>
					<CircularProgress />
				</Box>
			)}
			<Map
				ref={mapRef}
				mapStyle={mapStyleUrl}
				initialViewState={{
					bounds: mapBbox,
					fitBoundsOptions: BASE_FIT_BOUNDS_OPTIONS,
				}}
				// TODO: Consider making this the bounding box of the data?
				// Needs to be explicitly set to this since we reuse map instances
				// and this seems to get preserved between different usages of the maps.
				maxBounds={undefined}
				interactiveLayerIds={INTERACTIVE_LAYER_IDS}
				onLoad={onMapLoad}
				onClick={mapLoaded ? onMapClick : undefined}
				onMouseMove={mapLoaded ? onMapMouseMove : undefined}
				touchPitch={false}
				dragRotate={false}
				pitchWithRotate={false}
				touchZoomRotate={false}
			>
				<ScaleControl unit={unitSystem} />

				<NavigationControl showCompass={false} />

				{observations.length + tracks.length > 0 ? (
					<ZoomToDataMapControl
						buttonTitle={t(m.zoomToData)}
						fitBoundsOptions={BASE_FIT_BOUNDS_OPTIONS}
						sourceIds={[OBSERVATIONS_SOURCE_ID, TRACKS_SOURCE_ID]}
					/>
				) : null}

				{documentToHighlight ? (
					<ZoomToSelectedDocumentMapControl
						// NOTE: Important to remount or else it uses stale document reference
						key={documentToHighlight.docId}
						buttonTitle={t(m.zoomToSelected)}
						document={documentToHighlight}
						fitBoundsOptions={BASE_FIT_BOUNDS_OPTIONS}
						sourceIds={[
							documentToHighlight.type === 'observation'
								? OBSERVATIONS_SOURCE_ID
								: TRACKS_SOURCE_ID,
						]}
					/>
				) : null}

				{categoriesFilter || dateFilter ? (
					<ToggleOmittedVisibilityMapControl
						initialValue={omittedVisibility}
						onToggle={() => {
							setOmittedVisibility((prev) => {
								const updatedValue = prev === 'hidden' ? 'visible' : 'hidden'

								if (updatedValue === 'hidden') {
									removeItem('map/show_omitted', projectId)
								} else {
									setItem(
										'map/show_omitted',
										updatedValue === 'visible',
										projectId,
									)
								}

								return updatedValue
							})
						}}
						buttonTitle={t(m.toggleOmittedVisibility)}
					/>
				) : null}

				<Source
					type="geojson"
					id={TRACKS_SOURCE_ID}
					data={tracksFeatureCollection}
					// NOTE: Need this in order for the feature-state querying to work when hovering
					promoteId="docId"
				>
					<Layer
						type="line"
						id={TRACKS_HOVER_SHADOW_LAYER_ID}
						paint={TRACKS_HOVER_SHADOW_LAYER_PAINT_PROPERTY}
						layout={TRACKS_LAYER_LAYOUT}
						filter={layerFilter}
					/>

					<Layer
						type="line"
						id={TRACKS_HOVER_OUTLINE_LAYER_ID}
						paint={TRACKS_HOVER_OUTLINE_LAYER_PAINT_PROPERTY}
						layout={TRACKS_LAYER_LAYOUT}
						filter={layerFilter}
					/>

					<Layer
						type="line"
						id={TRACKS_LAYER_ID}
						paint={TRACKS_LAYER_PAINT_PROPERTY}
						layout={TRACKS_LAYER_LAYOUT}
						filter={layerFilter}
					/>
				</Source>

				<Source
					type="geojson"
					id={OBSERVATIONS_SOURCE_ID}
					data={observationsFeatureCollection}
					// NOTE: Need this in order for the feature-state querying to work when hovering
					promoteId="docId"
				>
					<Layer
						type="circle"
						id={OBSERVATIONS_LAYER_ID}
						paint={observationsLayerPaint}
						layout={OBSERVATIONS_LAYER_LAYOUT}
						filter={layerFilter}
					/>
				</Source>

				{allowHighlightedDocumentMarker &&
				highlightedFeature &&
				highlightedFeature.geometry.type === 'Point' &&
				highlightedFeature.properties.type === 'observation' ? (
					<Marker
						anchor="bottom"
						onClick={(event) => {
							event.originalEvent.preventDefault()
							event.originalEvent.stopImmediatePropagation()
						}}
						longitude={highlightedFeature.geometry.coordinates[0]!}
						latitude={highlightedFeature.geometry.coordinates[1]!}
					>
						{highlightedFeature.properties.categoryDocId ? (
							<Suspense>
								<CategoryIconMarker
									categoryDocumentId={
										highlightedFeature.properties.categoryDocId
									}
									projectId={projectId}
									lang={lang}
								/>
							</Suspense>
						) : (
							<IconMarkerContainer
								color={BLUE_GREY}
								markerSize={MARKER_SIZE_PX}
							>
								<CategoryIconContainer
									color={BLUE_GREY}
									applyBoxShadow
									padding={2}
								>
									<Icon name="material-place" size={CATEGORY_ICON_SIZE_PX} />
								</CategoryIconContainer>
							</IconMarkerContainer>
						)}
					</Marker>
				) : null}

				{isDocumentRoute && !highlightedFeature ? (
					<Box
						sx={{
							position: 'absolute',
							bottom: 0,
							top: 0,
							right: 0,
							left: 0,
							bgcolor: BLACK,
							display: 'grid',
							placeItems: 'center',
							backgroundColor: alpha(BLACK, 0.5),
						}}
					>
						<Typography color="textInverted">
							{t(m.cannotDisplayFeature)}
						</Typography>
					</Box>
				) : null}
			</Map>
		</Box>
	)
}

const MARKER_SIZE_PX = 68
const CATEGORY_ICON_SIZE_PX = 24

function IconMarkerContainer({
	color,
	children,
	markerSize,
}: {
	color: string
	children: ReactNode
	markerSize: number | string
}) {
	return (
		<Box
			sx={{
				position: 'relative',
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'center',
				alignItems: 'center',
			}}
		>
			<Icon
				name="comapeo-selected-marker"
				htmlColor={color}
				sx={{
					filter: `drop-shadow(0 0 3px ${SHADOW_COLOR});`,
					height: markerSize,
					width: markerSize,
				}}
			/>

			<Box sx={{ position: 'absolute', top: 0 }}>{children}</Box>
		</Box>
	)
}

function CategoryIconMarker({
	categoryDocumentId,
	lang,
	projectId,
}: {
	categoryDocumentId: string
	lang: string
	projectId: string
}) {
	const { formatMessage: t } = useIntl()

	const { data: category } = useSingleDocByDocId({
		projectId,
		docType: 'preset',
		docId: categoryDocumentId,
		lang,
	})

	const color = category.color || BLUE_GREY

	return (
		<IconMarkerContainer color={color} markerSize={MARKER_SIZE_PX}>
			<CategoryIconContainer color={color} applyBoxShadow padding={2}>
				{category.iconRef?.docId ? (
					<CategoryIconImage
						projectId={projectId}
						iconDocumentId={category.iconRef.docId}
						imageStyle={{ height: CATEGORY_ICON_SIZE_PX, aspectRatio: 1 }}
						altText={t(m.categoryIconAlt, { name: category.name })}
					/>
				) : (
					<Icon name="material-place" size={CATEGORY_ICON_SIZE_PX} />
				)}
			</CategoryIconContainer>
		</IconMarkerContainer>
	)
}

function observationsToFeatureCollection({
	categories,
	filters,
	observations,
	referenceDate,
}: {
	categories: Array<Preset>
	observations: Array<Observation>
	filters?: { categories?: Array<string>; date?: DateFilter }
	referenceDate: Date
}) {
	const displayablePoints: Array<
		Feature<
			Point,
			{ type: 'observation'; docId: string; categoryDocId?: string }
		>
	> = []

	for (const obs of observations) {
		if (typeof obs.lon === 'number' && typeof obs.lat === 'number') {
			const category = getMatchingCategoryForDocument(obs, categories)

			const categoriesFilter = filters?.categories

			const isVisible = isDocumentIncludedByFilters(
				{ document: obs, category },
				{
					categories: categoriesFilter
						? categories.filter((c) => categoriesFilter.includes(c.docId))
						: categories,
					date: filters?.date
						? dateFilterToDateRange(filters.date, referenceDate)
						: undefined,
				},
			)

			displayablePoints.push(
				point([obs.lon, obs.lat], {
					type: 'observation' as const,
					docId: obs.docId,
					categoryDocId: category?.docId,
					visible: isVisible,
				}),
			)
		}
	}

	return featureCollection(displayablePoints)
}

function tracksToFeatureCollection({
	categories,
	filters,
	referenceDate,
	tracks,
}: {
	categories: Array<Preset>
	filters?: { categories?: Array<string>; date?: DateFilter }
	referenceDate: Date
	tracks: Array<Track>
}) {
	const displayableTracks = []

	for (const t of tracks) {
		if (t.locations.length === 0) {
			captureMessage('Track has no locations', {
				level: 'warning',
				extra: { docId: t.docId },
			})

			continue
		}

		const locations = t.locations.map((location) => [
			location.coords.longitude,
			location.coords.latitude,
		])

		const category = getMatchingCategoryForDocument(t, categories)

		const categoriesFilter = filters?.categories

		const isVisible = isDocumentIncludedByFilters(
			{ document: t, category },
			{
				categories: categoriesFilter
					? categories.filter((c) => categoriesFilter.includes(c.docId))
					: categories,
				date: filters?.date
					? dateFilterToDateRange(filters.date, referenceDate)
					: undefined,
			},
		)

		const featureProperties = {
			type: 'track' as const,
			docId: t.docId,
			visible: isVisible,
		} as const

		// NOTE: We still want to show tracks despite having only 1 location
		// so we duplicate the lone point to make it a valid line string.
		if (locations.length === 1) {
			captureMessage('Track has only 1 location', {
				level: 'warning',
				extra: { docId: t.docId },
			})

			displayableTracks.push(
				lineString(locations.concat(locations), featureProperties),
			)
		} else {
			displayableTracks.push(lineString(locations, featureProperties))
		}
	}

	return featureCollection(displayableTracks)
}

function createObservationLayerPaintProperty(
	categories: Array<Preset>,
): CircleLayerSpecification['paint'] {
	const categoryColorPairs: Array<string> = []

	for (const { color, docId } of categories) {
		// @comapeo/schema only allows hex values for color field
		if (v.is(v.pipe(v.string(), v.hexColor()), color)) {
			categoryColorPairs.push(docId, color)
		}
	}

	return {
		// @ts-expect-error Type def doesn't like the spread of the pairs
		'circle-color':
			categoryColorPairs.length > 0
				? ['match', ['get', 'categoryDocId'], ...categoryColorPairs, ORANGE]
				: ORANGE,
		'circle-opacity': [
			'case',
			[
				'any',
				['boolean', ['get', 'visible'], true],
				['boolean', ['feature-state', 'highlight'], false],
			],
			1,
			0.2,
		],
		'circle-radius': [
			'case',
			['boolean', ['feature-state', 'highlight'], false],
			9,
			6,
		],
		'circle-stroke-color': WHITE,
		'circle-stroke-width': 3,
	}
}

const m = defineMessages({
	categoryIconAlt: {
		id: 'routes.app.projects.$projectId.-map-panel.categoryIconAlt',
		defaultMessage: 'Icon for {name} category',
		description:
			'Alt text for icon image displayed for category (used for accessibility tools).',
	},
	zoomToData: {
		id: '$1.routes.app.projects.$projectId.-map-panel.zoomToData',
		defaultMessage: 'Zoom to data',
		description:
			'Text displayed when hovering over map control for zooming to data.',
	},
	zoomToSelected: {
		id: '$1.routes.app.projects.$projectId.-map-panel.zoomToSelected',
		defaultMessage: 'Zoom to selected',
		description:
			'Text displayed when hovering over map control for zooming to selected.',
	},
	cannotDisplayFeature: {
		id: '$1.routes.app.projects.$projectId.-map-panel.cannotDisplayFeature',
		defaultMessage: 'Cannot display feature',
		description:
			'Text displayed when map feature for selected data cannot be displayed',
	},
	toggleOmittedVisibility: {
		id: '$1.routes.app.projects.$projectId.-map-panel.toggleOmittedVisibility',
		defaultMessage: 'Toggle omitted visibility',
		description:
			'Text displayed when hovering over map control for toggling visibility of features omitted by filters.',
	},
})
