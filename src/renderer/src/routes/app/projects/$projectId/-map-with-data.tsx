import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useManyDocs } from '@comapeo/core-react'
import type { Observation, Preset, Track } from '@comapeo/schema'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
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
import type { FitBoundsOptions } from 'maplibre-gl'
import {
	Layer,
	Source,
	type CircleLayerSpecification,
	type MapLayerMouseEvent,
	type MapRef,
} from 'react-map-gl/maplibre'
import * as v from 'valibot'

import { BLACK, ORANGE, WHITE } from '../../../../colors'
import { Map } from '../../../../components/map'
import { getMatchingCategoryForObservation } from '../../../../lib/comapeo'
import { getLocaleStateQueryOptions } from '../../../../lib/queries/app-settings'

const OBSERVATIONS_SOURCE_ID = 'observations_source'
const TRACKS_SOURCE_ID = 'tracks_source' as const

const OBSERVATIONS_LAYER_ID = 'observations_layer' as const
const TRACKS_LAYER_ID = 'tracks_layer' as const

const INTERACTIVE_LAYER_IDS = [OBSERVATIONS_LAYER_ID, TRACKS_LAYER_ID]

const DEFAULT_BOUNDING_BOX: [number, number, number, number] = [
	-180, -90, 180, 90,
]

const BASE_FIT_BOUNDS_OPTIONS: FitBoundsOptions = { padding: 40, maxZoom: 12 }

export function MapWithData() {
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

	const documentFromRouteParams = useChildMatches({
		select: (matches) => {
			for (const m of matches) {
				if (
					m.routeId ===
					'/app/projects/$projectId/observations/$observationDocId/'
				) {
					return {
						type: 'observation' as const,
						docId: m.params.observationDocId,
					}
				}

				if (m.routeId === '/app/projects/$projectId/tracks/$trackDocId/') {
					return {
						type: 'track' as const,
						docId: m.params.trackDocId,
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

	const observationsFeatureCollection = useMemo(() => {
		return observationsToFeatureCollection(observations, categories)
	}, [observations, categories])

	const tracksFeatureCollection = useMemo(() => {
		return tracksToFeatureCollection(tracks)
	}, [tracks])

	const observationLayerPaint = useMemo(() => {
		return createObservationLayerPaintProperty(
			categories,
			!!documentToHighlight,
		)
	}, [categories, documentToHighlight])

	// TODO: Should cover both observations and tracks?
	const observationsBbox: [number, number, number, number] = useMemo(() => {
		if (observationsFeatureCollection.features.length === 0) {
			return DEFAULT_BOUNDING_BOX
		}
		const [minLon, minLat, maxLon, maxLat] = bbox(observationsFeatureCollection)

		return [minLon, minLat, maxLon, maxLat]
	}, [observationsFeatureCollection])

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
				typeof feature.properties.id === 'string'
			) {
				navigate({
					to: './observations/$observationDocId',
					params: { observationDocId: feature.properties.id },
				})
				return
			}

			if (
				feature.layer.id === TRACKS_LAYER_ID &&
				typeof feature.properties.id === 'string'
			) {
				navigate({
					to: './tracks/$trackDocId',
					params: { trackDocId: feature.properties.id },
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
				typeof feature.properties.id === 'string'
			) {
				navigate({
					search: {
						highlightedDocument: {
							type:
								feature.layer.id === OBSERVATIONS_LAYER_ID
									? 'observation'
									: 'track',
							docId: feature.properties.id,
						},
					},
				})
				return
			}
		},
		[navigate],
	)

	const enableMapInteractions =
		currentRoute.routeId === '/app/projects/$projectId/'

	useEffect(() => {
		if (!mapRef.current || !mapLoaded) {
			return
		}

		if (documentToHighlight) {
			// Clear the existing feature states first
			mapRef.current.removeFeatureState({ source: TRACKS_SOURCE_ID })
			mapRef.current.removeFeatureState({ source: OBSERVATIONS_SOURCE_ID })

			// Highlight the feature with the new value
			mapRef.current.setFeatureState(
				{ source: OBSERVATIONS_SOURCE_ID, id: documentToHighlight.docId },
				{ highlight: true },
			)
			mapRef.current.setFeatureState(
				{ source: TRACKS_SOURCE_ID, id: documentToHighlight.docId },
				{ highlight: true },
			)
		} else {
			mapRef.current.removeFeatureState({ source: OBSERVATIONS_SOURCE_ID })
			mapRef.current.removeFeatureState({ source: TRACKS_SOURCE_ID })
		}
	}, [documentToHighlight, mapLoaded])

	// Accounts for the following situation:
	//
	// 1. Leave this page
	// 2. New data is received (e.g. creating test data, exchanging)
	// 3. Return to this page
	//
	// After (3), the stale data is still being used to calculate the map's initial bounds (not really sure why though).
	// The new data comes in afterwards and the bounds are re-calculated, but they do not get applied to the map
	// as there's no way to reactively update it after initialization.
	useEffect(() => {
		if (!mapLoaded || !mapRef.current) {
			return
		}

		mapRef.current.fitBounds(observationsBbox, {
			...BASE_FIT_BOUNDS_OPTIONS,
			animate: false,
		})
	}, [observationsBbox, mapLoaded])

	useEffect(() => {
		if (!mapLoaded || !mapRef.current || !documentToHighlight) {
			return
		}

		const { type, docId } = documentToHighlight

		const panOptions = mapRef.current.getZoom() < 8 ? { zoom: 8 } : undefined

		if (type === 'observation') {
			const observationMatch = observationsFeatureCollection.features.find(
				({ properties }) => properties.id === docId,
			)

			if (observationMatch) {
				mapRef.current.panTo(
					{
						lon: observationMatch.geometry.coordinates[0]!,
						lat: observationMatch.geometry.coordinates[1]!,
					},
					panOptions,
				)
			}
		} else {
			const tracksMatch = tracksFeatureCollection.features.find(
				({ properties }) => properties.id === docId,
			)

			if (tracksMatch) {
				const c = center(tracksMatch)

				mapRef.current.panTo(
					{
						lon: c.geometry.coordinates[0]!,
						lat: c.geometry.coordinates[1]!,
					},
					panOptions,
				)
			}
		}
	}, [
		documentToHighlight,
		mapLoaded,
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
				initialViewState={{
					bounds: observationsBbox,
					fitBoundsOptions: BASE_FIT_BOUNDS_OPTIONS,
				}}
				// TODO: Consider making this the bounding box of the data?
				// Needs to be explicitly set to this since we reuse map instances
				// and this seems to get preserved between different usages of the maps.
				maxBounds={undefined}
				interactive={enableMapInteractions}
				onClick={enableMapInteractions ? onMapClick : undefined}
				onMouseMove={enableMapInteractions ? onMapMouseMove : undefined}
				interactiveLayerIds={INTERACTIVE_LAYER_IDS}
				onLoad={() => {
					setMapLoaded(true)
				}}
			>
				<Source
					type="geojson"
					id={OBSERVATIONS_SOURCE_ID}
					data={observationsFeatureCollection}
					// Need this in order for the feature-state querying to work when hovering
					promoteId="id"
				>
					<Layer
						type="circle"
						id={OBSERVATIONS_LAYER_ID}
						paint={observationLayerPaint}
					/>
				</Source>

				<Source
					type="geojson"
					id={TRACKS_SOURCE_ID}
					data={tracksFeatureCollection}
					// Need this in order for the feature-state querying to work when hovering
					promoteId="id"
				></Source>
			</Map>
		</Box>
	)
}

function observationsToFeatureCollection(
	observations: Array<Observation>,
	categories: Array<Preset>,
) {
	const displayablePoints: Array<
		Feature<Point, { id: string; categoryDocId?: string }>
	> = []

	for (const obs of observations) {
		if (typeof obs.lon === 'number' && typeof obs.lat === 'number') {
			const category = getMatchingCategoryForObservation(obs.tags, categories)

			displayablePoints.push(
				point([obs.lon, obs.lat], {
					id: obs.docId,
					categoryDocId: category?.docId,
				}),
			)
		}
	}

	return featureCollection(displayablePoints)
}

function tracksToFeatureCollection(tracks: Array<Track>) {
	return featureCollection(
		tracks.map((track) =>
			lineString(
				track.locations.map((location) => [
					location.coords.longitude,
					location.coords.latitude,
				]),
				{ id: track.docId },
			),
		),
	)
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
			? ['case', ['boolean', ['feature-state', 'highlight'], false], 1, 0.25]
			: 1,
		'circle-opacity': enableHighlighting
			? ['case', ['boolean', ['feature-state', 'highlight'], false], 1, 0.25]
			: 1,
	}
}
