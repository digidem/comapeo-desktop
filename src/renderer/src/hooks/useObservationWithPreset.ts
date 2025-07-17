import { useMemo } from 'react'
import { useManyDocs } from '@comapeo/core-react'
import type { Observation } from '@comapeo/schema'
import { useIntl } from 'react-intl'

import { getMatchingPresetForObservation } from '../lib/comapeo'

export function useObservationWithPreset(
	observation: Observation,
	projectId: string,
) {
	const { locale } = useIntl()
	const { data: presets = [] } = useManyDocs({
		projectId: projectId || '',
		docType: 'preset',
		includeDeleted: false,
		lang: locale,
	})

	const matchedPreset = useMemo(() => {
		if (!observation?.tags) return undefined
		return getMatchingPresetForObservation(observation.tags, presets)
	}, [observation?.tags, presets])

	return matchedPreset
}
