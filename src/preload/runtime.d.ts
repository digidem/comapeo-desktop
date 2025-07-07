export type SelectedFile = {
	name: string
	path: string
}

export type RuntimeApi = {
	getLocale: () => Promise<string>
	updateLocale: (locale: string) => void
	getDiagnosticsEnabled: () => Promise<boolean>
	setDiagnosticsEnabled: (enable: boolean) => Promise<void>
	selectFile: (
		extensionFilters?: Array<string>,
	) => Promise<SelectedFile | undefined>
}
