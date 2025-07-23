import {
	Map as ReactMapLibre,
	type MapProps,
	type MapRef,
} from 'react-map-gl/maplibre'

import 'maplibre-gl/dist/maplibre-gl.css'

import type { Ref } from 'react'

// TODO: Temporary. Need to fix https://github.com/digidem/comapeo-desktop/issues/98
const FALLBACK_MAP_STYLE = 'https://demotiles.maplibre.org/style.json'

export function Map({
	ref,
	mapStyle = FALLBACK_MAP_STYLE,
	reuseMaps = true,
	...rest
}: MapProps & { ref?: Ref<MapRef> }) {
	return (
		<ReactMapLibre
			ref={ref}
			{...rest}
			reuseMaps={reuseMaps}
			mapStyle={mapStyle}
		/>
	)
}
