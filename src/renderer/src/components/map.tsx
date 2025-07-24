import type { Ref } from 'react'
import {
	Map as ReactMapLibre,
	type MapProps,
	type MapRef,
} from 'react-map-gl/maplibre'

import 'maplibre-gl/dist/maplibre-gl.css'

// TODO: Temporary. Need to fix https://github.com/digidem/comapeo-desktop/issues/98
const FALLBACK_MAP_STYLE = 'https://demotiles.maplibre.org/style.json'

export function Map({
	doubleClickZoom,
	dragPan,
	dragRotate,
	interactive,
	mapStyle = FALLBACK_MAP_STYLE,
	ref,
	reuseMaps = true,
	scrollZoom,
	touchPitch,
	touchZoomRotate,
	...rest
}: MapProps & { ref?: Ref<MapRef> }) {
	return (
		<ReactMapLibre
			{...rest}
			ref={ref}
			dragPan={interactive === undefined ? dragPan : interactive}
			dragRotate={interactive === undefined ? dragRotate : interactive}
			doubleClickZoom={
				interactive === undefined ? doubleClickZoom : interactive
			}
			interactive={interactive}
			mapStyle={mapStyle}
			reuseMaps={reuseMaps}
			scrollZoom={interactive === undefined ? scrollZoom : interactive}
			touchPitch={interactive === undefined ? touchPitch : interactive}
			touchZoomRotate={
				interactive === undefined ? touchZoomRotate : interactive
			}
		/>
	)
}
