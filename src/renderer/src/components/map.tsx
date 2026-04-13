import { Map as ReactMapLibre, type MapProps } from 'react-map-gl/maplibre'

import 'maplibre-gl/dist/maplibre-gl.css'

export function Map({ reuseMaps = true, ...rest }: MapProps) {
	return <ReactMapLibre {...rest} reuseMaps={reuseMaps} />
}
