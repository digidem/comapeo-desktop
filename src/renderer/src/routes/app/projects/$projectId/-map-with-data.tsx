import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useManyDocs } from '@comapeo/core-react'
import type { Observation, Preset, Track } from '@comapeo/schema'
import { useSuspenseQuery } from '@tanstack/react-query'
import {
	useChildMatches,
	useNavigate,
	useParams,
	useSearch,
} from '@tanstack/react-router'
import { bbox } from '@turf/bbox'
import { featureCollection, lineString, point } from '@turf/helpers'
import type { Feature, Point } from 'geojson'
import {
	Layer,
	Source,
	type CircleLayerSpecification,
	type MapLayerMouseEvent,
	type MapRef,
} from 'react-map-gl/maplibre'
import * as v from 'valibot'

import { ORANGE, WHITE } from '../../../../colors'
import { Map } from '../../../../components/map'
import { getMatchingPresetForObservation } from '../../../../lib/comapeo'
import { getLocaleStateQueryOptions } from '../../../../lib/queries/app-settings'

const OBSERVATIONS_SOURCE_ID = 'observations_source'
const TRACKS_SOURCE_ID = 'tracks_source' as const

const OBSERVATIONS_LAYER_ID = 'observations_layer' as const
const TRACKS_LAYER_ID = 'tracks_layer' as const

const INTERACTIVE_LAYER_IDS = [OBSERVATIONS_LAYER_ID, TRACKS_LAYER_ID]

export function MapWithData() {
	const navigate = useNavigate({ from: '/app/projects/$projectId' })
	const { projectId } = useParams({ from: '/app/projects/$projectId' })
	const { focusedDocId } = useSearch({ from: '/app/projects/$projectId' })

	const currentRoute = useChildMatches({
		select: (matches) => {
			return matches.at(-1)!
		},
	})

	const docIdFromRouteParams = useChildMatches({
		select: (matches) => {
			// TODO: Handle tracks too
			for (const m of matches) {
				if (
					m.routeId ===
					'/app/projects/$projectId/observations/$observationDocId/'
				) {
					return m.params.observationDocId
				}

				if (m.routeId === '/app/projects/$projectId/tracks/$trackDocId/') {
					return m.params.trackDocId
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
	const docIdToHighlight = docIdFromRouteParams || focusedDocId

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

	const { data: presets } = useManyDocs({
		projectId,
		docType: 'preset',
		lang,
	})

	const observationsFeatureCollection = useMemo(() => {
		return observationsToFeatureCollection(observations, presets)
	}, [observations, presets])

	const tracksFeatureCollection = useMemo(() => {
		return tracksToFeatureCollection(tracks)
	}, [tracks])

	const observationLayerPaint = useMemo(() => {
		return createObservationLayerPaintProperty(presets, !!docIdToHighlight)
	}, [presets, docIdToHighlight])

	// TODO: Should cover both observations and tracks?
	const observationsBbox: [number, number, number, number] = useMemo(() => {
		const [minLon, minLat, maxLon, maxLat] = bbox(observationsFeatureCollection)

		return [minLon, minLat, maxLon, maxLat]
	}, [observationsFeatureCollection])

	const onMapClick = useCallback(
		(event: MapLayerMouseEvent) => {
			const feature = event.features?.[0]

			if (!feature) {
				if (docIdToHighlight) {
					navigate({ search: { focusedDocId: undefined } })
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
		[navigate, docIdToHighlight],
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
				navigate({ search: { focusedDocId: feature.properties.id } })
				return
			}
		},
		[navigate],
	)

	const enableMapInteractions =
		currentRoute.routeId === '/app/projects/$projectId/'

	useEffect(() => {
		if (docIdToHighlight) {
			// Clear the existing feature states first
			mapRef.current?.removeFeatureState({ source: TRACKS_SOURCE_ID })
			mapRef.current?.removeFeatureState({ source: OBSERVATIONS_SOURCE_ID })

			// Highlight the feature with the new value
			mapRef.current?.setFeatureState(
				{ source: OBSERVATIONS_SOURCE_ID, id: docIdToHighlight },
				{ highlight: true },
			)
			mapRef.current?.setFeatureState(
				{ source: TRACKS_SOURCE_ID, id: docIdToHighlight },
				{ highlight: true },
			)
		} else {
			mapRef.current?.removeFeatureState({ source: OBSERVATIONS_SOURCE_ID })
			mapRef.current?.removeFeatureState({ source: TRACKS_SOURCE_ID })
		}
	}, [docIdToHighlight])

	return (
		<Map
			ref={mapRef}
			initialViewState={{
				bounds: observationsBbox,
				fitBoundsOptions: { maxZoom: 12, padding: 40 },
			}}
			interactive={enableMapInteractions}
			onClick={enableMapInteractions ? onMapClick : undefined}
			onMouseMove={enableMapInteractions ? onMapMouseMove : undefined}
			interactiveLayerIds={INTERACTIVE_LAYER_IDS}
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
	)
}

function observationsToFeatureCollection(
	observations: Array<Observation>,
	presets: Array<Preset>,
) {
	const displayablePoints: Array<
		Feature<Point, { id: string; presetDocId?: string }>
	> = []

	for (const obs of observations) {
		if (typeof obs.lon === 'number' && typeof obs.lat === 'number') {
			const preset = getMatchingPresetForObservation(obs.tags, presets)

			displayablePoints.push(
				point([obs.lon, obs.lat], {
					id: obs.docId,
					presetDocId: preset?.docId,
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
	presets: Array<Preset>,
	enableHighlighting: boolean,
): CircleLayerSpecification['paint'] {
	const categoryColorPairs: Array<string> = []

	for (const { color, docId } of presets) {
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
				? ['match', ['get', 'presetDocId'], ...categoryColorPairs, ORANGE]
				: ORANGE,
		'circle-stroke-opacity': enableHighlighting
			? ['case', ['boolean', ['feature-state', 'highlight'], false], 1, 0.25]
			: 1,
		'circle-opacity': enableHighlighting
			? ['case', ['boolean', ['feature-state', 'highlight'], false], 1, 0.25]
			: 1,
	}
}
