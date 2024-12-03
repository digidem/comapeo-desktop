import React from 'react'
import Checkbox from '@mui/material/Checkbox'
import { styled } from '@mui/material/styles'
import { defineMessages, useIntl } from 'react-intl'

import { BLACK } from '../../colors'

const m = defineMessages({
	shareDiagnostics: {
		id: 'screens.PrivacyPolicy.shareDiagnostics',
		defaultMessage: 'Share Diagnostic Information',
	},
})

const Container = styled('div')({
	display: 'flex',
	alignItems: 'center',
})

const PermissionText = styled('span')({
	fontSize: 16,
	color: BLACK,
	flex: 1,
})

export const MetricsDiagnosticsPermissionToggle = () => {
	const { formatMessage } = useIntl()
	const [isEnabled, setIsEnabled] = React.useState(() => {
		const savedValue = localStorage.getItem('MetricDiagnosticsPermission')
		return savedValue !== null ? savedValue === 'true' : true
	})

	const togglePermission = () => {
		const newValue = !isEnabled
		setIsEnabled(newValue)
		// TODO replace code once the Metrics and Diagnostics handling code is incorporated
		localStorage.setItem('MetricDiagnosticsPermission', String(newValue))

		console.log('Permission updated:', newValue)
	}

	return (
		<Container>
			<PermissionText>{formatMessage(m.shareDiagnostics)}</PermissionText>
			<Checkbox
				checked={isEnabled}
				onChange={togglePermission}
				color="primary"
			/>
		</Container>
	)
}
