import { Suspense, useCallback, useMemo, useRef, useState } from 'react'
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
import type {
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
const TRACKS_HOVER_OUTLINE_LAYER_ID = 'tracks_hover_outline_layer' as const
const TRACKS_HOVER_SHADOW_LAYER_ID = 'tracks_hover_shadow_layer' as const

const TRACKS_LAYER_ID = 'tracks_layer' as const

const TRACKS_LAYER_LAYOUT: LineLayerSpecification['layout'] = {
	'line-cap': 'round',
	'line-join': 'round',
}
const TRACKS_LAYER_PAINT_PROPERTY: LineLayerSpecification['paint'] = {
	'line-color': BLACK,
	'line-width': 4,
}
const TRACKS_HOVER_OUTLINE_LAYER_PAINT_PROPERTY: LineLayerSpecification['paint'] =
	{
		'line-color': WHITE,
		'line-width': 12,
		'line-opacity': [
			'case',
			['boolean', ['feature-state', 'hovered'], false],
			1,
			0,
		],
	}
const TRACKS_HOVER_SHADOW_LAYER_PAINT_PROPERTY: LineLayerSpecification['paint'] =
	{
		'line-color': '#686868',
		'line-blur': 20,
		'line-width': 20,
		'line-opacity': [
			'case',
			['boolean', ['feature-state', 'hovered'], false],
			1,
			0,
		],
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

	/**
	 * Determines if the hover state of a feature should be enabled
	 */
	const onMapMouseMove = useCallback((event: MapLayerMouseEvent) => {
		const mapInstance = event.target

		const feature = event.features?.[0]

		const mapCanvas = mapInstance.getCanvas()

		if (!(feature && typeof feature.properties.docId === 'string')) {
			// Clear the existing feature states
			mapInstance.removeFeatureState({ source: OBSERVATIONS_SOURCE_ID })
			mapInstance.removeFeatureState({ source: TRACKS_SOURCE_ID })

			// Restore default cursor style
			if (mapCanvas.style.cursor !== 'inherit') {
				mapInstance.getCanvas().style.cursor = 'inherit'
			}

			return
		}

		// Update the cursor style when hovering over a relevant feature
		if (
			(feature.layer.id === OBSERVATIONS_LAYER_ID ||
				feature.layer.id === TRACKS_LAYER_ID) &&
			mapCanvas.style.cursor !== 'pointer'
		) {
			mapCanvas.style.cursor = 'pointer'
		}

		// Update observation feature state to show hover state
		if (feature.layer.id === OBSERVATIONS_LAYER_ID) {
			// Enable the hover state for the relevant feature
			mapInstance.setFeatureState(
				{ source: OBSERVATIONS_SOURCE_ID, id: feature.properties.docId },
				{ hovered: true },
			)
		} else if (feature.layer.id === TRACKS_LAYER_ID) {
			mapInstance.setFeatureState(
				{ source: TRACKS_SOURCE_ID, id: feature.properties.docId },
				{ hovered: true },
			)
		}
	}, [])

	/**
	 * On initial map load, if there's a document to highlight, pan to it and zoom
	 * in if necessary. Otherwise, update the bounding box of the map to fit all
	 * of the features.
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
					mapInstance.panTo(
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

					mapInstance.panTo(
						{
							lon: c.geometry.coordinates[0]!,
							lat: c.geometry.coordinates[1]!,
						},
						shouldZoomIn ? { zoom: 10 } : undefined,
					)

					mapInstance.fitBounds(
						[minLon, minLat, maxLon, maxLat],
						BASE_FIT_BOUNDS_OPTIONS,
					)
				}
			}

			setMapLoaded(true)
		},
		[
			documentToHighlight,
			mapBbox,
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
				onLoad={onMapLoad}
				onClick={onMapClick}
				onMouseMove={onMapMouseMove}
				touchPitch={false}
				dragRotate={false}
				pitchWithRotate={false}
				touchZoomRotate={false}
			>
				<ScaleControl />
				<NavigationControl showCompass={false} />

				<ZoomToDataMapControl
					buttonTitle={t(m.zoomToData)}
					fitBoundsOptions={BASE_FIT_BOUNDS_OPTIONS}
					sourceIds={[OBSERVATIONS_SOURCE_ID, TRACKS_SOURCE_ID]}
				/>

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
					/>

					<Layer
						type="line"
						id={TRACKS_HOVER_OUTLINE_LAYER_ID}
						paint={TRACKS_HOVER_OUTLINE_LAYER_PAINT_PROPERTY}
						layout={TRACKS_LAYER_LAYOUT}
					/>

					<Layer
						type="line"
						id={TRACKS_LAYER_ID}
						paint={TRACKS_LAYER_PAINT_PROPERTY}
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

				{(currentRoute.routeId === '/app/projects/$projectId/' ||
					currentRoute.routeId ===
						'/app/projects/$projectId/observations/$observationDocId/' ||
					currentRoute.routeId ===
						'/app/projects/$projectId/observations/$observationDocId/attachments/$driveId/$type/$variant/$name') &&
				highlightedFeature &&
				highlightedFeature.geometry.type === 'Point' &&
				highlightedFeature.properties.type === 'observation' ? (
					<Suspense>
						<Marker
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
		'circle-radius': [
			'case',
			['boolean', ['feature-state', 'hovered'], false],
			9,
			6,
		],
		'circle-stroke-color': WHITE,
		'circle-stroke-width': 3,
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
