export type RuntimeApi = {
	init: () => void
	getLocale: () => Promise<string>
	updateLocale: (locale: string) => void
}
