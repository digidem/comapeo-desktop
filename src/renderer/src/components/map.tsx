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
	ref,
	reuseMaps = true,
	...rest
}: Omit<MapProps, 'transformRequest'> & { ref?: Ref<MapRef> }) {
	return (
		<ReactMapLibre
			{...rest}
			transformRequest={transformRequest}
			ref={ref}
			reuseMaps={reuseMaps}
		/>
	)
}

function transformRequest(url: string, resourceType?: ResourceType) {
	if (isMapboxURL(url)) {
		return transformMapboxUrl(
			url,
			resourceType,
			import.meta.env.VITE_MAPBOX_ACCESS_TOKEN,
		)
	}

	return { url }
}
