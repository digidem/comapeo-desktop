export type SelectedFile = {
	name: string
	path: string
}

export type RuntimeApi = {
	getLocale: () => Promise<string>
	updateLocale: (locale: string) => void
	selectFile: (
		extensionFilters?: Array<string>,
	) => Promise<SelectedFile | undefined>
}
