import type { ControlPosition, FitBoundsOptions, IControl } from 'maplibre-gl'
import { useControl, type MapInstance } from 'react-map-gl/maplibre'

import { getIconURL } from './icon'

type ControlOptions = {
	buttonTitle: string
	bbox: [number, number, number, number]
	fitBoundsOptions: FitBoundsOptions
}

export function ZoomToDataMapControl({
	bbox,
	buttonTitle,
	fitBoundsOptions,
	position,
}: ControlOptions & {
	position?: ControlPosition
}) {
	useControl(
		() =>
			new ZoomToDataControl({
				bbox,
				buttonTitle,
				fitBoundsOptions,
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
