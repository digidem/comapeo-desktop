import { captureException } from '@sentry/react'
import bbox from '@turf/bbox'
import { feature } from '@turf/helpers'
import {
	GeoJSONSource,
	type ControlPosition,
	type FitBoundsOptions,
	type IControl,
} from 'maplibre-gl'
import { useControl, type MapInstance } from 'react-map-gl/maplibre'

import { getIconURL } from './icon'

type ControlOptions = {
	buttonTitle: string
	fitBoundsOptions: FitBoundsOptions
	sourceIds: Array<string>
}

export function ZoomToDataMapControl({
	buttonTitle,
	fitBoundsOptions,
	position,
	sourceIds,
}: ControlOptions & {
	position?: ControlPosition
}) {
	useControl(
		() =>
			new ZoomToDataControl({
				buttonTitle,
				fitBoundsOptions,
				sourceIds,
			}),
		{ position },
	)

	return null
}

class ZoomToDataControl implements IControl {
	#container: HTMLElement
	#options: ControlOptions

	constructor(options: ControlOptions) {
		this.#options = options
		this.#container = document.createElement('div')
		this.#container.className = 'maplibregl-ctrl maplibregl-ctrl-group'
	}

	onAdd(map: MapInstance) {
		if (!this.#container.hasChildNodes()) {
			const button = document.createElement('button')
			button.type = 'button'
			button.setAttribute('title', this.#options.buttonTitle)

			button.addEventListener('click', (event) => {
				Promise.all(
					this.#options.sourceIds.map(async (sourceId) => {
						const source = map.getSource<GeoJSONSource>(sourceId)

						if (!source) {
							return bbox(feature(null))
						}

						const data = await source.getData()

						return bbox(data)
					}),
				)
					.then((bboxes) => {
						const minLon = Math.min(...bboxes.map((bbox) => bbox[0]))
						const minLat = Math.min(...bboxes.map((bbox) => bbox[1]))
						const maxLon = Math.max(...bboxes.map((bbox) => bbox[2]))
						const maxLat = Math.max(...bboxes.map((bbox) => bbox[3]))

						map.fitBounds(
							[minLon, minLat, maxLon, maxLat],
							this.#options.fitBoundsOptions,
							{ originalEvent: event },
						)
					})
					.catch((err) => {
						captureException(err)
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
