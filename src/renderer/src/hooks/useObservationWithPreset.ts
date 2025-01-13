import { useMemo } from 'react'
import type { Observation } from '@comapeo/schema'

import { matchPreset } from '../lib/matchPreset'
import { useAllPresets } from './queries/presets'

export function useObservationWithPreset(
	observation: Observation,
	projectId: string,
) {
	const { data: presets = [] } = useAllPresets(projectId)

	const matchedPreset = useMemo(() => {
		if (!observation?.tags) return undefined
		return matchPreset(observation.tags, presets)
	}, [observation?.tags, presets])

	return matchedPreset
}
