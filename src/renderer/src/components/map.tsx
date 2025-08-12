import { type Ref } from 'react'
import type { ResourceType } from 'maplibre-gl'
import {
	isMapboxURL,
	transformMapboxUrl,
} from 'maplibregl-mapbox-request-transformer'
import {
	Map as ReactMapLibre,
	type MapProps,
	type MapRef,
} from 'react-map-gl/maplibre'

import 'maplibre-gl/dist/maplibre-gl.css'

export function Map({
	doubleClickZoom,
	dragPan,
	dragRotate,
	interactive = true,
	mapStyle,
	ref,
	reuseMaps = true,
	scrollZoom,
	touchPitch,
	touchZoomRotate,
	...rest
}: Omit<MapProps, 'transformRequest'> & { ref?: Ref<MapRef> }) {
	return (
		<ReactMapLibre
			{...rest}
			transformRequest={transformRequest}
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

function transformRequest(url: string, resourceType?: ResourceType) {
	if (isMapboxURL(url)) {
		return transformMapboxUrl(
			url,
			resourceType || '',
			import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '',
		)
	}

	return { url }
}
