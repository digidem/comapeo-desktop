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
			mapStyle={mapStyle}
			reuseMaps={reuseMaps}
			// NOTE: Not sure if it's because of our default to reuse map instances,
			// but setting this doesn't necessarily disable the interactions as expected when set to `true`.
			// Still need to disable the various interactions via the props.
			// Instead, we conditionally assign the interaction props based on the `interactive` prop being specified or not.
			// i.e. if it's specified, set the props using that value. Otherwise defer to the corresponding props.
			interactive={interactive}
			dragPan={interactive === undefined ? dragPan : interactive}
			dragRotate={interactive === undefined ? dragRotate : interactive}
			doubleClickZoom={
				interactive === undefined ? doubleClickZoom : interactive
			}
			scrollZoom={interactive === undefined ? scrollZoom : interactive}
			touchPitch={interactive === undefined ? touchPitch : interactive}
			touchZoomRotate={
				interactive === undefined ? touchZoomRotate : interactive
			}
		/>
	)
}
