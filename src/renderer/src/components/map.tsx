import { type Ref } from 'react'
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
}: MapProps & { ref?: Ref<MapRef> }) {
	return <ReactMapLibre {...rest} ref={ref} reuseMaps={reuseMaps} />
}
