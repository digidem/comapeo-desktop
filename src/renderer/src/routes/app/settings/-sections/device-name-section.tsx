import { useOwnDeviceInfo } from '@comapeo/core-react'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { defineMessages, useIntl } from 'react-intl'

import { BLUE_GREY } from '../../../../colors.ts'
import { ButtonBaseLink } from '../../../../components/link.tsx'
import { DeviceIcon } from '../../projects/-shared/device-icon.tsx'

export function DeviceNameSection({
	headingIconSize,
}: {
	headingIconSize: string
}) {
	const intl = useIntl()

	const { data: deviceInfo } = useOwnDeviceInfo()

	return (
		<Stack component="section" direction="column" sx={{ gap: 4 }}>
			<Stack
				component="h2"
				direction="row"
				sx={{ alignItems: 'center', gap: 4, margin: 0 }}
			>
				<DeviceIcon
					aria-hidden
					deviceType={deviceInfo.deviceType}
					size={headingIconSize}
				/>

				<Typography
					variant="body2"
					sx={{ fontWeight: 500, textTransform: 'uppercase' }}
				>
					{intl.formatMessage(m.deviceNameSectionTitle)}
				</Typography>
			</Stack>

			<ButtonBaseLink
				aria-label={intl.formatMessage(m.deviceNameSettingsAccessibleLabel)}
				to="/app/settings/device-name"
				sx={{
					border: `1px solid ${BLUE_GREY}`,
					borderRadius: 2,
					':hover': {
						backgroundColor: (theme) => theme.palette.action.hover,
						transition: (theme) => theme.transitions.create('background-color'),
					},
					':focus-within': {
						backgroundColor: (theme) => theme.palette.action.focus,
						transition: (theme) => theme.transitions.create('background-color'),
					},
				}}
			>
				<Stack
					direction="row"
					sx={{
						alignItems: 'center',
						flex: 1,
						gap: 2,
						justifyContent: 'space-between',
						overflow: 'auto',
						padding: 4,
					}}
				>
					<Stack
						direction="row"
						sx={{ alignItems: 'center', overflow: 'auto' }}
					>
						<Typography
							sx={{
								flex: 1,
								overflow: 'hidden',
								textOverflow: 'ellipsis',
								whiteSpace: 'nowrap',
							}}
						>
							{
								// TODO: What to do when this is undefined?
								deviceInfo.name || ''
							}
						</Typography>
					</Stack>

					<Typography color="primary">
						{intl.formatMessage(m.deviceNameEdit)}
					</Typography>
				</Stack>
			</ButtonBaseLink>
		</Stack>
	)
}

const m = defineMessages({
	deviceNameSectionTitle: {
		id: '$1.routes.app.settings.index.deviceNameSectionTitle',
		defaultMessage: 'Device Name',
		description: 'Section title for device name settings.',
	},
	deviceNameEdit: {
		id: '$1.routes.app.settings.index.deviceNameEdit',
		defaultMessage: 'Edit',
		description: 'Button text for navigating to page to edit device name.',
	},
	deviceNameSettingsAccessibleLabel: {
		id: 'routes.app.settings.index.deviceNameSettingsAccessibleLabel',
		defaultMessage: 'Go to device name settings.',
		description:
			'Accessible label for link item that navigates to device name settings page.',
	},
})
