import { useClientApi } from '@comapeo/core-react'
import type { MapeoProjectApi } from '@comapeo/ipc'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { BBox } from 'geojson'

/**
 * A mutation that creates a number of random observations near a bounding box
 * around [-72.312023, -10.38787].
 */
export function useCreateTestObservations() {
	const api = useClientApi()
	const queryClient = useQueryClient()

	return useMutation<void, Error, { projectId: string; count?: number }>({
		mutationFn: async ({ projectId, count = 10 }) => {
			const projectApi: MapeoProjectApi = await api.getProject(projectId)
			const [deviceInfo, presets] = await Promise.all([
				api.getDeviceInfo(),
				projectApi.preset.getMany(),
			])

			const centerLon = -72.312023
			const centerLat = -10.38787
			const deltaDeg = 0.1

			const bbox: BBox = [
				centerLon - deltaDeg,
				centerLat - deltaDeg,
				centerLon + deltaDeg,
				centerLat + deltaDeg,
			]

			function randomLonLat(
				bbox: [number, number, number, number],
			): [number, number] {
				const [minLon, minLat, maxLon, maxLat] = bbox
				const lon = Math.random() * (maxLon - minLon) + minLon
				const lat = Math.random() * (maxLat - minLat) + minLat
				return [lon, lat]
			}

			const promises = []
			const notes = deviceInfo.name ? `Created by ${deviceInfo.name}` : null

			for (let i = 0; i < count; i++) {
				const [lon, lat] = randomLonLat(bbox)
				const now = new Date().toISOString()
				const randomPreset = presets.at(
					Math.floor(Math.random() * presets.length),
				)

				const observationValue = {
					schemaName: 'observation' as const,
					lon,
					lat,
					metadata: {
						manualLocation: false,
						position: {
							timestamp: now,
							mocked: false,
							coords: { latitude: lat, longitude: lon },
						},
					},
					tags: { ...randomPreset!.tags, notes },
					attachments: [],
				}

				promises.push(projectApi.observation.create(observationValue))
			}

			await Promise.all(promises)
		},
		onSuccess: (_data, { projectId }) => {
			queryClient.invalidateQueries({ queryKey: ['observations', projectId] })
		},
	})
}
