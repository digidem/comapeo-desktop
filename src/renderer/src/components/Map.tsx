import React from 'react'
import { Map as ReactMaplibre } from '@vis.gl/react-maplibre'
import maplibregl from 'maplibre-gl'

import 'maplibre-gl/dist/maplibre-gl.css'

import { useMapStyleUrl } from '@comapeo/core-react'

export function Map() {
	const styleUrlQuery = useMapStyleUrl()
	const styleUrl =
		styleUrlQuery.data ?? 'https://demotiles.maplibre.org/style.json'
	const center = [-72.312023, -10.38787]

	return (
		<ReactMaplibre
			mapLib={maplibregl}
			initialViewState={{
				longitude: center[0],
				latitude: center[1],
				zoom: 12,
			}}
			dragPan={true}
			scrollZoom={true}
			doubleClickZoom={true}
			style={{ width: '100%', height: '100%' }}
			mapStyle={styleUrl}
			onError={(evt) => {
				console.error('Map error:', evt.error)
			}}
			onLoad={() => {
				console.log('Map loaded successfully!')
			}}
		/>
	)
}
