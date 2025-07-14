import { type EditableAppSettings } from '../main/config-store.js'

export type SelectedFile = {
	name: string
	path: string
}

export type RuntimeApi = {
	selectFile: (
		extensionFilters?: Array<string>,
	) => Promise<SelectedFile | undefined>
	getAppInfo: () => { appVersion: string; systemVersion: string }
	openExternalURL: (url: string) => Promise<void>
	getSetting: <K extends keyof EditableAppSettings>(
		key: K,
	) => Promise<EditableAppSettings[K]>
	setSetting: <K extends keyof EditableAppSettings>(
		key: K,
		value: EditableAppSettings[K],
	) => Promise<void>
}
