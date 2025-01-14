import { useMemo } from 'react'
import { useManyDocs } from '@comapeo/core-react'
import type { Observation } from '@comapeo/schema'

import { matchPreset } from '../lib/matchPreset'

export function useObservationWithPreset(
	observation: Observation,
	projectId: string,
) {
	const { data: presets = [] } = useManyDocs({
		projectId: projectId || '',
		docType: 'preset',
		includeDeleted: false,
		lang: 'en',
	})

	const matchedPreset = useMemo(() => {
		if (!observation?.tags) return undefined
		return matchPreset(observation.tags, presets)
	}, [observation?.tags, presets])

	return matchedPreset
}
