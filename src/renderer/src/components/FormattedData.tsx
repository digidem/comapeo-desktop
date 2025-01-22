import * as React from 'react'
import type { Preset } from '@comapeo/schema'
import { defineMessages, useIntl } from 'react-intl'

const m = defineMessages({
	observation: {
		// Keep id stable for translations
		id: 'screens.Observation.ObservationView.observation',
		defaultMessage: 'Observation',
		description: 'Default name of observation with no matching preset',
	},
})

// Format the translated preset name, with a fallback to "Observation" if no
// preset is defined
export const FormattedPresetName = ({ preset }: { preset?: Preset }) => {
	const { formatMessage: t } = useIntl()
	const name = preset
		? t({ id: `presets.${preset.docId}.name`, defaultMessage: preset.name })
		: t(m.observation)

	return <React.Fragment>{name}</React.Fragment>
}
