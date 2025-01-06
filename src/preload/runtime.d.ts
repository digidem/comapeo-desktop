export type RuntimeApi = {
	getLocale: () => Promise<string>
	updateLocale: (locale: string) => void
	selectFile: (extensionFilters?: Array<string>) => Promise<string | undefined>
}
