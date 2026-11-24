import type { Systeminformation } from 'systeminformation'

export type NetworkInformationReadableFields = Pick<
	NetworkInformation,
	'type' | 'effectiveType' | 'downlink' | 'downlinkMax' | 'rtt' | 'saveData'
>

export type BrowserNetInfo = NetworkInformationReadableFields & {
	online: boolean
}

export function getDisplayableWifiName({
	browserNetInfo,
	wifiConnection,
}: {
	browserNetInfo: BrowserNetInfo
	wifiConnection: Systeminformation.WifiConnectionData
}): string | undefined {
	// NOTE: Issue with systeminformation module on macOS >=15.6 (https://github.com/digidem/comapeo-desktop/issues/378)
	const ssidIsDisplayable =
		wifiConnection.ssid !== '&lt;redacted&gt;' &&
		wifiConnection.ssid !== '<redacted>'

	if (!ssidIsDisplayable) {
		return undefined
	}

	const connectionTypeText = browserNetInfo.effectiveType
		? ` - ${browserNetInfo.effectiveType}`
		: undefined

	return `${wifiConnection.ssid}${connectionTypeText}`
}
