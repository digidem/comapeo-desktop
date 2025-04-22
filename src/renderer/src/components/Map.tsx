import { Map as ReactMapLibre } from 'react-map-gl/maplibre'

import 'maplibre-gl/dist/maplibre-gl.css'

export function Map() {
	const center = [-72.312023, -10.38787]

	return (
		<ReactMapLibre
			initialViewState={{ longitude: center[0], latitude: center[1], zoom: 6 }}
			dragPan={true}
			scrollZoom={true}
			doubleClickZoom={true}
			style={{ width: '100%', height: '100%' }}
			mapStyle="https://demotiles.maplibre.org/style.json"
			onError={(evt) => {
				console.error('Map error:', evt.error)
			}}
			onLoad={() => {
				console.log('Map loaded successfully!')
			}}
		/>
	)
}
