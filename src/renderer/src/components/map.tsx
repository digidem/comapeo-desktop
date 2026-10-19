import { type Ref } from 'react'
import {
	Map as ReactMapLibre,
	type MapProps,
	type MapRef,
} from '@vis.gl/react-maplibre'
import { setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'

import 'maplibre-gl/dist/maplibre-gl.css'

setWorkerUrl(workerUrl)

export function Map({
	ref,
	reuseMaps = true,
	...rest
}: MapProps & { ref?: Ref<MapRef> }) {
	return <ReactMapLibre {...rest} ref={ref} reuseMaps={reuseMaps} />
}
