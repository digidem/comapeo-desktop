import { type Ref } from 'react'
import {
	Map as ReactMapLibre,
	type MapProps,
	type MapRef,
} from '@vis.gl/react-maplibre'
import { setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { createTransformStyle } from 'maplibrefy'

import 'maplibre-gl/dist/maplibre-gl.css'

setWorkerUrl(workerUrl)

const maplibrefyTransformStyle = createTransformStyle({
	onChanges: (changes) => {
		if (changes.length > 0) {
			console.info('Map style changes applied by maplibrefy:', changes)
		}
	},
})

export function Map({
	ref,
	reuseMaps = true,
	...rest
}: Omit<MapProps, 'transformStyle'> & { ref?: Ref<MapRef> }) {
	return (
		<ReactMapLibre
			{...rest}
			ref={ref}
			reuseMaps={reuseMaps}
			transformStyle={maplibrefyTransformStyle}
		/>
	)
}
