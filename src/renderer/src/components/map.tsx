import { Map as ReactMapLibre, type MapProps } from 'react-map-gl/maplibre'

import 'maplibre-gl/dist/maplibre-gl.css'

// TODO: Temporary. Need to fix https://github.com/digidem/comapeo-desktop/issues/98
const FALLBACK_MAP_STYLE = 'https://demotiles.maplibre.org/style.json'

export function Map({
	mapStyle = FALLBACK_MAP_STYLE,
	reuseMaps = true,
	...rest
}: MapProps) {
	return <ReactMapLibre {...rest} reuseMaps={reuseMaps} mapStyle={mapStyle} />
}
