import React, { useEffect, useRef } from 'react'

import 'maplibre-gl/dist/maplibre-gl.css'

import maplibregl from 'maplibre-gl'

import { useSharedLocationContext } from '../contexts/SharedLocationContext'

export const Map = () => {
	const mapContainerRef = useRef<HTMLDivElement | null>(null)
	const mapRef = useRef<maplibregl.Map | null>(null)
	const { location, isLoading } = useSharedLocationContext()

	useEffect(() => {
		if (!mapContainerRef.current) return
		const map = new maplibregl.Map({
			container: mapContainerRef.current,
			style: 'https://demotiles.maplibre.org/style.json',
			center: [0, 0],
			zoom: 2,
		})

		// not sure if this is necessary. not in the designs.
		map.addControl(
			new maplibregl.ScaleControl({ maxWidth: 100, unit: 'metric' }),
			'bottom-left',
		)

		mapRef.current = map

		return () => {
			map.remove()
		}
	}, [])

	useEffect(() => {
		if (!isLoading && location && mapRef.current) {
			mapRef.current.setCenter([
				location.coords.longitude,
				location.coords.latitude,
			])
			mapRef.current.setZoom(12)
		}
	}, [location, isLoading])

	return <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
}
