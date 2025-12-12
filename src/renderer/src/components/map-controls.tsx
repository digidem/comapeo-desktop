import { captureException } from '@sentry/react'
import bbox from '@turf/bbox'
import center from '@turf/center'
import { feature } from '@turf/helpers'
import {
	GeoJSONSource,
	type ControlPosition,
	type FitBoundsOptions,
	type IControl,
} from 'maplibre-gl'
import { useControl, type MapInstance } from 'react-map-gl/maplibre'

import { getIconURL } from '../lib/icons'

type BaseControlOptions = {
	buttonTitle: string
	position?: ControlPosition

	sourceIds: Array<string>
}

type ZoomToSelectedDocumentControlOptions = BaseControlOptions & {
	document: { type: 'observation' | 'track'; docId: string }
	fitBoundsOptions: FitBoundsOptions
}

export function ZoomToSelectedDocumentMapControl({
	buttonTitle,
	document,
	fitBoundsOptions,
	position,
	sourceIds,
}: ZoomToSelectedDocumentControlOptions) {
	useControl(
		() =>
			new ZoomToSelectedDocumentControl({
				buttonTitle,
				document,
				fitBoundsOptions,
				sourceIds,
			}),
		{ position },
	)

	return null
}

class ZoomToSelectedDocumentControl implements IControl {
	#container: HTMLElement
	#options: ZoomToSelectedDocumentControlOptions

	constructor(options: ZoomToSelectedDocumentControlOptions) {
		this.#options = options
		this.#container = document.createElement('div')
		this.#container.className = 'maplibregl-ctrl maplibregl-ctrl-group'
	}

	onAdd(map: MapInstance) {
		if (!this.#container.hasChildNodes()) {
			const button = document.createElement('button')
			button.type = 'button'
			button.setAttribute('title', this.#options.buttonTitle)

			button.addEventListener('click', async (event) => {
				try {
					const sources = await Promise.all(
						this.#options.sourceIds.map((sourceId) => {
							const source = map.getSource<GeoJSONSource>(sourceId)
							if (!source) {
								throw new Error(`Source with ID ${sourceId} does not exist`)
							}
							return source
						}),
					)

					const data = await Promise.all(
						sources.map((source) => source.getData()),
					)

					const shouldZoomIn = map.getZoom() < 10

					for (const d of data) {
						if (d.type !== 'FeatureCollection') {
							continue
						}

						const match = d.features.find(
							(f) =>
								f.properties &&
								'docId' in f.properties &&
								typeof f.properties.docId === 'string' &&
								f.properties.docId === this.#options.document.docId,
						)

						if (!match) {
							continue
						}

						if (this.#options.document.type === 'observation') {
							if (match.geometry.type !== 'Point') {
								return
							}

							map.panTo(
								{
									lon: match.geometry.coordinates[0]!,
									lat: match.geometry.coordinates[1]!,
								},
								{ zoom: shouldZoomIn ? 10 : undefined },
								{ originalEvent: event },
							)
						} else {
							if (match.geometry.type !== 'LineString') {
								return
							}

							const c = center(match)

							const [minLon, minLat, maxLon, maxLat] = bbox(match)

							map.panTo(
								{
									lon: c.geometry.coordinates[0]!,
									lat: c.geometry.coordinates[1]!,
								},
								{ zoom: shouldZoomIn ? 10 : undefined },
								{ originalEvent: event },
							)

							map.fitBounds(
								[minLon, minLat, maxLon, maxLat],
								this.#options.fitBoundsOptions,
								{ originalEvent: event },
							)
						}

						break
					}
				} catch (err) {
					captureException(err)
				}
			})

			button.innerHTML = `
                <span style="display: flex; justify-content: center; align-items: center">
                    <svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" width="20" height="20">
                        <use href="${getIconURL('material-icons-center-focus-weak')}"></use>
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

type ZoomToDataControlOptions = BaseControlOptions & {
	fitBoundsOptions: FitBoundsOptions
}

export function ZoomToDataMapControl({
	buttonTitle,
	fitBoundsOptions,
	position,
	sourceIds,
}: ZoomToDataControlOptions) {
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
	#options: ZoomToDataControlOptions

	constructor(options: ZoomToDataControlOptions) {
		this.#options = options
		this.#container = document.createElement('div')
		this.#container.className = 'maplibregl-ctrl maplibregl-ctrl-group'
	}

	onAdd(map: MapInstance) {
		if (!this.#container.hasChildNodes()) {
			const button = document.createElement('button')
			button.type = 'button'
			button.setAttribute('title', this.#options.buttonTitle)

			button.addEventListener('click', async (event) => {
				try {
					const bboxes = await Promise.all(
						this.#options.sourceIds.map(async (sourceId) => {
							const source = map.getSource<GeoJSONSource>(sourceId)

							if (!source) {
								return bbox(feature(null))
							}

							const data = await source.getData()

							return bbox(data)
						}),
					)

					const minLon = Math.min(...bboxes.map((bbox) => bbox[0]))
					const minLat = Math.min(...bboxes.map((bbox) => bbox[1]))
					const maxLon = Math.max(...bboxes.map((bbox) => bbox[2]))
					const maxLat = Math.max(...bboxes.map((bbox) => bbox[3]))

					const calculatedBbox: [number, number, number, number] = [
						minLon,
						minLat,
						maxLon,
						maxLat,
					]

					// NOTE: Happens when no data exists
					if (calculatedBbox.every((v) => v === Infinity || v === -Infinity)) {
						return
					}

					map.fitBounds(calculatedBbox, this.#options.fitBoundsOptions, {
						originalEvent: event,
					})
				} catch (err) {
					captureException(err)
				}
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
