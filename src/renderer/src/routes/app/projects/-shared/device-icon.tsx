import type { MemberApi } from '@comapeo/core'
import Box from '@mui/material/Box'
import { defineMessages, useIntl } from 'react-intl'

import { LIGHT_GREY } from '../../../../colors'
import { Icon } from '../../../../components/icon'
import type { IconName } from '../../../../generated/icons.generated'
import type { DeviceType } from '../../../../lib/comapeo'

export function DeviceIcon({
	deviceType,
	size,
}: {
	deviceType: DeviceType | undefined
	size: string | number
}) {
	const { formatMessage: t } = useIntl()
	return (
		<Box
			display="flex"
			justifyContent="center"
			alignItems="center"
			borderRadius={`calc(${size} * 2)`}
			bgcolor={LIGHT_GREY}
			height={`calc(${size} * 2)`}
			width={`calc(${size} * 2)`}
		>
			<Icon
				titleAccess={t(getDeviceIconTitleMessage(deviceType))}
				name={getIconNameForDeviceType(deviceType)}
				size={size}
			/>
		</Box>
	)
}

function getIconNameForDeviceType(
	deviceType: MemberApi.MemberInfo['deviceType'],
): IconName {
	switch (deviceType) {
		case 'desktop': {
			return 'material-symbols-computer'
		}
		case 'tablet': {
			return 'material-tablet-android'
		}
		case 'mobile': {
			return 'material-phone-android'
		}
		case 'selfHostedServer': {
			return 'material-symbols-encrypted-weight400'
		}
		case 'UNRECOGNIZED':
		case 'device_type_unspecified':
		default: {
			return 'material-question-mark'
		}
	}
}

function getDeviceIconTitleMessage(
	deviceType: MemberApi.MemberInfo['deviceType'],
) {
	switch (deviceType) {
		case 'desktop': {
			return m.deviceTypeDesktop
		}
		case 'tablet': {
			return m.deviceTypeTablet
		}
		case 'mobile': {
			return m.deviceTypeMobile
		}
		case 'selfHostedServer': {
			return m.deviceTypeRemoteArchive
		}
		case 'device_type_unspecified': {
			return m.deviceTypeUnspecified
		}
		case 'UNRECOGNIZED':
		default: {
			return m.deviceTypeUnknown
		}
	}
}

const m = defineMessages({
	deviceTypeMobile: {
		id: 'routes.app.projects.-shared.device-icon.deviceTypeMobile',
		defaultMessage: 'Mobile',
		description:
			'Text indicating that the member is a mobile device (displays when hovering over the icon).',
	},
	deviceTypeDesktop: {
		id: 'routes.app.projects.-shared.device-icon.deviceTypeDesktop',
		defaultMessage: 'Desktop',
		description:
			'Text indicating that the member is a desktop device (displays when hovering over the icon).',
	},
	deviceTypeTablet: {
		id: 'routes.app.projects.-shared.device-icon.deviceTypeTablet',
		defaultMessage: 'Tablet',
		description:
			'Text indicating that the member is a tablet device (displays when hovering over the icon).',
	},
	deviceTypeRemoteArchive: {
		id: 'routes.app.projects.-shared.device-icon.deviceTypeRemoteArchive',
		defaultMessage: 'Remote Archive',
		description:
			'Text indicating that the member is a remote archive (displays when hovering over the icon).',
	},
	deviceTypeUnspecified: {
		id: 'routes.app.projects.-shared.device-icon.deviceTypeUnspecified',
		defaultMessage: 'Unspecified device type',
		description:
			'Text indicating that the member device type is unspecified (displays when hovering over the icon).',
	},
	deviceTypeUnknown: {
		id: 'routes.app.projects.-shared.device-icon.deviceTypeUnknown',
		defaultMessage: 'Unknown device type',
		description:
			'Text indicating that the member device type is unknown (displays when hovering over the icon).',
	},
})
