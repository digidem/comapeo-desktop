import {
	Suspense,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react'
import {
	useManyDocs,
	useMapStyleUrl,
	useSingleDocByDocId,
} from '@comapeo/core-react'
import type { Observation, Preset, Track } from '@comapeo/schema'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'
import { captureMessage } from '@sentry/react'
import { useSuspenseQuery } from '@tanstack/react-query'
import {
	useChildMatches,
	useNavigate,
	useParams,
	useSearch,
} from '@tanstack/react-router'
import { bbox } from '@turf/bbox'
import { center } from '@turf/center'
import { featureCollection, lineString, point } from '@turf/helpers'
import type { Feature, Point } from 'geojson'
import type { FitBoundsOptions, LineLayerSpecification } from 'maplibre-gl'
import { defineMessages, useIntl } from 'react-intl'
import {
	Layer,
	Marker,
	NavigationControl,
	ScaleControl,
	Source,
	type CircleLayerSpecification,
	type MapLayerMouseEvent,
	type MapRef,
} from 'react-map-gl/maplibre'
import * as v from 'valibot'

import { BLACK, BLUE_GREY, ORANGE, WHITE } from '../../../../../colors'
import {
	CategoryIconContainer,
	CategoryIconImage,
} from '../../../../../components/category-icon'
import { Icon } from '../../../../../components/icon'
import { Map } from '../../../../../components/map'
import { ZoomToDataMapControl } from '../../../../../components/zoom-to-data-map-control'
import { useMapsRefreshToken } from '../../../../../hooks/maps'
import { getMatchingCategoryForDocument } from '../../../../../lib/comapeo'
import { getLocaleStateQueryOptions } from '../../../../../lib/queries/app-settings'

const OBSERVATIONS_SOURCE_ID = 'observations_source' as const
const TRACKS_SOURCE_ID = 'tracks_source' as const

const OBSERVATIONS_LAYER_ID = 'observations_layer' as const
const TRACKS_LAYER_ID = 'tracks_layer' as const

const TRACKS_LAYER_LAYOUT: LineLayerSpecification['layout'] = {
	'line-cap': 'round',
	'line-join': 'round',
}

const INTERACTIVE_LAYER_IDS = [OBSERVATIONS_LAYER_ID, TRACKS_LAYER_ID]

const DEFAULT_BOUNDING_BOX: [number, number, number, number] = [
	-180, -90, 180, 90,
]

const BASE_FIT_BOUNDS_OPTIONS: FitBoundsOptions = {
	padding: 40,
	maxZoom: 12,
	linear: true,
}

export function DisplayedDataMap() {
	const { formatMessage: t } = useIntl()

	const navigate = useNavigate({ from: '/app/projects/$projectId' })
	const { projectId } = useParams({ from: '/app/projects/$projectId' })
	const { highlightedDocument } = useSearch({
		from: '/app/projects/$projectId',
	})

	const [mapLoaded, setMapLoaded] = useState(false)

	const currentRoute = useChildMatches({
		select: (matches) => {
			return matches.at(-1)!
		},
	})

	const documentFromRouteParams: typeof highlightedDocument = useChildMatches({
		select: (matches) => {
			for (const m of matches) {
				if (
					m.routeId ===
						'/app/projects/$projectId/observations/$observationDocId/' ||
					m.routeId ===
						'/app/projects/$projectId/observations/$observationDocId/attachments/$driveId/$type/$variant/$name'
				) {
					return {
						type: 'observation' as const,
						docId: m.params.observationDocId,
						from: 'list' as const,
					}
				}

				if (m.routeId === '/app/projects/$projectId/tracks/$trackDocId/') {
					return {
						type: 'track' as const,
						docId: m.params.trackDocId,
						from: 'list' as const,
					}
				}
			}

			return undefined
		},
	})

	// Highlighting should occur under the following scenarios:
	// 1. A feature on the map while on the main project page is hovered over.
	// 2. A feature on the map while on the main project page is clicked on.
	// 3. An observation or track in the list on the main project page is hovered over.
	// 4. An observation or track in the list on the main project page is clicked on.
	// 5. A specific observation's page is being viewed.
	// 6. A specific track's page is being viewed.
	const documentToHighlight = documentFromRouteParams || highlightedDocument

	const mapRef = useRef<MapRef>(null)

	const { data: lang } = useSuspenseQuery({
		...getLocaleStateQueryOptions(),
		select: ({ value }) => value,
	})

	const { data: observations } = useManyDocs({
		projectId,
		docType: 'observation',
		lang,
	})

	const { data: tracks } = useManyDocs({
		projectId,
		docType: 'track',
		lang,
	})

	const { data: categories } = useManyDocs({
		projectId,
		docType: 'preset',
		lang,
	})

	const mapsRefreshToken = useMapsRefreshToken()
	const { data: mapStyleUrl } = useMapStyleUrl({
		refreshToken: mapsRefreshToken,
	})

	const observationsFeatureCollection = useMemo(() => {
		return observationsToFeatureCollection(observations, categories)
	}, [observations, categories])

	const tracksFeatureCollection = useMemo(() => {
		return tracksToFeatureCollection(tracks)
	}, [tracks])

	const observationsLayerPaint = useMemo(() => {
		return createObservationLayerPaintProperty(
			categories,
			!!documentToHighlight,
		)
	}, [categories, documentToHighlight])

	const tracksLayerPaint = useMemo(() => {
		return createTrackLayerPaintProperty(!!documentToHighlight)
	}, [documentToHighlight])

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

	const onMapClick = useCallback(
		(event: MapLayerMouseEvent) => {
			const feature = event.features?.[0]

			if (!feature) {
				if (documentToHighlight) {
					navigate({ search: { highlightedDocument: undefined } })
				}
				return
			}

			if (
				feature.layer.id === OBSERVATIONS_LAYER_ID &&
				typeof feature.properties.docId === 'string'
			) {
				navigate({
					to: './observations/$observationDocId',
					params: { observationDocId: feature.properties.docId },
				})
				return
			}

			if (
				feature.layer.id === TRACKS_LAYER_ID &&
				typeof feature.properties.docId === 'string'
			) {
				navigate({
					to: './tracks/$trackDocId',
					params: { trackDocId: feature.properties.docId },
				})
				return
			}
		},
		[navigate, documentToHighlight],
	)

	const onMapMouseMove = useCallback(
		(event: MapLayerMouseEvent) => {
			const feature = event.features?.[0]

			if (!feature) {
				return
			}

			if (
				(feature.layer.id === OBSERVATIONS_LAYER_ID ||
					feature.layer.id === TRACKS_LAYER_ID) &&
				typeof feature.properties.docId === 'string'
			) {
				navigate({
					search: {
						highlightedDocument: {
							type:
								feature.layer.id === OBSERVATIONS_LAYER_ID
									? 'observation'
									: 'track',
							docId: feature.properties.docId,
							from: 'map',
						},
					},
				})
				return
			}
		},
		[navigate],
	)

	useEffect(
		/**
		 * Updates the map such that the map adjusts how features are displayed
		 * based on whether there is a document to highlight or not.
		 */
		function updateMapFeatureHighlighting() {
			if (!mapRef.current || !mapLoaded) {
				return
			}

			if (documentToHighlight) {
				// Clear the existing feature states first
				mapRef.current.removeFeatureState({ source: TRACKS_SOURCE_ID })
				mapRef.current.removeFeatureState({ source: OBSERVATIONS_SOURCE_ID })

				// Highlight the feature(s) with the new value
				if (documentToHighlight.type === 'observation') {
					mapRef.current.setFeatureState(
						{ source: OBSERVATIONS_SOURCE_ID, id: documentToHighlight.docId },
						{ highlight: true },
					)
				} else {
					mapRef.current.setFeatureState(
						{ source: TRACKS_SOURCE_ID, id: documentToHighlight.docId },
						{ highlight: true },
					)

					const highlightedTrack = tracks.find(
						(t) => t.docId === documentToHighlight.docId,
					)

					if (!highlightedTrack) {
						console.warn(
							`Could not find track with doc ID: ${documentToHighlight.docId}`,
						)
						return
					}

					// NOTE: Highlighting a track should highlight observations that it references.
					for (const o of highlightedTrack.observationRefs) {
						mapRef.current.setFeatureState(
							{ source: OBSERVATIONS_SOURCE_ID, id: o.docId },
							{ highlight: true },
						)
					}
				}
			} else {
				mapRef.current.removeFeatureState({ source: OBSERVATIONS_SOURCE_ID })
				mapRef.current.removeFeatureState({ source: TRACKS_SOURCE_ID })
			}
		},
		[documentToHighlight, mapLoaded, tracks],
	)

	useEffect(
		/**
		 * Accounts for the following situation:
		 *
		 * 1. Leave this page
		 * 2. New data is received (e.g. creating test data, exchanging)
		 * 3. Return to this page
		 *
		 * After (3), the stale data is still being used to calculate the map's
		 * initial bounds (not really sure why though). The new data comes in
		 * afterwards and the bounds are re-calculated, but they do not get applied
		 * to the map as there's no way to reactively update it after
		 * initialization.
		 */
		function setMapBoundsBasedOnDataBbox() {
			if (!mapLoaded || !mapRef.current) {
				return
			}

			mapRef.current.fitBounds(mapBbox, {
				...BASE_FIT_BOUNDS_OPTIONS,
				animate: false,
			})
		},
		[mapBbox, mapLoaded],
	)

	useEffect(
		/**
		 * Whenever the highlighted document changes (either due to a list or map
		 * interaction), pan the map such that the corresponding feature is
		 * centered. Also zooms closer to the feature if necessary (it will never
		 * zoom out).
		 */
		function panToMapFeature() {
			if (!mapLoaded || !mapRef.current || !documentToHighlight) {
				return
			}

			// Do not pan the map if the highlighting is done via a map interaction
			if (documentToHighlight.from === 'map') {
				return
			}

			const { type, docId } = documentToHighlight

			const shouldZoomIn = mapRef.current.getZoom() < 10

			if (type === 'observation') {
				const observationMatch = observationsFeatureCollection.features.find(
					({ properties }) => properties.docId === docId,
				)

				if (observationMatch) {
					mapRef.current.panTo(
						{
							lon: observationMatch.geometry.coordinates[0]!,
							lat: observationMatch.geometry.coordinates[1]!,
						},
						shouldZoomIn ? { zoom: 10 } : undefined,
					)
				}
			} else {
				const tracksMatch = tracksFeatureCollection.features.find(
					({ properties }) => properties.docId === docId,
				)

				if (tracksMatch) {
					const c = center(tracksMatch)

					const [minLon, minLat, maxLon, maxLat] = bbox(tracksMatch)

					mapRef.current.panTo(
						{
							lon: c.geometry.coordinates[0]!,
							lat: c.geometry.coordinates[1]!,
						},
						shouldZoomIn ? { zoom: 10 } : undefined,
					)

					mapRef.current.fitBounds(
						[minLon, minLat, maxLon, maxLat],
						BASE_FIT_BOUNDS_OPTIONS,
					)
				}
			}
		},
		[
			documentToHighlight,
			mapLoaded,
			observationsFeatureCollection,
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

	const showZoomToDataControl =
		currentRoute.routeId !==
			'/app/projects/$projectId/observations/$observationDocId/' &&
		currentRoute.routeId !==
			'/app/projects/$projectId/observations/$observationDocId/attachments/$driveId/$type/$variant/$name' &&
		currentRoute.routeId !== '/app/projects/$projectId/tracks/$trackDocId/'

	const enableMouseInteractions =
		currentRoute.routeId === '/app/projects/$projectId/'

	const enableMovementInteractions =
		currentRoute.routeId === '/app/projects/$projectId/' ||
		currentRoute.routeId === '/app/projects/$projectId/download'

	return (
		<Box position="relative" display="flex" flex={1}>
			{mapLoaded ? null : (
				<Box
					display="flex"
					flex={1}
					justifyContent="center"
					alignItems="center"
					position="absolute"
					left={0}
					right={0}
					top={0}
					bottom={0}
					sx={{ opacity: 0.5 }}
					bgcolor={BLACK}
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
				onLoad={() => {
					setMapLoaded(true)
				}}
				onClick={enableMouseInteractions ? onMapClick : undefined}
				onMouseMove={enableMouseInteractions ? onMapMouseMove : undefined}
				dragPan={enableMovementInteractions}
				scrollZoom={enableMovementInteractions}
				touchPitch={false}
				dragRotate={false}
				pitchWithRotate={false}
				touchZoomRotate={false}
				cursor={
					enableMouseInteractions || enableMovementInteractions
						? undefined
						: 'default'
				}
			>
				<ScaleControl />
				<NavigationControl showCompass={false} />

				{showZoomToDataControl ? (
					<ZoomToDataMapControl
						buttonTitle={t(m.zoomToData)}
						fitBoundsOptions={BASE_FIT_BOUNDS_OPTIONS}
						sourceIds={[OBSERVATIONS_SOURCE_ID, TRACKS_SOURCE_ID]}
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
						id={TRACKS_LAYER_ID}
						paint={tracksLayerPaint}
						layout={TRACKS_LAYER_LAYOUT}
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
					/>
				</Source>

				{(currentRoute.routeId ===
					'/app/projects/$projectId/observations/$observationDocId/' ||
					currentRoute.routeId ===
						'/app/projects/$projectId/observations/$observationDocId/attachments/$driveId/$type/$variant/$name') &&
				highlightedFeature &&
				highlightedFeature.geometry.type === 'Point' &&
				highlightedFeature.properties.type === 'observation' ? (
					<Suspense>
						<Marker
							style={
								enableMouseInteractions || enableMovementInteractions
									? undefined
									: { cursor: 'default' }
							}
							longitude={highlightedFeature.geometry.coordinates[0]!}
							latitude={highlightedFeature.geometry.coordinates[1]!}
						>
							{highlightedFeature.properties.categoryDocId ? (
								<CategoryIcon
									categoryDocumentId={
										highlightedFeature.properties.categoryDocId
									}
									projectId={projectId}
									lang={lang}
								/>
							) : (
								<CategoryIconContainer
									color={BLUE_GREY}
									applyBoxShadow
									padding={1}
								>
									<Icon name="material-place" size={ICON_SIZE} />
								</CategoryIconContainer>
							)}
						</Marker>
					</Suspense>
				) : null}

				{(currentRoute.routeId ===
					'/app/projects/$projectId/observations/$observationDocId/' ||
					currentRoute.routeId ===
						'/app/projects/$projectId/tracks/$trackDocId/') &&
				!highlightedFeature ? (
					<Box
						position="absolute"
						bottom={0}
						top={0}
						right={0}
						left={0}
						bgcolor={BLACK}
						display="grid"
						sx={{ placeItems: 'center', backgroundColor: alpha(BLACK, 0.5) }}
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

const ICON_SIZE = 20

function CategoryIcon({
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

	return (
		<CategoryIconContainer
			color={category.color || BLUE_GREY}
			applyBoxShadow
			padding={1}
		>
			{category.iconRef?.docId ? (
				<CategoryIconImage
					projectId={projectId}
					iconDocumentId={category.iconRef.docId}
					imageStyle={{ height: ICON_SIZE, aspectRatio: 1 }}
					altText={t(m.categoryIconAlt, { name: category.name })}
				/>
			) : (
				<Icon name="material-place" size={20} />
			)}
		</CategoryIconContainer>
	)
}

function observationsToFeatureCollection(
	observations: Array<Observation>,
	categories: Array<Preset>,
) {
	const displayablePoints: Array<
		Feature<
			Point,
			{ type: 'observation'; docId: string; categoryDocId?: string }
		>
	> = []

	for (const obs of observations) {
		if (typeof obs.lon === 'number' && typeof obs.lat === 'number') {
			const category = getMatchingCategoryForDocument(obs, categories)

			displayablePoints.push(
				point([obs.lon, obs.lat], {
					type: 'observation' as const,
					docId: obs.docId,
					categoryDocId: category?.docId,
				}),
			)
		}
	}

	return featureCollection(displayablePoints)
}

function tracksToFeatureCollection(tracks: Array<Track>) {
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

		const featureProperties = {
			type: 'track' as const,
			docId: t.docId,
		}

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

function createTrackLayerPaintProperty(
	enableHighlighting: boolean,
): LineLayerSpecification['paint'] {
	return {
		'line-color': BLACK,
		'line-width': 4,
		'line-opacity': enableHighlighting
			? ['case', ['boolean', ['feature-state', 'highlight'], false], 1, 0.2]
			: 1,
	}
}

function createObservationLayerPaintProperty(
	categories: Array<Preset>,
	enableHighlighting: boolean,
): CircleLayerSpecification['paint'] {
	const categoryColorPairs: Array<string> = []

	for (const { color, docId } of categories) {
		// @comapeo/schema only allows hex values for color field
		if (v.is(v.pipe(v.string(), v.hexColor()), color)) {
			categoryColorPairs.push(docId, color)
		}
	}

	return {
		'circle-color': WHITE,
		'circle-radius': 6,
		'circle-stroke-width': 3,
		// @ts-expect-error Type def doesn't like the spread of the pairs
		'circle-stroke-color':
			categoryColorPairs.length > 0
				? ['match', ['get', 'categoryDocId'], ...categoryColorPairs, ORANGE]
				: ORANGE,
		'circle-stroke-opacity': enableHighlighting
			? ['case', ['boolean', ['feature-state', 'highlight'], false], 1, 0.2]
			: 1,
		'circle-opacity': enableHighlighting
			? ['case', ['boolean', ['feature-state', 'highlight'], false], 1, 0.2]
			: 1,
	}
}

const m = defineMessages({
	categoryIconAlt: {
		id: 'routes.app.projects.$projectId.-displayed.data.map.categoryIconAlt',
		defaultMessage: 'Icon for {name} category',
		description:
			'Alt text for icon image displayed for category (used for accessibility tools).',
	},
	zoomToData: {
		id: 'routes.app.projects.$projectId.-displayed.data.map.zoomToData',
		defaultMessage: 'Zoom to data',
		description:
			'Text displayed when hovering over map control for zooming to data.',
	},
	cannotDisplayFeature: {
		id: 'routes.app.projects.$projectId.-displayed.data.map.cannotDisplayFeature',
		defaultMessage: 'Cannot display feature',
		description:
			'Text displayed when map feature for selected data cannot be displayed',
	},
})
