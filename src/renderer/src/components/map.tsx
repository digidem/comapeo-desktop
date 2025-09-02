import { useEffect, useRef, type Ref } from 'react'
import type {
	ControlPosition,
	FitBoundsOptions,
	IControl,
	ResourceType,
} from 'maplibre-gl'
import {
	isMapboxURL,
	transformMapboxUrl,
} from 'maplibregl-mapbox-request-transformer'
import {
	Map as ReactMapLibre,
	useControl,
	type MapInstance,
	type MapProps,
	type MapRef,
} from 'react-map-gl/maplibre'

import 'maplibre-gl/dist/maplibre-gl.css'

import { getIconURL } from './icon'

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

export function ZoomToDataControl({
	bbox,
	buttonTitle,
	fitBoundsOptions,
	position,
}: {
	bbox: [number, number, number, number]
	buttonTitle: string
	fitBoundsOptions: FitBoundsOptions
	position?: ControlPosition
}) {
	// NOTE: Using the ref approach avoids issues related to
	// additional mounts due to React strict mode.
	const instance = useRef(
		new ZoomToDataControlImplementation({
			bbox,
			title: buttonTitle,
			fitBoundsOptions,
		}),
	)

	useControl(() => instance.current, { position })

	useEffect(
		function updateControlInstance() {
			instance.current = new ZoomToDataControlImplementation({
				bbox,
				fitBoundsOptions,
				title: buttonTitle,
			})
		},
		[bbox, buttonTitle, fitBoundsOptions],
	)

	return null
}

class ZoomToDataControlImplementation implements IControl {
	#container: HTMLElement

	#options: {
		title: string
		bbox: [number, number, number, number]
		fitBoundsOptions: FitBoundsOptions
	}

	constructor(options: {
		title: string
		bbox: [number, number, number, number]
		fitBoundsOptions: FitBoundsOptions
	}) {
		this.#options = options
		this.#container = document.createElement('div')
		this.#container.className = 'maplibregl-ctrl maplibregl-ctrl-group'
	}

	onAdd(map: MapInstance) {
		if (!this.#container.hasChildNodes()) {
			const button = document.createElement('button')
			button.type = 'button'
			button.setAttribute('title', this.#options.title)
			button.addEventListener('click', (event) => {
				map.fitBounds(this.#options.bbox, this.#options.fitBoundsOptions, {
					originalEvent: event,
				})
			})

			button.innerHTML = `
				<span style="display: flex; justify-content: center; align-items: center">
					<svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" width="20" height="20">
						<use href="${getIconURL('material-fit-screen')}"></use>
					</svg>
				</span>
			`

			this.#container.appendChild(button)
		}

		return this.#container
	}

	onRemove() {
		if (this.#container.parentNode) {
			this.#container.parentNode.removeChild(this.#container)
		}
	}
}
