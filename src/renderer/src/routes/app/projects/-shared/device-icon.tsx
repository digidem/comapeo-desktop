import type { ComponentProps } from 'react'
import type { MemberApi } from '@comapeo/core'
import { defineMessages, useIntl } from 'react-intl'

import { Icon } from '../../../../components/icon.tsx'
import type { IconName } from '../../../../generated/icons.generated.ts'
import type { DeviceType } from '../../../../lib/comapeo.ts'

export function DeviceIcon({
	deviceType,
	...iconProps
}: {
	deviceType: DeviceType | undefined
} & Pick<ComponentProps<typeof Icon>, 'color' | 'htmlColor' | 'size'>) {
	const intl = useIntl()

	return (
		<Icon
			{...iconProps}
			titleAccess={intl.formatMessage(getDeviceIconTitleMessage(deviceType))}
			name={getIconNameForDeviceType(deviceType)}
		/>
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
			return 'material-offline-bolt-outlined'
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
		id: '$1.routes.app.projects.-shared.device-icon.deviceTypeMobile',
		defaultMessage: 'Mobile',
		description:
			'Text indicating that the member is a mobile device (displays when hovering over the icon).',
	},
	deviceTypeDesktop: {
		id: '$1.routes.app.projects.-shared.device-icon.deviceTypeDesktop',
		defaultMessage: 'Desktop',
		description:
			'Text indicating that the member is a desktop device (displays when hovering over the icon).',
	},
	deviceTypeTablet: {
		id: '$1.routes.app.projects.-shared.device-icon.deviceTypeTablet',
		defaultMessage: 'Tablet',
		description:
			'Text indicating that the member is a tablet device (displays when hovering over the icon).',
	},
	deviceTypeRemoteArchive: {
		id: '$1.routes.app.projects.-shared.device-icon.deviceTypeRemoteArchive',
		defaultMessage: 'Remote Archive',
		description:
			'Text indicating that the member is a remote archive (displays when hovering over the icon).',
	},
	deviceTypeUnspecified: {
		id: '$1.routes.app.projects.-shared.device-icon.deviceTypeUnspecified',
		defaultMessage: 'Unspecified device type',
		description:
			'Text indicating that the member device type is unspecified (displays when hovering over the icon).',
	},
	deviceTypeUnknown: {
		id: '$1.routes.app.projects.-shared.device-icon.deviceTypeUnknown',
		defaultMessage: 'Unknown device type',
		description:
			'Text indicating that the member device type is unknown (displays when hovering over the icon).',
	},
})
