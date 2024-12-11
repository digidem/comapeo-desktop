export type RuntimeApi = {
	getLocale: () => Promise<string>
	updateLocale: (locale: string) => void
}
